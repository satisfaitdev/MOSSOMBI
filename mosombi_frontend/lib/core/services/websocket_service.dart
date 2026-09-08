import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:latlong2/latlong.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

class WebSocketService {
  WebSocketService._();
  static final instance = WebSocketService._();

  WebSocketChannel? _channel;
  StreamController<LatLng>? _driverLocationStream;
  Timer? _mockTimer;
  bool _useMock = false;

  String get _wsUrl => dotenv.env['WS_URL'] ?? 'ws://localhost:3000/ws/live';

  /// Se connecte au WebSocket backend pour recevoir un stream de coordonnées GPS.
  /// Fallback sur le mock si la connexion échoue.
  Stream<LatLng> subscribeToDriverLocation(String driverId, LatLng startPos, LatLng destPos) {
    _driverLocationStream?.close();
    _mockTimer?.cancel();
    _driverLocationStream = StreamController<LatLng>.broadcast();

    try {
      _channel?.sink.close();
      _channel = WebSocketChannel.connect(Uri.parse('$_wsUrl?driverId=$driverId'));
      _channel!.sink.add(jsonEncode({'action': 'subscribe', 'topic': 'driver_$driverId'}));

      _channel!.stream.listen((message) {
        try {
          final data = jsonDecode(message as String) as Map<String, dynamic>;
          final lat = double.tryParse(data['lat']?.toString() ?? '') ?? startPos.latitude;
          final lng = double.tryParse(data['lng']?.toString() ?? '') ?? startPos.longitude;
          _driverLocationStream?.add(LatLng(lat, lng));
          if (kDebugMode) {
            print("[WebSocket] Reçu pour le chauffeur $driverId : Lat=$lat, Lng=$lng");
          }
        } catch (e) {
          debugPrint('WebSocket parse error: $e');
        }
      }, onError: (error) {
        debugPrint('WebSocket error, falling back to mock: $error');
        _useMock = true;
        _startMockStream(driverId, startPos, destPos);
      }, onDone: () {
        debugPrint('WebSocket closed');
      });
    } catch (e) {
      debugPrint('WebSocket connection failed, using mock fallback: $e');
      _useMock = true;
      _startMockStream(driverId, startPos, destPos);
    }

    if (_useMock) {
      _startMockStream(driverId, startPos, destPos);
    }

    return _driverLocationStream!.stream;
  }

  void _startMockStream(String driverId, LatLng startPos, LatLng destPos) {
    _mockTimer?.cancel();
    double currentLat = startPos.latitude;
    double currentLng = startPos.longitude;

    _mockTimer = Timer.periodic(const Duration(milliseconds: 1000), (timer) {
      if (!(_driverLocationStream?.hasListener ?? false)) {
        timer.cancel();
        return;
      }
      currentLat += (destPos.latitude - currentLat) * 0.08;
      currentLng += (destPos.longitude - currentLng) * 0.08;
      _driverLocationStream?.add(LatLng(currentLat, currentLng));
      if (kDebugMode) {
        print("[WebSocket Mock] Reçu pour le chauffeur $driverId : Lat=${currentLat.toStringAsFixed(5)}, Lng=${currentLng.toStringAsFixed(5)}");
      }
    });
  }

  void disconnect() {
    _mockTimer?.cancel();
    _driverLocationStream?.close();
    _channel?.sink.close();
  }
}

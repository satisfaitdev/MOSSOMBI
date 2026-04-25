import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:latlong2/latlong.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

class WebSocketService {
  WebSocketService._();
  static final instance = WebSocketService._();

  // En production réelle, on utiliserait :
  // late WebSocketChannel _channel;
  
  StreamController<LatLng>? _driverLocationStream;
  Timer? _mockTimer;

  /// Simule la connexion via WebSocket au backend pour recevoir un stream de coordonnées GPS.
  Stream<LatLng> subscribeToDriverLocation(String driverId, LatLng startPos, LatLng destPos) {
    _driverLocationStream?.close();
    _mockTimer?.cancel();
    _driverLocationStream = StreamController<LatLng>.broadcast();

    double currentLat = startPos.latitude;
    double currentLng = startPos.longitude;
    
    // TODO: Implémentation réelle avec NestJS :
    // _channel = WebSocketChannel.connect(Uri.parse('wss://api.mossombi.com/ws/live'));
    // _channel.sink.add('{"action": "subscribe", "topic": "driver_$driverId"}');
    // _channel.stream.listen((message) {
    //    final data = jsonDecode(message);
    //    _driverLocationStream?.add(LatLng(data['lat'], data['lng']));
    // });

    // Stream Mock (Interpolation à ~5% de la distance par seconde)
    _mockTimer = Timer.periodic(const Duration(milliseconds: 1000), (timer) {
      if (!(_driverLocationStream?.hasListener ?? false)) {
        timer.cancel();
        return;
      }
      
      currentLat += (destPos.latitude - currentLat) * 0.08;
      currentLng += (destPos.longitude - currentLng) * 0.08;
      
      _driverLocationStream?.add(LatLng(currentLat, currentLng));
      // Log réseau
      if (kDebugMode) {
        print("📡 [WebSocket] Reçu pour le chauffeur $driverId : Lat=${currentLat.toStringAsFixed(5)}, Lng=${currentLng.toStringAsFixed(5)}");
      }
    });

    return _driverLocationStream!.stream;
  }

  void disconnect() {
    _mockTimer?.cancel();
    _driverLocationStream?.close();
    // _channel.sink.close();
  }
}

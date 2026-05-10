import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:mosombi_frontend/core/network/api_client.dart';

class LocationService {
  static final LocationService _instance = LocationService._internal();
  factory LocationService() => _instance;
  LocationService._internal();

  Timer? _pingTimer;
  bool _isTracking = false;
  final ApiClient _apiClient = ApiClient();

  /// Starts the background GPS tracking ping.
  /// Should be called when a driver goes 'Online' or accepts a delivery.
  void startTracking({required String driverId}) {
    if (_isTracking) return;
    _isTracking = true;
    
    // Simulate pinging every 30 seconds
    _pingTimer = Timer.periodic(const Duration(seconds: 30), (timer) {
      _pingLocation(driverId);
    });
    
    debugPrint('Background location tracking started for driver: $driverId');
  }

  /// Stops the background GPS tracking.
  void stopTracking() {
    _pingTimer?.cancel();
    _pingTimer = null;
    _isTracking = false;
    debugPrint('Background location tracking stopped.');
  }

  Future<void> _pingLocation(String driverId) async {
    // In a real implementation, we would use geolocator to get the current position.
    // final position = await Geolocator.getCurrentPosition();
    
    // Simulated coordinates
    final mockLat = -4.2693 + (DateTime.now().second % 10) * 0.0001;
    final mockLng = 15.2714 + (DateTime.now().second % 10) * 0.0001;

    try {
      // Pinging the backend with the new coordinates
      // This allows the tracking screen of the customer to update in real-time
      await _apiClient.dio.post('/deliveries/ping', data: {
        'driver_id': driverId,
        'lat': mockLat,
        'lng': mockLng,
        'timestamp': DateTime.now().toIso8601String(),
      });
      debugPrint('Location pinged successfully: $mockLat, $mockLng');
    } catch (e) {
      debugPrint('Error pinging location: $e');
    }
  }
}

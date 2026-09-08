import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import 'package:mosombi_frontend/core/network/api_client.dart';

enum DriverStatus { offline, online, enRoute, inTransit }

class RideRequest {
  final String id;
  final String pickupAddress;
  final String dropoffAddress;
  final double pickupLat;
  final double pickupLng;
  final double dropoffLat;
  final double dropoffLng;
  final double estimatedPrice;
  final double distanceM;
  final String status;
  final String createdAt;

  RideRequest({
    required this.id,
    required this.pickupAddress,
    required this.dropoffAddress,
    required this.pickupLat,
    required this.pickupLng,
    required this.dropoffLat,
    required this.dropoffLng,
    required this.estimatedPrice,
    this.distanceM = 0,
    this.status = 'requested',
    required this.createdAt,
  });

  factory RideRequest.fromJson(Map<String, dynamic> json) {
    return RideRequest(
      id: json['id']?.toString() ?? '',
      pickupAddress: json['pickup_address']?.toString() ?? '',
      dropoffAddress: json['dropoff_address']?.toString() ?? '',
      pickupLat: double.tryParse(json['pickup_lat']?.toString() ?? '0') ?? 0,
      pickupLng: double.tryParse(json['pickup_lng']?.toString() ?? '0') ?? 0,
      dropoffLat: double.tryParse(json['dropoff_lat']?.toString() ?? '0') ?? 0,
      dropoffLng: double.tryParse(json['dropoff_lng']?.toString() ?? '0') ?? 0,
      estimatedPrice: double.tryParse(json['estimated_price']?.toString() ?? '0') ?? 0,
      distanceM: double.tryParse(json['distance_m']?.toString() ?? '0') ?? 0,
      status: json['status']?.toString() ?? 'requested',
      createdAt: json['created_at']?.toString() ?? '',
    );
  }
}

class DriverRide {
  final String id;
  final String pickupAddress;
  final String dropoffAddress;
  final double pickupLat;
  final double pickupLng;
  final double dropoffLat;
  final double dropoffLng;
  final double finalPrice;
  final double estimatedPrice;
  final String status;
  final String createdAt;
  final String updatedAt;

  DriverRide({
    required this.id,
    required this.pickupAddress,
    required this.dropoffAddress,
    required this.pickupLat,
    required this.pickupLng,
    required this.dropoffLat,
    required this.dropoffLng,
    this.finalPrice = 0,
    this.estimatedPrice = 0,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  factory DriverRide.fromJson(Map<String, dynamic> json) {
    return DriverRide(
      id: json['id']?.toString() ?? '',
      pickupAddress: json['pickup_address']?.toString() ?? '',
      dropoffAddress: json['dropoff_address']?.toString() ?? '',
      pickupLat: double.tryParse(json['pickup_lat']?.toString() ?? '0') ?? 0,
      pickupLng: double.tryParse(json['pickup_lng']?.toString() ?? '0') ?? 0,
      dropoffLat: double.tryParse(json['dropoff_lat']?.toString() ?? '0') ?? 0,
      dropoffLng: double.tryParse(json['dropoff_lng']?.toString() ?? '0') ?? 0,
      finalPrice: double.tryParse(json['final_price']?.toString() ?? '0') ?? 0,
      estimatedPrice: double.tryParse(json['estimated_price']?.toString() ?? '0') ?? 0,
      status: json['status']?.toString() ?? '',
      createdAt: json['created_at']?.toString() ?? '',
      updatedAt: json['updated_at']?.toString() ?? '',
    );
  }
}

class TaxiDriverProvider extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();

  DriverStatus _status = DriverStatus.offline;
  LatLng _currentLocation = const LatLng(-4.266133, 15.283182);
  List<RideRequest> _pendingRequests = [];
  DriverRide? _activeRide;
  List<DriverRide> _rideHistory = [];
  double _earningsToday = 0;
  double _totalEarnings = 0;
  int _totalRides = 0;
  int _etaMinutes = 0;
  Timer? _pollingTimer;

  DriverStatus get status => _status;
  LatLng get currentLocation => _currentLocation;
  List<RideRequest> get pendingRequests => _pendingRequests;
  DriverRide? get activeRide => _activeRide;
  List<DriverRide> get rideHistory => _rideHistory;
  double get earningsToday => _earningsToday;
  double get totalEarnings => _totalEarnings;
  int get totalRides => _totalRides;
  int get etaMinutes => _etaMinutes;
  bool get isOnline => _status != DriverStatus.offline;

  void setLocation(LatLng loc) {
    _currentLocation = loc;
    _updateLocation();
  }

  Future<void> _updateLocation() async {
    try {
      await _apiClient.dio.post('/live-locations', data: {
        'lat': _currentLocation.latitude,
        'lng': _currentLocation.longitude,
        'service_id': 'taxi',
        'is_visible': isOnline,
        'is_busy': _activeRide != null,
      });
    } catch (_) {}
  }

  Future<void> goOnline() async {
    _status = DriverStatus.online;
    notifyListeners();
    await _updateLocation();
    _startPolling();
  }

  Future<void> goOffline() async {
    _status = DriverStatus.offline;
    _pollingTimer?.cancel();
    _pendingRequests.clear();
    notifyListeners();
    try {
      await _apiClient.dio.post('/live-locations', data: {
        'lat': _currentLocation.latitude,
        'lng': _currentLocation.longitude,
        'service_id': 'taxi',
        'is_visible': false,
        'is_busy': false,
      });
    } catch (_) {}
  }

  void _startPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      if (_status == DriverStatus.offline) return;
      fetchRequests();
    });
    fetchRequests();
  }

  Future<void> fetchRequests() async {
    try {
      final response = await _apiClient.dio.get('/taxi/driver/requests');
      if (response.statusCode == 200 && response.data['success'] == true) {
        final List data = response.data['data'] ?? [];
        _pendingRequests = data.map((j) => RideRequest.fromJson(j as Map<String, dynamic>)).toList();
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<bool> acceptRequest(String rideId) async {
    try {
      final response = await _apiClient.dio.post('/taxi/driver/accept', data: {'ride_id': rideId});
      if (response.statusCode == 200 && response.data['success'] == true) {
        _activeRide = DriverRide.fromJson(response.data['data'] as Map<String, dynamic>);
        _pendingRequests.removeWhere((r) => r.id == rideId);
        _status = DriverStatus.enRoute;
        notifyListeners();
        return true;
      }
    } catch (_) {}
    return false;
  }

  Future<bool> rejectRequest(String rideId) async {
    try {
      final response = await _apiClient.dio.post('/taxi/driver/reject', data: {'ride_id': rideId});
      if (response.statusCode == 200 && response.data['success'] == true) {
        _pendingRequests.removeWhere((r) => r.id == rideId);
        notifyListeners();
        return true;
      }
    } catch (_) {}
    return false;
  }

  Future<bool> startRide(String rideId) async {
    try {
      final response = await _apiClient.dio.post('/taxi/driver/start', data: {'ride_id': rideId});
      if (response.statusCode == 200 && response.data['success'] == true) {
        _activeRide = DriverRide.fromJson(response.data['data'] as Map<String, dynamic>);
        _status = DriverStatus.inTransit;
        notifyListeners();
        return true;
      }
    } catch (_) {}
    return false;
  }

  Future<bool> completeRide(String rideId) async {
    try {
      final response = await _apiClient.dio.post('/taxi/driver/complete', data: {'ride_id': rideId});
      if (response.statusCode == 200 && response.data['success'] == true) {
        _rideHistory.insert(0, _activeRide!);
        _activeRide = null;
        _status = DriverStatus.online;
        notifyListeners();
        fetchEarnings();
        return true;
      }
    } catch (_) {}
    return false;
  }

  Future<void> fetchEarnings() async {
    try {
      final response = await _apiClient.dio.get('/taxi/driver/earnings');
      if (response.statusCode == 200 && response.data['success'] == true) {
        final d = response.data['data'] as Map<String, dynamic>;
        _earningsToday = double.tryParse(d['today']?.toString() ?? '0') ?? 0;
        _totalEarnings = double.tryParse(d['total']?.toString() ?? '0') ?? 0;
        _totalRides = int.tryParse(d['ride_count']?.toString() ?? '0') ?? 0;
        final List recent = d['recent_rides'] ?? [];
        _rideHistory = recent.map((j) => DriverRide.fromJson(j as Map<String, dynamic>)).toList();
        notifyListeners();
      }
    } catch (_) {}
  }

  void setEta(int minutes) {
    _etaMinutes = minutes;
    notifyListeners();
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }
}

import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:mosombi_frontend/core/services/ride_notification_service.dart';
import 'package:mosombi_frontend/core/services/websocket_service.dart';
import 'package:mosombi_frontend/core/network/api_client.dart';

enum RideStatus { idle, configuring, searching, waitingAcceptance, driverEnRoute, arrived, inTransit, completed }
enum RideType { classic, shared }

class DriverInfo {
  final String id;
  final String name;
  final String carModel;
  final String licensePlate;
  final double rating;
  LatLng position;
  final bool isAvailable;

  DriverInfo({
    required this.id,
    required this.name,
    required this.carModel,
    required this.licensePlate,
    required this.rating,
    required this.position,
    this.isAvailable = true,
  });
}

class TransportProvider extends ChangeNotifier {
  // --- Ride Coordinates ---
  LatLng? _currentLocation;
  LatLng? _pickupLocation;
  LatLng? _dropoffLocation;
  String _pickupAddress = "Position Actuelle";
  String _dropoffAddress = "";

  // --- Ride Preferences ---
  RideType _rideType = RideType.classic;
  bool _hasAC = false;
  bool _forSomeoneElse = false;
  bool _scheduleForLater = false;
  DateTime? _scheduledTime;
  String _noteToDriver = "";

  // --- State & Pricing ---
  double _estimatedPrice = 0.0;
  RideStatus _status = RideStatus.idle;
  int _etaMinutes = 0;
  int _lastEta = 0;

  // --- Driver Engine ---
  final List<DriverInfo> _allDrivers = [];
  DriverInfo? _assignedDriver;
  Timer? _trackingTimer;
  Timer? _simulationTimer;
  StreamSubscription<LatLng>? _wsSubscription;

  // --- Getters ---
  LatLng? get currentLocation => _currentLocation;
  LatLng? get pickupLocation => _pickupLocation;
  LatLng? get dropoffLocation => _dropoffLocation;
  String get pickupAddress => _pickupAddress;
  String get dropoffAddress => _dropoffAddress;

  RideType get rideType => _rideType;
  bool get hasAC => _hasAC;
  bool get forSomeoneElse => _forSomeoneElse;
  bool get scheduleForLater => _scheduleForLater;
  DateTime? get scheduledTime => _scheduledTime;
  String get noteToDriver => _noteToDriver;

  double get estimatedPrice => _estimatedPrice;
  RideStatus get status => _status;
  int get etaMinutes => _etaMinutes;

  List<DriverInfo> get availableDrivers => _allDrivers.where((d) => d.isAvailable).toList();
  DriverInfo? get assignedDriver => _assignedDriver;

  final ApiClient _apiClient = ApiClient();

  TransportProvider() {
    _initLocation();
  }

  Future<void> _initLocation() async {
    try {
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      ).timeout(const Duration(seconds: 10));
      _currentLocation = LatLng(pos.latitude, pos.longitude);
      _pickupLocation = _currentLocation;
    } catch (e) {
      debugPrint('Geolocator.getCurrentPosition error: $e');
      try {
        final lastPos = await Geolocator.getLastKnownPosition();
        if (lastPos != null) {
          _currentLocation = LatLng(lastPos.latitude, lastPos.longitude);
          _pickupLocation = _currentLocation;
        }
      } catch (e2) {
        debugPrint('Geolocator.getLastKnownPosition also failed: $e2');
      }
    }
    notifyListeners();
    if (_currentLocation != null) _fetchNearbyDrivers();
  }

  Future<void> _fetchNearbyDrivers() async {
    if (_currentLocation == null) return;
    try {
      final response = await _apiClient.dio.get('/taxi/nearby-drivers', queryParameters: {
        'lat': _currentLocation!.latitude,
        'lng': _currentLocation!.longitude,
      });
      if (response.statusCode == 200 && response.data['success'] == true) {
        final List drivers = response.data['data'] ?? [];
        _allDrivers.clear();
        for (var d in drivers) {
          _allDrivers.add(DriverInfo(
            id: d['id']?.toString() ?? '',
            name: d['name']?.toString() ?? 'Chauffeur',
            carModel: d['car_model']?.toString() ?? '',
            licensePlate: d['license_plate']?.toString() ?? '',
            rating: double.tryParse(d['rating']?.toString() ?? '4.5') ?? 4.5,
            position: LatLng(
              double.tryParse(d['latitude']?.toString() ?? '0') ?? _currentLocation!.latitude,
              double.tryParse(d['longitude']?.toString() ?? '0') ?? _currentLocation!.longitude,
            ),
            isAvailable: d['is_available'] as bool? ?? true,
          ));
        }
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error fetching nearby drivers: $e');
    }
  }

  // --- Setup Ride ---
  void selectDropoff(LatLng loc, String address) {
    _dropoffLocation = loc;
    _dropoffAddress = address;
    _calculatePrice();
    _status = RideStatus.configuring;
    notifyListeners();
  }

  void setRideType(RideType type) {
    _rideType = type;
    _calculatePrice();
    notifyListeners();
  }

  void toggleAC(bool val) {
    _hasAC = val;
    _calculatePrice();
    notifyListeners();
  }

  void toggleForSomeoneElse(bool val) {
    _forSomeoneElse = val;
    notifyListeners();
  }

  void toggleSchedule(bool val) {
    _scheduleForLater = val;
    notifyListeners();
  }

  void setNote(String note) {
    _noteToDriver = note;
    notifyListeners(); // Note: usually don't notify on every keystroke in real app, but ok here
  }

  void _calculatePrice() {
    if (_dropoffLocation == null || _pickupLocation == null) return;
    final distanceKm = const Distance().as(LengthUnit.Kilometer, _pickupLocation!, _dropoffLocation!);
    
    // Base Mossombi
    double base = 500.0;
    double perKm = 250.0;
    
    if (_rideType == RideType.shared) {
      base = 300.0;
      perKm = 150.0;
    }
    
    double total = base + (distanceKm * perKm);
    if (_hasAC) total += 500; // Option confort
    
    if (total < 1000 && _rideType == RideType.classic) total = 1000;
    if (total < 700 && _rideType == RideType.shared) total = 700;
    
    _estimatedPrice = total;
  }

  // --- Flow Engine ---
  void confirmRide() {
    if (_pickupLocation == null || _dropoffLocation == null) return;
    
    _status = RideStatus.searching;
    RideNotificationService.showRideNotification(RideStatus.searching);
    notifyListeners();

    _apiClient.dio.post('/taxi/request', data: {
      'pickup_lat': _pickupLocation?.latitude ?? 0,
      'pickup_lng': _pickupLocation?.longitude ?? 0,
      'dropoff_lat': _dropoffLocation!.latitude,
      'dropoff_lng': _dropoffLocation!.longitude,
      'ride_type': _rideType == RideType.shared ? 'shared' : 'classic',
      'has_ac': _hasAC,
    }).then((response) {
      if (response.statusCode == 200 && response.data['success'] == true) {
        _matchNearestDriver();
      }
    }).catchError((e) {
      debugPrint('Error confirming ride: $e');
      _status = RideStatus.idle;
      notifyListeners();
    });
  }

  void _matchNearestDriver() {
    _status = RideStatus.waitingAcceptance;
    notifyListeners();

    _apiClient.dio.post('/taxi/assign', data: {
      'lat': _pickupLocation?.latitude ?? 0,
      'lng': _pickupLocation?.longitude ?? 0,
    }).then((response) {
      if (response.statusCode == 200 && response.data['success'] == true) {
        final driverData = response.data['data']?['driver'] ?? response.data['driver'];
        if (driverData != null) {
          _assignedDriver = DriverInfo(
            id: driverData['id']?.toString() ?? '',
            name: driverData['name']?.toString() ?? 'Chauffeur',
            carModel: driverData['car_model']?.toString() ?? '',
            licensePlate: driverData['license_plate']?.toString() ?? '',
            rating: double.tryParse(driverData['rating']?.toString() ?? '4.5') ?? 4.5,
            position: LatLng(
              double.tryParse(driverData['latitude']?.toString() ?? '0') ?? _pickupLocation!.latitude,
              double.tryParse(driverData['longitude']?.toString() ?? '0') ?? _pickupLocation!.longitude,
            ),
          );
          RideNotificationService.showRideNotification(RideStatus.waitingAcceptance, driverName: _assignedDriver?.name ?? '');
          _driverAcceptedRide();
        }
      }
    }).catchError((e) {
      debugPrint('Error assigning driver: $e');
      _status = RideStatus.idle;
      notifyListeners();
    });
  }

  void _driverAcceptedRide() {
    _status = RideStatus.driverEnRoute;
    _etaMinutes = 5;
    RideNotificationService.showRideNotification(RideStatus.driverEnRoute, driverName: _assignedDriver?.name ?? '', eta: _etaMinutes);
    notifyListeners();

    _startLiveTracking();
  }

  void _startLiveTracking() {
    if (_pickupLocation == null) return;
    _trackingTimer?.cancel();
    _wsSubscription?.cancel();
    
    final dest = _pickupLocation!;
    final start = _assignedDriver!.position;
    
    _wsSubscription = WebSocketService.instance
        .subscribeToDriverLocation(_assignedDriver!.id, start, dest)
        .listen((newLocation) {
      if (_status != RideStatus.driverEnRoute || _assignedDriver == null) {
        _wsSubscription?.cancel();
        return;
      }
      
      _assignedDriver!.position = newLocation;
      
      final distMeters = const Distance().as(LengthUnit.Meter, newLocation, dest);
      if (distMeters < 20) {
        _status = RideStatus.arrived;
        RideNotificationService.showRideNotification(RideStatus.arrived, driverName: _assignedDriver?.name ?? '');
        _wsSubscription?.cancel();
      } else {
        _etaMinutes = max(1, (distMeters / 150).ceil());
        if (_etaMinutes % 2 == 0) {
          RideNotificationService.showRideNotification(RideStatus.driverEnRoute, driverName: _assignedDriver?.name ?? '', eta: _etaMinutes);
        }
      }
      notifyListeners();
    });
  }

  void startTrip() {
    if (_dropoffLocation == null || _currentLocation == null) return;
    _status = RideStatus.inTransit;
    _etaMinutes = max(1, const Distance().as(LengthUnit.Meter, _currentLocation!, _dropoffLocation!) ~/ 400);
    RideNotificationService.showRideNotification(RideStatus.inTransit, eta: _etaMinutes);
    notifyListeners();

    _trackingTimer?.cancel();
    _wsSubscription?.cancel();
    
    _wsSubscription = WebSocketService.instance
        .subscribeToDriverLocation('ride_tracking', _currentLocation!, _dropoffLocation!)
        .listen((newLocation) {
      if (_status != RideStatus.inTransit) {
        _wsSubscription?.cancel();
        return;
      }

      _currentLocation = newLocation;
      _assignedDriver?.position = _currentLocation!;

      final distMeters = const Distance().as(LengthUnit.Meter, _currentLocation!, _dropoffLocation!);
      if (distMeters < 30) {
        _status = RideStatus.completed;
        RideNotificationService.showRideNotification(RideStatus.completed);
        _wsSubscription?.cancel();
      } else {
        _etaMinutes = max(1, (distMeters / 400).ceil());
        if (_etaMinutes != _lastEta) {
          _lastEta = _etaMinutes;
          RideNotificationService.showRideNotification(RideStatus.inTransit, eta: _etaMinutes);
        }
      }
      notifyListeners();
    });
  }

  void cancelRide() {
    _simulationTimer?.cancel();
    _trackingTimer?.cancel();
    _wsSubscription?.cancel();
    _status = RideStatus.idle;
    _assignedDriver = null;
    _dropoffLocation = null;
    _dropoffAddress = "";
    _estimatedPrice = 0.0;
    RideNotificationService.cancelRideNotification();
    notifyListeners();
  }

  @override
  void dispose() {
    _simulationTimer?.cancel();
    _trackingTimer?.cancel();
    _wsSubscription?.cancel();
    super.dispose();
  }
}

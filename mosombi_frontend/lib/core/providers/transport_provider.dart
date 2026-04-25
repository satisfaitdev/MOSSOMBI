import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import 'package:mosombi_frontend/core/services/ride_notification_service.dart';
import 'package:mosombi_frontend/core/services/websocket_service.dart';

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
  LatLng _currentLocation = const LatLng(-4.266133, 15.283182); // Brazzaville par défaut
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
  LatLng get currentLocation => _currentLocation;
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

  TransportProvider() {
    _pickupLocation = _currentLocation;
    _generateMockDrivers();
  }

  void _generateMockDrivers() {
    final random = Random();
    _allDrivers.addAll([
      DriverInfo(id: 'd1', name: 'Patrick M.', carModel: 'Toyota Yaris (Blanche)', licensePlate: '1234 AB 5', rating: 4.8, position: LatLng(_currentLocation.latitude + (random.nextDouble() * 0.01 - 0.005), _currentLocation.longitude + (random.nextDouble() * 0.01 - 0.005))),
      DriverInfo(id: 'd2', name: 'Armel B.', carModel: 'Hyundai Elantra (Grise)', licensePlate: '9876 CD 4', rating: 4.9, position: LatLng(_currentLocation.latitude + (random.nextDouble() * 0.01 - 0.005), _currentLocation.longitude + (random.nextDouble() * 0.01 - 0.005))),
      DriverInfo(id: 'd3', name: 'Julie N.', carModel: 'Kia Rio (Noire)', licensePlate: '5544 EF 1', rating: 5.0, position: LatLng(_currentLocation.latitude + (random.nextDouble() * 0.01 - 0.005), _currentLocation.longitude + (random.nextDouble() * 0.01 - 0.005))),
      DriverInfo(id: 'd4', name: 'Derrick', carModel: 'Peugeot 208', licensePlate: '1122 GH 2', rating: 4.5, isAvailable: false, position: LatLng(_currentLocation.latitude + 0.02, _currentLocation.longitude + 0.02)),
    ]);
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
    if (_dropoffLocation == null) return;
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

    _simulationTimer = Timer(const Duration(seconds: 3), () {
      _matchNearestDriver();
    });
  }

  void _matchNearestDriver() {
    _status = RideStatus.waitingAcceptance;
    notifyListeners();

    // Trouver le plus proche
    final dist = const Distance();
    DriverInfo? closest;
    double minD = double.infinity;

    for (var d in availableDrivers) {
      double dKm = dist.as(LengthUnit.Meter, _pickupLocation!, d.position);
      if (dKm < minD) {
        minD = dKm;
        closest = d;
      }
    }

    _assignedDriver = closest;

    _simulationTimer = Timer(const Duration(seconds: 4), () {
      if (_status == RideStatus.waitingAcceptance) {
        RideNotificationService.showRideNotification(RideStatus.waitingAcceptance, driverName: _assignedDriver?.name ?? '');
        _driverAcceptedRide();
      }
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
    if (_dropoffLocation == null) return;
    _status = RideStatus.inTransit;
    _etaMinutes = max(1, const Distance().as(LengthUnit.Meter, _currentLocation, _dropoffLocation!) ~/ 400);
    RideNotificationService.showRideNotification(RideStatus.inTransit, eta: _etaMinutes);
    notifyListeners();

    _trackingTimer?.cancel();
    _wsSubscription?.cancel();
    
    _wsSubscription = WebSocketService.instance
        .subscribeToDriverLocation('ride_tracking', _currentLocation, _dropoffLocation!)
        .listen((newLocation) {
      if (_status != RideStatus.inTransit) {
        _wsSubscription?.cancel();
        return;
      }

      _currentLocation = newLocation;
      _assignedDriver?.position = _currentLocation;

      final distMeters = const Distance().as(LengthUnit.Meter, _currentLocation, _dropoffLocation!);
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

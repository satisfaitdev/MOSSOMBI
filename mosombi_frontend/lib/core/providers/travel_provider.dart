import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:mosombi_frontend/core/network/api_client.dart';

class BusLine {
  final String id;
  final String agency;
  final String departureCity;
  final String destinationCity;
  final String departureTime;
  final String arrivalTime;
  final double price;
  final int totalSeats;
  final int availableSeats;
  final bool isActive;

  BusLine({
    required this.id, this.agency = '', this.departureCity = '', this.destinationCity = '',
    this.departureTime = '', this.arrivalTime = '', this.price = 0,
    this.totalSeats = 40, this.availableSeats = 40, this.isActive = true,
  });

  factory BusLine.fromJson(Map<String, dynamic> json) {
    return BusLine(
      id: json['id']?.toString() ?? '',
      agency: json['agency']?.toString() ?? '',
      departureCity: json['departure_city']?.toString() ?? '',
      destinationCity: json['destination_city']?.toString() ?? '',
      departureTime: json['departure_time']?.toString() ?? '',
      arrivalTime: json['arrival_time']?.toString() ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0,
      totalSeats: (json['total_seats'] as num?)?.toInt() ?? 40,
      availableSeats: (json['available_seats'] as num?)?.toInt() ?? 40,
      isActive: json['is_active'] as bool? ?? true,
    );
  }
}

class CarpoolListing {
  final String id;
  final String driverUserId;
  final String departureCity;
  final String destinationCity;
  final String departureDate;
  final String departureTime;
  final double price;
  final int seatsAvailable;
  final String vehicleInfo;
  final String notes;
  final String status;

  CarpoolListing({
    required this.id, this.driverUserId = '', this.departureCity = '', this.destinationCity = '',
    this.departureDate = '', this.departureTime = '', this.price = 0,
    this.seatsAvailable = 1, this.vehicleInfo = '', this.notes = '', this.status = 'active',
  });

  factory CarpoolListing.fromJson(Map<String, dynamic> json) {
    return CarpoolListing(
      id: json['id']?.toString() ?? '',
      driverUserId: json['driver_user_id']?.toString() ?? '',
      departureCity: json['departure_city']?.toString() ?? '',
      destinationCity: json['destination_city']?.toString() ?? '',
      departureDate: json['departure_date']?.toString() ?? '',
      departureTime: json['departure_time']?.toString() ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0,
      seatsAvailable: (json['seats_available'] as num?)?.toInt() ?? 1,
      vehicleInfo: json['vehicle_info']?.toString() ?? '',
      notes: json['notes']?.toString() ?? '',
      status: json['status']?.toString() ?? 'active',
    );
  }
}

class Vehicle {
  final String id;
  final String vehicleName;
  final String vehicleType;
  final String transmission;
  final int seats;
  final double pricePerDay;
  final String locationCity;
  final bool withDriverAvailable;
  final String imageUrl;
  final bool isAvailable;

  Vehicle({
    required this.id, this.vehicleName = '', this.vehicleType = '', this.transmission = 'manual',
    this.seats = 5, this.pricePerDay = 0, this.locationCity = '',
    this.withDriverAvailable = false, this.imageUrl = '', this.isAvailable = true,
  });

  factory Vehicle.fromJson(Map<String, dynamic> json) {
    return Vehicle(
      id: json['id']?.toString() ?? '',
      vehicleName: json['vehicle_name']?.toString() ?? '',
      vehicleType: json['vehicle_type']?.toString() ?? '',
      transmission: json['transmission']?.toString() ?? 'manual',
      seats: (json['seats'] as num?)?.toInt() ?? 5,
      pricePerDay: (json['price_per_day'] as num?)?.toDouble() ?? 0,
      locationCity: json['location_city']?.toString() ?? '',
      withDriverAvailable: json['with_driver_available'] as bool? ?? false,
      imageUrl: json['image_url']?.toString() ?? '',
      isAvailable: json['is_available'] as bool? ?? true,
    );
  }
}

class TouristSite {
  final String id;
  final String name;
  final String city;
  final String description;
  final String category;
  final double? latitude;
  final double? longitude;
  final String imageUrl;
  final String rating;
  final double entryFee;

  TouristSite({
    required this.id, this.name = '', this.city = '', this.description = '',
    this.category = 'nature', this.latitude, this.longitude,
    this.imageUrl = '', this.rating = '4.5', this.entryFee = 0,
  });

  factory TouristSite.fromJson(Map<String, dynamic> json) {
    return TouristSite(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      city: json['city']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      category: json['category']?.toString() ?? 'nature',
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      imageUrl: json['image_url']?.toString() ?? '',
      rating: (json['rating'] as num?)?.toStringAsFixed(1) ?? '4.5',
      entryFee: (json['entry_fee'] as num?)?.toDouble() ?? 0,
    );
  }
}

class TourGuide {
  final String id;
  final String name;
  final String city;
  final String phone;
  final String email;
  final String rating;
  final double pricePerHour;
  final bool isAvailable;
  final String avatarUrl;

  TourGuide({
    required this.id, this.name = '', this.city = '', this.phone = '', this.email = '',
    this.rating = '4.5', this.pricePerHour = 0, this.isAvailable = true, this.avatarUrl = '',
  });

  factory TourGuide.fromJson(Map<String, dynamic> json) {
    return TourGuide(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      city: json['city']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      rating: (json['rating'] as num?)?.toStringAsFixed(1) ?? '4.5',
      pricePerHour: (json['price_per_hour'] as num?)?.toDouble() ?? 0,
      isAvailable: json['is_available'] as bool? ?? true,
      avatarUrl: json['avatar_url']?.toString() ?? '',
    );
  }
}

class TravelProvider extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();

  List<BusLine> _busLines = [];
  List<CarpoolListing> _carpools = [];
  List<Vehicle> _vehicles = [];
  List<TouristSite> _touristSites = [];
  List<TourGuide> _tourGuides = [];
  Map<String, dynamic>? _busBooking;
  Map<String, dynamic>? _carpoolResult;
  Map<String, dynamic>? _flightBooking;
  Map<String, dynamic>? _trainBooking;
  Map<String, dynamic>? _ferryBooking;
  Map<String, dynamic>? _carRentalBooking;
  bool _isLoading = false;
  String? _error;

  List<BusLine> get busLines => _busLines;
  List<CarpoolListing> get carpools => _carpools;
  List<Vehicle> get vehicles => _vehicles;
  List<TouristSite> get touristSites => _touristSites;
  List<TourGuide> get tourGuides => _tourGuides;
  Map<String, dynamic>? get busBooking => _busBooking;
  Map<String, dynamic>? get carpoolResult => _carpoolResult;
  Map<String, dynamic>? get flightBooking => _flightBooking;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void clearError() { _error = null; notifyListeners(); }

  void _setLoading() { _isLoading = true; _error = null; notifyListeners(); }

  void _handleError(dynamic e, [List? fallback]) {
    if (e is DioException && e.response?.statusCode == 401) {
      _error = null;
    } else if (e is DioException) {
      final msg = e.response?.data?['message'] ?? e.response?.data?['error'] ?? 'Erreur de connexion';
      _error = msg.toString();
    } else {
      _error = 'Erreur de connexion';
    }
    _isLoading = false;
    notifyListeners();
  }

  // BUS
  Future<void> fetchBusLines({String? departure, String? destination}) async {
    _setLoading();
    try {
      final params = <String, dynamic>{};
      if (departure != null && departure.isNotEmpty) params['departure'] = departure;
      if (destination != null && destination.isNotEmpty) params['destination'] = destination;
      final res = await _apiClient.dio.get('/travel/bus-lines', queryParameters: params);
      if (res.statusCode == 200) {
        final List data = res.data['data'] ?? [];
        _busLines = data.map((e) => BusLine.fromJson(e as Map<String, dynamic>)).toList();
      }
    } catch (e) { _handleError(e); }
    _isLoading = false;
    notifyListeners();
  }

  Future<Map<String, dynamic>?> bookBus({
    required String busLineId, required String seatNumber,
    required String passengerName, required String passengerPhone,
    required String departureDate,
  }) async {
    _setLoading();
    try {
      final res = await _apiClient.dio.post('/travel/bus/book', data: {
        'bus_line_id': busLineId, 'seat_number': seatNumber,
        'passenger_name': passengerName, 'passenger_phone': passengerPhone,
        'departure_date': departureDate,
      });
      if (res.statusCode == 201) {
        _busBooking = res.data['data'] as Map<String, dynamic>?;
        return _busBooking;
      }
    } catch (e) { _handleError(e); }
    _isLoading = false;
    notifyListeners();
    return null;
  }

  // CARPOOL
  Future<void> fetchCarpools({String? departure, String? destination}) async {
    _setLoading();
    try {
      final params = <String, dynamic>{};
      if (departure != null && departure.isNotEmpty) params['departure'] = departure;
      if (destination != null && destination.isNotEmpty) params['destination'] = destination;
      final res = await _apiClient.dio.get('/travel/carpool/listings', queryParameters: params);
      if (res.statusCode == 200) {
        final List data = res.data['data'] ?? [];
        _carpools = data.map((e) => CarpoolListing.fromJson(e as Map<String, dynamic>)).toList();
      }
    } catch (e) { _handleError(e); }
    _isLoading = false;
    notifyListeners();
  }

  Future<Map<String, dynamic>?> publishCarpool({
    required String departureCity, required String destinationCity,
    required String departureDate, required String departureTime,
    required double price, required int seatsAvailable,
    String vehicleInfo = '', String notes = '',
  }) async {
    _setLoading();
    try {
      final res = await _apiClient.dio.post('/travel/carpool/listings', data: {
        'departure_city': departureCity, 'destination_city': destinationCity,
        'departure_date': departureDate, 'departure_time': departureTime,
        'price': price, 'seats_available': seatsAvailable,
        'vehicle_info': vehicleInfo, 'notes': notes,
      });
      if (res.statusCode == 201) {
        _carpoolResult = res.data['data'] as Map<String, dynamic>?;
        return _carpoolResult;
      }
    } catch (e) { _handleError(e); }
    _isLoading = false;
    notifyListeners();
    return null;
  }

  // FLIGHTS
  Future<void> searchFlights({String? departure, String? destination, String? date}) async {
    _setLoading();
    try {
      final params = <String, dynamic>{};
      if (departure != null) params['departure'] = departure;
      if (destination != null) params['destination'] = destination;
      if (date != null) params['date'] = date;
      await _apiClient.dio.get('/travel/flights/search', queryParameters: params);
    } catch (e) { _handleError(e); }
    _isLoading = false;
    notifyListeners();
  }

  Future<Map<String, dynamic>?> bookFlight({
    required String flightNumber, required String airline,
    required String departureCity, required String destinationCity,
    required String departureDate, String? returnDate,
    required String passengerName, required String passengerPhone,
    String passengerEmail = '', String seatClass = 'economy',
    required double price,
  }) async {
    _setLoading();
    try {
      final res = await _apiClient.dio.post('/travel/flights/book', data: {
        'flight_number': flightNumber, 'airline': airline,
        'departure_city': departureCity, 'destination_city': destinationCity,
        'departure_date': departureDate, 'return_date': returnDate,
        'passenger_name': passengerName, 'passenger_phone': passengerPhone,
        'passenger_email': passengerEmail, 'seat_class': seatClass, 'price': price,
      });
      if (res.statusCode == 201) {
        _flightBooking = res.data['data'] as Map<String, dynamic>?;
        return _flightBooking;
      }
    } catch (e) { _handleError(e); }
    _isLoading = false;
    notifyListeners();
    return null;
  }

  // TRAINS
  Future<void> fetchTrains({String? departure, String? destination}) async {
    _setLoading();
    try {
      final params = <String, dynamic>{};
      if (departure != null && departure.isNotEmpty) params['departure'] = departure;
      if (destination != null && destination.isNotEmpty) params['destination'] = destination;
      final res = await _apiClient.dio.get('/travel/trains', queryParameters: params);
      if (res.statusCode == 200) {
        final List data = res.data['data'] ?? [];
        _busLines = data.map((e) => BusLine.fromJson(e as Map<String, dynamic>)).toList();
      }
    } catch (e) { _handleError(e); }
    _isLoading = false;
    notifyListeners();
  }

  Future<Map<String, dynamic>?> bookTrain({
    required String trainLineId, required String seatNumber,
    required String passengerName, required String passengerPhone,
    required String departureDate,
  }) async {
    _setLoading();
    try {
      final res = await _apiClient.dio.post('/travel/trains/book', data: {
        'train_line_id': trainLineId, 'seat_number': seatNumber,
        'passenger_name': passengerName, 'passenger_phone': passengerPhone,
        'departure_date': departureDate,
      });
      if (res.statusCode == 201) {
        _trainBooking = res.data['data'] as Map<String, dynamic>?;
        return _trainBooking;
      }
    } catch (e) { _handleError(e); }
    _isLoading = false;
    notifyListeners();
    return null;
  }

  // FERRIES
  Future<void> fetchFerries({String? departure, String? destination}) async {
    _setLoading();
    try {
      final params = <String, dynamic>{};
      if (departure != null && departure.isNotEmpty) params['departure'] = departure;
      if (destination != null && destination.isNotEmpty) params['destination'] = destination;
      final res = await _apiClient.dio.get('/travel/ferries', queryParameters: params);
      if (res.statusCode == 200) {
        final List data = res.data['data'] ?? [];
        _busLines = data.map((e) => BusLine.fromJson(e as Map<String, dynamic>)).toList();
      }
    } catch (e) { _handleError(e); }
    _isLoading = false;
    notifyListeners();
  }

  Future<Map<String, dynamic>?> bookFerry({
    required String ferryLineId, required String cabinType,
    required String passengerName, required String passengerPhone,
    required String departureDate,
  }) async {
    _setLoading();
    try {
      final res = await _apiClient.dio.post('/travel/ferries/book', data: {
        'ferry_line_id': ferryLineId, 'cabin_type': cabinType,
        'passenger_name': passengerName, 'passenger_phone': passengerPhone,
        'departure_date': departureDate,
      });
      if (res.statusCode == 201) {
        _ferryBooking = res.data['data'] as Map<String, dynamic>?;
        return _ferryBooking;
      }
    } catch (e) { _handleError(e); }
    _isLoading = false;
    notifyListeners();
    return null;
  }

  // CAR RENTAL
  Future<void> fetchVehicles({String? city, String? type}) async {
    _setLoading();
    try {
      final params = <String, dynamic>{};
      if (city != null && city.isNotEmpty) params['city'] = city;
      if (type != null && type.isNotEmpty) params['type'] = type;
      final res = await _apiClient.dio.get('/travel/car-rental/vehicles', queryParameters: params);
      if (res.statusCode == 200) {
        final List data = res.data['data'] ?? [];
        _vehicles = data.map((e) => Vehicle.fromJson(e as Map<String, dynamic>)).toList();
      }
    } catch (e) { _handleError(e); }
    _isLoading = false;
    notifyListeners();
  }

  Future<Map<String, dynamic>?> bookVehicle({
    required String vehicleId,
    required String pickupDate, required String returnDate,
    required String driverName, required String driverPhone,
    bool withDriver = false,
  }) async {
    _setLoading();
    try {
      final res = await _apiClient.dio.post('/travel/car-rental/book', data: {
        'vehicle_id': vehicleId, 'pickup_date': pickupDate,
        'return_date': returnDate, 'driver_name': driverName,
        'driver_phone': driverPhone, 'with_driver': withDriver,
      });
      if (res.statusCode == 201) {
        _carRentalBooking = res.data['data'] as Map<String, dynamic>?;
        return _carRentalBooking;
      }
    } catch (e) { _handleError(e); }
    _isLoading = false;
    notifyListeners();
    return null;
  }

  // TOURIST SITES
  Future<void> fetchTouristSites({String? city, String? category}) async {
    _setLoading();
    try {
      final params = <String, dynamic>{};
      if (city != null && city.isNotEmpty) params['city'] = city;
      if (category != null && category.isNotEmpty) params['category'] = category;
      final res = await _apiClient.dio.get('/travel/tourist-sites', queryParameters: params);
      if (res.statusCode == 200) {
        final List data = res.data['data'] ?? [];
        _touristSites = data.map((e) => TouristSite.fromJson(e as Map<String, dynamic>)).toList();
      }
    } catch (e) { _handleError(e); }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchTourGuides({String? city}) async {
    _setLoading();
    try {
      final params = <String, dynamic>{};
      if (city != null && city.isNotEmpty) params['city'] = city;
      final res = await _apiClient.dio.get('/travel/tour-guides', queryParameters: params);
      if (res.statusCode == 200) {
        final List data = res.data['data'] ?? [];
        _tourGuides = data.map((e) => TourGuide.fromJson(e as Map<String, dynamic>)).toList();
      }
    } catch (e) { _handleError(e); }
    _isLoading = false;
    notifyListeners();
  }
}

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:mosombi_frontend/core/network/api_client.dart';

class SmartCityProvider extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();

  List<Map<String, dynamic>> _listings = [];
  Map<String, dynamic>? _currentListing;
  List<Map<String, dynamic>> _movingRequests = [];
  bool _isLoading = false;
  String? _error;
  double? _userLat;
  double? _userLng;

  List<Map<String, dynamic>> get listings => _listings;
  Map<String, dynamic>? get currentListing => _currentListing;
  List<Map<String, dynamic>> get movingRequests => _movingRequests;
  bool get isLoading => _isLoading;
  String? get error => _error;
  double? get userLat => _userLat;
  double? get userLng => _userLng;

  Future<void> fetchListings({String? city, String? type, String? transaction, double? minPrice, double? maxPrice}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final params = <String, dynamic>{};
      if (city != null && city.isNotEmpty) params['city'] = city;
      if (type != null) params['type'] = type;
      if (transaction != null) params['transaction'] = transaction;
      if (minPrice != null) params['min_price'] = minPrice;
      if (maxPrice != null) params['max_price'] = maxPrice;

      final response = await _apiClient.dio.get('/smart-city/listings', queryParameters: params);
      if (response.statusCode == 200 && response.data['success'] == true) {
        final List data = response.data['data'] ?? [];
        _listings = data.map((e) => e as Map<String, dynamic>).toList();
      }
    } catch (e) {
      _error = 'Erreur lors du chargement des annonces';
      debugPrint('fetchListings error: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchListingDetail(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiClient.dio.get('/smart-city/listings/$id');
      if (response.statusCode == 200 && response.data['success'] == true) {
        _currentListing = response.data['data'] as Map<String, dynamic>?;
      }
    } catch (e) {
      _error = 'Erreur lors du chargement du détail';
      debugPrint('fetchListingDetail error: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> createListing(Map<String, dynamic> data) async {
    try {
      final response = await _apiClient.dio.post('/smart-city/listings', data: data);
      return response.statusCode == 201 && response.data['success'] == true;
    } catch (e) {
      _error = 'Erreur lors de la création';
      debugPrint('createListing error: $e');
      return false;
    }
  }

  Future<bool> contactAgent(String listingId, {required String message, String? name, String? phone}) async {
    try {
      final response = await _apiClient.dio.post(
        '/smart-city/listings/$listingId/contact',
        data: {'message': message, if (name != null) 'name': name, if (phone != null) 'phone': phone},
      );
      return response.statusCode == 201 && response.data['success'] == true;
    } catch (e) {
      _error = 'Erreur lors de l\'envoi du message';
      debugPrint('contactAgent error: $e');
      return false;
    }
  }

  Future<bool> requestMovingQuote(Map<String, dynamic> data) async {
    try {
      final response = await _apiClient.dio.post('/smart-city/moving/quote', data: data);
      return (response.statusCode == 201 || response.statusCode == 200) && response.data['success'] == true;
    } catch (e) {
      _error = 'Erreur lors de la demande de devis';
      debugPrint('requestMovingQuote error: $e');
      return false;
    }
  }

  Future<void> fetchMovingRequests() async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiClient.dio.get('/smart-city/moving/requests');
      if (response.statusCode == 200 && response.data['success'] == true) {
        final List data = response.data['data'] ?? [];
        _movingRequests = data.map((e) => e as Map<String, dynamic>).toList();
      }
    } catch (e) {
      debugPrint('fetchMovingRequests error: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  Future<void> initLocation() async {
    try {
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.medium),
      ).timeout(const Duration(seconds: 8));
      _userLat = pos.latitude;
      _userLng = pos.longitude;
      notifyListeners();
    } catch (e) {
      try {
        final lastPos = await Geolocator.getLastKnownPosition();
        if (lastPos != null) {
          _userLat = lastPos.latitude;
          _userLng = lastPos.longitude;
          notifyListeners();
        }
      } catch (_) {}
    }
  }
}

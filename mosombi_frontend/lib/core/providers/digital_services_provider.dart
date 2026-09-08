import 'package:flutter/material.dart';
import 'package:mosombi_frontend/core/network/api_client.dart';
import 'package:mosombi_frontend/core/network/api_config.dart';

class DigitalServiceProvider extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();

  List<Map<String, dynamic>> _providers = [];
  List<Map<String, dynamic>> _products = [];
  List<Map<String, dynamic>> _history = [];
  bool _loading = false;

  List<Map<String, dynamic>> get providers => _providers;
  List<Map<String, dynamic>> get products => _products;
  List<Map<String, dynamic>> get history => _history;
  bool get loading => _loading;

  Future<void> fetchProviders({String? category}) async {
    _loading = true;
    notifyListeners();
    try {
      final query = category != null ? '?category=$category' : '';
      final response = await _apiClient.dio.get('${ApiConfig.digitalServiceProviders}$query');
      if (response.statusCode == 200 && response.data['success']) {
        _providers = List<Map<String, dynamic>>.from(response.data['data']['providers'] ?? []);
      }
    } catch (e) {
      debugPrint('fetchProviders Error: $e');
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> fetchProducts(String providerId) async {
    _loading = true;
    notifyListeners();
    try {
      final response = await _apiClient.dio.get('${ApiConfig.digitalServiceProducts}/$providerId/products');
      if (response.statusCode == 200 && response.data['success']) {
        _products = List<Map<String, dynamic>>.from(response.data['data']['products'] ?? []);
      }
    } catch (e) {
      debugPrint('fetchProducts Error: $e');
    }
    _loading = false;
    notifyListeners();
  }

  Future<Map<String, dynamic>?> purchase(String providerId, String productId, String recipient, double amount) async {
    try {
      final response = await _apiClient.dio.post(ApiConfig.digitalServicePurchase, data: {
        'provider_id': providerId,
        'product_id': productId,
        'recipient': recipient,
        'amount': amount,
      });
      if (response.statusCode == 201 && response.data['success']) {
        await fetchHistory();
        return response.data['data'] as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('purchase Error: $e');
    }
    return null;
  }

  Future<void> fetchHistory() async {
    try {
      final response = await _apiClient.dio.get(ApiConfig.digitalServiceHistory);
      if (response.statusCode == 200 && response.data['success']) {
        _history = List<Map<String, dynamic>>.from(response.data['data']['purchases'] ?? []);
        notifyListeners();
      }
    } catch (e) {
      debugPrint('fetchHistory Error: $e');
    }
  }

  Future<Map<String, dynamic>?> validateRecipient(String providerId, String recipient) async {
    try {
      final response = await _apiClient.dio.post(ApiConfig.digitalServiceValidate, data: {
        'provider_id': providerId,
        'recipient': recipient,
      });
      if (response.statusCode == 200 && response.data['success']) {
        return response.data['data'] as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('validateRecipient Error: $e');
    }
    return null;
  }

  void clearProducts() {
    _products = [];
    notifyListeners();
  }
}

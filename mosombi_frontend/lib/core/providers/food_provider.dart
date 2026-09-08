import 'package:flutter/material.dart';
import 'package:mosombi_frontend/core/network/api_client.dart';

class FoodItem {
  final String id;
  final String name;
  final String city;
  final String address;
  final String logo_url;
  final double? latitude;
  final double? longitude;
  final String rating;
  final String delivery_time;
  final double delivery_fee;
  final String cuisine;
  final bool is_open;

  FoodItem({
    required this.id,
    required this.name,
    this.city = '',
    this.address = '',
    this.logo_url = '',
    this.latitude,
    this.longitude,
    this.rating = '4.5',
    this.delivery_time = '20-30 min',
    this.delivery_fee = 0,
    this.cuisine = 'Locale',
    this.is_open = true,
  });

  factory FoodItem.fromJson(Map<String, dynamic> json) {
    return FoodItem(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Restaurant',
      city: json['city']?.toString() ?? '',
      address: json['address']?.toString() ?? '',
      logo_url: json['logo_url']?.toString() ?? '',
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      rating: (json['rating'] as num?)?.toStringAsFixed(1) ?? '4.5',
      delivery_time: json['delivery_time']?.toString() ?? '20-30 min',
      delivery_fee: (json['delivery_fee'] as num?)?.toDouble() ?? 0,
      cuisine: json['cuisine']?.toString() ?? 'Locale',
      is_open: json['is_open'] as bool? ?? true,
    );
  }
}

class MenuItem {
  final String id;
  final String name;
  final String description;
  final double price;
  final String category;
  final String image_url;
  final bool is_available;

  MenuItem({
    required this.id,
    required this.name,
    this.description = '',
    required this.price,
    this.category = 'plat',
    this.image_url = '',
    this.is_available = true,
  });

  factory MenuItem.fromJson(Map<String, dynamic> json) {
    return MenuItem(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0,
      category: json['category']?.toString() ?? 'plat',
      image_url: json['image_url']?.toString() ?? '',
      is_available: json['is_available'] as bool? ?? true,
    );
  }
}

class FoodOrderItem {
  final String menu_item_id;
  final String name;
  final int quantity;
  final double price;
  final String notes;

  FoodOrderItem({
    required this.menu_item_id,
    required this.name,
    required this.quantity,
    required this.price,
    this.notes = '',
  });

  Map<String, dynamic> toJson() => {
    'menu_item_id': menu_item_id,
    'name': name,
    'quantity': quantity,
    'price': price,
    'notes': notes,
  };
}

class FoodOrder {
  final String id;
  final String agency_id;
  final String status;
  final List<dynamic> items;
  final double total_amount;
  final String currency;
  final String notes;
  final String created_at;

  FoodOrder({
    required this.id,
    required this.agency_id,
    required this.status,
    required this.items,
    required this.total_amount,
    this.currency = 'XAF',
    this.notes = '',
    required this.created_at,
  });

  factory FoodOrder.fromJson(Map<String, dynamic> json) {
    return FoodOrder(
      id: json['id']?.toString() ?? '',
      agency_id: json['agency_id']?.toString() ?? '',
      status: json['status']?.toString() ?? 'pending',
      items: json['items'] is List ? json['items'] as List : [],
      total_amount: (json['total_amount'] as num?)?.toDouble() ?? 0,
      currency: json['currency']?.toString() ?? 'XAF',
      notes: json['notes']?.toString() ?? '',
      created_at: json['created_at']?.toString() ?? '',
    );
  }

  String get statusLabel {
    switch (status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmée';
      case 'preparing': return 'En préparation';
      case 'ready': return 'Prête';
      case 'delivered': return 'Livrée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  }
}

class FoodProvider extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  List<FoodItem> _restaurants = [];
  List<MenuItem> _menuItems = [];
  List<FoodOrder> _orders = [];
  bool _isLoading = false;
  String? _error;

  List<FoodItem> get restaurants => _restaurants;
  List<MenuItem> get menuItems => _menuItems;
  List<FoodOrder> get orders => _orders;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchRestaurants({String? search, String? category}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final params = <String, dynamic>{};
      if (search != null && search.isNotEmpty) params['search'] = search;
      if (category != null && category.isNotEmpty) params['category'] = category;
      final response = await _apiClient.dio.get('/food/restaurants', queryParameters: params);
      if (response.statusCode == 200) {
        final List data = response.data['data'] ?? [];
        _restaurants = data.map((e) => FoodItem.fromJson(e as Map<String, dynamic>)).toList();
      }
    } catch (e) {
      _error = e.toString();
      _restaurants = [];
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchRestaurantMenu(String id) async {
    _isLoading = true;
    _error = null;
    _menuItems = [];
    notifyListeners();
    try {
      final response = await _apiClient.dio.get('/food/restaurants/$id/menu');
      if (response.statusCode == 200) {
        final List data = response.data['data'] ?? [];
        _menuItems = data.map((e) => MenuItem.fromJson(e as Map<String, dynamic>)).toList();
      }
    } catch (e) {
      _error = e.toString();
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<Map<String, dynamic>?> placeOrder({
    required String restaurantId,
    required List<FoodOrderItem> items,
    required double totalAmount,
    String notes = '',
    Map<String, dynamic>? deliveryAddress,
  }) async {
    _isLoading = true;
    notifyListeners();
    try {
      final body = {
        'restaurant_id': restaurantId,
        'items': items.map((i) => i.toJson()).toList(),
        'total_amount': totalAmount,
        'notes': notes,
        'delivery_address': deliveryAddress ?? {},
      };
      final response = await _apiClient.dio.post('/food/orders', data: body);
      if (response.statusCode == 201) {
        return response.data['data'] as Map<String, dynamic>?;
      }
    } catch (e) {
      _error = e.toString();
    }
    _isLoading = false;
    notifyListeners();
    return null;
  }

  Future<void> fetchMyOrders() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final response = await _apiClient.dio.get('/food/orders');
      if (response.statusCode == 200) {
        final List data = response.data['data'] ?? [];
        _orders = data.map((e) => FoodOrder.fromJson(e as Map<String, dynamic>)).toList();
      }
    } catch (e) {
      _error = e.toString();
    }
    _isLoading = false;
    notifyListeners();
  }

}

import 'package:flutter/material.dart';
import '../models/cart_item_model.dart';
import '../models/product_model.dart';
import 'product_provider.dart';
import '../network/api_client.dart';

class CartProvider extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  final Map<String, CartItem> _items = {};

  Map<String, CartItem> get items => _items;
  int get itemCount => _items.length;

  double get totalAmount {
    var total = 0.0;
    _items.forEach((key, cartItem) {
      total += cartItem.product.price * cartItem.quantity;
    });
    return total;
  }

  void addItem(Product product) {
    if (_items.containsKey(product.id)) {
      if (_items[product.id]!.quantity < product.stock) {
        _items.update(
          product.id,
          (existingCartItem) => CartItem(
            product: existingCartItem.product,
            quantity: existingCartItem.quantity + 1,
          ),
        );
      }
    } else {
      if (product.stock > 0) {
        _items.putIfAbsent(
          product.id,
          () => CartItem(product: product),
        );
      }
    }
    notifyListeners();
  }

  void removeItem(String productId) {
    _items.remove(productId);
    notifyListeners();
  }

  void removeSingleItem(String productId) {
    if (!_items.containsKey(productId)) return;
    if (_items[productId]!.quantity > 1) {
      _items.update(
        productId,
        (existingCartItem) => CartItem(
          product: existingCartItem.product,
          quantity: existingCartItem.quantity - 1,
        ),
      );
    } else {
      _items.remove(productId);
    }
    notifyListeners();
  }

  void clear() {
    _items.clear();
    notifyListeners();
  }

  Future<bool> submitOrder(ProductProvider productProvider, String deliveryName, double deliveryFee) async {
    if (_items.isEmpty) return false;

    // Build payload for backend
    final itemsPayload = _items.values.map((cartItem) => {
      'article_id': cartItem.product.id,
      'quantity': cartItem.quantity,
    }).toList();

    try {
      final response = await _apiClient.dio.post('/store/checkout', data: {
        'items': itemsPayload,
        'client_name': 'Client UI', // Could be populated differently
        'client_phone': '',
        'delivery_type': deliveryName,
        'delivery_fee_amount': deliveryFee,
      });

      if (response.statusCode == 201 && response.data['success']) {
        // Execute logic on UI
        for (var key in _items.keys) {
          productProvider.decrementStock(key, _items[key]!.quantity);
        }
        clear();
        return true;
      }
    } catch (e) {
      debugPrint('Checkout Error: $e');
    }

    // Default return false if API call fails
    return false;
  }
}

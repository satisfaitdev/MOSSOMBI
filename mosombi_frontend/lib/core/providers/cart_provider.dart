import 'package:flutter/material.dart';
import '../models/cart_item_model.dart';
import '../models/product_model.dart';
import 'product_provider.dart';
import '../network/api_client.dart';

class CartProvider extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  final Map<String, CartItem> _items = {};
  Map<String, dynamic> _logisticsSettings = {};

  Map<String, CartItem> get items => _items;
  Map<String, dynamic> get logisticsSettings => _logisticsSettings;
  int get itemCount => _items.length;

  // Groupement par mode de paiement (Prêt vs Cash)
  Map<bool, List<CartItem>> get itemsByLoanStatus {
    final groups = <bool, List<CartItem>>{true: [], false: []};
    for (var item in _items.values) {
      groups[item.wantsLoan]!.add(item);
    }
    return groups;
  }

  // Groupement par origine (Local vs International)
  Map<String, List<CartItem>> get itemsByOrigin {
    final groups = <String, List<CartItem>>{};
    for (var item in _items.values) {
      final origin = (item.product.origin ?? 'Local').contains('Local') ? 'Local' : 'International';
      if (!groups.containsKey(origin)) groups[origin] = [];
      groups[origin]!.add(item);
    }
    return groups;
  }

  // Groupement complexe (Payment -> Origin)
  Map<String, Map<String, List<CartItem>>> get categorizedItems {
     final result = <String, Map<String, List<CartItem>>>{
        'cash': {'Local': [], 'International': []},
        'loan': {'Local': [], 'International': []},
     };

     for (var item in _items.values) {
        final payKey = item.wantsLoan ? 'loan' : 'cash';
        final originKey = (item.product.origin ?? 'Local').contains('Local') ? 'Local' : 'International';
        result[payKey]![originKey]!.add(item);
     }
     return result;
  }

  double get totalAmount {
    var total = 0.0;
    _items.forEach((key, cartItem) {
      total += cartItem.unitPrice * cartItem.quantity;
    });
    return total;
  }

  void addItem(Product product, {String? selectedVariant, String? selectedColor, bool wantsLoan = false}) {
    String uniqueId = '${product.id}_${selectedVariant ?? 'none'}_${selectedColor?.replaceAll('#', '') ?? 'none'}_$wantsLoan';

    if (_items.containsKey(uniqueId)) {
      if (_items[uniqueId]!.quantity < product.stock) {
        _items.update(
          uniqueId,
          (existingCartItem) => CartItem(
            product: existingCartItem.product,
            quantity: existingCartItem.quantity + 1,
            selectedVariant: existingCartItem.selectedVariant,
            selectedColor: existingCartItem.selectedColor,
            wantsLoan: existingCartItem.wantsLoan,
          ),
        );
      }
    } else {
      if (product.stock > 0) {
        _items.putIfAbsent(
          uniqueId,
          () => CartItem(
            product: product,
            selectedVariant: selectedVariant,
            selectedColor: selectedColor,
            wantsLoan: wantsLoan,
          ),
        );
      }
    }
    notifyListeners();
  }

  void addBulk(Product product, List<Map<String, dynamic>> selections) {
    for (var selection in selections) {
      String? variant = selection['variant'];
      String? color = selection['color'];
      int quantity = selection['quantity'] ?? 0;
      bool wantsLoan = selection['wantsLoan'] ?? false;

      if (quantity <= 0) continue;

      String uniqueId = '${product.id}_${variant ?? 'none'}_${color?.replaceAll('#', '') ?? 'none'}_$wantsLoan';

      if (_items.containsKey(uniqueId)) {
        int newQty = _items[uniqueId]!.quantity + quantity;
        if (newQty > product.stock) newQty = product.stock;
        _items[uniqueId] = CartItem(
          product: _items[uniqueId]!.product,
          quantity: newQty,
          selectedVariant: variant,
          selectedColor: color,
          wantsLoan: wantsLoan,
        );
      } else {
        int actualQty = quantity > product.stock ? product.stock : quantity;
        _items[uniqueId] = CartItem(
          product: product,
          quantity: actualQty,
          selectedVariant: variant,
          selectedColor: color,
          wantsLoan: wantsLoan,
        );
      }
    }
    notifyListeners();
  }

  void removeItem(String cartItemId) {
    _items.remove(cartItemId);
    notifyListeners();
  }

  void removeSingleItem(String cartItemId) {
    if (!_items.containsKey(cartItemId)) return;
    if (_items[cartItemId]!.quantity > 1) {
      _items.update(
        cartItemId,
        (existingCartItem) => CartItem(
          product: existingCartItem.product,
          quantity: existingCartItem.quantity - 1,
          selectedVariant: existingCartItem.selectedVariant,
          selectedColor: existingCartItem.selectedColor,
          wantsLoan: existingCartItem.wantsLoan,
        ),
      );
    } else {
      _items.remove(cartItemId);
    }
    notifyListeners();
  }

  void clear() {
    _items.clear();
    notifyListeners();
  }

  Future<Map<String, dynamic>?> fetchShippingQuotes() async {
    if (_items.isEmpty) return null;

    final itemsPayload = _items.values.map((cartItem) => {
      'article_id': cartItem.product.id,
      'quantity': cartItem.quantity,
    }).toList();

    try {
      final response = await _apiClient.dio.post('/store-enhanced/shipping-quote', data: {
        'items': itemsPayload,
      });

      if (response.statusCode == 200 && response.data['success']) {
        return response.data['data']; // Contient local_standard, local_instant, intl_avion, intl_bateau
      }
    } catch (e) {
      debugPrint('Shipping Quote Error: $e');
    }
    return null;
  }

  Future<void> fetchLogisticsSettings() async {
    try {
      final response = await _apiClient.dio.get('/monitoring/logistics-settings');
      if (response.statusCode == 200 && response.data['success']) {
        _logisticsSettings = response.data['data'] as Map<String, dynamic>;
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error fetching logistics settings: $e');
    }
  }

  Future<bool> submitSubOrder({
    required List<CartItem> subItems,
    required String deliveryMethod,
    required String deliveryAddress,
    required ProductProvider productProvider,
    String? paymentMethod,
    double? latitude,
    double? longitude,
    String? voiceNote,
  }) async {
    if (subItems.isEmpty) return false;

    // Build payload for backend
    final itemsPayload = subItems.map((cartItem) => {
      'article_id': cartItem.product.id,
      'quantity': cartItem.quantity,
      'selected_variant': cartItem.selectedVariant,
      'selected_color': cartItem.selectedColor,
      'wants_loan': cartItem.wantsLoan,
    }).toList();

    try {
      final response = await _apiClient.dio.post('/store-enhanced/checkout', data: {
        'items': itemsPayload,
        'client_name': 'Client UI',
        'client_phone': '',
        'delivery_method': deliveryMethod, // 'local_standard', 'local_instant', 'intl_avion', 'intl_bateau'
        'delivery_address': deliveryAddress,
        'payment_method': paymentMethod ?? (subItems.any((i) => i.wantsLoan) ? 'credit_application' : 'cash_on_delivery'),
        if (latitude != null) 'latitude': latitude,
        if (longitude != null) 'longitude': longitude,
        if (voiceNote != null) 'voice_note': voiceNote,
      });

      if (response.statusCode == 201 && response.data['success']) {
        // Retirer uniquement ces articles du panier en local
        for (var item in subItems) {
           final keyToRemove = _items.keys.firstWhere(
             (k) => _items[k] == item,
             orElse: () => '',
           );
           if (keyToRemove.isNotEmpty) {
             _items.remove(keyToRemove);
             productProvider.decrementStock(item.product.id, item.quantity);
           }
        }
        notifyListeners();
        return true;
      }
    } catch (e) {
      debugPrint('Checkout Error: $e');
    }

    return false;
  }
}

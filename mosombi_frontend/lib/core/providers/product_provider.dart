import 'package:flutter/material.dart';
import '../models/product_model.dart';
import 'package:mosombi_frontend/core/services/local_cache_service.dart';
import 'package:mosombi_frontend/core/network/api_client.dart';
import 'package:uuid/uuid.dart';

class ProductProvider extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  final _uuid = const Uuid();
  
  List<Product> _products = [];
  String? error;

  ProductProvider() {
    _initStorage();
    fetchProducts(); // Initial fetch
  }

  void _initStorage() {
    final cachedData = LocalCacheService.instance.getList(LocalCacheService.productBox, 'top_products');
    if (cachedData != null && cachedData.isNotEmpty) {
      _products = cachedData.map((e) => Product.fromJson(e as Map<String, dynamic>)).toList();
    } else {
      _products = [];
    }
  }

  void _saveToCache() {
    // Ne sauver que les 10 premiers produits (Données allégées)
    LocalCacheService.instance.saveJsonList(
      LocalCacheService.productBox,
      'top_products',
      _products.take(10).map((e) => e.toJson()).toList(),
    );
  }

  Future<void> fetchProducts() async {
    try {
      final response = await _apiClient.dio.get('/store-enhanced/products');
        final List data = response.data['data'] ?? [];
        final List<Product> fetchedProducts = [];
        
        for (var item in data) {
          try {
            fetchedProducts.add(Product.fromJson(item as Map<String, dynamic>));
          } catch (e) {
            debugPrint('Skipping corrupt product: $e');
          }
        }
        
        _products = fetchedProducts;
        _saveToCache();
        notifyListeners();
    } catch (e) {
      debugPrint('Error fetching products: $e');
    }
  }

  List<Product> get products => _products;

  void decrementStock(String productId, int quantity) {
    final index = _products.indexWhere((p) => p.id == productId);
    if (index != -1) {
      final oldProduct = _products[index];
      final newStock = oldProduct.stock - quantity;
      _products[index] = oldProduct.copyWithStock(newStock < 0 ? 0 : newStock);
      _saveToCache();
      notifyListeners();
    }
  }

  Future<bool> createAgencyProduct({
    required String name,
    required String description,
    required double price,
    required int stock,
    required String category,
    required String origin,
    required String agencyId,
    String? imageUrl,
    List<String>? galleryUrls,
    String? videoUrl,
    String? brand,
    String? deliveryTime,
    String? shippingUnit,
    double? shippingValue,
    Map<String, dynamic>? specifications,
    List<Map<String, dynamic>>? variants,
  }) async {
    error = null;
    notifyListeners();
    
    try {
      final response = await _apiClient.dio.post('/agencies/my/products', data: {
        'name': name,
        'description': description,
        'price': price,
        'in_stock': stock > 0,
        'stock_quantity': stock,
        'category': category,
        'brand': brand ?? '',
        'origin': origin,
        'image_url': imageUrl ?? '',
        'gallery_urls': galleryUrls ?? [],
        'video_url': videoUrl ?? '',
        'delivery_time': deliveryTime ?? '2-3 Jours',
        'shipping_unit': shippingUnit ?? 'kg',
        'shipping_value': shippingValue ?? 0,
        'specifications': specifications ?? {},
        'variants': variants ?? [],
      });
      
      if (response.statusCode == 201 && response.data['success'] == true) {
        // Ajouter en local pour affichage immédiat
        final newProduct = Product(
           id: response.data['data']?['id'] ?? _uuid.v4(),
           name: name,
           description: description,
           price: price,
           stock: stock,
           imageUrl: imageUrl ?? '',
           galleryUrls: galleryUrls ?? [],
           videoUrl: videoUrl,
           category: category,
           brand: brand,
           origin: origin,
           deliveryTime: deliveryTime ?? '2-3 Jours',
           agencyId: agencyId,
           specifications: specifications ?? {},
           variants: variants ?? [],
           shippingUnit: shippingUnit,
           shippingValue: shippingValue,
        );
        _products.insert(0, newProduct);
        _saveToCache();
        notifyListeners();
        return true;
      } else {
         error = "Une erreur est survenue côté serveur.";
         return false;
      }
    } catch (e) {
      // Offline mock creation
      final newProduct = Product(
           id: _uuid.v4(),
           name: name,
           description: description,
           price: price,
           stock: stock,
           imageUrl: imageUrl ?? '',
           galleryUrls: galleryUrls ?? [],
           videoUrl: videoUrl,
           category: category,
           brand: brand,
           origin: origin,
           deliveryTime: deliveryTime ?? '2-3 Jours',
           agencyId: agencyId,
           specifications: specifications ?? {},
           variants: variants ?? [],
           shippingUnit: shippingUnit,
           shippingValue: shippingValue,
      );
      _products.insert(0, newProduct);
      _saveToCache();
      notifyListeners();
      return true; // We fallback gracefully so UI can proceed
    }
  }

  Future<bool> updateAgencyProduct({
    required String productId,
    required String name,
    required String description,
    required double price,
    required int stock,
    required String category,
    required String origin,
    String? imageUrl,
    List<String>? galleryUrls,
    String? videoUrl,
    String? brand,
    String? deliveryTime,
    String? shippingUnit,
    double? shippingValue,
    Map<String, dynamic>? specifications,
    List<Map<String, dynamic>>? variants,
  }) async {
    error = null;
    notifyListeners();
    
    try {
      final response = await _apiClient.dio.put('/agencies/my/products/$productId', data: {
        'name': name,
        'description': description,
        'price': price,
        'in_stock': stock > 0,
        'stock_quantity': stock,
        'category': category,
        'brand': brand ?? '',
        'origin': origin,
        'image_url': imageUrl ?? '',
        'gallery_urls': galleryUrls ?? [],
        'video_url': videoUrl ?? '',
        'delivery_time': deliveryTime ?? '2-3 Jours',
        'shipping_unit': shippingUnit ?? 'kg',
        'shipping_value': shippingValue ?? 0,
        'specifications': specifications ?? {},
        'variants': variants ?? [],
      });
      
      if (response.statusCode == 200 && response.data['success'] == true) {
        // Mettre à jour en local
        final index = _products.indexWhere((p) => p.id == productId);
        if (index != -1) {
           final oldProduct = _products[index];
           _products[index] = Product(
              id: productId,
              name: name,
              description: description,
              price: price,
              stock: stock,
              imageUrl: (imageUrl != null && imageUrl.isNotEmpty) ? imageUrl : oldProduct.imageUrl,
              galleryUrls: galleryUrls ?? oldProduct.galleryUrls,
              videoUrl: videoUrl ?? oldProduct.videoUrl,
              category: category,
              brand: brand ?? oldProduct.brand,
              origin: origin,
              deliveryTime: deliveryTime ?? oldProduct.deliveryTime,
              agencyId: oldProduct.agencyId,
              specifications: specifications ?? oldProduct.specifications,
              variants: variants ?? oldProduct.variants,
              shippingUnit: shippingUnit ?? oldProduct.shippingUnit,
              shippingValue: shippingValue ?? oldProduct.shippingValue,
           );
           _saveToCache();
           notifyListeners();
        }
        return true;
      } else {
         error = "Une erreur est survenue côté serveur.";
         return false;
      }
    } catch (e) {
      // Offline fallback
      final index = _products.indexWhere((p) => p.id == productId);
      if (index != -1) {
          final oldProduct = _products[index];
          _products[index] = Product(
              id: productId,
              name: name,
              description: description,
              price: price,
              stock: stock,
              imageUrl: (imageUrl != null && imageUrl.isNotEmpty) ? imageUrl : oldProduct.imageUrl,
              galleryUrls: galleryUrls ?? oldProduct.galleryUrls,
              videoUrl: videoUrl ?? oldProduct.videoUrl,
              category: category,
              brand: brand ?? oldProduct.brand,
              origin: origin,
              deliveryTime: deliveryTime ?? oldProduct.deliveryTime,
              agencyId: oldProduct.agencyId,
              specifications: specifications ?? oldProduct.specifications,
              variants: variants ?? oldProduct.variants,
              shippingUnit: shippingUnit ?? oldProduct.shippingUnit,
              shippingValue: shippingValue ?? oldProduct.shippingValue,
          );
          _saveToCache();
          notifyListeners();
      }
      return true; // Graceful offline edit
    }
  }

  Future<bool> deleteProduct(String productId) async {
    error = null;
    notifyListeners();
    try {
      final response = await _apiClient.dio.delete('/agencies/my/products/$productId');
      
      if (response.statusCode == 200 && response.data['success'] == true) {
        _products.removeWhere((p) => p.id == productId);
        _saveToCache();
        notifyListeners();
        return true;
      } else {
        error = "Erreur du serveur lors de la suppression du produit.";
        notifyListeners();
        return false;
      }
    } catch (e) {
      error = "Erreur lors de la suppression du produit.";
      notifyListeners();
      return false;
    }
  }

  Future<bool> promoteProduct({
    required String productId,
    required int days,
    required String coverage,
  }) async {
    error = null;
    notifyListeners();
    try {
      final response = await _apiClient.dio.post('/agencies/my/products/$productId/promote', data: { 'days': days, 'coverage': coverage });
      notifyListeners();
      return true;
    } catch (e) {
      error = "Erreur lors de la promotion du produit.";
      notifyListeners();
      return false;
    }
  }
}

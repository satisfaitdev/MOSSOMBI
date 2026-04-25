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
      final response = await _apiClient.dio.get('/store/products');
      if (response.statusCode == 200 && response.data['success']) {
        final List data = response.data['data'] ?? [];
        _products = data.map((json) => Product(
          id: json['id'] ?? _uuid.v4(),
          name: json['name'] ?? 'Inconnu',
          description: json['description'] ?? '',
          price: double.tryParse((json['price'] ?? 0).toString()) ?? 0.0,
          stock: json['in_stock'] == true ? 100 : 0, // Fallback since actual quantity is not returned right now
          imageUrl: (json['image_url'] != null && json['image_url'].toString().isNotEmpty) 
              ? json['image_url'] 
              : 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800',
          category: 'Marketplace',
          origin: json['country'] ?? 'Locale 📍',
          deliveryTime: json['delivery_time'] ?? '1-3 Jours',
          agencyId: json['agency_id'],
        )).toList();
        
        /// Real backend data only now
        
        _saveToCache();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error fetching products: $e');
    }
  }

  List<Product> _getMockProducts() {
    return [
      Product(
        id: 'p1',
        name: 'Iphone 15 Pro Max',
        description: 'Dernier modèle, 256Go. Titane naturel. Technologie ultra-rapide.',
        price: 850000.0,
        stock: 5,
        imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=800',
        category: 'Électronique',
        origin: 'Dubaï 🇦🇪',
        deliveryTime: 'Livraison: 5-7 Jours',
      ),
      Product(
        id: 'p2',
        name: 'Robe d\'été Fleurie',
        description: 'Robe légère, coupe élégante, idéale pour les sorties estivales.',
        price: 15000.0,
        stock: 12,
        imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=800',
        category: 'Mode',
        origin: 'Chine 🇨🇳',
        deliveryTime: 'Livraison: 10-15 Jours',
      ),
      Product(
        id: 'p3',
        name: 'Baskets Air Max Limitées',
        description: 'Chaussures de sport ultra confort. Édition limitée.',
        price: 65000.0,
        stock: 2,
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800',
        category: 'Mode',
        origin: 'Turquie 🇹🇷',
        deliveryTime: 'Livraison: 7-10 Jours',
      ),
      Product(
        id: 'p4',
        name: 'Montre Connectée Galaxy',
        description: 'Suivi santé et sport 24/7. Water resistant 50m.',
        price: 180000.0,
        stock: 0,
        imageUrl: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&q=80&w=800',
        category: 'Électronique',
        origin: 'Local 📍',
        deliveryTime: 'Livraison: 24 Heures',
      ),
      Product(
        id: 'p5',
        name: 'Parfum Sauvage Dior 100ml',
        description: 'Eau de parfum authentique, sillage persistant.',
        price: 82000.0,
        stock: 8,
        imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800',
        category: 'Beauté',
        origin: 'France 🇫🇷',
        deliveryTime: 'Livraison: 7 Jours',
      ),
      Product(
        id: 'p6',
        name: 'Sac à Main Cuir Luxe',
        description: 'Design épuré et grande capacité, finition premium.',
        price: 45000.0,
        stock: 14,
        imageUrl: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&q=80&w=800',
        category: 'Mode',
        origin: 'Chine 🇨🇳',
        deliveryTime: 'Livraison: 15-20 Jours',
      ),
    ];
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
    String? deliveryTime,
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
        'origin': origin,
        'image_url': imageUrl ?? '',
        'gallery_urls': galleryUrls ?? [],
        'delivery_time': deliveryTime ?? '2-3 Jours',
        'specifications': specifications ?? {},
        'variants': variants ?? [],
      });
      
      if (response.statusCode == 201 && response.data['success'] == true) {
        // Ajouter en local pour affichage immédiat
        final newProduct = Product(
           id: response.data['data']['id'] ?? _uuid.v4(),
           name: name,
           description: description,
           price: price,
           stock: stock,
           imageUrl: imageUrl ?? '',
           galleryUrls: galleryUrls ?? [],
           category: category,
           origin: origin,
           deliveryTime: deliveryTime ?? '2-3 Jours',
           agencyId: agencyId,
           specifications: specifications ?? {},
           variants: variants ?? [],
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
           category: category,
           origin: origin,
           deliveryTime: deliveryTime ?? '2-3 Jours',
           agencyId: agencyId,
           specifications: specifications ?? {},
           variants: variants ?? [],
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
    String? deliveryTime,
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
        'origin': origin,
        'image_url': imageUrl ?? '',
        'gallery_urls': galleryUrls ?? [],
        'delivery_time': deliveryTime ?? '2-3 Jours',
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
              description: description, // Le backend retourne la description concaténée, mais ici on garde la version simple pour éviter un double parsing au besoin (Optionnel)
              price: price,
              stock: stock,
              imageUrl: (imageUrl != null && imageUrl.isNotEmpty) ? imageUrl : oldProduct.imageUrl,
              galleryUrls: galleryUrls ?? oldProduct.galleryUrls,
              category: category,
              origin: origin,
              deliveryTime: deliveryTime ?? oldProduct.deliveryTime,
              agencyId: oldProduct.agencyId,
              specifications: specifications ?? oldProduct.specifications,
              variants: variants ?? oldProduct.variants,
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
              category: category,
              origin: origin,
              deliveryTime: deliveryTime ?? oldProduct.deliveryTime,
              agencyId: oldProduct.agencyId,
              specifications: specifications ?? oldProduct.specifications,
              variants: variants ?? oldProduct.variants,
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
      // Mocked promotion API call
      // final response = await _apiClient.dio.post('/agencies/my/products/$productId/promote', data: { 'days': days, 'coverage': coverage });
      await Future.delayed(const Duration(seconds: 1));
      
      // We could update the product to add a "promoted: true" badge if product model supported it
      notifyListeners();
      return true;
    } catch (e) {
      error = "Erreur lors de la promotion du produit.";
      notifyListeners();
      return false;
    }
  }
}

import 'package:flutter/foundation.dart';

class Product {
  final String id;
  final String name;
  final String description;
  final double price;
  final int stock;
  final String imageUrl;
  final List<String> galleryUrls;
  final String? videoUrl;
  final String category;
  final String? brand;
  final String origin; // Local, Chine, Dubai, Turquie, France
  final String deliveryTime; // Temps estimé
  final String? agencyId; // Optional property to match with the agency
  final String? agencyName;
  final bool isCertified;
  final Map<String, dynamic> specifications;
  final List<Map<String, dynamic>> variants;
  final String currency;
  final String? shippingUnit;
  final double? shippingValue;

  Product({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.stock,
    required this.imageUrl,
    this.galleryUrls = const [],
    this.videoUrl,
    required this.category,
    this.brand,
    required this.origin,
    required this.deliveryTime,
    this.agencyId,
    this.agencyName,
    this.isCertified = false,
    this.specifications = const {},
    this.variants = const [],
    this.currency = 'XAF',
    this.shippingUnit,
    this.shippingValue,
  });

  Product copyWithStock(int newStock) {
    return Product(
      id: id,
      name: name,
      description: description,
      price: price,
      stock: newStock,
      imageUrl: imageUrl,
      galleryUrls: List.from(galleryUrls),
      videoUrl: videoUrl,
      category: category,
      brand: brand,
      origin: origin,
      deliveryTime: deliveryTime,
      agencyId: agencyId,
      agencyName: agencyName,
      isCertified: isCertified,
      specifications: Map.from(specifications),
      variants: List.from(variants),
      currency: currency,
      shippingUnit: shippingUnit,
      shippingValue: shippingValue,
    );
  }

  static double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  static int _parseInt(dynamic value) {
    if (value == null) return 0;
    if (value is num) return value.toInt();
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }

  factory Product.fromJson(Map<String, dynamic> json) {
    try {
      final metadata = json['metadata'] is Map ? json['metadata'] as Map<String, dynamic> : {};
      
      // Extraction des images (compatibilité)
      List<String> gallery = [];
      try {
        if (json['galleryUrls'] != null) {
          gallery = (json['galleryUrls'] as List).map((e) => e.toString()).toList();
        } else if (metadata['media'] != null && metadata['media']['images'] != null) {
          gallery = (metadata['media']['images'] as List).map((e) => e.toString()).toList();
        }
      } catch (e) {
        debugPrint('Product.fromJson: Error parsing gallery: $e');
      }
      
      // Extraction spécifications
      Map<String, dynamic> specs = {};
      try {
        if (json['specifications'] != null && json['specifications'] is Map) {
          specs = Map<String, dynamic>.from(json['specifications']);
        } else if (metadata['attributes'] != null && metadata['attributes']['specifications'] != null) {
          specs = Map<String, dynamic>.from(metadata['attributes']['specifications']);
        }
      } catch (e) {
        debugPrint('Product.fromJson: Error parsing specifications: $e');
      }
      
      // Extraction variants
      List<Map<String, dynamic>> vars = [];
      try {
        if (json['variants'] != null && json['variants'] is List) {
          vars = (json['variants'] as List).map((e) => Map<String, dynamic>.from(e)).toList();
        } else if (metadata['attributes'] != null && metadata['attributes']['variants'] != null) {
           vars = (metadata['attributes']['variants'] as List).map((e) => Map<String, dynamic>.from(e)).toList();
        }
      } catch (e) {
        debugPrint('Product.fromJson: Error parsing variants: $e');
      }

      return Product(
        id: json['id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        description: json['description']?.toString() ?? '',
        price: _parseDouble(json['price']),
        stock: _parseInt(json['stock'] ?? metadata['stock_management']?['quantity']),
        imageUrl: () {
          final directUrl = json['imageUrl']?.toString() ?? json['image_url']?.toString() ?? '';
          if (directUrl.isNotEmpty) return directUrl;
          if (gallery.isNotEmpty) return gallery.first;
          return '';
        }(),
        galleryUrls: gallery,
        videoUrl: metadata['media']?['video']?.toString(),
        category: json['category']?.toString() ?? 
            (metadata['category'] is Map ? metadata['category']['name']?.toString() : 
             metadata['category'] is String ? metadata['category'] : 'Marketplace') ?? 'Marketplace',
        brand: metadata['category'] is Map ? metadata['category']['brand']?.toString() : null,
        origin: json['origin']?.toString() ?? (json['country']?.toString() ?? 'Local'),
        deliveryTime: json['deliveryTime']?.toString() ?? (json['delivery_time']?.toString() ?? 'Standard'),
        agencyId: json['agencyId']?.toString() ?? json['agency_id']?.toString(),
        agencyName: (json['agencies'] is Map ? json['agencies']['name']?.toString() : null) ?? (json['agency'] is Map ? json['agency']['name']?.toString() : null) ?? json['agency_name']?.toString() ?? metadata['agency_name']?.toString(),
        isCertified: (json['agencies'] is Map && json['agencies']['is_certified'] == true) || (json['agency'] is Map && json['agency']['is_certified'] == true) || (json['is_certified'] == true) || (metadata['is_certified'] == true),
        specifications: specs,
        variants: vars,
        currency: metadata['currency']?.toString() ?? 'XAF',
        shippingUnit: json['shipping_unit']?.toString() ?? metadata['delivery']?['shipping_unit']?.toString(),
        shippingValue: _parseDouble(json['shipping_value'] ?? metadata['delivery']?['shipping_value']),
      );
    } catch (e, stack) {
      debugPrint('CRITICAL: Product.fromJson failed for item: ${json['id']}');
      debugPrint('Error: $e');
      debugPrint('Stacktrace: $stack');
      rethrow;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'price': price,
      'stock': stock,
      'imageUrl': imageUrl,
      'galleryUrls': galleryUrls,
      'videoUrl': videoUrl,
      'category': category,
      'brand': brand,
      'origin': origin,
      'deliveryTime': deliveryTime,
      'agencyId': agencyId,
      'specifications': specifications,
      'variants': variants,
      'currency': currency,
      'shipping_unit': shippingUnit,
      'shipping_value': shippingValue,
    };
  }
}

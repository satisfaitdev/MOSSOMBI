class Product {
  final String id;
  final String name;
  final String description;
  final double price;
  final int stock;
  final String imageUrl;
  final List<String> galleryUrls;
  final String category;
  final String origin; // Local, Chine, Dubai, Turquie, France
  final String deliveryTime; // Temps estimé
  final String? agencyId; // Optional property to match with the agency
  final Map<String, dynamic> specifications;
  final List<Map<String, dynamic>> variants;

  Product({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.stock,
    required this.imageUrl,
    this.galleryUrls = const [],
    required this.category,
    required this.origin,
    required this.deliveryTime,
    this.agencyId,
    this.specifications = const {},
    this.variants = const [],
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
      category: category,
      origin: origin,
      deliveryTime: deliveryTime,
      agencyId: agencyId,
      specifications: Map.from(specifications),
      variants: List.from(variants),
    );
  }

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      description: json['description'] as String? ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      stock: json['stock'] as int? ?? 0,
      imageUrl: json['imageUrl'] as String? ?? '',
      galleryUrls: (json['galleryUrls'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      category: json['category'] as String? ?? '',
      origin: json['origin'] as String? ?? '',
      deliveryTime: json['deliveryTime'] as String? ?? '',
      agencyId: json['agencyId'] as String?,
      specifications: json['specifications'] != null ? Map<String, dynamic>.from(json['specifications']) : {},
      variants: (json['variants'] as List<dynamic>?)?.map((e) => Map<String, dynamic>.from(e)).toList() ?? [],
    );
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
      'category': category,
      'origin': origin,
      'deliveryTime': deliveryTime,
      'agencyId': agencyId,
      'specifications': specifications,
      'variants': variants,
    };
  }
}

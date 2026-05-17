import 'product_model.dart';

class CartItem {
  final Product product;
  int quantity;
  final String? selectedVariant;
  final String? selectedColor;
  final bool wantsLoan;

  CartItem({
    required this.product, 
    this.quantity = 1,
    this.selectedVariant,
    this.selectedColor,
    this.wantsLoan = false,
  });

  double get unitPrice {
    if (selectedVariant != null) {
      try {
        final variant = product.variants.firstWhere(
          (v) {
            String t = v['title']?.toString() ?? '';
            return t == selectedVariant || t.contains(selectedVariant!);
          },
          orElse: () => <String, dynamic>{},
        );
        if (variant.containsKey('price') && variant['price'] != null) {
          return double.tryParse(variant['price'].toString()) ?? product.price;
        }
      } catch (e) {
        return product.price;
      }
    }
    return product.price;
  }
}

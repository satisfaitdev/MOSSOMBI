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
}

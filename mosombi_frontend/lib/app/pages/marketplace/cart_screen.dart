import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:mosombi_frontend/core/providers/cart_provider.dart';
import 'package:mosombi_frontend/core/models/cart_item_model.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/product_image.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final Set<String> _expandedGroups = {};

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white.withValues(alpha: 0.5) : AppColors.textSecondaryLight;

    // Group items by product ID (base product)
    final Map<String, List<MapEntry<String, CartItem>>> grouped = {};
    for (var entry in cart.items.entries) {
      final baseId = entry.value.product.id;
      grouped.putIfAbsent(baseId, () => []).add(entry);
    }
    final groupList = grouped.entries.toList();

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: const MossombiAppBar(title: 'Mon Panier'),
      body: AnimatedGradientBg(
        isDark: isDark,
        child: cart.items.isEmpty
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.remove_shopping_cart_rounded, size: 80, color: hintColor),
                    const SizedBox(height: 16),
                    Text('Votre panier est vide', style: TextStyle(color: hintColor, fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF6C4EF6),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                      ),
                      onPressed: () => context.pop(),
                      child: const Text('Continuer mes achats', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ).animate().fade().scale(),
              )
            : Column(
                children: [
                  Expanded(
                    child: ListView.builder(
                      padding: EdgeInsets.only(top: MediaQuery.of(context).padding.top + AppBar().preferredSize.height + 20, left: 20, right: 20, bottom: 8),
                      physics: const BouncingScrollPhysics(),
                      itemCount: groupList.length,
                      itemBuilder: (ctx, i) {
                        final group = groupList[i];
                        final baseProductId = group.key;
                        final variants = group.value; // List<MapEntry<cartKey, CartItem>>
                        final firstItem = variants.first.value;
                        final isExpanded = _expandedGroups.contains(baseProductId);

                        // Totals for the group
                        int totalQty = 0;
                        double totalPrice = 0;
                        final colors = <String>{};
                        final variantNames = <String>{};
                        for (var v in variants) {
                          totalQty += v.value.quantity;
                          totalPrice += v.value.unitPrice * v.value.quantity;
                          if (v.value.selectedColor != null) colors.add(v.value.selectedColor!);
                          if (v.value.selectedVariant != null) variantNames.add(v.value.selectedVariant!);
                        }

                        return Container(
                          margin: const EdgeInsets.only(bottom: 16),
                          child: GlassContainer(
                            padding: const EdgeInsets.all(14),
                            child: variants.length == 1
                              // ─── CLASSIC single-item view ───
                              ? _buildSingleItemCard(variants.first, cart, textColor, hintColor)
                              // ─── GROUPED multi-variant view ───
                              : _buildGroupedCard(baseProductId, variants, isExpanded, isDark, cart, textColor, hintColor, totalQty, totalPrice, colors, variantNames),
                          ),
                        ).animate(delay: (i * 100).ms).fade().slideX();
                      },
                    ),
                  ),
                  
                  // Bottom Checkout Bar
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E1E2C) : Colors.white,
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
                      boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 20, offset: const Offset(0, -5))],
                    ),
                    child: SafeArea(
                      top: false,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Total (${cart.itemCount} articles)', style: TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.w600)),
                              Text('${cart.totalAmount.toStringAsFixed(0)} FCFA', style: TextStyle(color: textColor, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -1)),
                            ],
                          ),
                          const SizedBox(height: 20),
                          ElevatedButton(
                            onPressed: () => context.push('/checkout'),
                            style: ElevatedButton.styleFrom(
                              minimumSize: const Size(double.infinity, 56),
                              backgroundColor: const Color(0xFF00E5C5),
                              elevation: 10,
                              shadowColor: const Color(0xFF00E5C5).withValues(alpha: 0.4),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                            ),
                            child: const Text('Passer à la caisse', style: TextStyle(color: AppColors.bgDark1, fontWeight: FontWeight.w900, fontSize: 16)),
                          ).animate().scale(curve: Curves.elasticOut),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  // ─── Classic single-item card (original style) ───
  Widget _buildSingleItemCard(MapEntry<String, CartItem> entry, CartProvider cart, Color textColor, Color hintColor) {
    final item = entry.value;
    final cartKey = entry.key;

    Color? parsedColor;
    if (item.selectedColor != null) {
      try {
        final hex = item.selectedColor!.replaceAll('#', '');
        parsedColor = Color(int.parse(hex.length == 6 ? 'FF$hex' : hex, radix: 16));
      } catch (_) {
        parsedColor = Colors.grey;
      }
    }

    return Row(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: ProductImageHelper.buildImage(
            item.product.imageUrl,
            width: 80, height: 80, fit: BoxFit.cover,
            errorWidget: Container(width: 80, height: 80, color: Colors.grey[300]),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(item.product.name, style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 16), maxLines: 1, overflow: TextOverflow.ellipsis),
              if (item.selectedVariant != null) ...[
                const SizedBox(height: 2),
                Text('Modèle/Taille: ${item.selectedVariant}', style: TextStyle(color: hintColor, fontSize: 12)),
              ],
              if (parsedColor != null) ...[
                const SizedBox(height: 2),
                Row(children: [
                  Text('Couleur: ', style: TextStyle(color: hintColor, fontSize: 12)),
                  Container(
                    width: 12, height: 12,
                    decoration: BoxDecoration(color: parsedColor, shape: BoxShape.circle, border: Border.all(color: Colors.grey.withValues(alpha: 0.3))),
                  ),
                ]),
              ],
              if (item.wantsLoan) ...[
                const SizedBox(height: 2),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: AppColors.violet.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(4)),
                  child: const Text('Achat à crédit (Prêt)', style: TextStyle(color: AppColors.violet, fontSize: 10, fontWeight: FontWeight.bold)),
                ),
              ],
              const SizedBox(height: 4),
              Text('${item.unitPrice.toStringAsFixed(0)} FCFA', style: const TextStyle(color: Color(0xFF00E5C5), fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Row(
                children: [
                  InkWell(
                    onTap: () => cart.removeSingleItem(cartKey),
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(color: Colors.grey.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(8)),
                      child: Icon(Icons.remove, color: textColor, size: 16),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text('${item.quantity}', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(width: 12),
                  InkWell(
                    onTap: () => cart.addItem(item.product, selectedVariant: item.selectedVariant, selectedColor: item.selectedColor, wantsLoan: item.wantsLoan),
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(color: const Color(0xFF6C4EF6), borderRadius: BorderRadius.circular(8)),
                      child: const Icon(Icons.add, color: Colors.white, size: 16),
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent),
                    onPressed: () => cart.removeItem(cartKey),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ─── Grouped multi-variant card ───
  Widget _buildGroupedCard(String baseProductId, List<MapEntry<String, CartItem>> variants, bool isExpanded, bool isDark, CartProvider cart, Color textColor, Color hintColor, int totalQty, double totalPrice, Set<String> colors, Set<String> variantNames) {
    final firstItem = variants.first.value;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: ProductImageHelper.buildImage(
                firstItem.product.imageUrl,
                width: 72, height: 72, fit: BoxFit.cover,
                errorWidget: Container(width: 72, height: 72, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(12))),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(firstItem.product.name, style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 15), maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  if (variantNames.isNotEmpty)
                    Wrap(
                      spacing: 6, runSpacing: 4,
                      children: variantNames.map((v) => Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(color: AppColors.violet.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                        child: Text(v, style: const TextStyle(color: AppColors.violet, fontSize: 10, fontWeight: FontWeight.bold)),
                      )).toList(),
                    ),
                  if (variantNames.isNotEmpty) const SizedBox(height: 4),
                  if (colors.isNotEmpty)
                    Row(children: [
                      Text('Couleurs: ', style: TextStyle(color: hintColor, fontSize: 11)),
                      ...colors.map((c) {
                        Color parsed;
                        try { final hex = c.replaceAll('#', ''); parsed = Color(int.parse(hex.length == 6 ? 'FF$hex' : hex, radix: 16)); } catch (_) { parsed = Colors.grey; }
                        return Container(width: 14, height: 14, margin: const EdgeInsets.only(right: 4), decoration: BoxDecoration(color: parsed, shape: BoxShape.circle, border: Border.all(color: Colors.grey.withValues(alpha: 0.3), width: 1.5)));
                      }),
                    ]),
                  const SizedBox(height: 6),
                  Row(children: [
                    Text('${totalPrice.toStringAsFixed(0)} FCFA', style: const TextStyle(color: Color(0xFF00E5C5), fontWeight: FontWeight.bold, fontSize: 14)),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(color: AppColors.violet.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                      child: Text('x$totalQty', style: const TextStyle(color: AppColors.violet, fontWeight: FontWeight.w900, fontSize: 13)),
                    ),
                  ]),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(children: [
          GestureDetector(
            onTap: () => setState(() {
              if (isExpanded) _expandedGroups.remove(baseProductId);
              else _expandedGroups.add(baseProductId);
            }),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: isExpanded ? AppColors.violet.withValues(alpha: 0.15) : (isDark ? Colors.white.withValues(alpha: 0.06) : Colors.grey.withValues(alpha: 0.08)),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(isExpanded ? Icons.expand_less_rounded : Icons.expand_more_rounded, color: AppColors.violet, size: 16),
                const SizedBox(width: 4),
                Text(isExpanded ? 'Masquer' : 'Voir details (${variants.length})', style: const TextStyle(color: AppColors.violet, fontSize: 11, fontWeight: FontWeight.bold)),
              ]),
            ),
          ),
          const Spacer(),
          GestureDetector(
            onTap: () { for (var v in variants) cart.removeItem(v.key); },
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: Colors.redAccent.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
              child: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 20),
            ),
          ),
        ]),
        if (isExpanded) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withValues(alpha: 0.04) : Colors.grey.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Column(
              children: variants.asMap().entries.map((entry) {
                final idx = entry.key;
                final cartKey = entry.value.key;
                final item = entry.value.value;
                return Column(children: [
                  if (idx > 0) Divider(color: hintColor.withValues(alpha: 0.15), height: 16),
                  _buildVariantRow(item, cartKey, cart, textColor, hintColor),
                ]);
              }).toList(),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildVariantRow(CartItem item, String cartKey, CartProvider cart, Color textColor, Color hintColor) {
    Color? parsedColor;
    if (item.selectedColor != null) {
      try {
        final hex = item.selectedColor!.replaceAll('#', '');
        parsedColor = Color(int.parse(hex.length == 6 ? 'FF$hex' : hex, radix: 16));
      } catch (_) {
        parsedColor = Colors.grey;
      }
    }

    return Row(
      children: [
        // Color dot or variant icon
        if (parsedColor != null)
          Container(
            width: 18, height: 18,
            margin: const EdgeInsets.only(right: 10),
            decoration: BoxDecoration(color: parsedColor, shape: BoxShape.circle, border: Border.all(color: Colors.grey.withValues(alpha: 0.3), width: 1.5)),
          )
        else
          Container(
            width: 18, height: 18,
            margin: const EdgeInsets.only(right: 10),
            decoration: BoxDecoration(color: AppColors.violet.withValues(alpha: 0.15), shape: BoxShape.circle),
            child: const Icon(Icons.style_rounded, color: AppColors.violet, size: 10),
          ),
        
        // Variant info
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (item.selectedVariant != null)
                Text(item.selectedVariant!, style: TextStyle(color: textColor, fontSize: 12, fontWeight: FontWeight.w600)),
              Text('${item.unitPrice.toStringAsFixed(0)} F', style: TextStyle(color: hintColor, fontSize: 11)),
            ],
          ),
        ),

        // Quantity controls
        InkWell(
          onTap: () => cart.removeSingleItem(cartKey),
          child: Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(color: Colors.grey.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(6)),
            child: Icon(Icons.remove, color: textColor, size: 14),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Text('${item.quantity}', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 14)),
        ),
        InkWell(
          onTap: () => cart.addItem(item.product, selectedVariant: item.selectedVariant, selectedColor: item.selectedColor, wantsLoan: item.wantsLoan),
          child: Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(color: const Color(0xFF6C4EF6), borderRadius: BorderRadius.circular(6)),
            child: const Icon(Icons.add, color: Colors.white, size: 14),
          ),
        ),
        const SizedBox(width: 8),
        GestureDetector(
          onTap: () => cart.removeItem(cartKey),
          child: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 18),
        ),
      ],
    );
  }
}

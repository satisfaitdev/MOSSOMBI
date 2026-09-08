import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/theme/app_gradients.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/custom_button.dart';
import 'package:mosombi_frontend/core/widgets/custom_loader.dart';
import 'package:mosombi_frontend/core/providers/food_provider.dart';

class CartItem {
  final MenuItem menuItem;
  int quantity;
  String notes;

  CartItem({required this.menuItem, this.quantity = 1, this.notes = ''});
}

class RestaurantDetailScreen extends StatefulWidget {
  final String restaurantId;

  const RestaurantDetailScreen({super.key, required this.restaurantId});

  @override
  State<RestaurantDetailScreen> createState() => _RestaurantDetailScreenState();
}

class _RestaurantDetailScreenState extends State<RestaurantDetailScreen> {
  final List<CartItem> _cart = [];
  FoodItem? _restaurant;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FoodProvider>().fetchRestaurantMenu(widget.restaurantId);
      _loadRestaurantInfo();
    });
  }

  void _loadRestaurantInfo() {
    final fp = context.read<FoodProvider>();
    final found = fp.restaurants.where((r) => r.id == widget.restaurantId).firstOrNull;
    if (found != null) setState(() => _restaurant = found);
  }

  void _addToCart(MenuItem item) {
    setState(() {
      final existing = _cart.where((c) => c.menuItem.id == item.id).firstOrNull;
      if (existing != null) {
        existing.quantity++;
      } else {
        _cart.add(CartItem(menuItem: item));
      }
    });
  }

  void _removeFromCart(String itemId) {
    setState(() {
      _cart.removeWhere((c) => c.menuItem.id == itemId);
    });
  }

  void _updateQuantity(String itemId, int delta) {
    setState(() {
      final existing = _cart.where((c) => c.menuItem.id == itemId).firstOrNull;
      if (existing != null) {
        existing.quantity += delta;
        if (existing.quantity <= 0) _cart.remove(existing);
      }
    });
  }

  double get _cartTotal => _cart.fold(0, (sum, item) => sum + (item.menuItem.price * item.quantity));
  int get _cartCount => _cart.fold(0, (sum, item) => sum + item.quantity);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white.withValues(alpha: 0.5) : AppColors.textSecondaryLight;

    return Scaffold(
      extendBodyBehindAppBar: true,
      backgroundColor: Colors.transparent,
      body: AnimatedGradientBg(
        isDark: isDark,
        child: Consumer<FoodProvider>(
          builder: (context, fp, _) {
            if (fp.isLoading && fp.menuItems.isEmpty) {
              return const Center(child: MosombiLoader());
            }

            final menuItems = fp.menuItems;
            final categories = menuItems.map((m) => m.category).toSet().toList();
            final categoryLabels = {
              'entree': 'Entrées',
              'plat': 'Plats principaux',
              'dessert': 'Desserts',
              'boisson': 'Boissons',
            };

            return Stack(
              children: [
                CustomScrollView(
                  physics: const BouncingScrollPhysics(),
                  slivers: [
                    // Banner AppBar
                    SliverAppBar(
                      expandedHeight: 200,
                      floating: false,
                      pinned: true,
                      backgroundColor: Colors.transparent,
                      elevation: 0,
                      leading: Padding(
                        padding: const EdgeInsets.only(left: 16, top: 8),
                        child: IconButton(
                          icon: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.4),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20),
                          ),
                          onPressed: () => context.pop(),
                        ),
                      ),
                      flexibleSpace: FlexibleSpaceBar(
                        background: Stack(
                          fit: StackFit.expand,
                          children: [
                            if (_restaurant != null && _restaurant!.logo_url.isNotEmpty)
                              Image.network(_restaurant!.logo_url, fit: BoxFit.cover, errorBuilder: (_, __, ___) => Container(
                                decoration: BoxDecoration(gradient: AppGradients.primary),
                                child: Center(child: Text(_restaurant!.name[0].toUpperCase(), style: const TextStyle(color: Colors.white, fontSize: 60, fontWeight: FontWeight.bold))),
                              ))
                            else
                              Container(decoration: BoxDecoration(gradient: AppGradients.primary)),
                            Container(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [Colors.transparent, isDark ? AppColors.bgDark1 : AppColors.bgLight1],
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // Restaurant Info
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (_restaurant != null) ...[
                              Text(_restaurant!.name, style: TextStyle(color: textColor, fontSize: 28, fontWeight: FontWeight.w900)),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  const Icon(Icons.star_rounded, color: Color(0xFFFF9800), size: 20),
                                  const SizedBox(width: 4),
                                  Text(_restaurant!.rating, style: const TextStyle(color: Color(0xFFFF9800), fontWeight: FontWeight.bold, fontSize: 16)),
                                  const SizedBox(width: 16),
                                  const Icon(Icons.access_time_rounded, color: Colors.grey, size: 18),
                                  const SizedBox(width: 4),
                                  Text(_restaurant!.delivery_time, style: TextStyle(color: hintColor, fontSize: 14)),
                                  const SizedBox(width: 16),
                                  Icon(Icons.delivery_dining_rounded, color: _restaurant!.delivery_fee > 0 ? const Color(0xFFFF9800) : Colors.green, size: 18),
                                  const SizedBox(width: 4),
                                  Text(_restaurant!.delivery_fee > 0 ? '${_restaurant!.delivery_fee.toInt()}F' : 'Gratuit',
                                    style: TextStyle(color: _restaurant!.delivery_fee > 0 ? const Color(0xFFFF9800) : Colors.green, fontWeight: FontWeight.bold, fontSize: 14)),
                                ],
                              ),
                              if (_restaurant!.city.isNotEmpty) ...[
                                const SizedBox(height: 6),
                                Row(
                                  children: [
                                    Icon(Icons.location_on_rounded, color: hintColor, size: 16),
                                    const SizedBox(width: 4),
                                    Text('${_restaurant!.city}${_restaurant!.address.isNotEmpty ? ' • ${_restaurant!.address}' : ''}',
                                      style: TextStyle(color: hintColor, fontSize: 13)),
                                  ],
                                ),
                              ],
                            ],
                            const SizedBox(height: 16),
                            Divider(color: hintColor.withValues(alpha: 0.2)),
                          ],
                        ).animate().fade().slideY(begin: 0.1, end: 0),
                      ),
                    ),

                    // Menu by categories
                    if (menuItems.isEmpty)
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.all(40),
                          child: Column(
                            children: [
                              Icon(Icons.menu_book_outlined, size: 64, color: hintColor),
                              const SizedBox(height: 16),
                              Text('Menu non disponible', style: TextStyle(color: hintColor, fontSize: 16)),
                            ],
                          ).animate().fade(),
                        ),
                      )
                    else
                      ...categories.map((cat) {
                        final catItems = menuItems.where((m) => m.category == cat).toList();
                        return SliverToBoxAdapter(
                          child: Padding(
                            padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Padding(
                                  padding: const EdgeInsets.only(left: 4, bottom: 12, top: 8),
                                  child: Text(categoryLabels[cat] ?? cat.toUpperCase(),
                                    style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.w900)),
                                ),
                                ...catItems.map((item) => _buildMenuItem(item, textColor, hintColor, isDark)),
                              ],
                            ),
                          ),
                        );
                      }),

                    // Bottom padding for cart bar
                    const SliverToBoxAdapter(child: SizedBox(height: 100)),
                  ],
                ),

                // Bottom Cart Bar
                if (_cart.isNotEmpty)
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    child: _buildCartBar(textColor, hintColor, isDark),
                  ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildMenuItem(MenuItem item, Color textColor, Color hintColor, bool isDark) {
    final inCart = _cart.where((c) => c.menuItem.id == item.id).firstOrNull;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GlassContainer(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: item.image_url.isNotEmpty
                  ? Image.network(item.image_url, width: 72, height: 72, fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(width: 72, height: 72, color: AppColors.violet.withValues(alpha: 0.1), child: Icon(Icons.fastfood, color: AppColors.violet.withValues(alpha: 0.3))))
                  : Container(width: 72, height: 72, color: AppColors.violet.withValues(alpha: 0.1), child: Icon(Icons.fastfood, color: AppColors.violet.withValues(alpha: 0.3))),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item.name, style: TextStyle(color: textColor, fontWeight: FontWeight.w700, fontSize: 15)),
                  if (item.description.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(item.description, style: TextStyle(color: hintColor, fontSize: 12), maxLines: 2, overflow: TextOverflow.ellipsis),
                  ],
                  const SizedBox(height: 6),
                  Text('${item.price.toInt()} F', style: TextStyle(color: const Color(0xFFFF9800), fontWeight: FontWeight.w900, fontSize: 15)),
                ],
              ),
            ),
            const SizedBox(width: 8),
            if (inCart != null)
              Row(
                children: [
                  GestureDetector(
                    onTap: () => _updateQuantity(item.id, -1),
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(color: AppColors.violet.withValues(alpha: 0.2), shape: BoxShape.circle),
                      child: const Icon(Icons.remove_rounded, size: 16, color: Colors.white),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    child: Text('${inCart.quantity}', style: TextStyle(color: textColor, fontWeight: FontWeight.w900, fontSize: 16)),
                  ),
                  GestureDetector(
                    onTap: () => _updateQuantity(item.id, 1),
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(color: AppColors.violet, shape: BoxShape.circle),
                      child: const Icon(Icons.add_rounded, size: 16, color: Colors.white),
                    ),
                  ),
                ],
              )
            else
              GestureDetector(
                onTap: () => _addToCart(item),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    gradient: AppGradients.primary,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.add_rounded, color: Colors.white, size: 20),
                ),
              ),
          ],
        ),
      ).animate().fade().slideX(begin: 0.05, end: 0),
    );
  }

  Widget _buildCartBar(Color textColor, Color hintColor, bool isDark) {
    return Container(
      padding: EdgeInsets.only(top: 12, bottom: MediaQuery.of(context).padding.bottom + 12, left: 20, right: 20),
      decoration: BoxDecoration(
        color: (isDark ? AppColors.surfaceDark : AppColors.surfaceLight).withValues(alpha: 0.95),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.15), blurRadius: 20, offset: const Offset(0, -4)),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('$_cartCount article${_cartCount > 1 ? 's' : ''}',
                  style: TextStyle(color: hintColor, fontSize: 12)),
                Text('${_cartTotal.toInt()} F', style: TextStyle(color: textColor, fontWeight: FontWeight.w900, fontSize: 20)),
              ],
            ),
          ),
          MosombiButton(
            onPressed: () => _showCheckoutSheet(context),
            text: 'Voir le panier',
            icon: Icons.shopping_bag_outlined,
          ),
        ],
      ),
    );
  }

  void _showCheckoutSheet(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white.withValues(alpha: 0.5) : AppColors.textSecondaryLight;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.75,
          decoration: BoxDecoration(
            color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              Container(
                margin: const EdgeInsets.symmetric(vertical: 12),
                width: 40, height: 4,
                decoration: BoxDecoration(color: hintColor.withValues(alpha: 0.3), borderRadius: BorderRadius.circular(2)),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Votre commande', style: TextStyle(color: textColor, fontSize: 20, fontWeight: FontWeight.w900)),
                    GestureDetector(
                      onTap: () => Navigator.pop(ctx),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(color: hintColor.withValues(alpha: 0.15), shape: BoxShape.circle),
                        child: Icon(Icons.close_rounded, color: textColor, size: 20),
                      ),
                    ),
                  ],
                ),
              ),
              Divider(color: hintColor.withValues(alpha: 0.2)),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  itemCount: _cart.length,
                  itemBuilder: (_, i) {
                    final item = _cart[i];
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(item.menuItem.name, style: TextStyle(color: textColor, fontWeight: FontWeight.w700, fontSize: 15)),
                                Text('${item.menuItem.price.toInt()} F × ${item.quantity}', style: TextStyle(color: hintColor, fontSize: 13)),
                              ],
                            ),
                          ),
                          Text('${(item.menuItem.price * item.quantity).toInt()} F', style: TextStyle(color: textColor, fontWeight: FontWeight.w900, fontSize: 16)),
                          const SizedBox(width: 12),
                          GestureDetector(
                            onTap: () => setState(() { _removeFromCart(item.menuItem.id); if (_cart.isEmpty) Navigator.pop(ctx); }),
                            child: Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 20),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Total', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.w700)),
                        Text('${_cartTotal.toInt()} F', style: TextStyle(color: const Color(0xFFFF9800), fontSize: 22, fontWeight: FontWeight.w900)),
                      ],
                    ),
                    const SizedBox(height: 16),
                    MosombiButton(
                      onPressed: () async {
                        Navigator.pop(ctx);
                        _placeOrder();
                      },
                      text: 'Commander',
                      icon: Icons.check_circle_outline,
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _placeOrder() async {
    final fp = context.read<FoodProvider>();
    final items = _cart.map((c) => FoodOrderItem(
      menu_item_id: c.menuItem.id,
      name: c.menuItem.name,
      quantity: c.quantity,
      price: c.menuItem.price,
    )).toList();

    final result = await fp.placeOrder(
      restaurantId: widget.restaurantId,
      items: items,
      totalAmount: _cartTotal,
    );

    if (result != null && mounted) {
      setState(() => _cart.clear());
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Commande passée avec succès !'),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Erreur lors de la commande'),
          backgroundColor: Colors.redAccent,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    }
  }
}

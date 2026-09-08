import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:mosombi_frontend/core/providers/food_provider.dart';
import 'package:mosombi_frontend/core/widgets/custom_loader.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

class FoodScreen extends StatefulWidget {
  const FoodScreen({super.key});

  @override
  State<FoodScreen> createState() => _FoodScreenState();
}

class _FoodScreenState extends State<FoodScreen> {
  final _searchCtrl = TextEditingController();
  String? _selectedCategory;

  final List<Map<String, String>> _categories = [
    {'emoji': '🍕', 'label': 'Tout'},
    {'emoji': '🥗', 'label': 'Healthy'},
    {'emoji': '🍔', 'label': 'Fast Food'},
    {'emoji': '🍣', 'label': 'Sushi'},
    {'emoji': '🍝', 'label': 'Local'},
    {'emoji': '🥘', 'label': 'Africain'},
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FoodProvider>().fetchRestaurants();
    });
  }

  void _showErrorIfAny(FoodProvider fp) {
    final err = fp.error;
    if (err != null && err.isNotEmpty && mounted) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(err),
              backgroundColor: Colors.redAccent,
              behavior: SnackBarBehavior.floating,
              action: SnackBarAction(
                label: 'Réessayer',
                textColor: Colors.white,
                onPressed: () => context.read<FoodProvider>().fetchRestaurants(),
              ),
            ),
          );
        }
      });
    }
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

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
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            MossombiHeaderType2(
              title: 'Food Delivery 🍔',
              actionIcon: const Icon(Icons.receipt_long_rounded, color: Colors.white, size: 18),
              onActionTap: () => context.push('/food/orders'),
            ),

            // Search Bar
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 10, 20, 10),
                child: GlassContainer(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  child: TextField(
                    controller: _searchCtrl,
                    onChanged: (_) => _searchRestaurants(),
                    style: TextStyle(color: textColor, fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'Restaurant, plat...',
                      hintStyle: TextStyle(color: hintColor, fontSize: 14),
                      border: InputBorder.none,
                      prefixIcon: Icon(Icons.search_rounded, color: hintColor, size: 22),
                      suffixIcon: _searchCtrl.text.isNotEmpty
                          ? IconButton(
                              icon: Icon(Icons.clear_rounded, color: hintColor, size: 18),
                              onPressed: () { _searchCtrl.clear(); _searchRestaurants(); },
                            )
                          : null,
                    ),
                  ),
                ).animate().fade(duration: 500.ms).slideY(begin: 0.2, end: 0),
              ),
            ),

            // Hero Banner
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: Container(
                  height: 140,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    image: const DecorationImage(
                       image: NetworkImage('https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1000'),
                       fit: BoxFit.cover,
                    ),
                    boxShadow: [
                      BoxShadow(color: const Color(0xFFFF9800).withValues(alpha: 0.3), blurRadius: 15, offset: const Offset(0, 8))
                    ]
                  ),
                  child: Stack(
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(24),
                          gradient: const LinearGradient(
                            colors: [Colors.black87, Colors.transparent],
                            begin: Alignment.centerLeft,
                            end: Alignment.centerRight,
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFF9800),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Text('PROMO MIDI', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                            ),
                            const SizedBox(height: 8),
                            const Text('Livraison\nGratuite', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, height: 1.1)),
                          ],
                        ),
                      )
                    ],
                  ),
                ).animate().fade(delay: 200.ms).slideX(begin: 0.1, end: 0),
              ),
            ),

            // Categories
            SliverToBoxAdapter(
              child: SizedBox(
                 height: 90,
                 child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    physics: const BouncingScrollPhysics(),
                    children: _categories.map((cat) {
                      final isSelected = _selectedCategory == cat['label'] || (cat['label'] == 'Tout' && _selectedCategory == null);
                      return _buildFilterChip('${cat['emoji']} ${cat['label']}', isSelected, textColor, () {
                        setState(() {
                          _selectedCategory = cat['label'] == 'Tout' ? null : cat['label'];
                        });
                        context.read<FoodProvider>().fetchRestaurants(category: _selectedCategory);
                      });
                    }).toList().animate(interval: 50.ms, delay: 300.ms).fade().scale(curve: Curves.elasticOut),
                 ),
              ),
            ),

            // Section title
            SliverToBoxAdapter(
               child: Padding(
                 padding: const EdgeInsets.only(left: 24, top: 16, bottom: 16),
                 child: Text('Populaire près de vous', style: TextStyle(color: textColor, fontSize: 20, fontWeight: FontWeight.w900)),
               ).animate().fade(delay: 400.ms),
            ),

            // Restaurants List
            Consumer<FoodProvider>(
              builder: (context, fp, _) {
                _showErrorIfAny(fp);
                if (fp.isLoading) {
                  return const SliverToBoxAdapter(
                    child: Padding(
                      padding: EdgeInsets.all(32),
                      child: MosombiLoader(),
                    ),
                  );
                }
                if (fp.restaurants.isEmpty) {
                  return SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.all(40),
                      child: Column(
                        children: [
                          Icon(Icons.restaurant_outlined, size: 64, color: hintColor),
                          const SizedBox(height: 16),
                          Text('Aucun restaurant trouvé', style: TextStyle(color: hintColor, fontSize: 16, fontWeight: FontWeight.w600)),
                        ],
                      ).animate().fade(),
                    ),
                  );
                }
                return SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  sliver: SliverList(
                     delegate: SliverChildBuilderDelegate(
                        (context, index) {
                           final r = fp.restaurants[index];
                           return _buildRestaurantCard(r, textColor, hintColor, isDark).animate(delay: (400 + index*100).ms).fade().slideY(begin: 0.1, end: 0);
                        },
                        childCount: fp.restaurants.length,
                     )
                  ),
                );
              },
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 60)),
          ],
        ),
      ),
    );
  }

  void _searchRestaurants() {
    context.read<FoodProvider>().fetchRestaurants(search: _searchCtrl.text);
  }

  Widget _buildFilterChip(String label, bool isSelected, Color textColor, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(right: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFFF9800) : Colors.white.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? const Color(0xFFFF9800) : Colors.transparent),
          boxShadow: isSelected ? [BoxShadow(color: const Color(0xFFFF9800).withValues(alpha: 0.3), blurRadius: 8, offset: const Offset(0, 4))] : [],
        ),
        alignment: Alignment.center,
        child: Text(label, style: TextStyle(
          color: isSelected ? Colors.white : textColor,
          fontWeight: FontWeight.bold,
          fontSize: 14,
        )),
      ),
    );
  }

  Widget _buildRestaurantCard(FoodItem r, Color textColor, Color hintColor, bool isDark) {
    return GestureDetector(
      onTap: () => context.push('/food/restaurant/${r.id}'),
      child: Container(
        margin: const EdgeInsets.only(bottom: 24),
        child: GlassContainer(
          padding: const EdgeInsets.all(0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                height: 160,
                width: double.infinity,
                child: ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      Image.network(r.logo_url, fit: BoxFit.cover, errorBuilder: (_, __, ___) => Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [AppColors.violet.withValues(alpha: 0.3), AppColors.coral.withValues(alpha: 0.2)],
                          ),
                        ),
                        child: Center(child: Text(r.name[0].toUpperCase(), style: TextStyle(color: Colors.white70, fontSize: 48, fontWeight: FontWeight.bold))),
                      )),
                      if (!r.is_open)
                        Positioned.fill(
                          child: Container(
                            color: Colors.black54,
                            child: const Center(child: Text('FERMÉ', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: 2))),
                          ),
                        ),
                      Positioned(
                        top: 12,
                        right: 12,
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                          child: const Icon(Icons.favorite_border_rounded, size: 18, color: Colors.black87),
                        ),
                      ),
                      Positioned(
                        bottom: 12,
                        right: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.access_time_rounded, size: 12, color: Colors.black87),
                              const SizedBox(width: 4),
                              Text(r.delivery_time, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12, color: Colors.black87)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(r.name, style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.w900), overflow: TextOverflow.ellipsis),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                          decoration: BoxDecoration(color: const Color(0xFFFF9800), borderRadius: BorderRadius.circular(8)),
                          child: Row(
                            children: [
                              const Icon(Icons.star_rounded, color: Colors.white, size: 14),
                              const SizedBox(width: 4),
                              Text(r.rating, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                            ],
                          ),
                        )
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(r.cuisine, style: TextStyle(color: hintColor, fontSize: 13, fontWeight: FontWeight.w500)),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        const Icon(Icons.delivery_dining_rounded, color: Color(0xFFFF9800), size: 18),
                        const SizedBox(width: 6),
                        Text(r.delivery_fee > 0 ? 'Livraison ${r.delivery_fee.toInt()}F' : 'Livraison Gratuite',
                          style: const TextStyle(color: Color(0xFFFF9800), fontWeight: FontWeight.w800, fontSize: 13)),
                        const Spacer(),
                        Text(r.city, style: TextStyle(color: hintColor, fontSize: 12)),
                      ],
                    )
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

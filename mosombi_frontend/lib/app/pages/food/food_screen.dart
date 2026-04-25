import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';

class FoodScreen extends StatelessWidget {
  const FoodScreen({super.key});

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
            // App Bar
            MossombiSliverAppBar(
              title: 'Food Delivery 🍔',
              actionIcon: const Icon(Icons.shopping_bag_outlined, color: Colors.white, size: 18),
              onActionTap: () {},
            ),
            
            // Search Bar & Filter
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 10, 20, 10),
                child: Row(
                  children: [
                    Expanded(
                      child: GlassContainer(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        child: Row(
                          children: [
                            Icon(Icons.search_rounded, color: hintColor),
                            const SizedBox(width: 10),
                            Expanded(child: Text('Restaurant, plat...', style: TextStyle(color: hintColor, fontSize: 14))),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    GlassContainer(
                      padding: const EdgeInsets.all(12),
                      child: const Icon(Icons.tune_rounded, color: Colors.white, size: 24),
                    ),
                  ],
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

            // Fast categories
            SliverToBoxAdapter(
              child: SizedBox(
                 height: 90,
                 child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    physics: const BouncingScrollPhysics(),
                    children: [
                       _buildFilterChip('🍕 Pizza', true, textColor),
                       _buildFilterChip('🥗 Healthy', false, textColor),
                       _buildFilterChip('🍔 Fast Food', false, textColor),
                       _buildFilterChip('🍣 Sushi', false, textColor),
                       _buildFilterChip('🍝 Local', false, textColor),
                    ].animate(interval: 50.ms, delay: 300.ms).fade().scale(curve: Curves.elasticOut),
                 ),
              ),
            ),

            // Restaurants List
            SliverToBoxAdapter(
               child: Padding(
                 padding: const EdgeInsets.only(left: 24, top: 16, bottom: 16),
                 child: Text('Populaire près de vous', style: TextStyle(color: textColor, fontSize: 20, fontWeight: FontWeight.w900)),
               ).animate().fade(delay: 400.ms),
            ),

            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              sliver: SliverList(
                 delegate: SliverChildBuilderDelegate(
                    (context, index) {
                       return _buildRestaurantCard(index, textColor, hintColor).animate(delay: (400 + index*100).ms).fade().slideY(begin: 0.1, end: 0);
                    },
                    childCount: 4,
                 )
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 60)),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label, bool isSelected, Color textColor) {
    return Container(
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
    );
  }

  Widget _buildRestaurantCard(int index, Color textColor, Color hintColor) {
    final restaurants = [
      {'name': 'Gourmet Burger', 'desc': 'Américain • Fast Food', 'rating': '4.8', 'time': '15-25 min', 'fee': 'Livraison 500F', 'img': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600'},
      {'name': 'Pizza Napolitana', 'desc': 'Italien • Pizzeria', 'rating': '4.5', 'time': '30-40 min', 'fee': 'Gratuit', 'img': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600'},
      {'name': 'Sushi Master', 'desc': 'Japonais • Asiatique', 'rating': '4.9', 'time': '20-30 min', 'fee': 'Livraison 1000F', 'img': 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=600'},
      {'name': 'Le Tacos Mexicain', 'desc': 'Mexicain • Épicé', 'rating': '4.2', 'time': '10-20 min', 'fee': 'Livraison 500F', 'img': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=600'},
    ];
    final r = restaurants[index % restaurants.length];

    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      child: GlassContainer(
        padding: const EdgeInsets.all(0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            SizedBox(
              height: 160,
              width: double.infinity,
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Image.network(r['img']!, fit: BoxFit.cover, errorBuilder: (_, __, ___) => Container(color: AppColors.violet.withValues(alpha: 0.1))),
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
                        child: Text(r['time']!, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12, color: Colors.black87)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // Info
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(r['name']!, style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.w900)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                        decoration: BoxDecoration(color: const Color(0xFFFF9800), borderRadius: BorderRadius.circular(8)),
                        child: Row(
                          children: [
                            const Icon(Icons.star_rounded, color: Colors.white, size: 14),
                            const SizedBox(width: 4),
                            Text(r['rating']!, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                          ],
                        ),
                      )
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(r['desc']!, style: TextStyle(color: hintColor, fontSize: 13, fontWeight: FontWeight.w500)),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Icon(Icons.delivery_dining_rounded, color: Color(0xFFFF9800), size: 18),
                      const SizedBox(width: 6),
                      Text(r['fee']!, style: const TextStyle(color: Color(0xFFFF9800), fontWeight: FontWeight.w800, fontSize: 13)),
                    ],
                  )
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

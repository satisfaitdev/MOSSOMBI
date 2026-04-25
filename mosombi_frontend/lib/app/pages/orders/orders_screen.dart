import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

class OrdersScreen extends StatelessWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    
    final List<Map<String, dynamic>> orders = [
      {
        'title': 'Course VTC - Bonamoussadi',
        'type': 'Transport',
        'date': 'Aujourd\'hui, 10:30',
        'price': '2 500 FCFA',
        'status': 'En cours',
        'icon': Icons.directions_car_rounded,
        'color': const Color(0xFFFF6584)
      },
      {
        'title': 'Burger King - Menu XL',
        'type': 'Food',
        'date': 'Hier, 19:45',
        'price': '8 500 FCFA',
        'status': 'Livré',
        'icon': Icons.fastfood_rounded,
        'color': const Color(0xFFFF9800)
      },
      {
        'title': 'Nike Air Max 270',
        'type': 'Marketplace',
        'date': '24 Mars, 14:20',
        'price': '45 000 FCFA',
        'status': 'Expédié',
        'icon': Icons.shopping_bag_rounded,
        'color': const Color(0xFF6C4EF6)
      },
      {
        'title': 'Recharge Compte',
        'type': 'Fintech',
        'date': '22 Mars, 09:00',
        'price': '+ 10 000 FCFA',
        'status': 'Réussi',
        'icon': Icons.account_balance_wallet_rounded,
        'color': const Color(0xFF00E5C5)
      },
    ];

    return SafeArea(
      bottom: false,
      child: CustomScrollView(
        slivers: [
          SliverAppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            floating: true,
            title: Text('Vos Commandes', style: TextStyle(color: textColor, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
            centerTitle: false,
          ),
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final order = orders[index];
                  final isPending = order['status'] == 'En cours' || order['status'] == 'Expédié';
                  
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: GlassContainer(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Container(
                            width: 54,
                            height: 54,
                            decoration: BoxDecoration(
                              color: order['color'].withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Icon(order['icon'], color: order['color'], size: 28),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(order['title'], style: TextStyle(
                                  color: textColor,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                )),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Text(order['type'], style: TextStyle(color: order['color'], fontWeight: FontWeight.bold, fontSize: 12)),
                                    const SizedBox(width: 8),
                                    Text('•  ${order['date']}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(order['price'], style: TextStyle(
                                color: textColor,
                                fontSize: 13,
                                fontWeight: FontWeight.w900,
                              )),
                              const SizedBox(height: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: isPending ? AppColors.violet.withValues(alpha: 0.15) : Colors.green.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(order['status'], style: TextStyle(
                                  color: isPending ? AppColors.violet : Colors.green,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                )),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ).animate(delay: (100 * index).ms).fade().slideX(begin: 0.1, end: 0, curve: Curves.easeOut),
                  );
                },
                childCount: orders.length,
              ),
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 120)), // Space for NavBar
        ],
      ),
    );
  }
}

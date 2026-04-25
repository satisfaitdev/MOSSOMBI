import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../../core/providers/notification_provider.dart';
import '../../../core/models/notification_model.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/glass_container.dart';
import '../../../core/widgets/custom_app_bars.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  int _selectedFilter = 0; // 0: All, 1: Transport, 2: Marketplace, 3: Fintech

  Widget _buildFilterChip(String label, int index, Color color) {
    final isSelected = _selectedFilter == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedFilter = index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        margin: const EdgeInsets.only(right: 8),
        decoration: BoxDecoration(
          color: isSelected ? color.withValues(alpha: 0.2) : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? color : Colors.grey.withValues(alpha: 0.3)),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? color : Colors.grey,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  IconData _getIconForCategory(NotificationCategory cat) {
    switch(cat) {
      case NotificationCategory.transport: return Icons.directions_car_rounded;
      case NotificationCategory.marketplace: return Icons.shopping_bag_rounded;
      case NotificationCategory.fintech: return Icons.account_balance_wallet_rounded;
      case NotificationCategory.system: return Icons.info_rounded;
    }
  }

  Color _getColorForCategory(NotificationCategory cat) {
    switch(cat) {
      case NotificationCategory.transport: return const Color(0xFFFF6584);
      case NotificationCategory.marketplace: return const Color(0xFF6C4EF6);
      case NotificationCategory.fintech: return const Color(0xFF00E5C5);
      case NotificationCategory.system: return const Color(0xFFFF9800);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white.withValues(alpha: 0.5) : AppColors.textSecondaryLight;

    return Consumer<NotificationProvider>(
      builder: (context, notifProvider, child) {
        // Filter logic
        var filteredList = notifProvider.notifications;
        if (_selectedFilter == 1) {
          filteredList = filteredList.where((n) => n.category == NotificationCategory.transport).toList();
        } else if (_selectedFilter == 2) {
          filteredList = filteredList.where((n) => n.category == NotificationCategory.marketplace).toList();
        } else if (_selectedFilter == 3) {
          filteredList = filteredList.where((n) => n.category == NotificationCategory.fintech).toList();
        }

        return SafeArea(
          bottom: false,
          child: CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              SliverAppBar(
                backgroundColor: Colors.transparent,
                elevation: 0,
                floating: true,
                title: Text('Alertes', style: TextStyle(color: textColor, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
                centerTitle: false,
                actions: [
                  if (notifProvider.unreadCount > 0)
                    IconButton(
                      icon: const Icon(Icons.done_all_rounded, color: Color(0xFF00E5C5)),
                      onPressed: () => notifProvider.markAllAsRead(),
                    ),
                ],
              ),
              
              // Filters
              SliverToBoxAdapter(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  physics: const BouncingScrollPhysics(),
                  child: Row(
                    children: [
                      _buildFilterChip('Tout', 0, const Color(0xFF00E5C5)),
                      _buildFilterChip('Transport', 1, const Color(0xFFFF6584)),
                      _buildFilterChip('Commandes', 2, const Color(0xFF6C4EF6)),
                      _buildFilterChip('Finances', 3, const Color(0xFF00E5C5)),
                    ],
                  ),
                ),
              ),

              // Empty or List
              if (filteredList.isEmpty)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.notifications_off_rounded, size: 80, color: hintColor.withValues(alpha: 0.2)),
                        const SizedBox(height: 16),
                        Text('Aucune notification', style: TextStyle(color: hintColor, fontSize: 16)),
                      ],
                    ).animate().fade(),
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final notif = filteredList[index];
                        final iconC = _getColorForCategory(notif.category);

                        return Dismissible(
                          key: ValueKey(notif.id),
                          direction: DismissDirection.endToStart,
                          onDismissed: (_) {
                            notifProvider.deleteNotification(notif.id);
                          },
                          background: Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.only(right: 24),
                            decoration: BoxDecoration(
                              color: Colors.redAccent,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            alignment: Alignment.centerRight,
                            child: const Icon(Icons.delete_sweep_rounded, color: Colors.white, size: 28),
                          ),
                          child: GestureDetector(
                            onTap: () => notifProvider.markAsRead(notif.id),
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              child: GlassContainer(
                                padding: const EdgeInsets.all(16),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Stack(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.all(12),
                                          decoration: BoxDecoration(
                                            color: iconC.withValues(alpha: notif.isRead ? 0.05 : 0.15),
                                            shape: BoxShape.circle,
                                          ),
                                          child: Icon(_getIconForCategory(notif.category), color: iconC, size: 24),
                                        ),
                                        if (!notif.isRead)
                                          Positioned(
                                            right: 0,
                                            top: 0,
                                            child: Container(
                                              width: 12,
                                              height: 12,
                                              decoration: BoxDecoration(
                                                color: Colors.redAccent,
                                                shape: BoxShape.circle,
                                                border: Border.all(color: isDark ? AppColors.bgDark1 : Colors.white, width: 2),
                                              ),
                                            ),
                                          ),
                                      ],
                                    ),
                                    const SizedBox(width: 16),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Expanded(child: Text(notif.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: textColor, fontWeight: notif.isRead ? FontWeight.w600 : FontWeight.w900, fontSize: 16))),
                                              Text(DateFormat('HH:mm').format(notif.date), style: TextStyle(color: hintColor, fontSize: 12)),
                                            ],
                                          ),
                                          const SizedBox(height: 8),
                                          Text(notif.message, style: TextStyle(color: notif.isRead ? hintColor : textColor.withValues(alpha: 0.8), fontSize: 13, height: 1.4)),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ).animate(delay: (index * 50).ms).fade().slideX(begin: 0.1, end: 0);
                      },
                      childCount: filteredList.length,
                    ),
                  ),
                ),
                
              const SliverToBoxAdapter(child: SizedBox(height: 120)), // Space for Bottom nav
            ],
          ),
        );
      },
    );
  }
}

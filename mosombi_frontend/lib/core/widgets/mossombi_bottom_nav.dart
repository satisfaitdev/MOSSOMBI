import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/providers/notification_provider.dart';

class MossombiBottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  final bool isDark;

  const MossombiBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final items = [
      (Icons.home_rounded, Icons.home_outlined, 'Accueil'),
      (Icons.shopping_bag_rounded, Icons.shopping_bag_outlined, 'Commandes'),
      (Icons.notifications_rounded, Icons.notifications_outlined, 'Alertes'),
      (Icons.person_rounded, Icons.person_outlined, 'Profil'),
    ];

    return Consumer<NotificationProvider>(
      builder: (context, notifProvider, child) {
        return ClipRRect(
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(24),
            topRight: Radius.circular(24),
          ),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
            child: Container(
              padding: EdgeInsets.only(bottom: MediaQuery.of(context).padding.bottom + 8, top: 12),
              decoration: BoxDecoration(
                color: isDark ? AppColors.surfaceDark.withValues(alpha: 0.65) : Colors.white.withValues(alpha: 0.65),
                border: Border(top: BorderSide(color: Colors.white.withValues(alpha: 0.4), width: 1)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: List.generate(items.length, (i) {
                  final isActive = i == currentIndex;
                  final isNotifTab = i == 2;

                  return GestureDetector(
                    onTap: () => onTap(i),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.transparent,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Stack(
                            clipBehavior: Clip.none,
                            children: [
                              AnimatedSwitcher(
                                duration: const Duration(milliseconds: 250),
                                transitionBuilder: (child, anim) => ScaleTransition(scale: anim, child: child),
                                child: Icon(
                                  isActive ? items[i].$1 : items[i].$2,
                                  key: ValueKey(isActive),
                                  color: isActive ? AppColors.violet : (isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight),
                                  size: 26,
                                ),
                              ).animate(target: isActive ? 1 : 0)
                                  .moveY(end: -4, duration: 400.ms, curve: Curves.easeOutBack)
                                  .scale(end: const Offset(1.15, 1.15), duration: 400.ms, curve: Curves.easeOutBack),

                              if (isNotifTab && notifProvider.unreadCount > 0)
                                Positioned(
                                  right: -2,
                                  top: -2,
                                  child: Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: BoxDecoration(
                                      color: Colors.redAccent,
                                      shape: BoxShape.circle,
                                      border: Border.all(color: AppColors.bgDark1, width: 1.5),
                                    ),
                                    child: Text(
                                      notifProvider.unreadCount > 9 ? '9+' : '${notifProvider.unreadCount}',
                                      style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold),
                                    ),
                                  ).animate().scale(curve: Curves.elasticOut),
                                ),
                            ],
                          ),
                          if (isActive)
                            Text(items[i].$3,
                                style: const TextStyle(
                                  color: AppColors.violet,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                )).animate().fade(duration: 200.ms),
                        ],
                      ),
                    ),
                  );
                }),
              ),
            ),
          ),
        ).animate(delay: 500.ms).slideY(begin: 1, end: 0, duration: 400.ms, curve: Curves.easeOut);
      },
    );
  }
}

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/animated_gradient_bg.dart';
import '../../../core/widgets/custom_app_bars.dart';
import '../../../core/widgets/glass_container.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white70 : AppColors.textSecondaryLight;

    return Scaffold(
      appBar: const MossombiHeaderType3(title: 'Paramètres'),
      extendBodyBehindAppBar: true,
      backgroundColor: Colors.transparent,
      body: AnimatedGradientBg(
        isDark: isDark,
        child: SafeArea(
          child: ListView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            children: [
              const SizedBox(height: 16),
              Text('Mon Compte', style: TextStyle(color: hintColor, fontSize: 14, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              GlassContainer(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    _buildSettingItem(
                      context,
                      'Informations du Profil',
                      Icons.person_rounded,
                      textColor,
                      () => context.push('/profile/settings/profile'),
                    ),
                    Divider(color: hintColor.withValues(alpha: 0.1), height: 1),
                    _buildSettingItem(
                      context,
                      'Notifications',
                      Icons.notifications_active_rounded,
                      textColor,
                      () => context.push('/profile/settings/notifications'),
                    ),
                    Divider(color: hintColor.withValues(alpha: 0.1), height: 1),
                    _buildSettingItem(
                      context,
                      'Confidentialité',
                      Icons.lock_rounded,
                      textColor,
                      () => context.push('/profile/settings/privacy'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              Text('Sécurité', style: TextStyle(color: hintColor, fontSize: 14, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              GlassContainer(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    _buildSettingItem(
                      context,
                      'Sécurité & Mot de Passe',
                      Icons.shield_rounded,
                      textColor,
                      () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Le changement de mot de passe est géré automatiquement via la connexion biométrique.')),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSettingItem(
    BuildContext context,
    String title,
    IconData icon,
    Color textColor,
    VoidCallback onTap,
  ) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppColors.violet.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: AppColors.violet, size: 20),
      ),
      title: Text(title, style: TextStyle(color: textColor, fontWeight: FontWeight.w600, fontSize: 15)),
      trailing: Icon(Icons.arrow_forward_ios_rounded, color: textColor.withValues(alpha: 0.3), size: 14),
      onTap: onTap,
    );
  }
}

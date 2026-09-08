import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/theme/app_gradients.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart' hide Consumer;
import 'package:provider/provider.dart';
import 'package:mosombi_frontend/core/providers/agency_provider.dart';
import 'package:mosombi_frontend/core/providers/auth_provider.dart';
import 'package:go_router/go_router.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final agencyProvider = context.watch<AgencyProvider>();
    final authState = ref.watch(authProvider);
    final userName = authState.user?.fullName ?? 'Utilisateur';
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white.withValues(alpha: 0.5) : AppColors.textSecondaryLight;

    return SafeArea(
      bottom: false,
      child: RefreshIndicator(
        onRefresh: () async {
          await context.read<AgencyProvider>().checkMyAgencyContext();
        },
        color: AppColors.violet,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
          slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(24, 40, 24, 20),
              child: Column(
                children: [
                  // Avatar with pulse ring
                  Stack(
                    alignment: Alignment.center,
                    children: [
                      Container(
                        width: 110,
                        height: 110,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: AppColors.violet.withValues(alpha: 0.3), width: 2),
                        ),
                      ).animate(onPlay: (c) => c.repeat()).scale(begin: const Offset(1, 1), end: const Offset(1.3, 1.3), duration: 2.seconds).fade(end: 0),
                      
                      Container(
                        width: 90,
                        height: 90,
                        decoration: BoxDecoration(
                          gradient: AppGradients.primary,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.violet.withValues(alpha: 0.5),
                              blurRadius: 20,
                              offset: const Offset(0, 8),
                            )
                          ],
                        ),
                        child: const Icon(Icons.person, color: Colors.white, size: 48),
                      ),
                    ],
                  ).animate().scale(curve: Curves.easeOutBack, duration: 600.ms),
                  const SizedBox(height: 16),
                  
                  Text(
                    userName,
                    style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.5,
                  )).animate().fade(delay: 200.ms).slideY(begin: 0.2, end: 0),
                  const SizedBox(height: 8),

                  // Metadata (Country, Age, Numeric Code)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('🇨🇬 Congo', style: TextStyle(color: hintColor, fontSize: 14, fontWeight: FontWeight.bold)),
                      const SizedBox(width: 8),
                      Container(width: 4, height: 4, decoration: BoxDecoration(color: hintColor, shape: BoxShape.circle)),
                      const SizedBox(width: 8),
                      Text('24 ans', style: TextStyle(color: hintColor, fontSize: 14, fontWeight: FontWeight.bold)),
                      const SizedBox(width: 8),
                      Container(width: 4, height: 4, decoration: BoxDecoration(color: hintColor, shape: BoxShape.circle)),
                      const SizedBox(width: 8),
                      GestureDetector(
                        onTap: () {
                          final code = (authState.user?.userIdDisplay ?? "0000").replaceAll(RegExp(r'[^0-9]'), '');
                          Clipboard.setData(ClipboardData(text: code));
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Code copié !')));
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.violet.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                (authState.user?.userIdDisplay ?? "0000").replaceAll(RegExp(r'[^0-9]'), ''),
                                style: const TextStyle(color: AppColors.violet, fontSize: 13, fontWeight: FontWeight.w900, letterSpacing: 1),
                              ),
                              const SizedBox(width: 4),
                              const Icon(Icons.copy_rounded, color: AppColors.violet, size: 12),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ).animate().fade(delay: 250.ms).slideY(begin: 0.2, end: 0),

                  const SizedBox(height: 12),
                  
                  // Badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFF9800).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFFF9800).withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(Icons.stars_rounded, color: Color(0xFFFF9800), size: 16),
                        SizedBox(width: 6),
                        Text('Membre Gold', style: TextStyle(color: Color(0xFFFF9800), fontSize: 12, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ).animate().fade(delay: 300.ms).slideY(begin: 0.2, end: 0),
                ],
              ),
            ),
          ),



          // Main Setting Options (Row)
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            sliver: SliverToBoxAdapter(
              child: Row(
                children: [
                  Expanded(child: _buildQuickAction('Portefeuille', Icons.account_balance_wallet_rounded, const Color(0xFF00E5C5), textColor, onTap: () => context.push('/fintech'))),
                  const SizedBox(width: 8),
                  Expanded(child: _buildQuickAction('Sac à Dos', Icons.backpack_rounded, const Color(0xFF6C4EF6), textColor, onTap: () => context.push('/profile/backpack'))),
                  const SizedBox(width: 8),
                  Expanded(child: _buildQuickAction('Historique', Icons.history_rounded, const Color(0xFF6C4EF6), textColor, onTap: () => context.push('/fintech/cards'))),
                  const SizedBox(width: 8),
                  Expanded(child: _buildQuickAction('Agence', Icons.storefront_rounded, const Color(0xFF4CAF50), textColor, onTap: () {
                    if (agencyProvider.currentAgent == null || agencyProvider.currentAgency?.status == 'pending' || agencyProvider.currentAgent?.status == 'pending') {
                      context.read<AgencyProvider>().checkMyAgencyContext();
                    }
                    final a = context.read<AgencyProvider>();
                    final hasPending = a.currentAgency?.status == 'pending' || a.currentAgent?.status == 'pending';
                    final isManager = ['owner', 'sub_agent', 'admin', 'manager'].contains(a.roleInAgency);
                    if (hasPending) { context.push('/create-agency'); }
                    else if (a.currentAgent != null) { context.push(isManager ? '/agency-dashboard' : '/agent-dashboard'); }
                    else { context.push('/agency-onboarding'); }
                  })),
                ],
              ).animate(delay: 400.ms).fade().slideY(begin: 0.2, end: 0),
            ),
          ),

          // Settings List
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                const SizedBox(height: 12),
                Text('Préférences', style: TextStyle(color: hintColor, fontSize: 14, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                
                GlassContainer(
                  padding: EdgeInsets.zero,
                  child: Column(
                    children: [
                      _buildListTile(
                        'Paramètres',
                        Icons.settings_rounded,
                        textColor,
                        onTap: () => context.push('/profile/settings'),
                      ),
                      Divider(color: hintColor.withValues(alpha: 0.1), height: 1),
                      _buildListTile(
                        'Notifications',
                        Icons.notifications_active_rounded,
                        textColor,
                        onTap: () => context.push('/profile/settings/notifications'),
                      ),
                      Divider(color: hintColor.withValues(alpha: 0.1), height: 1),
                      _buildListTile('Langue', Icons.language_rounded, textColor, trailing: 'Français'),
                      Divider(color: hintColor.withValues(alpha: 0.1), height: 1),
                      _buildListTile('Thème Sombre', Icons.dark_mode_rounded, textColor, isSwitch: true, switchValue: isDark),
                    ],
                  ),
                ).animate(delay: 800.ms).fade().slideY(begin: 0.1, end: 0),

                const SizedBox(height: 24),
                Text('Support & Légal', style: TextStyle(color: hintColor, fontSize: 14, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                
                GlassContainer(
                  padding: EdgeInsets.zero,
                  child: Column(
                    children: [
                      _buildListTile('Aide et FAQ', Icons.help_rounded, textColor),
                      Divider(color: hintColor.withValues(alpha: 0.1), height: 1),
                      _buildListTile('Nous contacter', Icons.headset_mic_rounded, textColor),
                      Divider(color: hintColor.withValues(alpha: 0.1), height: 1),
                      _buildListTile('Conditions générales', Icons.description_rounded, textColor),
                    ],
                  ),
                ).animate(delay: 1000.ms).fade().slideY(begin: 0.1, end: 0),

                const SizedBox(height: 32),
                
                // Logout Button
                Center(
                  child: TextButton.icon(
                    onPressed: () async {
                      final confirm = await showDialog<bool>(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          backgroundColor: Theme.of(ctx).brightness == Brightness.dark
                              ? const Color(0xFF1E1E2C)
                              : Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          title: const Text('Déconnexion', style: TextStyle(fontWeight: FontWeight.bold)),
                          content: const Text('Êtes-vous sûr de vouloir vous déconnecter ?'),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(ctx, false),
                              child: const Text('Annuler', style: TextStyle(color: Colors.grey)),
                            ),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.redAccent,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              onPressed: () => Navigator.pop(ctx, true),
                              child: const Text('Déconnecter', style: TextStyle(color: Colors.white)),
                            ),
                          ],
                        ),
                      );
                      if (confirm == true && context.mounted) {
                        await ref.read(authProvider.notifier).logout();
                        if (context.mounted) context.go('/auth/login');
}

                    },
                    icon: const Icon(Icons.logout_rounded, color: Colors.redAccent),
                    label: const Text('Déconnexion', style: TextStyle(color: Colors.redAccent, fontSize: 16, fontWeight: FontWeight.bold)),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      backgroundColor: Colors.redAccent.withValues(alpha: 0.1),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                  ),
                ).animate(delay: 1100.ms).fade(),

                const SizedBox(height: 120), // Padding for BottomNav
              ]),
            ),
          ),
        ],
      ),
      ),
    );
  }

  Widget _buildQuickAction(String title, IconData icon, Color color, Color textColor, {VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: GlassContainer(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            Text(title, style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 11)),
          ],
        ),
      ),
    );
  }

  Widget _buildListTile(String title, IconData icon, Color textColor, {String? trailing, bool isSwitch = false, bool switchValue = false, VoidCallback? onTap}) {
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
      trailing: isSwitch
          ? Switch(
              value: switchValue,
              onChanged: (v) {},
              activeColor: AppColors.violet,
            )
          : Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (trailing != null) Text(trailing, style: TextStyle(color: textColor.withValues(alpha: 0.5), fontSize: 14)),
                if (trailing != null) const SizedBox(width: 8),
                Icon(Icons.arrow_forward_ios_rounded, color: textColor.withValues(alpha: 0.3), size: 14),
              ],
            ),
      onTap: onTap,
    );
  }

}

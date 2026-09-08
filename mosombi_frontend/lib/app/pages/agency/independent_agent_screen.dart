import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';

class IndependentAgentScreen extends StatefulWidget {
  const IndependentAgentScreen({super.key});

  @override
  State<IndependentAgentScreen> createState() => _IndependentAgentScreenState();
}

class _IndependentAgentScreenState extends State<IndependentAgentScreen> {
  bool _isOnline = true;
  final Map<String, bool> _services = {
    'chauffeur': false,
    'livreur': false,
    'demarcheur': false,
    'revendeur': false,
    'guichetier': false,
    'agent_controleur': false,
    'controleur_acces': false,
    'finance': false,
    'gestionnaire_stock': false,
  };

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white.withValues(alpha: 0.5) : AppColors.textSecondaryLight;

    return Scaffold(
      body: AnimatedGradientBg(
        isDark: isDark,
        child: SafeArea(
          bottom: false,
          child: CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
                  child: Row(
                    children: [
                      GestureDetector(
                        onTap: () => Navigator.pop(context),
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.violet.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.arrow_back_rounded, color: AppColors.violet),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Text(
                        'Agent Indépendant',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -0.5,
                          color: textColor,
                        ),
                      ),
                    ],
                  ).animate().fade(duration: 400.ms).slideX(begin: -0.1, end: 0),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  child: GlassContainer(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 60,
                              height: 60,
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [AppColors.violet, AppColors.coral],
                                ),
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.violet.withValues(alpha: 0.3),
                                    blurRadius: 10,
                                  ),
                                ],
                              ),
                              child: const Icon(Icons.person, color: Colors.white, size: 30),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Agent Mossombi',
                                    style: TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w900,
                                      color: AppColors.violet,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    _isOnline ? '🟢 En ligne' : '🔴 Hors-ligne',
                                    style: TextStyle(
                                      color: _isOnline ? Colors.green : Colors.red,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Switch(
                              value: _isOnline,
                              onChanged: (v) => setState(() => _isOnline = v),
                              activeColor: AppColors.violet,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ).animate().fade(duration: 500.ms).slideY(begin: 0.1, end: 0),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  child: Text(
                    'Services proposés',
                    style: TextStyle(color: hintColor, fontSize: 14, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 1,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final entry = _services.entries.elementAt(index);
                      return _buildServiceCard(entry.key, entry.value, textColor);
                    },
                    childCount: _services.length,
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  child: Column(
                    children: [
                      GlassContainer(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(Icons.group_add_rounded, color: AppColors.violet, size: 24),
                                const SizedBox(width: 12),
                                Text(
                                  'Rejoindre une Agence',
                                  style: TextStyle(
                                    color: textColor,
                                    fontSize: 16,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton.icon(
                                onPressed: () => context.push('/join-agency'),
                                icon: const Icon(Icons.qr_code_scanner_rounded),
                                label: const Text('Scanner QR Code'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.violet,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 12),
                            SizedBox(
                              width: double.infinity,
                              child: OutlinedButton.icon(
                                onPressed: () => context.push('/join-agency'),
                                icon: const Icon(Icons.keyboard_rounded),
                                label: const Text('Saisir un code'),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: AppColors.violet,
                                  side: const BorderSide(color: AppColors.violet),
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ).animate().fade(duration: 600.ms).slideY(begin: 0.1, end: 0),
                      const SizedBox(height: 16),
                      GlassContainer(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(Icons.trending_up_rounded, color: AppColors.mint, size: 24),
                                const SizedBox(width: 12),
                                Text(
                                  'Revenus & Commissions',
                                  style: TextStyle(
                                    color: textColor,
                                    fontSize: 16,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceAround,
                              children: [
                                _buildStat('0 FCFA', 'Aujourd\'hui', AppColors.mint),
                                _buildStat('0 FCFA', 'Cette semaine', AppColors.cyan),
                                _buildStat('0 FCFA', 'Ce mois', AppColors.coral),
                              ],
                            ),
                          ],
                        ),
                      ).animate().fade(duration: 700.ms).slideY(begin: 0.1, end: 0),
                      const SizedBox(height: 100),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildServiceCard(String key, bool selected, Color textColor) {
    final labels = {
      'chauffeur': 'Chauffeur',
      'livreur': 'Livreur',
      'demarcheur': 'Démarcheur',
      'revendeur': 'Revendeur',
      'guichetier': 'Guichetier',
      'agent_controleur': 'Contrôleur',
      'controleur_acces': 'Accès',
      'finance': 'Finance',
      'gestionnaire_stock': 'Stock',
    };

    final icons = {
      'chauffeur': Icons.directions_car_rounded,
      'livreur': Icons.delivery_dining_rounded,
      'demarcheur': Icons.handshake_rounded,
      'revendeur': Icons.redeem_rounded,
      'guichetier': Icons.receipt_long_rounded,
      'agent_controleur': Icons.verified_user_rounded,
      'controleur_acces': Icons.meeting_room_rounded,
      'finance': Icons.account_balance_rounded,
      'gestionnaire_stock': Icons.inventory_rounded,
    };

    return GestureDetector(
      onTap: () => setState(() => _services[key] = !selected),
      child: GlassContainer(
        padding: const EdgeInsets.all(8),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: selected
                    ? AppColors.violet
                    : AppColors.violet.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icons[key] ?? Icons.work_rounded,
                color: selected ? Colors.white : AppColors.violet,
                size: 20,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              labels[key] ?? key,
              style: TextStyle(
                color: textColor,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStat(String value, String label, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            color: color,
            fontSize: 16,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            color: Colors.grey,
            fontSize: 11,
          ),
        ),
      ],
    );
  }
}

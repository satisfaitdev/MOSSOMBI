import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:mosombi_frontend/core/providers/auth_provider.dart';
import 'package:mosombi_frontend/core/providers/agency_provider.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';

class AgencySettingsScreen extends ConsumerStatefulWidget {
  const AgencySettingsScreen({super.key});

  @override
  ConsumerState<AgencySettingsScreen> createState() => _AgencySettingsScreenState();
}

class _AgencySettingsScreenState extends ConsumerState<AgencySettingsScreen> {
  bool _useInternalDriversOnly = false;

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AgencyProvider>();
    final agency = provider.currentAgency;
    final currentUser = ref.watch(authProvider).user;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white.withValues(alpha: 0.5) : AppColors.textSecondaryLight;

    if (agency == null) {
      return const Scaffold(body: Center(child: Text("Aucune agence chargée.")));
    }

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: AnimatedGradientBg(
        isDark: isDark,
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            const MossombiSliverAppBar(
              title: 'Paramètres Agence',
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Agency General info
                    Text('Informations Générales', style: TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.w900)),
                    const SizedBox(height: 12),
                    GlassContainer(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          _buildInfoTile('Nom de l\'Agence', agency.name, Icons.business_rounded, textColor, hintColor),
                          const Divider(color: Colors.white12, height: 24),
                          _buildInfoTile('Code Affiliation', (agency.affiliationCode != '------' ? agency.affiliationCode : (currentUser?.userIdDisplay ?? '')).replaceAll(RegExp(r'[^0-9]'), ''), Icons.tag_rounded, textColor, hintColor),
                          const Divider(color: Colors.white12, height: 24),
                          _buildInfoTile('Statut', agency.status.toUpperCase(), Icons.verified_user_rounded, Colors.green, hintColor),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Actions / Config
                    Text('Configuration', style: TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.w900)),
                    const SizedBox(height: 12),
                    GlassContainer(
                      padding: const EdgeInsets.all(8),
                      child: Column(
                        children: [
                          _buildActionTile('Gérer les Rôles', 'Modifier les permissions', Icons.admin_panel_settings_rounded, isDark, onTap: () {
                            context.push('/agency-team');
                          }),
                          SwitchListTile(
                            value: _useInternalDriversOnly,
                            onChanged: (val) {
                              setState(() {
                                _useInternalDriversOnly = val;
                              });
                            },
                            title: Text('Flotte Interne Uniquement', style: TextStyle(color: isDark ? Colors.white : Colors.black, fontWeight: FontWeight.bold, fontSize: 14)),
                            subtitle: const Text('N\'utiliser que vos propres employés comme livreurs.', style: TextStyle(fontSize: 12, color: Colors.grey)),
                            secondary: Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: isDark ? Colors.white.withValues(alpha: 0.1) : Colors.black.withValues(alpha: 0.05),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.delivery_dining_rounded, color: Color(0xFF6C4EF6), size: 20),
                            ),
                            activeColor: const Color(0xFF6C4EF6),
                          ),
                          _buildActionTile('Services Approuvés', 'Demander un nouveau service', Icons.category_rounded, isDark, onTap: () {
                            _showServicesBottomSheet(context, isDark);
                          }),
                          _buildActionTile('Documents & Légal', 'Kbis, NINEA, etc.', Icons.description_rounded, isDark, onTap: () {
                            _showComingSoonBottomSheet(context, 'Documents Légaux', isDark);
                          }),
                          _buildActionTile('Coordonnées Bancaires', 'Pour le versement automatique', Icons.account_balance_rounded, isDark, onTap: () {
                            _showComingSoonBottomSheet(context, 'Coordonnées Bancaires', isDark);
                          }),
                        ],
                      ),
                    ),
                    
                    const SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      child: TextButton.icon(
                        onPressed: () {
                          _showDeleteDialog(context, isDark);
                        },
                        icon: const Icon(Icons.delete_outline_rounded, color: Colors.red),
                        label: const Text('Clôturer cette agence', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          backgroundColor: Colors.red.withValues(alpha: 0.1),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                      ),
                    ),
                    const SizedBox(height: 50),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoTile(String title, String value, IconData icon, Color mainColor, Color hintColor) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: mainColor.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: mainColor, size: 20),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: TextStyle(color: hintColor, fontSize: 12)),
              Text(value, style: TextStyle(color: mainColor, fontSize: 15, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildActionTile(String title, String subtitle, IconData icon, bool isDark, {required VoidCallback onTap}) {
    return ListTile(
      onTap: onTap,
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: isDark ? Colors.white.withValues(alpha: 0.1) : Colors.black.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: const Color(0xFF6C4EF6), size: 20),
      ),
      title: Text(title, style: TextStyle(color: isDark ? Colors.white : Colors.black, fontWeight: FontWeight.bold, fontSize: 14)),
      subtitle: Text(subtitle, style: const TextStyle(fontSize: 12, color: Colors.grey)),
      trailing: const Icon(Icons.chevron_right_rounded, color: Colors.grey, size: 20),
    );
  }

  void _showServicesBottomSheet(BuildContext context, bool isDark) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: isDark ? AppColors.bgDark1 : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.withValues(alpha: 0.5), borderRadius: BorderRadius.circular(2))),
                const SizedBox(height: 24),
                Text('Services Approuvés', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: isDark ? Colors.white : Colors.black)),
                const SizedBox(height: 16),
                const ListTile(
                  leading: Icon(Icons.storefront_rounded, color: Colors.green),
                  title: Text('Boutique / Marketplace', style: TextStyle(fontWeight: FontWeight.bold)),
                  trailing: Icon(Icons.check_circle_rounded, color: Colors.green),
                ),
                const ListTile(
                  leading: Icon(Icons.explore_rounded, color: Colors.grey),
                  title: Text('Voyages / Billetterie', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
                  trailing: Text('En attente', style: TextStyle(color: Colors.orange, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.violet,
                    minimumSize: const Size(double.infinity, 50),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Fermer', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                )
              ],
            ),
          ),
        );
      }
    );
  }

  void _showComingSoonBottomSheet(BuildContext context, String title, bool isDark) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: isDark ? AppColors.bgDark1 : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.withValues(alpha: 0.5), borderRadius: BorderRadius.circular(2))),
                const SizedBox(height: 24),
                Icon(Icons.construction_rounded, size: 64, color: isDark ? Colors.white54 : Colors.black54),
                const SizedBox(height: 16),
                Text(title, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: isDark ? Colors.white : Colors.black)),
                const SizedBox(height: 8),
                const Text('Cette section est en cours de développement. Vous pourrez bientôt y accéder.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.violet,
                    minimumSize: const Size(double.infinity, 50),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Compris', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                )
              ],
            ),
          ),
        );
      }
    );
  }

  void _showDeleteDialog(BuildContext context, bool isDark) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: isDark ? AppColors.bgDark1 : Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Text('Clôturer l\'agence ?', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
          content: Text('Êtes-vous sûr de vouloir supprimer cette agence ? Cette action est irréversible, toutes les statistiques et les fonds affiliés non retirés seront verrouillés.', style: TextStyle(color: isDark ? Colors.white70 : Colors.black87)),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Annuler', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Contactez le support pour clôturer cette agence.')));
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Confirmer', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        );
      }
    );
  }
}

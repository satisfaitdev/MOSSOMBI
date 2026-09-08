import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/animated_gradient_bg.dart';
import '../../../../core/widgets/custom_app_bars.dart';
import '../../../../core/widgets/glass_container.dart';
import '../../../../core/widgets/custom_button.dart';
import '../../../../core/providers/auth_provider.dart';

class NotificationSettingsScreen extends ConsumerStatefulWidget {
  const NotificationSettingsScreen({super.key});

  @override
  ConsumerState<NotificationSettingsScreen> createState() => _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState extends ConsumerState<NotificationSettingsScreen> {
  final Map<String, bool> _settings = {
    'email_notifications': true,
    'push_notifications': true,
    'sms_notifications': false,
    'marketing_emails': false,
    'security_alerts': true,
    'product_updates': true,
    'achievement_alerts': true,
    'friend_requests': true,
  };
  bool _fetching = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final settings = await ref.read(authProvider.notifier).fetchUserSettings();
    if (settings != null && settings['notifications'] != null) {
      final notifs = settings['notifications'] as Map<String, dynamic>;
      notifs.forEach((key, val) {
        if (_settings.containsKey(key) && val is bool) {
          _settings[key] = val;
        }
      });
    }
    if (mounted) {
      setState(() {
        _fetching = false;
      });
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final success = await ref.read(authProvider.notifier).updateSettingsNotifications(_settings);
    setState(() => _saving = false);
    if (!mounted) return;
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Préférences de notification sauvegardées !'), backgroundColor: Colors.green),
      );
      Navigator.pop(context);
    } else {
      final err = ref.read(authProvider).error ?? 'Erreur de sauvegarde';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(err), backgroundColor: Colors.redAccent),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white70 : AppColors.textSecondaryLight;

    return Scaffold(
      appBar: const MossombiHeaderType3(title: 'Préférences Notifications'),
      extendBodyBehindAppBar: true,
      backgroundColor: Colors.transparent,
      body: AnimatedGradientBg(
        isDark: isDark,
        child: SafeArea(
          child: _fetching
              ? const Center(child: CircularProgressIndicator(color: AppColors.violet))
              : SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.all(20),
                  child: GlassContainer(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Canaux de Communication', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 16),
                        _buildSwitchTile('Notifications Push', 'push_notifications', textColor, hintColor),
                        _buildSwitchTile('Alertes SMS', 'sms_notifications', textColor, hintColor),
                        _buildSwitchTile('Emails Récapitulatifs', 'email_notifications', textColor, hintColor),
                        
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 16),
                          child: Divider(),
                        ),
                        
                        Text('Types d\'Alertes', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 16),
                        _buildSwitchTile('Alertes de Sécurité', 'security_alerts', textColor, hintColor),
                        _buildSwitchTile('Mises à jour Produits', 'product_updates', textColor, hintColor),
                        _buildSwitchTile('Offres & Emails Marketing', 'marketing_emails', textColor, hintColor),
                        _buildSwitchTile('Nouveaux Niveaux & Badges', 'achievement_alerts', textColor, hintColor),
                        _buildSwitchTile('Demandes d\'Amis', 'friend_requests', textColor, hintColor),
                        
                        const SizedBox(height: 32),
                        MosombiButton.primary(
                          onPressed: _saving ? null : _save,
                          text: 'Enregistrer',
                          isLoading: _saving,
                        ),
                      ],
                    ),
                  ),
                ),
        ),
      ),
    );
  }

  Widget _buildSwitchTile(String title, String key, Color textColor, Color hintColor) {
    return SwitchListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(title, style: TextStyle(color: textColor, fontWeight: FontWeight.w600, fontSize: 15)),
      value: _settings[key] ?? false,
      activeColor: AppColors.violet,
      onChanged: (val) {
        setState(() {
          _settings[key] = val;
        });
      },
    );
  }
}

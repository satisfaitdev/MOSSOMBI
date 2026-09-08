import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/animated_gradient_bg.dart';
import '../../../../core/widgets/custom_app_bars.dart';
import '../../../../core/widgets/glass_container.dart';
import '../../../../core/widgets/custom_button.dart';
import '../../../../core/providers/auth_provider.dart';

class PrivacySettingsScreen extends ConsumerStatefulWidget {
  const PrivacySettingsScreen({super.key});

  @override
  ConsumerState<PrivacySettingsScreen> createState() => _PrivacySettingsScreenState();
}

class _PrivacySettingsScreenState extends ConsumerState<PrivacySettingsScreen> {
  final Map<String, dynamic> _settings = {
    'profile_visibility': 'public',
    'show_online_status': true,
    'show_last_seen': true,
    'allow_friend_requests': true,
    'allow_messages': 'everyone',
    'show_achievements': true,
    'show_level': true,
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
    if (settings != null && settings['privacy'] != null) {
      final privacy = settings['privacy'] as Map<String, dynamic>;
      privacy.forEach((key, val) {
        if (_settings.containsKey(key)) {
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
    final success = await ref.read(authProvider.notifier).updateSettingsPrivacy(_settings);
    setState(() => _saving = false);
    if (!mounted) return;
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Paramètres de confidentialité sauvegardés !'), backgroundColor: Colors.green),
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
      appBar: const MossombiHeaderType3(title: 'Confidentialité'),
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
                        Text('Visibilité', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 16),
                        
                        _buildDropdownTile(
                          'Visibilité du profil',
                          'profile_visibility',
                          {
                            'public': 'Public',
                            'friends': 'Amis seulement',
                            'private': 'Privé',
                          },
                          textColor,
                          isDark,
                        ),
                        
                        _buildDropdownTile(
                          'Qui peut m\'envoyer des messages',
                          'allow_messages',
                          {
                            'everyone': 'Tout le monde',
                            'friends': 'Amis seulement',
                            'none': 'Personne',
                          },
                          textColor,
                          isDark,
                        ),
                        
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 16),
                          child: Divider(),
                        ),
                        
                        Text('Activité & Profil', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 16),
                        
                        _buildSwitchTile('Afficher mon statut en ligne', 'show_online_status', textColor),
                        _buildSwitchTile('Afficher ma dernière connexion', 'show_last_seen', textColor),
                        _buildSwitchTile('Autoriser les demandes d\'ami', 'allow_friend_requests', textColor),
                        _buildSwitchTile('Afficher mes récompenses / badges', 'show_achievements', textColor),
                        _buildSwitchTile('Afficher mon niveau d\'activité', 'show_level', textColor),
                        
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

  Widget _buildSwitchTile(String title, String key, Color textColor) {
    return SwitchListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(title, style: TextStyle(color: textColor, fontWeight: FontWeight.w600, fontSize: 15)),
      value: _settings[key] as bool? ?? false,
      activeColor: AppColors.violet,
      onChanged: (val) {
        setState(() {
          _settings[key] = val;
        });
      },
    );
  }

  Widget _buildDropdownTile(
    String title,
    String key,
    Map<String, String> options,
    Color textColor,
    bool isDark,
  ) {
    final dropdownColor = isDark ? const Color(0xFF1E1E2C) : Colors.white;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: TextStyle(color: textColor, fontWeight: FontWeight.w600, fontSize: 15)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          decoration: BoxDecoration(
            color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.white.withValues(alpha: 0.8),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: isDark ? const Color(0xFF2A2A4A) : const Color(0xFFE0E0F0), width: 1.5),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _settings[key]?.toString(),
              dropdownColor: dropdownColor,
              isExpanded: true,
              style: TextStyle(color: textColor, fontSize: 14, fontWeight: FontWeight.bold),
              items: options.entries.map((e) {
                return DropdownMenuItem(value: e.key, child: Text(e.value));
              }).toList(),
              onChanged: (val) {
                if (val != null) {
                  setState(() {
                    _settings[key] = val;
                  });
                }
              },
            ),
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}

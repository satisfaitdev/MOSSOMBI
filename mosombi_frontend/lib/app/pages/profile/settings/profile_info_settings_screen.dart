import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/animated_gradient_bg.dart';
import '../../../../core/widgets/custom_app_bars.dart';
import '../../../../core/widgets/glass_container.dart';
import '../../../../core/widgets/custom_button.dart';
import '../../../../core/providers/auth_provider.dart';

class ProfileInfoSettingsScreen extends ConsumerStatefulWidget {
  const ProfileInfoSettingsScreen({super.key});

  @override
  ConsumerState<ProfileInfoSettingsScreen> createState() => _ProfileInfoSettingsScreenState();
}

class _ProfileInfoSettingsScreenState extends ConsumerState<ProfileInfoSettingsScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameCtrl = TextEditingController();
  final _displayNameCtrl = TextEditingController();
  final _bioCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  final _birthDateCtrl = TextEditingController();
  String _selectedGender = 'prefer_not_to_say';
  bool _fetching = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final settings = await ref.read(authProvider.notifier).fetchUserSettings();
    if (settings != null && settings['profile'] != null) {
      final p = settings['profile'] as Map<String, dynamic>;
      _usernameCtrl.text = p['username']?.toString() ?? '';
      _displayNameCtrl.text = p['display_name']?.toString() ?? '';
      _bioCtrl.text = p['bio']?.toString() ?? '';
      _locationCtrl.text = p['location']?.toString() ?? '';
      _selectedGender = p['gender']?.toString() ?? 'prefer_not_to_say';
      
      final rawDate = p['birth_date'];
      if (rawDate != null) {
        try {
          _birthDateCtrl.text = rawDate.toString().substring(0, 10);
        } catch (_) {}
      }
    }
    if (mounted) {
      setState(() {
        _fetching = false;
      });
    }
  }

  @override
  void dispose() {
    _usernameCtrl.dispose();
    _displayNameCtrl.dispose();
    _bioCtrl.dispose();
    _locationCtrl.dispose();
    _birthDateCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final success = await ref.read(authProvider.notifier).updateSettingsProfile(
      username: _usernameCtrl.text.trim(),
      displayName: _displayNameCtrl.text.trim(),
      bio: _bioCtrl.text.trim(),
      location: _locationCtrl.text.trim(),
      gender: _selectedGender,
      birthDate: _birthDateCtrl.text.trim(),
    );
    setState(() => _saving = false);
    if (!mounted) return;
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profil mis à jour avec succès !'), backgroundColor: Colors.green),
      );
      Navigator.pop(context);
    } else {
      final err = ref.read(authProvider).error ?? 'Erreur de mise à jour';
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
      appBar: const MossombiHeaderType3(title: 'Informations Profil'),
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
                  child: Form(
                    key: _formKey,
                    child: GlassContainer(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Mon Profil', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 24),
                          
                          _buildTextField(_displayNameCtrl, 'Nom d\'affichage', Icons.badge_outlined, isDark),
                          const SizedBox(height: 16),
                          
                          _buildTextField(_usernameCtrl, 'Nom d\'utilisateur', Icons.alternate_email_rounded, isDark),
                          const SizedBox(height: 16),
                          
                          _buildTextField(_bioCtrl, 'Biographie', Icons.description_outlined, isDark, maxLines: 3),
                          const SizedBox(height: 16),
                          
                          _buildTextField(_locationCtrl, 'Localisation', Icons.location_on_outlined, isDark),
                          const SizedBox(height: 16),
                          
                          _buildTextField(_birthDateCtrl, 'Date de naissance (AAAA-MM-JJ)', Icons.calendar_today_outlined, isDark, keyboardType: TextInputType.datetime),
                          const SizedBox(height: 16),
                          
                          Text('Genre', style: TextStyle(color: hintColor, fontSize: 13, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          _buildGenderDropdown(textColor, isDark),
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
      ),
    );
  }

  Widget _buildTextField(
    TextEditingController ctrl,
    String label,
    IconData icon,
    bool isDark, {
    int maxLines = 1,
    TextInputType keyboardType = TextInputType.text,
  }) {
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white54 : AppColors.textSecondaryLight;
    
    return TextFormField(
      controller: ctrl,
      maxLines: maxLines,
      keyboardType: keyboardType,
      style: TextStyle(color: textColor, fontSize: 14),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: hintColor, fontSize: 13),
        prefixIcon: Icon(icon, color: hintColor, size: 20),
        alignLabelWithHint: maxLines > 1,
      ),
      validator: (val) {
        if (label.contains('Nom d\'affichage') && (val == null || val.isEmpty)) {
          return 'Le nom d\'affichage ne peut pas être vide';
        }
        return null;
      },
    );
  }

  Widget _buildGenderDropdown(Color textColor, bool isDark) {
    final dropdownColor = isDark ? const Color(0xFF1E1E2C) : Colors.white;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.white.withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? const Color(0xFF2A2A4A) : const Color(0xFFE0E0F0), width: 1.5),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _selectedGender,
          dropdownColor: dropdownColor,
          isExpanded: true,
          style: TextStyle(color: textColor, fontSize: 14, fontWeight: FontWeight.bold),
          items: const [
            DropdownMenuItem(value: 'male', child: Text('Homme')),
            DropdownMenuItem(value: 'female', child: Text('Femme')),
            DropdownMenuItem(value: 'other', child: Text('Autre')),
            DropdownMenuItem(value: 'prefer_not_to_say', child: Text('Ne pas spécifier')),
          ],
          onChanged: (val) {
            if (val != null) {
              setState(() {
                _selectedGender = val;
              });
            }
          },
        ),
      ),
    );
  }
}

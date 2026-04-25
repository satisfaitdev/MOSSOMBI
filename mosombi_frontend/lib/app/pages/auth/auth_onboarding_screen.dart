import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/theme/app_gradients.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'package:mosombi_frontend/core/widgets/popup_pub.dart';
import '../../../../core/providers/auth_provider.dart';
import 'auth_widgets.dart';

class AuthOnboardingScreen extends ConsumerStatefulWidget {
  const AuthOnboardingScreen({super.key});

  @override
  ConsumerState<AuthOnboardingScreen> createState() => _AuthOnboardingScreenState();
}

class _AuthOnboardingScreenState extends ConsumerState<AuthOnboardingScreen> {
  final _parrainCtrl = TextEditingController();
  DateTime? _birthDate;
  String _source = 'Non spécifié';
  File? _avatarImage;

  final List<String> _sources = [
    'Non spécifié',
    'Bouche à oreille / Ami',
    'Facebook',
    'Instagram',
    'WhatsApp',
    'Publicité en ligne',
    'Autre'
  ];

  @override
  void dispose() {
    _parrainCtrl.dispose();
    super.dispose();
  }

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime(2000),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: AppColors.violet,
              onPrimary: Colors.white,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() => _birthDate = picked);
    }
  }

  Future<void> _submit() async {
    if (_avatarImage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez ajouter une photo de profil.'), backgroundColor: Colors.redAccent),
      );
      return;
    }
    
    if (_birthDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez renseigner votre date de naissance.'), backgroundColor: Colors.redAccent),
      );
      return;
    }

    final success = await ref.read(authProvider.notifier).submitOnboarding(
      birthDate: DateFormat('yyyy-MM-dd').format(_birthDate!),
      referralCode: _parrainCtrl.text.trim(),
      source: _source,
      avatarFile: _avatarImage,
    );

    if (!mounted) return;

    if (success) {
      // Redirection vers le splash screen de pub au lieu de home
      context.go('/splash-ad');
    } else {
      final errorMsg = ref.read(authProvider).error ?? 'Impossible de sauvegarder le profil';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(errorMsg), backgroundColor: Colors.redAccent),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final authState = ref.watch(authProvider);

    return Scaffold(
      extendBody: true,
      body: AnimatedGradientBg(
        isDark: isDark,
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  ShaderMask(
                    shaderCallback: (bounds) => AppGradients.auth.createShader(bounds),
                    child: const Text('Bienvenue !',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 38,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          height: 1.15,
                        )),
                  ).animate(delay: 100.ms).fade(duration: 500.ms).slideY(begin: -0.2, end: 0),
                  const SizedBox(height: 8),
                  Text('Complétons votre profil',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 16,
                        color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                      )).animate(delay: 200.ms).fade(),
                  
                  const SizedBox(height: 40),
                  
                  // Photo Avatar
                  Center(
                    child: GestureDetector(
                      onTap: () async {
                        final picker = ImagePicker();
                        final pickedFile = await picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
                        if (pickedFile != null) {
                          setState(() {
                            _avatarImage = File(pickedFile.path);
                          });
                        }
                      },
                      child: Stack(
                        children: [
                          CircleAvatar(
                            radius: 50,
                            backgroundColor: AppColors.violet.withValues(alpha: 0.1),
                            backgroundImage: _avatarImage != null ? FileImage(_avatarImage!) : null,
                            child: _avatarImage == null ? const Icon(Icons.person, size: 50, color: AppColors.violet) : null,
                          ),
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: const BoxDecoration(
                                color: AppColors.violet,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.camera_alt, color: Colors.white, size: 18),
                            ),
                          )
                        ],
                      ),
                    ),
                  ).animate(delay: 300.ms).scale(),

                  const SizedBox(height: 32),

                  GlassContainer(
                    padding: const EdgeInsets.all(24),
                    child: Column(children: [
                      // Date Picker
                      GestureDetector(
                        onTap: _selectDate,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                          decoration: BoxDecoration(
                            color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.05),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.cake_outlined, color: AppColors.violet),
                              const SizedBox(width: 14),
                              Text(
                                _birthDate == null ? 'Date de naissance' : DateFormat('dd/MM/yyyy').format(_birthDate!),
                                style: TextStyle(
                                  color: _birthDate == null 
                                    ? (isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight)
                                    : (isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight),
                                  fontSize: 16,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Code Parrain
                      AuthAnimatedField(
                          controller: _parrainCtrl,
                          hint: 'Code de parrainage (Optionnel)',
                          icon: Icons.group_add_outlined,
                          isDark: isDark),
                      const SizedBox(height: 14),

                      // Source Dropdown
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                        decoration: BoxDecoration(
                          color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.05),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _source,
                            isExpanded: true,
                            icon: const Icon(Icons.arrow_drop_down, color: AppColors.violet),
                            dropdownColor: isDark ? AppColors.surfaceDark : Colors.white,
                            style: TextStyle(
                              color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                              fontSize: 16,
                            ),
                            onChanged: (String? newValue) {
                              if (newValue != null) setState(() => _source = newValue);
                            },
                            items: _sources.map<DropdownMenuItem<String>>((String value) {
                              return DropdownMenuItem<String>(
                                value: value,
                                child: Text(value),
                              );
                            }).toList(),
                          ),
                        ),
                      ),
                      
                      const SizedBox(height: 32),
                      
                      AuthGradientButton(
                        label: authState.isLoading ? 'Enregistrement...' : 'Terminer',
                        gradient: AppGradients.auth,
                        isLoading: authState.isLoading,
                        onTap: _submit,
                      ),
                    ]),
                  ).animate(delay: 400.ms).fade(duration: 500.ms).slideY(begin: 0.3, end: 0),
                  
                  const SizedBox(height: 24),
                  
                  Center(
                    child: GestureDetector(
                      onTap: () => context.go('/home'),
                      child: Text('Passer cette étape',
                          style: TextStyle(
                              color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                              fontWeight: FontWeight.w600)),
                    ),
                  ).animate(delay: 600.ms).fade(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

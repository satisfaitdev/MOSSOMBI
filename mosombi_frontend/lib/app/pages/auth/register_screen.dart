import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/theme/app_gradients.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl_phone_field/intl_phone_field.dart';
import '../../../../core/providers/auth_provider.dart';
import 'auth_widgets.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _nomCtrl = TextEditingController();
  final _prenomCtrl = TextEditingController();
  final _ageCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  String _completePhoneNumber = '';
  final _passCtrl = TextEditingController();
  final _parrainCtrl = TextEditingController();
  final _sourceCtrl = TextEditingController();
  bool _obscure = true;
  bool _loading = false;

  @override
  void dispose() {
    _nomCtrl.dispose();
    _prenomCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    final prenom = _prenomCtrl.text.trim();
    final nom = _nomCtrl.text.trim();
    final phone = _completePhoneNumber.isNotEmpty ? _completePhoneNumber : _phoneCtrl.text.trim();
    final password = _passCtrl.text;
    final email = _emailCtrl.text.trim();

    if (prenom.isEmpty || nom.isEmpty || phone.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez remplir les champs obligatoires (Nom, Prénom, Tél, MDP)'), backgroundColor: Colors.orange),
      );
      return;
    }

    final success = await ref.read(authProvider.notifier).register(
      firstName: prenom,
      lastName: nom,
      phone: phone,
      password: password,
      email: email.isNotEmpty ? email : null,
    );

    if (!mounted) return;

    if (success) {
      context.go('/auth/otp');
    } else {
      final errorMsg = ref.read(authProvider).error ?? 'Erreur d\'inscription';
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
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                IconButton(
                  onPressed: () => context.go('/auth/login'),
                  icon: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
                  ),
                ).animate().fade(duration: 300.ms),
                const SizedBox(height: 12),
                ShaderMask(
                  shaderCallback: (bounds) => AppGradients.auth.createShader(bounds),
                  child: const Text('Créer\nun compte',
                      style: TextStyle(
                        fontSize: 38,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                        height: 1.15,
                      )),
                ).animate(delay: 100.ms).fade(duration: 500.ms).slideX(begin: -0.2, end: 0),
                const SizedBox(height: 8),
                Text('Rejoignez la ville intelligente 🏙️',
                    style: TextStyle(
                      color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                    )).animate(delay: 200.ms).fade(),
                const SizedBox(height: 32),
                GlassContainer(
                  padding: const EdgeInsets.all(24),
                  child: Column(children: [
                    Row(
                      children: [
                        Expanded(
                          child: AuthAnimatedField(
                              controller: _prenomCtrl,
                              hint: 'Prénom',
                              icon: Icons.person_outline,
                              isDark: isDark),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: AuthAnimatedField(
                              controller: _nomCtrl,
                              hint: 'Nom',
                              icon: Icons.badge_outlined,
                              isDark: isDark),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    _buildPhoneField(isDark),
                    const SizedBox(height: 14),
                    AuthAnimatedField(
                        controller: _emailCtrl,
                        hint: 'Email (Optionnel)',
                        icon: Icons.email_outlined,
                        isDark: isDark),
                    const SizedBox(height: 14),
                    AuthAnimatedField(
                      controller: _passCtrl,
                      hint: 'Mot de passe',
                      icon: Icons.lock_outline_rounded,
                      isDark: isDark,
                      obscure: _obscure,
                      suffix: IconButton(
                        icon: Icon(
                          _obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                          color: AppColors.violet,
                        ),
                        onPressed: () => setState(() => _obscure = !_obscure),
                      ),
                    ),
                    const SizedBox(height: 24),
                    AuthGradientButton(
                      label: authState.isLoading ? 'Création...' : 'Créer mon compte',
                      gradient: AppGradients.auth,
                      isLoading: authState.isLoading,
                      onTap: _register,
                    ),
                  ]),
                ).animate(delay: 300.ms).fade(duration: 500.ms).slideY(begin: 0.3, end: 0),
                const SizedBox(height: 24),
                Center(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('Déjà membre ? ',
                          style: TextStyle(
                              color: isDark
                                  ? AppColors.textSecondaryDark
                                  : AppColors.textSecondaryLight)),
                      GestureDetector(
                        onTap: () => context.go('/auth/login'),
                        child: ShaderMask(
                          shaderCallback: (b) => AppGradients.primary.createShader(b),
                          child: const Text('Se connecter',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                        ),
                      ),
                    ],
                  ),
                ).animate(delay: 500.ms).fade(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPhoneField(bool isDark) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.05),
      ),
      child: IntlPhoneField(
        controller: _phoneCtrl,
        decoration: InputDecoration(
          hintText: 'Numéro WhatsApp (Obligatoire)',
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          counterText: '',
        ),
        disableLengthCheck: true,
        initialCountryCode: 'CG',
        onChanged: (phone) {
          _completePhoneNumber = phone.completeNumber;
        },
      ),
    );
  }
}

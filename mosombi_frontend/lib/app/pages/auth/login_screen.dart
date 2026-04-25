import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/theme/app_gradients.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/services/biometric_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl_phone_field/intl_phone_field.dart';
import '../../../../core/providers/auth_provider.dart';
import 'auth_widgets.dart';
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  String _completePhoneNumber = ''; // Numéro formaté avec indicatif (+242...)
  bool _obscure = true;
  bool _loading = false;
  bool _biometricSupported = false;
  int _authMethod = 0; // 0: Phone, 1: Email, 2: Code Numérique

  @override
  void initState() {
    super.initState();
    _checkBiometricSupport();
  }

  Future<void> _checkBiometricSupport() async {
    final supported = await BiometricService.isSupported();
    if (mounted) setState(() => _biometricSupported = supported);
  }

  Future<void> _loginWithBiometrics() async {
    if (!_biometricSupported) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Biométrie non disponible sur cet appareil.'), backgroundColor: Colors.orange),
      );
      return;
    }

    setState(() => _loading = true);
    final result = await BiometricService.authenticate();
    setState(() => _loading = false);

    if (!mounted) return;

    switch (result) {
      case BiometricResult.success:
        // On déclenche la vraie reconnexion cachée !
        final success = await ref.read(authProvider.notifier).biometricLogin();
        
        if (!mounted) return;
        
        if (success) {
          context.go('/splash-ad');
        } else {
          final errorMsg = ref.read(authProvider).error ?? 'Veuillez vous connecter avec votre mot de passe une première fois.';
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(errorMsg), backgroundColor: Colors.orange),
          );
        }
        break;
      case BiometricResult.notEnrolled:
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Aucune empreinte enregistrée. Ajoutez-en dans les paramètres Android.'), backgroundColor: Colors.orange),
        );
        break;
      case BiometricResult.lockedOut:
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Trop de tentatives. Réessayez dans quelques instants.'), backgroundColor: Colors.redAccent),
        );
        break;
      case BiometricResult.notAvailable:
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Biométrie non disponible sur cet appareil.'), backgroundColor: Colors.orange),
        );
        break;
      case BiometricResult.failure:
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Authentification annulée.'), backgroundColor: Colors.grey),
        );
        break;
    }
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    // Si la méthode 0 (Téléphone) est sélectionnée, on utilise le numéro avec l'indicatif
    String identifier = _authMethod == 0 ? _completePhoneNumber : _emailCtrl.text.trim();
    
    // Si la méthode 2 (ID Numérique) est sélectionnée, on force le format MSB-
    if (_authMethod == 2 && identifier.isNotEmpty && !identifier.toUpperCase().startsWith('MSB-')) {
      identifier = 'MSB-$identifier';
    }

    final password = _passCtrl.text;

    if (identifier.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez remplir tous les champs'), backgroundColor: Colors.orange),
      );
      return;
    }

    final success = await ref.read(authProvider.notifier).login(identifier, password);
    
    if (!mounted) return;
    
    if (success) {
      context.go('/splash-ad');
    } else {
      final errorMsg = ref.read(authProvider).error ?? 'Erreur de connexion';
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
                children: [
                  _buildHeader().animate().fade(duration: 500.ms).slideY(begin: -0.3, end: 0),
                  const SizedBox(height: 40),
                  GlassContainer(
                    padding: const EdgeInsets.all(28),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Connexion',
                            style: TextStyle(
                              fontSize: 26,
                              fontWeight: FontWeight.w800,
                              color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                            )),
                        const SizedBox(height: 6),
                        Text('Heureux de vous revoir 👋',
                            style: TextStyle(
                              color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                              fontSize: 14,
                            )),
                        const SizedBox(height: 28),
                        _buildAuthMethodSelector(isDark),
                        const SizedBox(height: 24),
                        if (_authMethod == 0) // Téléphone
                          _buildPhoneField(isDark)
                        else if (_authMethod == 1) // Email
                          AuthAnimatedField(
                            controller: _emailCtrl,
                            hint: 'Adresse Email',
                            icon: Icons.email_outlined,
                            isDark: isDark,
                          )
                        else // Code Numérique
                          AuthAnimatedField(
                            controller: _emailCtrl,
                            hint: 'Identifiant (ex: 123456)',
                            icon: Icons.pin_outlined,
                            isDark: isDark,
                          ),
                        const SizedBox(height: 16),
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
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton(
                            onPressed: () => context.go('/auth/forgot'),
                            child: const Text('Mot de passe oublié ?',
                                style: TextStyle(color: AppColors.violet, fontSize: 13)),
                          ),
                        ),
                        const SizedBox(height: 8),
                        AuthGradientButton(
                          label: authState.isLoading ? 'Connexion...' : 'Se connecter',
                          gradient: AppGradients.primary,
                          isLoading: authState.isLoading,
                          onTap: _login,
                        ),
                      ],
                    ),
                  ).animate(delay: 150.ms).fade(duration: 500.ms).slideY(begin: 0.3, end: 0),
                  const SizedBox(height: 28),
                  _buildBiometricButton(isDark).animate(delay: 300.ms).fade(duration: 400.ms),
                  const SizedBox(height: 24),
                  _buildDivider(isDark).animate(delay: 350.ms).fade(),
                  const SizedBox(height: 20),
                  _buildSocialRow().animate(delay: 400.ms).fade(duration: 500.ms),
                  const SizedBox(height: 32),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text("Pas encore de compte ? ",
                          style: TextStyle(
                            color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                          )),
                      GestureDetector(
                        onTap: () => context.go('/auth/register'),
                        child: ShaderMask(
                          shaderCallback: (bounds) => AppGradients.primary.createShader(bounds),
                          child: const Text('Créer un compte',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                        ),
                      ),
                    ],
                  ).animate(delay: 450.ms).fade(),
                ],
              ),
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
        controller: _emailCtrl,
        decoration: InputDecoration(
          hintText: 'Numéro de téléphone',
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          counterText: '',
        ),
        disableLengthCheck: true,
        initialCountryCode: 'CG', // Congo Brazzaville (Indicatif +242)
        onChanged: (phone) {
          _completePhoneNumber = phone.completeNumber;
        },
      ),
    );
  }

  Widget _buildHeader() {
    return Hero(
      tag: 'app_logo',
      child: Image.asset(
        'assets/images/logo.png',
        width: 90,
        height: 90,
        fit: BoxFit.contain,
        errorBuilder: (_, __, ___) => Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            gradient: AppGradients.primary,
            borderRadius: BorderRadius.circular(22),
            boxShadow: [
              BoxShadow(
                color: AppColors.violet.withValues(alpha: 0.4),
                blurRadius: 20,
                offset: const Offset(0, 8),
              )
            ],
          ),
          child: const Center(
            child: Text('M',
                style: TextStyle(fontSize: 36, fontWeight: FontWeight.w900, color: Colors.white)),
          ),
        ),
      ),
    );
  }

  Widget _buildBiometricButton(bool isDark) {
    return GestureDetector(
      onTap: _loginWithBiometrics,
      child: GlassContainer(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              _biometricSupported ? Icons.fingerprint : Icons.fingerprint,
              color: _biometricSupported ? AppColors.violet : Colors.grey,
              size: 28,
            )
                .animate(onPlay: (c) => c.repeat(reverse: true))
                .scale(begin: const Offset(1, 1), end: const Offset(1.15, 1.15), duration: 900.ms),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Connexion biométrique',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                  ),
                ),
                Text(
                  _biometricSupported ? 'Empreinte / Face ID disponible' : 'Non disponible sur cet appareil',
                  style: TextStyle(fontSize: 11, color: _biometricSupported ? Colors.green : Colors.grey),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDivider(bool isDark) {
    final color = (isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight)
        .withValues(alpha: 0.3);
    return Row(children: [
      Expanded(child: Divider(color: color)),
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Text('ou continuer avec',
            style: TextStyle(color: color, fontSize: 13)),
      ),
      Expanded(child: Divider(color: color)),
    ]);
  }

  Widget _buildSocialRow() {
    const buttons = [
      {'label': 'G', 'color': Color(0xFFEA4335)},
      {'label': '🍎', 'color': Color(0xFF000000)},
      {'label': 'f', 'color': Color(0xFF1877F2)},
    ];
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: buttons.map((b) {
        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 10),
          child: GlassContainer(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            child: Text(b['label']! as String,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: b['color']! as Color,
                )),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildAuthMethodSelector(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          _buildMethodTab(0, 'Tél', Icons.phone_rounded, isDark),
          _buildMethodTab(1, 'Email', Icons.email_rounded, isDark),
          _buildMethodTab(2, 'Code', Icons.pin_rounded, isDark),
        ],
      ),
    );
  }

  Widget _buildMethodTab(int index, String label, IconData icon, bool isDark) {
    final isSelected = _authMethod == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _authMethod = index),
        behavior: HitTestBehavior.opaque,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.violet : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 16, color: isSelected ? Colors.white : (isDark ? Colors.white54 : Colors.black54)),
              const SizedBox(width: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                  color: isSelected ? Colors.white : (isDark ? Colors.white54 : Colors.black54),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

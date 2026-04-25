import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/theme/app_gradients.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'auth_widgets.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailCtrl = TextEditingController();
  bool _sent = false;
  bool _loading = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    setState(() => _loading = true);
    await Future.delayed(const Duration(seconds: 1));
    if (mounted) setState(() { _loading = false; _sent = true; });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      extendBody: true,
      body: AnimatedGradientBg(
        isDark: isDark,
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(28),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Align(
                    alignment: Alignment.centerLeft,
                    child: IconButton(
                      onPressed: () => context.go('/auth/login'),
                      icon: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  if (!_sent) ...[
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        gradient: AppGradients.primary,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(color: AppColors.violet.withValues(alpha: 0.4), blurRadius: 24)
                        ],
                      ),
                      child: const Icon(Icons.lock_reset_rounded, color: Colors.white, size: 48),
                    )
                        .animate(onPlay: (c) => c.repeat(reverse: true))
                        .scale(begin: const Offset(1, 1), end: const Offset(1.05, 1.05), duration: 1200.ms)
                        .animate()
                        .scale(begin: const Offset(0.5, 0.5), duration: 700.ms, curve: Curves.elasticOut)
                        .fade(),
                    const SizedBox(height: 32),
                    ShaderMask(
                      shaderCallback: (b) => AppGradients.primary.createShader(b),
                      child: const Text('Mot de passe\noublié ?',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 34, fontWeight: FontWeight.w800, color: Colors.white, height: 1.2)),
                    ).animate(delay: 200.ms).fade().slideY(begin: 0.2),
                    const SizedBox(height: 12),
                    Text(
                      'Saisissez votre email et nous vous enverrons\nun lien de réinitialisation.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                        height: 1.5,
                      ),
                    ).animate(delay: 300.ms).fade(),
                    const SizedBox(height: 36),
                    GlassContainer(
                      padding: const EdgeInsets.all(24),
                      child: Column(children: [
                        AuthAnimatedField(
                          controller: _emailCtrl,
                          hint: 'Votre adresse email',
                          icon: Icons.email_outlined,
                          isDark: isDark,
                        ),
                        const SizedBox(height: 20),
                        AuthGradientButton(
                          label: _loading ? 'Envoi...' : 'Envoyer le lien',
                          gradient: AppGradients.primary,
                          isLoading: _loading,
                          onTap: _send,
                        ),
                      ]),
                    ).animate(delay: 400.ms).fade(duration: 500.ms).slideY(begin: 0.3, end: 0),
                  ] else ...[
                    Container(
                      padding: const EdgeInsets.all(32),
                      decoration: BoxDecoration(
                        gradient: AppGradients.accent,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(color: AppColors.cyan.withValues(alpha: 0.4), blurRadius: 30)
                        ],
                      ),
                      child: const Icon(Icons.mark_email_read_outlined, color: Colors.white, size: 64),
                    )
                        .animate()
                        .scale(begin: const Offset(0.3, 0.3), duration: 800.ms, curve: Curves.elasticOut)
                        .fade(),
                    const SizedBox(height: 32),
                    ShaderMask(
                      shaderCallback: (b) => AppGradients.accent.createShader(b),
                      child: const Text('Email envoyé !',
                          style: TextStyle(fontSize: 34, fontWeight: FontWeight.w800, color: Colors.white)),
                    ).animate(delay: 200.ms).fade().slideY(begin: 0.2),
                    const SizedBox(height: 12),
                    Text(
                      'Vérifiez votre boîte de réception\net cliquez sur le lien de réinitialisation.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                        height: 1.5,
                      ),
                    ).animate(delay: 300.ms).fade(),
                    const SizedBox(height: 40),
                    AuthGradientButton(
                      label: 'Retour à la connexion',
                      gradient: AppGradients.primary,
                      onTap: () => context.go('/auth/login'),
                    ).animate(delay: 450.ms).fade(),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

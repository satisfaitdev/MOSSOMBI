import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';

class AgencyOnboardingScreen extends StatelessWidget {
  const AgencyOnboardingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white.withValues(alpha: 0.6) : AppColors.textSecondaryLight;

    return Scaffold(
      body: AnimatedGradientBg(
        isDark: isDark,
        child: Column(
          children: [
            const MossombiAppBar(title: 'Espace Agence'),
            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 20),
                    Icon(Icons.storefront_rounded, size: 80, color: const Color(0xFF6C4EF6)).animate().scale(curve: Curves.easeOutBack, duration: 600.ms),
                    const SizedBox(height: 24),
                    Text(
                      'Rejoignez notre réseau',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: textColor, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5),
                    ).animate(delay: 200.ms).fade().slideY(begin: 0.2, end: 0),
                    const SizedBox(height: 12),
                    Text(
                      'Collaborez avec d\'autres hosts ou gérez votre propre équipe d\'agents pour maximiser vos revenus.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: hintColor, fontSize: 14),
                    ).animate(delay: 300.ms).fade().slideY(begin: 0.2, end: 0),
                    const SizedBox(height: 48),

                    // Option 1: Rejoindre
                    GestureDetector(
                      onTap: () => context.push('/join-agency'),
                      child: GlassContainer(
                        padding: const EdgeInsets.all(24),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: const Color(0xFF6C4EF6).withValues(alpha: 0.1),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.group_add_rounded, color: Color(0xFF6C4EF6), size: 32),
                            ),
                            const SizedBox(width: 20),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Rejoindre une Agence', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
                                  const SizedBox(height: 4),
                                  Text('J\'ai un code d\'affiliation', style: TextStyle(color: hintColor, fontSize: 13)),
                                ],
                              ),
                            ),
                            Icon(Icons.arrow_forward_ios_rounded, color: hintColor, size: 16),
                          ],
                        ),
                      ),
                    ).animate(delay: 400.ms).fade().slideX(begin: -0.2, end: 0),

                    const SizedBox(height: 24),

                    // Option 2: Créer
                    GestureDetector(
                      onTap: () => context.push('/create-agency'),
                      child: GlassContainer(
                        padding: const EdgeInsets.all(24),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: const Color(0xFF00E5C5).withValues(alpha: 0.1),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.add_business_rounded, color: Color(0xFF00E5C5), size: 32),
                            ),
                            const SizedBox(width: 20),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Créer une Agence', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
                                  const SizedBox(height: 4),
                                  Text('Devenir manager d\'équipe', style: TextStyle(color: hintColor, fontSize: 13)),
                                ],
                              ),
                            ),
                            Icon(Icons.arrow_forward_ios_rounded, color: hintColor, size: 16),
                          ],
                        ),
                      ),
                    ).animate(delay: 500.ms).fade().slideX(begin: 0.2, end: 0),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

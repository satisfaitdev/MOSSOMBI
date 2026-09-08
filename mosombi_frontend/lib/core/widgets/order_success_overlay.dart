import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';

/// A full-screen animated overlay shown after a successful checkout.
/// Features confetti, animated checkmark, and redirect buttons.
class OrderSuccessOverlay extends StatefulWidget {
  final String? orderReference;
  final VoidCallback onViewOrders;
  final VoidCallback onContinueShopping;

  const OrderSuccessOverlay({
    super.key,
    this.orderReference,
    required this.onViewOrders,
    required this.onContinueShopping,
  });

  @override
  State<OrderSuccessOverlay> createState() => _OrderSuccessOverlayState();
}

class _OrderSuccessOverlayState extends State<OrderSuccessOverlay>
    with TickerProviderStateMixin {
  late AnimationController _checkCtrl;
  late AnimationController _confettiCtrl;
  late AnimationController _pulseCtrl;
  late Animation<double> _checkAnim;
  late Animation<double> _pulseAnim;

  final List<_ConfettiParticle> _particles = [];
  final Random _random = Random();

  @override
  void initState() {
    super.initState();

    // Check animation
    _checkCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _checkAnim = CurvedAnimation(parent: _checkCtrl, curve: Curves.elasticOut);

    // Confetti animation
    _confettiCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3000),
    );

    // Pulse ring animation
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
    _pulseAnim = CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeOut);

    // Generate confetti particles
    for (int i = 0; i < 50; i++) {
      _particles.add(_ConfettiParticle(
        x: _random.nextDouble(),
        speed: 0.3 + _random.nextDouble() * 0.7,
        size: 4 + _random.nextDouble() * 8,
        color: [
          const Color(0xFF6C4EF6),
          const Color(0xFF00E5C5),
          const Color(0xFFFF6584),
          const Color(0xFFFFD700),
          const Color(0xFF00D4FF),
          const Color(0xFFFF9800),
        ][_random.nextInt(6)],
        angle: _random.nextDouble() * 2 * pi,
        rotationSpeed: (_random.nextDouble() - 0.5) * 4,
      ));
    }

    // Sequence the animations
    Future.delayed(const Duration(milliseconds: 200), () {
      if (mounted) _checkCtrl.forward();
      if (mounted) _pulseCtrl.repeat(reverse: true);
    });
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) _confettiCtrl.forward();
    });
  }

  @override
  void dispose() {
    _checkCtrl.dispose();
    _confettiCtrl.dispose();
    _pulseCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final size = MediaQuery.of(context).size;

    return Material(
      color: Colors.transparent,
      child: Container(
        width: size.width,
        height: size.height,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: isDark
                ? [
                    const Color(0xFF0A0A1A),
                    const Color(0xFF1A1035),
                    const Color(0xFF0A0A1A),
                  ]
                : [
                    const Color(0xFFF8F6FF),
                    const Color(0xFFEDE8FF),
                    const Color(0xFFF0FDFA),
                  ],
          ),
        ),
        child: Stack(
          children: [
            // Confetti layer
            AnimatedBuilder(
              animation: _confettiCtrl,
              builder: (context, _) {
                return CustomPaint(
                  size: size,
                  painter: _ConfettiPainter(
                    particles: _particles,
                    progress: _confettiCtrl.value,
                    screenHeight: size.height,
                  ),
                );
              },
            ),

            // Main content
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Spacer(flex: 2),

                    // Animated check circle with pulse rings
                    SizedBox(
                      width: 180,
                      height: 180,
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          // Outer pulse ring
                          AnimatedBuilder(
                            animation: _pulseAnim,
                            builder: (context, _) {
                              return Container(
                                width: 160 + (_pulseAnim.value * 20),
                                height: 160 + (_pulseAnim.value * 20),
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: const Color(0xFF00E5C5)
                                        .withValues(alpha: 0.15 * (1 - _pulseAnim.value)),
                                    width: 3,
                                  ),
                                ),
                              );
                            },
                          ),

                          // Inner glow
                          Container(
                            width: 140,
                            height: 140,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: RadialGradient(
                                colors: [
                                  const Color(0xFF00E5C5).withValues(alpha: 0.2),
                                  const Color(0xFF00E5C5).withValues(alpha: 0.05),
                                  Colors.transparent,
                                ],
                              ),
                            ),
                          ),

                          // Main circle
                          AnimatedBuilder(
                            animation: _checkAnim,
                            builder: (context, child) {
                              return Transform.scale(
                                scale: _checkAnim.value.clamp(0.0, 1.2),
                                child: Container(
                                  width: 120,
                                  height: 120,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    gradient: const LinearGradient(
                                      begin: Alignment.topLeft,
                                      end: Alignment.bottomRight,
                                      colors: [
                                        Color(0xFF00E5C5),
                                        Color(0xFF00D4FF),
                                      ],
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: const Color(0xFF00E5C5).withValues(alpha: 0.4),
                                        blurRadius: 30,
                                        spreadRadius: 5,
                                      ),
                                    ],
                                  ),
                                  child: const Icon(
                                    Icons.check_rounded,
                                    color: Colors.white,
                                    size: 60,
                                  ),
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    ).animate(delay: 200.ms).scale(
                          begin: const Offset(0, 0),
                          end: const Offset(1, 1),
                          curve: Curves.elasticOut,
                          duration: 800.ms,
                        ),

                    const SizedBox(height: 40),

                    // Title
                    Text(
                      'Commande Confirmée ! 🎉',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.5,
                        color: isDark ? Colors.white : const Color(0xFF1A1035),
                      ),
                    ).animate(delay: 600.ms).fade().slideY(begin: 0.3, end: 0),

                    const SizedBox(height: 16),

                    // Subtitle
                    Text(
                      'Vos commandes ont été validées avec succès.\nSuivez chaque étape de livraison en temps réel.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 15,
                        height: 1.5,
                        color: isDark
                            ? Colors.white.withValues(alpha: 0.7)
                            : const Color(0xFF666680),
                      ),
                    ).animate(delay: 800.ms).fade().slideY(begin: 0.3, end: 0),

                    if (widget.orderReference != null) ...[
                      const SizedBox(height: 20),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                        decoration: BoxDecoration(
                          color: isDark
                              ? Colors.white.withValues(alpha: 0.06)
                              : const Color(0xFFF0EDFF),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.receipt_long_rounded,
                                color: AppColors.violet, size: 18),
                            const SizedBox(width: 8),
                            Text(
                              'Réf: ${widget.orderReference}',
                              style: TextStyle(
                                color: AppColors.violet,
                                fontWeight: FontWeight.w700,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ).animate(delay: 1000.ms).fade().scale(),
                    ],

                    const Spacer(flex: 1),

                    // Delivery steps preview
                    _buildDeliveryStepsPreview(isDark)
                        .animate(delay: 1000.ms)
                        .fade()
                        .slideY(begin: 0.2, end: 0),

                    const SizedBox(height: 32),

                    // Primary CTA - View Orders
                    SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton.icon(
                        onPressed: widget.onViewOrders,
                        icon: const Icon(Icons.local_shipping_rounded, size: 22),
                        label: const Text(
                          'Suivre ma livraison',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.violet,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(18),
                          ),
                          elevation: 8,
                          shadowColor: AppColors.violet.withValues(alpha: 0.4),
                        ),
                      ),
                    )
                        .animate(delay: 1200.ms)
                        .fade()
                        .slideY(begin: 0.3, end: 0)
                        .then()
                        .shimmer(duration: 1500.ms, color: Colors.white24),

                    const SizedBox(height: 14),

                    // Secondary CTA - Continue Shopping
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: OutlinedButton.icon(
                        onPressed: widget.onContinueShopping,
                        icon: Icon(Icons.storefront_rounded,
                            size: 20,
                            color: isDark ? Colors.white70 : const Color(0xFF666680)),
                        label: Text(
                          'Continuer mes achats',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: isDark ? Colors.white70 : const Color(0xFF666680),
                          ),
                        ),
                        style: OutlinedButton.styleFrom(
                          side: BorderSide(
                            color: isDark
                                ? Colors.white.withValues(alpha: 0.15)
                                : const Color(0xFFDDD8EE),
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(18),
                          ),
                        ),
                      ),
                    ).animate(delay: 1400.ms).fade().slideY(begin: 0.3, end: 0),

                    const Spacer(flex: 1),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDeliveryStepsPreview(bool isDark) {
    final steps = [
      {'icon': Icons.check_circle_rounded, 'label': 'Confirmée', 'active': true},
      {'icon': Icons.inventory_2_rounded, 'label': 'Préparation', 'active': false},
      {'icon': Icons.delivery_dining_rounded, 'label': 'En route', 'active': false},
      {'icon': Icons.home_rounded, 'label': 'Livrée', 'active': false},
    ];

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark
            ? Colors.white.withValues(alpha: 0.04)
            : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark
              ? Colors.white.withValues(alpha: 0.08)
              : const Color(0xFFEEEAF8),
        ),
        boxShadow: isDark
            ? null
            : [
                BoxShadow(
                  color: const Color(0xFF6C4EF6).withValues(alpha: 0.06),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Icon(Icons.timeline_rounded,
                  color: AppColors.violet, size: 18),
              const SizedBox(width: 8),
              Text(
                'Étapes de livraison',
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 14,
                  color: isDark ? Colors.white : const Color(0xFF1A1035),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: steps.asMap().entries.map((entry) {
              final i = entry.key;
              final step = entry.value;
              final isActive = step['active'] as bool;
              final color = isActive
                  ? const Color(0xFF00E5C5)
                  : (isDark
                      ? Colors.white.withValues(alpha: 0.2)
                      : const Color(0xFFDDD8EE));

              return Expanded(
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        children: [
                          Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: isActive
                                  ? const Color(0xFF00E5C5).withValues(alpha: 0.15)
                                  : (isDark
                                      ? Colors.white.withValues(alpha: 0.05)
                                      : const Color(0xFFF5F3FF)),
                              border: Border.all(color: color, width: 2),
                            ),
                            child: Icon(
                              step['icon'] as IconData,
                              color: color,
                              size: 16,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            step['label'] as String,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: isActive ? FontWeight.w800 : FontWeight.w600,
                              color: isActive
                                  ? const Color(0xFF00E5C5)
                                  : (isDark ? Colors.white54 : const Color(0xFF999999)),
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (i < steps.length - 1)
                      Container(
                        width: 16,
                        height: 2,
                        color: i == 0
                            ? const Color(0xFF00E5C5).withValues(alpha: 0.3)
                            : (isDark
                                ? Colors.white.withValues(alpha: 0.08)
                                : const Color(0xFFEEEAF8)),
                      ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

class _ConfettiParticle {
  final double x;
  final double speed;
  final double size;
  final Color color;
  final double angle;
  final double rotationSpeed;

  _ConfettiParticle({
    required this.x,
    required this.speed,
    required this.size,
    required this.color,
    required this.angle,
    required this.rotationSpeed,
  });
}

class _ConfettiPainter extends CustomPainter {
  final List<_ConfettiParticle> particles;
  final double progress;
  final double screenHeight;

  _ConfettiPainter({
    required this.particles,
    required this.progress,
    required this.screenHeight,
  });

  @override
  void paint(Canvas canvas, Size size) {
    for (var p in particles) {
      final y = -50 + (screenHeight + 100) * progress * p.speed;
      final x = p.x * size.width + sin(p.angle + progress * p.rotationSpeed * pi * 2) * 30;
      final opacity = (1.0 - progress).clamp(0.0, 1.0);

      final paint = Paint()
        ..color = p.color.withValues(alpha: opacity * 0.8)
        ..style = PaintingStyle.fill;

      canvas.save();
      canvas.translate(x, y);
      canvas.rotate(progress * p.rotationSpeed * 2);

      // Draw rectangular confetti pieces
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromCenter(center: Offset.zero, width: p.size, height: p.size * 0.6),
          const Radius.circular(1),
        ),
        paint,
      );
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(_ConfettiPainter oldDelegate) => oldDelegate.progress != progress;
}

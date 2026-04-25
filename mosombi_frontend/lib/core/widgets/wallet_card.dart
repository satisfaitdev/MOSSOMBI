import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../providers/wallet_provider.dart';
import '../theme/app_colors.dart';
import '../theme/app_gradients.dart';

class WalletCard extends StatefulWidget {
  final bool isDark;
  const WalletCard({super.key, required this.isDark});

  @override
  State<WalletCard> createState() => _WalletCardState();
}

class _WalletCardState extends State<WalletCard> {
  final List<_CoinParticle> _particles = [];
  double _prevBalance = 0;
  int _particleKey = 0;
  final _rand = Random();

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final wallet = Provider.of<WalletProvider>(context, listen: false);
    _prevBalance = wallet.balance;
  }

  void _triggerParticles({required bool isDeposit}) {
    final count = isDeposit ? 12 : 8;
    final newParticles = List.generate(count, (i) {
      final key = _particleKey++;
      // Stagger each particle slightly for a wave effect
      final delay = i * 150; // ms between each particle launch
      final dx = (_rand.nextDouble() - 0.5) * 200;
      final dy = -(_rand.nextDouble() * 160 + 60);
      final icon = isDeposit
          ? ['💰', '🪙', '✨', '💵'][_rand.nextInt(4)]
          : ['💸', '🔻', '💳'][_rand.nextInt(3)];
      return _CoinParticle(
        key: ValueKey(key),
        dx: dx,
        dy: dy,
        icon: icon,
        delayMs: delay,
        onDone: () {
          if (mounted) {
            setState(() => _particles.removeWhere((p) => p.key == ValueKey(key)));
          }
        },
      );
    });

    setState(() => _particles.addAll(newParticles));
  }

  String _formattedBalance(double balance) {
    final chars = balance.toStringAsFixed(0).split('').reversed.toList();
    final buffer = StringBuffer();
    for (int i = 0; i < chars.length; i++) {
      if (i > 0 && i % 3 == 0) buffer.write(' ');
      buffer.write(chars[i]);
    }
    return '${buffer.toString().split('').reversed.join()} FCFA';
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<WalletProvider>(
      builder: (context, wallet, child) {
        // Detect balance change and animate
        if (wallet.balance != _prevBalance) {
          final isDeposit = wallet.balance > _prevBalance;
          _prevBalance = wallet.balance;
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) _triggerParticles(isDeposit: isDeposit);
          });
        }

        return Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              decoration: BoxDecoration(
                gradient: AppGradients.primary,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.violet.withValues(alpha: 0.35),
                    blurRadius: 18,
                    offset: const Offset(0, 6),
                  )
                ],
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: const [
                            Text('Solde principal', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w500)),
                            SizedBox(width: 8),
                            Icon(Icons.visibility_outlined, size: 16, color: Colors.white70),
                          ],
                        ),
                        const SizedBox(height: 4),
                        GestureDetector(
                          onTap: () => context.push('/fintech'),
                          behavior: HitTestBehavior.opaque,
                          child: FittedBox(
                            fit: BoxFit.scaleDown,
                            alignment: Alignment.centerLeft,
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                AnimatedSwitcher(
                                  duration: const Duration(milliseconds: 300),
                                  transitionBuilder: (child, animation) => SlideTransition(
                                    position: Tween<Offset>(begin: const Offset(0, 0.5), end: Offset.zero).animate(animation),
                                    child: FadeTransition(opacity: animation, child: child),
                                  ),
                                  child: Text(_formattedBalance(wallet.balance), key: ValueKey(wallet.balance), style: const TextStyle(
                                    fontSize: 24,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.white,
                                    letterSpacing: -0.5,
                                  )),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.all(4),
                                  decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), shape: BoxShape.circle),
                                  child: const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white, size: 14),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      WalletAction(icon: Icons.add_rounded, label: 'Dépôt', onTap: () => context.push('/fintech/topup')),
                      const SizedBox(width: 12),
                      WalletAction(icon: Icons.arrow_upward_rounded, label: 'Retrait', onTap: () => context.push('/fintech/withdraw')),
                      const SizedBox(width: 12),
                      WalletAction(icon: Icons.qr_code_scanner_rounded, label: 'Scan', onTap: () => context.push('/fintech/qr')),
                    ],
                  ),
                ],
              ),
            ).animate(onPlay: (c) => c.repeat())
             .shimmer(duration: 1200.ms, color: Colors.white.withValues(alpha: 0.25), angle: 1.2)
             .then(delay: 2500.ms),

            // Coin particles overlay
            ..._particles,
          ],
        );
      },
    );
  }
}

/// Individual flying coin/money particle
class _CoinParticle extends StatelessWidget {
  final double dx;
  final double dy;
  final String icon;
  final int delayMs;
  final VoidCallback onDone;

  const _CoinParticle({
    super.key,
    required this.dx,
    required this.dy,
    required this.icon,
    required this.onDone,
    this.delayMs = 0,
  });

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: 20,
      left: 60,
      child: IgnorePointer(
        child: Text(icon, style: const TextStyle(fontSize: 26))
            .animate(
              delay: Duration(milliseconds: delayMs),
              onComplete: (_) => onDone(),
            )
            .moveX(begin: 0, end: dx, duration: 3500.ms, curve: Curves.easeOut)
            .moveY(begin: 0, end: dy, duration: 3500.ms, curve: Curves.easeOut)
            .fade(begin: 1, end: 0, delay: Duration(milliseconds: delayMs + 2000), duration: 1500.ms)
            .scale(
              begin: const Offset(0.4, 0.4),
              end: const Offset(1.4, 1.4),
              duration: 600.ms,
              curve: Curves.elasticOut,
            ),
      ),
    );
  }
}

class WalletAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback? onTap;

  const WalletAction({super.key, required this.icon, required this.label, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
            ),
            child: Icon(icon, color: Colors.white, size: 20),
          ),
          const SizedBox(height: 6),
          Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Colors.white)),
        ],
      ),
    );
  }
}

import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_colors.dart';

class AnimatedGradientBg extends StatefulWidget {
  final Widget child;
  final bool isDark;
  const AnimatedGradientBg({super.key, required this.child, this.isDark = false});

  @override
  State<AnimatedGradientBg> createState() => _AnimatedGradientBgState();
}

class _AnimatedGradientBgState extends State<AnimatedGradientBg>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(seconds: 8))
      ..repeat(reverse: true);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (context, _) {
        final t = _ctrl.value;
        final colors = widget.isDark
            ? [
                Color.lerp(AppColors.bgDark1, AppColors.bgDark2, t)!,
                Color.lerp(AppColors.bgDark2, AppColors.bgDark3, t)!,
                Color.lerp(AppColors.bgDark3, AppColors.bgDark1, 1 - t)!,
              ]
            : [
                Color.lerp(AppColors.bgLight1, AppColors.bgLight2, t)!,
                Color.lerp(AppColors.bgLight2, AppColors.bgLight3, t)!,
                Color.lerp(AppColors.bgLight3, AppColors.bgLight1, 1 - t)!,
              ];

        return Stack(
          fit: StackFit.expand,
          children: [
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: colors,
                  begin: Alignment(
                    math.sin(t * math.pi) - 0.5,
                    math.cos(t * math.pi) - 0.5,
                  ),
                  end: Alignment(
                    math.cos(t * math.pi) + 0.5,
                    math.sin(t * math.pi) + 0.5,
                  ),
                ),
              ),
            ),
            // Floating blobs
            _Blob(
              color: (widget.isDark ? AppColors.violet : AppColors.violet)
                  .withValues(alpha: widget.isDark ? 0.12 : 0.08),
              size: 280,
              offset: Offset(
                -60 + math.sin(t * 2 * math.pi) * 30,
                -60 + math.cos(t * 2 * math.pi) * 20,
              ),
            ),
            _Blob(
              color: (widget.isDark ? AppColors.coral : AppColors.coral)
                  .withValues(alpha: widget.isDark ? 0.10 : 0.06),
              size: 220,
              offset: Offset(
                MediaQuery.of(context).size.width - 100 + math.cos(t * 2 * math.pi) * 25,
                MediaQuery.of(context).size.height * 0.4 + math.sin(t * 2 * math.pi) * 30,
              ),
            ),
            _Blob(
              color: (widget.isDark ? AppColors.cyan : AppColors.cyan)
                  .withValues(alpha: widget.isDark ? 0.08 : 0.05),
              size: 180,
              offset: Offset(
                MediaQuery.of(context).size.width * 0.3,
                MediaQuery.of(context).size.height - 150 + math.sin(t * math.pi) * 20,
              ),
            ),
            widget.child,
          ],
        );
      },
    );
  }
}

class _Blob extends StatelessWidget {
  final Color color;
  final double size;
  final Offset offset;

  const _Blob({required this.color, required this.size, required this.offset});

  @override
  Widget build(BuildContext context) {
    return Positioned(
      left: offset.dx,
      top: offset.dy,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: color,
        ),
      ).animate().blur(begin: const Offset(60, 60), end: const Offset(60, 60)),
    );
  }
}

import 'package:flutter/material.dart';

class NeumorphicContainer extends StatelessWidget {
  final Widget child;
  final double distance;
  final double blur;
  final BorderRadiusGeometry? borderRadius;
  final EdgeInsetsGeometry? padding;
  final double? width;
  final double? height;

  const NeumorphicContainer({
    super.key,
    required this.child,
    this.distance = 5.0,
    this.blur = 10.0,
    this.borderRadius,
    this.padding,
    this.width,
    this.height,
  });

  @override
  Widget build(BuildContext context) {
    final bool isDark = Theme.of(context).brightness == Brightness.dark;
    final Color bgColor = isDark ? const Color(0xFF1E1E1E) : const Color(0xFFF0F0F3);
    final Color shadowLight = isDark ? Colors.white.withValues(alpha: 0.05) : Colors.white;
    final Color shadowDark = isDark ? Colors.black.withValues(alpha: 0.5) : const Color(0xFFAEAEC0).withValues(alpha: 0.4);

    return Container(
      width: width,
      height: height,
      padding: padding,
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: borderRadius ?? BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: shadowDark,
            offset: Offset(distance, distance),
            blurRadius: blur,
          ),
          BoxShadow(
            color: shadowLight,
            offset: Offset(-distance, -distance),
            blurRadius: blur,
          ),
        ],
      ),
      child: child,
    );
  }
}

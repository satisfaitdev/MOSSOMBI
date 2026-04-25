import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

enum MosombiTextType { h1, h2, h3, body, caption }

class MosombiText extends StatelessWidget {
  final String text;
  final MosombiTextType type;
  final Color? color;
  final TextAlign? textAlign;
  final int? maxLines;
  final TextOverflow? overflow;

  const MosombiText({
    super.key,
    required this.text,
    this.type = MosombiTextType.body,
    this.color,
    this.textAlign,
    this.maxLines,
    this.overflow,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final defaultColor = isDark ? Colors.white : AppColors.textPrimaryLight;

    return Text(
      text,
      textAlign: textAlign,
      maxLines: maxLines,
      overflow: overflow,
      style: _getStyle(defaultColor),
    );
  }

  TextStyle _getStyle(Color defaultColor) {
    final finalColor = color ?? defaultColor;
    switch (type) {
      case MosombiTextType.h1:
        return TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: finalColor, letterSpacing: -1);
      case MosombiTextType.h2:
        return TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: finalColor, letterSpacing: -0.5);
      case MosombiTextType.h3:
        return TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: finalColor);
      case MosombiTextType.body:
        return TextStyle(fontSize: 14, fontWeight: FontWeight.normal, color: finalColor);
      case MosombiTextType.caption:
        return TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: finalColor.withValues(alpha: 0.7));
    }
  }
}

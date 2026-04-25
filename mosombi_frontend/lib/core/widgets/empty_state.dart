import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'custom_text.dart';
import 'custom_button.dart';

class MosombiEmptyState extends StatelessWidget {
  final String title;
  final String message;
  final IconData icon;
  final VoidCallback? onAction;
  final String? actionText;

  const MosombiEmptyState({
    super.key,
    required this.title,
    required this.message,
    required this.icon,
    this.onAction,
    this.actionText,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final color = isDark ? Colors.white54 : Colors.black54;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 64, color: color),
            ).animate().scale(curve: Curves.elasticOut, duration: 600.ms),
            const SizedBox(height: 24),
            MosombiText(text: title, type: MosombiTextType.h2, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            MosombiText(text: message, type: MosombiTextType.body, color: color, textAlign: TextAlign.center),
            const SizedBox(height: 32),
            if (onAction != null && actionText != null)
              MosombiButton(
                onPressed: onAction,
                text: actionText!,
                isOutline: true,
              ),
          ],
        ).animate().fade().slideY(begin: 0.2, end: 0, duration: 400.ms),
      ),
    );
  }
}

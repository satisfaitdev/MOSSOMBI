import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'custom_text.dart';
import 'custom_button.dart';

class MosombiErrorView extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const MosombiErrorView({
    super.key,
    required this.message,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.redAccent.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.error_outline_rounded, size: 64, color: Colors.redAccent),
            ).animate(onPlay: (c) => c.repeat(reverse: true)).scale(begin: const Offset(1, 1), end: const Offset(1.1, 1.1), duration: 2.seconds),
            const SizedBox(height: 24),
            const MosombiText(text: 'Oups !', type: MosombiTextType.h2, color: Colors.redAccent),
            const SizedBox(height: 12),
            MosombiText(text: message, type: MosombiTextType.body, textAlign: TextAlign.center),
            const SizedBox(height: 32),
            MosombiButton(
              onPressed: onRetry,
              text: 'Réessayer',
              icon: Icons.refresh_rounded,
            ),
          ],
        ).animate().fade().slideY(begin: 0.2, end: 0, duration: 400.ms),
      ),
    );
  }
}

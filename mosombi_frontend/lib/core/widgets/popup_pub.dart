import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_colors.dart';
import 'custom_button.dart';
import 'custom_text.dart';

class PopupPub extends StatelessWidget {
  final String imageUrl;
  final String title;
  final String description;
  final String actionText;
  final VoidCallback onAction;

  const PopupPub({
    super.key,
    required this.imageUrl,
    required this.title,
    required this.description,
    required this.onAction,
    this.actionText = 'Découvrir',
  });

  static Future<void> show(BuildContext context, {
    required String imageUrl,
    required String title,
    required String description,
    required VoidCallback onAction,
  }) {
    return showDialog(
      context: context,
      barrierColor: Colors.black.withValues(alpha: 0.7),
      builder: (_) => PopupPub(
        imageUrl: imageUrl,
        title: title,
        description: description,
        onAction: onAction,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Dialog(
      backgroundColor: Colors.transparent,
      elevation: 0,
      insetPadding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        decoration: BoxDecoration(
          color: isDark ? AppColors.surfaceDark : Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(color: AppColors.violet.withValues(alpha: 0.2), blurRadius: 30, spreadRadius: 5)
          ]
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Head Image
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              child: Stack(
                children: [
                  Image.network(
                    imageUrl,
                    height: 180,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(height: 180, color: AppColors.violet.withValues(alpha: 0.2)),
                  ),
                  Positioned(
                    top: 12,
                    right: 12,
                    child: IconButton(
                      icon: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                        child: const Icon(Icons.close_rounded, color: Colors.white, size: 18),
                      ),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ),
                ],
              ),
            ),
            // Content
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  MosombiText(text: title, type: MosombiTextType.h2, textAlign: TextAlign.center),
                  const SizedBox(height: 12),
                  MosombiText(text: description, type: MosombiTextType.body, textAlign: TextAlign.center),
                  const SizedBox(height: 24),
                  MosombiButton(
                    onPressed: () {
                      Navigator.pop(context);
                      onAction();
                    },
                    text: actionText,
                  ),
                ],
              ),
            )
          ],
        ),
      ).animate().scale(curve: Curves.elasticOut, duration: 600.ms).fade(),
    );
  }
}

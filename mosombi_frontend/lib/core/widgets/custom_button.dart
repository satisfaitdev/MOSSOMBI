import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_colors.dart';
import '../theme/app_gradients.dart';
import 'custom_loader.dart';

class MosombiButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final String text;
  final bool isOutline;
  final bool isLoading;
  final IconData? icon;
  final Color? color;

  const MosombiButton({
    super.key,
    required this.onPressed,
    required this.text,
    this.isOutline = false,
    this.isLoading = false,
    this.icon,
    this.color,
  });

  factory MosombiButton.primary({
    Key? key,
    required VoidCallback? onPressed,
    required String text,
    bool isLoading = false,
    IconData? icon,
    Color? color,
  }) => MosombiButton(
    key: key,
    onPressed: onPressed,
    text: text,
    isOutline: false,
    isLoading: isLoading,
    icon: icon,
    color: color,
  );

  factory MosombiButton.outline({
    Key? key,
    required VoidCallback? onPressed,
    required String text,
    bool isLoading = false,
    IconData? icon,
    Color? color,
  }) => MosombiButton(
    key: key,
    onPressed: onPressed,
    text: text,
    isOutline: true,
    isLoading: isLoading,
    icon: icon,
    color: color,
  );

  factory MosombiButton.secondary({
    Key? key,
    required VoidCallback? onPressed,
    required String text,
    bool isLoading = false,
    IconData? icon,
    Color? color,
  }) => MosombiButton(
    key: key,
    onPressed: onPressed,
    text: text,
    isOutline: false,
    isLoading: isLoading,
    icon: icon,
    color: color ?? AppColors.violet.withValues(alpha: 0.1),
  );

  @override
  Widget build(BuildContext context) {
    if (isOutline) {
      return OutlinedButton(
        onPressed: isLoading ? null : onPressed,
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
          side: BorderSide(color: color ?? AppColors.violet, width: 2),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
        child: _buildContent(context),
      );
    }

    final bool isSecondary = color != null;

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: (onPressed == null || isSecondary) ? null : AppGradients.primary,
        color: onPressed == null
            ? Colors.grey.withValues(alpha: 0.3)
            : (isSecondary ? color : null),
        borderRadius: BorderRadius.circular(16),
        boxShadow: (onPressed != null && !isSecondary) ? [
          BoxShadow(
            color: AppColors.violet.withValues(alpha: 0.4),
            blurRadius: 16,
            offset: const Offset(0, 6),
          )
        ] : [],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: isLoading ? null : onPressed,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
            child: _buildContent(context),
          ),
        ),
      ),
    ).animate(target: onPressed != null ? 1 : 0).saturate();
  }

  Widget _buildContent(BuildContext context) {
    if (isLoading) {
      return const Center(child: MosombiLoader(size: 24));
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bool isSecondary = color != null && !isOutline;
    
    Color contentColor = Colors.white;
    if (isOutline) {
      contentColor = color ?? AppColors.violet;
    } else if (isSecondary) {
      contentColor = isDark ? AppColors.violetLight : AppColors.violet;
    }

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (icon != null) ...[
          Icon(icon, color: contentColor, size: 20),
          const SizedBox(width: 8),
        ],
        Text(
          text,
          style: TextStyle(
            color: contentColor,
            fontWeight: FontWeight.w800,
            fontSize: 16,
            letterSpacing: 0.5,
          ),
        ),
      ],
    );
  }
}

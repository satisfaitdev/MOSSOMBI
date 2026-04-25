import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:flutter/material.dart';

class AuthAnimatedField extends StatefulWidget {
  final TextEditingController controller;
  final String hint;
  final IconData icon;
  final bool isDark;
  final bool obscure;
  final Widget? suffix;

  const AuthAnimatedField({
    super.key,
    required this.controller,
    required this.hint,
    required this.icon,
    required this.isDark,
    this.obscure = false,
    this.suffix,
  });

  @override
  State<AuthAnimatedField> createState() => _AuthAnimatedFieldState();
}

class _AuthAnimatedFieldState extends State<AuthAnimatedField> {
  bool _focused = false;

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        boxShadow: _focused
            ? [BoxShadow(color: AppColors.violet.withValues(alpha: 0.2), blurRadius: 16)]
            : [],
      ),
      child: Focus(
        onFocusChange: (v) => setState(() => _focused = v),
        child: TextField(
          controller: widget.controller,
          obscureText: widget.obscure,
          decoration: InputDecoration(
            hintText: widget.hint,
            prefixIcon: Icon(widget.icon,
                color: _focused ? AppColors.violet : AppColors.textSecondaryLight),
            suffixIcon: widget.suffix,
          ),
        ),
      ),
    );
  }
}

class AuthGradientButton extends StatelessWidget {
  final String label;
  final LinearGradient gradient;
  final VoidCallback onTap;
  final bool isLoading;

  const AuthGradientButton({
    super.key,
    required this.label,
    required this.gradient,
    required this.onTap,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: isLoading ? null : onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: double.infinity,
        height: 56,
        decoration: BoxDecoration(
          gradient: gradient,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: gradient.colors.first.withValues(alpha: 0.4),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Center(
          child: isLoading
              ? const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                )
              : Text(label,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                    letterSpacing: 0.5,
                  )),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'app_colors.dart';

class AppGradients {
  // Light backgrounds
  static const LinearGradient backgroundLight = LinearGradient(
    colors: [AppColors.bgLight1, AppColors.bgLight2, AppColors.bgLight3],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Dark backgrounds
  static const LinearGradient backgroundDark = LinearGradient(
    colors: [AppColors.bgDark1, AppColors.bgDark2, AppColors.bgDark3],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Primary brand gradient (violet → coral)
  static const LinearGradient primary = LinearGradient(
    colors: [AppColors.violet, AppColors.coral],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Auth page gradient (reversed)
  static const LinearGradient auth = LinearGradient(
    colors: [AppColors.coral, AppColors.violet, AppColors.cyan],
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
  );

  // Card gradient
  static const LinearGradient card = LinearGradient(
    colors: [AppColors.violet, AppColors.violetLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Cyan → Mint (services)
  static const LinearGradient accent = LinearGradient(
    colors: [AppColors.cyan, AppColors.mint],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static LinearGradient background(bool isDark) =>
      isDark ? backgroundDark : backgroundLight;
}

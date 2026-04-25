import 'package:flutter/material.dart';

class AppColors {
  // Primary (Cyan/Light Blue gradient from logo)
  static const Color cyanLight = Color(0xFF00E5FF);
  static const Color cyanDark = Color(0xFF0083B0);
  
  // Secondary (Dark Blue/Purple from logo center)
  static const Color purpleDeep = Color(0xFF2B2D66);
  static const Color blueDeep = Color(0xFF1E3C72);
  
  // Accent (Orange/Red from logo top)
  static const Color orangeLight = Color(0xFFFF8008);
  static const Color orangeDark = Color(0xFFFF4B2B);

  // Backgrounds
  static const Color background = Color(0xFFF7F9FC);
  static const Color backgroundDark = Color(0xFF121212);
  static const Color surface = Colors.white;
  
  // Text
  static const Color textPrimary = Color(0xFF1A1A24);
  static const Color textSecondary = Color(0xFF757575);

  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [cyanLight, cyanDark],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient accentGradient = LinearGradient(
    colors: [orangeLight, orangeDark],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient darkGradient = LinearGradient(
    colors: [blueDeep, purpleDeep],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

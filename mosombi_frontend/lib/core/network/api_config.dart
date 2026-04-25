import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiConfig {
  /// Base URL pour l'API Backend Node.js
  /// On la récupère depuis le fichier .env
  static String get baseUrl => dotenv.env['API_BASE_URL'] ?? 'http://192.168.152.94:3000/api/v1';

  // --- Auth Endpoints ---
  static const String register = '/auth/register';
  static const String verifyOtp = '/auth/verify-otp';
  static const String login = '/auth/login';
  static const String checkPhone = '/auth/check-phone';
  static const String sendOtp = '/auth/send-otp';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';
  
  // --- Profile Endpoints ---
  static const String getProfile = '/users/profile';
  static const String updateProfile = '/users/profile';
  static const String onboarding = '/profile/onboarding';

  // --- Wallet Endpoints ---
  static const String getWallet = '/wallet';
  static const String getWalletTransactions = '/wallet/transactions';
  static const String createTransaction = '/wallet/transactions';
  static const String getWalletStats = '/wallet/stats';
}

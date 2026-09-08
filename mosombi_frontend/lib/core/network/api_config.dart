import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiConfig {
  /// Base URL pour l'API Backend Node.js
  /// On la récupère depuis le fichier .env
  static String get baseUrl {
    final url = dotenv.env['API_BASE_URL'];
    if (url == null || url.isEmpty) {
      throw Exception('API_BASE_URL is not defined in the .env file. Please check your configuration.');
    }
    return url;
  }

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
  static const String getSettings = '/profile/settings';
  static const String updateSettingsProfile = '/profile/settings/profile';
  static const String updateSettingsNotifications = '/profile/settings/notifications';
  static const String updateSettingsPrivacy = '/profile/settings/privacy';

  // --- Wallet Endpoints ---
  static const String getWallet = '/wallet';
  static const String getWalletTransactions = '/wallet/transactions';
  static const String createTransaction = '/wallet/transactions';
  static const String getWalletStats = '/wallet/stats';

  // --- Bills Endpoints ---
  static const String billProviders = '/bills/providers';
  static const String billCheck = '/bills/check';
  static const String billPay = '/bills/pay';
  static const String billHistory = '/bills/history';

  // --- Savings Endpoints ---
  static const String savingsBalance = '/savings/balance';
  static const String savingsDeposit = '/savings/deposit';
  static const String savingsWithdraw = '/savings/withdraw';
  static const String savingsHistory = '/savings/history';
  static const String savingsGoal = '/savings/goal';
  static const String savingsGoals = '/savings/goals';

  // --- Cards Endpoints ---
  static const String cardsCreate = '/cards/create';
  static const String cardsList = '/cards';
  static const String cardsFreeze = '/cards'; // + /:id/freeze
  static const String cardsDelete = '/cards'; // + /:id

  // --- Digital Services Endpoints ---
  static const String digitalServiceProviders = '/digital-services/providers';
  static const String digitalServiceProducts = '/digital-services/providers';
  static const String digitalServicePurchase = '/digital-services/purchase';
  static const String digitalServiceHistory = '/digital-services/history';
  static const String digitalServiceValidate = '/digital-services/validate';

  // --- Food Endpoints ---
  static const String foodRestaurants = '/food/restaurants';
  static const String foodRestaurantDetail = '/food/restaurants'; // + /:id
  static const String foodRestaurantMenu = '/food/restaurants'; // + /:id/menu
  static const String foodOrders = '/food/orders';

  // --- Agent Endpoints ---
  static const String agentCashIn = '/wallet/agent/cash-in';
  static const String agentTransactions = '/wallet/agent/transactions';
  static const String agentCommissions = '/wallet/agent/commissions';
}

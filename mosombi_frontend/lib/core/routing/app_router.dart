import 'package:mosombi_frontend/app/pages/splash/splash_screen.dart';
import 'package:mosombi_frontend/app/pages/onboarding/onboarding_screen.dart';
import 'package:mosombi_frontend/app/pages/auth/login_screen.dart';
import 'package:mosombi_frontend/app/pages/auth/register_screen.dart';
import 'package:mosombi_frontend/app/pages/auth/otp_screen.dart';
import 'package:mosombi_frontend/app/pages/auth/auth_onboarding_screen.dart';
import 'package:mosombi_frontend/app/pages/auth/forgot_password_screen.dart';
import 'package:mosombi_frontend/app/pages/auth/splash_ad_screen.dart';
import 'package:mosombi_frontend/app/pages/home/home_screen.dart';
import 'package:mosombi_frontend/app/pages/marketplace/marketplace_screen.dart';
import 'package:mosombi_frontend/app/pages/transport/transport_screen.dart';
import 'package:mosombi_frontend/app/pages/transport/taxi_subscription_screen.dart';
import 'package:mosombi_frontend/app/pages/food/food_screen.dart';
import 'package:mosombi_frontend/app/pages/fintech/fintech_screen.dart';
import 'package:mosombi_frontend/app/pages/fintech/topup_screen.dart';
import 'package:mosombi_frontend/app/pages/fintech/withdraw_screen.dart';
import 'package:mosombi_frontend/app/pages/fintech/qr_scan_screen.dart';
import 'package:mosombi_frontend/app/pages/fintech/transfer_screen.dart';
import 'package:mosombi_frontend/app/pages/fintech/savings_screen.dart';
import 'package:mosombi_frontend/app/pages/fintech/bills_screen.dart';
import 'package:mosombi_frontend/app/pages/fintech/services_screen.dart';
import 'package:mosombi_frontend/app/pages/fintech/virtual_cards_screen.dart';
import 'package:mosombi_frontend/app/pages/ai_assistant/ai_assistant_screen.dart';
import 'package:mosombi_frontend/app/pages/dashboard/agent_dashboard_screen.dart';
import 'package:mosombi_frontend/app/pages/dashboard/agency_dashboard_screen.dart';
import 'package:mosombi_frontend/app/pages/agency/add_product_screen.dart';
import 'package:mosombi_frontend/app/pages/agency/agency_transactions_screen.dart';
import 'package:mosombi_frontend/app/pages/agency/agency_team_screen.dart';
import 'package:mosombi_frontend/app/pages/marketplace/cart_screen.dart';
import 'package:mosombi_frontend/app/pages/marketplace/checkout_screen.dart';
import 'package:mosombi_frontend/app/pages/marketplace/product_details_screen.dart';
import 'package:mosombi_frontend/app/pages/agency/agency_onboarding_screen.dart';
import 'package:mosombi_frontend/app/pages/agency/create_agency_screen.dart';
import 'package:mosombi_frontend/app/pages/agency/join_agency_screen.dart';
import 'package:mosombi_frontend/app/pages/agency/agency_settings_screen.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:mosombi_frontend/core/providers/product_provider.dart';
import 'package:mosombi_frontend/core/widgets/global_search_screen.dart';

final appRouter = GoRouter(
  initialLocation: '/splash',
  routes: [
    GoRoute(
      path: '/splash',
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: '/onboarding',
      builder: (context, state) => const OnboardingScreen(),
    ),
    GoRoute(
      path: '/auth/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/auth/register',
      builder: (context, state) => const RegisterScreen(),
    ),
    GoRoute(
      path: '/auth/otp',
      builder: (context, state) => const OtpScreen(),
    ),
    GoRoute(
      path: '/auth/forgot',
      builder: (context, state) => const ForgotPasswordScreen(),
    ),
    GoRoute(
      path: '/auth/onboarding',
      builder: (context, state) => const AuthOnboardingScreen(),
    ),
    GoRoute(
      path: '/splash-ad',
      builder: (context, state) => const SplashAdScreen(),
    ),
    GoRoute(
      path: '/home',
      builder: (context, state) => const HomeScreen(),
    ),
    GoRoute(
      path: '/search',
      builder: (context, state) => const GlobalSearchScreen(),
    ),
    GoRoute(
      path: '/marketplace',
      builder: (context, state) => const MarketplaceScreen(),
    ),
    GoRoute(
      path: '/transport',
      builder: (context, state) => const TransportScreen(),
    ),
    GoRoute(
      path: '/transport/subscription',
      builder: (context, state) => const TaxiSubscriptionScreen(),
    ),
    GoRoute(
      path: '/food',
      builder: (context, state) => const FoodScreen(),
    ),
    GoRoute(
      path: '/fintech',
      builder: (context, state) => const FintechScreen(),
    ),
    GoRoute(
      path: '/fintech/topup',
      builder: (context, state) => const TopupScreen(),
    ),
    GoRoute(
      path: '/fintech/withdraw',
      builder: (context, state) => const WithdrawScreen(),
    ),
    GoRoute(
      path: '/fintech/qr',
      builder: (context, state) => const QRScanScreen(),
    ),
    GoRoute(
      path: '/fintech/transfer',
      builder: (context, state) {
        final extra = state.extra as Map<String, dynamic>?;
        return TransferScreen(initialCode: extra?['code'] as String?);
      },
    ),
    GoRoute(
      path: '/fintech/savings',
      builder: (context, state) => const SavingsScreen(),
    ),
    GoRoute(
      path: '/fintech/bills',
      builder: (context, state) => const BillsScreen(),
    ),
    GoRoute(
      path: '/fintech/services',
      builder: (context, state) => const ServicesScreen(),
    ),
    GoRoute(
      path: '/fintech/cards',
      builder: (context, state) => const VirtualCardsScreen(),
    ),
    GoRoute(
      path: '/ai',
      builder: (context, state) => const AiAssistantScreen(),
    ),
    GoRoute(
      path: '/agent-dashboard',
      builder: (context, state) => const AgentDashboardScreen(),
    ),
    GoRoute(
      path: '/agency-dashboard',
      builder: (context, state) => const AgencyDashboardScreen(),
    ),
    GoRoute(
      path: '/agency-onboarding',
      builder: (context, state) => const AgencyOnboardingScreen(),
    ),
    GoRoute(
      path: '/agency-settings',
      builder: (context, state) => const AgencySettingsScreen(),
    ),
    GoRoute(
      path: '/create-agency',
      builder: (context, state) => const CreateAgencyScreen(),
    ),
    GoRoute(
      path: '/join-agency',
      builder: (context, state) => const JoinAgencyScreen(),
    ),
    GoRoute(
      path: '/agency/add-product',
      builder: (context, state) => const AddProductScreen(),
    ),
    GoRoute(
      path: '/agency-transactions',
      builder: (context, state) => const AgencyTransactionsScreen(),
    ),
    GoRoute(
      path: '/agency-team',
      builder: (context, state) => const AgencyTeamScreen(),
    ),
    GoRoute(
      path: '/cart',
      builder: (context, state) => const CartScreen(),
    ),
    GoRoute(
      path: '/checkout',
      builder: (context, state) => const CheckoutScreen(),
    ),
    GoRoute(
      path: '/product-details/:id',
      builder: (context, state) {
        final id = state.pathParameters['id']!;
        final products = Provider.of<ProductProvider>(context, listen: false).products;
        final product = products.firstWhere((p) => p.id == id, orElse: () => products.first);
        return ProductDetailsScreen(product: product);
      },
    ),
  ],
);

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
import 'package:mosombi_frontend/app/pages/orders/delivery_tracking_screen.dart';
import 'package:mosombi_frontend/app/pages/orders/dispute_screen.dart';
import 'package:mosombi_frontend/app/pages/delivery/driver_requests_screen.dart';
import 'package:mosombi_frontend/app/pages/delivery/driver_active_delivery_screen.dart';
import 'package:mosombi_frontend/app/pages/profile/backpack_screen.dart';
import 'package:mosombi_frontend/app/pages/profile/settings_screen.dart';
import 'package:mosombi_frontend/app/pages/profile/settings/notification_settings_screen.dart';
import 'package:mosombi_frontend/app/pages/profile/settings/profile_info_settings_screen.dart';
import 'package:mosombi_frontend/app/pages/profile/settings/privacy_settings_screen.dart';
import 'package:mosombi_frontend/app/pages/coins/coins_screen.dart';
import 'package:mosombi_frontend/app/pages/ticketing/ticketing_screen.dart';
import 'package:mosombi_frontend/app/pages/smart_city/smart_city_screen.dart';
import 'package:mosombi_frontend/app/pages/smart_city/add_listing_screen.dart';
import 'package:mosombi_frontend/app/pages/smart_city/moving_request_screen.dart';
import 'package:mosombi_frontend/app/pages/smart_city/property_detail_screen.dart';
import 'package:mosombi_frontend/app/pages/digital_services/digital_services_screen.dart';
import 'package:mosombi_frontend/app/pages/digital_services/history_screen.dart';
import 'package:mosombi_frontend/app/pages/digital_services/purchase_screen.dart';
import 'package:mosombi_frontend/app/pages/travel/travel_screen.dart';
import 'package:mosombi_frontend/app/pages/travel/bus_search_screen.dart';
import 'package:mosombi_frontend/app/pages/travel/carpool_screen.dart';
import 'package:mosombi_frontend/app/pages/travel/flight_search_screen.dart';
import 'package:mosombi_frontend/app/pages/travel/train_search_screen.dart';
import 'package:mosombi_frontend/app/pages/travel/ferry_search_screen.dart';
import 'package:mosombi_frontend/app/pages/travel/car_rental_screen.dart';
import 'package:mosombi_frontend/app/pages/travel/tourist_sites_screen.dart';
import 'package:mosombi_frontend/app/pages/travel/travel_assistant_screen.dart';
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
    GoRoute(
      path: '/orders/tracking',
      builder: (context, state) {
        final extra = state.extra;
        String orderId;
        String? deliveryType;
        if (extra is Map) {
          orderId = extra['orderId'] as String? ?? 'MSB-XXXX';
          deliveryType = extra['deliveryType'] as String?;
        } else {
          orderId = extra as String? ?? 'MSB-XXXX';
        }
        return DeliveryTrackingScreen(orderId: orderId, deliveryType: deliveryType);
      },
    ),
    GoRoute(
      path: '/orders/dispute',
      builder: (context, state) {
        final orderId = state.extra as String? ?? 'MSB-XXXX';
        return DisputeScreen(orderId: orderId);
      },
    ),
    GoRoute(
      path: '/delivery/requests',
      builder: (context, state) => const DriverRequestsScreen(),
    ),
    GoRoute(
      path: '/delivery/active',
      builder: (context, state) {
        final deliveryId = state.extra as String? ?? 'REQ-XXXX';
        return DriverActiveDeliveryScreen(deliveryId: deliveryId);
      },
    ),
    // Coins
    GoRoute(
      path: '/coins',
      builder: (context, state) => const CoinsScreen(),
    ),
    // Ticketing
    GoRoute(
      path: '/ticketing',
      builder: (context, state) => const TicketingScreen(),
    ),
    // Smart City
    GoRoute(
      path: '/smart-city',
      builder: (context, state) => const SmartCityScreen(),
    ),
    GoRoute(
      path: '/smart-city/add-listing',
      builder: (context, state) => const AddListingScreen(),
    ),
    GoRoute(
      path: '/smart-city/moving',
      builder: (context, state) => const MovingRequestScreen(),
    ),
    GoRoute(
      path: '/smart-city/property/:id',
      builder: (context, state) {
        final id = state.pathParameters['id']!;
        return PropertyDetailScreen(id: id);
      },
    ),
    // Digital Services
    GoRoute(
      path: '/digital-services',
      builder: (context, state) => const DigitalServicesScreen(),
    ),
    GoRoute(
      path: '/digital-services/history',
      builder: (context, state) => const DigitalServicesHistoryScreen(),
    ),
    GoRoute(
      path: '/digital-services/purchase',
      builder: (context, state) => const PurchaseScreen(),
    ),
    // Travel
    GoRoute(
      path: '/travel',
      builder: (context, state) => const TravelScreen(),
    ),
    GoRoute(
      path: '/travel/bus',
      builder: (context, state) => const BusSearchScreen(),
    ),
    GoRoute(
      path: '/travel/carpool',
      builder: (context, state) => const CarpoolScreen(),
    ),
    GoRoute(
      path: '/travel/flights',
      builder: (context, state) => const FlightSearchScreen(),
    ),
    GoRoute(
      path: '/travel/trains',
      builder: (context, state) => const TrainSearchScreen(),
    ),
    GoRoute(
      path: '/travel/ferries',
      builder: (context, state) => const FerrySearchScreen(),
    ),
    GoRoute(
      path: '/travel/car-rental',
      builder: (context, state) => const CarRentalScreen(),
    ),
    GoRoute(
      path: '/travel/tourist-sites',
      builder: (context, state) => const TouristSitesScreen(),
    ),
    GoRoute(
      path: '/travel/assistant',
      builder: (context, state) => const TravelAssistantScreen(),
    ),
    // Profile routes
    GoRoute(
      path: '/profile/backpack',
      builder: (context, state) => const BackpackScreen(),
    ),
    GoRoute(
      path: '/profile/settings',
      builder: (context, state) => const SettingsScreen(),
    ),
    GoRoute(
      path: '/profile/settings/notifications',
      builder: (context, state) => const NotificationSettingsScreen(),
    ),
    GoRoute(
      path: '/profile/settings/profile',
      builder: (context, state) => const ProfileInfoSettingsScreen(),
    ),
    GoRoute(
      path: '/profile/settings/privacy',
      builder: (context, state) => const PrivacySettingsScreen(),
    ),
  ],
);

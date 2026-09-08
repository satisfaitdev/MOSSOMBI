import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/di/injection.dart';
import 'core/routing/app_router.dart';
import 'core/theme/app_theme.dart';
import 'package:provider/provider.dart';
import 'core/providers/agency_provider.dart';
import 'core/providers/product_provider.dart';
import 'core/providers/cart_provider.dart';
import 'core/providers/transport_provider.dart';
import 'core/providers/taxi_driver_provider.dart';
import 'core/providers/wallet_provider.dart';
import 'core/providers/notification_provider.dart';
import 'core/providers/ai_assistant_provider.dart';
import 'core/providers/network_provider.dart';
import 'core/providers/food_provider.dart';
import 'core/providers/digital_services_provider.dart';
import 'core/providers/smart_city_provider.dart';
import 'core/providers/travel_provider.dart';
import 'core/providers/backpack_provider.dart';
import 'core/services/ride_notification_service.dart';
import 'core/services/local_cache_service.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'core/services/fcm_service.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: "assets/.env");
  
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      systemNavigationBarColor: Colors.transparent,
      systemNavigationBarDividerColor: Colors.transparent,
      systemNavigationBarIconBrightness: Brightness.light,
      systemNavigationBarContrastEnforced: false,
      systemStatusBarContrastEnforced: false,
    ),
  );
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);

  configureDependencies();
  await LocalCacheService.instance.init();
  await RideNotificationService.initialize();

  // Initialisation sécurisée de Firebase (Option 2)
  try {
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(FCMService.firebaseMessagingBackgroundHandler);
  } catch (e) {
    debugPrint('⚠️ [Firebase] Non configuré (fichier google-services manquant). Mode local conservé.');
  }

  runApp(
    ProviderScope(
      child: MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AgencyProvider()),
          ChangeNotifierProvider(create: (_) => ProductProvider()),
          ChangeNotifierProvider(create: (_) => CartProvider()),
          ChangeNotifierProvider(create: (_) => TransportProvider()),
          ChangeNotifierProvider(create: (_) => TaxiDriverProvider()),
          ChangeNotifierProvider(create: (_) => WalletProvider()),
          ChangeNotifierProvider(create: (_) => NotificationProvider()),
          ChangeNotifierProvider(create: (_) => AiAssistantProvider()),
          ChangeNotifierProvider(create: (_) => NetworkProvider()),
          ChangeNotifierProvider(create: (_) => FoodProvider()),
          ChangeNotifierProvider(create: (_) => DigitalServiceProvider()),
          ChangeNotifierProvider(create: (_) => SmartCityProvider()),
          ChangeNotifierProvider(create: (_) => TravelProvider()),
          ChangeNotifierProvider(create: (_) => BackpackProvider()),
        ],
        child: const MossombiApp(),
      ),
    ),
  );
}

class MossombiApp extends StatefulWidget {
  const MossombiApp({super.key});

  @override
  State<MossombiApp> createState() => _MossombiAppState();
}

class _MossombiAppState extends State<MossombiApp> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      FCMService.instance.init(context);
    });
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        systemNavigationBarColor: Colors.transparent,
        systemNavigationBarDividerColor: Colors.transparent,
        systemNavigationBarIconBrightness: Brightness.light,
        systemNavigationBarContrastEnforced: false,
        systemStatusBarContrastEnforced: false,
      ),
      child: MaterialApp.router(
        title: 'Mossombi',
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system,
        routerConfig: appRouter,
        builder: (context, child) {
          final isOnline = context.watch<NetworkProvider>().isOnline;
          return Directionality(
            textDirection: TextDirection.ltr,
            child: Stack(
              children: [
                if (child != null) child,
                if (!isOnline)
                  Positioned(
                    top: 0,
                    left: 0,
                    right: 0,
                    child: SafeArea(
                      bottom: false,
                      child: Material(
                        elevation: 4,
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          color: Colors.redAccent,
                          alignment: Alignment.center,
                          child: const Text('⚡ Mode Hors Ligne (Navigation Cache)', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}

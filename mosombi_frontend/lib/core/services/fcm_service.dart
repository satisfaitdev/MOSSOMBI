import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:provider/provider.dart';
import 'package:mosombi_frontend/core/providers/notification_provider.dart';
import 'package:mosombi_frontend/core/models/notification_model.dart';

class FCMService {
  FCMService._();
  static final instance = FCMService._();

  bool _isInitialized = false;

  Future<void> init(BuildContext context) async {
    if (_isInitialized) return;

    try {
      final messaging = FirebaseMessaging.instance;
      
      // Demande de permission sur iOS / Android 13+
      NotificationSettings settings = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );
      
      debugPrint('🔔 [FCM] Permissions : ${settings.authorizationStatus}');

      // Token FCM pour cibler spécifiquement ce téléphone depuis NestJS
      final token = await messaging.getToken();
      debugPrint('🔑 [FCM Token] : $token');

      messaging.onTokenRefresh.listen((newToken) {
        debugPrint('🔑 [FCM Token Refresh] : $newToken');
        // TODO: Envoyer 'newToken' au backend NestJS.
      });

      // Écoute FOREGROUND (Appli ouverte et visible)
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('🔔 [FCM FOREGROUND] Message reçu : ${message.notification?.title}');
        
        if (message.notification != null) {
          final title = message.notification?.title ?? "Notification Mossombi";
          final body = message.notification?.body ?? "";
          
          // Ajouter la pastille silencieusement à l'application via Provider
          context.read<NotificationProvider>().addNotification(
            title, 
            body, 
            NotificationCategory.system // Catégorie générique par défaut
          );
        }
      });

      _isInitialized = true;
    } catch (e) {
      debugPrint('⚠️ [FCM] Firebase Messaging non configuré ou échec du Token. L\'application continue normalement en mode local (Option 2).');
    }
  }

  // Fonction de fond OBLIGATOIREMENT statique
  @pragma('vm:entry-point')
  static Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
    try {
      // Pour une vraie app de production, il faut appeler Firebase.initializeApp() ici
      // await Firebase.initializeApp();
      debugPrint("🔔 [FCM BACKGROUND] Message reçu en arrière-plan : ${message.messageId}");
    } catch (e) {
      debugPrint('⚠️ [FCM BACKGROUND] Echec init.');
    }
  }
}

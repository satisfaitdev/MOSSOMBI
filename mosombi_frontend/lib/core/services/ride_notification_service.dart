import 'package:flutter/material.dart' show Color;
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:mosombi_frontend/core/providers/transport_provider.dart';

class RideNotificationService {
  static final _plugin = FlutterLocalNotificationsPlugin();
  static const _channelId = 'mossombi_ride_channel';
  static const _notifId = 42;

  static Future<void> initialize() async {
    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosInit = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );
    await _plugin.initialize(
      settings: const InitializationSettings(android: androidInit, iOS: iosInit),
    );
  }

  static Future<void> showRideNotification(RideStatus status, {String driverName = '', int eta = 0}) async {
    String title;
    String body;

    switch (status) {
      case RideStatus.searching:
        title = '🚕 Mossombi Taxi';
        body = 'Recherche du chauffeur le plus proche...';
        break;
      case RideStatus.waitingAcceptance:
        title = '⏳ En attente';
        body = 'Votre chauffeur analyse votre demande...';
        break;
      case RideStatus.driverEnRoute:
        title = '✅ $driverName est en route !';
        body = 'Votre chauffeur arrive dans $eta minutes.';
        break;
      case RideStatus.arrived:
        title = '🎉 Le taxi est arrivé !';
        body = '$driverName vous attend. Bonne route !';
        break;
      case RideStatus.inTransit:
        title = '🚗 En route vers la destination';
        body = 'Arrivée estimée dans $eta minutes.';
        break;
      case RideStatus.completed:
        title = '✅ Course terminée';
        body = 'Merci d\'avoir voyagé avec Mossombi !';
        break;
      default:
        return;
    }

    final androidDetails = AndroidNotificationDetails(
      _channelId,
      'Mossombi Ride Tracking',
      channelDescription: 'Notifications de suivi en temps réel',
      importance: Importance.high,
      priority: Priority.high,
      ongoing: status == RideStatus.driverEnRoute || status == RideStatus.inTransit,
      autoCancel: status == RideStatus.arrived || status == RideStatus.completed,
      showProgress: status == RideStatus.searching,
      indeterminate: status == RideStatus.searching,
      color: const Color(0xFF6C4EF6),
      icon: '@mipmap/ic_launcher',
      styleInformation: BigTextStyleInformation(body),
    );

    await _plugin.show(
      id: _notifId,
      title: title,
      body: body,
      notificationDetails: NotificationDetails(android: androidDetails),
    );
  }

  static Future<void> cancelRideNotification() async {
    await _plugin.cancel(id: _notifId);
  }

  static Future<void> showWelcomeNotification(String fullName) async {
    final androidDetails = const AndroidNotificationDetails(
      'mossombi_system_channel',
      'Notifications Système',
      channelDescription: 'Messages de bienvenue et informations compte',
      importance: Importance.max,
      priority: Priority.max,
      color: Color(0xFF6C4EF6),
      icon: '@mipmap/ic_launcher',
    );

    await _plugin.show(
      id: 100,
      title: 'Bienvenue $fullName 👋',
      body: 'Heureux de vous revoir sur Mossombi ! L\'app 100% Congolaise.',
      notificationDetails: NotificationDetails(android: androidDetails, iOS: const DarwinNotificationDetails()),
    );
  }
}

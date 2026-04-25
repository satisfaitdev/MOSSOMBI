import 'package:flutter/material.dart';
import '../models/notification_model.dart';
import 'package:uuid/uuid.dart';
import 'package:mosombi_frontend/core/services/local_cache_service.dart';

class NotificationProvider extends ChangeNotifier {
  final _uuid = const Uuid();
  List<NotificationModel> _notifications = [];

  List<NotificationModel> get notifications => _notifications;
  int get unreadCount => _notifications.where((n) => !n.isRead).length;

  NotificationProvider() {
    _initStorage();
  }

  void _initStorage() {
    final cachedData = LocalCacheService.instance.getList(LocalCacheService.notificationBox, 'list');
    if (cachedData != null && cachedData.isNotEmpty) {
      _notifications = cachedData.map((e) => NotificationModel.fromJson(e as Map<String, dynamic>)).toList();
    } else {
      _loadMockData();
      _saveToCache();
    }
  }

  void _saveToCache() {
    LocalCacheService.instance.saveJsonList(
      LocalCacheService.notificationBox, 
      'list', 
      _notifications.take(50).map((e) => e.toJson()).toList()
    );
  }

  void _loadMockData() {
    final now = DateTime.now();
    _notifications = [
      NotificationModel(
        id: _uuid.v4(),
        title: 'Chauffeur VTC en route',
        message: 'Jean (Toyota Yaris) arrive dans 3 min. Tenez-vous prêt au point de départ.',
        date: now.subtract(const Duration(minutes: 5)),
        category: NotificationCategory.transport,
      ),
      NotificationModel(
        id: _uuid.v4(),
        title: 'Recharge réussie',
        message: 'Votre portefeuille Mossombi a été rechargé de 15 000 FCFA.',
        date: now.subtract(const Duration(hours: 2)),
        category: NotificationCategory.fintech,
      ),
      NotificationModel(
        id: _uuid.v4(),
        title: 'Commande expédiée',
        message: 'Vos articles Marketplace (#M-8492) ont été expédiés et sont en cours de livraison.',
        date: now.subtract(const Duration(days: 1)),
        category: NotificationCategory.marketplace,
        isRead: true,
      ),
      NotificationModel(
        id: _uuid.v4(),
        title: 'Bienvenue sur Mossombi !',
        message: 'Découvrez tous nos services : Transport, Livraison, et Mobile Money.',
        date: now.subtract(const Duration(days: 3)),
        category: NotificationCategory.system,
        isRead: true,
      ),
    ];
    notifyListeners();
  }

  void markAsRead(String id) {
    final index = _notifications.indexWhere((n) => n.id == id);
    if (index != -1 && !_notifications[index].isRead) {
      _notifications[index] = _notifications[index].copyWith(isRead: true);
      _saveToCache();
      notifyListeners();
    }
  }

  void markAllAsRead() {
    for (int i = 0; i < _notifications.length; i++) {
      _notifications[i] = _notifications[i].copyWith(isRead: true);
    }
    _saveToCache();
    notifyListeners();
  }

  void deleteNotification(String id) {
    _notifications.removeWhere((n) => n.id == id);
    _saveToCache();
    notifyListeners();
  }

  void addNotification(String title, String message, NotificationCategory category) {
    _notifications.insert(0, NotificationModel(
      id: _uuid.v4(),
      title: title,
      message: message,
      date: DateTime.now(),
      category: category,
    ));
    _saveToCache();
    notifyListeners();
  }
}

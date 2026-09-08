import 'package:flutter/material.dart';
import '../models/notification_model.dart';
import 'package:uuid/uuid.dart';
import 'package:mosombi_frontend/core/services/local_cache_service.dart';
import 'package:mosombi_frontend/core/network/api_client.dart';

class NotificationProvider extends ChangeNotifier {
  final _uuid = const Uuid();
  final ApiClient _apiClient = ApiClient();
  List<NotificationModel> _notifications = [];

  List<NotificationModel> get notifications => _notifications;
  int get unreadCount => _notifications.where((n) => !n.isRead).length;

  NotificationProvider() {
    _initStorage();
    fetchNotifications();
  }

  void _initStorage() {
    final cachedData = LocalCacheService.instance.getList(LocalCacheService.notificationBox, 'list');
    if (cachedData != null && cachedData.isNotEmpty) {
      _notifications = cachedData.map((e) => NotificationModel.fromJson(e as Map<String, dynamic>)).toList();
    }
  }

  Future<void> fetchNotifications() async {
    try {
      final response = await _apiClient.dio.get('/notifications');
      if (response.statusCode == 200 && response.data['success'] == true) {
        final List data = response.data['data'] ?? [];
        _notifications = data.map((e) => NotificationModel(
          id: e['id']?.toString() ?? _uuid.v4(),
          title: e['title']?.toString() ?? '',
          message: e['message']?.toString() ?? '',
          date: DateTime.tryParse(e['created_at']?.toString() ?? '') ?? DateTime.now(),
          category: _parseCategory(e['category']?.toString() ?? ''),
          isRead: e['is_read'] == true || e['read'] == true,
        )).toList();
        _saveToCache();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error fetching notifications: $e');
    }
  }

  NotificationCategory _parseCategory(String cat) {
    switch (cat.toLowerCase()) {
      case 'transport': return NotificationCategory.transport;
      case 'marketplace': return NotificationCategory.marketplace;
      case 'fintech': case 'wallet': return NotificationCategory.fintech;
      default: return NotificationCategory.system;
    }
  }

  void _saveToCache() {
    LocalCacheService.instance.saveJsonList(
      LocalCacheService.notificationBox, 
      'list', 
      _notifications.take(50).map((e) => e.toJson()).toList()
    );
  }

  // _loadMockData removed; fallback offline uses cache instead

  void markAsRead(String id) {
    final index = _notifications.indexWhere((n) => n.id == id);
    if (index != -1 && !_notifications[index].isRead) {
      _notifications[index] = _notifications[index].copyWith(isRead: true);
      _saveToCache();
      notifyListeners();
      _apiClient.dio.put('/notifications/$id/read');
    }
  }

  void markAllAsRead() {
    for (int i = 0; i < _notifications.length; i++) {
      _notifications[i] = _notifications[i].copyWith(isRead: true);
    }
    _saveToCache();
    notifyListeners();
    _apiClient.dio.put('/notifications/read-all');
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

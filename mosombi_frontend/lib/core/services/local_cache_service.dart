import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';

class LocalCacheService {
  LocalCacheService._();
  static final instance = LocalCacheService._();

  static const String walletBox = 'wallet_box';
  static const String notificationBox = 'notification_box';
  static const String productBox = 'product_box';

  Future<void> init() async {
    await Hive.initFlutter();
    await Hive.openBox(walletBox);
    await Hive.openBox(notificationBox);
    await Hive.openBox(productBox);
    debugPrint("💾 [LocalCacheService] Hive Initialisé (Mode Offline prêt).");
  }

  // --- Sauvegarde & Lecture Rapide ---
  
  Future<void> saveJsonList(String boxName, String key, List<Map<String, dynamic>> list) async {
    final box = Hive.box(boxName);
    await box.put(key, jsonEncode(list));
  }

  List<dynamic>? getList(String boxName, String key) {
    final box = Hive.box(boxName);
    final data = box.get(key) as String?;
    if (data == null) return null;
    try {
      return jsonDecode(data) as List<dynamic>;
    } catch (_) {
      return null;
    }
  }

  double? getDouble(String boxName, String key) {
    final box = Hive.box(boxName);
    return box.get(key) as double?;
  }

  Future<void> saveDouble(String boxName, String key, double value) async {
    final box = Hive.box(boxName);
    await box.put(key, value);
  }
}

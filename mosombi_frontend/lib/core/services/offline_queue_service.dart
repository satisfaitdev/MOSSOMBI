import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class OfflineAction {
  final String id;
  final String endpoint;
  final Map<String, dynamic> payload;

  OfflineAction({required this.id, required this.endpoint, required this.payload});

  Map<String, dynamic> toJson() => {
    'id': id,
    'endpoint': endpoint,
    'payload': payload,
  };

  factory OfflineAction.fromJson(Map<String, dynamic> json) => OfflineAction(
    id: json['id'],
    endpoint: json['endpoint'],
    payload: json['payload'],
  );
}

class OfflineQueueService {
  OfflineQueueService._();
  static final instance = OfflineQueueService._();

  static const String _queueKey = 'mossombi_offline_queue';

  Future<void> enqueue(OfflineAction action) async {
    final prefs = await SharedPreferences.getInstance();
    final queueStrings = prefs.getStringList(_queueKey) ?? [];
    queueStrings.add(jsonEncode(action.toJson()));
    await prefs.setStringList(_queueKey, queueStrings);
    debugPrint("📥 [Offline Queue] Action sauvée en mode hors-ligne : ${action.endpoint}");
  }

  Future<void> processQueue() async {
    final prefs = await SharedPreferences.getInstance();
    final queueStrings = prefs.getStringList(_queueKey) ?? [];
    if (queueStrings.isEmpty) return;

    debugPrint("📤 [Offline Queue] Connexion rétablie. Traitement de ${queueStrings.length} actions stockées...");

    List<String> failedAttempts = [];
    for (String str in queueStrings) {
      try {
        final actionMap = jsonDecode(str);
        final action = OfflineAction.fromJson(actionMap);
        
        // Simuler l'envoi HTTP / Socket vers le backend Mossombi
        debugPrint("🔄 Synchronisation de : ${action.endpoint}");
        await Future.delayed(const Duration(milliseconds: 500));
        
      } catch (e) {
        // En cas d'échec réseau passager
        failedAttempts.add(str);
      }
    }

    if (failedAttempts.isEmpty) {
      await prefs.remove(_queueKey);
      debugPrint("✅ [Offline Queue] Synchronisation complète effectuée.");
    } else {
      await prefs.setStringList(_queueKey, failedAttempts);
    }
  }
}

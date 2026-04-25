import 'package:flutter/material.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:mosombi_frontend/core/services/offline_queue_service.dart';

class NetworkProvider extends ChangeNotifier {
  bool _isOnline = true;
  bool get isOnline => _isOnline;

  NetworkProvider() {
    _init();
  }

  void _init() async {
    final connectivity = Connectivity();
    try {
      final results = await connectivity.checkConnectivity();
      _updateStatus(results);
    } catch (e) {
      // Ignorer erreur (souvent liee à l'emulateur)
    }

    connectivity.onConnectivityChanged.listen((List<ConnectivityResult> results) {
      _updateStatus(results);
    });
  }

  void _updateStatus(List<ConnectivityResult> results) {
    bool hasConnection = true;
    if (results.isEmpty || results.every((r) => r == ConnectivityResult.none)) {
      hasConnection = false;
    }
    
    if (_isOnline != hasConnection) {
      _isOnline = hasConnection;
      notifyListeners();
      
      // S'il y a un retour d'Internet, on tente de rejouer la file d'attente
      if (_isOnline) {
        OfflineQueueService.instance.processQueue();
      }
    }
  }
}

import 'package:flutter/foundation.dart';

class CoinsProvider extends ChangeNotifier {
  int _balance = 1250;
  bool _isLoading = false;

  int get balance => _balance;
  bool get isLoading => _isLoading;

  final List<Map<String, dynamic>> _transactions = [
    {'label': 'Achat Marketplace', 'amount': -150, 'date': '15/06/2026', 'type': 'dépense'},
    {'label': 'Trajet VTC', 'amount': -50, 'date': '14/06/2026', 'type': 'dépense'},
    {'label': 'Bonus inscription', 'amount': 500, 'date': '10/06/2026', 'type': 'gain'},
    {'label': 'Parrainage', 'amount': 200, 'date': '08/06/2026', 'type': 'gain'},
    {'label': 'Commande Food', 'amount': -75, 'date': '05/06/2026', 'type': 'dépense'},
    {'label': 'Récompense journalière', 'amount': 25, 'date': '04/06/2026', 'type': 'gain'},
    {'label': 'Achat recharge', 'amount': -100, 'date': '01/06/2026', 'type': 'dépense'},
    {'label': 'Mission complétée', 'amount': 300, 'date': '28/05/2026', 'type': 'gain'},
  ];

  List<Map<String, dynamic>> get transactions => _transactions;

  final List<Map<String, dynamic>> _rewards = [
    {'label': '-10% sur VTC', 'cost': 200, 'icon': 'directions_car'},
    {'label': 'Livraison gratuite', 'cost': 350, 'icon': 'local_shipping'},
    {'label': 'Bon 5€ Food', 'cost': 500, 'icon': 'restaurant'},
    {'label': 'VIP 1 mois', 'cost': 1000, 'icon': 'workspace_premium'},
  ];

  List<Map<String, dynamic>> get rewards => _rewards;

  Future<void> fetchCoins() async {
    _isLoading = true;
    notifyListeners();
    // Simulation d'appel API
    await Future.delayed(const Duration(milliseconds: 500));
    _isLoading = false;
    notifyListeners();
  }
}

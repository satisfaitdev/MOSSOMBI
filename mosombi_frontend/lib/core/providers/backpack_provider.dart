import 'package:flutter/material.dart';
import '../models/backpack_item_model.dart';
import '../network/api_client.dart';

class BackpackProvider extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();

  List<BackpackItem> _items = [];
  bool _isLoading = false;
  String? _error;

  List<BackpackItem> get items => _items;
  bool get isLoading => _isLoading;
  String? get error => _error;

  List<BackpackItem> get subscriptions =>
      _items.where((i) => i.category == 'subscription').toList();

  List<BackpackItem> get badges =>
      _items.where((i) => i.category == 'badge').toList();

  List<BackpackItem> get rewards =>
      _items.where((i) => i.category == 'reward').toList();

  List<BackpackItem> get itemsOnly =>
      _items.where((i) => i.category == 'item').toList();

  List<String> get allCategories => [
        'Tous',
        'Abonnements',
        'Badges',
        'Récompenses',
        'Objets',
      ];

  List<BackpackItem> itemsByCategory(String category) {
    switch (category) {
      case 'Tous':
        return _items;
      case 'Abonnements':
        return subscriptions;
      case 'Badges':
        return badges;
      case 'Récompenses':
        return rewards;
      case 'Objets':
        return itemsOnly;
      default:
        return _items;
    }
  }

  Future<void> fetchItems() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiClient.dio.get('/profile/backpack');
      if (response.statusCode == 200 && response.data['success'] == true) {
        final itemsData = response.data['data']['items'] as List;
        _items = itemsData.map((e) => BackpackItem.fromJson(e)).toList();
      }
    } catch (e) {
      _error = 'Erreur lors du chargement du sac à dos';
      debugPrint('Backpack fetch error: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> equipItem(String id) async {
    try {
      final response = await _apiClient.dio.put('/profile/backpack/items/$id/equip');
      if (response.statusCode == 200 && response.data['success'] == true) {
        await fetchItems();
        return true;
      }
    } catch (e) {
      _error = "Erreur lors de l'équipement";
      debugPrint('Backpack equip error: $e');
    }
    return false;
  }

  Future<bool> unequipItem(String id) async {
    try {
      final response = await _apiClient.dio.put('/profile/backpack/items/$id/unequip');
      if (response.statusCode == 200 && response.data['success'] == true) {
        await fetchItems();
        return true;
      }
    } catch (e) {
      _error = 'Erreur lors du déséquipement';
      debugPrint('Backpack unequip error: $e');
    }
    return false;
  }

  Future<bool> deleteItem(String id) async {
    try {
      final response = await _apiClient.dio.delete('/profile/backpack/items/$id');
      if (response.statusCode == 200 && response.data['success'] == true) {
        await fetchItems();
        return true;
      }
    } catch (e) {
      _error = 'Erreur lors de la suppression';
      debugPrint('Backpack delete error: $e');
    }
    return false;
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}

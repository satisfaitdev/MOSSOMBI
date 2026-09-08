import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import 'package:mosombi_frontend/core/services/local_cache_service.dart';
import 'package:mosombi_frontend/core/network/api_client.dart';
import 'package:mosombi_frontend/core/network/api_config.dart';

enum TransactionType { topup, ridePayment, marketplacePayment, payout, withdrawal, transfer, billPayment, servicePayment, savingsDeposit, savingsWithdraw }
enum PaymentMethod { mtnMomo, airtelMoney, card }

class AppTransaction {
  final String id;
  final String title;
  final double amount;
  final TransactionType type;
  final DateTime date;
  final bool isCredit;

  AppTransaction({
    required this.id,
    required this.title,
    required this.amount,
    required this.type,
    required this.date,
    required this.isCredit,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'amount': amount,
    'type': type.index,
    'date': date.toIso8601String(),
    'isCredit': isCredit,
  };

  factory AppTransaction.fromJson(Map<String, dynamic> json) {
    // Adapter le type (le backend renvoie 'recharge', 'transfer', etc.)
    final String beType = json['type'] as String? ?? '';
    TransactionType tType = TransactionType.topup;
    if (beType == 'recharge' || beType == 'bonus' || beType == '0') tType = TransactionType.topup;
    else if (beType == 'transfer' || beType == '5') tType = TransactionType.transfer;
    else if (beType == 'withdrawal' || beType == '4') tType = TransactionType.withdrawal;
    else if (beType == 'payment' || beType == '1') tType = TransactionType.ridePayment;
    else if (beType.toString() == '2') tType = TransactionType.marketplacePayment;
    else if (beType.toString() == '6') tType = TransactionType.billPayment;
    else if (beType.toString() == '7') tType = TransactionType.servicePayment;
    else tType = TransactionType.values.length > (json['type'] is int ? json['type'] as int : 0) 
        ? TransactionType.values[json['type'] is int ? json['type'] as int : 0] 
        : TransactionType.topup;

    // Décider isCredit
    bool isCredit = json['isCredit'] as bool? ?? false;
    if (json.containsKey('type') && json['type'] is String) {
      isCredit = beType == 'recharge' || beType == 'refund' || beType == 'bonus';
    }

    return AppTransaction(
      id: json['id']?.toString() ?? json['transaction_id']?.toString() ?? '',
      title: json['description']?.toString() ?? json['title']?.toString() ?? 'Transaction',
      amount: double.tryParse(json['amount']?.toString() ?? '0') ?? 0.0,
      type: tType,
      date: DateTime.tryParse(json['created_at']?.toString() ?? json['date']?.toString() ?? '') ?? DateTime.now(),
      isCredit: isCredit,
    );
  }
}

class VirtualCard {
  final String id;
  final String label;
  final String maskedNumber;
  final String expiry;
  final String holderName;
  final String type; // 'VISA' or 'MASTERCARD'
  final List<Color> gradient;
  double balance;
  bool isLocked;

  VirtualCard({
    required this.id,
    required this.label,
    required this.maskedNumber,
    required this.expiry,
    required this.holderName,
    required this.type,
    required this.gradient,
    this.balance = 0,
    this.isLocked = false,
  });
}

class WalletProvider extends ChangeNotifier {
  final _uuid = const Uuid();
  double _balance = 0.0;
  double _savingsBalance = 0.0; // Added for savings accounts
  AppTransaction? latestUnanimatedTx;
  List<AppTransaction> _transactions = [];

  void markTransactionAsAnimated() {
    latestUnanimatedTx = null;
    notifyListeners();
  }

  WalletProvider() {
    _initStorage();
  }

  final ApiClient _apiClient = ApiClient();
  dynamic get dio => _apiClient.dio;

  void _initStorage() {
    final cache = LocalCacheService.instance;
    final cachedBal = cache.getDouble(LocalCacheService.walletBox, 'balance');
    final cachedTxData = cache.getList(LocalCacheService.walletBox, 'transactions');

    if (cachedBal != null && cachedTxData != null && cachedTxData.isNotEmpty) {
      _balance = cachedBal;
      try {
        _transactions = cachedTxData.map((e) => AppTransaction.fromJson(e as Map<String, dynamic>)).toList();
      } catch (e) {
        _transactions = [];
      }
    } else {
      _balance = 0.0;
      _transactions = [];
    }
  }

  Future<void> fetchWalletData() async {
    try {
      final response = await _apiClient.dio.get(ApiConfig.getWallet);
      if (response.statusCode == 200 && response.data['success']) {
        final data = response.data['data'];
        final double bal = double.tryParse(data['wallet']?['balance']?.toString() ?? data['points']?.toString() ?? '0') ?? 0.0;
        _balance = bal;
        
        final double savBal = double.tryParse(data['wallet']?['savings_balance']?.toString() ?? '0') ?? 0.0;
        _savingsBalance = savBal;

        // Récupérer les transactions
        final txs = data['recent_transactions'] as List<dynamic>? ?? [];
        _transactions = txs.map((e) => AppTransaction.fromJson(e as Map<String, dynamic>)).toList();
        
        _saveToCache();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error fetching wallet: $e');
    }
  }

  void _saveToCache() {
    LocalCacheService.instance.saveDouble(LocalCacheService.walletBox, 'balance', _balance);
    LocalCacheService.instance.saveDouble(LocalCacheService.walletBox, 'savings_balance', _savingsBalance);
    final shortList = _transactions.take(50).toList();
    LocalCacheService.instance.saveJsonList(
      LocalCacheService.walletBox, 
      'transactions', 
      shortList.map((e) => e.toJson()).toList()
    );
  }

  List<VirtualCard> _cards = [];

  double get balance => _balance;
  double get savingsBalance => _savingsBalance;
  List<AppTransaction> get transactions {
    final list = List<AppTransaction>.from(_transactions);
    list.sort((a, b) => b.date.compareTo(a.date));
    return list;
  }
  List<VirtualCard> get cards => _cards;

  Future<bool> depositToSavings(double amount) async {
    if (_balance < amount) return false;
    try {
      final response = await _apiClient.dio.post(ApiConfig.savingsDeposit, data: {
        'amount': amount,
      });
      if (response.statusCode == 200 && response.data['success']) {
        _balance -= amount;
        _savingsBalance += amount;
        _saveToCache();
        notifyListeners();
        fetchSavingsBalance();
        fetchWalletData();
        return true;
      }
    } catch (e) {
      debugPrint('Deposit to savings error: $e');
    }
    return false;
  }

  Future<bool> withdrawFromSavings(double amount) async {
    if (_savingsBalance < amount) return false;
    try {
      final response = await _apiClient.dio.post(ApiConfig.savingsWithdraw, data: {
        'amount': amount,
      });
      if (response.statusCode == 200 && response.data['success']) {
        _savingsBalance -= amount;
        _balance += amount;
        _saveToCache();
        notifyListeners();
        fetchSavingsBalance();
        fetchWalletData();
        return true;
      }
    } catch (e) {
      debugPrint('Withdraw from savings error: $e');
    }
    return false;
  }

  Future<String?> topUp(double amount, PaymentMethod method, String phone, {String? customerName, String? customerEmail, double fee = 0}) async {
    try {
      final response = await _apiClient.dio.post(ApiConfig.createTransaction, data: {
        'type': 'recharge',
        'amount': amount,
        'payment_method': 'mobile_money',
        'description': method == PaymentMethod.mtnMomo ? 'Recharge MTN MoMo' : 'Recharge Airtel Money',
        'metadata': {
          'provider': method == PaymentMethod.mtnMomo ? 'MTN' : 'Airtel',
          'phone': phone,
          'fee': fee,
          if (customerName != null) 'customerName': customerName,
          if (customerEmail != null) 'customerEmail': customerEmail,
        }
      });
      if (response.statusCode == 200 && response.data['success']) {
        // On ne crédite pas le solde immédiatement, car le statut est 'pending' (attente du fournisseur)
        final txInfo = response.data['data']['transaction'];
        final tx = AppTransaction.fromJson(txInfo);
        _transactions.insert(0, tx);
        // On ne déclenche PAS l'animation ici, on attend la confirmation de paiement
        _saveToCache();
        notifyListeners();
        fetchWalletData(); // synchro background
        
        final checkoutUrl = txInfo['checkoutUrl'] as String?;
        return checkoutUrl ?? 'success_no_url';
      }
    } catch (e) {
      debugPrint('TopUp Error: $e');
    }
    return null;
  }

  void confirmTopupSuccess(double amount) {
    _balance += amount; // Incrémentation optimiste post-paiement réussi
    if (_transactions.isNotEmpty && _transactions.first.type == TransactionType.topup) {
      latestUnanimatedTx = _transactions.first;
    }
    _saveToCache();
    notifyListeners();
    fetchWalletData(); // Récupération stricte du solde serveur
  }

  Future<bool> withdraw(double amount, String phone, String opLabel, {double fee = 0}) async {
    if (_balance < (amount + fee)) return false;
    try {
      final response = await _apiClient.dio.post(ApiConfig.createTransaction, data: {
        'type': 'withdrawal',
        'amount': amount,
        'payment_method': 'mobile_money',
        'description': 'Retrait $opLabel → $phone',
        'metadata': {
          'provider': opLabel,
          'phone': phone,
          'fee': fee
        }
      });
      if (response.statusCode == 200 && response.data['success']) {
        _balance -= amount; // déduction optimiste
        final tx = AppTransaction.fromJson(response.data['data']['transaction']);
        _transactions.insert(0, tx);
        latestUnanimatedTx = tx;
        _saveToCache();
        notifyListeners();
        fetchWalletData();
        return true;
      }
    } catch (e) {
      debugPrint('Withdraw Error: $e');
    }
    return false;
  }

  Future<List<Map<String, dynamic>>> searchUsers(String query) async {
    try {
      final response = await _apiClient.dio.get('/wallet/search-user?q=$query');
      if (response.statusCode == 200 && response.data['success']) {
        final List users = response.data['data']['users'] ?? [];
        return users.cast<Map<String, dynamic>>();
      }
    } catch (e) {
      debugPrint('Search User Error: $e');
    }
    return [];
  }

  Future<bool> transfer(double amount, String receiverId, String receiverName, String note) async {
    if (_balance < amount) return false;
    try {
      final response = await _apiClient.dio.post(ApiConfig.createTransaction, data: {
        'type': 'transfer',
        'amount': amount,
        'recipient_id': receiverId,
        'description': 'Transfert à $receiverName ${note.isNotEmpty ? "($note)" : ""}',
        'metadata': {
          'note': note
        }
      });
      if (response.statusCode == 200 && response.data['success']) {
        _balance -= amount;
        final tx = AppTransaction.fromJson(response.data['data']['transaction']);
        _transactions.insert(0, tx);
        latestUnanimatedTx = tx;
        _saveToCache();
        notifyListeners();
        fetchWalletData();
        return true;
      }
    } catch (e) {
      debugPrint('Transfer Error: $e');
    }
    return false;
  }

  List<Map<String, dynamic>> _billProviders = [];
  List<Map<String, dynamic>> get billProviders => _billProviders;

  Future<void> fetchBillsProviders() async {
    try {
      final response = await _apiClient.dio.get(ApiConfig.billProviders);
      if (response.statusCode == 200 && response.data['success']) {
        _billProviders = List<Map<String, dynamic>>.from(response.data['data']['providers'] ?? []);
        notifyListeners();
      }
    } catch (e) {
      debugPrint('FetchBillsProviders Error: $e');
    }
  }

  Future<bool> payBill(double amount, String provider, String customerRef) async {
    if (_balance < amount) return false;
    try {
      final response = await _apiClient.dio.post(ApiConfig.billPay, data: {
        'provider': provider,
        'customer_ref': customerRef,
        'amount': amount,
      });
      if (response.statusCode == 200 && response.data['success']) {
        _balance -= amount;
        fetchWalletData();
        notifyListeners();
        return true;
      }
    } catch (e) {
      debugPrint('PayBill Error: $e');
    }
    return false;
  }

  Future<void> fetchSavingsBalance() async {
    try {
      final response = await _apiClient.dio.get(ApiConfig.savingsBalance);
      if (response.statusCode == 200 && response.data['success']) {
        _savingsBalance = double.tryParse(response.data['data']['balance']?.toString() ?? '0') ?? 0.0;
        notifyListeners();
      }
    } catch (e) {
      debugPrint('FetchSavingsBalance Error: $e');
    }
  }

  Future<void> fetchCards() async {
    try {
      final response = await _apiClient.dio.get(ApiConfig.cardsList);
      if (response.statusCode == 200 && response.data['success']) {
        final List cardsData = response.data['data']['cards'] ?? [];
        _cards = cardsData.map((c) {
          final brand = c['brand'] as String? ?? 'VISA';
          return VirtualCard(
            id: c['id']?.toString() ?? '',
            label: c['label']?.toString() ?? 'Ma Carte',
            maskedNumber: c['card_number_mask']?.toString() ?? '**** **** **** 0000',
            expiry: c['expiry']?.toString() ?? '00/00',
            holderName: 'Utilisateur',
            type: brand,
            gradient: brand == 'VISA'
                ? [const Color(0xFF1E1E2C), const Color(0xFF2D2D44)]
                : [const Color(0xFF0A2463), const Color(0xFF1B4F72)],
            balance: double.tryParse(c['balance']?.toString() ?? '0') ?? 0.0,
            isLocked: c['status'] == 'frozen',
          );
        }).toList();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('FetchCards Error: $e');
    }
  }

  Future<bool> payForMarketplaceService(double amount, String description) async {
    if (_balance < amount) return false;
    try {
      final response = await _apiClient.dio.post(ApiConfig.createTransaction, data: {
        'type': 'marketplace_payment',
        'amount': amount,
        'description': description,
      });
      if (response.statusCode == 200 && response.data['success']) {
        _balance -= amount;
        final tx = AppTransaction.fromJson(response.data['data']['transaction']);
        _transactions.insert(0, tx);
        latestUnanimatedTx = tx;
        _saveToCache();
        notifyListeners();
        fetchWalletData();
        return true;
      }
    } catch (e) {
      debugPrint('Marketplace Payment Error: $e');
    }
    return false;
  }

  Future<bool> payService(double amount, String serviceTitle) async {
    if (_balance < amount) return false;
    try {
      final response = await _apiClient.dio.post(ApiConfig.createTransaction, data: {
        'type': 'mobile_topup',
        'amount': amount,
        'description': 'Service: $serviceTitle',
      });
      if (response.statusCode == 200 && response.data['success']) {
        _balance -= amount;
        final tx = AppTransaction.fromJson(response.data['data']['transaction']);
        _transactions.insert(0, tx);
        latestUnanimatedTx = tx;
        _saveToCache();
        notifyListeners();
        fetchWalletData();
        return true;
      }
    } catch (e) {
      debugPrint('PayService Error: $e');
    }
    return false;
  }

  bool payForService(double amount, String title, TransactionType type) {
    if (_balance < amount) return false;
    
    // Pour payForService (souvent utilisé par la course ou un achat rapide synchrone)
    // On peut notifier le backend de la même façon, de manière asynchrone pour ne pas bloquer l'UI immédiate.
    _apiClient.dio.post(ApiConfig.createTransaction, data: {
      'type': 'payment',
      'amount': amount,
      'description': title,
    }).then((response) {
       if (response.statusCode == 200 && response.data['success']) {
         fetchWalletData();
       }
    }, onError: (e) => debugPrint('PayForService API Error: $e'));

    _balance -= amount;
    final tx = AppTransaction(
      id: _uuid.v4(),
      title: title,
      amount: amount,
      type: type,
      date: DateTime.now(),
      isCredit: false,
    );
    _transactions.insert(0, tx);
    latestUnanimatedTx = tx;
    notifyListeners();
    return true;
  }

  Future<VirtualCard?> createVirtualCard(String label, String brand) async {
    try {
      final response = await _apiClient.dio.post(ApiConfig.cardsCreate, data: {
        'label': label,
        'brand': brand,
      });
      if (response.statusCode == 200 && response.data['success']) {
        await fetchCards();
        return _cards.isNotEmpty ? _cards.first : null;
      }
    } catch (e) {
      debugPrint('CreateCard Error: $e');
    }
    return null;
  }

  Future<bool> toggleCardLock(String cardId) async {
    try {
      final response = await _apiClient.dio.patch('${ApiConfig.cardsFreeze}/$cardId/freeze');
      if (response.statusCode == 200 && response.data['success']) {
        await fetchCards();
        return true;
      }
    } catch (e) {
      debugPrint('ToggleCardLock Error: $e');
    }
    return false;
  }

  Future<bool> deleteCard(String cardId) async {
    try {
      final response = await _apiClient.dio.delete('${ApiConfig.cardsDelete}/$cardId');
      if (response.statusCode == 200 && response.data['success']) {
        await fetchCards();
        return true;
      }
    } catch (e) {
      debugPrint('DeleteCard Error: $e');
    }
    return false;
  }

  Future<bool> cashInAgent(String clientPhone, double amount, {String? clientUserId}) async {
    try {
      final response = await _apiClient.dio.post(ApiConfig.agentCashIn, data: {
        'client_phone': clientPhone,
        if (clientUserId != null) 'client_user_id': clientUserId,
        'amount': amount,
      });
      if (response.statusCode == 200 && response.data['success']) {
        _balance -= amount;
        fetchWalletData();
        notifyListeners();
        return true;
      }
    } catch (e) {
      debugPrint('CashInAgent Error: $e');
    }
    return false;
  }
}

import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import 'package:mosombi_frontend/core/services/local_cache_service.dart';
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
        
        final num bal = data['wallet']?['balance'] ?? data['points'] ?? 0;
        _balance = bal.toDouble();
        
        // Simuler un fetch du savings si non supporté nativement
        final num savBal = data['wallet']?['savings_balance'] ?? 0;
        _savingsBalance = savBal.toDouble();

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

  final List<VirtualCard> _cards = [
    VirtualCard(
      id: 'card_1',
      label: 'Mossombi Visa',
      maskedNumber: '**** **** **** 4092',
      expiry: '12/28',
      holderName: 'Utilisateur',
      type: 'VISA',
      gradient: [const Color(0xFF1E1E2C), const Color(0xFF2D2D44)],
      balance: 40000,
    ),
  ];

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
      final response = await _apiClient.dio.post(ApiConfig.createTransaction, data: {
        'type': 'savings_deposit',
        'amount': amount,
        'description': 'Transfert vers compte Épargne'
      });
      if (response.statusCode == 200 && response.data['success']) {
        _balance -= amount;
        _savingsBalance += amount;
        final tx = AppTransaction.fromJson(response.data['data']['transaction']);
        _transactions.insert(0, tx);
        latestUnanimatedTx = tx;
        _saveToCache();
        notifyListeners();
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
      final response = await _apiClient.dio.post(ApiConfig.createTransaction, data: {
        'type': 'savings_withdraw',
        'amount': amount,
        'description': 'Retrait depuis le compte Épargne'
      });
      if (response.statusCode == 200 && response.data['success']) {
        _savingsBalance -= amount;
        _balance += amount;
        final tx = AppTransaction.fromJson(response.data['data']['transaction']);
        _transactions.insert(0, tx);
        latestUnanimatedTx = tx;
        _saveToCache();
        notifyListeners();
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

  Future<bool> payBill(double amount, String billTitle) async {
    if (_balance < amount) return false;
    try {
      final response = await _apiClient.dio.post(ApiConfig.createTransaction, data: {
        'type': 'bill_payment',
        'amount': amount,
        'description': 'Facture: $billTitle',
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
      debugPrint('PayBill Error: $e');
    }
    return false;
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
    }).catchError((e) => debugPrint('PayForService API Error: $e'));

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
    _simulateLedgerSplit(amount, type);
    notifyListeners();
    return true;
  }

  VirtualCard createCard(String label, String type) {
    final last4 = (1000 + DateTime.now().millisecondsSinceEpoch % 9000).toString();
    final card = VirtualCard(
      id: _uuid.v4(),
      label: label,
      maskedNumber: '**** **** **** $last4',
      expiry: '${DateTime.now().month.toString().padLeft(2, '0')}/${(DateTime.now().year + 3) % 100}',
      holderName: 'Utilisateur',
      type: type,
      gradient: type == 'VISA'
          ? [const Color(0xFF1E1E2C), const Color(0xFF2D2D44)]
          : [const Color(0xFF0A2463), const Color(0xFF1B4F72)],
      balance: 0,
    );
    _cards.add(card);
    notifyListeners();
    return card;
  }

  void toggleCardLock(String cardId) {
    final idx = _cards.indexWhere((c) => c.id == cardId);
    if (idx != -1) {
      _cards[idx].isLocked = !_cards[idx].isLocked;
      notifyListeners();
    }
  }

  void deleteCard(String cardId) {
    _cards.removeWhere((c) => c.id == cardId);
    notifyListeners();
  }

  void _simulateLedgerSplit(double amount, TransactionType type) {
    if (type == TransactionType.ridePayment) {
      debugPrint('💰 [LEDGER] Course: ${amount.toStringAsFixed(0)} FCFA → Chauffeur: ${(amount * 0.8).toStringAsFixed(0)} | Mossombi: ${(amount * 0.2).toStringAsFixed(0)}');
    }
  }
}

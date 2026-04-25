import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import 'package:mosombi_frontend/core/providers/wallet_provider.dart';

enum AiActionType { none, bookRide, orderFood, payBill }

class AiMessage {
  final String id;
  final String sender; // 'user' or 'ai'
  final String text;
  final bool isTyping;
  final AiActionCard? actionCard;

  AiMessage({
    required this.id,
    required this.sender,
    required this.text,
    this.isTyping = false,
    this.actionCard,
  });

  AiMessage copyWith({bool? isTyping}) {
    return AiMessage(
      id: id,
      sender: sender,
      text: text,
      isTyping: isTyping ?? this.isTyping,
      actionCard: actionCard,
    );
  }
}

class AiActionCard {
  final String title;
  final String subtitle;
  final double amount;
  final AiActionType type;
  bool isCompleted;

  AiActionCard({
    required this.title,
    required this.subtitle,
    required this.amount,
    required this.type,
    this.isCompleted = false,
  });
}

class AiAssistantProvider extends ChangeNotifier {
  final _uuid = const Uuid();
  List<AiMessage> _messages = [
    AiMessage(
      id: "init_1",
      sender: 'ai',
      text: 'Bonjour ! Je suis Mossombi AI, ton assistant tout-en-un 🤩. Dis-moi par exemple : "Commande un taxi pour Maya-Maya" ou "J\'ai très faim"...',
    )
  ];

  List<AiMessage> get messages => _messages;

  void sendMessage(String text) {
    if (text.trim().isEmpty) return;
    
    // Add User Message
    _messages.add(AiMessage(id: _uuid.v4(), sender: 'user', text: text));
    notifyListeners();

    _simulateResponse(text);
  }

  void _simulateResponse(String query) async {
    final aiMsgId = _uuid.v4();
    _messages.add(AiMessage(
      id: aiMsgId,
      sender: 'ai',
      text: 'Analyse en cours...',
      isTyping: true,
    ));
    notifyListeners();

    await Future.delayed(const Duration(milliseconds: 1500));
    final q = query.toLowerCase();

    String responseText = "Désolé, je ne réponds pas encore à certaines requêtes très avancées. Essayez un transport ou une pizza !";
    AiActionCard? card;

    if (q.contains('taxi') || q.contains('vtc') || q.contains('course') || q.contains('chauffeur') || q.contains('déplac') || q.contains('aller') || q.contains('maya')) {
      responseText = "J'ai trouvé un chauffeur disponible près de votre position. Voici l'offre :";
      card = AiActionCard(
        title: "Course VTC (Économique)",
        subtitle: "Départ Local → Gaffe Finale (Env. 15 min)",
        amount: 3500,
        type: AiActionType.bookRide,
      );
    } else if (q.contains('pizza') || q.contains('manger') || q.contains('faim') || q.contains('resto') || q.contains('food')) {
      responseText = "Très bon choix ! Voici un menu expédié en moins de 30 minutes :";
      card = AiActionCard(
        title: "Pizza Margherita Mega - Mamma Mia",
        subtitle: "Livraison incluse, à domicile",
        amount: 8500,
        type: AiActionType.orderFood,
      );
    }

    final index = _messages.indexWhere((m) => m.id == aiMsgId);
    if (index != -1) {
      _messages[index] = AiMessage(
        id: aiMsgId,
        sender: 'ai',
        text: responseText,
        isTyping: false,
        actionCard: card,
      );
      notifyListeners();
    }
  }

  void completeAction(String messageId, WalletProvider wallet) {
    final index = _messages.indexWhere((m) => m.id == messageId);
    if (index != -1 && _messages[index].actionCard != null) {
      final card = _messages[index].actionCard!;
      if (card.isCompleted) return;

      final success = wallet.payForService(card.amount, card.title, _mapActionToTxType(card.type));
      if (success) {
        card.isCompleted = true;
        
        _messages.add(AiMessage(
          id: _uuid.v4(),
          sender: 'ai',
          text: 'Paiement de ${card.amount.toStringAsFixed(0)} FCFA validé ! 🎉 Le service est en route...',
        ));
        notifyListeners();
      } else {
        _messages.add(AiMessage(
          id: _uuid.v4(),
          sender: 'ai',
          text: 'Solde insuffisant (Solde actuel : ${wallet.balance.toStringAsFixed(0)} FCFA). Veuillez recharger votre portefeuille.',
        ));
        notifyListeners();
      }
    }
  }

  TransactionType _mapActionToTxType(AiActionType type) {
    switch (type) {
      case AiActionType.bookRide: return TransactionType.ridePayment;
      case AiActionType.orderFood: return TransactionType.marketplacePayment;
      case AiActionType.payBill: return TransactionType.billPayment;
      default: return TransactionType.servicePayment;
    }
  }
}

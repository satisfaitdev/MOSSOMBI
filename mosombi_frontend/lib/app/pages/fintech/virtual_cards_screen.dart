import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/wallet_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/glass_container.dart';
import '../../../core/widgets/animated_gradient_bg.dart';

class VirtualCardsScreen extends StatefulWidget {
  const VirtualCardsScreen({super.key});
  @override
  State<VirtualCardsScreen> createState() => _VirtualCardsScreenState();
}

class _VirtualCardsScreenState extends State<VirtualCardsScreen> {
  void _showCreateCardDialog(WalletProvider wallet, bool isDark, Color textColor) {
    String selectedType = 'VISA';
    final labelCtrl = TextEditingController(text: 'Ma Carte');
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx2, setModalState) => AlertDialog(
          backgroundColor: isDark ? const Color(0xFF1E1E2C) : Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: Text('Créer une carte virtuelle', style: TextStyle(color: textColor, fontWeight: FontWeight.w900)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: labelCtrl,
                style: TextStyle(color: textColor),
                decoration: InputDecoration(
                  labelText: 'Nom de la carte',
                  labelStyle: const TextStyle(color: Colors.grey),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: ['VISA', 'MASTERCARD'].map((t) => Expanded(
                  child: GestureDetector(
                    onTap: () => setModalState(() => selectedType = t),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 250),
                      margin: EdgeInsets.only(right: t == 'VISA' ? 8 : 0),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: selectedType == t ? const Color(0xFF6C4EF6).withValues(alpha: 0.15) : Colors.transparent,
                        border: Border.all(color: selectedType == t ? const Color(0xFF6C4EF6) : Colors.grey.withValues(alpha: 0.3)),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(t, textAlign: TextAlign.center, style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: selectedType == t ? const Color(0xFF6C4EF6) : Colors.grey,
                      )),
                    ),
                  ),
                )).toList(),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
            ElevatedButton(
              onPressed: () {
                wallet.createCard(labelCtrl.text.isNotEmpty ? labelCtrl.text : 'Ma Carte', selectedType);
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Carte $selectedType créée ! 💳'), backgroundColor: Colors.green),
                );
              },
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6C4EF6)),
              child: const Text('Créer', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;

    return Consumer<WalletProvider>(
      builder: (context, wallet, _) => Scaffold(
        extendBodyBehindAppBar: true,
        appBar: AppBar(
          backgroundColor: Colors.transparent, elevation: 0,
          title: Text('Mes Cartes Virtuelles', style: TextStyle(color: textColor, fontWeight: FontWeight.w900)),
          centerTitle: true,
          leading: IconButton(icon: Icon(Icons.arrow_back_ios_new_rounded, color: textColor), onPressed: () => context.pop()),
          actions: [
            IconButton(
              icon: const Icon(Icons.add_rounded, color: Color(0xFF6C4EF6), size: 28),
              onPressed: () => _showCreateCardDialog(wallet, isDark, textColor),
            ),
          ],
        ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () => _showCreateCardDialog(wallet, isDark, textColor),
          backgroundColor: const Color(0xFF6C4EF6),
          icon: const Icon(Icons.add_card_rounded, color: Colors.white),
          label: const Text('Nouvelle carte', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        ),
        body: AnimatedGradientBg(
          isDark: isDark,
          child: SafeArea(
            child: wallet.cards.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.credit_card_off_rounded, size: 80, color: Colors.grey),
                        const SizedBox(height: 16),
                        const Text('Aucune carte virtuelle', style: TextStyle(color: Colors.grey, fontSize: 18)),
                        const SizedBox(height: 8),
                        TextButton(
                          onPressed: () => _showCreateCardDialog(wallet, isDark, textColor),
                          child: const Text('Créer ma première carte', style: TextStyle(color: Color(0xFF6C4EF6))),
                        ),
                      ],
                    ).animate().fade(),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(24),
                    physics: const BouncingScrollPhysics(),
                    itemCount: wallet.cards.length,
                    itemBuilder: (ctx, i) {
                      final card = wallet.cards[i];
                      return Column(
                        children: [
                          // 3D Card Widget
                          Container(
                            height: 200,
                            width: double.infinity,
                            margin: const EdgeInsets.only(bottom: 16),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(colors: card.gradient),
                              borderRadius: BorderRadius.circular(24),
                              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.3), blurRadius: 20, offset: const Offset(0, 10))],
                              border: Border.all(color: Colors.white.withValues(alpha: 0.15), width: 1.5),
                            ),
                            child: Stack(
                              children: [
                                if (card.isLocked)
                                  Positioned.fill(child: Container(
                                    decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.5), borderRadius: BorderRadius.circular(24)),
                                    child: const Center(child: Column(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(Icons.lock_rounded, color: Colors.white, size: 40),
                                        SizedBox(height: 8),
                                        Text('Carte Bloquée', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                      ],
                                    )),
                                  )),
                                Padding(
                                  padding: const EdgeInsets.all(24),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                                        Text(card.label, style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.bold, letterSpacing: 1)),
                                        Text(card.type, style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic)),
                                      ]),
                                      const Spacer(),
                                      Text('${card.balance.toStringAsFixed(0)} FCFA', style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900)),
                                      const SizedBox(height: 12),
                                      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                                        Text(card.maskedNumber, style: const TextStyle(color: Colors.white70, fontSize: 14, letterSpacing: 2)),
                                        Text(card.expiry, style: const TextStyle(color: Colors.white70, fontSize: 14)),
                                      ]),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ).animate(delay: (i * 100).ms).fade().scale(begin: const Offset(0.95, 0.95), end: const Offset(1, 1), curve: Curves.easeOut),

                          // Card Actions
                          GlassContainer(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceAround,
                              children: [
                                _cardAction(Icons.copy_rounded, 'Copier', Colors.grey, () {
                                  Clipboard.setData(ClipboardData(text: card.maskedNumber));
                                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Numéro copié')));
                                }),
                                _cardAction(card.isLocked ? Icons.lock_open_rounded : Icons.lock_rounded,
                                  card.isLocked ? 'Débloquer' : 'Bloquer',
                                  card.isLocked ? Colors.green : const Color(0xFFFF9800),
                                  () => wallet.toggleCardLock(card.id),
                                ),
                                _cardAction(Icons.delete_rounded, 'Supprimer', Colors.redAccent, () {
                                  showDialog(
                                    context: context,
                                    builder: (ctx) => AlertDialog(
                                      backgroundColor: isDark ? const Color(0xFF1E1E2C) : Colors.white,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                      title: Text('Supprimer la carte ?', style: TextStyle(color: textColor)),
                                      content: const Text('Cette action est irréversible.'),
                                      actions: [
                                        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
                                        ElevatedButton(
                                          onPressed: () { Navigator.pop(ctx); wallet.deleteCard(card.id); },
                                          style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
                                          child: const Text('Supprimer', style: TextStyle(color: Colors.white)),
                                        ),
                                      ],
                                    ),
                                  );
                                }),
                              ],
                            ),
                          ).animate(delay: (i * 100 + 50).ms).fade(),
                          const SizedBox(height: 24),
                        ],
                      );
                    },
                  ),
          ),
        ),
      ),
    );
  }

  Widget _cardAction(IconData icon, String label, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Column(children: [
        Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: color.withValues(alpha: 0.1), shape: BoxShape.circle),
          child: Icon(icon, color: color, size: 20)),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
      ]),
    );
  }
}

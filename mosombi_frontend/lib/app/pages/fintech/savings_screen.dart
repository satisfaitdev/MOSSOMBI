import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/glass_container.dart';
import '../../../core/widgets/animated_gradient_bg.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/wallet_provider.dart';

class SavingsScreen extends StatefulWidget {
  const SavingsScreen({super.key});
  @override
  State<SavingsScreen> createState() => _SavingsScreenState();
}

class _SavingsScreenState extends State<SavingsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<WalletProvider>().fetchSavingsBalance();
    });
  }

  @override
  Widget build(BuildContext context) {
    final wallet = context.watch<WalletProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final primary = const Color(0xFFFFA000);

    final savingsTxs = wallet.transactions.where((t) => t.type == TransactionType.savingsDeposit || t.type == TransactionType.savingsWithdraw).take(10).toList();

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: Text('Compte Épargne', style: TextStyle(color: textColor, fontWeight: FontWeight.w900)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: textColor),
          onPressed: () => context.pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.flag_rounded, color: Color(0xFFFFA000)),
            onPressed: () => _showGoalDialog(context, wallet, primary, textColor, isDark),
            tooltip: 'Objectifs',
          ),
        ],
      ),
      body: AnimatedGradientBg(
        isDark: isDark,
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                GlassContainer(
                  padding: const EdgeInsets.all(24),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Solde épargné', style: TextStyle(color: textColor.withValues(alpha: 0.7), fontSize: 14)),
                          const SizedBox(height: 8),
                          Text('${wallet.savingsBalance.toStringAsFixed(0)} FCFA', style: TextStyle(color: textColor, fontSize: 32, fontWeight: FontWeight.w900, letterSpacing: -1)),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(color: primary.withValues(alpha: 0.2), shape: BoxShape.circle),
                        child: Icon(Icons.savings_rounded, color: primary, size: 32),
                      ),
                    ],
                  ),
                ).animate().fade().slideY(begin: 0.2, end: 0, duration: 600.ms, curve: Curves.easeOutCubic),

                const SizedBox(height: 16),

                Row(children: [
                  Expanded(child: _actionBtn('Déposer', Icons.add_circle_rounded, primary, textColor, () => _showDepositDialog(context, wallet, primary, textColor, isDark))),
                  const SizedBox(width: 12),
                  Expanded(child: _actionBtn('Retirer', Icons.remove_circle_rounded, Colors.redAccent, textColor, () => _showWithdrawDialog(context, wallet, textColor, isDark))),
                ]),
                const SizedBox(height: 24),

                Text('Historique', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),

                ...savingsTxs.map((tx) {
                  final isDep = tx.type == TransactionType.savingsDeposit;
                  return _buildTx(tx.title, _formatDate(tx.date), '${isDep ? "+" : "-"} ${tx.amount.toStringAsFixed(0)} FCFA', isDep, textColor);
                }),
                if (savingsTxs.isEmpty)
                   Padding(padding: const EdgeInsets.only(top: 20), child: Center(child: Text("Aucune épargne enregistrée", style: TextStyle(color: textColor.withValues(alpha: 0.5))))),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _actionBtn(String label, IconData icon, Color color, Color textColor, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: GlassContainer(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
        child: Column(
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 8),
            Text(label, style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 13)),
          ],
        ),
      ),
    );
  }

  Widget _buildTx(String title, String date, String amt, bool isUp, Color txColor) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: GlassContainer(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: (isUp ? Colors.green : Colors.red).withValues(alpha: 0.15), shape: BoxShape.circle),
              child: Icon(isUp ? Icons.arrow_upward_rounded : Icons.arrow_downward_rounded, color: isUp ? Colors.green : Colors.red, size: 20),
            ),
            const SizedBox(width: 16),
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(color: txColor, fontWeight: FontWeight.bold)),
                Text(date, style: TextStyle(color: txColor.withValues(alpha: 0.5), fontSize: 12)),
              ],
            )),
            Text(amt, style: TextStyle(color: isUp ? Colors.green : Colors.red, fontWeight: FontWeight.w900, fontSize: 15)),
          ],
        ),
      ),
    ).animate().fade().slideX(begin: 0.1, end: 0, curve: Curves.easeOut);
  }

  String _formatDate(DateTime d) {
    return '${d.day}/${d.month.toString().padLeft(2, '0')}/${d.year}';
  }

  void _showDepositDialog(BuildContext context, WalletProvider wallet, Color primary, Color textColor, bool isDark) {
    final ctrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? AppColors.bgDark2 : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text('Dépôt Épargne', style: TextStyle(color: textColor, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Solde Principal: ${wallet.balance.toStringAsFixed(0)} FCFA', style: TextStyle(color: textColor.withValues(alpha: 0.7), fontSize: 12)),
            const SizedBox(height: 16),
            TextField(
              controller: ctrl,
              keyboardType: TextInputType.number,
              style: TextStyle(color: textColor, fontSize: 24, fontWeight: FontWeight.bold),
              decoration: InputDecoration(
                hintText: 'Montant...',
                hintStyle: TextStyle(color: Colors.grey.withValues(alpha: 0.5)),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: primary),
            onPressed: () async {
              final amt = double.tryParse(ctrl.text.replaceAll(' ', ''));
              if (amt != null && amt > 0) {
                 Navigator.pop(ctx);
                 final ok = await wallet.depositToSavings(amt);
                 if (ok && context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Épargne ajoutée ✅'), backgroundColor: Colors.green));
                 } else if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Solde insuffisant'), backgroundColor: Colors.redAccent));
                 }
              }
            },
            child: const Text('Confirmer', style: TextStyle(color: Colors.white)),
          )
        ],
      )
    );
  }

  void _showWithdrawDialog(BuildContext context, WalletProvider wallet, Color textColor, bool isDark) {
    final ctrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? AppColors.bgDark2 : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text('Retrait Épargne', style: TextStyle(color: textColor, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Solde Épargne: ${wallet.savingsBalance.toStringAsFixed(0)} FCFA', style: TextStyle(color: textColor.withValues(alpha: 0.7), fontSize: 12)),
            const SizedBox(height: 16),
            TextField(
              controller: ctrl,
              keyboardType: TextInputType.number,
              style: TextStyle(color: textColor, fontSize: 24, fontWeight: FontWeight.bold),
              decoration: InputDecoration(
                hintText: 'Montant à retirer...',
                hintStyle: TextStyle(color: Colors.grey.withValues(alpha: 0.5)),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            onPressed: () async {
              final amt = double.tryParse(ctrl.text.replaceAll(' ', ''));
              if (amt != null && amt > 0) {
                 Navigator.pop(ctx);
                 final ok = await wallet.withdrawFromSavings(amt);
                 if (ok && context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Retrait effectué ✅'), backgroundColor: Colors.green));
                 } else if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Solde épargne insuffisant'), backgroundColor: Colors.redAccent));
                 }
              }
            },
            child: const Text('Retirer', style: TextStyle(color: Colors.white)),
          )
        ],
      )
    );
  }

  void _showGoalDialog(BuildContext context, WalletProvider wallet, Color primary, Color textColor, bool isDark) {
    final nameCtrl = TextEditingController();
    final targetCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? AppColors.bgDark2 : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text('Objectif d\'épargne', style: TextStyle(color: textColor, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameCtrl,
              style: TextStyle(color: textColor),
              decoration: InputDecoration(
                labelText: 'Nom de l\'objectif',
                labelStyle: TextStyle(color: Colors.grey),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: targetCtrl,
              keyboardType: TextInputType.number,
              style: TextStyle(color: textColor),
              decoration: InputDecoration(
                labelText: 'Montant cible (FCFA)',
                labelStyle: TextStyle(color: Colors.grey),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: primary),
            onPressed: () async {
              final name = nameCtrl.text.trim();
              final target = double.tryParse(targetCtrl.text.replaceAll(' ', ''));
              if (name.isNotEmpty && target != null && target > 0) {
                Navigator.pop(ctx);
                try {
                  final response = await wallet.dio.post('/savings/goal', data: {'name': name, 'target_amount': target});
                  if (response.statusCode == 200 && context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Objectif créé ✅'), backgroundColor: Colors.green));
                  }
                } catch (e) {
                  debugPrint('Goal creation error: $e');
                }
              }
            },
            child: const Text('Créer', style: TextStyle(color: Colors.white)),
          )
        ],
      )
    );
  }
}

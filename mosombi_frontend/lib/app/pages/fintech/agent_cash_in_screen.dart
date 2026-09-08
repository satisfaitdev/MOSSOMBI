import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/wallet_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/glass_container.dart';
import '../../../core/widgets/animated_gradient_bg.dart';

class AgentCashInScreen extends StatefulWidget {
  const AgentCashInScreen({super.key});
  @override
  State<AgentCashInScreen> createState() => _AgentCashInScreenState();
}

class _AgentCashInScreenState extends State<AgentCashInScreen> {
  final _phoneCtrl = TextEditingController();
  final _amountCtrl = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _phoneCtrl.dispose();
    _amountCtrl.dispose();
    super.dispose();
  }

  Future<void> _confirmCashIn() async {
    final phone = _phoneCtrl.text.trim();
    final amountStr = _amountCtrl.text.replaceAll(' ', '').trim();

    if (phone.length < 8) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Numéro client invalide'), backgroundColor: Colors.orange));
      return;
    }

    final amount = double.tryParse(amountStr);
    if (amount == null || amount < 100) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Montant minimum: 100 FCFA'), backgroundColor: Colors.orange));
      return;
    }

    setState(() => _loading = true);

    final wallet = context.read<WalletProvider>();
    final ok = await wallet.cashInAgent(phone, amount);

    if (!mounted) return;
    setState(() => _loading = false);

    if (ok) {
      _phoneCtrl.clear();
      _amountCtrl.clear();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Encaissement de $amount FCFA réussi ✅'), backgroundColor: Colors.green),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Erreur ou solde insuffisant'), backgroundColor: Colors.redAccent),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white54 : AppColors.textSecondaryLight;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent, elevation: 0,
        title: Text('Encaissement Client', style: TextStyle(color: textColor, fontWeight: FontWeight.w900)),
        centerTitle: true,
        leading: IconButton(icon: Icon(Icons.arrow_back_ios_new_rounded, color: textColor), onPressed: () => context.pop()),
      ),
      body: AnimatedGradientBg(
        isDark: isDark,
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: const Color(0xFF00E5C5).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFF00E5C5).withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(color: const Color(0xFF00E5C5).withValues(alpha: 0.2), shape: BoxShape.circle),
                        child: const Icon(Icons.payments_rounded, color: Color(0xFF00E5C5), size: 32),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Encaissement Agent', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 16)),
                            const SizedBox(height: 4),
                            Text('Recevez de l\'argent de vos clients', style: TextStyle(color: hintColor, fontSize: 12)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ).animate().fade().slideY(begin: 0.2, end: 0),

                const SizedBox(height: 32),

                GlassContainer(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Numéro du client', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 14)),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _phoneCtrl,
                        keyboardType: TextInputType.phone,
                        style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold),
                        decoration: InputDecoration(
                          hintText: '+237 6XX XXX XXX',
                          hintStyle: TextStyle(color: hintColor),
                          prefixIcon: const Icon(Icons.phone_rounded, color: Color(0xFF00E5C5)),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                          filled: true,
                          fillColor: Colors.grey.withValues(alpha: 0.1),
                        ),
                      ),
                      const SizedBox(height: 24),

                      Text('Montant (FCFA)', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 14)),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _amountCtrl,
                        keyboardType: TextInputType.number,
                        style: TextStyle(color: textColor, fontSize: 32, fontWeight: FontWeight.w900),
                        decoration: InputDecoration(
                          hintText: '0',
                          hintStyle: TextStyle(color: hintColor),
                          prefixIcon: const Icon(Icons.monetization_on_rounded, color: Color(0xFFFFA000)),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                          filled: true,
                          fillColor: Colors.grey.withValues(alpha: 0.1),
                        ),
                      ),
                      const SizedBox(height: 32),

                      SizedBox(
                        width: double.infinity,
                        height: 56,
                        child: ElevatedButton(
                          onPressed: _loading ? null : _confirmCashIn,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF00E5C5),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          child: _loading
                              ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : const Text('Confirmer l\'encaissement', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ],
                  ),
                ).animate().fade(delay: 200.ms).slideY(begin: 0.2, end: 0),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/wallet_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/glass_container.dart';
import '../../../core/widgets/animated_gradient_bg.dart';

class WithdrawScreen extends StatefulWidget {
  const WithdrawScreen({super.key});
  @override
  State<WithdrawScreen> createState() => _WithdrawScreenState();
}

class _WithdrawScreenState extends State<WithdrawScreen> {
  final _amountCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  int _selectedOp = 0; // 0: MTN, 1: Airtel
  bool _loading = false;
  bool _saveInfo = true;

  final _operators = [
    {'label': 'MTN MoMo', 'color': const Color(0xFFFFCC00), 'icon': Icons.phone_android_rounded},
    {'label': 'Airtel Money', 'color': const Color(0xFFFF0000), 'icon': Icons.phone_android_rounded},
  ];

  List<String> _savedPhones = [];

  @override
  void initState() {
    super.initState();
    _loadSavedPhones();
  }

  Future<void> _loadSavedPhones() async {
    final prefs = await SharedPreferences.getInstance();
    final phones = prefs.getStringList('pref_saved_phones') ?? [];
    if (phones.isNotEmpty && mounted) {
      setState(() {
        _savedPhones = phones;
        _phoneCtrl.text = phones.first;
      });
    }
  }

  Future<void> _deletePhone(String phone) async {
    final prefs = await SharedPreferences.getInstance();
    List<String> phones = prefs.getStringList('pref_saved_phones') ?? [];
    phones.remove(phone);
    await prefs.setStringList('pref_saved_phones', phones);
    if (mounted) setState(() => _savedPhones = phones);
  }

  void _showSavedPhonesDialog() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        final isDark = Theme.of(context).brightness == Brightness.dark;
        return Container(
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E1E2C) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 12),
              Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.withOpacity(0.3), borderRadius: BorderRadius.circular(2))),
              const SizedBox(height: 16),
              Text('Numéros enregistrés', style: TextStyle(fontSize: 18, color: isDark ? Colors.white : Colors.black, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              if (_savedPhones.isEmpty)
                const Padding(padding: EdgeInsets.all(24.0), child: Text('Aucun numéro enregistré', style: TextStyle(color: Colors.grey)))
              else
                ..._savedPhones.map((phone) => ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(color: const Color(0xFF00E5C5).withOpacity(0.1), shape: BoxShape.circle),
                    child: const Icon(Icons.history_rounded, color: Color(0xFF00E5C5), size: 20),
                  ),
                  title: Text(phone, style: TextStyle(fontWeight: FontWeight.bold, color: isDark ? Colors.white : Colors.black87, fontSize: 16)),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent),
                    onPressed: () async {
                      await _deletePhone(phone);
                      if (mounted) {
                        Navigator.pop(ctx);
                        if (_savedPhones.isNotEmpty) _showSavedPhonesDialog();
                      }
                    },
                  ),
                  onTap: () {
                    setState(() => _phoneCtrl.text = phone);
                    Navigator.pop(ctx);
                  },
                )),
              const SizedBox(height: 24),
            ],
          ),
        );
      },
    );
  }

  @override
  void dispose() {
    _amountCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  double _calculateFee(double amount) {
    // Règle des frais - Retrait : 5% en général. 
    // Spécifique Congo (+242, 06, 05) : < 30000 FCFA = 700 FCFA fixe. Sinon = 6%.
    final phone = _phoneCtrl.text.trim();
    bool isCongo = phone.startsWith('+242') || phone.startsWith('06') || phone.startsWith('05') || phone.isEmpty;
    
    if (isCongo) {
      return amount < 30000 ? 700.0 : (amount * 0.06);
    }
    return amount * 0.05;
  }

  Future<void> _submit() async {
    final amount = double.tryParse(_amountCtrl.text.replaceAll(' ', ''));
    if (amount == null || amount <= 0) {
      _showSnack('Montant invalide', Colors.orange);
      return;
    }
    if (_phoneCtrl.text.length < 9) {
      _showSnack('Numéro invalide', Colors.orange);
      return;
    }

    final fee = _calculateFee(amount);

    if (_saveInfo) {
      final prefs = await SharedPreferences.getInstance();
      List<String> phones = prefs.getStringList('pref_saved_phones') ?? [];
      phones.remove(_phoneCtrl.text);
      phones.insert(0, _phoneCtrl.text);
      if (phones.length > 5) phones = phones.sublist(0, 5);
      await prefs.setStringList('pref_saved_phones', phones);
      if (mounted) setState(() => _savedPhones = phones);
    }

    setState(() => _loading = true);
    final wallet = Provider.of<WalletProvider>(context, listen: false);
    
    // Le WithdrawalProvider doit s'assurer que Balance >= Amount + Fee
    if (wallet.balance < (amount + fee)) {
      setState(() => _loading = false);
      _showSnack('Solde insuffisant pour le montant et les frais (${(amount + fee).toStringAsFixed(0)} FCFA requis)', Colors.redAccent);
      return;
    }

    final ok = await wallet.withdraw(amount, _phoneCtrl.text, _operators[_selectedOp]['label'] as String, fee: fee);
    if (!mounted) return;
    setState(() => _loading = false);

    if (ok) {
      _showSuccessDialog(amount, fee);
    } else {
      _showSnack("Échec de l'initialisation du retrait", Colors.redAccent);
    }
  }

  void _showSnack(String msg, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: color));
  }

  void _showSuccessDialog(double amount, double fee) {
    showDialog(
      context: context,
      builder: (ctx) {
        final isDark = Theme.of(context).brightness == Brightness.dark;
        return AlertDialog(
          backgroundColor: isDark ? const Color(0xFF1E1E2C) : Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          icon: const Icon(Icons.check_circle_rounded, color: Color(0xFF00E5C5), size: 64),
          title: Text('Retrait en cours !', textAlign: TextAlign.center, style: TextStyle(color: isDark ? Colors.white : Colors.black, fontWeight: FontWeight.w900)),
          content: Text('${amount.toStringAsFixed(0)} FCFA seront envoyés vers ${_phoneCtrl.text}\\n(Frais: ${fee.toStringAsFixed(0)} FCFA)', textAlign: TextAlign.center, style: TextStyle(color: isDark ? Colors.white70 : Colors.black87)),
          actions: [
            Center(child: TextButton(
              onPressed: () { Navigator.pop(ctx); context.pop(); },
              child: const Text('Fermer', style: TextStyle(color: Color(0xFF00E5C5), fontWeight: FontWeight.bold)),
            )),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final wallet = context.watch<WalletProvider>();

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        systemOverlayStyle: SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
          statusBarBrightness: isDark ? Brightness.dark : Brightness.light,
        ),
        title: Text('Retrait Mobile Money', style: TextStyle(color: textColor, fontWeight: FontWeight.w900)),
        centerTitle: true,
        leading: IconButton(icon: Icon(Icons.arrow_back_ios_new_rounded, color: textColor), onPressed: () => context.pop()),
      ),
      body: AnimatedGradientBg(
        isDark: isDark,
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            physics: const BouncingScrollPhysics(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Solde available
                GlassContainer(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      const Icon(Icons.account_balance_wallet_rounded, color: Color(0xFF00E5C5), size: 28),
                      const SizedBox(width: 16),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Solde disponible', style: TextStyle(color: Colors.grey, fontSize: 12)),
                          Text('${wallet.balance.toStringAsFixed(0)} FCFA', style: TextStyle(color: textColor, fontSize: 22, fontWeight: FontWeight.w900)),
                        ],
                      ),
                    ],
                  ),
                ).animate().fade().slideY(begin: 0.2, end: 0),

                const SizedBox(height: 28),
                Text('Opérateur', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 12),
                Row(
                  children: List.generate(_operators.length, (i) {
                    final op = _operators[i];
                    final isSelected = _selectedOp == i;
                    return Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _selectedOp = i),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          margin: EdgeInsets.only(right: i == 0 ? 8 : 0),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: isSelected ? (op['color'] as Color).withValues(alpha: 0.15) : Colors.transparent,
                            border: Border.all(color: isSelected ? op['color'] as Color : Colors.grey.withValues(alpha: 0.3), width: isSelected ? 2 : 1),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Column(
                            children: [
                              Icon(op['icon'] as IconData, color: op['color'] as Color, size: 28),
                              const SizedBox(height: 8),
                              Text(op['label'] as String, style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 12)),
                            ],
                          ),
                        ),
                      ),
                    );
                  }),
                ).animate(delay: 100.ms).fade(),

                const SizedBox(height: 28),
                Text('Numéro de téléphone', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 12),
                GlassContainer(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                  child: TextField(
                    controller: _phoneCtrl,
                    keyboardType: TextInputType.phone,
                    style: TextStyle(color: textColor, fontWeight: FontWeight.bold),
                    decoration: InputDecoration(
                      border: InputBorder.none,
                      hintText: '+242 06 XXX XX XX',
                      hintStyle: TextStyle(color: Colors.grey.withValues(alpha: 0.5)),
                      prefixIcon: const Icon(Icons.phone_rounded, color: Color(0xFF00E5C5)),
                      suffixIcon: _savedPhones.isNotEmpty ? IconButton(
                        icon: const Icon(Icons.arrow_drop_down_circle_rounded, color: Color(0xFF00E5C5)),
                        onPressed: _showSavedPhonesDialog,
                      ) : null,
                    ),
                  ),
                ).animate(delay: 200.ms).fade().slideY(begin: 0.1, end: 0),

                const SizedBox(height: 8),
                CheckboxListTile(
                  value: _saveInfo,
                  onChanged: (v) => setState(() => _saveInfo = v ?? true),
                  title: Text('Enregistrer ce numéro pour les prochains retraits', style: TextStyle(color: textColor, fontSize: 13)),
                  controlAffinity: ListTileControlAffinity.leading,
                  contentPadding: EdgeInsets.zero,
                  activeColor: const Color(0xFF00E5C5),
                ),

                const SizedBox(height: 20),
                Text('Montant (FCFA)', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 12),
                GlassContainer(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                  child: TextField(
                    controller: _amountCtrl,
                    keyboardType: TextInputType.number,
                    onChanged: (_) => setState(() {}),
                    style: TextStyle(color: textColor, fontSize: 24, fontWeight: FontWeight.w900),
                    decoration: InputDecoration(
                      border: InputBorder.none,
                      hintText: '0',
                      hintStyle: TextStyle(color: Colors.grey.withValues(alpha: 0.5), fontSize: 24),
                      suffixText: 'FCFA',
                      suffixStyle: const TextStyle(color: Colors.grey),
                    ),
                  ),
                ).animate(delay: 300.ms).fade().slideY(begin: 0.1, end: 0),

                ValueListenableBuilder<TextEditingValue>(
                  valueListenable: _amountCtrl,
                  builder: (context, value, child) {
                    final amt = double.tryParse(value.text.replaceAll(' ', '')) ?? 0;
                    if (amt > 0) {
                      final fee = _calculateFee(amt);
                      return Padding(
                        padding: const EdgeInsets.only(top: 12.0),
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFF6584).withOpacity(0.05),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFFF6584).withOpacity(0.2)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.info_outline_rounded, color: Color(0xFFFF6584), size: 20),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text.rich(
                                  TextSpan(
                                    children: [
                                      const TextSpan(text: 'Frais de retrait : ', style: TextStyle(color: Colors.grey)),
                                      TextSpan(text: '${fee.toStringAsFixed(0)} FCFA\n', style: TextStyle(color: textColor, fontWeight: FontWeight.bold)),
                                      const TextSpan(text: 'Total déduit : ', style: TextStyle(color: Colors.grey)),
                                      TextSpan(text: '${(amt + fee).toStringAsFixed(0)} FCFA', style: const TextStyle(color: Color(0xFFFF6584), fontWeight: FontWeight.w900)),
                                    ]
                                  ),
                                  style: const TextStyle(fontSize: 13, height: 1.5),
                                ),
                              ),
                            ],
                          ),
                        ).animate().fadeIn(),
                      );
                    }
                    return const SizedBox.shrink();
                  },
                ),

                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  children: [5000, 10000, 25000, 50000].map((v) => GestureDetector(
                    onTap: () => _amountCtrl.text = v.toString(),
                    child: Chip(
                      label: Text('$v', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF00E5C5))),
                      backgroundColor: const Color(0xFF00E5C5).withValues(alpha: 0.1),
                      side: const BorderSide(color: Color(0xFF00E5C5), width: 1),
                    ),
                  )).toList(),
                ),

                const SizedBox(height: 40),
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _loading ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFF6584),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      elevation: 8,
                    ),
                    child: _loading
                        ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text('Retirer l\'argent', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w900)),
                  ),
                ).animate(delay: 400.ms).scale(curve: Curves.elasticOut),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

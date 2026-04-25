import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:mosombi_frontend/app/pages/fintech/payment_webview_screen.dart';
import 'package:mosombi_frontend/core/providers/wallet_provider.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';

class TopupScreen extends StatefulWidget {
  const TopupScreen({super.key});

  @override
  State<TopupScreen> createState() => _TopupScreenState();
}

class _TopupScreenState extends State<TopupScreen> {
  final _amountController = TextEditingController();
  final _phoneController = TextEditingController();
  PaymentMethod _selectedMethod = PaymentMethod.mtnMomo;
  bool _isLoading = false;
  bool _saveInfo = true;

  final List<int> _quickAmounts = [1000, 2000, 5000, 10000];

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
        _phoneController.text = phones.first;
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
                    setState(() => _phoneController.text = phone);
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

  void _submit() async {
    final amountText = _amountController.text.replaceAll(' ', '');
    final amount = double.tryParse(amountText) ?? 0;
    final phone = _phoneController.text.trim();

    if (amount < 500) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Le montant minimum est de 500 FCFA'), backgroundColor: Colors.red));
      return;
    }
    if (phone.length < 9) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Veuillez entrer un numéro de téléphone valide'), backgroundColor: Colors.red));
      return;
    }

    if (_saveInfo) {
      final prefs = await SharedPreferences.getInstance();
      List<String> phones = prefs.getStringList('pref_saved_phones') ?? [];
      phones.remove(phone);
      phones.insert(0, phone);
      if (phones.length > 5) phones = phones.sublist(0, 5);
      await prefs.setStringList('pref_saved_phones', phones);
      if (mounted) setState(() => _savedPhones = phones);
    }

    setState(() => _isLoading = true);

    // Calculate 10% fee
    final fee = amount * 0.10;

    // Call Provider
    final checkoutUrl = await Provider.of<WalletProvider>(context, listen: false).topUp(amount, _selectedMethod, phone, fee: fee);

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (checkoutUrl != null) {
      if (checkoutUrl.startsWith('http')) {
        debugPrint('=> OPENING PAYMENT WEBVIEW FOR URL: $checkoutUrl');
        // Ouvrir le WebView contrôlé Mossombi et attendre le résultat
        final bool? paymentSuccess = await Navigator.of(context).push<bool>(
          MaterialPageRoute(
            builder: (_) => PaymentWebViewScreen(
              checkoutUrl: checkoutUrl,
              amount: amount,
            ),
          ),
        );

        if (!mounted) return;

        if (paymentSuccess == true) {
          // Paiement validé
          Provider.of<WalletProvider>(context, listen: false).confirmTopupSuccess(amount);
          _showSuccessDialog(amount);
        } else if (paymentSuccess == false) {
          // Paiement explicitement échoué => Reste sur la page
          _showFailedDialog();
        } else {
          // L'utilisateur a fermé sans confirmer (valeur null) => On ne suppose pas un succès
          _showFailedDialog(message: 'La transaction a été interrompue ou fermée manuellement.');
        }
      } else {
        // Fallback si pas d'URL HTTP
        _showPendingDialog();
      }
    } else {
       ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Échec de l\'initialisation du paiement'), backgroundColor: Colors.red));
    }
  }

  void _showPendingDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (c) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        backgroundColor: Theme.of(context).brightness == Brightness.dark ? AppColors.surfaceDark : Colors.white,
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircularProgressIndicator(color: AppColors.violet),
              const SizedBox(height: 24),
              const Text('Action requise', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
              const SizedBox(height: 8),
              const Text("Veuillez finaliser le paiement sur la page qui s'est ouverte.", textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: () {
                  c.pop(); // Close dialog
                  if (mounted) context.pop(); // Go back to wallet/home
                },
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 56),
                  backgroundColor: AppColors.violet,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                ),
                child: const Text('Fermer et voir mon solde', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
              )
            ],
          ),
        ),
      ),
    );
  }
  
  void _showFailedDialog({String? message}) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (c) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        backgroundColor: Theme.of(context).brightness == Brightness.dark ? AppColors.surfaceDark : Colors.white,
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline_rounded, color: Colors.redAccent, size: 80).animate().scale(curve: Curves.elasticOut, duration: 800.ms),
              const SizedBox(height: 24),
              const Text('Échec du paiement', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900)),
              const SizedBox(height: 8),
              Text(message ?? "La transaction n'a pas pu aboutir ou a été annulée.", textAlign: TextAlign.center, style: const TextStyle(color: Colors.grey)),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: () {
                  c.pop(); // Close dialog safely using dialog context
                },
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 56),
                  backgroundColor: Colors.redAccent,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                ),
                child: const Text('Fermer', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
              )
            ],
          ),
        ),
      ),
    );
  }

  void _showSuccessDialog(double amount) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (c) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        backgroundColor: Theme.of(context).brightness == Brightness.dark ? AppColors.surfaceDark : Colors.white,
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.check_circle_rounded, color: Color(0xFF00E5C5), size: 80).animate().scale(curve: Curves.elasticOut, duration: 800.ms),
              const SizedBox(height: 24),
              const Text('Recharge réussie !', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900)),
              const SizedBox(height: 8),
              Text('Votre portefeuille a été crédité de ${amount.toStringAsFixed(0)} FCFA.', textAlign: TextAlign.center, style: const TextStyle(color: Colors.grey)),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: () {
                  context.pop(); // Close dialog
                  context.pop(); // Go back to wallet/home
                },
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 56),
                  backgroundColor: AppColors.violet,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                ),
                child: const Text('Fermer', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
              )
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? AppColors.bgDark1 : Colors.white;
    final textColor = isDark ? Colors.white : AppColors.textPrimaryLight;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: Text('Recharger mon Solde', style: TextStyle(color: textColor, fontWeight: FontWeight.w900, fontSize: 18)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        systemOverlayStyle: SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
          statusBarBrightness: isDark ? Brightness.dark : Brightness.light,
        ),
        centerTitle: true,
        leading: IconButton(icon: Icon(Icons.arrow_back_ios_new_rounded, color: textColor), onPressed: () => context.pop()),
      ),
      body: AnimatedGradientBg(
        isDark: isDark,
        child: SafeArea(
          child: _isLoading 
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const CircularProgressIndicator(color: AppColors.violet),
                    const SizedBox(height: 24),
                    const Text('Veuillez confirmer sur votre téléphone\\n(USSD Push)', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey, fontSize: 16, height: 1.5)).animate(onPlay: (c) => c.repeat(reverse: true)).fade(duration: 1.seconds),
                  ],
                ),
              )
            : SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                physics: const BouncingScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                // Moyens de paiement
                Text('Méthode de paiement', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(child: _buildMethodCard('MTN MoMo', Icons.phone_android_rounded, const Color(0xFFFFCC00), PaymentMethod.mtnMomo, isDark)),
                    const SizedBox(width: 16),
                    Expanded(child: _buildMethodCard('Airtel Money', Icons.phone_android_rounded, const Color(0xFFE91E63), PaymentMethod.airtelMoney, isDark)),
                  ],
                ).animate().slideY(begin: 0.1, duration: 400.ms),
                const SizedBox(height: 32),

                // Montant
                Text('Montant à recharger', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                GlassContainer(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                  child: TextField(
                    controller: _amountController,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    onChanged: (_) => setState(() {}),
                    style: TextStyle(color: textColor, fontSize: 32, fontWeight: FontWeight.w900),
                    textAlign: TextAlign.center,
                    decoration: InputDecoration(
                      hintText: '0',
                      hintStyle: TextStyle(color: isDark ? Colors.white24 : Colors.black26),
                      suffixText: 'FCFA',
                      suffixStyle: const TextStyle(color: AppColors.violet, fontSize: 16, fontWeight: FontWeight.bold),
                      border: InputBorder.none,
                    ),
                  ),
                ).animate().fadeIn(delay: 100.ms),

                ValueListenableBuilder<TextEditingValue>(
                  valueListenable: _amountController,
                  builder: (context, value, child) {
                    final amt = double.tryParse(value.text.replaceAll(' ', '')) ?? 0;
                    if (amt > 0) {
                      final fee = amt * 0.10;
                      return Padding(
                        padding: const EdgeInsets.only(top: 12.0),
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.violet.withOpacity(0.05),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.violet.withOpacity(0.2)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.info_outline_rounded, color: AppColors.violet, size: 20),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text.rich(
                                  TextSpan(
                                    children: [
                                      const TextSpan(text: 'Frais de dépôt (10%) : ', style: TextStyle(color: Colors.grey)),
                                      TextSpan(text: '${fee.toStringAsFixed(0)} FCFA\n', style: TextStyle(color: textColor, fontWeight: FontWeight.bold)),
                                      const TextSpan(text: 'Total prélevé : ', style: TextStyle(color: Colors.grey)),
                                      TextSpan(text: '${(amt + fee).toStringAsFixed(0)} FCFA', style: const TextStyle(color: AppColors.violet, fontWeight: FontWeight.w900)),
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

                const SizedBox(height: 16),
                // Quick amounts
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: _quickAmounts.map((amt) => GestureDetector(
                    onTap: () {
                      _amountController.text = amt.toString();
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: AppColors.violet.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.violet.withValues(alpha: 0.3)),
                      ),
                      child: Text('$amt', style: const TextStyle(color: AppColors.violet, fontWeight: FontWeight.bold)),
                    )
                  )).toList(),
                ).animate().fadeIn(delay: 200.ms),

                const SizedBox(height: 32),

                // Phone number
                Text('Numéro de téléphone', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                GlassContainer(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                  child: TextField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.w600),
                    decoration: InputDecoration(
                      prefixIcon: const Icon(Icons.phone_rounded, color: AppColors.violet),
                      prefixText: '+242 ',
                      prefixStyle: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.w600),
                      hintText: '06 000 00 00',
                      hintStyle: TextStyle(color: isDark ? Colors.white38 : Colors.black38),
                      border: InputBorder.none,
                      suffixIcon: _savedPhones.isNotEmpty ? IconButton(
                        icon: const Icon(Icons.arrow_drop_down_circle_rounded, color: AppColors.violet),
                        onPressed: _showSavedPhonesDialog,
                      ) : null,
                    ),
                  ),
                ).animate().fadeIn(delay: 300.ms),

                const SizedBox(height: 8),
                CheckboxListTile(
                  value: _saveInfo,
                  onChanged: (v) => setState(() => _saveInfo = v ?? true),
                  title: Text('Enregistrer ce numéro de dépôt', style: TextStyle(color: textColor, fontSize: 13)),
                  controlAffinity: ListTileControlAffinity.leading,
                  contentPadding: EdgeInsets.zero,
                  activeColor: AppColors.violet,
                ),

                const SizedBox(height: 48),

                // Valider
                ElevatedButton(
                  onPressed: _submit,
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size(double.infinity, 56),
                    backgroundColor: AppColors.violet,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    elevation: 8,
                    shadowColor: AppColors.violet.withValues(alpha: 0.5),
                  ),
                  child: const Text('Valider la recharge', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 18)),
                ).animate().slideY(begin: 0.3, duration: 400.ms, delay: 400.ms),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMethodCard(String title, IconData icon, Color brandColor, PaymentMethod method, bool isDark) {
    final isSelected = _selectedMethod == method;
    return GestureDetector(
      onTap: () => setState(() => _selectedMethod = method),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: isSelected ? brandColor : Colors.transparent, width: 2),
        ),
        child: GlassContainer(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
          child: Column(
          children: [
            Icon(icon, color: brandColor, size: 28),
            const SizedBox(height: 8),
            Text(title, textAlign: TextAlign.center, style: TextStyle(color: isDark ? Colors.white : Colors.black87, fontWeight: FontWeight.bold, fontSize: 12)),
          ],
        ),
        ),
      ),
    );
  }
}

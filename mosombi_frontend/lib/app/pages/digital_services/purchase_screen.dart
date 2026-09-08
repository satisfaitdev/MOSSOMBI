import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/theme/app_gradients.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/custom_button.dart';
import 'package:mosombi_frontend/core/providers/digital_services_provider.dart';
import 'package:mosombi_frontend/core/providers/wallet_provider.dart';

class PurchaseScreen extends StatefulWidget {
  const PurchaseScreen({super.key});

  @override
  State<PurchaseScreen> createState() => _PurchaseScreenState();
}

class _PurchaseScreenState extends State<PurchaseScreen> with TickerProviderStateMixin {
  Map<String, dynamic>? _provider;
  Map<String, dynamic>? _selectedProduct;
  final _recipientController = TextEditingController();
  bool _loading = false;
  bool _validating = false;
  bool _recipientValid = false;
  String? _customerName;
  String? _validationError;
  String? _purchaseError;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_provider == null) {
      final extra = GoRouterState.of(context).extra as Map<String, dynamic>?;
      if (extra != null) {
        _provider = extra;
        final providerId = _provider!['id'] as String;
        context.read<DigitalServiceProvider>().fetchProducts(providerId);
      }
    }
  }

  @override
  void dispose() {
    _recipientController.dispose();
    super.dispose();
  }

  bool get _requiresPhone => _provider?['requires_phone'] == true;
  String get _recipientLabel => _requiresPhone ? 'Numéro de téléphone' : 'Identifiant client';

  Future<void> _validate() async {
    final recipient = _recipientController.text.trim();
    if (recipient.length < 5) {
      setState(() {
        _recipientValid = false;
        _validationError = 'Minimum 5 caractères';
      });
      return;
    }
    setState(() => _validating = true);
    final result = await context.read<DigitalServiceProvider>().validateRecipient(
      _provider!['id'] as String,
      recipient,
    );
    setState(() {
      _validating = false;
      if (result != null && result['valid'] == true) {
        _recipientValid = true;
        _customerName = result['customer_name'] as String?;
        _validationError = null;
      } else {
        _recipientValid = false;
        _validationError = result?['message'] as String? ?? 'Identifiant invalide';
      }
    });
  }

  Future<void> _purchase() async {
    if (_selectedProduct == null || !_recipientValid) return;

    setState(() {
      _loading = true;
      _purchaseError = null;
    });

    final amount = (_selectedProduct!['price'] as num).toDouble();
    final result = await context.read<DigitalServiceProvider>().purchase(
      _provider!['id'] as String,
      _selectedProduct!['id'] as String,
      _recipientController.text.trim(),
      amount,
    );

    setState(() => _loading = false);

    if (result != null && mounted) {
      context.read<WalletProvider>().fetchWalletData();
      _showSuccessDialog(result);
    } else if (mounted) {
      setState(() => _purchaseError = 'Échec de l\'achat. Vérifiez votre solde.');
    }
  }

  void _showSuccessDialog(Map<String, dynamic> result) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surfaceDark,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.check_circle_rounded, color: AppColors.mint, size: 64),
            const SizedBox(height: 16),
            const Text('Achat réussi !',
                style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            Text(result['message'] as String? ?? '',
                style: const TextStyle(color: Colors.white70, fontSize: 14),
                textAlign: TextAlign.center),
            const SizedBox(height: 16),
            GlassContainer(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  const Text('Code de confirmation',
                      style: TextStyle(color: Colors.white54, fontSize: 12)),
                  const SizedBox(height: 6),
                  Text(result['confirmation_code'] as String? ?? '',
                      style: const TextStyle(
                          color: AppColors.mint, fontSize: 18, fontWeight: FontWeight.w800,
                          letterSpacing: 1.5)),
                ],
              ),
            ),
            const SizedBox(height: 20),
            MosombiButton(
              text: 'Terminé',
              onPressed: () {
                ctx.pop();
                context.pop();
              },
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
    final hintColor = isDark ? Colors.white.withValues(alpha: 0.5) : AppColors.bgDark1.withValues(alpha: 0.5);
    final dsProvider = context.watch<DigitalServiceProvider>();
    final wallet = context.watch<WalletProvider>();

    if (_provider == null) {
      return Scaffold(
        body: AnimatedGradientBg(
          isDark: isDark,
          child: const Center(child: CircularProgressIndicator(color: AppColors.violet)),
        ),
      );
    }

    final providerName = _provider!['name'] as String? ?? '';
    final requiresPhone = _provider!['requires_phone'] == true;

    return Scaffold(
      extendBody: true,
      backgroundColor: Colors.transparent,
      body: AnimatedGradientBg(
        isDark: isDark,
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => context.pop(),
                      child: const Icon(Icons.arrow_back_rounded, color: Colors.white70),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(providerName,
                          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: textColor)),
                    ),
                    Text('${wallet.balance.toStringAsFixed(0)} F',
                        style: const TextStyle(color: AppColors.mint, fontWeight: FontWeight.w700, fontSize: 14)),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Choisissez un forfait',
                          style: TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 12),
                      if (dsProvider.loading)
                        const Center(child: Padding(
                          padding: EdgeInsets.all(20),
                          child: CircularProgressIndicator(color: AppColors.violet),
                        ))
                      else
                        ...dsProvider.products.map((p) {
                          final price = (p['price'] as num?)?.toDouble() ?? 0;
                          final name = p['name'] as String? ?? '';
                          final type = p['type'] as String? ?? '';
                          final duration = p['duration_days'] as int?;
                          final selected = _selectedProduct?['id'] == p['id'];

                          return GestureDetector(
                            onTap: () => setState(() => _selectedProduct = p),
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 10),
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: selected
                                    ? AppColors.violet.withValues(alpha: 0.25)
                                    : Colors.white.withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: selected ? AppColors.violet : Colors.white.withValues(alpha: 0.1),
                                  width: selected ? 2 : 1,
                                ),
                              ),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(name,
                                            style: TextStyle(
                                                color: textColor,
                                                fontWeight: FontWeight.w600,
                                                fontSize: 14)),
                                        if (duration != null)
                                          Text('Valable ${duration} jours',
                                              style: const TextStyle(color: Colors.white54, fontSize: 11)),
                                        if (type == 'data')
                                          Text('${p['value']} Mo',
                                              style: const TextStyle(color: AppColors.cyan, fontSize: 11)),
                                      ],
                                    ),
                                  ),
                                  Text('${price.toStringAsFixed(0)} F',
                                      style: TextStyle(
                                          color: selected ? AppColors.mint : Colors.white70,
                                          fontWeight: FontWeight.w800,
                                          fontSize: 16)),
                                  if (selected)
                                    const Padding(
                                      padding: EdgeInsets.only(left: 8),
                                      child: Icon(Icons.check_circle, color: AppColors.mint, size: 20),
                                    ),
                                ],
                              ),
                            ).animate().fade(duration: 300.ms).slideX(begin: 0.05, end: 0),
                          );
                        }),
                      if (_selectedProduct != null) ...[
                        const SizedBox(height: 20),
                        Text(_recipientLabel,
                            style: TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 10),
                        GlassContainer(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                          child: TextField(
                            controller: _recipientController,
                            keyboardType: requiresPhone ? TextInputType.phone : TextInputType.text,
                            onChanged: (_) {
                              if (_recipientValid) setState(() => _recipientValid = false);
                              if (_validationError != null) setState(() => _validationError = null);
                            },
                            style: TextStyle(color: textColor),
                            decoration: InputDecoration(
                              hintText: requiresPhone ? 'Ex: 690000000' : 'Ex: AB-123456',
                              hintStyle: TextStyle(color: hintColor, fontSize: 14),
                              border: InputBorder.none,
                              suffixIcon: _validating
                                  ? const Padding(
                                      padding: EdgeInsets.all(12),
                                      child: SizedBox(
                                          width: 18, height: 18,
                                          child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.violet)),
                                    )
                                  : GestureDetector(
                                      onTap: _recipientController.text.trim().length >= 5 ? _validate : null,
                                      child: Icon(Icons.verified_rounded,
                                          color: _recipientValid
                                              ? AppColors.mint
                                              : (_recipientController.text.trim().length >= 5
                                                  ? AppColors.violet
                                                  : hintColor),
                                          size: 22),
                                    ),
                            ),
                          ),
                        ),
                        if (_customerName != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Row(
                              children: [
                                const Icon(Icons.person, color: AppColors.mint, size: 16),
                                const SizedBox(width: 6),
                                Text(_customerName!,
                                    style: const TextStyle(color: AppColors.mint, fontSize: 13, fontWeight: FontWeight.w600)),
                              ],
                            ),
                          ),
                        if (_validationError != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(_validationError!,
                                style: const TextStyle(color: AppColors.coral, fontSize: 12)),
                          ),
                      ],
                      if (_purchaseError != null) ...[
                        const SizedBox(height: 12),
                        Text(_purchaseError!,
                            style: const TextStyle(color: AppColors.coral, fontSize: 13)),
                      ],
                      if (_selectedProduct != null) ...[
                        const SizedBox(height: 24),
                        GlassContainer(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Fournisseur',
                                      style: TextStyle(color: Colors.white54, fontSize: 13)),
                                  Text(providerName,
                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Forfait',
                                      style: TextStyle(color: Colors.white54, fontSize: 13)),
                                  Text(_selectedProduct!['name'] as String? ?? '',
                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Destinataire',
                                      style: TextStyle(color: Colors.white54, fontSize: 13)),
                                  Text(_recipientController.text.isEmpty ? '---' : _recipientController.text,
                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
                                ],
                              ),
                              const Divider(color: Colors.white12, height: 24),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Total',
                                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
                                  Text('${(_selectedProduct!['price'] as num).toStringAsFixed(0)} F CFA',
                                      style: const TextStyle(color: AppColors.mint, fontWeight: FontWeight.w800, fontSize: 18)),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),
                        SizedBox(
                          width: double.infinity,
                          height: 52,
                          child: MosombiButton(
                            text: 'Confirmer et payer',
                            isLoading: _loading,
                            onPressed: (!_recipientValid || _loading || _recipientController.text.trim().isEmpty)
                                ? null
                                : _purchase,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

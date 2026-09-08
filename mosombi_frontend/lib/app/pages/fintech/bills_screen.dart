import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/wallet_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/glass_container.dart';
import '../../../core/widgets/animated_gradient_bg.dart';
import 'package:shared_preferences/shared_preferences.dart';

class BillsScreen extends StatefulWidget {
  const BillsScreen({super.key});
  @override
  State<BillsScreen> createState() => _BillsScreenState();
}

class _BillsScreenState extends State<BillsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<WalletProvider>().fetchBillsProviders();
    });
  }

  Future<void> _openConfirmSheet(Map<String, dynamic> bill) async {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => _BillConfirmSheet(bill: bill, textColor: textColor, isDark: isDark),
    );
  }

  IconData _categoryIcon(String category) {
    switch (category) {
      case 'electricity': return Icons.bolt_rounded;
      case 'water': return Icons.water_drop_rounded;
      case 'tv': return Icons.live_tv_rounded;
      case 'internet': return Icons.wifi_rounded;
      default: return Icons.receipt_long_rounded;
    }
  }

  Color _categoryColor(String category) {
    switch (category) {
      case 'electricity': return const Color(0xFFFFCC00);
      case 'water': return const Color(0xFF00D4FF);
      case 'tv': return const Color(0xFF6C4EF6);
      case 'internet': return const Color(0xFF00E5C5);
      default: return const Color(0xFF4CAF50);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white54 : AppColors.textSecondaryLight;
    final wallet = context.watch<WalletProvider>();
    final providers = wallet.billProviders;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent, elevation: 0,
        title: Text('Mes Factures', style: TextStyle(color: textColor, fontWeight: FontWeight.w900)),
        centerTitle: true,
        leading: IconButton(icon: Icon(Icons.arrow_back_ios_new_rounded, color: textColor), onPressed: () => context.pop()),
      ),
      body: AnimatedGradientBg(
        isDark: isDark,
        child: SafeArea(
          child: providers.isEmpty
              ? const Center(child: CircularProgressIndicator())
              : ListView.builder(
                  padding: const EdgeInsets.all(24),
                  physics: const BouncingScrollPhysics(),
                  itemCount: providers.length,
                  itemBuilder: (ctx, i) {
                    final bill = providers[i];
                    final category = bill['category'] as String? ?? '';
                    final color = _categoryColor(category);
                    return Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      child: GlassContainer(
                        padding: const EdgeInsets.all(20),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: color.withValues(alpha: 0.15),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(_categoryIcon(category), color: color, size: 24),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Text(bill['name'] as String? ?? '', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 15)),
                                const SizedBox(height: 4),
                                Text(bill['category'] as String? ?? '', style: TextStyle(color: hintColor, fontSize: 11)),
                              ]),
                            ),
                            const SizedBox(width: 12),
                            SizedBox(
                              width: 80,
                              height: 38,
                              child: ElevatedButton(
                                onPressed: () => _openConfirmSheet(bill),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFFFF9800),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  padding: EdgeInsets.zero,
                                ),
                                child: const Text('Payer', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ).animate(delay: (i * 80).ms).fade().slideX(begin: 0.1, end: 0);
                  },
                ),
        ),
      ),
    );
  }
}

class _BillConfirmSheet extends StatefulWidget {
  final Map<String, dynamic> bill;
  final Color textColor;
  final bool isDark;
  const _BillConfirmSheet({required this.bill, required this.textColor, required this.isDark});
  @override
  State<_BillConfirmSheet> createState() => _BillConfirmSheetState();
}

class _BillConfirmSheetState extends State<_BillConfirmSheet> {
  bool _loading = false;
  late TextEditingController _refCtrl;
  late TextEditingController _amountCtrl;

  bool _saveInfo = true;
  bool _isSavedMode = false;

  @override
  void initState() {
    super.initState();
    _refCtrl = TextEditingController();
    _amountCtrl = TextEditingController();
    _loadSavedInfo();
  }

  Future<void> _loadSavedInfo() async {
    final prefs = await SharedPreferences.getInstance();
    final prefKey = 'pref_bill_${widget.bill['id']}';
    final savedRef = prefs.getString('${prefKey}_ref');
    final savedAmount = prefs.getString('${prefKey}_amount');

    if (savedRef != null && savedRef.isNotEmpty && mounted) {
      setState(() {
        _refCtrl.text = savedRef;
        if (savedAmount != null) _amountCtrl.text = savedAmount;
        _isSavedMode = true;
      });
    }
  }

  @override
  void dispose() {
    _refCtrl.dispose();
    _amountCtrl.dispose();
    super.dispose();
  }

  Future<void> _confirm() async {
    if (_refCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Veuillez entrer une référence valide', style: TextStyle(color: Colors.white)), backgroundColor: Colors.orange));
      return;
    }

    final amountParsed = double.tryParse(_amountCtrl.text.replaceAll(' ', ''));
    if (amountParsed == null || amountParsed <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Veuillez entrer un montant valide', style: TextStyle(color: Colors.white)), backgroundColor: Colors.orange));
      return;
    }

    setState(() => _loading = true);

    if (_saveInfo && !_isSavedMode) {
      final prefs = await SharedPreferences.getInstance();
      final prefKey = 'pref_bill_${widget.bill['id']}';
      await prefs.setString('${prefKey}_ref', _refCtrl.text);
      await prefs.setString('${prefKey}_amount', _amountCtrl.text);
    }

    final wallet = Provider.of<WalletProvider>(context, listen: false);
    final ok = await wallet.payBill(amountParsed, widget.bill['id'] as String, _refCtrl.text);

    if (!mounted) return;
    setState(() => _loading = false);

    Navigator.pop(context, ok);
    if (ok) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${widget.bill['name']} payée ✅', style: const TextStyle(color: Colors.white)), backgroundColor: Colors.green));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Solde insuffisant', style: TextStyle(color: Colors.white)), backgroundColor: Colors.redAccent));
    }
  }

  Widget _buildFieldWrapper(Widget child) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(color: Colors.grey.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(16)),
      child: child,
    );
  }

  Widget _buildEditForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text('Référence abonné / Facture', style: TextStyle(color: widget.textColor, fontWeight: FontWeight.bold, fontSize: 13)),
        const SizedBox(height: 8),
        _buildFieldWrapper(TextField(
          controller: _refCtrl,
          style: TextStyle(color: widget.textColor, fontWeight: FontWeight.bold),
          decoration: const InputDecoration(border: InputBorder.none, hintText: 'Saisir la référence...'),
        )),

        Text('Montant à payer (FCFA)', style: TextStyle(color: widget.textColor, fontWeight: FontWeight.bold, fontSize: 13)),
        const SizedBox(height: 8),
        _buildFieldWrapper(TextField(
          controller: _amountCtrl,
          keyboardType: TextInputType.number,
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: widget.textColor),
          decoration: const InputDecoration(border: InputBorder.none, hintText: '0'),
        )),

        CheckboxListTile(
          value: _saveInfo,
          onChanged: (v) => setState(() => _saveInfo = v ?? true),
          title: const Text('Enregistrer la référence', style: TextStyle(fontSize: 12)),
          controlAffinity: ListTileControlAffinity.leading,
          contentPadding: EdgeInsets.zero,
          activeColor: widget.textColor,
        ),
      ],
    );
  }

  Widget _buildSavedModeCard() {
    String details = "Réf: ${_refCtrl.text}";

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      margin: const EdgeInsets.only(bottom: 24),
      decoration: BoxDecoration(
        color: Colors.grey.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.check_circle_rounded, color: widget.textColor),
              const SizedBox(width: 8),
              Expanded(child: Text('Détails de facturation sauvegardés', style: TextStyle(color: widget.textColor, fontWeight: FontWeight.bold, fontSize: 14))),
            ],
          ),
          const SizedBox(height: 12),
          Text(details, style: TextStyle(color: widget.textColor.withValues(alpha: 0.8), fontSize: 13, height: 1.5)),
          const SizedBox(height: 12),
          Text('${_amountCtrl.text} FCFA', style: TextStyle(color: widget.textColor, fontSize: 28, fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(top: 28, left: 24, right: 24, bottom: MediaQuery.of(context).viewInsets.bottom + 24),
      decoration: BoxDecoration(
        color: widget.isDark ? const Color(0xFF1E1E2C) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.withValues(alpha: 0.3), borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 24),
            Row(
              children: [
                Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: Colors.grey.withValues(alpha: 0.15), shape: BoxShape.circle),
                  child: Icon(Icons.receipt_long_rounded, color: widget.textColor, size: 32)),
                const SizedBox(width: 16),
                Expanded(child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(widget.bill['name'] as String? ?? '', style: TextStyle(color: widget.textColor, fontSize: 18, fontWeight: FontWeight.w900)),
                    Text(widget.bill['category'] as String? ?? '', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                  ],
                )),
              ],
            ),
            const SizedBox(height: 28),

            if (_isSavedMode) _buildSavedModeCard() else _buildEditForm(),

            const SizedBox(height: 16),
            Row(children: [
              if (_isSavedMode)
                Expanded(child: TextButton.icon(
                  onPressed: () => setState(() => _isSavedMode = false),
                  icon: const Icon(Icons.edit_rounded, size: 18),
                  label: const Text('Modifier'),
                  style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16), foregroundColor: widget.textColor),
                ))
              else
                Expanded(child: OutlinedButton(
                  onPressed: () => Navigator.pop(context),
                  style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
                  child: const Text('Annuler'),
                )),
              const SizedBox(width: 12),
              Expanded(flex: 2, child: ElevatedButton(
                onPressed: _loading ? null : _confirm,
                style: ElevatedButton.styleFrom(backgroundColor: Colors.orange, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
                child: _loading
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Confirmer', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              )),
            ]),
          ],
        ),
      ),
    );
  }
}

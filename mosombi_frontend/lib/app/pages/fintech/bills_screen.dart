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
  final _bills = [
    {'id': 'elec', 'title': 'Électricité ENEO', 'amount': 18500.0, 'due': '31 Mars', 'icon': Icons.bolt_rounded, 'color': const Color(0xFFFFCC00), 'ref': 'ENEO-2024-03'},
    {'id': 'water', 'title': 'Eau SNDE', 'amount': 9200.0, 'due': '28 Mars', 'icon': Icons.water_drop_rounded, 'color': const Color(0xFF00D4FF), 'ref': 'SNDE-2024-03'},
    {'id': 'canal', 'title': 'Canal+ Abonnement', 'amount': 13000.0, 'due': '5 Avril', 'icon': Icons.live_tv_rounded, 'color': const Color(0xFF6C4EF6), 'ref': 'CANAL-MARCH'},
    {'id': 'net', 'title': 'Internet Camtel', 'amount': 22000.0, 'due': '10 Avril', 'icon': Icons.wifi_rounded, 'color': const Color(0xFF00E5C5), 'ref': 'CAMTEL-2024'},
  ];

  final Set<String> _paidBills = {};

  Future<void> _openConfirmSheet(Map<String, dynamic> bill) async {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final result = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => _BillConfirmSheet(bill: bill, textColor: textColor, isDark: isDark),
    );
    if (result == true) {
      if (mounted) setState(() => _paidBills.add(bill['id'] as String));
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
        title: Text('Mes Factures', style: TextStyle(color: textColor, fontWeight: FontWeight.w900)),
        centerTitle: true,
        leading: IconButton(icon: Icon(Icons.arrow_back_ios_new_rounded, color: textColor), onPressed: () => context.pop()),
      ),
      body: AnimatedGradientBg(
        isDark: isDark,
        child: SafeArea(
          child: ListView.builder(
            padding: const EdgeInsets.all(24),
            physics: const BouncingScrollPhysics(),
            itemCount: _bills.length,
            itemBuilder: (ctx, i) {
              final bill = _bills[i];
              final isPaid = _paidBills.contains(bill['id']);
              return Container(
                margin: const EdgeInsets.only(bottom: 16),
                child: GlassContainer(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: (bill['color'] as Color).withValues(alpha: 0.15),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(bill['icon'] as IconData, color: bill['color'] as Color, size: 24),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(bill['title'] as String, style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 15)),
                          const SizedBox(height: 4),
                          Text('Réf: ${bill['ref']} • Échéance: ${bill['due']}', style: TextStyle(color: hintColor, fontSize: 11)),
                          const SizedBox(height: 4),
                          Text('${(bill['amount'] as double).toStringAsFixed(0)} FCFA', style: const TextStyle(color: Color(0xFF00E5C5), fontWeight: FontWeight.w900, fontSize: 16)),
                        ]),
                      ),
                      const SizedBox(width: 12),
                      isPaid
                          ? const Icon(Icons.check_circle_rounded, color: Colors.green, size: 36)
                          : SizedBox(
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
  String? _selectedProvider;

  @override
  void initState() {
    super.initState();
    _refCtrl = TextEditingController(text: widget.bill['ref'] as String);
    _amountCtrl = TextEditingController(text: (widget.bill['amount'] as double).toStringAsFixed(0));
    _loadSavedInfo();
  }

  Future<void> _loadSavedInfo() async {
    final prefs = await SharedPreferences.getInstance();
    final prefKey = 'pref_bill_${widget.bill['id']}';
    final savedRef = prefs.getString('${prefKey}_ref');
    
    if (savedRef != null && savedRef.isNotEmpty && mounted) {
      if (widget.bill['id'] == 'canal' || widget.bill['id'] == 'net') {
        _selectedProvider = prefs.getString('${prefKey}_provider');
      }
      setState(() {
        _refCtrl.text = savedRef;
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
    final id = widget.bill['id'] as String;
    
    if (!_isSavedMode) {
      if ((id == 'canal' || id == 'net') && _selectedProvider == null) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Veuillez choisir un fournisseur', style: TextStyle(color: Colors.white)), backgroundColor: Colors.orange));
        return;
      }
      if (_refCtrl.text.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Veuillez entrer une référence valide', style: TextStyle(color: Colors.white)), backgroundColor: Colors.orange));
        return;
      }
    }
    
    final amountParsed = double.tryParse(_amountCtrl.text.replaceAll(' ', ''));
    if (amountParsed == null || amountParsed <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Veuillez entrer un montant valide', style: TextStyle(color: Colors.white)), backgroundColor: Colors.orange));
      return;
    }

    setState(() => _loading = true);

    if (_saveInfo && !_isSavedMode) {
      final prefs = await SharedPreferences.getInstance();
      final prefKey = 'pref_bill_$id';
      await prefs.setString('${prefKey}_ref', _refCtrl.text);
      if (id == 'canal' || id == 'net') {
        await prefs.setString('${prefKey}_provider', _selectedProvider ?? "Inconnu");
      }
    }

    String finalTitle = '${widget.bill['title']} (Réf: ${_refCtrl.text})';
    if (id == 'canal' || id == 'net') {
       finalTitle = '${_selectedProvider ?? widget.bill['title']} - Réf: ${_refCtrl.text}';
    }

    final wallet = Provider.of<WalletProvider>(context, listen: false);
    final ok = await wallet.payBill(amountParsed, finalTitle);
    
    if (!mounted) return;
    setState(() => _loading = false);
    
    Navigator.pop(context, ok);
    if (ok) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${widget.bill['title']} payée ✅', style: const TextStyle(color: Colors.white)), backgroundColor: Colors.green));
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
    final id = widget.bill['id'] as String;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (id == 'canal' || id == 'net') ...[
          Text('Fournisseur', style: TextStyle(color: widget.textColor, fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(height: 8),
          _buildFieldWrapper(DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              isExpanded: true,
              dropdownColor: widget.isDark ? AppColors.bgDark2 : Colors.white,
              value: _selectedProvider,
              hint: const Text('Choisir le fournisseur'),
              items: (id == 'canal' ? ['Canal+', 'Startimes'] : ['Canalbox', 'Congo Telecom']).map((e) => DropdownMenuItem(value: e, child: Text(e, style: TextStyle(color: widget.textColor)))).toList(),
              onChanged: (v) => setState(() => _selectedProvider = v),
            ),
          )),
        ],

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
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: widget.bill['color']),
          decoration: const InputDecoration(border: InputBorder.none, hintText: '0'),
        )),

        CheckboxListTile(
          value: _saveInfo,
          onChanged: (v) => setState(() => _saveInfo = v ?? true),
          title: const Text('Enregistrer la référence et le fournisseur', style: TextStyle(fontSize: 12)),
          controlAffinity: ListTileControlAffinity.leading,
          contentPadding: EdgeInsets.zero,
          activeColor: widget.bill['color'],
        ),
      ],
    );
  }

  Widget _buildSavedModeCard() {
    final id = widget.bill['id'] as String;
    String details = "Réf: ${_refCtrl.text}";
    if (id == 'canal' || id == 'net') {
      details = "Fournisseur: ${_selectedProvider ?? '-'}\nRéf: ${_refCtrl.text}";
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      margin: const EdgeInsets.only(bottom: 24),
      decoration: BoxDecoration(
        color: (widget.bill['color'] as Color).withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: (widget.bill['color'] as Color).withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.check_circle_rounded, color: widget.bill['color']),
              const SizedBox(width: 8),
              Expanded(child: Text('Détails de facturation sauvegardés', style: TextStyle(color: widget.textColor, fontWeight: FontWeight.bold, fontSize: 14))),
            ],
          ),
          const SizedBox(height: 12),
          Text(details, style: TextStyle(color: widget.textColor.withValues(alpha: 0.8), fontSize: 13, height: 1.5)),
          const SizedBox(height: 12),
          Text('${_amountCtrl.text} FCFA', style: TextStyle(color: widget.bill['color'], fontSize: 28, fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final color = widget.bill['color'] as Color;
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
                Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: color.withValues(alpha: 0.15), shape: BoxShape.circle),
                  child: Icon(widget.bill['icon'] as IconData, color: color, size: 32)),
                const SizedBox(width: 16),
                Expanded(child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(widget.bill['title'] as String, style: TextStyle(color: widget.textColor, fontSize: 18, fontWeight: FontWeight.w900)),
                    Text('Échéance : ${widget.bill['due']}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
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
                style: ElevatedButton.styleFrom(backgroundColor: color, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
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


import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/wallet_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/glass_container.dart';
import '../../../core/widgets/animated_gradient_bg.dart';

class ServicesScreen extends StatefulWidget {
  const ServicesScreen({super.key});
  @override
  State<ServicesScreen> createState() => _ServicesScreenState();
}

class _ServicesScreenState extends State<ServicesScreen> {
  final _services = [
    {'label': 'Recharge Tel', 'icon': Icons.sim_card_rounded, 'color': const Color(0xFF00E5C5), 'amount': 500.0},
    {'label': 'Transport Bus', 'icon': Icons.directions_bus_rounded, 'color': const Color(0xFFFF9800), 'amount': 250.0},
    {'label': 'Taxes & Impôts', 'icon': Icons.gavel_rounded, 'color': const Color(0xFFFF6584), 'amount': 50000.0},
    {'label': 'Santé CNAM', 'icon': Icons.health_and_safety_rounded, 'color': const Color(0xFF4CAF50), 'amount': 5000.0},
    {'label': 'Scolarité', 'icon': Icons.school_rounded, 'color': const Color(0xFF6C4EF6), 'amount': 15000.0},
    {'label': 'Police d\'Assurance', 'icon': Icons.shield_rounded, 'color': const Color(0xFF00D4FF), 'amount': 8000.0},
    {'label': 'Abonnement Gym', 'icon': Icons.fitness_center_rounded, 'color': const Color(0xFFE91E63), 'amount': 12000.0},
    {'label': 'Parking Mensuel', 'icon': Icons.local_parking_rounded, 'color': const Color(0xFFFFA000), 'amount': 3000.0},
  ];

  Future<void> _payService(BuildContext context, Map<String, dynamic> service) async {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;

    await showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => _ServiceConfirmSheet(service: service, textColor: textColor, isDark: isDark),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent, elevation: 0,
        title: Text('Services Publics', style: TextStyle(color: textColor, fontWeight: FontWeight.w900)),
        centerTitle: true,
        leading: IconButton(icon: Icon(Icons.arrow_back_ios_new_rounded, color: textColor), onPressed: () => context.pop()),
      ),
      body: AnimatedGradientBg(
        isDark: isDark,
        child: SafeArea(
          child: GridView.builder(
            padding: const EdgeInsets.all(24),
            physics: const BouncingScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, crossAxisSpacing: 16, mainAxisSpacing: 16, childAspectRatio: 1.1),
            itemCount: _services.length,
            itemBuilder: (ctx, i) {
              final s = _services[i];
              final color = s['color'] as Color;
              return GestureDetector(
                onTap: () => _payService(context, s),
                child: GlassContainer(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(color: color.withValues(alpha: 0.15), shape: BoxShape.circle),
                        child: Icon(s['icon'] as IconData, color: color, size: 28),
                      ),
                      const SizedBox(height: 12),
                      Text(s['label'] as String, textAlign: TextAlign.center, style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 13)),
                      const SizedBox(height: 4),
                      Text('${(s['amount'] as double).toStringAsFixed(0)} F', style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ).animate(delay: (i * 60).ms).fade().scale(begin: const Offset(0.8, 0.8), end: const Offset(1, 1), curve: Curves.easeOutBack);
            },
          ),
        ),
      ),
    );
  }
}
class _ServiceConfirmSheet extends StatefulWidget {
  final Map<String, dynamic> service;
  final Color textColor;
  final bool isDark;
  const _ServiceConfirmSheet({required this.service, required this.textColor, required this.isDark});
  @override
  State<_ServiceConfirmSheet> createState() => _ServiceConfirmSheetState();
}

class _ServiceConfirmSheetState extends State<_ServiceConfirmSheet> {
  bool _loading = false;
  late TextEditingController _refCtrl;
  late TextEditingController _amountCtrl;
  
  bool _saveInfo = true;
  bool _isSavedMode = false;

  // Custom fields
  String? _selectedProvider;
  String? _selectedSubDuration; 
  final TextEditingController _departureCtrl = TextEditingController();
  final TextEditingController _arrivalCtrl = TextEditingController();
  TimeOfDay? _departureTime;

  @override
  void initState() {
    super.initState();
    _refCtrl = TextEditingController();
    _amountCtrl = TextEditingController(text: (widget.service['amount'] as double).toStringAsFixed(0));
    _loadSavedInfo();
  }

  Future<void> _loadSavedInfo() async {
    final prefs = await SharedPreferences.getInstance();
    final prefSrv = 'pref_srv_${widget.service['label'].toString().replaceAll(" ", "")}';
    final savedRef = prefs.getString('${prefSrv}_ref');
    
    if (savedRef != null && savedRef.isNotEmpty && mounted) {
      if (widget.service['label'] == 'Recharge Tel') {
         _selectedProvider = prefs.getString('${prefSrv}_provider');
      } else if (widget.service['label'] == 'Transport Bus') {
         _selectedSubDuration = prefs.getString('${prefSrv}_duration');
         _departureCtrl.text = prefs.getString('${prefSrv}_dep') ?? '';
         _arrivalCtrl.text = prefs.getString('${prefSrv}_arr') ?? '';
         final h = prefs.getInt('${prefSrv}_time_h');
         final m = prefs.getInt('${prefSrv}_time_m');
         if (h != null && m != null) _departureTime = TimeOfDay(hour: h, minute: m);
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
    _departureCtrl.dispose();
    _arrivalCtrl.dispose();
    super.dispose();
  }

  Future<void> _confirm() async {
    final label = widget.service['label'] as String;
    
    if (!_isSavedMode) {
        if (label == 'Recharge Tel' && _selectedProvider == null) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Veuillez choisir un opérateur', style: TextStyle(color: Colors.white)), backgroundColor: Colors.orange));
          return;
        }
        if (label == 'Transport Bus') {
          if (_selectedSubDuration == null || _departureCtrl.text.isEmpty || _arrivalCtrl.text.isEmpty || _departureTime == null) {
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Veuillez remplir tous les champs du bus', style: TextStyle(color: Colors.white)), backgroundColor: Colors.orange));
            return;
          }
        }
        if (_refCtrl.text.isEmpty && label != 'Transport Bus') {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Veuillez entrer une référence/téléphone', style: TextStyle(color: Colors.white)), backgroundColor: Colors.orange));
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
      final prefSrv = 'pref_srv_${label.replaceAll(" ", "")}';
      await prefs.setString('${prefSrv}_ref', _refCtrl.text.isEmpty ? 'Abonnement' : _refCtrl.text);
      if (label == 'Recharge Tel') {
         await prefs.setString('${prefSrv}_provider', _selectedProvider ?? "Inconnu");
      } else if (label == 'Transport Bus') {
         await prefs.setString('${prefSrv}_duration', _selectedSubDuration ?? "1 Semaine");
         await prefs.setString('${prefSrv}_dep', _departureCtrl.text);
         await prefs.setString('${prefSrv}_arr', _arrivalCtrl.text);
         if (_departureTime != null) {
           await prefs.setInt('${prefSrv}_time_h', _departureTime!.hour);
           await prefs.setInt('${prefSrv}_time_m', _departureTime!.minute);
         }
      }
    }

    String finalTxTitle = '$label - ${_refCtrl.text.isEmpty ? "Abonnement" : _refCtrl.text}';
    if (label == 'Recharge Tel') finalTxTitle = 'Recharge ${_selectedProvider ?? ""} - ${_refCtrl.text}';
    if (label == 'Transport Bus') finalTxTitle = 'Bus ${_selectedSubDuration ?? ""} (${_departureCtrl.text} -> ${_arrivalCtrl.text})';

    final wallet = Provider.of<WalletProvider>(context, listen: false);
    final ok = await wallet.payService(amountParsed, finalTxTitle);
    
    if (!mounted) return;
    setState(() => _loading = false);
    
    Navigator.pop(context, ok);
    if (ok) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$label payé ✅', style: const TextStyle(color: Colors.white)), backgroundColor: Colors.green));
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
    final label = widget.service['label'] as String;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (label == 'Recharge Tel') ...[
          Text('Opérateur', style: TextStyle(color: widget.textColor, fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(height: 8),
          _buildFieldWrapper(DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              isExpanded: true,
              dropdownColor: widget.isDark ? AppColors.bgDark2 : Colors.white,
              value: _selectedProvider,
              hint: const Text('Choisir l\'opérateur'),
              items: ['MTN Congo', 'Airtel Congo'].map((e) => DropdownMenuItem(value: e, child: Text(e, style: TextStyle(color: widget.textColor)))).toList(),
              onChanged: (v) => setState(() => _selectedProvider = v),
            ),
          )),
        ],

        if (label == 'Transport Bus') ...[
          Text('Durée abonnement', style: TextStyle(color: widget.textColor, fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(height: 8),
          _buildFieldWrapper(DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              isExpanded: true,
              dropdownColor: widget.isDark ? AppColors.bgDark2 : Colors.white,
              value: _selectedSubDuration,
              hint: const Text('Sélectionner l\'abonnement'),
              items: ['1 Semaine', '2 Semaines', '1 Mois', '3 Mois'].map((e) => DropdownMenuItem(value: e, child: Text(e, style: TextStyle(color: widget.textColor)))).toList(),
              onChanged: (v) => setState(() => _selectedSubDuration = v),
            ),
          )),
          Row(
            children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Départ', style: TextStyle(color: widget.textColor, fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 8),
                _buildFieldWrapper(TextField(controller: _departureCtrl, style: TextStyle(color: widget.textColor), decoration: const InputDecoration(border: InputBorder.none, hintText: 'Ex: Diata'))),
              ])),
              const SizedBox(width: 16),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Arrivée', style: TextStyle(color: widget.textColor, fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 8),
                _buildFieldWrapper(TextField(controller: _arrivalCtrl, style: TextStyle(color: widget.textColor), decoration: const InputDecoration(border: InputBorder.none, hintText: 'Ex: Centre'))),
              ])),
            ],
          ),
          Row(
            children: [
              Expanded(child: Text('Heure de départ', style: TextStyle(color: widget.textColor, fontWeight: FontWeight.bold, fontSize: 13))),
              TextButton.icon(
                icon: const Icon(Icons.access_time_filled_rounded),
                label: Text(_departureTime == null ? 'Choisir l\'heure' : _departureTime!.format(context)),
                onPressed: () async {
                  final t = await showTimePicker(context: context, initialTime: TimeOfDay.now());
                  if (t != null) setState(() => _departureTime = t);
                },
              )
            ],
          ),
          const SizedBox(height: 16),
        ],

        if (label != 'Transport Bus') ...[
          Text('Numéro d\'abonné / Téléphone', style: TextStyle(color: widget.textColor, fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(height: 8),
          _buildFieldWrapper(TextField(
            controller: _refCtrl,
            style: TextStyle(color: widget.textColor, fontWeight: FontWeight.bold),
            decoration: const InputDecoration(border: InputBorder.none, hintText: 'Saisir le numéro...'),
          )),
        ],

        Text('Montant à payer (FCFA)', style: TextStyle(color: widget.textColor, fontWeight: FontWeight.bold, fontSize: 13)),
        const SizedBox(height: 8),
        _buildFieldWrapper(TextField(
          controller: _amountCtrl,
          keyboardType: TextInputType.number,
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: widget.service['color']),
          decoration: const InputDecoration(border: InputBorder.none, hintText: '0'),
        )),

        CheckboxListTile(
          value: _saveInfo,
          onChanged: (v) => setState(() => _saveInfo = v ?? true),
          title: const Text('Enregistrer ces informations pour le prochain paiement', style: TextStyle(fontSize: 12)),
          controlAffinity: ListTileControlAffinity.leading,
          contentPadding: EdgeInsets.zero,
          activeColor: widget.service['color'],
        ),
      ],
    );
  }

  Widget _buildSavedModeCard() {
    final label = widget.service['label'] as String;
    String details = "Réf: ${_refCtrl.text}";
    if (label == 'Recharge Tel') details = "Téléphone: ${_refCtrl.text}\nOpérateur: ${_selectedProvider ?? 'Inconnu'}";
    if (label == 'Transport Bus') details = "Abonnement: ${_selectedSubDuration ?? '?'}\nTrajet: ${_departureCtrl.text} -> ${_arrivalCtrl.text}\nDépart: ${_departureTime?.format(context) ?? '?'}\n(Réf: ${_refCtrl.text})";

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      margin: const EdgeInsets.only(bottom: 24),
      decoration: BoxDecoration(
        color: (widget.service['color'] as Color).withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: (widget.service['color'] as Color).withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.check_circle_rounded, color: widget.service['color']),
              const SizedBox(width: 8),
              Expanded(child: Text('Informations de paiement sauvegardées', style: TextStyle(color: widget.textColor, fontWeight: FontWeight.bold, fontSize: 14))),
            ],
          ),
          const SizedBox(height: 12),
          Text(details, style: TextStyle(color: widget.textColor.withValues(alpha: 0.8), fontSize: 13, height: 1.5)),
          const SizedBox(height: 12),
          Text('${_amountCtrl.text} FCFA', style: TextStyle(color: widget.service['color'], fontSize: 28, fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final color = widget.service['color'] as Color;
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
                  child: Icon(widget.service['icon'] as IconData, color: color, size: 32)),
                const SizedBox(width: 16),
                Expanded(child: Text(widget.service['label'] as String, style: TextStyle(color: widget.textColor, fontSize: 20, fontWeight: FontWeight.w900))),
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

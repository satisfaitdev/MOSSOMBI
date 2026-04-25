import 'dart:convert';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:mosombi_frontend/core/providers/wallet_provider.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/theme/app_gradients.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';

class TransferScreen extends StatefulWidget {
  final String? initialCode;
  const TransferScreen({super.key, this.initialCode});

  @override
  State<TransferScreen> createState() => _TransferScreenState();
}

class _TransferScreenState extends State<TransferScreen> {
  late final TextEditingController _searchCtrl;
  final TextEditingController _amountCtrl = TextEditingController();
  final TextEditingController _noteCtrl = TextEditingController();
  
  bool _isSearching = false;
  List<Map<String, dynamic>> _searchResults = [];
  Timer? _debounce;
  Map<String, dynamic>? _selectedUser;
  bool _isTransferring = false;

  @override
  void initState() {
    super.initState();
    _searchCtrl = TextEditingController(text: widget.initialCode ?? '');
    if (widget.initialCode != null && widget.initialCode!.length >= 2) {
      // Auto-trigger the search
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _performSearch(widget.initialCode!);
      });
    }
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _amountCtrl.dispose();
    _noteCtrl.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      if (query.length >= 2) {
        _performSearch(query);
      } else {
        setState(() {
          _searchResults = [];
          _isSearching = false;
        });
      }
    });
  }

  Future<void> _performSearch(String query) async {
    setState(() => _isSearching = true);
    final results = await Provider.of<WalletProvider>(context, listen: false).searchUsers(query);
    if (mounted) {
      setState(() {
        _searchResults = results;
        _isSearching = false;
      });
    }
  }

  void _submitTransfer() async {
    if (_selectedUser == null) return;
    final amountText = _amountCtrl.text.replaceAll(' ', '');
    final amount = double.tryParse(amountText);
    if (amount == null || amount < 100) {
      _showSnack('Le montant minimum est de 100 CDF / FCFA', isError: true);
      return;
    }

    setState(() => _isTransferring = true);
    final wallet = Provider.of<WalletProvider>(context, listen: false);

    final success = await wallet.transfer(
      amount,
      _selectedUser!['id'] as String,
      _selectedUser!['full_name'] as String,
      _noteCtrl.text.trim()
    );

    if (mounted) {
      setState(() => _isTransferring = false);
      if (success) {
        _showSuccessDialog(amount, _selectedUser!['full_name']);
      } else {
        _showSnack('Solde insuffisant ou erreur lors du transfert', isError: true);
      }
    }
  }

  void _showSnack(String msg, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: isError ? Colors.redAccent : Colors.green,
      behavior: SnackBarBehavior.floating,
    ));
  }

  void _showSuccessDialog(double amount, String receiverName) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        child: GlassContainer(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.check_circle_rounded, color: Colors.greenAccent, size: 80).animate().scale(delay: 200.ms).shake(),
              const SizedBox(height: 16),
              const Text('Transfert Réussi', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text(
                'Vous avez envoyé ${amount.toStringAsFixed(0)} FCFA à $receiverName',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white70, fontSize: 16),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: AppColors.violet,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  onPressed: () {
                    ctx.pop();
                    context.pop();
                  },
                  child: const Text('Retour', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAvatar(String? base64String) {
    if (base64String == null || base64String.isEmpty) {
      return Container(
        width: 50, height: 50,
        decoration: BoxDecoration(shape: BoxShape.circle, color: AppColors.violet.withValues(alpha: 0.3)),
        child: const Icon(Icons.person, color: Colors.white),
      );
    }
    try {
      if (base64String.startsWith('data:image')) {
        final parts = base64String.split(',');
        return ClipOval(child: Image.memory(base64Decode(parts[1]), width: 50, height: 50, fit: BoxFit.cover));
      } else {
        return ClipOval(child: Image.network(base64String, width: 50, height: 50, fit: BoxFit.cover));
      }
    } catch (_) {
      return Container(
        width: 50, height: 50,
        decoration: BoxDecoration(shape: BoxShape.circle, color: AppColors.violet.withValues(alpha: 0.3)),
        child: const Icon(Icons.person, color: Colors.white),
      );
    }
  }

  void _showTransferSheet(Map<String, dynamic> user) {
    setState(() {
      _selectedUser = user;
      _amountCtrl.clear();
      _noteCtrl.clear();
    });

    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E1E2C) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.withValues(alpha: 0.3), borderRadius: BorderRadius.circular(2))),
              const SizedBox(height: 24),
              Row(
                children: [
                  _buildAvatar(user['avatar_url'] as String?),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Envoyer à', style: TextStyle(color: isDark ? Colors.white54 : Colors.black54, fontSize: 13)),
                        Text(user['full_name'] ?? 'Utilisateur', style: TextStyle(color: isDark ? Colors.white : Colors.black87, fontWeight: FontWeight.bold, fontSize: 18)),
                        Text('#${(user['user_id_display'] as String?)?.replaceAll(RegExp(r'[^0-9]'), '') ?? ''}', style: const TextStyle(color: AppColors.violet, fontWeight: FontWeight.w600, fontSize: 14)),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              TextField(
                controller: _amountCtrl,
                keyboardType: TextInputType.number,
                style: TextStyle(color: isDark ? Colors.white : Colors.black87, fontSize: 24, fontWeight: FontWeight.bold),
                decoration: InputDecoration(
                  labelText: 'Montant à envoyer',
                  prefixText: 'FCFA ',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                  filled: true,
                  fillColor: isDark ? Colors.black12 : Colors.grey.shade100,
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _noteCtrl,
                style: TextStyle(color: isDark ? Colors.white : Colors.black87),
                decoration: InputDecoration(
                  labelText: 'Motif (Optionnel)',
                  prefixIcon: const Icon(Icons.edit_note_rounded),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                  filled: true,
                  fillColor: isDark ? Colors.black12 : Colors.grey.shade100,
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.violet,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  onPressed: _isTransferring ? null : () {
                    ctx.pop(); // Close bottom sheet
                    _submitTransfer();
                  },
                  child: const Text('Confirmer le transfert', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;

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
        title: Text('Envoyer de l\'argent', style: TextStyle(color: textColor, fontWeight: FontWeight.w900)),
        centerTitle: true,
        leading: IconButton(icon: Icon(Icons.arrow_back_ios_new_rounded, color: textColor), onPressed: () => context.pop()),
      ),
      body: Stack(
        children: [
          AnimatedGradientBg(isDark: isDark, child: const SizedBox.expand()),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('À qui voulez-vous envoyer ?', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  
                  // Search Bar
                  GlassContainer(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    child: TextField(
                      controller: _searchCtrl,
                      onChanged: _onSearchChanged,
                      style: TextStyle(color: textColor),
                      decoration: InputDecoration(
                        hintText: 'Nom ou Code Utilisateur (ex: 12345678)',
                        hintStyle: TextStyle(color: textColor.withValues(alpha: 0.5)),
                        border: InputBorder.none,
                        icon: Icon(Icons.search, color: textColor.withValues(alpha: 0.7)),
                        suffixIcon: _isSearching
                            ? const Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator(strokeWidth: 2))
                            : null,
                      ),
                    ),
                  ).animate().fadeIn().slideY(begin: 0.1),

                  const SizedBox(height: 24),
                  
                  Expanded(
                    child: _searchCtrl.text.length < 2
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.people_alt_outlined, size: 80, color: textColor.withValues(alpha: 0.2)),
                                const SizedBox(height: 16),
                                Text('Recherchez par nom\nou avec le code de l\'utilisateur.', textAlign: TextAlign.center, style: TextStyle(color: textColor.withValues(alpha: 0.5), fontSize: 16)),
                              ],
                            ),
                          )
                        : _searchResults.isEmpty && !_isSearching
                            ? Center(child: Text('Aucun utilisateur trouvé.', style: TextStyle(color: textColor.withValues(alpha: 0.5))))
                            : ListView.separated(
                                physics: const BouncingScrollPhysics(),
                                itemCount: _searchResults.length,
                                separatorBuilder: (c, i) => const SizedBox(height: 12),
                                itemBuilder: (ctx, i) {
                                  final user = _searchResults[i];
                                  return GestureDetector(
                                    onTap: () => _showTransferSheet(user),
                                    child: GlassContainer(
                                      padding: const EdgeInsets.all(16),
                                      child: Row(
                                        children: [
                                          _buildAvatar(user['avatar_url'] as String?),
                                          const SizedBox(width: 16),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(user['full_name'] ?? 'Inconnu', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 16)),
                                                const SizedBox(height: 4),
                                                Text('#${(user['user_id_display'] as String?)?.replaceAll(RegExp(r'[^0-9]'), '') ?? ''}', style: const TextStyle(color: AppColors.violet, fontWeight: FontWeight.w600, fontSize: 12)),
                                              ],
                                            ),
                                          ),
                                          const Icon(Icons.arrow_forward_ios_rounded, color: AppColors.violet, size: 16)
                                        ],
                                      ),
                                    ),
                                  ).animate().fadeIn().slideX(begin: 0.1, delay: Duration(milliseconds: 50 * i));
                                },
                              ),
                  ),
                ],
              ),
            ),
          ),
          
          if (_isTransferring)
            Container(
              color: Colors.black.withValues(alpha: 0.5),
              child: const Center(
                child: CircularProgressIndicator(color: AppColors.violet),
              ),
            ),
        ],
      ),
    );
  }
}

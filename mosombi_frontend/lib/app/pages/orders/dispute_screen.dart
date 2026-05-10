import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:flutter_animate/flutter_animate.dart';

class DisputeScreen extends StatefulWidget {
  final String orderId;
  const DisputeScreen({super.key, required this.orderId});

  @override
  State<DisputeScreen> createState() => _DisputeScreenState();
}

class _DisputeScreenState extends State<DisputeScreen> {
  final _descCtrl = TextEditingController();
  String _selectedReason = 'Retard de livraison';
  
  final List<String> _reasons = [
    'Retard de livraison',
    'Colis endommagé',
    'Article manquant',
    'Mauvais article reçu',
    'Comportement inapproprié du livreur',
    'Autre'
  ];

  bool _isSubmitting = false;

  void _submitDispute() async {
    if (_descCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Veuillez décrire le problème.')));
      return;
    }

    setState(() => _isSubmitting = true);
    
    // Simulation API
    await Future.delayed(const Duration(seconds: 2));

    if (mounted) {
      setState(() => _isSubmitting = false);
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          icon: const Icon(Icons.check_circle_rounded, color: Colors.green, size: 60),
          title: const Text('Litige ouvert', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold)),
          content: const Text('Votre demande a bien été transmise à notre équipe support. Nous vous contacterons sous 24h.', textAlign: TextAlign.center),
          actions: [
            Center(
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.violet,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () {
                  Navigator.pop(ctx);
                  context.pop(); // Revenir au suivi
                },
                child: const Text('Compris', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      );
    }
  }

  @override
  void dispose() {
    _descCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.textPrimaryLight;
    final hintColor = isDark ? Colors.white70 : AppColors.textSecondaryLight;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text('Signaler un problème', style: TextStyle(color: textColor, fontWeight: FontWeight.w900)),
        centerTitle: true,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: textColor),
          onPressed: () => context.pop(),
        ),
      ),
      body: AnimatedGradientBg(
        isDark: isDark,
        child: SafeArea(
          child: Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  physics: const BouncingScrollPhysics(),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.orange.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.orange.withValues(alpha: 0.5)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.info_outline_rounded, color: Colors.orange),
                            const SizedBox(width: 12),
                            Expanded(child: Text('L\'ouverture d\'un litige gèle les fonds du vendeur/livreur jusqu\'à la résolution.', style: TextStyle(color: isDark ? Colors.white70 : Colors.black87, fontSize: 13))),
                          ],
                        ),
                      ).animate().fade().slideY(begin: 0.1, end: 0),

                      const SizedBox(height: 32),
                      
                      Text('Commande concernée', style: TextStyle(color: hintColor, fontSize: 14)),
                      const SizedBox(height: 8),
                      Text('N° ${widget.orderId.toUpperCase()}', style: TextStyle(color: textColor, fontWeight: FontWeight.w900, fontSize: 18)),
                      
                      const SizedBox(height: 32),

                      Text('Motif du litige', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 12),
                      GlassContainer(
                        padding: const EdgeInsets.all(16),
                        child: DropdownButtonFormField<String>(
                          value: _selectedReason,
                          dropdownColor: isDark ? AppColors.bgDark1 : Colors.white,
                          style: TextStyle(color: textColor, fontSize: 15, fontWeight: FontWeight.w600),
                          decoration: const InputDecoration(border: InputBorder.none, contentPadding: EdgeInsets.zero),
                          items: _reasons.map((r) => DropdownMenuItem(value: r, child: Text(r))).toList(),
                          onChanged: (val) => setState(() => _selectedReason = val!),
                        ),
                      ).animate().fade().slideY(begin: 0.1, end: 0, delay: 100.ms),

                      const SizedBox(height: 24),

                      Text('Description', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 12),
                      GlassContainer(
                        padding: const EdgeInsets.all(16),
                        child: TextFormField(
                          controller: _descCtrl,
                          maxLines: 5,
                          style: TextStyle(color: textColor),
                          decoration: InputDecoration(
                            hintText: 'Expliquez-nous en détail ce qui ne va pas...',
                            hintStyle: TextStyle(color: hintColor),
                            border: InputBorder.none,
                          ),
                        ),
                      ).animate().fade().slideY(begin: 0.1, end: 0, delay: 200.ms),

                      const SizedBox(height: 24),
                      
                      Text('Preuves (Photos)', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 12),
                      GestureDetector(
                        onTap: () {
                          // Importer photo
                        },
                        child: Container(
                          width: double.infinity,
                          height: 100,
                          decoration: BoxDecoration(
                            color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.05),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.grey.withValues(alpha: 0.3), width: 2, style: BorderStyle.none),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.add_a_photo_rounded, color: hintColor, size: 32),
                              const SizedBox(height: 8),
                              Text('Ajouter une photo', style: TextStyle(color: hintColor)),
                            ],
                          ),
                        ),
                      ).animate().fade().slideY(begin: 0.1, end: 0, delay: 300.ms),

                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ),

              // Bouton Soumettre
              Padding(
                padding: const EdgeInsets.all(24),
                child: ElevatedButton.icon(
                  onPressed: _isSubmitting ? null : _submitDispute,
                  icon: _isSubmitting 
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Icon(Icons.send_rounded, color: Colors.white),
                  label: Text(_isSubmitting ? 'Envoi en cours...' : 'Envoyer la demande', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16)),
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size(double.infinity, 56),
                    backgroundColor: AppColors.coral, // Coral red for actions like dispute
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                ).animate().scale(delay: 400.ms, curve: Curves.elasticOut),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

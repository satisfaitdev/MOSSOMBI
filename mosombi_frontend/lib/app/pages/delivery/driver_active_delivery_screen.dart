import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:flutter_animate/flutter_animate.dart';

class DriverActiveDeliveryScreen extends StatefulWidget {
  final String deliveryId;
  const DriverActiveDeliveryScreen({super.key, required this.deliveryId});

  @override
  State<DriverActiveDeliveryScreen> createState() => _DriverActiveDeliveryScreenState();
}

class _DriverActiveDeliveryScreenState extends State<DriverActiveDeliveryScreen> {
  int _status = 0; // 0: En route vers le vendeur, 1: En route vers le client, 2: Livré

  void _updateStatus() async {
    // Appel API simulé
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator(color: AppColors.violet)),
    );
    await Future.delayed(const Duration(seconds: 1));
    if (mounted) context.pop();

    setState(() {
      if (_status < 2) {
        _status++;
      }
    });

    if (_status == 2) {
      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (ctx) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            icon: const Icon(Icons.check_circle_rounded, color: Colors.green, size: 60),
            title: const Text('Livraison terminée !', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold)),
            content: const Text('Félicitations, vous avez complété cette course avec succès. Les fonds ont été ajoutés à votre portefeuille.', textAlign: TextAlign.center),
            actions: [
              Center(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.violet,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () {
                    Navigator.pop(ctx);
                    context.pop(); // Retour à la liste des courses
                  },
                  child: const Text('Terminer', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.textPrimaryLight;
    final hintColor = isDark ? Colors.white70 : AppColors.textSecondaryLight;

    String actionText = 'Récupérer le colis';
    if (_status == 1) actionText = 'Confirmer la livraison';
    if (_status == 2) actionText = 'Terminé';

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text('Course Active', style: TextStyle(color: textColor, fontWeight: FontWeight.w900)),
        centerTitle: true,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: textColor),
          onPressed: () => context.pop(),
        ),
      ),
      body: AnimatedGradientBg(
        isDark: isDark,
        child: Column(
          children: [
            // Fake Map Area
            Container(
              height: 350,
              width: double.infinity,
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E1E2C) : Colors.grey.shade200,
                image: const DecorationImage(
                  image: AssetImage('assets/images/fake_map.png'), // Mettre une image de carte
                  fit: BoxFit.cover,
                  opacity: 0.5,
                ),
              ),
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.violet,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 10, offset: Offset(0, 5))],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.navigation_rounded, color: Colors.white),
                      const SizedBox(width: 8),
                      Text(_status == 0 ? 'Vers le vendeur (2 min)' : 'Vers le client (15 min)', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ).animate().fade().slideY(),
              ),
            ),

            // Info
            Expanded(
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.bgDark1 : Colors.white,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
                  boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 20, offset: const Offset(0, -5))],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(color: Colors.orange.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(12)),
                          child: Text(_status == 0 ? 'En route (Pickup)' : 'En transit (Dropoff)', style: const TextStyle(color: Colors.orange, fontWeight: FontWeight.bold)),
                        ),
                        Text('1500 FCFA', style: TextStyle(color: textColor, fontWeight: FontWeight.w900, fontSize: 20)),
                      ],
                    ),
                    const SizedBox(height: 24),
                    
                    // Route
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Column(
                          children: [
                            const Icon(Icons.storefront_rounded, color: Colors.grey, size: 24),
                            Container(width: 2, height: 30, color: Colors.grey.withValues(alpha: 0.3), margin: const EdgeInsets.symmetric(vertical: 4)),
                            const Icon(Icons.location_on_rounded, color: Colors.redAccent, size: 24),
                          ],
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Marché Total, Bacongo', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 16)),
                              Text('Boutique "Le Choix"', style: TextStyle(color: hintColor, fontSize: 13)),
                              const SizedBox(height: 20),
                              Text('12 Rue Alizés, Poto-Poto', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 16)),
                              Text('Client: Jean Dupont', style: TextStyle(color: hintColor, fontSize: 13)),
                            ],
                          ),
                        ),
                        Column(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            IconButton(icon: const Icon(Icons.phone_rounded, color: Colors.green), onPressed: () {}),
                            const SizedBox(height: 10),
                            IconButton(icon: const Icon(Icons.phone_rounded, color: Colors.green), onPressed: () {}),
                          ],
                        )
                      ],
                    ),

                    const Spacer(),
                    
                    // Action Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _status == 2 ? null : _updateStatus,
                        icon: const Icon(Icons.check_circle_outline_rounded, color: Colors.black),
                        label: Text(actionText, style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 16)),
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size(double.infinity, 56),
                          backgroundColor: const Color(0xFF00E5C5),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        ),
                      ),
                    ).animate(target: _status == 2 ? 0 : 1).scale(curve: Curves.elasticOut),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

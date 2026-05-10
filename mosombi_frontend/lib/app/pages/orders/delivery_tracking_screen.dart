import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:flutter_animate/flutter_animate.dart';

class DeliveryTrackingScreen extends StatefulWidget {
  final String orderId;
  const DeliveryTrackingScreen({super.key, required this.orderId});

  @override
  State<DeliveryTrackingScreen> createState() => _DeliveryTrackingScreenState();
}

class _DeliveryTrackingScreenState extends State<DeliveryTrackingScreen> {
  int _currentStep = 2; // 0: Préparation, 1: En attente coursier, 2: En route, 3: Livré

  void _reportDispute() {
    // Naviguer vers la vue de litige
    context.push('/orders/dispute', extra: widget.orderId);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.textPrimaryLight;
    final hintColor = isDark ? Colors.white70 : AppColors.textSecondaryLight;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text('Suivi de Commande', style: TextStyle(color: textColor, fontWeight: FontWeight.w900)),
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
              child: Stack(
                alignment: Alignment.center,
                children: [
                  if (_currentStep == 2) ...[
                    // Ligne de trajet animée
                    Container(
                      width: 200,
                      height: 200,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.violet.withValues(alpha: 0.2), width: 2),
                      ),
                    ).animate(onPlay: (ctrl) => ctrl.repeat()).scale(begin: const Offset(0.5, 0.5), end: const Offset(1.5, 1.5), duration: 2.seconds).fade(begin: 1, end: 0),
                    // Icon Livreur
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: const BoxDecoration(
                        color: AppColors.violet,
                        shape: BoxShape.circle,
                        boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 10, offset: Offset(0, 5))],
                      ),
                      child: const Icon(Icons.delivery_dining_rounded, color: Colors.white, size: 32),
                    ).animate().scale(curve: Curves.elasticOut),
                  ]
                ],
              ),
            ),

            // Contenu du suivi
            Expanded(
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.bgDark1 : Colors.white,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
                  boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 20, offset: const Offset(0, -5))],
                ),
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Driver Info
                      Row(
                        children: [
                          Container(
                            width: 60,
                            height: 60,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.grey.shade300,
                              image: const DecorationImage(
                                image: NetworkImage('https://i.pravatar.cc/150?img=11'),
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Jean-Marc L.', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 18)),
                                Text('Livreur Mossombi', style: TextStyle(color: hintColor, fontSize: 13)),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    const Icon(Icons.star_rounded, color: Colors.amber, size: 16),
                                    const SizedBox(width: 4),
                                    Text('4.8 (124 courses)', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 12)),
                                  ],
                                )
                              ],
                            ),
                          ),
                          Container(
                            decoration: BoxDecoration(
                              color: Colors.green.withValues(alpha: 0.15),
                              shape: BoxShape.circle,
                            ),
                            child: IconButton(
                              icon: const Icon(Icons.phone_rounded, color: Colors.green),
                              onPressed: () {
                                // Appeler le livreur
                              },
                            ),
                          ),
                        ],
                      ).animate().fade().slideX(),

                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 24),
                        child: Divider(),
                      ),

                      Text('Étapes de Livraison', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 16),

                      // Steps
                      _buildStep(0, 'Commande Confirmée', 'Le vendeur prépare votre colis.', '14:20', isDark),
                      _buildStep(1, 'Coursier en route', 'Le coursier se dirige vers le vendeur.', '14:35', isDark),
                      _buildStep(2, 'Pris en charge', 'Le colis est en route vers chez vous !', 'En cours', isDark),
                      _buildStep(3, 'Colis Livré', 'À destination.', '--:--', isDark),

                      const SizedBox(height: 32),

                      // Action button (Litige)
                      SizedBox(
                        width: double.infinity,
                        child: TextButton.icon(
                          onPressed: _reportDispute,
                          icon: const Icon(Icons.report_problem_rounded, color: Colors.redAccent),
                          label: const Text('Signaler un problème (Litige)', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
                          style: TextButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            backgroundColor: Colors.redAccent.withValues(alpha: 0.1),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                        ),
                      ).animate().fade().slideY(begin: 0.2, end: 0),
                      
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStep(int stepIndex, String title, String subtitle, String time, bool isDark) {
    final isCompleted = _currentStep > stepIndex;
    final isCurrent = _currentStep == stepIndex;
    final color = isCompleted ? Colors.green : (isCurrent ? AppColors.violet : Colors.grey);
    final textColor = isDark ? Colors.white : AppColors.textPrimaryLight;

    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: isCompleted ? Colors.green : (isCurrent ? Colors.transparent : Colors.grey.withValues(alpha: 0.3)),
                  shape: BoxShape.circle,
                  border: isCurrent ? Border.all(color: AppColors.violet, width: 3) : null,
                ),
                child: isCompleted ? const Icon(Icons.check, size: 14, color: Colors.white) : null,
              ),
              if (stepIndex < 3)
                Container(
                  width: 2,
                  height: 40,
                  color: isCompleted ? Colors.green : Colors.grey.withValues(alpha: 0.3),
                  margin: const EdgeInsets.only(top: 4),
                ),
            ],
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(color: isCurrent ? AppColors.violet : textColor, fontWeight: isCurrent ? FontWeight.w900 : FontWeight.bold, fontSize: 15)),
                const SizedBox(height: 4),
                Text(subtitle, style: const TextStyle(color: Colors.grey, fontSize: 13)),
              ],
            ),
          ),
          Text(time, style: TextStyle(color: isCurrent ? AppColors.violet : Colors.grey, fontWeight: FontWeight.bold, fontSize: 12)),
        ],
      ),
    );
  }
}

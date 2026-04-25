import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:mosombi_frontend/core/providers/cart_provider.dart';
import 'package:mosombi_frontend/core/providers/product_provider.dart';
import 'package:mosombi_frontend/core/providers/wallet_provider.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  int _selectedPaymentMethod = 0; // 0: Portefeuille, 1: Livraison
  int _selectedDeliveryMethod = 1; // 0: Relais, 1: Normal, 2: Express

  double get _deliveryFee {
     if (_selectedDeliveryMethod == 0) return 500.0;
     if (_selectedDeliveryMethod == 2) return 2500.0;
     return 1000.0; // Normal
  }

  String get _deliveryName {
     if (_selectedDeliveryMethod == 0) return 'Point Relais';
     if (_selectedDeliveryMethod == 2) return 'Express';
     return 'Standard';
  }

  void _processCheckout(BuildContext context, CartProvider cart, ProductProvider products) async {
    if (_selectedPaymentMethod == 0) {
      final wallet = Provider.of<WalletProvider>(context, listen: false);
      final success = await wallet.payForMarketplaceService(cart.totalAmount + _deliveryFee, 'Achat Marketplace (Livraison $_deliveryName)');
      if (!success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Solde insuffisant dans votre portefeuille Mossombi.'),
            backgroundColor: Colors.redAccent,
            action: SnackBarAction(label: 'Recharger', textColor: Colors.white, onPressed: () => context.push('/fintech/topup')),
          ),
        );
        return;
      }
    }

    // Show loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator(color: Color(0xFF00E5C5))),
    );

    final success = await cart.submitOrder(products, _deliveryName, _deliveryFee);

    if (context.mounted) {
      context.pop(); // close loading
    }
    
    if (success) {
        if (context.mounted) {
          showDialog(
            context: context,
            barrierDismissible: false,
            builder: (ctx) => AlertDialog(
              backgroundColor: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E1E2C) : Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              icon: const Icon(Icons.check_circle_rounded, color: Color(0xFF00E5C5), size: 60),
              title: const Text('Commande confirmée !', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.w900)),
              content: Text(_selectedPaymentMethod == 0 
                  ? 'Votre commande a bien été enregistrée et prélevée sur votre portefeuille. Le vendeur prépare votre colis.' 
                  : 'Votre commande a bien été enregistrée. Payez à la livraison au coursier.', textAlign: TextAlign.center),
              actions: [
                Center(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(ctx); // Ferme la modale
                      if (context.mounted) {
                        context.pop(); // Ferme Checkout
                        context.pop(); // Ferme Cart (Nous ramène à Marketplace avec son beau bouton back intact)
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF6C4EF6),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                    ),
                    child: const Text('Génial', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          );
        }
      } else {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Erreur: Impossible de soumettre votre commande. Stock insuffisant ou problème réseau.'), backgroundColor: Colors.redAccent),
          );
        }
      }
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();
    final products = context.watch<ProductProvider>();
    
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white.withValues(alpha: 0.5) : AppColors.textSecondaryLight;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text('Paiement', style: TextStyle(color: textColor, fontWeight: FontWeight.w900)),
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
            const SizedBox(height: 100),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                physics: const BouncingScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Adresse de livraison', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    GlassContainer(
                      padding: const EdgeInsets.all(20),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(color: const Color(0xFFFF6584).withValues(alpha: 0.2), shape: BoxShape.circle),
                            child: const Icon(Icons.location_on_rounded, color: Color(0xFFFF6584)),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Maison', style: TextStyle(color: textColor, fontWeight: FontWeight.w900, fontSize: 16)),
                                const SizedBox(height: 4),
                                Text('12 Rue des Alizés, Poto-Poto, Brazzaville', style: TextStyle(color: hintColor, fontSize: 13)),
                              ],
                            ),
                          ),
                          const Icon(Icons.edit_rounded, color: Colors.grey, size: 20),
                        ],
                      ),
                    ).animate().fade().slideY(begin: 0.2, end: 0),

                    const SizedBox(height: 32),
                    Text('Options de livraison', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    // Delivery Methods
                    Row(
                       children: [
                          Expanded(child: _buildDeliveryCard(0, 'Point Relais', '2-4 Jours', 500, Icons.storefront_rounded, textColor)),
                          const SizedBox(width: 8),
                          Expanded(child: _buildDeliveryCard(1, 'Standard', '1-2 Jours', 1000, Icons.local_shipping_rounded, textColor)),
                          const SizedBox(width: 8),
                          Expanded(child: _buildDeliveryCard(2, 'Express', '< 24H', 2500, Icons.bolt_rounded, textColor)),
                       ],
                    ).animate(delay: 50.ms).fade().slideY(begin: 0.2, end: 0),

                    const SizedBox(height: 32),
                    Text('Méthode de paiement', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),

                    // Method 1
                    GestureDetector(
                      onTap: () => setState(() => _selectedPaymentMethod = 0),
                      child: GlassContainer(
                        padding: const EdgeInsets.all(20),
                        child: Row(
                          children: [
                            Icon(_selectedPaymentMethod == 0 ? Icons.radio_button_checked : Icons.radio_button_off, color: _selectedPaymentMethod == 0 ? const Color(0xFF6C4EF6) : Colors.grey),
                            const SizedBox(width: 16),
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(color: const Color(0xFF00E5C5).withValues(alpha: 0.2), borderRadius: BorderRadius.circular(8)),
                              child: const Icon(Icons.account_balance_wallet_rounded, color: Color(0xFF00E5C5), size: 20),
                            ),
                            const SizedBox(width: 12),
                            Expanded(child: Text('Mossombi Pay (Portefeuille)', style: TextStyle(color: textColor, fontWeight: FontWeight.w800, fontSize: 15))),
                          ],
                        ),
                      ),
                    ).animate(delay: 100.ms).fade().slideY(begin: 0.2, end: 0),
                    
                    const SizedBox(height: 12),
                    
                    // Method 2
                    GestureDetector(
                      onTap: () => setState(() => _selectedPaymentMethod = 1),
                      child: GlassContainer(
                        padding: const EdgeInsets.all(20),
                        child: Row(
                          children: [
                            Icon(_selectedPaymentMethod == 1 ? Icons.radio_button_checked : Icons.radio_button_off, color: _selectedPaymentMethod == 1 ? const Color(0xFF6C4EF6) : Colors.grey),
                            const SizedBox(width: 16),
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(color: const Color(0xFFFF9800).withValues(alpha: 0.2), borderRadius: BorderRadius.circular(8)),
                              child: const Icon(Icons.delivery_dining_rounded, color: Color(0xFFFF9800), size: 20),
                            ),
                            const SizedBox(width: 12),
                            Expanded(child: Text('Payer à la livraison', style: TextStyle(color: textColor, fontWeight: FontWeight.w800, fontSize: 15))),
                          ],
                        ),
                      ),
                    ).animate(delay: 200.ms).fade().slideY(begin: 0.2, end: 0),

                    const SizedBox(height: 40),
                    
                    // Summary View
                    GlassContainer(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [Text('Sous-total', style: TextStyle(color: hintColor)), Text('${cart.totalAmount.toStringAsFixed(0)} FCFA', style: TextStyle(color: textColor, fontWeight: FontWeight.bold))],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [Text('Frais de livraison', style: TextStyle(color: hintColor)), Text('${_deliveryFee.toStringAsFixed(0)} FCFA', style: TextStyle(color: textColor, fontWeight: FontWeight.bold))],
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            child: Divider(color: hintColor.withValues(alpha: 0.2)),
                          ),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [Text('Total', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.w900)), Text('${(cart.totalAmount + _deliveryFee).toStringAsFixed(0)} FCFA', style: const TextStyle(color: Color(0xFF00E5C5), fontSize: 22, fontWeight: FontWeight.w900, letterSpacing: -1))],
                          ),
                        ],
                      ),
                    ).animate(delay: 300.ms).fade().slideY(begin: 0.2, end: 0),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
            
            // Confirm Button
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E1E2C) : Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 20, offset: const Offset(0, -5))],
              ),
              child: SafeArea(
                top: false,
                child: ElevatedButton.icon(
                  onPressed: () => _processCheckout(context, cart, products),
                  icon: const Icon(Icons.check_circle_rounded, color: Colors.white),
                  label: const Text('Confirmer la commande', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16)),
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size(double.infinity, 56),
                    backgroundColor: const Color(0xFF6C4EF6),
                    elevation: 10,
                    shadowColor: const Color(0xFF6C4EF6).withValues(alpha: 0.4),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                ).animate(delay: 400.ms).scale(curve: Curves.elasticOut),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDeliveryCard(int index, String title, String time, double price, IconData icon, Color textColor) {
     final isSelected = _selectedDeliveryMethod == index;
     return GestureDetector(
        onTap: () => setState(() => _selectedDeliveryMethod = index),
        child: Container(
           padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
           decoration: BoxDecoration(
              color: isSelected ? const Color(0xFF6C4EF6).withValues(alpha: 0.1) : Colors.transparent,
              border: Border.all(color: isSelected ? const Color(0xFF6C4EF6) : Colors.grey.withValues(alpha: 0.2), width: 2),
              borderRadius: BorderRadius.circular(16),
           ),
           child: Column(
              children: [
                 Icon(icon, color: isSelected ? const Color(0xFF6C4EF6) : Colors.grey, size: 28),
                 const SizedBox(height: 8),
                 Text(title, style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 12), textAlign: TextAlign.center),
                 const SizedBox(height: 4),
                 Text(time, style: TextStyle(color: Colors.grey.shade500, fontSize: 10)),
                 const SizedBox(height: 8),
                 Text('${price.toStringAsFixed(0)} F', style: TextStyle(color: textColor, fontWeight: FontWeight.w900, fontSize: 13)),
              ],
           ),
        ),
     );
  }
}

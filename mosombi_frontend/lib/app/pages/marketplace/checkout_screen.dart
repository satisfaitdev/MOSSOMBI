import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:mosombi_frontend/core/providers/cart_provider.dart';
import 'package:mosombi_frontend/core/providers/product_provider.dart';
import 'package:mosombi_frontend/core/models/cart_item_model.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mosombi_frontend/core/providers/auth_provider.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  int _selectedPaymentMethod = 0; // 0: Portefeuille, 1: Livraison
  
  String _selectedCountry = 'Bénin';
  final List<String> _countries = ['Bénin', 'Togo', 'Côte d\'Ivoire', 'Congo RDC', 'Congo Brazza', 'France'];

  // Matrice de secours (Fallback) si l'API est vide
  final Map<String, Map<String, Map<String, dynamic>>> _fallbackMatrix = {
    'Bénin': {
      'International': {
        'intl_avion_express': {'label': 'Avion Express', 'price': 15000, 'unit': 'kg', 'time': '3-5', 'time_unit': 'jours', 'icon': Icons.bolt_rounded},
        'intl_avion_normal': {'label': 'Avion Normal', 'price': 10000, 'unit': 'kg', 'time': '7-12', 'time_unit': 'jours', 'icon': Icons.flight_takeoff_rounded},
        'intl_maritime': {'label': 'Maritime', 'price': 450000, 'unit': 'cbm', 'time': '30-45', 'time_unit': 'jours', 'icon': Icons.directions_boat_rounded},
      },
      'Local': {
        'local_express': {'label': 'Express', 'price': 2500, 'unit': 'course', 'time': '1-3', 'time_unit': 'heures', 'icon': Icons.electric_moped_rounded},
        'local_normal': {'label': 'Normal', 'price': 1000, 'unit': 'course', 'time': '24', 'time_unit': 'heures', 'icon': Icons.local_shipping_rounded},
      }
    },
    'Togo': {
      'International': {
        'intl_avion_express': {'label': 'Avion Express', 'price': 16000, 'unit': 'kg', 'time': '3-5', 'time_unit': 'jours', 'icon': Icons.bolt_rounded},
        'intl_avion_normal': {'label': 'Avion Normal', 'price': 11000, 'unit': 'kg', 'time': '7-12', 'time_unit': 'jours', 'icon': Icons.flight_takeoff_rounded},
        'intl_maritime': {'label': 'Maritime', 'price': 480000, 'unit': 'cbm', 'time': '30-45', 'time_unit': 'jours', 'icon': Icons.directions_boat_rounded},
      },
      'Local': {
        'local_express': {'label': 'Express', 'price': 3000, 'unit': 'course', 'time': '2', 'time_unit': 'heures', 'icon': Icons.electric_moped_rounded},
        'local_normal': {'label': 'Normal', 'price': 1500, 'unit': 'course', 'time': '24', 'time_unit': 'heures', 'icon': Icons.local_shipping_rounded},
      }
    }
  };

  final Map<String, String> _groupDeliveryMethods = {};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CartProvider>().fetchLogisticsSettings();
      _initUserLocation();
    });
  }

  void _initUserLocation() {
    final authState = ref.read(authProvider);
    final user = authState.user;
    if (user != null && user.phone != null) {
      if (user.phone!.startsWith('+242')) {
        setState(() => _selectedCountry = 'Congo Brazza');
      } else if (user.phone!.startsWith('+243')) {
        setState(() => _selectedCountry = 'Congo RDC');
      } else if (user.phone!.startsWith('+237')) {
        setState(() => _selectedCountry = 'Cameroun');
      } else if (user.phone!.startsWith('+225')) {
        setState(() => _selectedCountry = 'Côte d\'Ivoire');
      } else if (user.phone!.startsWith('+228')) {
        setState(() => _selectedCountry = 'Togo');
      }
    }
  }

  Map<String, Map<String, Map<String, dynamic>>> _getEffectiveMatrix(CartProvider cart) {
    if (cart.logisticsSettings.isEmpty) return _fallbackMatrix;
    
    // Convertir le JSON dynamique en structure typée
    try {
       final map = <String, Map<String, Map<String, dynamic>>>{};
       cart.logisticsSettings.forEach((country, origins) {
          map[country] = {};
          (origins as Map).forEach((origin, methods) {
             map[country]![origin] = {};
             (methods as Map).forEach((methodId, data) {
                map[country]![origin]![methodId] = Map<String, dynamic>.from(data);
                // Restaurer les icônes (car le JSON ne stocke pas les objets Icons)
                if (methodId.contains('avion_express')) map[country]![origin]![methodId]['icon'] = Icons.bolt_rounded;
                else if (methodId.contains('avion_normal')) map[country]![origin]![methodId]['icon'] = Icons.flight_takeoff_rounded;
                else if (methodId.contains('maritime')) map[country]![origin]![methodId]['icon'] = Icons.directions_boat_rounded;
                else if (methodId.contains('express')) map[country]![origin]![methodId]['icon'] = Icons.electric_moped_rounded;
                else map[country]![origin]![methodId]['icon'] = Icons.local_shipping_rounded;
             });
          });
       });
       return map;
    } catch (e) {
       return _fallbackMatrix;
    }
  }

  double _getGroupDeliveryFee(String groupKey, List<CartItem> items, String origin, CartProvider cart) {
     final method = _groupDeliveryMethods[groupKey];
     if (method == null) return 0.0;
     
     final matrix = _getEffectiveMatrix(cart);
     final countryData = matrix[_selectedCountry] ?? matrix.values.first;
     final originData = countryData[origin] ?? {};
     final methodData = originData[method];
     
     if (methodData == null) return 0.0;

     double price = double.tryParse(methodData['price']?.toString() ?? '0') ?? 0.0;
     
     if (methodData['unit'] == 'kg' || methodData['unit'] == 'cbm') {
        double totalVolume = 0;
        for (var item in items) {
           double val = double.tryParse(item.product.specifications['shipping_value']?.toString() ?? '1') ?? 1.0;
           totalVolume += val * item.quantity;
        }
        return price * totalVolume;
     }
     
     return price;
   }

  void _processCheckout(BuildContext context, CartProvider cart, ProductProvider products) async {
    final categorized = cart.categorizedItems;
    
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator(color: Color(0xFF00E5C5))),
    );

    bool allSuccess = true;
    
    for (var payType in categorized.keys) {
      for (var origin in categorized[payType]!.keys) {
        final items = categorized[payType]![origin]!;
        if (items.isEmpty) continue;

        final method = _groupDeliveryMethods[origin];
        if (method == null) continue;
        
        final success = await cart.submitSubOrder(
          subItems: items,
          deliveryMethod: method,
          productProvider: products,
          paymentMethod: payType == 'loan' ? 'credit_application' : (_selectedPaymentMethod == 0 ? 'wallet' : 'cash_on_delivery'),
        );

        if (!success) allSuccess = false;
      }
    }

    if (context.mounted) {
      context.pop();
    }
    
    if (allSuccess) {
        if (context.mounted) {
          showDialog(
            context: context,
            barrierDismissible: false,
            builder: (ctx) => AlertDialog(
              backgroundColor: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E1E2C) : Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              icon: const Icon(Icons.check_circle_rounded, color: Color(0xFF00E5C5), size: 60),
              title: const Text('Commande confirmée !', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.w900)),
              content: const Text('Vos commandes ont été validées par groupe. Vous pouvez les suivre séparément dans votre historique.', textAlign: TextAlign.center),
              actions: [
                Center(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(ctx); 
                      if (context.mounted) {
                        context.pop(); 
                        context.pop(); 
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF6C4EF6),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                    ),
                    child: const Text('Compris', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          );
        }
      } else {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Certaines parties de votre commande n\'ont pu être validées.'), backgroundColor: Colors.redAccent),
          );
        }
      }
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();
    final products = context.watch<ProductProvider>();
    final categorized = cart.categorizedItems;
    
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white.withValues(alpha: 0.5) : AppColors.textSecondaryLight;

    // Utiliser les pays définis dans l'API si dispo
    final effectiveMatrix = _getEffectiveMatrix(cart);
    final countriesList = effectiveMatrix.keys.toList();
    if (countriesList.isEmpty) countriesList.add('Bénin');
    if (!countriesList.contains(_selectedCountry)) {
       countriesList.add(_selectedCountry);
    }

    double totalDelivery = 0;
    
    // Extraire toutes les origines actives pour ne compter la livraison qu'une seule fois par origine
    Set<String> activeOrigins = {};
    categorized.forEach((payType, origins) {
      origins.forEach((origin, items) {
        if (items.isNotEmpty) activeOrigins.add(origin);
      });
    });

    for (var origin in activeOrigins) {
      // Rassembler tous les items de cette origine pour le calcul du poids/volume total
      List<CartItem> allOriginItems = [];
      categorized.forEach((payType, origins) {
         if (origins[origin] != null) allOriginItems.addAll(origins[origin]!);
      });
      if (allOriginItems.isNotEmpty) {
         totalDelivery += _getGroupDeliveryFee(origin, allOriginItems, origin, cart);
      }
    }

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
                    Text('Destination & Logistique', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    GlassContainer(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _selectedCountry,
                          isExpanded: true,
                          dropdownColor: isDark ? const Color(0xFF1E1E2C) : Colors.white,
                          style: TextStyle(color: textColor, fontWeight: FontWeight.bold),
                          items: countriesList.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                          onChanged: (val) {
                            setState(() {
                              _selectedCountry = val!;
                              _groupDeliveryMethods.clear();
                            });
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text('Résumé par Groupes', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    
                    ..._buildGroupWidgets(categorized, isDark, textColor, hintColor, cart),

                    const SizedBox(height: 24),
                    Text('Méthode de paiement (Cash)', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    _buildPaymentMethod(0, 'Mossombi Pay', Icons.account_balance_wallet_rounded, const Color(0xFF00E5C5), textColor),
                    const SizedBox(height: 12),
                    _buildPaymentMethod(1, 'Payer à la livraison', Icons.delivery_dining_rounded, const Color(0xFFFF9800), textColor),

                    const SizedBox(height: 40),
                    
                    GlassContainer(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [Text('Articles', style: TextStyle(color: hintColor)), Text('${cart.totalAmount.toStringAsFixed(0)} FCFA', style: TextStyle(color: textColor, fontWeight: FontWeight.bold))],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [Text('Total Livraison', style: TextStyle(color: hintColor)), Text('${totalDelivery.toStringAsFixed(0)} FCFA', style: TextStyle(color: textColor, fontWeight: FontWeight.bold))],
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            child: Divider(color: hintColor.withValues(alpha: 0.2)),
                          ),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [Text('Total Général', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.w900)), Text('${(cart.totalAmount + totalDelivery).toStringAsFixed(0)} FCFA', style: const TextStyle(color: Color(0xFF00E5C5), fontSize: 22, fontWeight: FontWeight.w900, letterSpacing: -1))],
                          ),
                        ],
                      ),
                    ).animate(delay: 300.ms).fade().slideY(begin: 0.2, end: 0),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
            
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
                  label: const Text('Confirmer tout', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16)),
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

  List<Widget> _buildGroupWidgets(Map<String, Map<String, List<CartItem>>> categorized, bool isDark, Color textColor, Color hintColor, CartProvider cart) {
    List<Widget> widgets = [];
    
    // On veut deux grands groupes: Local et International
    List<String> mainOrigins = ['Local', 'International'];
    
    for (var origin in mainOrigins) {
      final cashItems = categorized['cash']?[origin] ?? [];
      final loanItems = categorized['loan']?[origin] ?? [];
      
      if (cashItems.isEmpty && loanItems.isEmpty) continue;
      
      widgets.add(
        Padding(
          padding: const EdgeInsets.only(bottom: 24),
          child: GlassContainer(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      origin.toUpperCase(), 
                      style: const TextStyle(color: AppColors.violet, fontWeight: FontWeight.w900, fontSize: 16)
                    ),
                    InkWell(
                      onTap: () {
                         final itemsToRemove = [...cashItems, ...loanItems];
                         for (var item in itemsToRemove) {
                            cart.removeItem(
                              cart.items.keys.firstWhere((k) => cart.items[k] == item, orElse: () => '')
                            );
                         }
                         if (cart.items.isEmpty) {
                            context.pop();
                         }
                      },
                      borderRadius: BorderRadius.circular(20),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(color: Colors.redAccent.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 14),
                            SizedBox(width: 4),
                            Text('Retirer Tout', style: TextStyle(color: Colors.redAccent, fontSize: 10, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const Divider(height: 24),
                
                // Section Cash
                if (cashItems.isNotEmpty) ...[
                  Text('CASH (Paiement Comptant)', style: TextStyle(color: textColor, fontSize: 13, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  ...cashItems.map((item) => Padding(
                    padding: const EdgeInsets.only(bottom: 8.0, left: 8.0),
                    child: Row(
                      children: [
                        ClipRRect(borderRadius: BorderRadius.circular(4), child: Image.network(item.product.imageUrl, width: 30, height: 30, fit: BoxFit.cover)),
                        const SizedBox(width: 10),
                        Expanded(child: Text(item.product.name, style: TextStyle(color: hintColor, fontSize: 12, fontWeight: FontWeight.w600), maxLines: 1, overflow: TextOverflow.ellipsis)),
                        Text('${item.product.price.toStringAsFixed(0)} F', style: TextStyle(color: textColor, fontSize: 12, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  )),
                  const SizedBox(height: 12),
                ],
                
                // Section Prêt
                if (loanItems.isNotEmpty) ...[
                  Text('PRÊT (Paiement Échelonné)', style: TextStyle(color: textColor, fontSize: 13, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  ...loanItems.map((item) => Padding(
                    padding: const EdgeInsets.only(bottom: 8.0, left: 8.0),
                    child: Row(
                      children: [
                        ClipRRect(borderRadius: BorderRadius.circular(4), child: Image.network(item.product.imageUrl, width: 30, height: 30, fit: BoxFit.cover)),
                        const SizedBox(width: 10),
                        Expanded(child: Text(item.product.name, style: TextStyle(color: hintColor, fontSize: 12, fontWeight: FontWeight.w600), maxLines: 1, overflow: TextOverflow.ellipsis)),
                        Text('${item.product.price.toStringAsFixed(0)} F', style: TextStyle(color: textColor, fontSize: 12, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  )),
                  const SizedBox(height: 12),
                ],
                
                const Divider(height: 24),
                Text('Mode de livraison :', style: TextStyle(color: textColor, fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                _buildDetailedDeliveryOptions(origin, origin, cart, textColor, hintColor),
              ],
            ),
          ),
        )
      );
    }
    return widgets;
  }

  Widget _buildDetailedDeliveryOptions(String groupKey, String origin, CartProvider cart, Color textColor, Color hintColor) {
    final matrix = _getEffectiveMatrix(cart);
    final countryData = matrix[_selectedCountry] ?? matrix.values.first;
    final options = countryData[origin] ?? {};
    
    if (options.isEmpty) return const Text('Aucune option disponible pour ce pays', style: TextStyle(color: Colors.redAccent, fontSize: 11));

    if (_groupDeliveryMethods[groupKey] == null) {
       _groupDeliveryMethods[groupKey] = options.keys.first;
    }

    return Column(
      children: options.entries.map((entry) {
        final methodId = entry.key;
        final data = entry.value;
        final isSelected = _groupDeliveryMethods[groupKey] == methodId;

        return GestureDetector(
          onTap: () => setState(() => _groupDeliveryMethods[groupKey] = methodId),
          child: Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isSelected ? const Color(0xFF6C4EF6).withValues(alpha: 0.1) : Colors.transparent,
              border: Border.all(color: isSelected ? const Color(0xFF6C4EF6) : Colors.grey.withValues(alpha: 0.2)),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(data['icon'], size: 20, color: isSelected ? const Color(0xFF6C4EF6) : Colors.grey),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(data['label'], style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: isSelected ? const Color(0xFF6C4EF6) : textColor)),
                      Text('Délai : ${data['time']} ${data['time_unit']}', style: TextStyle(fontSize: 11, color: hintColor)),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('${data['price']} F / ${data['unit']}', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: isSelected ? const Color(0xFF6C4EF6) : textColor)),
                    if (isSelected) const Icon(Icons.check_circle, size: 16, color: Color(0xFF6C4EF6)),
                  ],
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildPaymentMethod(int index, String title, IconData icon, Color color, Color textColor) {
    final isSelected = _selectedPaymentMethod == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedPaymentMethod = index),
      child: GlassContainer(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Icon(isSelected ? Icons.radio_button_checked : Icons.radio_button_off, color: isSelected ? const Color(0xFF6C4EF6) : Colors.grey),
            const SizedBox(width: 16),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: color.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(8)),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(child: Text(title, style: TextStyle(color: textColor, fontWeight: FontWeight.w800, fontSize: 15))),
          ],
        ),
      ),
    );
  }
}

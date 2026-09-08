import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:mosombi_frontend/core/models/product_model.dart';
import 'package:mosombi_frontend/core/providers/product_provider.dart';
import 'package:mosombi_frontend/core/providers/cart_provider.dart';
import 'package:mosombi_frontend/core/providers/auth_provider.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:mosombi_frontend/core/widgets/custom_button.dart';
import 'package:mosombi_frontend/core/widgets/product_image.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

class ProductDetailsScreen extends ConsumerStatefulWidget {
  final Product product;

  const ProductDetailsScreen({super.key, required this.product});

  @override
  ConsumerState<ProductDetailsScreen> createState() => _ProductDetailsScreenState();
}

class _ProductDetailsScreenState extends ConsumerState<ProductDetailsScreen> {
  int _selectedVariant = 0;
  String? _selectedSubVariantName;
  int _selectedColor = 0;
  int _currentImageIndex = 0;
  bool _wantsLoan = false; 
  String _selectedDestination = 'Bénin'; // Destination par défaut
  bool _isBulkMode = false;
  final Map<String, int> _bulkQuantities = {}; // key: "variantIndex_colorIndex"

  List<Map<String, dynamic>> _variants = [];
  Map<String, dynamic> _specifications = {};
  List<String> _parsedGalleryUrls = [];
  String _cleanDescription = '';

  @override
  void initState() {
    super.initState();
    _parseDescription();
    // Charger les paramètres logistiques pour l'estimation
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CartProvider>().fetchLogisticsSettings();
    });
  }

  void _parseDescription() {
       _cleanDescription = widget.product.description;
       _variants = List<Map<String, dynamic>>.from(widget.product.variants);
       _specifications = Map<String, dynamic>.from(widget.product.specifications);
       
       if (_variants.isNotEmpty) {
           String title = _variants[0]['title']?.toString() ?? '';
           String labelPart = title.split(' - ').first.replaceAll('Taille: ', '').replaceAll('Capacité: ', '').trim();
           _selectedSubVariantName = labelPart.split(',').first.trim();
       } else if (_specifications['Mémoire/Stockage'] != null && _specifications['Mémoire/Stockage'] is List && (_specifications['Mémoire/Stockage'] as List).isNotEmpty) {
           _selectedSubVariantName = (_specifications['Mémoire/Stockage'] as List).first.toString().trim();
       } else if (_specifications['Taille'] != null && _specifications['Taille'] is List && (_specifications['Taille'] as List).isNotEmpty) {
           _selectedSubVariantName = (_specifications['Taille'] as List).first.toString().trim();
       } else if (_specifications['Poids/Volume'] != null && _specifications['Poids/Volume'] is List && (_specifications['Poids/Volume'] as List).isNotEmpty) {
           _selectedSubVariantName = (_specifications['Poids/Volume'] as List).first.toString().trim();
       }

       if (widget.product.galleryUrls.isNotEmpty) {
           _parsedGalleryUrls = List<String>.from(widget.product.galleryUrls);
       }
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();
    final allProducts = context.watch<ProductProvider>().products;
    
    // Logic for similar products
    var similarProducts = allProducts.where((p) => p.category == widget.product.category && p.id != widget.product.id).toList();
    if (similarProducts.isEmpty) {
      similarProducts = allProducts.where((p) => p.id != widget.product.id).take(3).toList();
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white.withValues(alpha: 0.5) : AppColors.textSecondaryLight;
    final outOfStock = widget.product.stock == 0;

    return Scaffold(
      extendBodyBehindAppBar: true,
      backgroundColor: isDark ? const Color(0xFF12121D) : const Color(0xFFF6F8FB),
      appBar: MossombiHeaderType4(
        actionIcon: const Icon(Icons.shopping_bag_rounded, color: Colors.white, size: 20),
        onActionTap: () => context.push('/cart'),
        badgeCount: cart.itemCount,
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image Hero
            SizedBox(
              height: MediaQuery.of(context).size.height * 0.45,
              width: double.infinity,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  PageView.builder(
                    onPageChanged: (i) => setState(() => _currentImageIndex = i),
                    itemCount: _parsedGalleryUrls.isNotEmpty ? _parsedGalleryUrls.length + 1 : (widget.product.galleryUrls.isNotEmpty ? widget.product.galleryUrls.length + 1 : 1),
                    itemBuilder: (context, index) {
                       List<String> combinedUrls = _parsedGalleryUrls.isNotEmpty ? _parsedGalleryUrls : widget.product.galleryUrls;
                       String url = index == 0 ? widget.product.imageUrl : combinedUrls[index - 1];
                       return ProductImageHelper.buildImage(url, fit: BoxFit.cover,
                         errorWidget: Container(
                           color: isDark ? const Color(0xFF1E1E2C) : const Color(0xFFF0F0F5),
                           child: const Center(child: Icon(Icons.image_not_supported_rounded, color: AppColors.violet, size: 64)),
                         ),
                       );
                    },
                  ),
                  if (_parsedGalleryUrls.isNotEmpty || widget.product.galleryUrls.isNotEmpty)
                    Positioned(
                       bottom: 40,
                       left: 0,
                       right: 0,
                       child: Row(
                         mainAxisAlignment: MainAxisAlignment.center,
                         children: List.generate(
                           (_parsedGalleryUrls.isNotEmpty ? _parsedGalleryUrls.length : widget.product.galleryUrls.length) + 1,
                           (index) => Container(
                              margin: const EdgeInsets.symmetric(horizontal: 4),
                              width: _currentImageIndex == index ? 24 : 8,
                              height: 8,
                              decoration: BoxDecoration(
                                color: _currentImageIndex == index ? AppColors.violet : Colors.white54,
                                borderRadius: BorderRadius.circular(4),
                              ),
                           )
                         ),
                       ),
                    ),
                  if (outOfStock)
                    Container(color: Colors.black.withValues(alpha: 0.6)),
                ],
              ),
            ),
            
            // Details Area
            Container(
              transform: Matrix4.translationValues(0, -30, 0),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E1E2C) : Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 20, offset: const Offset(0, -10))],
              ),
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title & Price
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(widget.product.name, style: TextStyle(color: textColor, fontSize: 24, fontWeight: FontWeight.w900, height: 1.2)),
                            if (widget.product.brand != null && widget.product.brand!.isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(top: 4.0),
                                child: Text(widget.product.brand!, style: const TextStyle(color: AppColors.violet, fontSize: 14, fontWeight: FontWeight.bold)),
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                            Builder(
                              builder: (context) {
                                double displayPrice = widget.product.price;
                                
                                // First check if a dynamic sub-variant is selected
                                if (_variants.isNotEmpty && _selectedSubVariantName != null) {
                                  final variantMatch = _variants.firstWhere(
                                    (v) {
                                      String t = v['title']?.toString() ?? '';
                                      return t == _selectedSubVariantName || t.contains(_selectedSubVariantName!);
                                    },
                                    orElse: () => <String, dynamic>{},
                                  );
                                  if (variantMatch.isNotEmpty && variantMatch['price'] != null) {
                                    displayPrice = double.tryParse(variantMatch['price'].toString()) ?? displayPrice;
                                  }
                                } 
                                // Fallback to explicitly selected variant index
                                else if (_variants.isNotEmpty && _selectedVariant >= 0 && _selectedVariant < _variants.length) {
                                  final variantPrice = _variants[_selectedVariant]['price'];
                                  if (variantPrice != null) {
                                    displayPrice = double.tryParse(variantPrice.toString()) ?? displayPrice;
                                  }
                                }
                                return Text('${displayPrice.toStringAsFixed(0)} ${widget.product.currency}', style: const TextStyle(color: Color(0xFF00E5C5), fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: -0.5));
                              }
                            ),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(color: AppColors.violet.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                            child: Text(widget.product.category.toUpperCase(), style: const TextStyle(color: AppColors.violet, fontSize: 10, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Meta Info (Origin + État)
                  Row(
                    children: [
                      Expanded(
                        child: _buildMetaCard(Icons.flight_takeoff_rounded, 'Origine', widget.product.origin, const Color(0xFFFF9800), isDark),
                      ),
                      const SizedBox(width: 16),
                      if (!['Alimentation / Épicerie', 'Immobilier', 'Services', 'Santé'].contains(widget.product.category))
                        Expanded(
                          child: _buildMetaCard(Icons.verified_rounded, 'État', _getCombinedCondition(), const Color(0xFF6C4EF6), isDark),
                        ),
                    ],
                  ),

                  const SizedBox(height: 24),
                  
                  // Dynamic Options (Déclinaisons)
                  if (_variants.isNotEmpty) ...[
                    Text(_getVariantTitle(widget.product.category), style: TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 12),
                    SingleChildScrollView(
                       scrollDirection: Axis.horizontal,
                       child: Row(
                         children: () {
                            List<Widget> options = [];
                            for (int i=0; i<_variants.length; i++) {
                               String title = _variants[i]['title']?.toString() ?? '';
                               String labelPart = title.split(' - ').first.replaceAll('Taille: ', '').replaceAll('Capacité: ', '').trim();
                               List<String> subOptions = labelPart.split(',');
                               for (String sub in subOptions) {
                                   String cleanSub = sub.trim();
                                   if (cleanSub.isEmpty) continue;
                                   bool isSelected = (_selectedVariant == i && _selectedSubVariantName == cleanSub);
                                   options.add(
                                       GestureDetector(
                                          onTap: () => setState(() { _selectedVariant = i; _selectedSubVariantName = cleanSub; }),
                                          child: Container(
                                            margin: const EdgeInsets.only(right: 12),
                                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                            decoration: BoxDecoration(
                                              color: isSelected ? const Color(0xFF6C4EF6) : Colors.transparent,
                                              borderRadius: BorderRadius.circular(12),
                                              border: Border.all(color: isSelected ? const Color(0xFF6C4EF6) : Colors.grey.withValues(alpha: 0.3)),
                                            ),
                                            child: Text(cleanSub, style: TextStyle(color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.black87), fontWeight: FontWeight.bold)),
                                          )
                                       )
                                   );
                               }
                            }
                            return options;
                         }()
                       ),
                    ),
                    const SizedBox(height: 24),
                  ] else if (_specifications['Mémoire/Stockage'] != null && _specifications['Mémoire/Stockage'] is List && (_specifications['Mémoire/Stockage'] as List).isNotEmpty) ...[
                    Text('Mémoire / Stockage', style: TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 12),
                    SingleChildScrollView(
                       scrollDirection: Axis.horizontal,
                       child: Row(
                         children: (_specifications['Mémoire/Stockage'] as List).map((mem) {
                             String cleanSub = mem.toString().trim();
                             if (cleanSub.isEmpty) return const SizedBox();
                             bool isSelected = (_selectedSubVariantName == cleanSub);
                             return GestureDetector(
                                onTap: () => setState(() { _selectedSubVariantName = cleanSub; }),
                                child: Container(
                                  margin: const EdgeInsets.only(right: 12),
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: isSelected ? const Color(0xFF6C4EF6) : Colors.transparent,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: isSelected ? const Color(0xFF6C4EF6) : Colors.grey.withValues(alpha: 0.3)),
                                  ),
                                  child: Text(cleanSub, style: TextStyle(color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.black87), fontWeight: FontWeight.bold)),
                                )
                             );
                         }).toList(),
                       ),
                    ),
                    const SizedBox(height: 24),
                  ] else if (_specifications['Taille'] != null && _specifications['Taille'] is List && (_specifications['Taille'] as List).isNotEmpty) ...[
                    Text('Tailles disponibles', style: TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 12),
                    SingleChildScrollView(
                       scrollDirection: Axis.horizontal,
                       child: Row(
                         children: (_specifications['Taille'] as List).map((sz) {
                             String cleanSub = sz.toString().trim();
                             if (cleanSub.isEmpty) return const SizedBox();
                             bool isSelected = (_selectedSubVariantName == cleanSub);
                             return GestureDetector(
                                onTap: () => setState(() { _selectedSubVariantName = cleanSub; }),
                                child: Container(
                                  margin: const EdgeInsets.only(right: 12),
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: isSelected ? const Color(0xFF6C4EF6) : Colors.transparent,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: isSelected ? const Color(0xFF6C4EF6) : Colors.grey.withValues(alpha: 0.3)),
                                  ),
                                  child: Text(cleanSub, style: TextStyle(color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.black87), fontWeight: FontWeight.bold)),
                                )
                             );
                         }).toList(),
                       ),
                    ),
                    const SizedBox(height: 24),
                  ] else if (_specifications['Poids/Volume'] != null && _specifications['Poids/Volume'] is List && (_specifications['Poids/Volume'] as List).isNotEmpty) ...[
                    Text('Poids / Volume', style: TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 12),
                    SingleChildScrollView(
                       scrollDirection: Axis.horizontal,
                       child: Row(
                         children: (_specifications['Poids/Volume'] as List).map((pv) {
                             String cleanSub = pv.toString().trim();
                             if (cleanSub.isEmpty) return const SizedBox();
                             bool isSelected = (_selectedSubVariantName == cleanSub);
                             return GestureDetector(
                                onTap: () => setState(() { _selectedSubVariantName = cleanSub; }),
                                child: Container(
                                  margin: const EdgeInsets.only(right: 12),
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: isSelected ? const Color(0xFF6C4EF6) : Colors.transparent,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: isSelected ? const Color(0xFF6C4EF6) : Colors.grey.withValues(alpha: 0.3)),
                                  ),
                                  child: Text(cleanSub, style: TextStyle(color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.black87), fontWeight: FontWeight.bold)),
                                )
                             );
                         }).toList(),
                       ),
                    ),
                    const SizedBox(height: 24),
                    const SizedBox(height: 24),
                  ],
                  
                  // Mode Achat en Gros (Bulk Selection)
                  if (_variants.isNotEmpty) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Achat en gros / Multi-choix', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.w900)),
                        Switch(
                          value: _isBulkMode,
                          onChanged: (val) => setState(() => _isBulkMode = val),
                          activeColor: AppColors.violet,
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    if (_isBulkMode) 
                      _buildBulkSelector(isDark, textColor, hintColor)
                    else
                      Text('Activez pour commander plusieurs variantes à la fois.', style: TextStyle(color: hintColor, fontSize: 12, fontStyle: FontStyle.italic)),
                    const SizedBox(height: 24),
                  ],
                  
                  // Dynamic Options (Couleurs par Variante) - Hidden in bulk mode if redundant
                  if (!_isBulkMode) ...[
                    if (_variants.isNotEmpty && _variants[_selectedVariant]['colors'] != null && (_variants[_selectedVariant]['colors'] as List).isNotEmpty) ...[
                      Text('Couleurs disponibles', style: TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 12, runSpacing: 12,
                        children: (_variants[_selectedVariant]['colors'] as List).asMap().entries.map((e) {
                           return _buildColorOption(e.key, _parseColor(e.value));
                        }).toList(),
                      ),
                      const SizedBox(height: 24),
                    ] else if (_specifications['Couleurs'] != null && _specifications['Couleurs'] is List && (_specifications['Couleurs'] as List).isNotEmpty) ...[
                      Text('Couleurs', style: TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 12, runSpacing: 12,
                        children: (_specifications['Couleurs'] as List).asMap().entries.map((e) {
                           return _buildColorOption(e.key, _parseColor(e.value));
                        }).toList(),
                      ),
                      const SizedBox(height: 24),
                    ],
                  ],


                  // Other Specifications (Dynamic Fields)
                  _buildSpecificationsGrid(textColor, isDark),

                  if (_specifications['Villes disponibles'] != null && _specifications['Villes disponibles'] is List) ...[
                     Text('Disponibilité Locale', style: TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.w800)),
                     const SizedBox(height: 8),
                     Wrap(
                       spacing: 8,
                       runSpacing: 8,
                       children: (_specifications['Villes disponibles'] as List).map((city) {
                           return Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(color: Colors.green.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                              child: Text(city.toString(), style: const TextStyle(color: Colors.green, fontSize: 11, fontWeight: FontWeight.bold)),
                           );
                       }).toList(),
                     ),
                     const SizedBox(height: 24),
                  ],
                  
                  if (_specifications['Paiement par prêt'] == 'Oui') ...[
                     Container(
                       padding: const EdgeInsets.all(16),
                       decoration: BoxDecoration(
                          color: AppColors.violet.withValues(alpha: 0.05),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.violet.withValues(alpha: 0.3)),
                       ),
                       child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                             Row(
                               mainAxisAlignment: MainAxisAlignment.spaceBetween,
                               children: [
                                  Expanded(
                                    child: Row(
                                      children: [
                                        const Icon(Icons.account_balance_wallet_rounded, color: AppColors.violet, size: 20),
                                        const SizedBox(width: 8),
                                        const Expanded(child: Text('Disponible à tempérament (Prêt)', style: TextStyle(color: AppColors.violet, fontWeight: FontWeight.w900, fontSize: 13))),
                                      ],
                                    ),
                                  ),
                                  Switch(
                                    value: _wantsLoan,
                                    onChanged: (val) => setState(() => _wantsLoan = val),
                                    activeColor: AppColors.violet,
                                  ),
                               ],
                             ),
                             if (_wantsLoan) ...[
                               const SizedBox(height: 8),
                               Text('Première avance : ${_specifications['Première avance'] ?? '?'} FCFA', style: TextStyle(color: hintColor, fontSize: 13, fontWeight: FontWeight.bold)),
                               Text('Versements suivants : ${_specifications['Montant de versement'] ?? '?'} FCFA', style: TextStyle(color: hintColor, fontSize: 13)),
                               if (_specifications['Fréquence de versement'] != null)
                                 Text('Fréquence : ${_specifications['Fréquence de versement']}', style: TextStyle(color: hintColor, fontSize: 13, fontStyle: FontStyle.italic)),
                             ],
                          ],
                       ),
                     ),
                     const SizedBox(height: 24),
                  ],

                  if (_specifications['Autres informations'] != null && _specifications['Autres informations'].toString().trim().isNotEmpty) ...[
                     Text('Informations Complémentaires', style: TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.w800)),
                     const SizedBox(height: 8),
                     Text(_specifications['Autres informations'].toString(), style: TextStyle(color: hintColor, fontSize: 14, height: 1.5)),
                     const SizedBox(height: 24),
                  ],

                  const SizedBox(height: 24),
                  
                  // Section Livraison Dynamique
                  _buildDeliveryInfoSection(isDark, textColor, hintColor),
                  
                  const SizedBox(height: 24),
                  Text('Description', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 8),
                  Text(_cleanDescription, style: TextStyle(color: hintColor, fontSize: 15, height: 1.6)),
                  
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Icon(outOfStock ? Icons.error_outline : Icons.check_circle_outline, color: outOfStock ? Colors.redAccent : const Color(0xFF00E5C5)),
                      const SizedBox(width: 8),
                      Text(outOfStock ? 'En rupture de stock' : 'En stock (${widget.product.stock} disponibles)', style: TextStyle(color: outOfStock ? Colors.redAccent : const Color(0xFF00E5C5), fontWeight: FontWeight.bold)),
                    ],
                  ),
                  
                  const SizedBox(height: 32),
                  // Frequently Bought Together / Similar Products
                  if (similarProducts.isNotEmpty) ...[
                    Text('Ces articles pourraient vous plaire', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.w900)),
                    const SizedBox(height: 16),
                    SizedBox(
                      height: 130,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        physics: const BouncingScrollPhysics(),
                        itemCount: similarProducts.length,
                        itemBuilder: (ctx, i) {
                          final p = similarProducts[i];
                          return GestureDetector(
                            onTap: () => context.pushReplacement('/product-details/${p.id}'),
                            child: Container(
                              width: 250,
                              margin: const EdgeInsets.only(right: 16),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.03),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppColors.violet.withValues(alpha: 0.1)),
                              ),
                              child: Row(
                                children: [
                                  SizedBox(
                                    width: 70,
                                    height: 70,
                                    child: ClipRRect(
                                      borderRadius: BorderRadius.circular(12),
                                      child: ProductImageHelper.buildImage(p.imageUrl, fit: BoxFit.cover,
                                        errorWidget: Container(
                                          color: AppColors.violet.withValues(alpha: 0.1),
                                          child: const Icon(Icons.image_not_supported_rounded, color: AppColors.violet, size: 28),
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Text(p.name, style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 13), maxLines: 2, overflow: TextOverflow.ellipsis),
                                        const SizedBox(height: 4),
                                        Text('${p.price.toStringAsFixed(0)} FCFA', style: const TextStyle(color: Color(0xFF00E5C5), fontWeight: FontWeight.w900, fontSize: 12)),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],

                  const SizedBox(height: 140), // Large spacing for bottom nav & Android safe area
                ],
              ),
            ),
          ],
        ),
      ),
      bottomSheet: Container(
        padding: EdgeInsets.fromLTRB(24, 16, 24, MediaQuery.of(context).padding.bottom + 24), // Android Navigation Safe Area Fix
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E1E2C) : Colors.white,
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 20, offset: const Offset(0, -5))],
        ),
        child: MosombiButton.primary(
          onPressed: outOfStock ? null : () {
            if (_isBulkMode) {
              List<Map<String, dynamic>> selections = [];
              _bulkQuantities.forEach((key, qty) {
                if (qty > 0) {
                  final parts = key.split('_');
                  final vIdx = int.parse(parts[0]);
                  final cIdx = int.parse(parts[1]);
                  
                  String? vTitle = _variants[vIdx]['title']?.toString();
                  String? cHex;
                  if (_variants[vIdx]['colors'] != null && (_variants[vIdx]['colors'] as List).isNotEmpty) {
                    cHex = (_variants[vIdx]['colors'] as List)[cIdx].toString();
                  }
                  
                  selections.add({
                    'variant': vTitle,
                    'color': cHex,
                    'quantity': qty,
                    'wantsLoan': _wantsLoan,
                  });
                }
              });
              
              if (selections.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Veuillez sélectionner au moins une quantité.')));
                return;
              }
              
              cart.addBulk(widget.product, selections);
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Sélection ajoutée au panier (${selections.length} types)'), backgroundColor: AppColors.violet));
              setState(() => _bulkQuantities.clear());
            } else {
              String? vTitle;
              if (_variants.isNotEmpty) {
                vTitle = _selectedSubVariantName ?? _variants[_selectedVariant]['title'].toString();
              }
              
              String? cHex;
              if (_variants.isNotEmpty && _variants[_selectedVariant]['colors'] != null && (_variants[_selectedVariant]['colors'] as List).isNotEmpty) {
                cHex = (_variants[_selectedVariant]['colors'] as List)[_selectedColor].toString();
              } else if (_specifications['Couleurs'] != null && _specifications['Couleurs'] is List && (_specifications['Couleurs'] as List).isNotEmpty) {
                cHex = (_specifications['Couleurs'] as List)[_selectedColor].toString();
              }
              
              cart.addItem(widget.product, selectedVariant: vTitle, selectedColor: cHex, wantsLoan: _wantsLoan);
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${widget.product.name} ajouté au panier'), backgroundColor: AppColors.violet, behavior: SnackBarBehavior.floating));
            }
          },
          icon: Icons.add_shopping_cart_rounded,
          text: outOfStock ? 'Indisponible' : (_isBulkMode ? 'Ajouter la sélection' : 'Ajouter au Panier'),
        ),
      ),
    );
  }

  String _getVariantTitle(String cat) {
    if (cat == 'Mode M/F' || cat == 'Beauté') return 'Tailles disponibles';
    if (cat == 'Électronique') return 'Modèles / Capacités';
    if (cat == 'Alimentation / Épicerie' || cat == 'Santé') return 'Poids / Contenance';
    if (cat == 'Immobilier') return 'Types / Surfaces';
    if (cat == 'Services') return 'Durées / Formules';
    return 'Déclinaisons / Modèles';
  }

  String _getCombinedCondition() {
    if (_variants.isNotEmpty) {
      Set<String> conditions = {};
      for (var v in _variants) {
        String t = v['title'].toString();
        if (t.contains('Neuf')) conditions.add('Neuf');
        if (t.contains('Occasion')) conditions.add('Occasion');
        if (t.contains('Friperie')) conditions.add('Friperie');
      }
      if (conditions.isNotEmpty) return conditions.join(' & ');
    }
    return _specifications['État']?.toString() ?? 'Non spécifié';
  }

  Widget _buildSpecificationsGrid(Color textColor, bool isDark) {
    // Exclude fields we already handled manually
    List<String> excludedKeys = ['État', 'Couleurs', 'Villes disponibles', 'Paiement par prêt', 'Première avance', 'Montant de versement', 'Fréquence de versement', 'Autres informations', 'shipping_unit', 'shipping_value', 'Taille', 'Poids/Volume', 'Mémoire/Stockage'];
    
    Map<String, dynamic> dynamicSpecs = {};
    _specifications.forEach((key, value) {
       if (!excludedKeys.contains(key) && value != null && value.toString().trim().isNotEmpty) {
          dynamicSpecs[key] = value;
       }
    });

    if (dynamicSpecs.isEmpty) return const SizedBox();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Caractéristiques', style: TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.w800)),
        const SizedBox(height: 12),
        Wrap(
          spacing: 12, runSpacing: 12,
          children: dynamicSpecs.entries.map((e) {
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.03),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.violet.withValues(alpha: 0.1)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(e.key.toUpperCase(), style: const TextStyle(color: AppColors.violet, fontSize: 10, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(e.value.toString(), style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 13)),
                ],
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildVariantOption(int index, String label, bool isDark) {
    final isSelected = _selectedVariant == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedVariant = index),
      child: Container(
        margin: const EdgeInsets.only(right: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF6C4EF6) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isSelected ? const Color(0xFF6C4EF6) : Colors.grey.withValues(alpha: 0.3)),
        ),
        child: Text(
          label.split(' - ').first.replaceAll('Taille: ', '').replaceAll('Capacité: ', '').trim(),
          style: TextStyle(
            color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
          ),
        ),
      ),
    );
  }

  Widget _buildColorOption(int index, Color color) {
    final isSelected = _selectedColor == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedColor = index),
      child: Container(
        margin: const EdgeInsets.only(right: 16),
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
          border: Border.all(color: isSelected ? const Color(0xFF6C4EF6) : Colors.grey.withValues(alpha: 0.3), width: isSelected ? 3 : 1),
          boxShadow: [
            if (isSelected) BoxShadow(color: const Color(0xFF6C4EF6).withValues(alpha: 0.4), blurRadius: 10)
          ],
        ),
      ),
    );
  }

  Color _parseColor(dynamic colorValue) {
    if (colorValue == null) return Colors.transparent;
    try {
      String hexStr = colorValue.toString().replaceAll('#', '');
      if (hexStr.length == 6) hexStr = 'FF$hexStr';
      if (hexStr.length == 8) {
        return Color(int.parse(hexStr, radix: 16));
      }
    } catch (_) {}
    return Colors.grey;
  }

  Widget _buildBulkSelector(bool isDark, Color textColor, Color hintColor) {
    return Column(
      children: _variants.asMap().entries.map((vEntry) {
        int vIdx = vEntry.key;
        var variant = vEntry.value;
        List colors = variant['colors'] ?? [null];
        
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: colors.asMap().entries.map((cEntry) {
            int cIdx = cEntry.key;
            var colorHex = cEntry.value;
            String key = '${vIdx}_$cIdx';
            int qty = _bulkQuantities[key] ?? 0;
            
            double vPrice = widget.product.price;
            if (variant['price'] != null) {
               vPrice = double.tryParse(variant['price'].toString()) ?? vPrice;
            }

            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.03),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.violet.withValues(alpha: 0.1)),
              ),
              child: Row(
                children: [
                  if (colorHex != null)
                    Container(
                      width: 24, height: 24,
                      margin: const EdgeInsets.only(right: 12),
                      decoration: BoxDecoration(color: _parseColor(colorHex), shape: BoxShape.circle, border: Border.all(color: Colors.white24)),
                    ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(variant['title'] ?? 'Variante', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 13)),
                        Text('${vPrice.toStringAsFixed(0)} ${widget.product.currency}', style: const TextStyle(color: Color(0xFF00E5C5), fontSize: 12, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                  Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.remove_circle_outline, size: 20),
                        onPressed: qty > 0 ? () => setState(() => _bulkQuantities[key] = qty - 1) : null,
                      ),
                      Text('$qty', style: TextStyle(color: textColor, fontWeight: FontWeight.bold)),
                      IconButton(
                        icon: const Icon(Icons.add_circle_outline, size: 20, color: AppColors.violet),
                        onPressed: () => setState(() => _bulkQuantities[key] = qty + 1),
                      ),
                    ],
                  ),
                ],
              ),
            );
          }).toList(),
        );
      }).toList(),
    );
  }

  Widget _buildLogisticsSection(bool isDark, Color textColor, Color hintColor) {
    final cart = context.watch<CartProvider>();
    final matrix = cart.logisticsSettings;
    final countries = matrix.keys.toList();
    if (countries.isEmpty) {
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: Colors.orange.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(16)),
          child: const Text('Modes de livraison en cours de configuration par l\'admin...', style: TextStyle(color: Colors.orange, fontSize: 12)),
        );
    }
    
    if (!countries.contains(_selectedDestination)) _selectedDestination = countries.first;

    final rawOrigin = widget.product.origin ?? 'Local';
    final bool isLocal = rawOrigin.contains('Local') || rawOrigin.contains('Congo-Brazzaville') || rawOrigin.contains('Congo Brazza');
    final origin = isLocal ? 'Local' : 'International';
    final options = matrix[_selectedDestination]?[origin] ?? {};

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GlassContainer(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _selectedDestination,
              isExpanded: true,
              dropdownColor: isDark ? const Color(0xFF1E1E2C) : Colors.white,
              items: countries.map((c) => DropdownMenuItem(value: c, child: Text('Livrer vers : $c', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 13)))).toList(),
              onChanged: (val) => setState(() => _selectedDestination = val!),
            ),
          ),
        ),
        const SizedBox(height: 12),
        if (options.isEmpty)
           const Text('Aucun service disponible pour cette destination.', style: TextStyle(color: Colors.redAccent, fontSize: 12))
        else
           ...options.entries.map((entry) {
              final data = entry.value;
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.03),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.violet.withValues(alpha: 0.1)),
                ),
                child: Row(
                  children: [
                    Icon(entry.key.contains('avion') ? Icons.flight : (entry.key.contains('maritime') ? Icons.directions_boat : Icons.local_shipping), color: AppColors.violet, size: 18),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(data['label'] ?? entry.key, style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 13)),
                          Text('Délai : ${data['time']} ${data['time_unit']}', style: TextStyle(color: hintColor, fontSize: 11)),
                        ],
                      ),
                    ),
                    Text('${data['price']} F / ${data['unit']}', style: TextStyle(color: textColor, fontWeight: FontWeight.w900, fontSize: 12)),
                  ],
                ),
              );
           }),
      ],
    );
  }

  Widget _buildMetaCard(IconData icon, String title, String value, Color color, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: color.withValues(alpha: 0.15), shape: BoxShape.circle),
            child: Icon(icon, color: color, size: 16),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(color: isDark ? Colors.white54 : Colors.black54, fontSize: 11)),
                const SizedBox(height: 2),
                Text(value, style: TextStyle(color: isDark ? Colors.white : Colors.black, fontWeight: FontWeight.bold, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDeliveryInfoSection(bool isDark, Color textColor, Color hintColor) {
    final cart = context.read<CartProvider>();
    
    // Identifier le pays du client (défaut, sera précisé au checkout)
    final authState = ref.watch(authProvider);
    final user = authState.user;
    String clientCountry = 'Bénin'; // Fallback
    
    if (user != null && user.phone != null) {
      if (user.phone!.startsWith('+242')) clientCountry = 'Congo Brazza';
      else if (user.phone!.startsWith('+243')) clientCountry = 'Congo RDC';
      else if (user.phone!.startsWith('+237')) clientCountry = 'Cameroun';
      else if (user.phone!.startsWith('+225')) clientCountry = 'Côte d\'Ivoire';
      else if (user.phone!.startsWith('+228')) clientCountry = 'Togo';
    }

    final matrix = cart.logisticsSettings;
    final dynamic rawData = matrix[clientCountry] ?? (matrix.isNotEmpty ? matrix.values.first : {});
    final countryData = Map<String, dynamic>.from(rawData is Map ? rawData : {});
    if (countryData is! Map) return const SizedBox.shrink();
    
    final productOrigin = widget.product.origin ?? 'Local';
    final bool isLocal = productOrigin.contains('Local') || productOrigin.contains('Congo-Brazzaville') || productOrigin.contains('Congo Brazza');
    
    final sectionKey = isLocal ? 'Local' : 'International';
    final sectionData = countryData[sectionKey] ?? {};
    
    final bool isEnabled = sectionData is Map ? (sectionData['enabled'] ?? true) : true;

    Map methods = {};
    if (isLocal) {
      methods = (sectionData is Map && sectionData.containsKey('methods'))
          ? (sectionData['methods'] as Map)
          : (sectionData is Map ? sectionData : {});
    } else {
      if (sectionData is Map && sectionData.containsKey('origins')) {
        final origins = sectionData['origins'] as Map;
        final cleanOrigin = productOrigin.split(' ').first; 
        final originConfig = origins[cleanOrigin] ?? (origins.isNotEmpty ? origins.values.first : null);
        
        if (originConfig != null && originConfig is Map) {
          methods = originConfig['methods'] as Map? ?? {};
        }
      } else {
        methods = (sectionData is Map && sectionData.containsKey('methods'))
          ? (sectionData['methods'] as Map)
          : (sectionData is Map ? sectionData : {});
      }
    }

    if (!isEnabled || methods.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.local_shipping_rounded, color: Color(0xFF00E5C5), size: 20),
            const SizedBox(width: 8),
            Text('Options de Livraison', style: TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.w800)),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.03),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
          ),
          child: Column(
            children: methods.entries.where((e) {
              final id = e.key.toString();
              if (id == 'enabled' || id == 'methods' || id == 'origins' || id == 'cities') return false;
              if (e.value is! Map) return false;
              
              final data = e.value as Map;
              if (!isLocal) {
                final methodUnit = data['unit']?.toString().toLowerCase();
                final productUnit = widget.product.shippingUnit?.toLowerCase();
                if (methodUnit != null && productUnit != null && methodUnit != productUnit) {
                   return false; 
                }
              }
              return true;
            }).map((e) {
              final id = e.key.toString();
              final data = e.value as Map;
              
              final label = (data['label'] ?? id).toString();
              final time = (data['time'] ?? '?').toString();
              final timeUnit = (data['time_unit'] ?? 'jours').toString();
              
              String priceStr = '';
              if (isLocal) {
                final fixed = data['fixed_price'] ?? data['price'] ?? 0;
                final threshold = data['threshold_weight'] ?? 10;
                priceStr = '${fixed} F (<${threshold}kg)';
              } else {
                final price = (data['price'] ?? 0).toString();
                final unit = (data['unit'] ?? 'kg').toString();
                priceStr = '$price F /$unit';
              }

              IconData icon = Icons.local_shipping_outlined;
              if (id.contains('avion_express')) icon = Icons.bolt_rounded;
              else if (id.contains('avion_normal')) icon = Icons.flight_takeoff_rounded;
              else if (id.contains('maritime')) icon = Icons.directions_boat_rounded;
              else if (id.contains('express')) icon = Icons.electric_moped_rounded;

              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Icon(icon, size: 18, color: hintColor),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(label, style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 13)),
                          Text('Délai: $time $timeUnit', style: TextStyle(color: hintColor, fontSize: 11)),
                        ],
                      ),
                    ),
                    Text(priceStr, style: const TextStyle(color: Color(0xFF00E5C5), fontWeight: FontWeight.w900, fontSize: 13)),
                  ],
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}

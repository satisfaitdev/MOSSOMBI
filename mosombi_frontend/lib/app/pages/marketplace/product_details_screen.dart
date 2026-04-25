import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:mosombi_frontend/core/models/product_model.dart';
import 'package:mosombi_frontend/core/providers/product_provider.dart';
import 'package:mosombi_frontend/core/providers/cart_provider.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'dart:convert';

class ProductDetailsScreen extends StatefulWidget {
  final Product product;

  const ProductDetailsScreen({super.key, required this.product});

  @override
  State<ProductDetailsScreen> createState() => _ProductDetailsScreenState();
}

class _ProductDetailsScreenState extends State<ProductDetailsScreen> {
  int _selectedVariant = 0;
  int _selectedColor = 0;
  int _currentImageIndex = 0;
  bool _wantsLoan = false; // Checkbox for loan

  List<Map<String, dynamic>> _variants = [];
  Map<String, dynamic> _specifications = {};
  List<String> _parsedGalleryUrls = [];
  String _cleanDescription = '';

  @override
  void initState() {
    super.initState();
    _parseDescription();
  }

  void _parseDescription() {
       String originalDesc = widget.product.description;
       int declIndex = originalDesc.indexOf('[Déclinaisons] :');
       int specsIndex = originalDesc.indexOf('[Spécifications] :');
       int galleryIndex = originalDesc.indexOf('[Galerie] :');
       
       // Sort indices to find the boundary of clean description
       List<int> indices = [declIndex, specsIndex, galleryIndex].where((i) => i != -1).toList();
       indices.sort();
       
       String cleanDesc = originalDesc;
       if (indices.isNotEmpty) {
           cleanDesc = originalDesc.substring(0, indices.first).trim();
       }

       if (declIndex != -1) {
           int end = specsIndex != -1 ? specsIndex : (galleryIndex != -1 ? galleryIndex : originalDesc.length);
           if (declIndex > end) end = galleryIndex != -1 && galleryIndex > declIndex ? galleryIndex : originalDesc.length;
           // Find next tag
           var remainingTags = indices.where((i) => i > declIndex).toList();
           int nextTag = remainingTags.isNotEmpty ? remainingTags.first : originalDesc.length;
           
           String declStr = originalDesc.substring(declIndex + 17, nextTag).trim();
           List<String> decls = declStr.split(', ');
           for (var d in decls) {
               var parts = d.split(' (Stock: ');
               if (parts.length == 2) {
                   String fullTitle = parts[0];
                   int stock = int.tryParse(parts[1].replaceAll(')', '')) ?? 0;
                   List<String> colors = [];
                   
                   // Extraire les couleurs si existantes (ex: M [Couleurs: #FF0000|#00FF00])
                   int colorStart = fullTitle.indexOf(' [Couleurs: ');
                   if (colorStart != -1) {
                        String colorStr = fullTitle.substring(colorStart + 12, fullTitle.length - 1);
                        colors = colorStr.split('|');
                        fullTitle = fullTitle.substring(0, colorStart).trim();
                   }
                   
                   _variants.add({'title': fullTitle, 'stock': stock, 'colors': colors});
               }
           }
       }
       
       if (specsIndex != -1) {
           var remainingTags = indices.where((i) => i > specsIndex).toList();
           int nextTag = remainingTags.isNotEmpty ? remainingTags.first : originalDesc.length;
           String specsStr = originalDesc.substring(specsIndex + 18, nextTag).trim();
           try {
               _specifications = jsonDecode(specsStr);
           } catch (e) {
               debugPrint("Erreur parse specifications: $e");
           }
       }

       if (galleryIndex != -1) {
           var remainingTags = indices.where((i) => i > galleryIndex).toList();
           int nextTag = remainingTags.isNotEmpty ? remainingTags.first : originalDesc.length;
           String gStr = originalDesc.substring(galleryIndex + 11, nextTag).trim();
           if (gStr.isNotEmpty) {
              _parsedGalleryUrls = gStr.split(',');
           }
       }
       
       _cleanDescription = cleanDesc;
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
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leadingWidth: 72, // give more space for the leading widget
        leading: Padding(
          padding: const EdgeInsets.only(left: 16),
          child: IconButton(
            icon: Container(
              padding: const EdgeInsets.all(12), // Augmenté pour un clic facile
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.4),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20),
            ),
            onPressed: () => context.pop(),
          ),
        ),
        actions: [
          IconButton(
            icon: Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.4),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.shopping_bag_rounded, color: Colors.white, size: 20),
                ),
                if (cart.itemCount > 0)
                  Positioned(
                    right: -4,
                    top: -4,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(color: Colors.redAccent, shape: BoxShape.circle),
                      child: Text('${cart.itemCount}', style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                    ),
                  ),
              ],
            ),
            onPressed: () => context.push('/cart'),
          ),
          const SizedBox(width: 12),
        ],
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
                       return Image.network(url, fit: BoxFit.cover);
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
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(widget.product.name, style: TextStyle(color: textColor, fontSize: 24, fontWeight: FontWeight.w900, height: 1.2)),
                      ),
                      const SizedBox(width: 16),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text('${widget.product.price.toStringAsFixed(0)} FCFA', style: const TextStyle(color: Color(0xFF00E5C5), fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
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
                  
                  // Meta Info (Origin)
                  Row(
                    children: [
                      Expanded(
                        child: _buildMetaCard(Icons.flight_takeoff_rounded, 'Origine', widget.product.origin, const Color(0xFFFF9800), isDark),
                      ),
                      const SizedBox(width: 16),
                      if (_specifications['État'] != null)
                         Expanded(
                           child: _buildMetaCard(Icons.verified_rounded, 'État', _specifications['État'].toString(), const Color(0xFF6C4EF6), isDark),
                         ),
                    ],
                  ),

                  const SizedBox(height: 24),
                  
                  // Dynamic Options (Déclinaisons)
                  if (_variants.isNotEmpty) ...[
                    Text('Déclinaisons / Modèles', style: TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 12),
                    SingleChildScrollView(
                       scrollDirection: Axis.horizontal,
                       child: Row(
                         children: _variants.asMap().entries.map((e) => _buildVariantOption(e.key, e.value['title'], isDark)).toList(),
                       ),
                    ),
                    const SizedBox(height: 24),
                  ],
                  
                  // Dynamic Options (Couleurs par Variante)
                  if (_variants.isNotEmpty && _variants[_selectedVariant]['colors'] != null && (_variants[_selectedVariant]['colors'] as List).isNotEmpty) ...[
                    Text('Couleurs disponibles pour ce modèle', style: TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 12),
                    Row(
                      children: (_variants[_selectedVariant]['colors'] as List).asMap().entries.map((e) {
                         try {
                            String cString = e.value.toString().replaceFirst('#', '0xFF');
                            int cVal = int.parse(cString);
                            return _buildColorOption(e.key, Color(cVal));
                         } catch (err) {
                            return const SizedBox();
                         }
                      }).toList(),
                    ),
                    const SizedBox(height: 24),
                  ] else if (_specifications['Couleurs'] != null && _specifications['Couleurs'] is List) ...[
                    Text('Couleurs', style: TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 12),
                    Row(
                      children: (_specifications['Couleurs'] as List).asMap().entries.map((e) {
                         try {
                            String cString = e.value.toString().replaceFirst('#', '0xFF');
                            int cVal = int.parse(cString);
                            return _buildColorOption(e.key, Color(cVal));
                         } catch (err) {
                            return const SizedBox();
                         }
                      }).toList(),
                    ),
                    const SizedBox(height: 24),
                  ],

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
                                  Row(
                                    children: [
                                      const Icon(Icons.account_balance_wallet_rounded, color: AppColors.violet, size: 20),
                                      const SizedBox(width: 8),
                                      Text('Disponible à tempérament (Prêt)', style: TextStyle(color: textColor, fontWeight: FontWeight.w900, fontSize: 13)),
                                    ],
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
                             ],
                          ],
                       ),
                     ),
                     const SizedBox(height: 24),
                  ],

                  if (_specifications['Autres informations'] != null && _specifications['Autres informations'].toString().trim().isNotEmpty) ...[
                     Text('Spécifications Techniques', style: TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.w800)),
                     const SizedBox(height: 8),
                     Text(_specifications['Autres informations'].toString(), style: TextStyle(color: hintColor, fontSize: 14, height: 1.5)),
                     const SizedBox(height: 24),
                  ],

                  Text('Description', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.w800)),
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
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(12),
                                    child: Image.network(p.imageUrl, width: 70, height: 70, fit: BoxFit.cover),
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
        child: ElevatedButton.icon(
          onPressed: outOfStock ? null : () {
            cart.addItem(widget.product);
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${widget.product.name} ajouté au panier', style: const TextStyle(fontWeight: FontWeight.bold)), backgroundColor: AppColors.violet, behavior: SnackBarBehavior.floating));
          },
          icon: const Icon(Icons.add_shopping_cart_rounded, color: Colors.white),
          label: Text(outOfStock ? 'Indisponible' : 'Ajouter au Panier', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16)),
          style: ElevatedButton.styleFrom(
            minimumSize: const Size(double.infinity, 60),
            backgroundColor: const Color(0xFF6C4EF6),
            disabledBackgroundColor: Colors.grey,
            elevation: 10,
            shadowColor: const Color(0xFF6C4EF6).withValues(alpha: 0.3),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          ),
        ),
      ),
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
          label,
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
          border: Border.all(color: isSelected ? const Color(0xFF6C4EF6) : Colors.transparent, width: 3),
          boxShadow: [
            if (isSelected) BoxShadow(color: const Color(0xFF6C4EF6).withValues(alpha: 0.4), blurRadius: 10)
          ],
        ),
      ),
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
}

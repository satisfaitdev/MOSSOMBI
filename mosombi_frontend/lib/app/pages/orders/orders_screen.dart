import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:mosombi_frontend/core/network/api_client.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  final ApiClient _apiClient = ApiClient();
  List<Map<String, dynamic>> _realOrders = [];
  bool _isLoading = true;

  String _extractImageUrl(dynamic rawImage) {
    if (rawImage == null) return '';
    if (rawImage is Map) {
      return rawImage['url']?.toString() ?? '';
    }
    String str = rawImage.toString().trim();
    if (str.startsWith('"') && str.endsWith('"')) {
      str = str.substring(1, str.length - 1).trim();
    }
    if (str.startsWith("'") && str.endsWith("'")) {
      str = str.substring(1, str.length - 1).trim();
    }
    if (str.contains('url:') || str.contains('"url"')) {
      final RegExp reg = RegExp(r'url:\s*([^\s,}\"]+)|"url"\s*:\s*"([^"]+)"');
      final match = reg.firstMatch(str);
      if (match != null) {
        final extracted = (match.group(1) ?? match.group(2) ?? '').trim();
        if (extracted.isNotEmpty) return extracted;
      }
    }
    return str;
  }

  @override
  void initState() {
    super.initState();
    _fetchRealOrders();
  }

  Future<void> _fetchRealOrders() async {
    try {
      final response = await _apiClient.dio.get('/store-enhanced/my-orders');
      if (response.statusCode == 200 && response.data['success'] == true) {
        final List<dynamic> items = response.data['data'] as List;
        
        // Trier les éléments par 'created_at' pour grouper chronologiquement de façon robuste
        final List<Map<String, dynamic>> sortedItems = List<Map<String, dynamic>>.from(items);
        sortedItems.sort((a, b) {
          final DateTime da = DateTime.tryParse(a['created_at']?.toString() ?? '') ?? DateTime.now();
          final DateTime db = DateTime.tryParse(b['created_at']?.toString() ?? '') ?? DateTime.now();
          return da.compareTo(db);
        });

        // Grouper les ventes qui ont été créées dans la même fenêtre de 5 secondes (même session de checkout)
        final List<List<Map<String, dynamic>>> groupedOrdersList = [];
        for (var item in sortedItems) {
          final DateTime itemTime = DateTime.tryParse(item['created_at']?.toString() ?? '') ?? DateTime.now();
          
          List<Map<String, dynamic>>? targetGroup;
          for (var group in groupedOrdersList) {
            final DateTime groupTime = DateTime.tryParse(group.first['created_at']?.toString() ?? '') ?? DateTime.now();
            if (itemTime.difference(groupTime).inSeconds.abs() <= 5) {
              targetGroup = group;
              break;
            }
          }
          
          if (targetGroup != null) {
            targetGroup.add(item);
          } else {
            groupedOrdersList.add([item]);
          }
        }

        final List<Map<String, dynamic>> mapped = [];
        
        // Parcourir chaque groupe de commande (fenêtre chronologique de 5 secondes)
        for (var groupSales in groupedOrdersList) {
          final String createdAt = groupSales.first['created_at'] as String;
          double totalAmount = 0;
          final List<Map<String, dynamic>> subItemsList = [];
          
          // Regrouper les articles identiques de cette commande par nom de produit
          final Map<String, Map<String, dynamic>> subItemsGrouped = {};
          
          for (var sale in groupSales) {
            final meta = sale['metadata'] as Map<String, dynamic>? ?? {};
            final artMeta = meta['article_metadata'] as Map<String, dynamic>? ?? {};
            final double amount = double.tryParse(sale['amount']?.toString() ?? '0') ?? 0;
            final int qty = int.tryParse(meta['quantity']?.toString() ?? '1') ?? 1;
            final double unitPrice = double.tryParse(meta['unit_price']?.toString() ?? '0') ?? 0;
            final String saleId = sale['id'] as String;
            final String name = meta['article_name']?.toString() ?? 'Article';
            
            final String rawImg = meta['article_image']?.toString() ?? 
                (artMeta['media']?['images'] as List?)?.first?.toString() ?? 
                '';
            final String imageUrl = _extractImageUrl(rawImg);
                
            final String variant = artMeta['selected_variant']?.toString() ?? '';
            final String color = artMeta['selected_color']?.toString() ?? '';
            final String deliveryMethod = meta['delivery_method']?.toString() ?? 'local_standard';
            final String deliveryType = deliveryMethod.contains('intl') ? 'international' : 'local';
            
            final String variantDesc = variant.isNotEmpty 
                ? '$variant${color.isNotEmpty ? " - $color" : ""}'
                : (color.isNotEmpty ? 'Couleur: $color' : '');

            totalAmount += amount;

            if (subItemsGrouped.containsKey(name)) {
              final existing = subItemsGrouped[name]!;
              existing['quantity'] = (existing['quantity'] as int) + qty;
              existing['totalPriceRaw'] = (existing['totalPriceRaw'] as double) + (unitPrice * qty);
              
              final List<String> variantsList = existing['variantsList'] as List<String>;
              if (variantDesc.isNotEmpty && !variantsList.contains(variantDesc)) {
                variantsList.add(variantDesc);
              }
            } else {
              subItemsGrouped[name] = {
                'saleId': saleId,
                'name': name,
                'imageUrl': imageUrl,
                'variantsList': variantDesc.isNotEmpty ? [variantDesc] : <String>[],
                'totalPriceRaw': unitPrice * qty,
                'quantity': qty,
                'deliveryType': deliveryType,
                'status': meta['delivery_status']?.toString() ?? 'pending',
              };
            }
          }

          // Convertir le dictionnaire groupé en liste finale de sous-articles
          subItemsGrouped.forEach((name, item) {
            final List<String> vList = item['variantsList'] as List<String>;
            String finalVariantText = '';
            if (vList.length > 1) {
              finalVariantText = 'Détails (${vList.length} variantes)';
            } else if (vList.length == 1) {
              finalVariantText = vList.first;
            }

            final double priceRaw = item['totalPriceRaw'] as double;
            final String itemPriceFormatted = '${priceRaw.toInt().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]} ')} FCFA';

            subItemsList.add({
              'saleId': item['saleId'],
              'name': item['name'],
              'imageUrl': item['imageUrl'],
              'variant': finalVariantText,
              'price': itemPriceFormatted,
              'quantity': item['quantity'],
              'deliveryType': item['deliveryType'],
              'status': item['status'],
            });
          });

          // Prendre les métadonnées de la première vente du groupe pour l'affichage principal
          final primarySale = groupSales.first;
          final String primaryId = primarySale['id'] as String;
          final primaryMeta = primarySale['metadata'] as Map<String, dynamic>? ?? {};
          final String primaryTitle = primaryMeta['article_name']?.toString() ?? 'Commande Marketplace';
          final String deliveryMethod = primaryMeta['delivery_method']?.toString() ?? 'local_standard';
          
          // Vérifier si toutes les ventes du groupe sont livrées
          bool allDelivered = true;
          for (var sale in groupSales) {
            final meta = sale['metadata'] as Map<String, dynamic>? ?? {};
            if (meta['delivery_status']?.toString() != 'delivered') {
              allDelivered = false;
              break;
            }
          }

          // Titre avec indicateur d'articles additionnels
          String displayTitle = primaryTitle;
          if (groupSales.length > 1) {
            displayTitle = '$primaryTitle (+${groupSales.length - 1})';
          }

          // Formatter le prix cumulé
          final String priceStr = '${totalAmount.toInt().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]} ')} FCFA';

          // Formatter la date de façon robuste et native
          String dateStr = 'Date inconnue';
          try {
            final date = DateTime.parse(createdAt);
            final months = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
            dateStr = '${date.day.toString().padLeft(2, '0')} ${months[date.month - 1]}, ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
          } catch (_) {
            if (createdAt.length >= 10) {
              dateStr = createdAt.substring(0, 10);
            }
          }

          // Icône, couleur et statut du suivi
          IconData icon = Icons.shopping_bag_rounded;
          Color color = const Color(0xFF6C4EF6);
          String status = 'En cours';
          
          if (allDelivered) {
            status = 'Livré';
          } else if (deliveryMethod.contains('intl')) {
            status = 'Expédié';
          }

          if (deliveryMethod.contains('pickup')) {
            icon = Icons.storefront_rounded;
            color = const Color(0xFFFF9800);
          } else if (deliveryMethod.contains('intl')) {
            icon = Icons.local_shipping_rounded;
            color = const Color(0xFF00E5C5);
          } else {
            icon = Icons.shopping_bag_rounded;
            color = const Color(0xFF6C4EF6);
          }

          final String deliveryType = deliveryMethod.contains('intl') ? 'international' : 'local';

          mapped.add({
            'title': displayTitle,
            'type': 'Marketplace',
            'date': dateStr,
            'price': priceStr,
            'status': status,
            'icon': icon,
            'color': color,
            'deliveryType': deliveryType,
            'orderId': primaryId,
            'subItems': subItemsList,
          });
        }

        setState(() {
          _realOrders = mapped;
          _isLoading = false;
        });
      } else {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching real orders: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _showOrderDetailSheet(Map<String, dynamic> order, bool isDark, Color textColor) {
    final subItems = order['subItems'] as List;
    final hintColor = isDark ? Colors.white70 : AppColors.textSecondaryLight;
    
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return Container(
          decoration: BoxDecoration(
            color: isDark ? AppColors.bgDark1 : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            boxShadow: const [BoxShadow(color: Colors.black38, blurRadius: 25)],
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Détails de Commande', style: TextStyle(color: textColor, fontWeight: FontWeight.w900, fontSize: 18)),
                        const SizedBox(height: 4),
                        Text(order['date'], style: const TextStyle(color: Colors.grey, fontSize: 12)),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(order['price'], style: TextStyle(color: textColor, fontWeight: FontWeight.w900, fontSize: 16)),
                      Text('${subItems.length} article(s)', style: TextStyle(color: hintColor, fontSize: 11)),
                    ],
                  ),
                ],
              ),
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Divider(),
              ),
              Flexible(
                child: ConstrainedBox(
                  constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.45),
                  child: ListView.builder(
                    shrinkWrap: true,
                    physics: const BouncingScrollPhysics(),
                    itemCount: subItems.length,
                    itemBuilder: (context, idx) {
                      final item = subItems[idx];
                      final isIntl = item['deliveryType'] == 'international';
                      final String cleanImg = _extractImageUrl(item['imageUrl'].toString());
                      final String imgUrl = cleanImg.isNotEmpty
                          ? cleanImg
                          : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800';

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: isDark ? Colors.white.withValues(alpha: 0.03) : Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 55,
                              height: 55,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(12),
                                image: DecorationImage(
                                  image: NetworkImage(imgUrl),
                                  fit: BoxFit.cover,
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item['name'],
                                    style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 13),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  if (item['variant']?.toString().isNotEmpty ?? false) ...[
                                    const SizedBox(height: 3),
                                    Text(item['variant'], style: TextStyle(color: hintColor, fontSize: 10)),
                                  ],
                                  const SizedBox(height: 6),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        '${item['price']} (x${item['quantity']})',
                                        style: TextStyle(color: AppColors.violet, fontWeight: FontWeight.w800, fontSize: 11),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: isIntl 
                                            ? Colors.teal.withValues(alpha: 0.15) 
                                            : Colors.blue.withValues(alpha: 0.15),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Text(
                                          isIntl ? '✈️ Import' : '🛵 Local',
                                          style: TextStyle(
                                            color: isIntl ? Colors.teal : Colors.blue,
                                            fontSize: 8,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ),
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 8),
                child: Divider(),
              ),
              Builder(
                builder: (context) {
                  final bool hasLocal = subItems.any((item) => item['deliveryType'] == 'local');
                  final bool hasIntl = subItems.any((item) => item['deliveryType'] == 'international');

                  if (hasLocal && hasIntl) {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () {
                                  Navigator.pop(context);
                                  context.push(
                                    '/orders/tracking',
                                    extra: {
                                      'orderId': order['orderId'],
                                      'deliveryType': 'local',
                                    },
                                  );
                                },
                                icon: const Icon(Icons.delivery_dining_rounded, size: 16, color: Colors.blue),
                                label: const Text('Suivi local', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.blue)),
                                style: OutlinedButton.styleFrom(
                                  side: const BorderSide(color: Colors.blue, width: 1.5),
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () {
                                  Navigator.pop(context);
                                  context.push(
                                    '/orders/tracking',
                                    extra: {
                                      'orderId': order['orderId'],
                                      'deliveryType': 'international',
                                    },
                                  );
                                },
                                icon: const Icon(Icons.flight_takeoff_rounded, size: 16, color: Colors.teal),
                                label: const Text('Suivi étranger', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.teal)),
                                style: OutlinedButton.styleFrom(
                                  side: const BorderSide(color: Colors.teal, width: 1.5),
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: () => _reorderEntireOrder(subItems),
                            icon: const Icon(Icons.refresh_rounded, size: 16, color: Colors.white),
                            label: const Text('Tout recommander', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.violet,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                          ),
                        ),
                      ],
                    );
                  }

                  return Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            Navigator.pop(context);
                            final String unifiedDeliveryType = hasIntl ? 'international' : 'local';
                            context.push(
                              '/orders/tracking',
                              extra: {
                                'orderId': order['orderId'],
                                'deliveryType': unifiedDeliveryType,
                              },
                            );
                          },
                          icon: Icon(hasIntl ? Icons.flight_takeoff_rounded : Icons.delivery_dining_rounded, size: 16),
                          label: Text(hasIntl ? 'Suivi étranger' : 'Suivi de la livraison', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.violet,
                            side: const BorderSide(color: AppColors.violet, width: 1.5),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () => _reorderEntireOrder(subItems),
                          icon: const Icon(Icons.refresh_rounded, size: 16, color: Colors.white),
                          label: const Text('Tout recommander', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.violet,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                    ],
                  );
                },
              ),
              const SizedBox(height: 12),
            ],
          ),
        );
      },
    );
  }

  void _reorderEntireOrder(List<dynamic> items) {
    Navigator.pop(context);
    final String displayMessage = items.length == 1
        ? 'L\'article "${items.first['name']}" a été ajouté à votre panier !'
        : '${items.length} articles ont été ajoutés à votre panier !';

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle_rounded, color: Colors.white),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                displayMessage,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white),
              ),
            ),
          ],
        ),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    );
  }

  Widget _buildItemThumbnails(List<dynamic> subItems) {
    final Set<String> uniqueUrls = {};
    for (var e in subItems) {
      final String url = e['imageUrl']?.toString() ?? '';
      if (url.isNotEmpty) {
        uniqueUrls.add(url);
      }
    }
    final urls = uniqueUrls.take(3).toList();

    if (urls.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.only(top: 8),
      height: 28,
      width: 100,
      child: Stack(
        children: List.generate(urls.length, (idx) {
          return Positioned(
            left: idx * 18.0,
            child: Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2),
                image: DecorationImage(
                  image: NetworkImage(urls[idx]),
                  fit: BoxFit.cover,
                ),
                boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4)],
              ),
            ),
          );
        }),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    
    final List<Map<String, dynamic>> orders = _realOrders;

    return SafeArea(
      bottom: false,
      child: RefreshIndicator(
        onRefresh: _fetchRealOrders,
        color: AppColors.violet,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
          slivers: [
            MossombiHeaderType1(
              title: 'Vos Commandes',
              isLoading: _isLoading,
              actions: [
                if (!_isLoading && _realOrders.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.violet.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          'En direct',
                          style: TextStyle(color: AppColors.violet, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ),
                if (!_isLoading)
                  IconButton(
                    icon: Icon(Icons.refresh_rounded, color: textColor),
                    onPressed: _fetchRealOrders,
                  ),
              ],
            ),
            if (_isLoading)
              const SliverFillRemaining(
                hasScrollBody: false,
                child: Center(
                  child: CircularProgressIndicator(color: AppColors.violet),
                ),
              )
            else if (orders.isEmpty)
              SliverFillRemaining(
                hasScrollBody: false,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 48),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: AppColors.violet.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.receipt_long_rounded,
                          size: 64,
                          color: AppColors.violet,
                        ),
                      ).animate().scale(delay: 200.ms, duration: 400.ms, curve: Curves.easeOutBack),
                      const SizedBox(height: 24),
                      Text(
                        'Aucune commande',
                        style: TextStyle(
                          color: textColor,
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        "Vous n'avez pas encore de commandes ou de trajets.\nVos suivis et historiques apparaîtront ici.",
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: Colors.grey,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 32),
                      ElevatedButton.icon(
                        onPressed: () {
                          context.go('/home');
                        },
                        icon: const Icon(Icons.home_rounded, color: Colors.white),
                        label: const Text(
                          "Retourner à l'accueil",
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.violet,
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final order = orders[index];
                      final isPending = order['status'] == 'En cours' || order['status'] == 'Expédié';
                      final subItems = order['subItems'] as List? ?? [];
                      
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: GestureDetector(
                          onTap: () => _showOrderDetailSheet(order, isDark, textColor),
                          child: GlassContainer(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                Container(
                                  width: 54,
                                  height: 54,
                                  decoration: BoxDecoration(
                                    color: order['color'].withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  child: Icon(order['icon'], color: order['color'], size: 28),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        order['title'], 
                                        style: TextStyle(
                                          color: textColor,
                                          fontSize: 16,
                                          fontWeight: FontWeight.w800,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 4),
                                      Row(
                                        children: [
                                          Text(order['type'], style: TextStyle(color: order['color'], fontWeight: FontWeight.bold, fontSize: 12)),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Text(
                                              '•  ${order['date']}', 
                                              style: const TextStyle(color: Colors.grey, fontSize: 12),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                        ],
                                      ),
                                      // Overlapping Avatar pile
                                      if (subItems.isNotEmpty) 
                                        _buildItemThumbnails(subItems),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text(order['price'], style: TextStyle(
                                      color: textColor,
                                      fontSize: 13,
                                      fontWeight: FontWeight.w900,
                                    )),
                                    const SizedBox(height: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: isPending ? AppColors.violet.withValues(alpha: 0.15) : Colors.green.withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(order['status'], style: TextStyle(
                                        color: isPending ? AppColors.violet : Colors.green,
                                        fontSize: 10,
                                        fontWeight: FontWeight.w800,
                                      )),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ).animate(delay: (100 * index).ms).fade().slideX(begin: 0.1, end: 0, curve: Curves.easeOut),
                      );
                    },
                    childCount: orders.length,
                  ),
                ),
              ),
            const SliverToBoxAdapter(child: SizedBox(height: 120)), // Space for NavBar
          ],
        ),
      ),
    );
  }
}

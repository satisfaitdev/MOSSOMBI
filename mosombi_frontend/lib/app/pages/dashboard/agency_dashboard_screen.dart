import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:mosombi_frontend/core/providers/product_provider.dart';
import 'package:mosombi_frontend/core/providers/agency_provider.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/theme/app_gradients.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:mosombi_frontend/core/widgets/agent_wallet_card.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mosombi_frontend/core/providers/auth_provider.dart';
import 'package:mosombi_frontend/core/models/product_model.dart';
import 'package:mosombi_frontend/app/pages/agency/add_product_screen.dart';

class AgencyDashboardScreen extends ConsumerStatefulWidget {
  const AgencyDashboardScreen({super.key});

  @override
  ConsumerState<AgencyDashboardScreen> createState() => _AgencyDashboardScreenState();
}

class _AgencyDashboardScreenState extends ConsumerState<AgencyDashboardScreen> {
  String _selectedService = 'Boutique';
  String _searchQuery = '';
  String _statusFilter = 'Tous'; // Tous, En stock, Rupture // Boutique, Billetterie, Voyages


  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AgencyProvider>();
    final agency = provider.currentAgency;
    final agent = provider.currentAgent;
    final authState = ref.watch(authProvider);
    final currentUser = authState.user;
    
    final allProducts = context.watch<ProductProvider>().products;
    final myProducts = agency != null ? allProducts.where((p) => p.agencyId == agency.id).toList() : [];

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white.withValues(alpha: 0.5) : AppColors.textSecondaryLight;

    if (agency == null) {
      return const Scaffold(body: Center(child: Text("Aucune agence sélectionnée.")));
    }

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: AnimatedGradientBg(
        isDark: isDark,
        child: RefreshIndicator(
          color: AppColors.violet,
          onRefresh: () async {
            await Future.wait([
              context.read<AgencyProvider>().checkMyAgencyContext(),
              context.read<AgencyProvider>().fetchSales(),
              context.read<AgencyProvider>().fetchStaff(),
              context.read<ProductProvider>().fetchProducts(),
            ]);
          },
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
            slivers: [
            MossombiSliverAppBar(
              title: 'Gestion de l\'Agence',
              actionIcon: const Icon(Icons.settings_rounded, color: Color(0xFF6C4EF6), size: 20),
              onActionTap: () {
                context.push('/agency-settings');
              },
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
            // Status and Code Banner
            GlassContainer(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                   Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Expanded(
                          child: Row(
                            children: [
                              Container(
                                 padding: const EdgeInsets.all(12),
                                 decoration: BoxDecoration(
                                    color: AppColors.violet.withValues(alpha: 0.2),
                                    shape: BoxShape.circle,
                                 ),
                                 child: const Icon(Icons.business_center_rounded, color: AppColors.violet, size: 28),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                 child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                       Text(agency.name, style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.w900)),
                                       const SizedBox(height: 4),
                                       Text('Créée le ${agency.createdAt.day}/${agency.createdAt.month}/${agency.createdAt.year}', style: TextStyle(color: hintColor, fontSize: 12)),
                                    ],
                                 ),
                              ),
                            ],
                          ),
                        ),
                        // Badge à l'extrême droite avec bouton copier
                        GestureDetector(
                           onTap: () {
                              final code = (agency.affiliationCode != '------' ? agency.affiliationCode : (currentUser?.userIdDisplay ?? '')).replaceAll(RegExp(r'[^0-9]'), '');
                              Clipboard.setData(ClipboardData(text: code));
                              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Code agence copié !'), duration: Duration(seconds: 2)));
                           },
                           child: Container(
                             padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                             decoration: BoxDecoration(
                               color: AppColors.violet.withValues(alpha: 0.1),
                               borderRadius: BorderRadius.circular(8),
                               border: Border.all(color: AppColors.violet.withValues(alpha: 0.2)),
                             ),
                             child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text((agency.affiliationCode != '------' ? agency.affiliationCode : (currentUser?.userIdDisplay ?? '')).replaceAll(RegExp(r'[^0-9]'), ''), style: const TextStyle(color: AppColors.violet, fontSize: 14, fontWeight: FontWeight.w900, fontFamily: 'Courier')),
                                  const SizedBox(width: 8),
                                  const Icon(Icons.copy_rounded, size: 14, color: AppColors.violet),
                                ],
                             ),
                           ),
                        )
                      ],
                   ),
                   const SizedBox(height: 24),
                   if (agent != null)
                     // Reusing the AgentWalletCard but explicitly as HOST/MANAGER
                     GestureDetector(
                       onTap: () {
                         context.push('/agency-transactions');
                       },
                       child: AgentWalletCard(
                         agent: agent, 
                         isDark: isDark, 
                         isHost: true,
                       ),
                     ),
                ],
              ),
            ).animate().fade().slideY(begin: 0.2, end: 0),
            
            const SizedBox(height: 16),
            
            // Quick Action Buttons for Agency
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildQuickActionButton(Icons.groups_rounded, 'Équipes', isDark, textColor, () => context.push('/agency-team')),
                _buildQuickActionButton(Icons.person_add_alt_1_rounded, 'Inviter Agent', isDark, textColor, () {
                  final code = (agency.affiliationCode != '------' ? agency.affiliationCode : (currentUser?.userIdDisplay ?? '')).replaceAll(RegExp(r'[^0-9]'), '');
                  _showInviteModal(context, false, code);
                }),
                _buildQuickActionButton(Icons.share_rounded, 'Inviter Host', isDark, textColor, () {
                  final code = (agency.affiliationCode != '------' ? agency.affiliationCode : (currentUser?.userIdDisplay ?? '')).replaceAll(RegExp(r'[^0-9]'), '');
                  _showInviteModal(context, true, code);
                }),
              ],
            ).animate(delay: 150.ms).fade().slideY(begin: 0.2, end: 0),

            const SizedBox(height: 32),

            const SizedBox(height: 32),
            Text('Performances', style: TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.w900)).animate(delay: 200.ms).fade(),
            const SizedBox(height: 12),
            
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white.withValues(alpha: 0.05) : const Color(0xFF6C4EF6).withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFF6C4EF6).withValues(alpha: 0.2)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                           children: [
                              Icon(Icons.groups_rounded, color: Color(0xFF6C4EF6), size: 20),
                              SizedBox(width: 8),
                              Text('Équipe', style: TextStyle(color: Color(0xFF6C4EF6), fontSize: 12, fontWeight: FontWeight.bold)),
                           ],
                        ),
                        const SizedBox(height: 8),
                        Text('${agency.activeAgents}', style: TextStyle(color: textColor, fontWeight: FontWeight.w900, fontSize: 20)),
                      ],
                    ),
                  ).animate(delay: 300.ms).scale(),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white.withValues(alpha: 0.05) : const Color(0xFF00E5C5).withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFF00E5C5).withValues(alpha: 0.2)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                           children: [
                              Icon(_selectedService == 'Boutique' ? Icons.inventory_2_rounded 
                                   : _selectedService == 'Transport Taxi' ? Icons.local_taxi_rounded 
                                   : Icons.check_circle_rounded, color: const Color(0xFF00E5C5), size: 20),
                              const SizedBox(width: 8),
                              Text(_selectedService == 'Boutique' ? 'Articles' : _selectedService == 'Transport Taxi' ? 'Courses' : 'Éléments', style: const TextStyle(color: Color(0xFF00E5C5), fontSize: 12, fontWeight: FontWeight.bold)),
                           ],
                        ),
                        const SizedBox(height: 8),
                        Text(_selectedService == 'Boutique' ? '${myProducts.length}' : '0', style: TextStyle(color: textColor, fontWeight: FontWeight.w900, fontSize: 20)),
                      ],
                    ),
                  ).animate(delay: 400.ms).scale(),
                ),
              ],
            ),

            const SizedBox(height: 32),
            Text('Services Opérationnels', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.w900)).animate(delay: 450.ms).fade(),
            const SizedBox(height: 16),
            // Tabs
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              child: Row(
                children: [
                   _buildTab('Boutique', Icons.storefront_rounded, isDark),
                   const SizedBox(width: 12),
                   _buildTab('Billetterie', Icons.local_activity_rounded, isDark),
                   const SizedBox(width: 12),
                   _buildTab('Voyages', Icons.flight_takeoff_rounded, isDark),
                   const SizedBox(width: 12),
                   _buildTab('Transport Taxi', Icons.local_taxi_rounded, isDark),
                   const SizedBox(width: 12),
                   _buildTab('Restaurant', Icons.restaurant_rounded, isDark),
                ],
              ),
            ).animate(delay: 500.ms).fade().slideX(begin: 0.2, end: 0),
            
            const SizedBox(height: 32),

            if (_selectedService == 'Boutique') ...[
               // Recherche & Filtres
               Row(
                 mainAxisAlignment: MainAxisAlignment.spaceBetween,
                 children: [
                    Text('Mes Articles Publiés', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.w900)),
                    Text('${myProducts.length} Total', style: TextStyle(color: const Color(0xFF00E5C5), fontSize: 13, fontWeight: FontWeight.bold)),
                 ],
               ).animate(delay: 550.ms).fade(),
               const SizedBox(height: 12),
               
               // Barre de recherche
               TextField(
                 onChanged: (val) => setState(() => _searchQuery = val),
                 style: TextStyle(color: textColor, fontSize: 14),
                 decoration: InputDecoration(
                   hintText: 'Rechercher un produit...',
                   hintStyle: TextStyle(color: hintColor),
                   prefixIcon: Icon(Icons.search_rounded, color: hintColor, size: 20),
                   filled: true,
                   fillColor: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.shade100,
                   border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                   contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0), // Reduce height
                 ),
               ).animate(delay: 560.ms).fade().slideY(begin: 0.2, end: 0),
               
               const SizedBox(height: 8),
               // Filtres Rapides (Chips)
               SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                     children: ['Tous', 'En stock', 'Rupture'].map((status) {
                        bool isSelected = _statusFilter == status;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8.0),
                          child: FilterChip(
                            label: Text(status, style: TextStyle(fontSize: 12, color: isSelected ? Colors.white : textColor)),
                            selectedColor: const Color(0xFF6C4EF6),
                            backgroundColor: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.shade100,
                            selected: isSelected,
                            onSelected: (val) => setState(() => _statusFilter = status),
                            showCheckmark: false,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide.none),
                          ),
                        );
                     }).toList(),
                  ),
               ).animate(delay: 570.ms).fade(),
               const SizedBox(height: 16),

               Builder(
                 builder: (context) {
                   var filteredProducts = myProducts.where((p) {
                      bool matchSearch = p.name.toLowerCase().contains(_searchQuery.toLowerCase()) || p.description.toLowerCase().contains(_searchQuery.toLowerCase());
                      bool matchStatus = true;
                      if (_statusFilter == 'En stock') matchStatus = p.stock > 0;
                      if (_statusFilter == 'Rupture') matchStatus = p.stock == 0;
                      return matchSearch && matchStatus;
                   }).toList();

                   return Column(
                     children: [
                       if (filteredProducts.isEmpty)
                         Container(
                           width: double.infinity,
                           padding: const EdgeInsets.symmetric(vertical: 40),
                           decoration: BoxDecoration(
                             color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.03),
                             borderRadius: BorderRadius.circular(16)
                           ),
                           child: Column(
                             children: [
                               Icon(Icons.search_off_rounded, size: 50, color: hintColor),
                               const SizedBox(height: 16),
                               Text('Aucun article trouvé', style: TextStyle(color: hintColor, fontWeight: FontWeight.bold)),
                             ],
                           ),
                         ).animate(delay: 600.ms).fade()
                       else
                         for (final p in filteredProducts)
                           _buildProductListTile(p, isDark, const Color(0xFF6C4EF6), textColor, hintColor),
                     ],
                   );
                 }
               ),
            ] else ...[
               // Placeholders for other services
               Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 60),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.03),
                    borderRadius: BorderRadius.circular(16)
                  ),
                  child: Column(
                    children: [
                      Icon(Icons.construction_rounded, size: 50, color: hintColor),
                      const SizedBox(height: 16),
                      Text('Outils $_selectedService à venir', style: TextStyle(color: hintColor, fontWeight: FontWeight.bold)),
                    ],
                  ),
               ).animate().fade(),
            ],

            const SizedBox(height: 100), // spacing for FAB
          ],
        ),
      ),
      ),
      ],
      ),
      ),
      ),
      floatingActionButton: _buildFab(context),
    );
  }

  Widget? _buildFab(BuildContext context) {
    if (_selectedService == 'Boutique') {
      return FloatingActionButton.extended(
        onPressed: () => context.push('/agency/add-product'),
        backgroundColor: const Color(0xFF6C4EF6),
        icon: const Icon(Icons.add_shopping_cart, color: Colors.white),
        label: const Text('Publier Produit', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ).animate().scale(delay: 600.ms, curve: Curves.easeOutBack);
    }
    return null;
  }

  Widget _buildTab(String title, IconData icon, bool isDark) {
     final bool isSelected = _selectedService == title;
     return GestureDetector(
        onTap: () {
           setState(() {
              _selectedService = title;
           });
        },
        child: AnimatedContainer(
           duration: const Duration(milliseconds: 300),
           padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
           decoration: BoxDecoration(
              color: isSelected ? const Color(0xFF6C4EF6) : Colors.transparent,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: isSelected ? const Color(0xFF6C4EF6) : Colors.grey.withValues(alpha: 0.3)),
           ),
           child: Row(
              children: [
                 Icon(icon, size: 18, color: isSelected ? Colors.white : Colors.grey),
                 const SizedBox(width: 8),
                 Text(
                    title,
                    style: TextStyle(
                       color: isSelected ? Colors.white : Colors.grey,
                       fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                       fontSize: 14,
                    ),
                 ),
              ],
           ),
        ),
     );
  }

  Widget _buildProductListTile(Product product, bool isDark, Color color, Color textColor, Color hintColor) {
    return Container(
       margin: const EdgeInsets.only(bottom: 12),
       child: GlassContainer(
          padding: const EdgeInsets.all(12),
          child: Row(
             children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: product.imageUrl.isNotEmpty 
                     ? Image.network(product.imageUrl, width: 60, height: 60, fit: BoxFit.cover, errorBuilder: (c,e,s) => Container(width: 60, height: 60, color: color.withValues(alpha: 0.2), child: Icon(Icons.broken_image, color: color)))
                     : Container(width: 60, height: 60, color: color.withValues(alpha: 0.2), child: Icon(Icons.shopping_bag, color: color)),
                ),
                const SizedBox(width: 16),
                Expanded(
                   child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                         Text(product.name, style: TextStyle(color: textColor, fontSize: 15, fontWeight: FontWeight.bold), maxLines: 1, overflow: TextOverflow.ellipsis),
                         const SizedBox(height: 4),
                         Text('Stock: ${product.stock}', style: TextStyle(color: hintColor, fontSize: 12)),
                      ],
                   ),
                ),
                Text('${product.price.toStringAsFixed(0)} F', style: TextStyle(color: color, fontSize: 15, fontWeight: FontWeight.w900)),
                const SizedBox(width: 8),
                PopupMenuButton<String>(
                  icon: const Icon(Icons.more_vert_rounded, color: Colors.grey),
                  color: isDark ? AppColors.bgDark1 : Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  onSelected: (value) {
                    if (value == 'edit') {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => AddProductScreen(productToEdit: product)
                        ),
                      );
                    } else if (value == 'delete') {
                      _showDeleteConfirmation(product.id, product.name);
                    } else if (value == 'promote') {
                      _showPromoteModal(product);
                    }
                  },
                  itemBuilder: (context) => [
                    PopupMenuItem(value: 'edit', child: Row(children: [Icon(Icons.edit_rounded, size: 18, color: textColor), const SizedBox(width: 8), Text('Modifier', style: TextStyle(color: textColor))])),
                    PopupMenuItem(value: 'promote', child: Row(children: [Icon(Icons.campaign_rounded, size: 18, color: AppColors.violet), const SizedBox(width: 8), const Text('Promouvoir', style: TextStyle(color: AppColors.violet, fontWeight: FontWeight.bold))])),
                    const PopupMenuDivider(),
                    const PopupMenuItem(value: 'delete', child: Row(children: [Icon(Icons.delete_outline_rounded, size: 18, color: Colors.redAccent), SizedBox(width: 8), Text('Supprimer', style: TextStyle(color: Colors.redAccent))])),
                  ],
                ),
             ],
          ),
       ),
    );
  }

  void _showDeleteConfirmation(String productId, String productName) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Theme.of(context).brightness == Brightness.dark ? AppColors.bgDark1 : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Supprimer l\'article'),
        content: Text('Voulez-vous vraiment supprimer "$productName" ? Cette action est irréversible.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler', style: TextStyle(color: Colors.grey))),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final success = await context.read<ProductProvider>().deleteProduct(productId);
              if (mounted && success) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Article supprimé')));
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            child: const Text('Supprimer', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showPromoteModal(Product product) {
    int days = 3;
    String coverage = 'Espace Marketplace';
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          final isDark = Theme.of(context).brightness == Brightness.dark;
          final textColor = isDark ? Colors.white : Colors.black;
          
          return Container(
            decoration: BoxDecoration(
              color: isDark ? AppColors.bgDark1 : Colors.white,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            ),
            padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, left: 24, right: 24, top: 24),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.withValues(alpha: 0.5), borderRadius: BorderRadius.circular(2)))),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      const Icon(Icons.campaign_rounded, color: AppColors.violet, size: 28),
                      const SizedBox(width: 12),
                      Expanded(child: Text('Promouvoir "${product.name}"', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold))),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text('Augmentez la visibilité de votre produit. La facturation journalière dépend du type de couverture (gérée par l\'admin).', style: TextStyle(color: Colors.grey.shade500, fontSize: 13)),
                  const SizedBox(height: 24),
                  
                  Text('Durée de la promotion (Jours)', style: TextStyle(fontWeight: FontWeight.bold, color: textColor)),
                  Slider(
                    value: days.toDouble(),
                    min: 1,
                    max: 30,
                    divisions: 29,
                    activeColor: AppColors.violet,
                    label: '$days Jours',
                    onChanged: (val) => setModalState(() => days = val.toInt()),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  Text('Type de couverture', style: TextStyle(fontWeight: FontWeight.bold, color: textColor)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: coverage,
                    dropdownColor: isDark ? AppColors.bgDark1 : Colors.white,
                    style: TextStyle(color: textColor),
                    decoration: InputDecoration(
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                    items: ['Espace Marketplace', 'Toutes l\'application', 'Toutes l\'application et hors de l\'app (Sponsorisé)'].map((c) => DropdownMenuItem(value: c, child: Text(c, overflow: TextOverflow.ellipsis, maxLines: 2))).toList(),
                    onChanged: (val) => setModalState(() => coverage = val!),
                  ),
                  
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () async {
                        Navigator.pop(ctx);
                        final success = await context.read<ProductProvider>().promoteProduct(
                          productId: product.id,
                          days: days,
                          coverage: coverage,
                        );
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(success ? 'Promotion sollicitée avec succès !' : 'Erreur lors de la promotion'),
                              backgroundColor: success ? Colors.green : Colors.redAccent,
                            )
                          );
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.violet,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: const Text('Lancer la campagne', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          );
        }
      ),
    );
  }

  Widget _buildAgentListTile(String name, String id, String stats, Color color, Color textColor, Color hintColor) {
    return Container(
       margin: const EdgeInsets.only(bottom: 12),
       child: GlassContainer(
          padding: const EdgeInsets.all(16),
          child: Row(
             children: [
                Container(
                   padding: const EdgeInsets.all(10),
                   decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                   ),
                   child: Icon(Icons.person, color: color, size: 20),
                ),
                const SizedBox(width: 16),
                Expanded(
                   child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                         Text(name, style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 15)),
                         const SizedBox(height: 4),
                         Text(id, style: TextStyle(color: hintColor, fontSize: 12, fontFamily: 'Courier')),
                      ],
                   ),
                ),
                Text(stats, style: TextStyle(color: textColor, fontWeight: FontWeight.w900, fontSize: 13)),
             ],
          ),
       ),
    );
  }

  Widget _buildQuickActionButton(IconData icon, String label, bool isDark, Color textColor, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withValues(alpha: 0.1) : Colors.black.withValues(alpha: 0.05),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: const Color(0xFF6C4EF6), size: 24),
          ),
          const SizedBox(height: 8),
          Text(label, style: TextStyle(color: textColor, fontSize: 11, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  void _showInviteModal(BuildContext context, bool isHost, String affiliationCode) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return Container(
          decoration: BoxDecoration(
            color: isDark ? AppColors.bgDark1 : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.all(24),
          child: SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.withValues(alpha: 0.5), borderRadius: BorderRadius.circular(2))),
                const SizedBox(height: 24),
                Text(isHost ? 'Inviter un Membre Host' : 'Inviter un Agent', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: isDark ? Colors.white : Colors.black)),
                const SizedBox(height: 16),
                Text('Partagez ce code avec votre futur collaborateur. Il pourra l\'entrer lors de son inscription pour rejoindre l\'agence en tant qu\'${isHost ? 'Host' : 'Agent'}.', textAlign: TextAlign.center, style: const TextStyle(color: Colors.grey)),
                const SizedBox(height: 32),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  decoration: BoxDecoration(
                    color: AppColors.violet.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.violet.withValues(alpha: 0.2)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(affiliationCode, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: AppColors.violet, letterSpacing: 2)),
                      const SizedBox(width: 16),
                      GestureDetector(
                        onTap: () {
                          Clipboard.setData(ClipboardData(text: affiliationCode));
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Code copié !')));
                        },
                        child: const Icon(Icons.copy_rounded, color: AppColors.violet),
                      )
                    ],
                  ),
                ),
                const SizedBox(height: 32),
                ElevatedButton.icon(
                  onPressed: () {
                    final role = isHost ? 'host' : 'agent';
                    final link = 'https://app.mossombi.com/join?code=$affiliationCode&role=$role';
                    Clipboard.setData(ClipboardData(text: link));
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Lien d\'invitation automatique copié !')));
                  },
                  icon: const Icon(Icons.share_rounded, color: Colors.white),
                  label: const Text('Partager le lien direct', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.violet,
                    minimumSize: const Size(double.infinity, 54),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        );
      }
    );
  }
}

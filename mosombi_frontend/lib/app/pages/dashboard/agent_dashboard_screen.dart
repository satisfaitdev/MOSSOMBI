import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart' hide Provider, FutureProvider, StreamProvider, ChangeNotifierProvider;
import 'package:mosombi_frontend/core/providers/auth_provider.dart';
import 'package:mosombi_frontend/core/providers/agency_provider.dart';
import 'package:mosombi_frontend/core/providers/product_provider.dart';
import 'package:go_router/go_router.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/theme/app_gradients.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/agent_wallet_card.dart';
import 'package:flutter_animate/flutter_animate.dart';

class AgentDashboardScreen extends ConsumerStatefulWidget {
  const AgentDashboardScreen({super.key});

  @override
  ConsumerState<AgentDashboardScreen> createState() => _AgentDashboardScreenState();
}

class _AgentDashboardScreenState extends ConsumerState<AgentDashboardScreen> {
  String? _selectedService;


  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AgencyProvider>();
    final agent = provider.currentAgent;
    final agency = provider.currentAgency;

    final authState = ref.watch(authProvider);
    final user = authState.user;
    final String agentIdToDisplay = user?.userIdDisplay ?? agent?.id.substring(0, 10).toUpperCase() ?? 'INCONNU';

    final productProvider = context.watch<ProductProvider>();
    final myProducts = productProvider.products.where((p) => p.agencyId == agency?.id).toList();

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white.withValues(alpha: 0.5) : AppColors.textSecondaryLight;

    final Map<String, List<Map<String, dynamic>>> serviceStats = {
      'Boutique': [
        {'icon': Icons.shopping_bag_rounded, 'label': 'Ventes', 'value': '12'},
        {'icon': Icons.inventory_2_rounded, 'label': 'Articles', 'value': '${myProducts.length}'},
      ],
      'Billetterie': [
        {'icon': Icons.confirmation_number_rounded, 'label': 'Tickets Vendus', 'value': '45'},
        {'icon': Icons.event_available_rounded, 'label': 'Événements', 'value': '3'},
      ],
      'Voyages': [
        {'icon': Icons.airplane_ticket_rounded, 'label': 'Réservations', 'value': '8'},
      ],
      'Transport Taxi': [
        {'icon': Icons.local_taxi_rounded, 'label': 'Courses', 'value': '32'},
        {'icon': Icons.star_rounded, 'label': 'Avis', 'value': '4.8'},
      ],
      'Restaurant': [
        {'icon': Icons.restaurant_rounded, 'label': 'Commandes', 'value': '15'},
        {'icon': Icons.delivery_dining_rounded, 'label': 'Livrées', 'value': '14'},
      ],
    };

    final permissions = provider.servicePermissions;
    final Map<String, String> serviceKeysToTitles = {
      'store': 'Boutique',
      'taxi': 'Transport Taxi',
      'tickets': 'Billetterie',
    };
    final Map<String, IconData> serviceIcons = {
      'Boutique': Icons.storefront_rounded,
      'Transport Taxi': Icons.local_taxi_rounded,
      'Billetterie': Icons.local_activity_rounded,
    };

    List<String> allowedServiceTabs = [];
    permissions.forEach((key, value) {
      if (value is List && value.isNotEmpty && serviceKeysToTitles.containsKey(key)) {
        allowedServiceTabs.add(serviceKeysToTitles[key]!);
      }
    });

    if (allowedServiceTabs.isNotEmpty && (_selectedService == null || !allowedServiceTabs.contains(_selectedService))) {
       _selectedService = allowedServiceTabs.first;
    }
    
    final currentStats = serviceStats[_selectedService] ?? [];

    if (agent == null || agency == null) {
      return Scaffold(
        body: AnimatedGradientBg(
          isDark: isDark,
          child: const Center(child: CircularProgressIndicator()),
        ),
      );
    }

    return Scaffold(
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
              title: 'Espace Agent',
              actionIcon: const Icon(Icons.settings_rounded, color: Color(0xFF6C4EF6), size: 20),
              onActionTap: () {
                context.push('/profile');
              },
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Mon Profil Terrain', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.w900)).animate(delay: 100.ms).fade(),
                    const SizedBox(height: 16),
                    
                    GlassContainer(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Statut', style: TextStyle(color: hintColor, fontSize: 14)),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: agent.status.toLowerCase() == 'pending' 
                                      ? Colors.orange.withValues(alpha: 0.2) 
                                      : const Color(0xFF00E5C5).withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(agent.status.toUpperCase(), 
                                  style: TextStyle(
                                    color: agent.status.toLowerCase() == 'pending' 
                                        ? Colors.orange 
                                        : const Color(0xFF00E5C5), 
                                    fontWeight: FontWeight.bold, 
                                    fontSize: 11,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  gradient: AppGradients.primary,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.person, color: Colors.white, size: 20),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(agent.name, style: TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.w900)),
                                    const SizedBox(height: 2),
                                    Text('ID: $agentIdToDisplay', style: TextStyle(color: hintColor, fontSize: 12, fontFamily: 'Courier', fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.03),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppColors.violet.withValues(alpha: 0.1)),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          const Icon(Icons.storefront_rounded, color: AppColors.violet, size: 16),
                                          const SizedBox(width: 8),
                                          Text('Agence de rattachement', style: TextStyle(color: hintColor, fontSize: 11)),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Text(agency.name, style: TextStyle(color: textColor, fontWeight: FontWeight.w800, fontSize: 14)),
                                      const SizedBox(height: 2),
                                      Text('${agency.activeAgents} Agents & Hôtes', style: TextStyle(color: const Color(0xFF00E5C5).withValues(alpha: 0.8), fontSize: 11, fontWeight: FontWeight.bold)),
                                    ],
                                  ),
                                ),
                                Row(
                                  children: [
                                    _buildSmallActionButton(Icons.receipt_long_rounded, 'Trans.', isDark, textColor, () {
                                      context.push('/agency-transactions');
                                    }),
                                    const SizedBox(width: 8),
                                    _buildSmallActionButton(Icons.group_rounded, 'Équipe', isDark, textColor, () {
                                      context.push('/agency-team');
                                    }),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ).animate(delay: 200.ms).fade().slideY(begin: 0.2, end: 0),

                    const SizedBox(height: 32),

                    const SizedBox(height: 32),
                    Text('Services Opérationnels', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.w900)).animate(delay: 450.ms).fade(),
                    const SizedBox(height: 16),
                    
                    if (allowedServiceTabs.isEmpty)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 40),
                        decoration: BoxDecoration(
                          color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.03),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          children: [
                            Icon(Icons.hourglass_empty_rounded, size: 50, color: hintColor),
                            const SizedBox(height: 16),
                            Text('En attente de tâches', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 16)),
                            const SizedBox(height: 4),
                            Text('Votre agence ne vous a assigné aucune tâche pour l\'instant.', style: TextStyle(color: hintColor, fontSize: 12), textAlign: TextAlign.center),
                          ],
                        ),
                      ).animate(delay: 500.ms).fade()
                    else
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        physics: const BouncingScrollPhysics(),
                        child: Row(
                          children: allowedServiceTabs.map((tab) {
                            return Padding(
                              padding: const EdgeInsets.only(right: 12),
                              child: _buildTab(tab, serviceIcons[tab] ?? Icons.widgets_rounded, isDark),
                            );
                          }).toList(),
                        ),
                      ).animate(delay: 500.ms).fade().slideX(begin: 0.2, end: 0),
                      
                    const SizedBox(height: 32),

                    if (allowedServiceTabs.isEmpty) ...[
                       // Nothing else to display when no tasks
                    ] else if (_selectedService == 'Boutique') ...[
                      // Display specific store tasks based on permissions
                      Builder(
                        builder: (context) {
                          final storeTasks = List<String>.from(permissions['store'] ?? []);
                          final isVendeur = storeTasks.contains('Vendeur / Caissier');
                          final isInventory = storeTasks.contains('Gestionnaire de Stock');
                          final isFinance = storeTasks.contains('Finance');
                          
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  if (isVendeur) _buildPermissionBadge('Vendeur', Icons.point_of_sale, isDark),
                                  if (isInventory) _buildPermissionBadge('Inventaire', Icons.inventory, isDark),
                                  if (isFinance) _buildPermissionBadge('Finance', Icons.account_balance_wallet, isDark),
                                ],
                              ),
                              const SizedBox(height: 24),
                              
                              if (isVendeur || isInventory) ...[
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text('Mes Articles Gérés', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.w900)),
                                    Text('${myProducts.length} Articles', style: TextStyle(color: const Color(0xFF00E5C5), fontSize: 14, fontWeight: FontWeight.bold)),
                                  ],
                                ).animate(delay: 550.ms).fade(),
                                const SizedBox(height: 16),
          
                                if (myProducts.isEmpty)
                                  Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.symmetric(vertical: 40),
                                    decoration: BoxDecoration(
                                      color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.03),
                                      borderRadius: BorderRadius.circular(16)
                                    ),
                                    child: Column(
                                      children: [
                                        Icon(Icons.inventory_2_outlined, size: 50, color: hintColor),
                                        const SizedBox(height: 16),
                                        Text('Aucun article pour le moment', style: TextStyle(color: hintColor, fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                  ).animate(delay: 600.ms).fade()
                                else
                                  for (final p in myProducts)
                                    _buildProductListTile(p.name, p.price.toStringAsFixed(0), p.stock.toString(), p.imageUrl, const Color(0xFF6C4EF6), textColor, hintColor),
                              ]
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

                    const SizedBox(height: 100),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
      ),
      floatingActionButton: _buildFab(context, provider),
    );
  }

  Widget? _buildFab(BuildContext context, AgencyProvider provider) {
    if (_selectedService == 'Boutique') {
      final permissions = provider.servicePermissions;
      final storeTasks = List<String>.from(permissions['store'] ?? []);
      final canAddProducts = storeTasks.contains('Gestionnaire de Stock') || storeTasks.contains('Vendeur / Caissier');
      
      if (!canAddProducts) return null;
      
      return FloatingActionButton.extended(
        onPressed: () => context.push('/agency/add-product'),
        backgroundColor: const Color(0xFF6C4EF6),
        icon: const Icon(Icons.add_shopping_cart, color: Colors.white),
        label: const Text('Publier Produit', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ).animate().scale(delay: 600.ms, curve: Curves.easeOutBack);
    }
    return null;
  }

  Widget _buildPermissionBadge(String label, IconData icon, bool isDark) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.violet.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.violet.withValues(alpha: 0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: AppColors.violet),
          const SizedBox(width: 4),
          Text(label, style: const TextStyle(color: AppColors.violet, fontSize: 10, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildSmallActionButton(IconData icon, String label, bool isDark, Color textColor, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withValues(alpha: 0.1) : Colors.black.withValues(alpha: 0.05),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: const Color(0xFF6C4EF6), size: 20),
          ),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(color: textColor, fontSize: 10, fontWeight: FontWeight.bold)),
        ],
      ),
    );
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

  Widget _buildProductListTile(String name, String price, String stock, String imageUrl, Color color, Color textColor, Color hintColor) {
    return Container(
       margin: const EdgeInsets.only(bottom: 12),
       child: GlassContainer(
          padding: const EdgeInsets.all(12),
          child: Row(
             children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: imageUrl.isNotEmpty 
                     ? Image.network(imageUrl, width: 60, height: 60, fit: BoxFit.cover, errorBuilder: (c,e,s) => Container(width: 60, height: 60, color: color.withValues(alpha: 0.2), child: Icon(Icons.broken_image, color: color)))
                     : Container(width: 60, height: 60, color: color.withValues(alpha: 0.2), child: Icon(Icons.shopping_bag, color: color)),
                ),
                const SizedBox(width: 16),
                Expanded(
                   child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                         Text(name, style: TextStyle(color: textColor, fontSize: 15, fontWeight: FontWeight.bold), maxLines: 1, overflow: TextOverflow.ellipsis),
                         const SizedBox(height: 4),
                         Text('Stock: $stock', style: TextStyle(color: hintColor, fontSize: 12)),
                      ],
                   ),
                ),
                Text('$price F', style: TextStyle(color: color, fontSize: 15, fontWeight: FontWeight.w900)),
             ],
          ),
       ),
    );
  }
}

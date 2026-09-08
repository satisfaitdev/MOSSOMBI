import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:mosombi_frontend/core/providers/smart_city_provider.dart';

class SmartCityScreen extends StatefulWidget {
  const SmartCityScreen({super.key});

  @override
  State<SmartCityScreen> createState() => _SmartCityScreenState();
}

class _SmartCityScreenState extends State<SmartCityScreen> {
  final TextEditingController _searchController = TextEditingController();
  String? _selectedType;
  String? _selectedTransaction;

  static const List<Map<String, dynamic>> _categories = [
    {'label': 'Appartements', 'type': 'apartment', 'icon': Icons.apartment, 'color': Color(0xFF6C4EF6)},
    {'label': 'Maisons', 'type': 'house', 'icon': Icons.home_rounded, 'color': Color(0xFFFF6584)},
    {'label': 'Villas', 'type': 'villa', 'icon': Icons.villa_rounded, 'color': Color(0xFF00D4FF)},
    {'label': 'Terrains', 'type': 'land', 'icon': Icons.terrain_rounded, 'color': Color(0xFF4CAF50)},
    {'label': 'Commerciaux', 'type': 'commercial', 'icon': Icons.store_rounded, 'color': Color(0xFFFF9800)},
  ];

  static const List<Map<String, String>> _transactions = [
    {'label': 'Location', 'value': 'rent'},
    {'label': 'Vente', 'value': 'sell'},
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final sp = context.read<SmartCityProvider>();
      sp.initLocation();
      sp.fetchListings();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _search() {
    context.read<SmartCityProvider>().fetchListings(
      city: _searchController.text,
      type: _selectedType,
      transaction: _selectedTransaction,
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white54 : AppColors.textSecondaryLight;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: AnimatedGradientBg(
        isDark: isDark,
        child: Consumer<SmartCityProvider>(
          builder: (context, provider, _) {
            return CustomScrollView(
              physics: const BouncingScrollPhysics(),
              slivers: [
                MossombiHeaderType2(
                  title: 'Smart City',
                  actionIcon: Icon(Icons.add_circle_rounded, color: AppColors.mint),
                  onActionTap: () => context.push('/smart-city/add-listing'),
                ),
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
                  sliver: SliverToBoxAdapter(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        GlassContainer(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                          child: TextField(
                            controller: _searchController,
                            style: TextStyle(color: textColor),
                            decoration: InputDecoration(
                              hintText: 'Rechercher par ville...',
                              hintStyle: TextStyle(color: hintColor),
                              border: InputBorder.none,
                              icon: Icon(Icons.search, color: hintColor),
                              suffixIcon: _searchController.text.isNotEmpty
                                  ? IconButton(
                                      icon: Icon(Icons.clear, color: hintColor),
                                      onPressed: () { _searchController.clear(); _search(); },
                                    )
                                  : null,
                            ),
                            onSubmitted: (_) => _search(),
                          ),
                        ).animate().fade().slideY(begin: -0.1),
                        const SizedBox(height: 16),

                        Row(
                          children: [
                            ..._transactions.map((t) {
                              final selected = _selectedTransaction == t['value'];
                              return Padding(
                                padding: const EdgeInsets.only(right: 8),
                                child: ChoiceChip(
                                  label: Text(t['label']!, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: selected ? Colors.white : textColor)),
                                  selected: selected,
                                  selectedColor: AppColors.violet,
                                  backgroundColor: isDark ? Colors.white.withValues(alpha: 0.1) : Colors.black.withValues(alpha: 0.05),
                                  onSelected: (val) { setState(() { _selectedTransaction = val ? t['value'] : null; }); _search(); },
                                ),
                              );
                            }),
                            if (_selectedType != null)
                              ActionChip(
                                label: Text(_categories.firstWhere((c) => c['type'] == _selectedType)['label'], style: const TextStyle(fontSize: 12, color: Colors.white)),
                                backgroundColor: AppColors.violet.withValues(alpha: 0.8),
                                onPressed: () { setState(() => _selectedType = null); _search(); },
                              ),
                          ],
                        ),
                        const SizedBox(height: 12),

                        SizedBox(
                          height: 90,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            itemCount: _categories.length,
                            separatorBuilder: (_, _) => const SizedBox(width: 12),
                            itemBuilder: (context, i) {
                              final cat = _categories[i];
                              final selected = _selectedType == cat['type'];
                              return GestureDetector(
                                onTap: () { setState(() { _selectedType = selected ? null : cat['type']; }); _search(); },
                                child: AnimatedContainer(
                                  duration: 200.ms,
                                  width: 76,
                                  decoration: BoxDecoration(
                                    color: selected ? cat['color'] : (isDark ? Colors.white.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.04)),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(color: selected ? cat['color'] : Colors.transparent),
                                  ),
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(cat['icon'], color: selected ? Colors.white : cat['color'], size: 28),
                                      const SizedBox(height: 6),
                                      Text(cat['label'], style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: selected ? Colors.white : textColor), textAlign: TextAlign.center, maxLines: 1),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ).animate().fade(),

                        const SizedBox(height: 20),

                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Annonces', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: textColor)),
                            Text('${provider.listings.length} biens', style: TextStyle(color: hintColor, fontSize: 14)),
                          ],
                        ),
                        const SizedBox(height: 12),
                      ],
                    ),
                  ),
                ),

                if (provider.isLoading)
                  const SliverFillRemaining(child: Center(child: CircularProgressIndicator(color: AppColors.violet)))
                else if (provider.listings.isEmpty)
                  SliverFillRemaining(
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.location_city_rounded, size: 64, color: hintColor),
                          const SizedBox(height: 16),
                          Text('Aucune annonce trouvée', style: TextStyle(color: hintColor, fontSize: 16)),
                        ],
                      ),
                    ),
                  )
                else
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, i) {
                          final listing = provider.listings[i];
                          return _ListingCard(listing: listing, isDark: isDark).animate().fade().slideY(begin: 0.1, delay: (i * 50).ms);
                        },
                        childCount: provider.listings.length,
                      ),
                    ),
                  ),

                const SliverPadding(padding: EdgeInsets.only(bottom: 100)),
              ],
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/smart-city/moving'),
        backgroundColor: AppColors.coral,
        icon: const Icon(Icons.local_shipping_rounded, color: Colors.white),
        label: const Text('Déménagement', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }
}

class _ListingCard extends StatelessWidget {
  final Map<String, dynamic> listing;
  final bool isDark;

  const _ListingCard({required this.listing, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final images = (listing['images'] as List?)?.cast<String>() ?? [];
    final imageUrl = images.isNotEmpty ? images.first : '';
    final typeLabels = {'apartment': 'Appartement', 'house': 'Maison', 'villa': 'Villa', 'land': 'Terrain', 'commercial': 'Commercial'};
    final transactionLabels = {'rent': 'Location', 'sell': 'Vente'};

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: GestureDetector(
        onTap: () => context.push('/smart-city/property/${listing['id']}'),
        child: GlassContainer(
          padding: EdgeInsets.zero,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                child: Container(
                  height: 180,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.shade100,
                    image: imageUrl.isNotEmpty ? DecorationImage(image: NetworkImage(imageUrl), fit: BoxFit.cover) : null,
                  ),
                  child: imageUrl.isEmpty
                      ? Center(child: Icon(Icons.image_rounded, size: 48, color: Colors.grey.shade300))
                      : null,
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.violet.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '${typeLabels[listing['type']] ?? listing['type']} \u2022 ${transactionLabels[listing['transaction']] ?? listing['transaction']}',
                            style: const TextStyle(color: AppColors.violet, fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                        ),
                        Text(
                          '${listing['price']} FCFA',
                          style: TextStyle(color: AppColors.mint, fontSize: 18, fontWeight: FontWeight.w900),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(listing['title'] ?? '', style: TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.w800), maxLines: 2),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(Icons.location_on_rounded, size: 16, color: hintColor),
                        const SizedBox(width: 4),
                        Expanded(child: Text(listing['city'] ?? '', style: TextStyle(color: hintColor, fontSize: 13))),
                      ],
                    ),
                    if ((listing['surface'] ?? 0) > 0 || (listing['rooms'] ?? 0) > 0) ...[
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          if ((listing['surface'] ?? 0) > 0) ...[
                            Icon(Icons.square_foot_rounded, size: 14, color: hintColor),
                            const SizedBox(width: 4),
                            Text('${listing['surface']} m²', style: TextStyle(color: hintColor, fontSize: 12)),
                            const SizedBox(width: 16),
                          ],
                          if ((listing['rooms'] ?? 0) > 0) ...[
                            Icon(Icons.bed_rounded, size: 14, color: hintColor),
                            const SizedBox(width: 4),
                            Text('${listing['rooms']} pièces', style: TextStyle(color: hintColor, fontSize: 12)),
                          ],
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ).animate().fade(duration: 300.ms),
      ),
    );
  }

  Color get hintColor => isDark ? Colors.white54 : AppColors.textSecondaryLight;
}

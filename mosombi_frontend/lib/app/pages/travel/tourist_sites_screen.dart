import 'package:latlong2/latlong.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:mosombi_frontend/core/widgets/custom_loader.dart';
import 'package:mosombi_frontend/core/providers/travel_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';

class TouristSitesScreen extends StatefulWidget {
  const TouristSitesScreen({super.key});

  @override
  State<TouristSitesScreen> createState() => _TouristSitesScreenState();
}

class _TouristSitesScreenState extends State<TouristSitesScreen> {
  final _cityCtrl = TextEditingController();
  final MapController _mapCtrl = MapController();
  String? _selectedCategory;
  int _selectedTab = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TravelProvider>().fetchTouristSites();
      context.read<TravelProvider>().fetchTourGuides();
    });
  }

  @override
  void dispose() {
    _cityCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white.withValues(alpha: 0.5) : AppColors.textSecondaryLight;

    return Scaffold(
      extendBodyBehindAppBar: true,
      backgroundColor: Colors.transparent,
      body: AnimatedGradientBg(
        isDark: isDark,
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            MossombiSliverAppBar(title: 'Sites Touristiques'),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: GlassContainer(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      Expanded(
                        child: Container(
                          decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(12)),
                          child: TextField(
                            controller: _cityCtrl, style: TextStyle(color: textColor, fontSize: 14),
                            decoration: InputDecoration(
                              hintText: 'Rechercher par ville', hintStyle: TextStyle(color: hintColor, fontSize: 13),
                              border: InputBorder.none, contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        icon: const Icon(Icons.search_rounded, color: AppColors.violet),
                        onPressed: () => context.read<TravelProvider>().fetchTouristSites(city: _cityCtrl.text),
                      ),
                    ],
                  ),
                ).animate().fade(duration: 500.ms),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 50,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: ['Tout', 'nature', 'culture', 'historique', 'divertissement', 'religieux'].map((c) {
                    final isSelected = (_selectedCategory == null && c == 'Tout') || _selectedCategory == c;
                    return GestureDetector(
                      onTap: () {
                        setState(() => _selectedCategory = c == 'Tout' ? null : c);
                        context.read<TravelProvider>().fetchTouristSites(category: _selectedCategory, city: _cityCtrl.text.isNotEmpty ? _cityCtrl.text : null);
                      },
                      child: Container(
                        margin: const EdgeInsets.only(right: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        decoration: BoxDecoration(
                          color: isSelected ? AppColors.violet : Colors.white.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        alignment: Alignment.center,
                        child: Text(c == 'Tout' ? 'Tout' : c[0].toUpperCase() + c.substring(1),
                          style: TextStyle(color: isSelected ? Colors.white : textColor, fontWeight: FontWeight.bold, fontSize: 13)),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
            Consumer<TravelProvider>(
              builder: (context, tp, _) {
                if (tp.isLoading) {
                  return const SliverToBoxAdapter(child: Padding(padding: EdgeInsets.all(32), child: MosombiLoader()));
                }
                return SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final site = tp.touristSites[index];
                        return GestureDetector(
                          onTap: () {
                            if (site.latitude != null && site.longitude != null) {
                              _mapCtrl.move(LatLng(site.latitude!, site.longitude!), 14);
                            }
                          },
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(child: Text(site.name, style: TextStyle(color: textColor, fontWeight: FontWeight.w800, fontSize: 15))),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: AppColors.violet.withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Row(
                                        children: [
                                          const Icon(Icons.star_rounded, color: Colors.orange, size: 14),
                                          const SizedBox(width: 4),
                                          Text(site.rating, style: const TextStyle(color: Colors.orange, fontWeight: FontWeight.bold, fontSize: 12)),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text('${site.city} · ${site.category}', style: TextStyle(color: hintColor, fontSize: 12)),
                                const SizedBox(height: 4),
                                Text(site.description, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(color: hintColor, fontSize: 12)),
                                if (site.entryFee > 0) Padding(
                                  padding: const EdgeInsets.only(top: 4),
                                  child: Text('Entrée: ${site.entryFee.toStringAsFixed(0)} F', style: const TextStyle(color: AppColors.coral, fontWeight: FontWeight.w800, fontSize: 12)),
                                ),
                              ],
                            ),
                          ),
                        ).animate().fade().slideX(begin: 0.1, end: 0);
                      },
                      childCount: tp.touristSites.length,
                    ),
                  ),
                );
              },
            ),
            // Map section
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Carte', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.w900)),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 250,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: FlutterMap(
                          mapController: _mapCtrl,
                          options: MapOptions(
                            initialCenter: const LatLng(-4.4419, 15.2663),
                            initialZoom: 5.0,
                          ),
                          children: [
                            TileLayer(
                              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                              userAgentPackageName: 'com.satisfaitdev.mosombi',
                            ),
                            Consumer<TravelProvider>(
                              builder: (context, tp, _) {
                                return MarkerLayer(
                                  markers: tp.touristSites.where((s) => s.latitude != null && s.longitude != null).map((s) {
                                    return Marker(
                                      point: LatLng(s.latitude!, s.longitude!),
                                      width: 80,
                                      height: 40,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: AppColors.violet,
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Text(s.name, style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold), maxLines: 1, overflow: TextOverflow.ellipsis),
                                      ),
                                    );
                                  }).toList(),
                                );
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // Guides
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                child: Text('Guides disponibles', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.w900)),
              ),
            ),
            Consumer<TravelProvider>(
              builder: (context, tp, _) {
                return SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final g = tp.tourGuides[index];
                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Row(
                            children: [
                              CircleAvatar(
                                radius: 24,
                                backgroundImage: g.avatarUrl.isNotEmpty ? NetworkImage(g.avatarUrl) : null,
                                child: g.avatarUrl.isEmpty ? Text(g.name[0].toUpperCase(), style: const TextStyle(fontWeight: FontWeight.bold)) : null,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(g.name, style: TextStyle(color: textColor, fontWeight: FontWeight.w800, fontSize: 14)),
                                    Text('${g.city} · ${g.rating} ⭐', style: TextStyle(color: hintColor, fontSize: 12)),
                                  ],
                                ),
                              ),
                              Text('${g.pricePerHour.toStringAsFixed(0)} F/h', style: const TextStyle(color: AppColors.violet, fontWeight: FontWeight.w900, fontSize: 13)),
                            ],
                          ),
                        ).animate().fade().slideX(begin: 0.1, end: 0);
                      },
                      childCount: tp.tourGuides.length,
                    ),
                  ),
                );
              },
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 60)),
          ],
        ),
      ),
    );
  }
}

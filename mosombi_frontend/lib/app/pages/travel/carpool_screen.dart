import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:mosombi_frontend/core/widgets/custom_loader.dart';
import 'package:mosombi_frontend/core/providers/travel_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';

class CarpoolScreen extends StatefulWidget {
  const CarpoolScreen({super.key});

  @override
  State<CarpoolScreen> createState() => _CarpoolScreenState();
}

class _CarpoolScreenState extends State<CarpoolScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabCtrl;
  final _departureCtrl = TextEditingController();
  final _destinationCtrl = TextEditingController();
  final _dateCtrl = TextEditingController();
  final _timeCtrl = TextEditingController();
  final _priceCtrl = TextEditingController();
  final _seatsCtrl = TextEditingController();
  final _vehicleCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TravelProvider>().fetchCarpools();
    });
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    _departureCtrl.dispose();
    _destinationCtrl.dispose();
    _dateCtrl.dispose();
    _timeCtrl.dispose();
    _priceCtrl.dispose();
    _seatsCtrl.dispose();
    _vehicleCtrl.dispose();
    _notesCtrl.dispose();
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
        child: NestedScrollView(
          headerSliverBuilder: (context, _) => [
            MossombiSliverAppBar(title: 'Covoiturage'),
            SliverToBoxAdapter(
              child: TabBar(
                controller: _tabCtrl,
                labelColor: AppColors.violet,
                unselectedLabelColor: hintColor,
                indicatorColor: AppColors.violet,
                tabs: const [
                  Tab(text: 'Offres disponibles'),
                  Tab(text: 'Publier un trajet'),
                ],
              ),
            ),
          ],
          body: TabBarView(
            controller: _tabCtrl,
            children: [
              _buildListTab(isDark, textColor, hintColor),
              _buildPublishTab(isDark, textColor, hintColor),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildListTab(bool isDark, Color textColor, Color hintColor) {
    return Consumer<TravelProvider>(
      builder: (context, tp, _) {
        return CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: GlassContainer(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      Expanded(child: _miniField('Départ', _departureCtrl, hintColor, textColor)),
                      const Padding(padding: EdgeInsets.symmetric(horizontal: 8), child: Icon(Icons.arrow_forward, color: Colors.grey, size: 18)),
                      Expanded(child: _miniField('Destination', _destinationCtrl, hintColor, textColor)),
                      const SizedBox(width: 8),
                      IconButton(
                        icon: const Icon(Icons.search_rounded, color: AppColors.violet),
                        onPressed: () => context.read<TravelProvider>().fetchCarpools(
                          departure: _departureCtrl.text,
                          destination: _destinationCtrl.text,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            if (tp.isLoading)
              const SliverToBoxAdapter(child: Padding(padding: EdgeInsets.all(32), child: MosombiLoader())),
            if (tp.carpools.isEmpty && !tp.isLoading)
              SliverToBoxAdapter(child: Padding(
                padding: const EdgeInsets.all(40),
                child: Column(children: [
                  Icon(Icons.people_alt_outlined, size: 64, color: hintColor),
                  const SizedBox(height: 16),
                  Text('Aucune offre', style: TextStyle(color: hintColor, fontWeight: FontWeight.w600)),
                ]).animate().fade(),
              )),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final c = tp.carpools[index];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('${c.departureCity} → ${c.destinationCity}', style: TextStyle(color: textColor, fontWeight: FontWeight.w800, fontSize: 15)),
                                const SizedBox(height: 4),
                                Text('${c.departureDate} à ${c.departureTime}', style: TextStyle(color: hintColor, fontSize: 12)),
                                Text('${c.seatsAvailable} place(s) · ${c.vehicleInfo}', style: TextStyle(color: hintColor, fontSize: 12)),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text('${c.price.toStringAsFixed(0)} F', style: const TextStyle(color: AppColors.coral, fontWeight: FontWeight.w900, fontSize: 15)),
                              const SizedBox(height: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: AppColors.violet.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Text('Réserver', style: TextStyle(color: AppColors.violet, fontWeight: FontWeight.w800, fontSize: 11)),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ).animate().fade().slideX(begin: 0.1, end: 0);
                  },
                  childCount: tp.carpools.length,
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 60)),
          ],
        );
      },
    );
  }

  Widget _buildPublishTab(bool isDark, Color textColor, Color hintColor) {
    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: GlassContainer(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Publier un trajet', style: TextStyle(color: textColor, fontWeight: FontWeight.w900, fontSize: 18)),
                  const SizedBox(height: 16),
                  _field('Ville de départ', _departureCtrl, hintColor, textColor),
                  const SizedBox(height: 12),
                  _field('Ville de destination', _destinationCtrl, hintColor, textColor),
                  const SizedBox(height: 12),
                  _field('Date (YYYY-MM-DD)', _dateCtrl, hintColor, textColor),
                  const SizedBox(height: 12),
                  _field('Heure (HH:MM)', _timeCtrl, hintColor, textColor),
                  const SizedBox(height: 12),
                  _field('Prix par place', _priceCtrl, hintColor, textColor),
                  const SizedBox(height: 12),
                  _field('Nombre de places', _seatsCtrl, hintColor, textColor),
                  const SizedBox(height: 12),
                  _field('Infos véhicule', _vehicleCtrl, hintColor, textColor),
                  const SizedBox(height: 12),
                  _field('Notes (optionnel)', _notesCtrl, hintColor, textColor),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () async {
                        final res = await context.read<TravelProvider>().publishCarpool(
                          departureCity: _departureCtrl.text,
                          destinationCity: _destinationCtrl.text,
                          departureDate: _dateCtrl.text,
                          departureTime: _timeCtrl.text,
                          price: double.tryParse(_priceCtrl.text) ?? 0,
                          seatsAvailable: int.tryParse(_seatsCtrl.text) ?? 1,
                          vehicleInfo: _vehicleCtrl.text,
                          notes: _notesCtrl.text,
                        );
                        if (res != null && mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Trajet publié!'), backgroundColor: Color(0xFF00E5C5)),
                          );
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.coral,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: const Text('Publier mon trajet', style: TextStyle(fontWeight: FontWeight.w800)),
                    ),
                  ),
                ],
              ),
            ).animate().fade(),
          ),
        ),
        const SliverToBoxAdapter(child: SizedBox(height: 60)),
      ],
    );
  }

  Widget _field(String hint, TextEditingController ctrl, Color hintColor, Color textColor) {
    return Container(
      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(12)),
      child: TextField(
        controller: ctrl, style: TextStyle(color: textColor, fontSize: 14),
        decoration: InputDecoration(
          hintText: hint, hintStyle: TextStyle(color: hintColor, fontSize: 13),
          border: InputBorder.none, contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        ),
      ),
    );
  }

  Widget _miniField(String hint, TextEditingController ctrl, Color hintColor, Color textColor) {
    return Container(
      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(10)),
      child: TextField(
        controller: ctrl, style: TextStyle(color: textColor, fontSize: 12),
        decoration: InputDecoration(
          hintText: hint, hintStyle: TextStyle(color: hintColor, fontSize: 11),
          border: InputBorder.none, contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8), isDense: true,
        ),
      ),
    );
  }
}

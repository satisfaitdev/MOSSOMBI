import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:mosombi_frontend/core/widgets/custom_loader.dart';
import 'package:mosombi_frontend/core/providers/travel_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

class TravelScreen extends StatefulWidget {
  const TravelScreen({super.key});

  @override
  State<TravelScreen> createState() => _TravelScreenState();
}

class _TravelScreenState extends State<TravelScreen> {
  final _departureCtrl = TextEditingController();
  final _destinationCtrl = TextEditingController();
  final _dateCtrl = TextEditingController();

  static const _services = [
    _TravelService(icon: Icons.directions_bus_rounded, label: 'Bus', color: Color(0xFF6C4EF6), route: '/travel/bus'),
    _TravelService(icon: Icons.people_alt_rounded, label: 'Covoiturage', color: Color(0xFFFF6584), route: '/travel/carpool'),
    _TravelService(icon: Icons.flight_rounded, label: 'Vol', color: Color(0xFFFF9800), route: '/travel/flights'),
    _TravelService(icon: Icons.train_rounded, label: 'Train', color: Color(0xFF00D4FF), route: '/travel/trains'),
    _TravelService(icon: Icons.directions_boat_rounded, label: 'Bateau', color: Color(0xFF00E5C5), route: '/travel/ferries'),
    _TravelService(icon: Icons.directions_car_rounded, label: 'Location', color: Color(0xFF4CAF50), route: '/travel/car-rental'),
    _TravelService(icon: Icons.explore_rounded, label: 'Sites', color: Color(0xFFE91E63), route: '/travel/tourist-sites'),
    _TravelService(icon: Icons.assistant_rounded, label: 'Assistant', color: Color(0xFF9C27B0), route: '/travel/assistant'),
  ];

  @override
  void dispose() {
    _departureCtrl.dispose();
    _destinationCtrl.dispose();
    _dateCtrl.dispose();
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
            MossombiHeaderType2(
              title: 'Voyage',
              expandedHeight: 140,
            ),

            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 10, 20, 10),
                child: GlassContainer(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _buildSearchField(_departureCtrl, 'Ville de départ', Icons.trip_origin_rounded, hintColor, textColor),
                      const SizedBox(height: 12),
                      _buildSearchField(_destinationCtrl, 'Ville de destination', Icons.location_on_rounded, hintColor, textColor),
                      const SizedBox(height: 12),
                      _buildSearchField(_dateCtrl, 'Date de voyage', Icons.calendar_today_rounded, hintColor, textColor, readOnly: true),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () {},
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.violet,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          child: const Text('Rechercher', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                        ),
                      ),
                    ],
                  ),
                ).animate().fade(duration: 500.ms).slideY(begin: 0.2, end: 0),
              ),
            ),

            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 16),
                child: Text('Nos services de voyage', style: TextStyle(
                  color: textColor, fontSize: 20, fontWeight: FontWeight.w900,
                )).animate().fade(delay: 200.ms),
              ),
            ),

            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 4,
                  childAspectRatio: 0.85,
                  mainAxisSpacing: 16,
                  crossAxisSpacing: 12,
                ),
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final s = _services[index];
                    return GestureDetector(
                      onTap: () => context.push(s.route),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 58, height: 58,
                            decoration: BoxDecoration(
                              color: s.color.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(18),
                            ),
                            child: Icon(s.icon, color: s.color, size: 28),
                          ),
                          const SizedBox(height: 8),
                          Text(s.label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                            maxLines: 1, overflow: TextOverflow.ellipsis, textAlign: TextAlign.center),
                        ],
                      ),
                    ).animate(delay: (index * 60).ms).scale(begin: const Offset(0.5, 0.5), duration: 400.ms, curve: Curves.elasticOut).fade();
                  },
                  childCount: _services.length,
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 60)),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchField(TextEditingController ctrl, String hint, IconData icon, Color hintColor, Color textColor, {bool readOnly = false}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
      ),
      child: TextField(
        controller: ctrl,
        readOnly: readOnly,
        style: TextStyle(color: textColor, fontSize: 14),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(color: hintColor, fontSize: 13),
          border: InputBorder.none,
          prefixIcon: Icon(icon, color: hintColor, size: 20),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        ),
      ),
    );
  }
}

class _TravelService {
  final IconData icon;
  final String label;
  final Color color;
  final String route;
  const _TravelService({required this.icon, required this.label, required this.color, required this.route});
}

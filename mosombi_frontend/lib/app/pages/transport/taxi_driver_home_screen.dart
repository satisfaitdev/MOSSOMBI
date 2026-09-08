import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:mosombi_frontend/core/providers/taxi_driver_provider.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';

class TaxiDriverHomeScreen extends StatefulWidget {
  const TaxiDriverHomeScreen({super.key});

  @override
  State<TaxiDriverHomeScreen> createState() => _TaxiDriverHomeScreenState();
}

class _TaxiDriverHomeScreenState extends State<TaxiDriverHomeScreen> {
  final MapController _mapController = MapController();
  int _selectedTab = 0;

  IconData get _statusIcon {
    switch (context.read<TaxiDriverProvider>().status) {
      case DriverStatus.online: return Icons.wifi_rounded;
      case DriverStatus.enRoute: return Icons.directions_car_rounded;
      case DriverStatus.inTransit: return Icons.trip_origin_rounded;
      default: return Icons.wifi_off_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    final driver = context.watch<TaxiDriverProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: MossombiAppBar(
        title: 'Chauffeur Taxi',
        actionIcon: Icon(_statusIcon, color: driver.isOnline ? const Color(0xFF00E5C5) : Colors.redAccent, size: 22),
      ),
      body: AnimatedGradientBg(
        isDark: isDark,
        child: Column(
          children: [
            // Status Toggle
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 100, 20, 12),
              child: GlassContainer(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  children: [
                    Container(
                      width: 14, height: 14,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: driver.isOnline ? const Color(0xFF00E5C5) : Colors.redAccent,
                        boxShadow: [BoxShadow(color: (driver.isOnline ? const Color(0xFF00E5C5) : Colors.redAccent).withValues(alpha: 0.4), blurRadius: 8)],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        driver.isOnline ? 'En ligne — ${driver.pendingRequests.length} demande(s)' : 'Hors ligne',
                        style: TextStyle(color: isDark ? Colors.white : AppColors.textPrimaryLight, fontWeight: FontWeight.bold),
                      ),
                    ),
                    Switch(
                      value: driver.isOnline,
                      activeColor: const Color(0xFF00E5C5),
                      onChanged: (v) {
                        if (v) driver.goOnline(); else driver.goOffline();
                      },
                    ),
                  ],
                ),
              ).animate().fadeIn(delay: 100.ms).slideY(begin: -0.2),
            ),

            // Map
            Expanded(
              child: Stack(
                children: [
                  FlutterMap(
                    mapController: _mapController,
                    options: MapOptions(
                      initialCenter: driver.currentLocation,
                      initialZoom: 14.0,
                    ),
                    children: [
                      TileLayer(
                        urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                        userAgentPackageName: 'com.satisfaitdev.mosombi',
                      ),
                      MarkerLayer(
                        markers: [
                          if (driver.isOnline)
                            Marker(
                              point: driver.currentLocation,
                              width: 50, height: 50,
                              child: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: AppColors.violet,
                                  shape: BoxShape.circle,
                                  boxShadow: [BoxShadow(color: AppColors.violet.withValues(alpha: 0.4), blurRadius: 12)],
                                ),
                                child: const Icon(Icons.local_taxi_rounded, color: Colors.white, size: 24),
                              ).animate(onPlay: (c) => c.repeat()).shimmer(duration: 2.seconds),
                            ),
                          if (driver.activeRide != null) ...[
                            Marker(
                              point: LatLng(driver.activeRide!.pickupLat, driver.activeRide!.pickupLng),
                              width: 50, height: 50,
                              child: _buildMapPin(Icons.person_pin_circle_rounded, AppColors.violet),
                            ),
                            Marker(
                              point: LatLng(driver.activeRide!.dropoffLat, driver.activeRide!.dropoffLng),
                              width: 50, height: 50,
                              child: _buildMapPin(Icons.flag_rounded, const Color(0xFFFF6584)),
                            ),
                          ],
                          ...driver.pendingRequests.take(8).map((r) => Marker(
                            point: LatLng(r.pickupLat, r.pickupLng),
                            width: 40, height: 40,
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: Colors.orangeAccent,
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white, width: 2),
                                boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 6)],
                              ),
                              child: const Icon(Icons.notifications_active_rounded, color: Colors.white, size: 18),
                            ).animate(onPlay: (c) => c.repeat()).scale(begin: const Offset(1,1), end: const Offset(1.2,1.2)),
                          )),
                        ],
                      ),
                    ],
                  ),

                  // Heat zone indicators (decorative)
                  if (driver.isOnline)
                    Positioned(
                      right: 12, top: 12,
                      child: GlassContainer(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.whatshot_rounded, color: Colors.orangeAccent, size: 18),
                            const SizedBox(width: 6),
                            Text('${driver.pendingRequests.length} zones chaudes', style: TextStyle(color: isDark ? Colors.white70 : Colors.black54, fontSize: 11, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // Bottom Panel
            _buildBottomPanel(context, driver, isDark),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomPanel(BuildContext context, TaxiDriverProvider driver, bool isDark) {
    if (driver.activeRide != null) return _buildActiveRidePanel(driver, isDark);

    return Container(
      decoration: BoxDecoration(
        color: (isDark ? AppColors.surfaceDark : Colors.white).withValues(alpha: 0.95),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 20, offset: const Offset(0, -4))],
      ),
      padding: EdgeInsets.fromLTRB(20, 12, 20, MediaQuery.of(context).padding.bottom + 16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.withValues(alpha: 0.3), borderRadius: BorderRadius.circular(4)))),
          const SizedBox(height: 8),

          // Tab bar
          Row(
            children: [
              _buildTab(0, 'Demandes', Icons.list_alt_rounded, isDark),
              const SizedBox(width: 8),
              _buildTab(1, 'Gains', Icons.monetization_on_rounded, isDark),
              const SizedBox(width: 8),
              _buildTab(2, 'Historique', Icons.history_rounded, isDark),
            ],
          ),
          const SizedBox(height: 12),

          if (_selectedTab == 0) _buildRequestsList(driver, isDark),
          if (_selectedTab == 1) _buildEarningsPanel(driver, isDark),
          if (_selectedTab == 2) _buildHistoryList(driver, isDark),
        ],
      ),
    );
  }

  Widget _buildTab(int index, String label, IconData icon, bool isDark) {
    final isSel = _selectedTab == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedTab = index),
        child: AnimatedContainer(
          duration: 200.ms,
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSel ? AppColors.violet.withValues(alpha: 0.15) : Colors.transparent,
            borderRadius: BorderRadius.circular(14),
            border: isSel ? Border.all(color: AppColors.violet.withValues(alpha: 0.3)) : null,
          ),
          child: Column(
            children: [
              Icon(icon, color: isSel ? AppColors.violet : (isDark ? Colors.white54 : Colors.black38), size: 22),
              const SizedBox(height: 2),
              Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: isSel ? AppColors.violet : (isDark ? Colors.white54 : Colors.black45))),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRequestsList(TaxiDriverProvider driver, bool isDark) {
    if (driver.pendingRequests.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 24),
        child: Column(
          children: [
            Icon(Icons.inbox_rounded, size: 48, color: isDark ? Colors.white24 : Colors.black12),
            const SizedBox(height: 8),
            Text('Aucune demande pour le moment', style: TextStyle(color: isDark ? Colors.white38 : Colors.black26)),
          ],
        ),
      );
    }

    return SizedBox(
      height: 200,
      child: ListView.separated(
        itemCount: driver.pendingRequests.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (context, index) {
          final req = driver.pendingRequests[index];
          return GlassContainer(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.my_location_rounded, color: AppColors.violet, size: 14),
                          const SizedBox(width: 6),
                          Flexible(child: Text(req.pickupAddress, style: TextStyle(fontWeight: FontWeight.bold, color: isDark ? Colors.white : AppColors.textPrimaryLight, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis)),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.flag_rounded, color: Color(0xFFFF6584), size: 14),
                          const SizedBox(width: 6),
                          Flexible(child: Text(req.dropoffAddress, style: TextStyle(color: isDark ? Colors.white60 : Colors.black54, fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(Icons.monetization_on_rounded, size: 14, color: const Color(0xFF00E5C5)),
                          const SizedBox(width: 4),
                          Text('${req.estimatedPrice.toStringAsFixed(0)} FCFA', style: TextStyle(fontWeight: FontWeight.w900, color: const Color(0xFF00E5C5), fontSize: 14)),
                          const SizedBox(width: 12),
                          Icon(Icons.straighten_rounded, size: 14, color: isDark ? Colors.white38 : Colors.black38),
                          const SizedBox(width: 4),
                          Text('${(req.distanceM / 1000).toStringAsFixed(1)} km', style: TextStyle(color: isDark ? Colors.white38 : Colors.black38, fontSize: 12)),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Column(
                  children: [
                    Container(
                      decoration: BoxDecoration(color: const Color(0xFF00E5C5).withValues(alpha: 0.15), shape: BoxShape.circle),
                      child: IconButton(
                        icon: const Icon(Icons.check_rounded, color: Color(0xFF00E5C5), size: 22),
                        onPressed: () => driver.acceptRequest(req.id),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      decoration: BoxDecoration(color: Colors.redAccent.withValues(alpha: 0.15), shape: BoxShape.circle),
                      child: IconButton(
                        icon: const Icon(Icons.close_rounded, color: Colors.redAccent, size: 22),
                        onPressed: () => driver.rejectRequest(req.id),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ).animate().slideX(begin: 0.1, duration: 300.ms + (index * 50).ms);
        },
      ),
    );
  }

  Widget _buildActiveRidePanel(TaxiDriverProvider driver, bool isDark) {
    final ride = driver.activeRide!;
    final isEnRoute = driver.status == DriverStatus.enRoute;

    return Container(
      decoration: BoxDecoration(
        color: (isDark ? AppColors.surfaceDark : Colors.white).withValues(alpha: 0.95),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 20, offset: const Offset(0, -4))],
      ),
      padding: EdgeInsets.fromLTRB(20, 16, 20, MediaQuery.of(context).padding.bottom + 16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.withValues(alpha: 0.3), borderRadius: BorderRadius.circular(4)))),
          const SizedBox(height: 12),

          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: isEnRoute ? AppColors.violet.withValues(alpha: 0.15) : const Color(0xFF00E5C5).withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(isEnRoute ? Icons.directions_car_rounded : Icons.trip_origin_rounded, color: isEnRoute ? AppColors.violet : const Color(0xFF00E5C5), size: 28),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(isEnRoute ? 'En route vers le client' : 'En transit vers la destination',
                      style: TextStyle(fontWeight: FontWeight.w900, color: isDark ? Colors.white : AppColors.textPrimaryLight, fontSize: 16)),
                    if (driver.etaMinutes > 0)
                      Text('Arrivée dans ${driver.etaMinutes} min', style: TextStyle(color: isDark ? Colors.white54 : Colors.black45, fontSize: 13)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          Row(
            children: [
              const Icon(Icons.my_location_rounded, color: AppColors.violet, size: 16),
              const SizedBox(width: 8),
              Expanded(child: Text(ride.pickupAddress, style: TextStyle(color: isDark ? Colors.white : AppColors.textPrimaryLight, fontWeight: FontWeight.bold, fontSize: 13))),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(Icons.flag_rounded, color: Color(0xFFFF6584), size: 16),
              const SizedBox(width: 8),
              Expanded(child: Text(ride.dropoffAddress, style: TextStyle(color: isDark ? Colors.white60 : Colors.black54, fontSize: 13))),
            ],
          ),

          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Text('${ride.estimatedPrice.toStringAsFixed(0)} FCFA',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 24, color: const Color(0xFF00E5C5), letterSpacing: -1)),
              ),
              if (isEnRoute)
                ElevatedButton.icon(
                  onPressed: () => driver.startRide(ride.id),
                  icon: const Icon(Icons.play_arrow_rounded, size: 20),
                  label: const Text('Démarrer', style: TextStyle(fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.violet,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  ),
                )
              else
                ElevatedButton.icon(
                  onPressed: () => driver.completeRide(ride.id),
                  icon: const Icon(Icons.check_circle_rounded, size: 20),
                  label: const Text('Terminer', style: TextStyle(fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00E5C5),
                    foregroundColor: AppColors.bgDark1,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  ),
                ),
            ],
          ),
        ],
      ),
    ).animate().slideY(begin: 0.3, duration: 400.ms);
  }

  Widget _buildEarningsPanel(TaxiDriverProvider driver, bool isDark) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: GlassContainer(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Text('Aujourd\'hui', style: TextStyle(color: isDark ? Colors.white54 : Colors.black45, fontSize: 12)),
                    const SizedBox(height: 4),
                    Text('${driver.earningsToday.toStringAsFixed(0)} FCFA', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: const Color(0xFF00E5C5))),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: GlassContainer(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Text('Total', style: TextStyle(color: isDark ? Colors.white54 : Colors.black45, fontSize: 12)),
                    const SizedBox(height: 4),
                    Text('${driver.totalEarnings.toStringAsFixed(0)} FCFA', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: AppColors.violet)),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: GlassContainer(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Text('Courses', style: TextStyle(color: isDark ? Colors.white54 : Colors.black45, fontSize: 12)),
                    const SizedBox(height: 4),
                    Text('${driver.totalRides}', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: isDark ? Colors.white : AppColors.textPrimaryLight)),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        TextButton(
          onPressed: () => driver.fetchEarnings(),
          child: const Text('Actualiser', style: TextStyle(color: AppColors.violet, fontWeight: FontWeight.bold)),
        ),
      ],
    );
  }

  Widget _buildHistoryList(TaxiDriverProvider driver, bool isDark) {
    if (driver.rideHistory.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 24),
        child: Column(
          children: [
            Icon(Icons.history_rounded, size: 48, color: isDark ? Colors.white24 : Colors.black12),
            const SizedBox(height: 8),
            Text('Aucune course effectuée', style: TextStyle(color: isDark ? Colors.white38 : Colors.black26)),
          ],
        ),
      );
    }

    return SizedBox(
      height: 200,
      child: ListView.separated(
        itemCount: driver.rideHistory.length,
        separatorBuilder: (_, __) => const SizedBox(height: 6),
        itemBuilder: (context, index) {
          final ride = driver.rideHistory[index];
          return GlassContainer(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: ride.status == 'completed' ? const Color(0xFF00E5C5).withValues(alpha: 0.15) : Colors.orangeAccent.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    ride.status == 'completed' ? Icons.check_circle_rounded : Icons.pending_rounded,
                    color: ride.status == 'completed' ? const Color(0xFF00E5C5) : Colors.orangeAccent,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(ride.pickupAddress, style: TextStyle(fontWeight: FontWeight.bold, color: isDark ? Colors.white : AppColors.textPrimaryLight, fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis),
                      Text(ride.dropoffAddress, style: TextStyle(color: isDark ? Colors.white54 : Colors.black45, fontSize: 11), maxLines: 1, overflow: TextOverflow.ellipsis),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '${(ride.finalPrice > 0 ? ride.finalPrice : ride.estimatedPrice).toStringAsFixed(0)} FCFA',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: const Color(0xFF00E5C5)),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildMapPin(IconData icon, Color color) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: color, shape: BoxShape.circle, boxShadow: [BoxShadow(color: color.withValues(alpha: 0.4), blurRadius: 10, offset: const Offset(0, 4))]),
          child: Icon(icon, color: Colors.white, size: 22),
        ),
        Container(width: 4, height: 14, color: color),
      ],
    ).animate(onPlay: (c) => c.repeat(reverse: true)).moveY(begin: 0, end: -5, duration: 1.5.seconds);
  }
}

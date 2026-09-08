import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:mosombi_frontend/core/providers/transport_provider.dart';
import 'package:mosombi_frontend/core/providers/wallet_provider.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';

class TransportScreen extends StatefulWidget {
  const TransportScreen({super.key});

  @override
  State<TransportScreen> createState() => _TransportScreenState();
}

class _TransportScreenState extends State<TransportScreen> {
  final MapController _mapController = MapController();
  final TextEditingController _noteController = TextEditingController();

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final transport = context.watch<TransportProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Camera Auto-Framing Logic
    WidgetsBinding.instance.addPostFrameCallback((_) {
      try {
        if (transport.status == RideStatus.idle || transport.status == RideStatus.configuring) {
          if (transport.dropoffLocation != null) {
            final b = LatLngBounds(transport.pickupLocation!, transport.dropoffLocation!);
            _mapController.fitCamera(CameraFit.bounds(bounds: b, padding: const EdgeInsets.all(60)));
          }
        } else if (transport.status == RideStatus.driverEnRoute && transport.assignedDriver != null) {
          // Centrer entre le driver et l'utilisateur (Pickup)
          final b = LatLngBounds(transport.pickupLocation!, transport.assignedDriver!.position);
          _mapController.fitCamera(CameraFit.bounds(bounds: b, padding: const EdgeInsets.all(80)));
        } else if (transport.status == RideStatus.inTransit && transport.dropoffLocation != null && transport.currentLocation != null) {
          // Centrer entre la voiture (currentLocation) et l'arrivée
          final b = LatLngBounds(transport.currentLocation!, transport.dropoffLocation!);
          _mapController.fitCamera(CameraFit.bounds(bounds: b, padding: const EdgeInsets.all(80)));
        } else if (transport.status == RideStatus.searching) {
          _mapController.move(transport.pickupLocation!, 15.5);
        }
      } catch (e) {
        // Ignorer si la carte n'est pas encore prête
      }
    });

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: const MossombiAppBar(title: 'Commander un Taxi'),
      body: Stack(
        children: [
          // 1. CARTE ACTIVE
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: transport.pickupLocation ?? transport.currentLocation ?? const LatLng(0, 0),
              initialZoom: 15.0,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.satisfaitdev.mosombi',
              ),
              MarkerLayer(
                markers: [
                  // L'UTILISATEUR (PICKUP) S'AFFICHE SEULEMENT AVANT LE TRAJET
                  if (transport.status != RideStatus.inTransit && transport.status != RideStatus.completed && (transport.pickupLocation != null || transport.currentLocation != null))
                    Marker(
                      point: transport.pickupLocation ?? transport.currentLocation!,
                      width: 60,
                      height: 60,
                      child: _buildPin(Icons.person_pin_circle_rounded, const Color(0xFF6C4EF6)),
                    ),
                  
                  // LA DESTINATION (DROPOFF)
                  if (transport.dropoffLocation != null)
                    Marker(
                      point: transport.dropoffLocation!,
                      width: 60,
                      height: 60,
                      child: _buildPin(Icons.flag_rounded, const Color(0xFFFF6584)),
                    ),

                  // TAXIS DISPONIBLES (IDLE / CONFIG)
                  if (transport.status == RideStatus.idle || transport.status == RideStatus.configuring)
                    ...transport.availableDrivers.map((d) => Marker(
                      point: d.position,
                      width: 40, height: 40,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle, border: Border.all(color: Colors.black12), boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4)]),
                        child: const Icon(Icons.local_taxi_rounded, color: Colors.orange, size: 20),
                      ).animate(onPlay: (c) => c.repeat()).shimmer(duration: 2.seconds),
                    )),

                  // TAXI ASSIGNÉ EN MOUVEMENT (DRIVER EN ROUTE OU EN TRANSIT)
                  if ((transport.status == RideStatus.driverEnRoute || transport.status == RideStatus.inTransit || transport.status == RideStatus.arrived) && transport.assignedDriver != null)
                    Marker(
                      point: (transport.status == RideStatus.inTransit || transport.status == RideStatus.completed) ? (transport.currentLocation ?? transport.assignedDriver!.position) : transport.assignedDriver!.position,
                      width: 60, height: 60,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: const BoxDecoration(color: Colors.black87, shape: BoxShape.circle, boxShadow: [BoxShadow(color: Colors.black45, blurRadius: 8)]),
                            child: const Icon(Icons.directions_car_rounded, color: Colors.yellowAccent, size: 24),
                          ),
                          if (transport.etaMinutes > 0)
                            Container(
                              margin: const EdgeInsets.only(top: 4),
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.black12)),
                              child: Text('${transport.etaMinutes} min', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 10, color: Colors.black)),
                            )
                        ],
                      ).animate().scale(curve: Curves.easeOutBack),
                    )
                ],
              ),
            ],
          ),

          // 2. BOTTOM DRAGGABLE UI (ÉTAT DE LA COURSE)
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: _buildDynamicBottomSheet(context, transport, isDark),
          ),
        ],
      ),
    );
  }

  Widget _buildDynamicBottomSheet(BuildContext context, TransportProvider transport, bool isDark) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E2C) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 30, offset: const Offset(0, -10))],
      ),
      padding: EdgeInsets.fromLTRB(24, 16, 24, MediaQuery.of(context).padding.bottom + 24),
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        child: _getCurrentStepUI(context, transport, isDark),
      ),
    );
  }

  Widget _getCurrentStepUI(BuildContext context, TransportProvider transport, bool isDark) {
    switch (transport.status) {
      case RideStatus.idle:
        return _buildIdleStep(transport, isDark);
      case RideStatus.configuring:
        return _buildConfiguringStep(transport, isDark);
      case RideStatus.searching:
        return _buildLoadingStep('Recherche de chauffeurs à proximité...', Icons.radar_rounded);
      case RideStatus.waitingAcceptance:
        return _buildLoadingStep('En attente de l\'acceptation de ${transport.assignedDriver?.name ?? "votre chauffeur"}...', Icons.access_time_filled_rounded);
      case RideStatus.driverEnRoute:
        return _buildTrackingStep(transport, isDark);
      case RideStatus.arrived:
        return _buildArrivedStep(transport);
      case RideStatus.inTransit:
        return _buildInTransitStep(transport, isDark);
      case RideStatus.completed:
        return _buildCompletedStep(transport);
      default:
        return _buildIdleStep(transport, isDark);
    }
  }

  // --- STEPS --- //

  Widget _buildIdleStep(TransportProvider transport, bool isDark) {
    return Column(
      key: const ValueKey('idle'),
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.withValues(alpha: 0.3), borderRadius: BorderRadius.circular(4)))),
        const SizedBox(height: 24),
        const Text('Où allons-nous ?', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.03), borderRadius: BorderRadius.circular(16)),
          child: Row(
            children: [
              const Icon(Icons.search_rounded, color: Colors.grey),
              const SizedBox(width: 12),
              Expanded(
                child: TextField(
                  decoration: const InputDecoration(border: InputBorder.none, hintText: 'Tapez une adresse de destination', isDense: true, contentPadding: EdgeInsets.zero),
                  style: const TextStyle(fontWeight: FontWeight.bold),
                  onSubmitted: (val) {
                    if (val.trim().isNotEmpty) {
                      if (transport.currentLocation != null) transport.selectDropoff(LatLng(transport.currentLocation!.latitude - 0.02, transport.currentLocation!.longitude + 0.03), val);
                    }
                  },
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildConfiguringStep(TransportProvider transport, bool isDark) {
    return Column(
      key: const ValueKey('config'),
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.withValues(alpha: 0.3), borderRadius: BorderRadius.circular(4)))),
        const SizedBox(height: 16),
        
        // Ride Type Selection
        Row(
          children: [
            Expanded(child: _buildRideTypeCard(transport, RideType.classic, 'Taxi VIP', Icons.local_taxi_rounded, 'Seul', isDark)),
            const SizedBox(width: 12),
            Expanded(child: _buildRideTypeCard(transport, RideType.shared, 'Partagé', Icons.people_alt_rounded, '- Moins Cher', isDark)),
          ],
        ),
        const SizedBox(height: 16),
        
        // Toggles
        Wrap(
          spacing: 8, runSpacing: 8,
          children: [
            _buildOptionChip('Climatisé', Icons.ac_unit_rounded, transport.hasAC, (v) => transport.toggleAC(v), const Color(0xFF00E5C5)),
            _buildOptionChip('Pour un proche', Icons.person_add_rounded, transport.forSomeoneElse, (v) => transport.toggleForSomeoneElse(v), const Color(0xFFFF9800)),
            _buildOptionChip('Plus tard', Icons.calendar_month_rounded, transport.scheduleForLater, (v) => transport.toggleSchedule(v), AppColors.violet),
          ],
        ),
        
        const SizedBox(height: 16),
        GestureDetector(
          onTap: () => context.push('/transport/subscription'),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: isDark ? AppColors.surfaceDark : Colors.grey[100],
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.violet.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: AppColors.violet.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                  child: const Icon(Icons.workspace_premium_rounded, color: AppColors.violet, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('S\'Abonner au VTC', style: TextStyle(color: isDark ? Colors.white : Colors.black87, fontWeight: FontWeight.bold, fontSize: 13)),
                      Text('Payez à la semaine ou par mois', style: TextStyle(color: isDark ? Colors.white54 : Colors.black54, fontSize: 11)),
                    ],
                  ),
                ),
                const Icon(Icons.arrow_forward_ios_rounded, color: AppColors.violet, size: 14),
              ],
            ),
          ),
        ),
        
        const SizedBox(height: 16),
        // Note to Driver
        TextField(
          controller: _noteController,
          onChanged: (v) => transport.setNote(v),
          decoration: InputDecoration(
            hintText: 'Note au chauffeur (ex: Je suis devant le portail gris)',
            hintStyle: TextStyle(color: isDark ? Colors.white38 : Colors.black38, fontSize: 13),
            prefixIcon: const Icon(Icons.edit_note_rounded, size: 20),
            suffixIcon: const Icon(Icons.mic_none_rounded, color: AppColors.violet), // Mic icon for voice
            filled: true,
            fillColor: isDark ? Colors.white.withValues(alpha: 0.02) : Colors.black.withValues(alpha: 0.02),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          ),
        ),

        const SizedBox(height: 24),
        // Pricing & Confirm
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Prix Estimé', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold, fontSize: 12)),
                Text('${transport.estimatedPrice.toStringAsFixed(0)} FCFA', style: const TextStyle(color: Color(0xFF6C4EF6), fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -1)),
              ],
            ),
            ElevatedButton(
              onPressed: () => transport.confirmRide(),
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(180, 56),
                backgroundColor: const Color(0xFF6C4EF6),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              ),
              child: const Text('Confirmer', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16)),
            ),
          ],
        ),
      ],
    ).animate().fadeIn().slideY(begin: 0.1, end: 0);
  }

  Widget _buildRideTypeCard(TransportProvider transport, RideType type, String title, IconData icon, String subtitle, bool isDark) {
    final bool isSelected = transport.rideType == type;
    final color = isSelected ? const Color(0xFF6C4EF6) : (isDark ? Colors.white12 : Colors.black12);
    
    return GestureDetector(
      onTap: () => transport.setRideType(type),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF6C4EF6).withValues(alpha: 0.1) : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color, width: isSelected ? 2 : 1),
        ),
        child: Column(
          children: [
            Icon(icon, color: isSelected ? const Color(0xFF6C4EF6) : Colors.grey, size: 32),
            const SizedBox(height: 8),
            Text(title, style: TextStyle(fontWeight: FontWeight.bold, color: isSelected ? const Color(0xFF6C4EF6) : (isDark ? Colors.white : Colors.black))),
            Text(subtitle, style: const TextStyle(fontSize: 10, color: Colors.grey)),
          ],
        ),
      ),
    );
  }

  Widget _buildOptionChip(String label, IconData icon, bool active, Function(bool) onToggle, Color activeColor) {
    return FilterChip(
      label: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: active ? activeColor : Colors.grey)),
      avatar: Icon(icon, size: 16, color: active ? activeColor : Colors.grey),
      selected: active,
      onSelected: onToggle,
      backgroundColor: Colors.transparent,
      selectedColor: activeColor.withValues(alpha: 0.1),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: active ? activeColor : Colors.grey.withValues(alpha: 0.3))),
    );
  }

  Widget _buildLoadingStep(String message, IconData icon) {
    return Column(
      key: ValueKey(message),
      mainAxisSize: MainAxisSize.min,
      children: [
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(color: const Color(0xFF6C4EF6).withValues(alpha: 0.1), shape: BoxShape.circle),
          child: Icon(icon, color: const Color(0xFF6C4EF6), size: 40).animate(onPlay: (c) => c.repeat(reverse: true)).scale(begin: const Offset(1,1), end: const Offset(1.2,1.2)),
        ),
        const SizedBox(height: 24),
        Text(message, textAlign: TextAlign.center, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
        const SizedBox(height: 32),
        TextButton(onPressed: () => context.read<TransportProvider>().cancelRide(), child: const Text('Annuler', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold))),
      ],
    ).animate().fadeIn();
  }

  Widget _buildTrackingStep(TransportProvider transport, bool isDark) {
    final driver = transport.assignedDriver!;
    return Column(
      key: const ValueKey('tracking'),
      mainAxisSize: MainAxisSize.min,
      children: [
        Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.withValues(alpha: 0.3), borderRadius: BorderRadius.circular(4)))),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Arrive dans', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
                Text('${transport.etaMinutes} min', style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Color(0xFF6C4EF6), height: 1.1)),
              ],
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(color: Colors.black, borderRadius: BorderRadius.circular(20)),
              child: Text(driver.licensePlate, style: const TextStyle(color: Colors.yellowAccent, fontWeight: FontWeight.w900, fontSize: 16)),
            )
          ],
        ),
        const SizedBox(height: 24),
        const Divider(),
        const SizedBox(height: 8),
        Row(
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  width: 50, height: 50,
                  decoration: BoxDecoration(color: Colors.grey[300], shape: BoxShape.circle, image: const DecorationImage(image: NetworkImage('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'), fit: BoxFit.cover)),
                ),
                Positioned(
                  bottom: -4, right: -4,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.grey.shade300)),
                    child: Row(children: [const Icon(Icons.star_rounded, color: Colors.orange, size: 10), Text('${driver.rating}', style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold))]),
                  ),
                )
              ],
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(driver.name, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
                  Text(driver.carModel, style: const TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
            Container(
              decoration: BoxDecoration(color: const Color(0xFF00E5C5).withValues(alpha: 0.1), shape: BoxShape.circle),
              child: IconButton(icon: const Icon(Icons.call_rounded, color: Color(0xFF00E5C5)), onPressed: () {}),
            ),
            const SizedBox(width: 8),
            Container(
              decoration: BoxDecoration(color: AppColors.violet.withValues(alpha: 0.1), shape: BoxShape.circle),
              child: IconButton(icon: const Icon(Icons.chat_bubble_rounded, color: AppColors.violet), onPressed: () {}),
            ),
          ],
        ),
        const SizedBox(height: 24),
        ElevatedButton(
          onPressed: () => transport.cancelRide(),
          style: ElevatedButton.styleFrom(
            minimumSize: const Size(double.infinity, 50),
            backgroundColor: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.05),
            foregroundColor: Colors.redAccent,
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
          child: const Text('Annuler la course', style: TextStyle(fontWeight: FontWeight.bold)),
        ),
      ],
    ).animate().fadeIn();
  }

  Widget _buildArrivedStep(TransportProvider transport) {
    return Column(
      key: const ValueKey('arrived'),
      mainAxisSize: MainAxisSize.min,
      children: [
        const SizedBox(height: 24),
        const Icon(Icons.hail_rounded, color: Color(0xFF00E5C5), size: 60).animate().scale(curve: Curves.elasticOut),
        const SizedBox(height: 16),
        const Text('Le chauffeur est là !', textAlign: TextAlign.center, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF00E5C5))),
        const SizedBox(height: 8),
        Text('${transport.assignedDriver!.name} vous attend avec sa ${transport.assignedDriver!.carModel}.', textAlign: TextAlign.center, style: const TextStyle(color: Colors.grey, fontSize: 14)),
        const SizedBox(height: 32),
        ElevatedButton(
          onPressed: () => transport.startTrip(),
          style: ElevatedButton.styleFrom(
            minimumSize: const Size(double.infinity, 56),
            backgroundColor: const Color(0xFF00E5C5),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          ),
          child: const Text('Monter à bord', style: TextStyle(color: AppColors.bgDark1, fontWeight: FontWeight.w900, fontSize: 16)),
        ),
      ],
    ).animate().fadeIn();
  }

  Widget _buildInTransitStep(TransportProvider transport, bool isDark) {
    return Column(
      key: const ValueKey('intransit'),
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.withValues(alpha: 0.3), borderRadius: BorderRadius.circular(4)))),
        const SizedBox(height: 16),
        const Text('Direction', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold, fontSize: 12)),
        Text(transport.dropoffAddress, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, height: 1.1)),
        const SizedBox(height: 24),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Arrivée dans', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
                Text('${transport.etaMinutes} min', style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Color(0xFF00E5C5), height: 1.1)),
              ],
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(color: const Color(0xFF6C4EF6).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(16)),
              child: const Row(children: [
                Icon(Icons.shield_rounded, color: Color(0xFF6C4EF6), size: 18),
                SizedBox(width: 8),
                Text('Urgence', style: TextStyle(color: Color(0xFF6C4EF6), fontWeight: FontWeight.w800)),
              ]),
            )
          ],
        ),
        const SizedBox(height: 24),
      ],
    ).animate().fadeIn();
  }

  Widget _buildCompletedStep(TransportProvider transport) {
    return Column(
      key: const ValueKey('completed'),
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 24),
        const Icon(Icons.check_circle_rounded, color: Color(0xFF00E5C5), size: 70).animate().scale(curve: Curves.elasticOut),
        const SizedBox(height: 16),
        const Text('Course terminée', textAlign: TextAlign.center, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900)),
        const SizedBox(height: 8),
        Text('Coût total: ${transport.estimatedPrice.toStringAsFixed(0)} FCFA', textAlign: TextAlign.center, style: const TextStyle(color: Color(0xFF6C4EF6), fontSize: 18, fontWeight: FontWeight.w900)),
        const SizedBox(height: 32),
        ElevatedButton(
          onPressed: () {
            final wallet = Provider.of<WalletProvider>(context, listen: false);
            final success = wallet.payForService(transport.estimatedPrice, 'Course VTC Mossombi', TransactionType.ridePayment);

            if (!success) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: const Text('Solde insuffisant...'),
                  backgroundColor: Colors.redAccent,
                  action: SnackBarAction(label: 'Recharger', textColor: Colors.white, onPressed: () => context.push('/fintech/topup')),
                ),
              );
              return;
            }

            transport.cancelRide();
          },
          style: ElevatedButton.styleFrom(
            minimumSize: const Size(double.infinity, 56),
            backgroundColor: const Color(0xFF6C4EF6),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          ),
          child: const Text('Payer & Terminer', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16)),
        ),
      ],
    ).animate().fadeIn();
  }

  Widget _buildPin(IconData icon, Color color) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: color, shape: BoxShape.circle, boxShadow: [BoxShadow(color: color.withValues(alpha: 0.4), blurRadius: 10, offset: const Offset(0, 4))]),
          child: Icon(icon, color: Colors.white, size: 24),
        ),
        Container(width: 4, height: 16, color: color),
      ],
    ).animate(onPlay: (c) => c.repeat(reverse: true)).moveY(begin: 0, end: -6, duration: 2.seconds);
  }
}

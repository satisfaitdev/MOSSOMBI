import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:mosombi_frontend/core/providers/transport_provider.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';

/// Floating banner that appears on any screen when a ride is active.
/// Tap it to navigate back to the TransportScreen live tracking page.
class ActiveRideBanner extends StatelessWidget {
  const ActiveRideBanner({super.key});

  @override
  Widget build(BuildContext context) {
    final transport = context.watch<TransportProvider>();
    final isActive = transport.status != RideStatus.idle;
    
    if (!isActive) return const SizedBox.shrink();

    // Build header summary for status
    String label;
    String sub;
    Color color;
    IconData icon;

    switch (transport.status) {
      case RideStatus.searching:
        label = 'Recherche en cours...';
        sub = 'Nous trouvons le meilleur chauffeur.';
        color = const Color(0xFFFF9800);
        icon = Icons.radar_rounded;
        break;
      case RideStatus.waitingAcceptance:
        label = 'Attente d\'acceptation';
        sub = '${transport.assignedDriver?.name ?? "Chauffeur"} examine votre demande.';
        color = const Color(0xFF6C4EF6);
        icon = Icons.access_time_filled_rounded;
        break;
      case RideStatus.driverEnRoute:
        label = '${transport.assignedDriver?.name ?? "Votre taxi"} en route !';
        sub = 'Arrive dans ${transport.etaMinutes} min · Appuyez pour suivre';
        color = const Color(0xFF00E5C5);
        icon = Icons.local_taxi_rounded;
        break;
      case RideStatus.arrived:
        label = 'Le taxi est arrivé !';
        sub = 'Votre chauffeur vous attend.';
        color = const Color(0xFF00E5C5);
        icon = Icons.hail_rounded;
        break;
      case RideStatus.inTransit:
        label = 'En route vers votre destination';
        sub = 'Arrivée estimée dans ${transport.etaMinutes} min';
        color = const Color(0xFF00E5C5);
        icon = Icons.route_rounded;
        break;
      case RideStatus.completed:
        label = 'Course terminée';
        sub = 'Merci d\'avoir voyagé avec Mossombi';
        color = const Color(0xFF6C4EF6);
        icon = Icons.check_circle_rounded;
        break;
      default:
        return const SizedBox.shrink();
    }

    return Positioned(
      top: MediaQuery.of(context).padding.top + 8,
      left: 16,
      right: 16,
      child: GestureDetector(
        onTap: () => context.push('/transport'),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.black.withValues(alpha: 0.92),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: color.withValues(alpha: 0.4), width: 1.5),
            boxShadow: [BoxShadow(color: color.withValues(alpha: 0.3), blurRadius: 16, offset: const Offset(0, 4))],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: color.withValues(alpha: 0.15), shape: BoxShape.circle),
                child: Icon(icon, color: color, size: 20),
              ).animate(onPlay: (c) => c.repeat(reverse: true)).scale(begin: const Offset(1, 1), end: const Offset(1.1, 1.1), duration: 1.seconds),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13)),
                    const SizedBox(height: 2),
                    Text(sub, style: TextStyle(color: Colors.white.withValues(alpha: 0.6), fontSize: 11), maxLines: 1, overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              const Icon(Icons.chevron_right_rounded, color: Colors.white54, size: 20),
            ],
          ),
        ).animate().fadeIn().slideY(begin: -0.3, end: 0),
      ),
    );
  }
}

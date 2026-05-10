import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:flutter_animate/flutter_animate.dart';

class DriverRequestsScreen extends StatefulWidget {
  const DriverRequestsScreen({super.key});

  @override
  State<DriverRequestsScreen> createState() => _DriverRequestsScreenState();
}

class _DriverRequestsScreenState extends State<DriverRequestsScreen> {
  bool _isOnline = false;

  final List<Map<String, dynamic>> _mockRequests = [
    {
      'id': 'REQ-1029',
      'pickup': 'Marché Total, Bacongo',
      'dropoff': '12 Rue Alizés, Poto-Poto',
      'distance': '3.2 km',
      'price': '1500 FCFA',
      'type': 'Marketplace',
    },
    {
      'id': 'REQ-1030',
      'pickup': 'Restaurant Chez Maman',
      'dropoff': 'Plateau des 15 ans',
      'distance': '1.5 km',
      'price': '800 FCFA',
      'type': 'Food',
    }
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white54 : AppColors.textSecondaryLight;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text('Espace Livreur', style: TextStyle(color: textColor, fontWeight: FontWeight.w900)),
        centerTitle: true,
        actions: [
          Switch(
            value: _isOnline,
            activeColor: Colors.green,
            onChanged: (val) {
              setState(() => _isOnline = val);
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(val ? 'Vous êtes en ligne.' : 'Vous êtes hors ligne.')));
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: AnimatedGradientBg(
        isDark: isDark,
        child: _isOnline ? _buildOnlineView(textColor, hintColor) : _buildOfflineView(textColor),
      ),
    );
  }

  Widget _buildOfflineView(Color textColor) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(color: Colors.grey.withValues(alpha: 0.1), shape: BoxShape.circle),
            child: const Icon(Icons.power_settings_new_rounded, size: 60, color: Colors.grey),
          ),
          const SizedBox(height: 24),
          Text('Vous êtes hors ligne', style: TextStyle(color: textColor, fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('Passez en ligne pour recevoir des courses.', style: TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _buildOnlineView(Color textColor, Color hintColor) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          margin: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.green.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.green.withValues(alpha: 0.5)),
          ),
          child: Row(
            children: [
              const Icon(Icons.radar_rounded, color: Colors.green),
              const SizedBox(width: 12),
              Expanded(child: Text('Recherche de courses à proximité...', style: TextStyle(color: textColor, fontWeight: FontWeight.bold))),
            ],
          ).animate(onPlay: (ctrl) => ctrl.repeat(reverse: true)).fade(begin: 0.5, end: 1),
        ),
        
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            physics: const BouncingScrollPhysics(),
            itemCount: _mockRequests.length,
            itemBuilder: (context, index) {
              final req = _mockRequests[index];
              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: GlassContainer(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(color: AppColors.violet.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                          child: Text(req['type'], style: const TextStyle(color: AppColors.violet, fontSize: 12, fontWeight: FontWeight.bold)),
                        ),
                        Text(req['price'], style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.w900)),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        const Icon(Icons.storefront_rounded, color: Colors.grey, size: 20),
                        const SizedBox(width: 12),
                        Expanded(child: Text(req['pickup'], style: TextStyle(color: textColor, fontWeight: FontWeight.bold))),
                      ],
                    ),
                    Padding(
                      padding: const EdgeInsets.only(left: 9, top: 4, bottom: 4),
                      child: Container(width: 2, height: 20, color: Colors.grey.withValues(alpha: 0.3)),
                    ),
                    Row(
                      children: [
                        const Icon(Icons.location_on_rounded, color: Colors.redAccent, size: 20),
                        const SizedBox(width: 12),
                        Expanded(child: Text(req['dropoff'], style: TextStyle(color: textColor, fontWeight: FontWeight.bold))),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        const Icon(Icons.straighten_rounded, color: Colors.grey, size: 16),
                        const SizedBox(width: 8),
                        Text('Distance estimée: ${req['distance']}', style: TextStyle(color: hintColor, fontSize: 12)),
                      ],
                    ),
                    const SizedBox(height: 24),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () {
                              setState(() => _mockRequests.removeAt(index));
                            },
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.red,
                              side: const BorderSide(color: Colors.red),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              padding: const EdgeInsets.symmetric(vertical: 14),
                            ),
                            child: const Text('Refuser'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () {
                              context.push('/delivery/active', extra: req['id']);
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF00E5C5),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              padding: const EdgeInsets.symmetric(vertical: 14),
                            ),
                            child: const Text('Accepter', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
                    )
                  ],
                ),
              ).animate().fade().slideY(begin: 0.1, end: 0, delay: (index * 100).ms),
              );
            },
          ),
        ),
      ],
    );
  }
}

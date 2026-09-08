import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/providers/digital_services_provider.dart';

class DigitalServicesHistoryScreen extends StatefulWidget {
  const DigitalServicesHistoryScreen({super.key});

  @override
  State<DigitalServicesHistoryScreen> createState() => _DigitalServicesHistoryScreenState();
}

class _DigitalServicesHistoryScreenState extends State<DigitalServicesHistoryScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DigitalServiceProvider>().fetchHistory();
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white.withValues(alpha: 0.5) : AppColors.bgDark1.withValues(alpha: 0.5);
    final history = context.watch<DigitalServiceProvider>().history;

    return Scaffold(
      extendBody: true,
      backgroundColor: Colors.transparent,
      body: AnimatedGradientBg(
        isDark: isDark,
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => context.pop(),
                      child: const Icon(Icons.arrow_back_rounded, color: Colors.white70),
                    ),
                    const SizedBox(width: 12),
                    Text('Historique',
                        style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: textColor)),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: history.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.history_rounded, color: hintColor, size: 48),
                            const SizedBox(height: 12),
                            Text('Aucun achat pour le moment',
                                style: TextStyle(color: hintColor, fontSize: 15)),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
                        itemCount: history.length,
                        itemBuilder: (context, i) {
                          final p = history[i];
                          final name = p['provider_name'] as String? ?? p['provider_id'] as String? ?? '';
                          final amount = (p['amount'] as num?)?.toDouble() ?? 0;
                          final recipient = p['recipient'] as String? ?? '';
                          final createdAt = p['created_at'] as String? ?? '';
                          final status = p['status'] as String? ?? '';

                          return Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            child: GlassContainer(
                              padding: const EdgeInsets.all(14),
                              child: Row(
                                children: [
                                  Container(
                                    width: 42, height: 42,
                                    decoration: BoxDecoration(
                                      color: AppColors.violet.withValues(alpha: 0.2),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: const Icon(Icons.check_circle_rounded, color: AppColors.mint, size: 22),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(name,
                                            style: TextStyle(color: textColor, fontWeight: FontWeight.w700, fontSize: 14)),
                                        Text('$recipient · ${amount.toStringAsFixed(0)} F',
                                            style: const TextStyle(color: Colors.white54, fontSize: 12)),
                                        Text(createdAt.isNotEmpty ? createdAt.substring(0, 10) : '',
                                            style: const TextStyle(color: Colors.white38, fontSize: 11)),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: status == 'completed' ? AppColors.mint.withValues(alpha: 0.15) : Colors.orange.withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(status == 'completed' ? 'Réussi' : status,
                                        style: TextStyle(
                                            color: status == 'completed' ? AppColors.mint : Colors.orange,
                                            fontSize: 11,
                                            fontWeight: FontWeight.w600)),
                                  ),
                                ],
                              ),
                            ),
                          ).animate().fade(duration: 300.ms).slideX(begin: 0.05, end: 0);
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

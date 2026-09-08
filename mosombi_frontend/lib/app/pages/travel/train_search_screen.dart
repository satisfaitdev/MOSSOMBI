import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:mosombi_frontend/core/widgets/custom_loader.dart';
import 'package:mosombi_frontend/core/providers/travel_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';

class TrainSearchScreen extends StatefulWidget {
  const TrainSearchScreen({super.key});

  @override
  State<TrainSearchScreen> createState() => _TrainSearchScreenState();
}

class _TrainSearchScreenState extends State<TrainSearchScreen> {
  final _departureCtrl = TextEditingController();
  final _destinationCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _seatCtrl = TextEditingController();
  final _dateCtrl = TextEditingController();

  BusLine? _selectedLine;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TravelProvider>().fetchTrains();
    });
  }

  @override
  void dispose() {
    _departureCtrl.dispose();
    _destinationCtrl.dispose();
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _seatCtrl.dispose();
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
            MossombiSliverAppBar(title: 'Recherche Train'),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: GlassContainer(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _field('Gare départ', _departureCtrl, hintColor, textColor),
                      const SizedBox(height: 12),
                      _field('Gare destination', _destinationCtrl, hintColor, textColor),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () {
                            context.read<TravelProvider>().fetchTrains(
                              departure: _departureCtrl.text,
                              destination: _destinationCtrl.text,
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF00D4FF),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          child: const Text('Rechercher', style: TextStyle(fontWeight: FontWeight.w800)),
                        ),
                      ),
                    ],
                  ),
                ).animate().fade(duration: 500.ms),
              ),
            ),
            Consumer<TravelProvider>(
              builder: (context, tp, _) {
                if (tp.isLoading) {
                  return const SliverToBoxAdapter(child: Padding(padding: EdgeInsets.all(32), child: MosombiLoader()));
                }
                final lines = tp.busLines;
                if (lines.isEmpty) {
                  return SliverToBoxAdapter(child: Padding(
                    padding: const EdgeInsets.all(40),
                    child: Column(children: [
                      Icon(Icons.train_outlined, size: 64, color: hintColor),
                      const SizedBox(height: 16),
                      Text('Aucun train trouvé', style: TextStyle(color: hintColor, fontWeight: FontWeight.w600)),
                    ]).animate().fade(),
                  ));
                }
                return SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final line = lines[index];
                        final isSelected = _selectedLine?.id == line.id;
                        return GestureDetector(
                          onTap: () => setState(() => _selectedLine = isSelected ? null : line),
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: isSelected ? const Color(0xFF00D4FF).withValues(alpha: 0.1) : Colors.white.withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: isSelected ? const Color(0xFF00D4FF) : Colors.transparent),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(line.agency, style: TextStyle(color: textColor, fontWeight: FontWeight.w800, fontSize: 15)),
                                      const SizedBox(height: 4),
                                      Text('${line.departureCity} → ${line.destinationCity}', style: TextStyle(color: hintColor, fontSize: 13)),
                                      Text('${line.departureTime} - ${line.arrivalTime}', style: TextStyle(color: hintColor, fontSize: 12)),
                                      Text('${line.availableSeats}/${line.totalSeats} places', style: TextStyle(color: line.availableSeats > 0 ? const Color(0xFF00E5C5) : Colors.redAccent, fontSize: 12)),
                                    ],
                                  ),
                                ),
                                Text('${line.price.toStringAsFixed(0)} F', style: const TextStyle(color: Color(0xFF00D4FF), fontWeight: FontWeight.w900, fontSize: 16)),
                              ],
                            ),
                          ),
                        ).animate().fade().slideX(begin: 0.1, end: 0);
                      },
                      childCount: lines.length,
                    ),
                  ),
                );
              },
            ),
            if (_selectedLine != null)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: GlassContainer(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Réserver', style: TextStyle(color: textColor, fontWeight: FontWeight.w900, fontSize: 16)),
                        const SizedBox(height: 16),
                        _field('Nom complet', _nameCtrl, hintColor, textColor),
                        const SizedBox(height: 12),
                        _field('Téléphone', _phoneCtrl, hintColor, textColor),
                        const SizedBox(height: 12),
                        _field('Numéro siège', _seatCtrl, hintColor, textColor),
                        const SizedBox(height: 12),
                        _field('Date (YYYY-MM-DD)', _dateCtrl, hintColor, textColor),
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: () async {
                              final res = await context.read<TravelProvider>().bookTrain(
                                trainLineId: _selectedLine!.id,
                                seatNumber: _seatCtrl.text,
                                passengerName: _nameCtrl.text,
                                passengerPhone: _phoneCtrl.text,
                                departureDate: _dateCtrl.text,
                              );
                              if (res != null && mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Billet train réservé!'), backgroundColor: Color(0xFF00E5C5)),
                                );
                                setState(() => _selectedLine = null);
                              }
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF00D4FF),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            ),
                            child: const Text('Confirmer', style: TextStyle(fontWeight: FontWeight.w800)),
                          ),
                        ),
                      ],
                    ),
                  ).animate().fade().slideY(begin: 0.2, end: 0),
                ),
              ),
            const SliverToBoxAdapter(child: SizedBox(height: 60)),
          ],
        ),
      ),
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
}

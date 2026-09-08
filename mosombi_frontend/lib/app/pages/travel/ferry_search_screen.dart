import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:mosombi_frontend/core/widgets/custom_loader.dart';
import 'package:mosombi_frontend/core/providers/travel_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';

class FerrySearchScreen extends StatefulWidget {
  const FerrySearchScreen({super.key});

  @override
  State<FerrySearchScreen> createState() => _FerrySearchScreenState();
}

class _FerrySearchScreenState extends State<FerrySearchScreen> {
  final _departureCtrl = TextEditingController();
  final _destinationCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _dateCtrl = TextEditingController();
  String _cabinType = 'standard';
  BusLine? _selectedLine;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TravelProvider>().fetchFerries();
    });
  }

  @override
  void dispose() {
    _departureCtrl.dispose();
    _destinationCtrl.dispose();
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
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
            MossombiSliverAppBar(title: 'Recherche Bateau'),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: GlassContainer(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _field('Port départ', _departureCtrl, hintColor, textColor),
                      const SizedBox(height: 12),
                      _field('Port destination', _destinationCtrl, hintColor, textColor),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () {
                            context.read<TravelProvider>().fetchFerries(
                              departure: _departureCtrl.text,
                              destination: _destinationCtrl.text,
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF00E5C5),
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
                      Icon(Icons.directions_boat_outlined, size: 64, color: hintColor),
                      const SizedBox(height: 16),
                      Text('Aucune liaison bateau', style: TextStyle(color: hintColor, fontWeight: FontWeight.w600)),
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
                              color: isSelected ? const Color(0xFF00E5C5).withValues(alpha: 0.1) : Colors.white.withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: isSelected ? const Color(0xFF00E5C5) : Colors.transparent),
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
                                    ],
                                  ),
                                ),
                                Text('${line.price.toStringAsFixed(0)} F', style: const TextStyle(color: Color(0xFF00E5C5), fontWeight: FontWeight.w900, fontSize: 16)),
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
                        _field('Date (YYYY-MM-DD)', _dateCtrl, hintColor, textColor),
                        const SizedBox(height: 12),
                        Row(
                          children: ['standard', 'VIP', 'suite'].map((c) {
                            final selected = _cabinType == c;
                            return Expanded(
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 4),
                                child: ChoiceChip(
                                  label: Text(c == 'standard' ? 'Standard' : c == 'VIP' ? 'VIP' : 'Suite',
                                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: selected ? Colors.white : hintColor)),
                                  selected: selected,
                                  onSelected: (_) => setState(() => _cabinType = c),
                                  selectedColor: const Color(0xFF00E5C5),
                                  backgroundColor: Colors.transparent,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: selected ? const Color(0xFF00E5C5) : hintColor.withValues(alpha: 0.3))),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: () async {
                              final res = await context.read<TravelProvider>().bookFerry(
                                ferryLineId: _selectedLine!.id,
                                cabinType: _cabinType,
                                passengerName: _nameCtrl.text,
                                passengerPhone: _phoneCtrl.text,
                                departureDate: _dateCtrl.text,
                              );
                              if (res != null && mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Billet bateau réservé!'), backgroundColor: Color(0xFF00E5C5)),
                                );
                                setState(() => _selectedLine = null);
                              }
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF00E5C5),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            ),
                            child: const Text('Réserver', style: TextStyle(fontWeight: FontWeight.w800)),
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

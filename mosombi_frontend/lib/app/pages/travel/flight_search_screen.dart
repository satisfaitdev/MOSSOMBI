import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:mosombi_frontend/core/widgets/custom_loader.dart';
import 'package:mosombi_frontend/core/providers/travel_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';

class FlightSearchScreen extends StatefulWidget {
  const FlightSearchScreen({super.key});

  @override
  State<FlightSearchScreen> createState() => _FlightSearchScreenState();
}

class _FlightSearchScreenState extends State<FlightSearchScreen> {
  final _fromCtrl = TextEditingController();
  final _toCtrl = TextEditingController();
  final _dateCtrl = TextEditingController();
  final _returnCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _flightNoCtrl = TextEditingController();
  final _airlineCtrl = TextEditingController();
  final _priceCtrl = TextEditingController();
  String _seatClass = 'economy';

  @override
  void dispose() {
    _fromCtrl.dispose();
    _toCtrl.dispose();
    _dateCtrl.dispose();
    _returnCtrl.dispose();
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _flightNoCtrl.dispose();
    _airlineCtrl.dispose();
    _priceCtrl.dispose();
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
            MossombiSliverAppBar(title: 'Réservation Vol'),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: GlassContainer(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Rechercher un vol', style: TextStyle(color: textColor, fontWeight: FontWeight.w900, fontSize: 16)),
                      const SizedBox(height: 16),
                      _field('Ville de départ', _fromCtrl, hintColor, textColor),
                      const SizedBox(height: 12),
                      _field('Ville de destination', _toCtrl, hintColor, textColor),
                      const SizedBox(height: 12),
                      _field('Date départ (YYYY-MM-DD)', _dateCtrl, hintColor, textColor),
                      const SizedBox(height: 12),
                      _field('Date retour (optionnel)', _returnCtrl, hintColor, textColor),
                      const SizedBox(height: 12),
                      _field('Numéro de vol', _flightNoCtrl, hintColor, textColor),
                      const SizedBox(height: 12),
                      _field('Compagnie', _airlineCtrl, hintColor, textColor),
                      const SizedBox(height: 12),
                      _field('Prix', _priceCtrl, hintColor, textColor),
                      const SizedBox(height: 12),
                      Row(
                        children: ['economy', 'business', 'first'].map((c) {
                          final selected = _seatClass == c;
                          return Expanded(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 4),
                              child: ChoiceChip(
                                label: Text(c == 'economy' ? 'Éco' : c == 'business' ? 'Affaires' : 'Première', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: selected ? Colors.white : hintColor)),
                                selected: selected,
                                onSelected: (_) => setState(() => _seatClass = c),
                                selectedColor: AppColors.violet,
                                backgroundColor: Colors.transparent,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: selected ? AppColors.violet : hintColor.withValues(alpha: 0.3))),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () {
                            context.read<TravelProvider>().searchFlights(
                              departure: _fromCtrl.text,
                              destination: _toCtrl.text,
                              date: _dateCtrl.text,
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.violet,
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
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: GlassContainer(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Informations passager', style: TextStyle(color: textColor, fontWeight: FontWeight.w900, fontSize: 16)),
                      const SizedBox(height: 16),
                      _field('Nom complet', _nameCtrl, hintColor, textColor),
                      const SizedBox(height: 12),
                      _field('Email', _emailCtrl, hintColor, textColor),
                      const SizedBox(height: 12),
                      _field('Téléphone', _phoneCtrl, hintColor, textColor),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () async {
                            final res = await context.read<TravelProvider>().bookFlight(
                              flightNumber: _flightNoCtrl.text,
                              airline: _airlineCtrl.text,
                              departureCity: _fromCtrl.text,
                              destinationCity: _toCtrl.text,
                              departureDate: _dateCtrl.text,
                              returnDate: _returnCtrl.text.isNotEmpty ? _returnCtrl.text : null,
                              passengerName: _nameCtrl.text,
                              passengerPhone: _phoneCtrl.text,
                              passengerEmail: _emailCtrl.text,
                              seatClass: _seatClass,
                              price: double.tryParse(_priceCtrl.text) ?? 0,
                            );
                            if (res != null && mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Vol réservé!'), backgroundColor: Color(0xFF00E5C5)),
                              );
                            }
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFFF9800),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          child: const Text('Réserver le vol', style: TextStyle(fontWeight: FontWeight.w800)),
                        ),
                      ),
                    ],
                  ),
                ).animate().fade(delay: 100.ms),
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

import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:mosombi_frontend/core/widgets/custom_loader.dart';
import 'package:mosombi_frontend/core/providers/travel_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';

class CarRentalScreen extends StatefulWidget {
  const CarRentalScreen({super.key});

  @override
  State<CarRentalScreen> createState() => _CarRentalScreenState();
}

class _CarRentalScreenState extends State<CarRentalScreen> {
  final _cityCtrl = TextEditingController();
  final _pickupCtrl = TextEditingController();
  final _returnCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  bool _withDriver = false;
  Vehicle? _selectedVehicle;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TravelProvider>().fetchVehicles();
    });
  }

  @override
  void dispose() {
    _cityCtrl.dispose();
    _pickupCtrl.dispose();
    _returnCtrl.dispose();
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
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
            MossombiSliverAppBar(title: 'Location Voiture'),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: GlassContainer(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _field('Ville', _cityCtrl, hintColor, textColor),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () {
                            context.read<TravelProvider>().fetchVehicles(city: _cityCtrl.text);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF4CAF50),
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
                if (tp.vehicles.isEmpty) {
                  return SliverToBoxAdapter(child: Padding(
                    padding: const EdgeInsets.all(40),
                    child: Column(children: [
                      Icon(Icons.directions_car_outlined, size: 64, color: hintColor),
                      const SizedBox(height: 16),
                      Text('Aucun véhicule trouvé', style: TextStyle(color: hintColor, fontWeight: FontWeight.w600)),
                    ]).animate().fade(),
                  ));
                }
                return SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final v = tp.vehicles[index];
                        final isSelected = _selectedVehicle?.id == v.id;
                        return GestureDetector(
                          onTap: () => setState(() => _selectedVehicle = isSelected ? null : v),
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: isSelected ? const Color(0xFF4CAF50).withValues(alpha: 0.1) : Colors.white.withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: isSelected ? const Color(0xFF4CAF50) : Colors.transparent),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 60, height: 60,
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Icon(Icons.directions_car_rounded, color: const Color(0xFF4CAF50), size: 32),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(v.vehicleName, style: TextStyle(color: textColor, fontWeight: FontWeight.w800, fontSize: 15)),
                                      const SizedBox(height: 4),
                                      Text('${v.vehicleType} · ${v.transmission} · ${v.seats} places', style: TextStyle(color: hintColor, fontSize: 12)),
                                    ],
                                  ),
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text('${v.pricePerDay.toStringAsFixed(0)} F', style: const TextStyle(color: Color(0xFF4CAF50), fontWeight: FontWeight.w900, fontSize: 15)),
                                    Text('/jour', style: TextStyle(color: hintColor, fontSize: 11)),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ).animate().fade().slideX(begin: 0.1, end: 0);
                      },
                      childCount: tp.vehicles.length,
                    ),
                  ),
                );
              },
            ),
            if (_selectedVehicle != null)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: GlassContainer(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Réserver ${_selectedVehicle!.vehicleName}', style: TextStyle(color: textColor, fontWeight: FontWeight.w900, fontSize: 16)),
                        const SizedBox(height: 16),
                        _field('Date prise en charge (YYYY-MM-DD)', _pickupCtrl, hintColor, textColor),
                        const SizedBox(height: 12),
                        _field('Date retour (YYYY-MM-DD)', _returnCtrl, hintColor, textColor),
                        const SizedBox(height: 12),
                        _field('Nom conducteur', _nameCtrl, hintColor, textColor),
                        const SizedBox(height: 12),
                        _field('Téléphone', _phoneCtrl, hintColor, textColor),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            const Text('Avec chauffeur', style: TextStyle(fontWeight: FontWeight.w600)),
                            const Spacer(),
                            Switch(
                              value: _withDriver,
                              onChanged: (v) => setState(() => _withDriver = v),
                              activeColor: const Color(0xFF4CAF50),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: () async {
                              final res = await context.read<TravelProvider>().bookVehicle(
                                vehicleId: _selectedVehicle!.id,
                                pickupDate: _pickupCtrl.text,
                                returnDate: _returnCtrl.text,
                                driverName: _nameCtrl.text,
                                driverPhone: _phoneCtrl.text,
                                withDriver: _withDriver,
                              );
                              if (res != null && mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Véhicule réservé!'), backgroundColor: Color(0xFF4CAF50)),
                                );
                                setState(() => _selectedVehicle = null);
                              }
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF4CAF50),
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

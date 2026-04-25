import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/theme/app_gradients.dart';

class TaxiSubscriptionScreen extends StatefulWidget {
  const TaxiSubscriptionScreen({super.key});

  @override
  State<TaxiSubscriptionScreen> createState() => _TaxiSubscriptionScreenState();
}

class _TaxiSubscriptionScreenState extends State<TaxiSubscriptionScreen> {
  int _selectedDurationIndex = 2; // Default to 1 Mois
  int _selectedTripsPerDay = 2; // Default to 2 (Aller/Retour)
  TimeOfDay? _pickupTime = const TimeOfDay(hour: 7, minute: 30);
  TimeOfDay? _returnTime = const TimeOfDay(hour: 17, minute: 30);
  
  final _pickupController = TextEditingController(text: 'Domicile (Moungali)');
  final _dropoffController = TextEditingController(text: 'Travail (Poto-Poto)');

  final List<String> _durations = ['1 Semaine', '2 Semaines', '1 Mois', '2 Mois'];
  final List<int> _durationsDays = [7, 14, 30, 60];

  double get _calculatedPrice {
    // Flat rate logic for simulation
    int days = _durationsDays[_selectedDurationIndex];
    int trips = _selectedTripsPerDay == 0 ? 4 : _selectedTripsPerDay; // 0 = illimité, mock at 4
    double baseTripCost = 1500; // Base taxi share price
    
    // Discount based on subscription length
    double discount = _selectedDurationIndex * 0.10; // Max 30% discount
    return (baseTripCost * trips * days) * (1 - discount);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? AppColors.bgDark1 : Colors.white;
    final textColor = isDark ? Colors.white : AppColors.textPrimaryLight;

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: textColor),
          onPressed: () => context.pop(),
        ),
        title: Text('Abonnement VTC', style: TextStyle(color: textColor, fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Duration Selection
            Text('Durée de l\'abonnement', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            SizedBox(
              height: 100,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _durations.length,
                separatorBuilder: (c, i) => const SizedBox(width: 12),
                itemBuilder: (context, index) {
                  final isSelected = _selectedDurationIndex == index;
                  return GestureDetector(
                    onTap: () => setState(() => _selectedDurationIndex = index),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      width: 100,
                      decoration: BoxDecoration(
                        gradient: isSelected ? AppGradients.primary : null,
                        color: isSelected ? null : (isDark ? AppColors.surfaceDark : Colors.grey[100]),
                        borderRadius: BorderRadius.circular(20),
                        border: isSelected ? null : Border.all(color: isDark ? Colors.white12 : Colors.black12),
                      ),
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.calendar_month_rounded, color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.black54), size: 28),
                          const SizedBox(height: 8),
                          Text(_durations[index], textAlign: TextAlign.center, style: TextStyle(color: isSelected ? Colors.white : (isDark ? Colors.white : Colors.black87), fontWeight: FontWeight.bold, fontSize: 13)),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ).animate().slideX(begin: 0.1, duration: 400.ms),

            const SizedBox(height: 32),

            // Itinerary / Addresses
            Text('Trajet quotidien habituel', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            _buildTextField('Point de départ', Icons.my_location_rounded, _pickupController, isDark),
            const SizedBox(height: 12),
            _buildTextField('Point d\'arrivée', Icons.flag_rounded, _dropoffController, isDark, iconColor: const Color(0xFFFF6584)),

            const SizedBox(height: 32),

            // Time Schedules
            Text('Vos horaires habituels', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: _buildTimePicker('Alerte Aller', _pickupTime, (t) => setState(() => _pickupTime = t), isDark)),
                const SizedBox(width: 16),
                Expanded(child: _buildTimePicker('Alerte Retour', _returnTime, (t) => setState(() => _returnTime = t), isDark)),
              ],
            ).animate().fadeIn(delay: 200.ms),

            const SizedBox(height: 32),

            // Trips per day
            Text('Trajets par jour', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Row(
              children: [
                _buildTripChip(1, '1 Trajet', isDark),
                const SizedBox(width: 8),
                _buildTripChip(2, 'Aller/Retour', isDark),
                const SizedBox(width: 8),
                _buildTripChip(0, 'Illimité', isDark),
              ],
            ),

            const SizedBox(height: 48),

            // Price Summary
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: isDark ? AppColors.surfaceDark : Colors.grey[50],
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppColors.violet.withValues(alpha: 0.3)),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Tarif estimé', style: TextStyle(color: isDark ? Colors.white70 : Colors.black54)),
                      Text('${_calculatedPrice.toStringAsFixed(0)} FCFA', style: TextStyle(color: textColor, fontSize: 24, fontWeight: FontWeight.w900)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Row(
                    children: [
                      Icon(Icons.local_offer_rounded, color: Color(0xFF00E5C5), size: 16),
                      SizedBox(width: 8),
                      Text('Réduction abonnement appliquée', style: TextStyle(color: Color(0xFF00E5C5), fontSize: 12, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ],
              ),
            ).animate().slideY(begin: 0.2, duration: 400.ms),

            const SizedBox(height: 32),

            // Submit Button
            ElevatedButton(
              onPressed: () {
                // TODO: Link to Wallet/Payment
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Redirection vers le paiement Wallet...')),
                );
              },
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(double.infinity, 56),
                backgroundColor: AppColors.violet,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              ),
              child: const Text('Payer l\'abonnement', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTripChip(int value, String label, bool isDark) {
    final isSelected = _selectedTripsPerDay == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedTripsPerDay = value),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFF00E5C5).withValues(alpha: 0.2) : (isDark ? AppColors.surfaceDark : Colors.grey[100]),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: isSelected ? const Color(0xFF00E5C5) : Colors.transparent),
          ),
          child: Center(
            child: Text(label, style: TextStyle(
              color: isSelected ? const Color(0xFF00E5C5) : (isDark ? Colors.white60 : Colors.black54),
              fontWeight: FontWeight.bold,
              fontSize: 12,
            )),
          ),
        ),
      ),
    );
  }

  Widget _buildTextField(String hint, IconData icon, TextEditingController controller, bool isDark, {Color? iconColor}) {
    return TextField(
      controller: controller,
      style: TextStyle(color: isDark ? Colors.white : Colors.black),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: isDark ? Colors.white54 : Colors.black45),
        prefixIcon: Icon(icon, color: iconColor ?? AppColors.violet),
        filled: true,
        fillColor: isDark ? AppColors.surfaceDark : Colors.grey[100],
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
      ),
    );
  }

  Widget _buildTimePicker(String label, TimeOfDay? time, ValueChanged<TimeOfDay?> onTimeChanged, bool isDark) {
    return GestureDetector(
      onTap: () async {
        final newTime = await showTimePicker(context: context, initialTime: time ?? TimeOfDay.now());
        if (newTime != null) onTimeChanged(newTime);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: BoxDecoration(
          color: isDark ? AppColors.surfaceDark : Colors.grey[100],
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: TextStyle(color: isDark ? Colors.white54 : Colors.black45, fontSize: 12)),
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(Icons.access_time_filled_rounded, color: AppColors.violet, size: 18),
                const SizedBox(width: 8),
                Text(time?.format(context) ?? '--:--', style: TextStyle(color: isDark ? Colors.white : Colors.black, fontWeight: FontWeight.bold, fontSize: 16)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

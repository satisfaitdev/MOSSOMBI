import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/theme/app_gradients.dart';
import 'package:mosombi_frontend/core/network/api_client.dart';
import 'package:mosombi_frontend/core/providers/wallet_provider.dart';

class TaxiSubscriptionScreen extends StatefulWidget {
  const TaxiSubscriptionScreen({super.key});

  @override
  State<TaxiSubscriptionScreen> createState() => _TaxiSubscriptionScreenState();
}

class _TaxiSubscriptionScreenState extends State<TaxiSubscriptionScreen> {
  final ApiClient _apiClient = ApiClient();

  List<Map<String, dynamic>> _plans = [];
  int _selectedPlanIndex = 0;
  bool _loading = true;
  bool _subscribing = false;

  TimeOfDay? _pickupTime = const TimeOfDay(hour: 7, minute: 30);
  TimeOfDay? _returnTime = const TimeOfDay(hour: 17, minute: 30);

  final _pickupController = TextEditingController(text: 'Domicile (Moungali)');
  final _dropoffController = TextEditingController(text: 'Travail (Poto-Poto)');

  @override
  void initState() {
    super.initState();
    _fetchPlans();
  }

  Future<void> _fetchPlans() async {
    try {
      final response = await _apiClient.dio.get('/taxi/plans');
      if (response.statusCode == 200 && response.data['success'] == true) {
        final List data = response.data['data'] ?? [];
        setState(() {
          _plans = data.cast<Map<String, dynamic>>();
          _loading = false;
        });
      }
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _subscribe() async {
    if (_plans.isEmpty) return;
    setState(() => _subscribing = true);

    final plan = _plans[_selectedPlanIndex];
    try {
      final response = await _apiClient.dio.post('/taxi/subscriptions', data: {
        'plan_id': plan['id'],
        'pickup_address': _pickupController.text,
        'dropoff_address': _dropoffController.text,
        'schedule': {
          'pickup_time': _pickupTime?.format(context) ?? '07:30',
          'return_time': _returnTime?.format(context) ?? '17:30',
        },
      });

      if (response.statusCode == 201 && response.data['success'] == true) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('Abonnement souscrit avec succès!'),
              backgroundColor: const Color(0xFF00E5C5),
            ),
          );
          context.pop();
        }
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur: ${e.toString()}'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _subscribing = false);
    }
  }

  @override
  void dispose() {
    _pickupController.dispose();
    _dropoffController.dispose();
    super.dispose();
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
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Choisissez votre formule', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  ..._plans.asMap().entries.map((entry) {
                    final i = entry.key;
                    final plan = entry.value;
                    final isSelected = _selectedPlanIndex == i;
                    final price = double.tryParse(plan['price']?.toString() ?? '0') ?? 0;
                    final ridesPerDay = plan['rides_per_day'] as int? ?? 0;
                    return GestureDetector(
                      onTap: () => setState(() => _selectedPlanIndex = i),
                      child: AnimatedContainer(
                        duration: 300.ms,
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          gradient: isSelected ? AppGradients.primary : null,
                          color: isSelected ? null : (isDark ? AppColors.surfaceDark : Colors.grey[100]),
                          borderRadius: BorderRadius.circular(20),
                          border: isSelected ? null : Border.all(color: isDark ? Colors.white12 : Colors.black12),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(plan['name']?.toString() ?? '', style: TextStyle(
                                    color: isSelected ? Colors.white : (isDark ? Colors.white : Colors.black87),
                                    fontWeight: FontWeight.bold, fontSize: 15,
                                  )),
                                  const SizedBox(height: 4),
                                  Text(
                                    ridesPerDay == 0 ? 'Trajets illimités / jour' : '$ridesPerDay trajet(s) / jour',
                                    style: TextStyle(color: isSelected ? Colors.white70 : (isDark ? Colors.white54 : Colors.black45), fontSize: 12),
                                  ),
                                ],
                              ),
                            ),
                            Text('${price.toStringAsFixed(0)} FCFA', style: TextStyle(
                              color: isSelected ? Colors.white : const Color(0xFF00E5C5),
                              fontWeight: FontWeight.w900, fontSize: 18,
                            )),
                          ],
                        ),
                      ),
                    );
                  }),

                  const SizedBox(height: 24),
                  Text('Trajet quotidien habituel', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  _buildTextField('Point de départ', Icons.my_location_rounded, _pickupController, isDark),
                  const SizedBox(height: 12),
                  _buildTextField('Point d\'arrivée', Icons.flag_rounded, _dropoffController, isDark, iconColor: const Color(0xFFFF6584)),

                  const SizedBox(height: 24),
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
                  ElevatedButton(
                    onPressed: _subscribing ? null : _subscribe,
                    style: ElevatedButton.styleFrom(
                      minimumSize: const Size(double.infinity, 56),
                      backgroundColor: AppColors.violet,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    ),
                    child: _subscribing
                        ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Text('Souscrire à l\'abonnement', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16)),
                  ),
                ],
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

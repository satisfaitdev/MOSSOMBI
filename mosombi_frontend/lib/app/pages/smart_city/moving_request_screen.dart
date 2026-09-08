import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:mosombi_frontend/core/providers/smart_city_provider.dart';
import 'package:flutter_animate/flutter_animate.dart';

class MovingRequestScreen extends StatefulWidget {
  const MovingRequestScreen({super.key});

  @override
  State<MovingRequestScreen> createState() => _MovingRequestScreenState();
}

class _MovingRequestScreenState extends State<MovingRequestScreen> {
  final TextEditingController _fromController = TextEditingController();
  final TextEditingController _toController = TextEditingController();
  final TextEditingController _volumeController = TextEditingController();
  final TextEditingController _notesController = TextEditingController();
  DateTime? _selectedDate;
  bool _isSubmitting = false;

  Future<void> _pickDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date != null) setState(() => _selectedDate = date);
  }

  Future<void> _submit() async {
    if (_fromController.text.trim().isEmpty || _toController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Veuillez remplir les adresses'), backgroundColor: Colors.orange));
      return;
    }

    setState(() => _isSubmitting = true);

    final data = <String, dynamic>{
      'from_address': _fromController.text,
      'to_address': _toController.text,
      if (_selectedDate != null) 'date': _selectedDate!.toIso8601String(),
      if (_volumeController.text.isNotEmpty) 'volume_estimate': _volumeController.text,
      if (_notesController.text.isNotEmpty) 'notes': _notesController.text,
    };

    final success = await context.read<SmartCityProvider>().requestMovingQuote(data);
    setState(() => _isSubmitting = false);

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Devis déménagement soumis avec succès !'), backgroundColor: Colors.green));
        context.pop();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Erreur lors de la soumission'), backgroundColor: Colors.red));
      }
    }
  }

  @override
  void dispose() {
    _fromController.dispose();
    _toController.dispose();
    _volumeController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white54 : AppColors.textSecondaryLight;

    return Scaffold(
      extendBodyBehindAppBar: true,
      body: AnimatedGradientBg(
        isDark: isDark,
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            const MossombiSliverAppBar(title: 'Déménagement'),
            SliverPadding(
              padding: const EdgeInsets.all(20),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  GlassContainer(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.local_shipping_rounded, size: 48, color: AppColors.coral),
                        const SizedBox(height: 12),
                        Text('Demande de devis déménagement', style: TextStyle(color: textColor, fontSize: 20, fontWeight: FontWeight.w800)),
                        const SizedBox(height: 4),
                        Text('Remplissez le formulaire pour recevoir un devis', style: TextStyle(color: hintColor, fontSize: 14)),
                      ],
                    ),
                  ).animate().fade().slideY(begin: -0.1),

                  const SizedBox(height: 20),

                  _buildField('Adresse de départ', Icons.trip_origin_rounded, _fromController, textColor, hintColor),
                  const SizedBox(height: 16),
                  _buildField('Adresse de destination', Icons.location_on_rounded, _toController, textColor, hintColor),
                  const SizedBox(height: 16),

                  GestureDetector(
                    onTap: _pickDate,
                    child: GlassContainer(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      child: Row(
                        children: [
                          const Icon(Icons.calendar_today_rounded, color: AppColors.violet),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              _selectedDate != null
                                  ? '${_selectedDate!.day}/${_selectedDate!.month}/${_selectedDate!.year}'
                                  : 'Date souhaitée (optionnelle)',
                              style: TextStyle(color: _selectedDate != null ? textColor : hintColor, fontSize: 15),
                            ),
                          ),
                          if (_selectedDate != null)
                            IconButton(
                              icon: const Icon(Icons.clear, size: 18),
                              onPressed: () => setState(() => _selectedDate = null),
                            ),
                        ],
                      ),
                    ),
                  ).animate().fade(),

                  const SizedBox(height: 16),
                  _buildField('Volume estimé (m³, optionnel)', Icons.straighten_rounded, _volumeController, textColor, hintColor, keyboardType: TextInputType.number),
                  const SizedBox(height: 16),
                  _buildField('Notes (optionnel)', Icons.notes_rounded, _notesController, textColor, hintColor, maxLines: 3),

                  const SizedBox(height: 32),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _isSubmitting ? null : _submit,
                      icon: _isSubmitting
                          ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Icon(Icons.send_rounded, color: Colors.white),
                      label: Text(_isSubmitting ? 'Envoi...' : 'Soumettre la demande', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.coral,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                    ),
                  ).animate().fade().slideY(begin: 0.1),

                  const SizedBox(height: 40),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildField(String label, IconData icon, TextEditingController controller, Color textColor, Color hintColor, {TextInputType? keyboardType, int maxLines = 1}) {
    return GlassContainer(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: TextField(
        controller: controller,
        style: TextStyle(color: textColor),
        keyboardType: keyboardType,
        maxLines: maxLines,
        decoration: InputDecoration(
          labelText: label,
          labelStyle: TextStyle(color: hintColor),
          icon: Icon(icon, color: AppColors.violet),
          border: InputBorder.none,
        ),
      ),
    );
  }
}

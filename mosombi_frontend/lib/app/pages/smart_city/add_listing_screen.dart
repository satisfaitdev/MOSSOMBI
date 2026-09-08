import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:mosombi_frontend/core/providers/smart_city_provider.dart';
import 'package:flutter_animate/flutter_animate.dart';

class AddListingScreen extends StatefulWidget {
  const AddListingScreen({super.key});

  @override
  State<AddListingScreen> createState() => _AddListingScreenState();
}

class _AddListingScreenState extends State<AddListingScreen> {
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _priceController = TextEditingController();
  final TextEditingController _cityController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();
  final TextEditingController _surfaceController = TextEditingController();
  final TextEditingController _roomsController = TextEditingController();
  final TextEditingController _bedroomsController = TextEditingController();
  final TextEditingController _bathroomsController = TextEditingController();

  String _selectedType = 'apartment';
  String _selectedTransaction = 'rent';
  bool _isSubmitting = false;

  static const List<Map<String, String>> _types = [
    {'value': 'apartment', 'label': 'Appartement'},
    {'value': 'house', 'label': 'Maison'},
    {'value': 'villa', 'label': 'Villa'},
    {'value': 'land', 'label': 'Terrain'},
    {'value': 'commercial', 'label': 'Commercial'},
  ];

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _priceController.dispose();
    _cityController.dispose();
    _addressController.dispose();
    _surfaceController.dispose();
    _roomsController.dispose();
    _bedroomsController.dispose();
    _bathroomsController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_titleController.text.trim().isEmpty || _priceController.text.trim().isEmpty || _cityController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Veuillez remplir les champs obligatoires'), backgroundColor: Colors.orange));
      return;
    }

    setState(() => _isSubmitting = true);

    final data = <String, dynamic>{
      'type': _selectedType,
      'transaction': _selectedTransaction,
      'title': _titleController.text,
      'description': _descriptionController.text,
      'price': double.tryParse(_priceController.text) ?? 0,
      'city': _cityController.text,
      'address': _addressController.text,
      if (_surfaceController.text.isNotEmpty) 'surface': double.tryParse(_surfaceController.text) ?? 0,
      if (_roomsController.text.isNotEmpty) 'rooms': int.tryParse(_roomsController.text) ?? 0,
      if (_bedroomsController.text.isNotEmpty) 'bedrooms': int.tryParse(_bedroomsController.text) ?? 0,
      if (_bathroomsController.text.isNotEmpty) 'bathrooms': int.tryParse(_bathroomsController.text) ?? 0,
    };

    final success = await context.read<SmartCityProvider>().createListing(data);
    setState(() => _isSubmitting = false);

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Annonce créée !'), backgroundColor: Colors.green));
        context.pop();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Erreur lors de la création'), backgroundColor: Colors.red));
      }
    }
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
            const MossombiSliverAppBar(title: 'Nouvelle annonce'),
            SliverPadding(
              padding: const EdgeInsets.all(20),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  GlassContainer(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.add_home_work_rounded, size: 48, color: AppColors.violet),
                        const SizedBox(height: 12),
                        Text('Publier une annonce', style: TextStyle(color: textColor, fontSize: 20, fontWeight: FontWeight.w800)),
                        Text('Remplissez les informations du bien', style: TextStyle(color: hintColor, fontSize: 14)),
                      ],
                    ),
                  ).animate().fade().slideY(begin: -0.1),

                  const SizedBox(height: 20),

                  Text('Type de bien', style: TextStyle(color: textColor, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _types.map((t) {
                      final selected = _selectedType == t['value'];
                      return ChoiceChip(
                        label: Text(t['label']!, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: selected ? Colors.white : textColor)),
                        selected: selected,
                        selectedColor: AppColors.violet,
                        backgroundColor: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.04),
                        onSelected: (_) => setState(() => _selectedType = t['value']!),
                      );
                    }).toList(),
                  ),

                  const SizedBox(height: 16),
                  Text('Transaction', style: TextStyle(color: textColor, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      ChoiceChip(
                        label: const Text('Location', style: TextStyle(fontWeight: FontWeight.w600)),
                        selected: _selectedTransaction == 'rent',
                        selectedColor: AppColors.violet,
                        labelStyle: TextStyle(color: _selectedTransaction == 'rent' ? Colors.white : textColor),
                        onSelected: (_) => setState(() => _selectedTransaction = 'rent'),
                      ),
                      const SizedBox(width: 8),
                      ChoiceChip(
                        label: const Text('Vente', style: TextStyle(fontWeight: FontWeight.w600)),
                        selected: _selectedTransaction == 'sell',
                        selectedColor: AppColors.coral,
                        labelStyle: TextStyle(color: _selectedTransaction == 'sell' ? Colors.white : textColor),
                        onSelected: (_) => setState(() => _selectedTransaction = 'sell'),
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  _buildField('Titre *', _titleController, textColor, hintColor),
                  const SizedBox(height: 16),
                  _buildField('Description', _descriptionController, textColor, hintColor, maxLines: 3),
                  const SizedBox(height: 16),
                  _buildField('Prix (FCFA) *', _priceController, textColor, hintColor, keyboardType: TextInputType.number),
                  const SizedBox(height: 16),
                  _buildField('Ville *', _cityController, textColor, hintColor),
                  const SizedBox(height: 16),
                  _buildField('Adresse', _addressController, textColor, hintColor),

                  const SizedBox(height: 20),
                  Text('Caractéristiques (optionnel)', style: TextStyle(color: textColor, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: _buildField('Surface (m²)', _surfaceController, textColor, hintColor, keyboardType: TextInputType.number)),
                      const SizedBox(width: 12),
                      Expanded(child: _buildField('Pièces', _roomsController, textColor, hintColor, keyboardType: TextInputType.number)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: _buildField('Chambres', _bedroomsController, textColor, hintColor, keyboardType: TextInputType.number)),
                      const SizedBox(width: 12),
                      Expanded(child: _buildField('Salles de bain', _bathroomsController, textColor, hintColor, keyboardType: TextInputType.number)),
                    ],
                  ),

                  const SizedBox(height: 32),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _isSubmitting ? null : _submit,
                      icon: _isSubmitting
                          ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Icon(Icons.publish_rounded, color: Colors.white),
                      label: Text(_isSubmitting ? 'Publication...' : 'Publier l\'annonce', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.violet,
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

  Widget _buildField(String label, TextEditingController controller, Color textColor, Color hintColor, {TextInputType? keyboardType, int maxLines = 1}) {
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
          border: InputBorder.none,
        ),
      ),
    );
  }
}

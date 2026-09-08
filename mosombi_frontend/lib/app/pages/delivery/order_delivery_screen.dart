import 'package:flutter/material.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:mosombi_frontend/core/network/api_client.dart';
import 'package:flutter_animate/flutter_animate.dart';

class OrderDeliveryScreen extends StatefulWidget {
  const OrderDeliveryScreen({super.key});

  @override
  State<OrderDeliveryScreen> createState() => _OrderDeliveryScreenState();
}

class _OrderDeliveryScreenState extends State<OrderDeliveryScreen> {
  final ApiClient _apiClient = ApiClient();
  final TextEditingController _pickupController = TextEditingController();
  final TextEditingController _dropoffController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  String _selectedType = 'colis';
  bool _isSubmitting = false;

  List<Map<String, dynamic>> _myOrders = [];
  bool _isLoadingOrders = false;

  Future<void> _submit() async {
    if (_pickupController.text.trim().isEmpty || _dropoffController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Veuillez remplir les adresses'), backgroundColor: Colors.orange));
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final response = await _apiClient.dio.post('/deliveries/order', data: {
        'type': _selectedType,
        'pickup_address': _pickupController.text,
        'dropoff_address': _dropoffController.text,
        'description': _descriptionController.text,
      });

      if (response.statusCode == 201 && response.data['success'] == true) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Commande de livraison créée !'),
            backgroundColor: Colors.green,
          ));
          _pickupController.clear();
          _dropoffController.clear();
          _descriptionController.clear();
          _fetchMyOrders();
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Erreur lors de la création'),
          backgroundColor: Colors.red,
        ));
      }
    }

    setState(() => _isSubmitting = false);
  }

  Future<void> _fetchMyOrders() async {
    setState(() => _isLoadingOrders = true);
    try {
      final response = await _apiClient.dio.get('/deliveries/my-orders');
      if (response.statusCode == 200 && response.data['success'] == true) {
        final List data = response.data['data'] ?? [];
        _myOrders = data.map((e) => e as Map<String, dynamic>).toList();
      }
    } catch (e) {
      debugPrint('Error fetching my orders: $e');
    }
    setState(() => _isLoadingOrders = false);
  }

  Future<void> _cancelOrder(String id) async {
    try {
      final response = await _apiClient.dio.post('/deliveries/my-orders/$id/cancel');
      if (response.statusCode == 200 && response.data['success'] == true) {
        _fetchMyOrders();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Commande annulée'), backgroundColor: Colors.green));
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Erreur lors de l\'annulation'), backgroundColor: Colors.red));
      }
    }
  }

  @override
  void initState() {
    super.initState();
    _fetchMyOrders();
  }

  @override
  void dispose() {
    _pickupController.dispose();
    _dropoffController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white54 : AppColors.textSecondaryLight;

    final typeLabels = {'gaz': 'Gaz', 'colis': 'Colis', 'moving': 'Déménagement'};
    final typeIcons = {'gaz': Icons.local_fire_department_rounded, 'colis': Icons.inventory_2_rounded, 'moving': Icons.local_shipping_rounded};
    final statusLabels = {'pending': 'En attente', 'assigned': 'Assigné', 'picked_up': 'Récupéré', 'in_transit': 'En transit', 'delivered': 'Livré', 'cancelled': 'Annulé'};

    return Scaffold(
      extendBodyBehindAppBar: true,
      body: AnimatedGradientBg(
        isDark: isDark,
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            const MossombiSliverAppBar(title: 'Commander une livraison'),
            SliverPadding(
              padding: const EdgeInsets.all(20),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  Text('Type de livraison', style: TextStyle(color: textColor, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _TypeCard(type: 'gaz', label: 'Gaz', icon: Icons.local_fire_department_rounded, selectedType: _selectedType, isDark: isDark, textColor: textColor, onTap: () => setState(() => _selectedType = 'gaz')),
                      const SizedBox(width: 12),
                      _TypeCard(type: 'colis', label: 'Colis', icon: Icons.inventory_2_rounded, selectedType: _selectedType, isDark: isDark, textColor: textColor, onTap: () => setState(() => _selectedType = 'colis')),
                      const SizedBox(width: 12),
                      _TypeCard(type: 'moving', label: 'Déménagement', icon: Icons.local_shipping_rounded, selectedType: _selectedType, isDark: isDark, textColor: textColor, onTap: () => setState(() => _selectedType = 'moving')),
                    ],
                  ),
                  const SizedBox(height: 24),

                  _buildField('Adresse de ramassage', _pickupController, textColor, hintColor),
                  const SizedBox(height: 16),
                  _buildField('Adresse de livraison', _dropoffController, textColor, hintColor),
                  const SizedBox(height: 16),
                  _buildField('Description (optionnel)', _descriptionController, textColor, hintColor, maxLines: 2),

                  const SizedBox(height: 24),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _isSubmitting ? null : _submit,
                      icon: _isSubmitting
                          ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : Icon(typeIcons[_selectedType], color: Colors.white),
                      label: Text(_isSubmitting ? 'Création...' : 'Commander', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.mint,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                    ),
                  ).animate().fade().slideY(begin: 0.1),

                  const SizedBox(height: 32),

                  Text('Mes commandes', style: TextStyle(color: textColor, fontSize: 20, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 12),

                  if (_isLoadingOrders)
                    const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator(color: AppColors.violet)))
                  else if (_myOrders.isEmpty)
                    GlassContainer(
                      padding: const EdgeInsets.all(20),
                      child: Center(
                        child: Column(
                          children: [
                            Icon(Icons.receipt_long_rounded, size: 48, color: hintColor),
                            const SizedBox(height: 12),
                            Text('Aucune commande', style: TextStyle(color: hintColor)),
                          ],
                        ),
                      ),
                    )
                  else
                    ..._myOrders.map((order) {
                      final type = order['type']?.toString() ?? '';
                      final status = order['status']?.toString() ?? '';
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: GlassContainer(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(color: AppColors.violet.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(8)),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(typeIcons[type] ?? Icons.shopping_bag_rounded, size: 14, color: AppColors.violet),
                                        const SizedBox(width: 4),
                                        Text(typeLabels[type] ?? type, style: const TextStyle(color: AppColors.violet, fontSize: 12, fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                  ),
                                  const Spacer(),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: status == 'cancelled'
                                          ? Colors.red.withValues(alpha: 0.15)
                                          : status == 'delivered'
                                              ? Colors.green.withValues(alpha: 0.15)
                                              : Colors.orange.withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(statusLabels[status] ?? status, style: TextStyle(
                                      fontSize: 11, fontWeight: FontWeight.bold,
                                      color: status == 'cancelled' ? Colors.red : status == 'delivered' ? Colors.green : Colors.orange,
                                    )),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Row(children: [Icon(Icons.trip_origin_rounded, size: 16, color: hintColor), const SizedBox(width: 8), Text(order['pickup_address'] ?? '', style: TextStyle(color: textColor, fontSize: 13))]),
                              const SizedBox(height: 4),
                              Row(children: [Icon(Icons.location_on_rounded, size: 16, color: hintColor), const SizedBox(width: 8), Text(order['dropoff_address'] ?? '', style: TextStyle(color: textColor, fontSize: 13))]),
                              if (status == 'pending')
                                Padding(
                                  padding: const EdgeInsets.only(top: 12),
                                  child: Align(
                                    alignment: Alignment.centerRight,
                                    child: TextButton.icon(
                                      onPressed: () => _cancelOrder(order['id']?.toString() ?? ''),
                                      icon: const Icon(Icons.cancel_rounded, size: 18, color: Colors.red),
                                      label: const Text('Annuler', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ).animate().fade().slideY(begin: 0.1),
                      );
                    }),

                  const SizedBox(height: 80),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildField(String label, TextEditingController controller, Color textColor, Color hintColor, {int maxLines = 1}) {
    return GlassContainer(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: TextField(
        controller: controller,
        style: TextStyle(color: textColor),
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

class _TypeCard extends StatelessWidget {
  final String type;
  final String label;
  final IconData icon;
  final String selectedType;
  final bool isDark;
  final Color textColor;
  final VoidCallback onTap;

  const _TypeCard({required this.type, required this.label, required this.icon, required this.selectedType, required this.isDark, required this.textColor, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final selected = selectedType == type;
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: 200.ms,
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: selected ? AppColors.mint.withValues(alpha: 0.2) : (isDark ? Colors.white.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.04)),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: selected ? AppColors.mint : Colors.transparent, width: 2),
          ),
          child: Column(
            children: [
              Icon(icon, color: selected ? AppColors.mint : hintColor, size: 32),
              const SizedBox(height: 6),
              Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: selected ? AppColors.mint : textColor)),
            ],
          ),
        ),
      ),
    );
  }

  Color get hintColor => isDark ? Colors.white54 : AppColors.textSecondaryLight;
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:mosombi_frontend/core/providers/smart_city_provider.dart';
import 'package:flutter_animate/flutter_animate.dart';

class PropertyDetailScreen extends StatefulWidget {
  final String id;
  const PropertyDetailScreen({super.key, required this.id});

  @override
  State<PropertyDetailScreen> createState() => _PropertyDetailScreenState();
}

class _PropertyDetailScreenState extends State<PropertyDetailScreen> {
  final TextEditingController _messageController = TextEditingController();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  bool _isSending = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SmartCityProvider>().fetchListingDetail(widget.id);
    });
  }

  @override
  void dispose() {
    _messageController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _contactAgent() async {
    if (_messageController.text.trim().isEmpty) return;
    setState(() => _isSending = true);

    final success = await context.read<SmartCityProvider>().contactAgent(
      widget.id,
      message: _messageController.text,
      name: _nameController.text,
      phone: _phoneController.text,
    );

    setState(() => _isSending = false);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(success ? 'Message envoyé à l\'agent' : 'Erreur lors de l\'envoi'),
        backgroundColor: success ? Colors.green : Colors.red,
      ));
      if (success) {
        _messageController.clear();
        _nameController.clear();
        _phoneController.clear();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white54 : AppColors.textSecondaryLight;
    final typeLabels = {'apartment': 'Appartement', 'house': 'Maison', 'villa': 'Villa', 'land': 'Terrain', 'commercial': 'Commercial'};
    final transactionLabels = {'rent': 'Location', 'sell': 'Vente'};

    return Scaffold(
      extendBodyBehindAppBar: true,
      body: Consumer<SmartCityProvider>(
        builder: (context, provider, _) {
          final listing = provider.currentListing;

          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator(color: AppColors.violet));
          }

          if (listing == null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: Colors.grey),
                  const SizedBox(height: 16),
                  Text('Annonce introuvable', style: TextStyle(color: hintColor, fontSize: 16)),
                ],
              ),
            );
          }

          final images = (listing['images'] as List?)?.cast<String>() ?? [];
          final agent = listing['agent'] as Map<String, dynamic>?;

          return AnimatedGradientBg(
            isDark: isDark,
            child: CustomScrollView(
              physics: const BouncingScrollPhysics(),
              slivers: [
                MossombiSliverAppBar(
                  title: listing['title'] ?? 'Détail',
                  expandedHeight: 260,
                  background: images.isNotEmpty
                      ? Image.network(images.first, fit: BoxFit.cover)
                      : Container(color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.shade100),
                ),

                SliverPadding(
                  padding: const EdgeInsets.all(20),
                  sliver: SliverList(
                    delegate: SliverChildListDelegate([
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppColors.violet.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              '${typeLabels[listing['type']] ?? listing['type']} \u2022 ${transactionLabels[listing['transaction']] ?? listing['transaction']}',
                              style: const TextStyle(color: AppColors.violet, fontSize: 13, fontWeight: FontWeight.bold),
                            ),
                          ),
                          Text(
                            '${listing['price']} FCFA',
                            style: TextStyle(color: AppColors.mint, fontSize: 28, fontWeight: FontWeight.w900),
                          ),
                        ],
                      ).animate().fade().slideX(),

                      const SizedBox(height: 20),

                      Text(listing['title'] ?? '', style: TextStyle(color: textColor, fontSize: 22, fontWeight: FontWeight.w800)),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(Icons.location_on_rounded, size: 18, color: hintColor),
                          const SizedBox(width: 6),
                          Text('${listing['city'] ?? ''}${listing['address'] != null && listing['address'].isNotEmpty ? ', ${listing['address']}' : ''}',
                              style: TextStyle(color: hintColor, fontSize: 14)),
                        ],
                      ),

                      const SizedBox(height: 24),

                      if ((listing['surface'] ?? 0) > 0 || (listing['rooms'] ?? 0) > 0 || (listing['bedrooms'] ?? 0) > 0 || (listing['bathrooms'] ?? 0) > 0)
                        GlassContainer(
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              if ((listing['surface'] ?? 0) > 0)
                                _FeatureItem(icon: Icons.square_foot_rounded, label: '${listing['surface']} m²', sublabel: 'Surface'),
                              if ((listing['rooms'] ?? 0) > 0)
                                _FeatureItem(icon: Icons.meeting_room_rounded, label: '${listing['rooms']}', sublabel: 'Pièces'),
                              if ((listing['bedrooms'] ?? 0) > 0)
                                _FeatureItem(icon: Icons.bed_rounded, label: '${listing['bedrooms']}', sublabel: 'Chambres'),
                              if ((listing['bathrooms'] ?? 0) > 0)
                                _FeatureItem(icon: Icons.bathtub_rounded, label: '${listing['bathrooms']}', sublabel: 'Sdb'),
                            ],
                          ),
                        ).animate().fade().slideY(begin: 0.1),

                      const SizedBox(height: 24),

                      Text('Description', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.w800)),
                      const SizedBox(height: 8),
                      Text(
                        (listing['description'] as String?)?.isNotEmpty == true ? listing['description'] : 'Aucune description fournie.',
                        style: TextStyle(color: hintColor, fontSize: 14, height: 1.5),
                      ),

                      const SizedBox(height: 24),

                      if (agent != null) ...[
                        Text('Agent immobilier', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.w800)),
                        const SizedBox(height: 12),
                        GlassContainer(
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            children: [
                              Container(
                                width: 52, height: 52,
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(colors: [AppColors.violet, AppColors.coral]),
                                  shape: BoxShape.circle,
                                ),
                                child: Center(
                                  child: agent['avatar_url'] != null && (agent['avatar_url'] as String).isNotEmpty
                                      ? ClipOval(child: Image.network(agent['avatar_url'], fit: BoxFit.cover, width: 48, height: 48))
                                      : const Icon(Icons.person, color: Colors.white, size: 28),
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${agent['first_name'] ?? ''} ${agent['last_name'] ?? ''}'.trim().isNotEmpty
                                          ? '${agent['first_name'] ?? ''} ${agent['last_name'] ?? ''}'
                                          : 'Agent',
                                      style: TextStyle(color: textColor, fontWeight: FontWeight.w800, fontSize: 16),
                                    ),
                                    if (agent['phone'] != null && (agent['phone'] as String).isNotEmpty)
                                      Text(agent['phone'], style: TextStyle(color: hintColor, fontSize: 13)),
                                  ],
                                ),
                              ),
                              Icon(Icons.phone_rounded, color: Colors.green.shade400, size: 28),
                            ],
                          ),
                        ).animate().fade().slideY(begin: 0.1),
                      ],

                      const SizedBox(height: 24),

                      Text('Contacter l\'agent', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.w800)),
                      const SizedBox(height: 12),

                      GlassContainer(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            TextField(
                              controller: _nameController,
                              style: TextStyle(color: textColor),
                              decoration: InputDecoration(
                                labelText: 'Votre nom (optionnel)',
                                labelStyle: TextStyle(color: hintColor),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                                filled: true,
                                fillColor: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.03),
                              ),
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: _phoneController,
                              style: TextStyle(color: textColor),
                              keyboardType: TextInputType.phone,
                              decoration: InputDecoration(
                                labelText: 'Téléphone (optionnel)',
                                labelStyle: TextStyle(color: hintColor),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                                filled: true,
                                fillColor: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.03),
                              ),
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: _messageController,
                              style: TextStyle(color: textColor),
                              maxLines: 3,
                              decoration: InputDecoration(
                                labelText: 'Votre message *',
                                labelStyle: TextStyle(color: hintColor),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                                filled: true,
                                fillColor: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.03),
                              ),
                            ),
                            const SizedBox(height: 16),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: _isSending ? null : _contactAgent,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.violet,
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                ),
                                child: _isSending
                                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                    : const Text('Envoyer', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                              ),
                            ),
                          ],
                        ),
                      ).animate().fade().slideY(begin: 0.1),

                      const SizedBox(height: 100),
                    ]),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _FeatureItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String sublabel;

  const _FeatureItem({required this.icon, required this.label, required this.sublabel});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    return Column(
      children: [
        Icon(icon, color: AppColors.violet, size: 24),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(color: textColor, fontWeight: FontWeight.w800, fontSize: 16)),
        Text(sublabel, style: TextStyle(color: Colors.grey, fontSize: 11)),
      ],
    );
  }
}

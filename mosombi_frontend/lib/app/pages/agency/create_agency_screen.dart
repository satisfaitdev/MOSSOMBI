import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/providers/agency_provider.dart';
import 'package:mosombi_frontend/core/providers/auth_provider.dart';

class CreateAgencyScreen extends ConsumerStatefulWidget {
  const CreateAgencyScreen({super.key});

  @override
  ConsumerState<CreateAgencyScreen> createState() => _CreateAgencyScreenState();
}

class _CreateAgencyScreenState extends ConsumerState<CreateAgencyScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  String _selectedType = 'marketplace';
  String _logoUrl = '';
  bool _isLoading = false;

  final List<Map<String, String>> _agencyTypes = [
    {'id': 'marketplace', 'name': 'Marketplace (Boutique)'},
    {'id': 'billetterie', 'name': 'Billetterie / Événements'},
    {'id': 'voyage', 'name': 'Agence de Voyage'},
    {'id': 'restaurant', 'name': 'Restaurant'},
    {'id': 'taxi', 'name': 'Taxi / Transport'},
    {'id': 'location', 'name': 'Location de Voitures'},
    {'id': 'livreur', 'name': 'Services Locaux / Livreur'},
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  void _submit() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isLoading = true);

    final provider = context.read<AgencyProvider>();
    final success = await provider.createAgency(
       _nameController.text,
       _phoneController.text,
       _addressController.text,
       _selectedType,
       _logoUrl,
    );
    
    setState(() => _isLoading = false);

    if (mounted) {
      if (success || provider.error == null) {
         // Agency created and is pending validation
         ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Demande envoyée. En attente de validation admin.')));
         context.pop();
      } else {
         ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(provider.error ?? 'Erreur lors de la création')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white.withValues(alpha: 0.5) : AppColors.textSecondaryLight;
    
    final user = ref.watch(authProvider).user;
    final isKycVerified = user?.kycStatus == 'verified';
    final agencyProv = context.watch<AgencyProvider>();
    final hasPendingAgency = agencyProv.currentAgency?.status == 'pending' || agencyProv.currentAgent?.status == 'pending';
    final hasActiveAgency = agencyProv.currentAgency?.status == 'active' || agencyProv.currentAgency?.status == 'approved';

    return Scaffold(
      body: AnimatedGradientBg(
        isDark: isDark,
        child: Column(
          children: [
            const MossombiAppBar(title: 'Créer une Agence'),
            if (hasPendingAgency)
              Expanded(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: GlassContainer(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.hourglass_top_rounded, size: 64, color: Colors.orangeAccent).animate().scale(curve: Curves.easeOutBack),
                          const SizedBox(height: 16),
                          Text('En attente de validation', style: TextStyle(color: textColor, fontSize: 20, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
                          const SizedBox(height: 8),
                          Text(
                             'Vous avez déjà soumis une demande de création d\'agence qui est en cours d\'examen par notre équipe. Veuillez patienter.',
                             textAlign: TextAlign.center,
                             style: TextStyle(color: hintColor),
                          ),
                          const SizedBox(height: 24),
                          ElevatedButton(
                            onPressed: () => context.go('/home'),
                            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6C4EF6)),
                            child: const Text('Retour à l\'accueil', style: TextStyle(color: Colors.white)),
                          )
                        ],
                      ),
                    ),
                  ),
                ),
              )
            else if (hasActiveAgency)
              Expanded(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: GlassContainer(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.verified_rounded, size: 64, color: Colors.green).animate().scale(curve: Curves.easeOutBack),
                          const SizedBox(height: 16),
                          Text('Vous avez déjà une agence', style: TextStyle(color: textColor, fontSize: 20, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
                          const SizedBox(height: 8),
                          Text(
                             'Vous ne pouvez gérer qu\'une seule agence à la fois sur Mossombi.',
                             textAlign: TextAlign.center,
                             style: TextStyle(color: hintColor),
                          ),
                          const SizedBox(height: 24),
                          ElevatedButton(
                            onPressed: () => context.go('/agent-dashboard'),
                            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6C4EF6)),
                            child: const Text('Aller au Dashboard', style: TextStyle(color: Colors.white)),
                          )
                        ],
                      ),
                    ),
                  ),
                ),
              )
            else if (!isKycVerified)
              Expanded(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: GlassContainer(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.gpp_maybe_rounded, size: 64, color: Colors.orangeAccent).animate().scale(curve: Curves.easeOutBack),
                          const SizedBox(height: 16),
                          Text('KYC Requis', style: TextStyle(color: textColor, fontSize: 20, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          Text(
                             'Pour ouvrir une Agence, veuillez d\'abord valider votre profil en soumettant vos documents d\'identité (KYC) dans les Paramètres.',
                             textAlign: TextAlign.center,
                             style: TextStyle(color: hintColor),
                          ),
                          const SizedBox(height: 24),
                          ElevatedButton(
                            onPressed: () => context.pop(),
                            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6C4EF6)),
                            child: const Text('Retour', style: TextStyle(color: Colors.white)),
                          )
                        ],
                      ),
                    ),
                  ),
                ),
              )
            else
              Expanded(
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      GlassContainer(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Informations de base', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 8),
                            Text('Définissez l\'identité de votre réseau de hosts.', style: TextStyle(color: hintColor, fontSize: 13)),
                            const SizedBox(height: 24),
                            
                            // Name Input
                            TextFormField(
                              controller: _nameController,
                              style: TextStyle(color: textColor),
                              decoration: InputDecoration(
                                labelText: 'Nom de l\'Agence',
                                labelStyle: TextStyle(color: hintColor),
                                filled: true,
                                fillColor: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.05),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                                prefixIcon: Icon(Icons.store, color: hintColor),
                              ),
                              validator: (v) => v!.isEmpty ? 'Veuillez entrer un nom' : null,
                            ),
                            const SizedBox(height: 16),
                            
                            // Phone Input
                            TextFormField(
                              controller: _phoneController,
                              keyboardType: TextInputType.phone,
                              style: TextStyle(color: textColor),
                              decoration: InputDecoration(
                                labelText: 'Numéro de Téléphone',
                                labelStyle: TextStyle(color: hintColor),
                                filled: true,
                                fillColor: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.05),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                                prefixIcon: Icon(Icons.phone, color: hintColor),
                              ),
                              validator: (v) => v!.isEmpty ? 'Veuillez entrer un numéro' : null,
                            ),
                            const SizedBox(height: 16),
                            
                            // Address Input
                            TextFormField(
                              controller: _addressController,
                              style: TextStyle(color: textColor),
                              decoration: InputDecoration(
                                labelText: 'Adresse complète',
                                labelStyle: TextStyle(color: hintColor),
                                filled: true,
                                fillColor: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.05),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                                prefixIcon: Icon(Icons.location_on, color: hintColor),
                              ),
                              validator: (v) => v!.isEmpty ? 'Veuillez entrer une adresse' : null,
                            ),
                            const SizedBox(height: 16),
                            
                            // Agency Type Dropdown
                            DropdownButtonFormField<String>(
                               value: _selectedType,
                               dropdownColor: isDark ? const Color(0xFF1E1E2C) : Colors.white,
                               style: TextStyle(color: textColor),
                               decoration: InputDecoration(
                                 labelText: 'Type d\'Agence',
                                 labelStyle: TextStyle(color: hintColor),
                                 filled: true,
                                 fillColor: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.05),
                                 border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                                 prefixIcon: Icon(Icons.category, color: hintColor),
                               ),
                               items: _agencyTypes.map((type) {
                                  return DropdownMenuItem(
                                    value: type['id'],
                                    child: Text(type['name']!),
                                  );
                               }).toList(),
                               onChanged: (v) {
                                  if (v != null) {
                                     setState(() => _selectedType = v);
                                  }
                               },
                            ),
                          ],
                        ),
                      ).animate().fade().slideY(begin: 0.1, end: 0),
                      
                      const SizedBox(height: 40),
                      
                      ElevatedButton(
                        onPressed: _isLoading ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF6C4EF6),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        child: _isLoading
                            ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : const Text('Créer l\'Agence', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                      ).animate(delay: 200.ms).fade().slideY(begin: 0.1, end: 0),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

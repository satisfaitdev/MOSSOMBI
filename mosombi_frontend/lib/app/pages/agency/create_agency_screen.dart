import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/providers/agency_provider.dart';
import 'package:mosombi_frontend/core/providers/auth_provider.dart';

/// Describes a required document for a service type.
class DocRequirement {
  final String docType;
  final String label;
  final bool isLink;       // true = text URL field, false = image upload
  final bool isRequired;
  DocRequirement({required this.docType, required this.label, this.isLink = false, this.isRequired = true});
}

/// Documents required per service type
final Map<String, List<DocRequirement>> serviceDocuments = {
  'marketplace': [
    DocRequirement(docType: 'rccm', label: 'RCCM / Registre de commerce', isRequired: false),
    DocRequirement(docType: 'social_link', label: 'Lien page réseau social ou site web', isLink: true),
    DocRequirement(docType: 'id_card', label: 'Pièce d\'identité'),
  ],
  'billetterie': [
    DocRequirement(docType: 'rccm', label: 'RCCM / Registre de commerce', isRequired: false),
    DocRequirement(docType: 'social_link', label: 'Lien page réseau social ou site web', isLink: true),
    DocRequirement(docType: 'id_card', label: 'Pièce d\'identité'),
  ],
  'voyage': [
    DocRequirement(docType: 'rccm', label: 'RCCM / Registre de commerce'),
    DocRequirement(docType: 'licence', label: 'Licence d\'agence de voyage'),
    DocRequirement(docType: 'social_link', label: 'Lien site web ou réseau social', isLink: true, isRequired: false),
    DocRequirement(docType: 'id_card', label: 'Pièce d\'identité'),
  ],
  'restaurant': [
    DocRequirement(docType: 'rccm', label: 'RCCM / Registre de commerce'),
    DocRequirement(docType: 'social_link', label: 'Lien site web ou réseau social', isLink: true),
    DocRequirement(docType: 'id_card', label: 'Pièce d\'identité'),
  ],
  'taxi': [
    DocRequirement(docType: 'vehicle_card', label: 'Carte grise du véhicule'),
    DocRequirement(docType: 'vehicle_insurance', label: 'Assurance du véhicule'),
    DocRequirement(docType: 'vehicle_inspection', label: 'Visite technique du véhicule'),
    DocRequirement(docType: 'driving_licence', label: 'Permis de conduire'),
    DocRequirement(docType: 'id_card', label: 'Pièce d\'identité'),
  ],
  'location': [
    DocRequirement(docType: 'rccm', label: 'RCCM / Registre de commerce'),
    DocRequirement(docType: 'vehicle_card', label: 'Carte grise du véhicule'),
    DocRequirement(docType: 'vehicle_insurance', label: 'Assurance du véhicule'),
    DocRequirement(docType: 'id_card', label: 'Pièce d\'identité'),
  ],
  'livreur': [
    DocRequirement(docType: 'id_card', label: 'Pièce d\'identité'),
    DocRequirement(docType: 'vehicle_card', label: 'Document du véhicule (si applicable)', isRequired: false),
    DocRequirement(docType: 'driving_licence', label: 'Permis de conduire', isRequired: false),
  ],
};

class CreateAgencyScreen extends ConsumerStatefulWidget {
  const CreateAgencyScreen({super.key});
  @override
  ConsumerState<CreateAgencyScreen> createState() => _CreateAgencyScreenState();
}

class _CreateAgencyScreenState extends ConsumerState<CreateAgencyScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _cityController = TextEditingController();
  final _addressController = TextEditingController();
  String _selectedType = 'marketplace';
  String _logoUrl = '';
  bool _isLoading = false;
  bool _autoLocation = true;
  bool _geoLoading = false;
  
  double? _lat;
  double? _long;

  // Documents: docType -> bytes (for images) or String (for links)
  final Map<String, Uint8List> _docBytes = {};
  final Map<String, String> _docBase64 = {};
  final Map<String, TextEditingController> _linkControllers = {};

  final _picker = ImagePicker();

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
  void initState() {
    super.initState();
    _fetchLocation();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _cityController.dispose();
    _addressController.dispose();
    for (final c in _linkControllers.values) { c.dispose(); }
    super.dispose();
  }

  List<DocRequirement> get _currentDocs => serviceDocuments[_selectedType] ?? [];

  TextEditingController _getLinkController(String docType) {
    _linkControllers.putIfAbsent(docType, () => TextEditingController());
    return _linkControllers[docType]!;
  }

  Future<void> _fetchLocation() async {
    setState(() => _geoLoading = true);
    try {
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) {
        setState(() { _autoLocation = false; _geoLoading = false; });
        return;
      }
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );
      
      _lat = pos.latitude;
      _long = pos.longitude;

      try {
        final placemarks = await placemarkFromCoordinates(pos.latitude, pos.longitude);
        if (placemarks.isNotEmpty) {
          final p = placemarks.first;
          _cityController.text = p.locality ?? p.subAdministrativeArea ?? '';
          _addressController.text = [p.street, p.subLocality, p.locality]
              .where((s) => s != null && s.isNotEmpty).join(', ');
        }
      } catch (geoErr) {
        debugPrint('Geocoding error: $geoErr');
        _addressController.text = '${pos.latitude.toStringAsFixed(4)}, ${pos.longitude.toStringAsFixed(4)}';
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Géocodage indisponible. Passez en mode manuel.')),
          );
        }
      }
    } catch (e) {
      debugPrint('Geo error: $e');
      setState(() => _autoLocation = false);
    }
    setState(() => _geoLoading = false);
  }

  Future<void> _pickDocument(String docType) async {
    final picked = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 70, maxWidth: 1200);
    if (picked == null) return;
    final bytes = await picked.readAsBytes();
    final ext = picked.name.split('.').last.toLowerCase();
    final mime = ext == 'png' ? 'image/png' : 'image/jpeg';
    final b64 = 'data:$mime;base64,${base64Encode(bytes)}';
    setState(() {
      _docBytes[docType] = bytes;
      _docBase64[docType] = b64;
    });
  }

  void _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_cityController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Veuillez renseigner la ville.')));
      return;
    }

    // Validate required docs
    for (final doc in _currentDocs) {
      if (!doc.isRequired) continue;
      if (doc.isLink) {
        final val = _getLinkController(doc.docType).text.trim();
        if (val.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${doc.label} est requis.')));
          return;
        }
      } else {
        if (!_docBase64.containsKey(doc.docType)) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${doc.label} est requis.')));
          return;
        }
      }
    }

    setState(() => _isLoading = true);

    // Build documents list
    final docs = <Map<String, String>>[];
    for (final doc in _currentDocs) {
      if (doc.isLink) {
        final val = _getLinkController(doc.docType).text.trim();
        if (val.isNotEmpty) {
          docs.add({'doc_type': doc.docType, 'file_url': val, 'service_id': _selectedType});
        }
      } else {
        final b64 = _docBase64[doc.docType];
        if (b64 != null) {
          docs.add({'doc_type': doc.docType, 'file_url': b64, 'service_id': _selectedType});
        }
      }
    }

    final provider = context.read<AgencyProvider>();
    final success = await provider.createAgency(
      name: _nameController.text,
      phone: _phoneController.text,
      city: _cityController.text.trim(),
      address: _addressController.text.trim(),
      type: _selectedType,
      logoUrl: _logoUrl,
      documents: docs,
      latitude: _lat,
      longitude: _long,
    );

    setState(() => _isLoading = false);

    if (mounted) {
      if (success || provider.error == null) {
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
    final cardFill = isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.05);

    final user = ref.watch(authProvider).user;
    final isKycVerified = user?.kycStatus == 'verified';
    final agencyProv = context.watch<AgencyProvider>();
    final hasPendingAgency = agencyProv.currentAgency?.status == 'pending' || agencyProv.currentAgent?.status == 'pending';
    final hasActiveAgency = agencyProv.currentAgency?.status == 'active' || agencyProv.currentAgency?.status == 'approved';

    InputDecoration fieldDeco(String label, IconData icon) => InputDecoration(
      labelText: label, labelStyle: TextStyle(color: hintColor),
      filled: true, fillColor: cardFill,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
      prefixIcon: Icon(icon, color: hintColor),
    );

    return Scaffold(
      body: AnimatedGradientBg(
        isDark: isDark,
        child: Column(
          children: [
            const MossombiAppBar(title: 'Créer une Agence'),
            if (hasPendingAgency)
              _buildBlockScreen(Icons.hourglass_top_rounded, Colors.orangeAccent, 'En attente de validation',
                'Vous avez déjà soumis une demande en cours d\'examen.', textColor, hintColor, isDark, () => context.go('/home'), 'Retour à l\'accueil')
            else if (hasActiveAgency)
              _buildBlockScreen(Icons.verified_rounded, Colors.green, 'Vous avez déjà une agence',
                'Vous ne pouvez gérer qu\'une seule agence à la fois.', textColor, hintColor, isDark, () => context.go('/agent-dashboard'), 'Aller au Dashboard')
            else if (!isKycVerified)
              _buildBlockScreen(Icons.gpp_maybe_rounded, Colors.orangeAccent, 'KYC Requis',
                'Pour ouvrir une Agence, validez votre profil dans les Paramètres.', textColor, hintColor, isDark, () => context.pop(), 'Retour')
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
                        // --- Section 1: Infos de base ---
                        GlassContainer(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Informations de base', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 8),
                              Text('Définissez l\'identité de votre agence.', style: TextStyle(color: hintColor, fontSize: 13)),
                              const SizedBox(height: 24),
                              TextFormField(controller: _nameController, style: TextStyle(color: textColor),
                                decoration: fieldDeco('Nom de l\'Agence', Icons.store),
                                validator: (v) => v!.isEmpty ? 'Veuillez entrer un nom' : null),
                              const SizedBox(height: 16),
                              TextFormField(controller: _phoneController, keyboardType: TextInputType.phone, style: TextStyle(color: textColor),
                                decoration: fieldDeco('Numéro de Téléphone', Icons.phone),
                                validator: (v) => v!.isEmpty ? 'Veuillez entrer un numéro' : null),
                              const SizedBox(height: 16),
                              DropdownButtonFormField<String>(
                                value: _selectedType,
                                dropdownColor: isDark ? const Color(0xFF1E1E2C) : Colors.white,
                                style: TextStyle(color: textColor),
                                decoration: fieldDeco('Type d\'Agence', Icons.category),
                                items: _agencyTypes.map((t) => DropdownMenuItem(value: t['id'], child: Text(t['name']!))).toList(),
                                onChanged: (v) { if (v != null) setState(() => _selectedType = v); },
                              ),
                            ],
                          ),
                        ).animate().fade().slideY(begin: 0.1, end: 0),

                        const SizedBox(height: 24),

                        // --- Section 2: Adresse ---
                        GlassContainer(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text('Adresse', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
                                  Row(children: [
                                    Text(_autoLocation ? 'Auto' : 'Manuel', style: TextStyle(color: hintColor, fontSize: 12)),
                                    const SizedBox(width: 8),
                                    Switch.adaptive(value: _autoLocation, activeColor: const Color(0xFF6C4EF6),
                                      onChanged: (v) { setState(() => _autoLocation = v); if (v) _fetchLocation(); }),
                                  ]),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(_autoLocation ? 'Localisation détectée via GPS.' : 'Saisissez manuellement votre ville et adresse.',
                                style: TextStyle(color: hintColor, fontSize: 13)),
                              const SizedBox(height: 16),
                              if (_geoLoading)
                                const Padding(padding: EdgeInsets.symmetric(vertical: 16), child: Center(child: CircularProgressIndicator(strokeWidth: 2)))
                              else ...[
                                TextFormField(controller: _cityController, readOnly: _autoLocation,
                                  style: TextStyle(color: _autoLocation ? hintColor : textColor),
                                  decoration: fieldDeco('Ville', Icons.location_city).copyWith(
                                    suffixIcon: _autoLocation ? IconButton(icon: Icon(Icons.refresh, color: hintColor), onPressed: _fetchLocation) : null),
                                  validator: (v) => v!.trim().isEmpty ? 'Ville requise' : null),
                                const SizedBox(height: 16),
                                TextFormField(controller: _addressController, readOnly: _autoLocation,
                                  style: TextStyle(color: _autoLocation ? hintColor : textColor),
                                  decoration: fieldDeco('Adresse complète', Icons.location_on),
                                  validator: (v) => v!.isEmpty ? 'Adresse requise' : null),
                              ],
                            ],
                          ),
                        ).animate(delay: 100.ms).fade().slideY(begin: 0.1, end: 0),

                        const SizedBox(height: 24),

                        // --- Section 3: Justificatifs dynamiques ---
                        GlassContainer(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Justificatifs', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 8),
                              Text('Documents requis pour "${_agencyTypes.firstWhere((t) => t["id"] == _selectedType)["name"]}".',
                                style: TextStyle(color: hintColor, fontSize: 13)),
                              const SizedBox(height: 20),
                              ..._currentDocs.map((doc) {
                                if (doc.isLink) {
                                  return Padding(
                                    padding: const EdgeInsets.only(bottom: 12),
                                    child: TextFormField(
                                      controller: _getLinkController(doc.docType),
                                      style: TextStyle(color: textColor),
                                      decoration: fieldDeco(
                                        '${doc.label}${doc.isRequired ? '' : ' (optionnel)'}',
                                        Icons.link,
                                      ),
                                      keyboardType: TextInputType.url,
                                    ),
                                  );
                                } else {
                                  return Padding(
                                    padding: const EdgeInsets.only(bottom: 12),
                                    child: _buildDocTile(
                                      '${doc.label}${doc.isRequired ? '' : ' (optionnel)'}',
                                      doc.docType,
                                      _docBytes[doc.docType],
                                      textColor, hintColor, cardFill,
                                    ),
                                  );
                                }
                              }),
                            ],
                          ),
                        ).animate(delay: 200.ms).fade().slideY(begin: 0.1, end: 0),

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
                        ).animate(delay: 300.ms).fade().slideY(begin: 0.1, end: 0),
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

  Widget _buildDocTile(String label, String docType, Uint8List? bytes, Color textColor, Color hintColor, Color cardFill) {
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: () => _pickDocument(docType),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: cardFill, borderRadius: BorderRadius.circular(16),
          border: Border.all(color: bytes != null ? const Color(0xFF6C4EF6).withValues(alpha: 0.5) : Colors.transparent),
        ),
        child: Row(
          children: [
            Container(
              width: 48, height: 48,
              decoration: BoxDecoration(
                color: bytes != null ? const Color(0xFF6C4EF6).withValues(alpha: 0.15) : hintColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: bytes != null
                  ? ClipRRect(borderRadius: BorderRadius.circular(12), child: Image.memory(bytes, fit: BoxFit.cover))
                  : Icon(Icons.upload_file, color: hintColor, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(label, style: TextStyle(color: textColor, fontSize: 14, fontWeight: FontWeight.w600)),
              const SizedBox(height: 4),
              Text(bytes != null ? 'Document sélectionné ✓' : 'Appuyez pour sélectionner',
                style: TextStyle(color: bytes != null ? const Color(0xFF6C4EF6) : hintColor, fontSize: 12)),
            ])),
            if (bytes != null) Icon(Icons.check_circle, color: const Color(0xFF6C4EF6), size: 22),
          ],
        ),
      ),
    );
  }

  Widget _buildBlockScreen(IconData icon, Color iconColor, String title, String subtitle,
      Color textColor, Color hintColor, bool isDark, VoidCallback onTap, String btnLabel) {
    return Expanded(
      child: Center(child: Padding(padding: const EdgeInsets.all(24.0),
        child: GlassContainer(padding: const EdgeInsets.all(32), child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 64, color: iconColor).animate().scale(curve: Curves.easeOutBack),
          const SizedBox(height: 16),
          Text(title, style: TextStyle(color: textColor, fontSize: 20, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
          const SizedBox(height: 8),
          Text(subtitle, textAlign: TextAlign.center, style: TextStyle(color: hintColor)),
          const SizedBox(height: 24),
          ElevatedButton(onPressed: onTap, style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6C4EF6)),
            child: Text(btnLabel, style: const TextStyle(color: Colors.white))),
        ])))),
    );
  }
}

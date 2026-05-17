import 'dart:io';
import 'dart:convert';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mosombi_frontend/core/network/api_client.dart' as mosombi_api;
import 'package:mosombi_frontend/core/providers/product_provider.dart';
import 'package:mosombi_frontend/core/providers/agency_provider.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/theme/app_gradients.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/product_image.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:flutter_animate/flutter_animate.dart';

import 'package:mosombi_frontend/core/providers/cart_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mosombi_frontend/core/providers/auth_provider.dart';
import 'package:mosombi_frontend/core/models/product_model.dart';

class AddProductScreen extends ConsumerStatefulWidget {
  final Product? productToEdit;
  const AddProductScreen({super.key, this.productToEdit});

  @override
  ConsumerState<AddProductScreen> createState() => _AddProductScreenState();
}

class _AddProductScreenState extends ConsumerState<AddProductScreen> {
  final _formKey = GlobalKey<FormState>();
  
  final _nameCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _priceCtrl = TextEditingController();
  final _stockCtrl = TextEditingController(text: "1");

  String _shippingUnit = 'kg';
  final _shippingValueCtrl = TextEditingController(text: "1.0");

  String _category = 'Boutiques Locales';
  List<String> _categories = ['Boutiques Locales', 'Électronique', 'Mode M/F', 'Beauté', 'Santé', 'Auto/Moto', 'Alimentation / Épicerie', 'Maison & Bureau', 'Immobilier', 'Services'];

  String _origin = 'Local 📍';
  List<String> _origins = ['Local 📍'];

  // Champs dynamiques
  final _customSpecsCtrl = TextEditingController();
  final _yearCtrl = TextEditingController();
  final _mileageCtrl = TextEditingController();
  List<String> _electronicMemories = [];
  final Map<String, TextEditingController> _memoryPriceControllers = {};
  String _electronicBrand = 'Apple';
  List<String> _modeSizes = [];
  String _modeMaterial = 'Coton';
  String _modeGender = 'Unisexe';
  String _modeTarget = 'Adulte';
  String _foodWeight = '1 kg';
  String _foodConservation = 'Frais';
  String _immoSurface = '100 m²';
  String _immoRooms = '3 Pièces';
  String _houseMaterial = 'Bois';
  String _houseCondition = 'Neuf';
  String _serviceBilling = 'Forfait';

  // AI Options
  String _aiBackgroundStyle = 'Fond Transparent (Recommandé)';
  final List<String> _aiBgOptions = ['Fond Transparent (Recommandé)', 'Studio Photographique Blanc', 'Nature et Lumière du jour', 'Minimaliste Moderne'];

  List<XFile> _selectedXFiles = []; // Actual images picked (max 3)
  List<String> _enhancedImageUrls = []; // From backend
  String? _generatedVideoUrl;
  final ImagePicker _picker = ImagePicker();

  List<Map<String, dynamic>> _variants = []; // ex: [{'title': 'Taille L - Rouge', 'stock': 5}]

  bool _acceptLoan = false;
  final _firstAdvanceCtrl = TextEditingController();
  final _installmentCtrl = TextEditingController();
  String _loanFrequency = 'Mensuel';
  String _productCondition = 'Neuf'; // Neuf, Occasion

  final List<String> _availableCities = ['Brazzaville', 'Pointe-Noire', 'Dolisie', 'Nkayi', 'Ouesso', 'Owando', 'Kinshasa', 'Lubumbashi'];
  final List<String> _selectedCities = [];
  String _userCountryFlag = '📍';
  String _userCountryName = 'Local';

  final List<Color> _availableColors = [
    Colors.red, Colors.blue, Colors.green, Colors.black, Colors.white,
    Colors.grey, Colors.orange, Colors.purple, Colors.pink, Colors.indigo, Colors.brown
  ];
  final List<Color> _selectedColors = [];

  bool _isLoading = false;
  bool _isAIGenerating = false;
  bool _isAIEnhanced = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descCtrl.dispose();
    _priceCtrl.dispose();
    _stockCtrl.dispose();
    _customSpecsCtrl.dispose();
    _yearCtrl.dispose();
    _mileageCtrl.dispose();
    _firstAdvanceCtrl.dispose();
    _installmentCtrl.dispose();
    _shippingValueCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    if (_selectedXFiles.length >= 3) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Maximum 3 images pour la vue rotative 3D.')));
      return;
    }
    final pickedFile = await _picker.pickImage(source: source);
    if (pickedFile != null) {
      setState(() {
         _selectedXFiles.add(pickedFile);
         _enhancedImageUrls.clear();
         _generatedVideoUrl = null;
         _isAIEnhanced = false;
      });
    }
  }

  Future<void> _pickMultiImages() async {
    final remaining = 3 - _selectedXFiles.length;
    if (remaining <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Maximum 3 images pour la vue rotative 3D.')));
      return;
    }
    final pickedFiles = await _picker.pickMultiImage(imageQuality: 80, maxWidth: 1200);
    if (pickedFiles.isNotEmpty) {
      setState(() {
        final toAdd = pickedFiles.take(remaining).toList();
        _selectedXFiles.addAll(toAdd);
        _enhancedImageUrls.clear();
        _generatedVideoUrl = null;
        _isAIEnhanced = false;
      });
      if (pickedFiles.length > remaining) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Seules $remaining image(s) ont été ajoutées (max 3).')));
      }
    }
  }

  void _showImageSourceDialog() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        margin: const EdgeInsets.all(24),
        padding: const EdgeInsets.symmetric(vertical: 24),
        decoration: BoxDecoration(
          color: Theme.of(context).brightness == Brightness.dark ? AppColors.bgDark1 : Colors.white,
          borderRadius: BorderRadius.circular(24),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Importer des photos', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildSourceBtn(Icons.camera_alt_rounded, 'Caméra', () { context.pop(); _pickImage(ImageSource.camera); }),
                _buildSourceBtn(Icons.photo_library_rounded, 'Galerie\n(Multi)', () { context.pop(); _pickMultiImages(); }),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSourceBtn(IconData icon, String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: AppColors.violet.withValues(alpha: 0.1), shape: BoxShape.circle),
            child: Icon(icon, color: AppColors.violet, size: 30),
          ),
          const SizedBox(height: 8),
          Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildNetworkOrBase64Image(String url) {
    return ProductImageHelper.buildImage(url, fit: BoxFit.cover);
  }

  Widget _buildThumbnail(int index, bool isDark, Color hintColor) {
    final bool isEnhanced = _enhancedImageUrls.isNotEmpty;
    return Container(
      height: 120,
      width: 100,
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isEnhanced ? AppColors.violet : Colors.grey.withValues(alpha: 0.3), width: 2),
      ),
      child: Stack(
        fit: StackFit.expand,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: isEnhanced
                ? _buildNetworkOrBase64Image(_enhancedImageUrls[index])
                : (kIsWeb
                    ? Image.network(_selectedXFiles[index].path, fit: BoxFit.cover)
                    : Image.file(File(_selectedXFiles[index].path), fit: BoxFit.cover)),
          ),
          if (!isEnhanced)
            Positioned(
              top: 4, right: 4,
              child: InkWell(
                onTap: () => setState(() => _selectedXFiles.removeAt(index)),
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                  child: const Icon(Icons.close, color: Colors.white, size: 14),
                ),
              ),
            ),
        ],
      ),
    );
  }

  String _getColorName(Color c) {
    if (c == Colors.red) return 'Rouge';
    if (c == Colors.blue) return 'Bleu';
    if (c == Colors.green) return 'Vert';
    if (c == Colors.black) return 'Noir';
    if (c == Colors.white) return 'Blanc';
    if (c == Colors.grey) return 'Gris';
    if (c == Colors.orange) return 'Orange';
    if (c == Colors.purple) return 'Violet';
    if (c == Colors.pink) return 'Rose';
    if (c == Colors.indigo) return 'Indigo';
    if (c == Colors.brown) return 'Marron';
    return '#${c.value.toRadixString(16).substring(2, 8).toUpperCase()}';
  }

  void _initUserLocation() {
    final user = ref.read(authProvider).user;
    if (user != null && user.phone != null) {
      if (user.phone!.startsWith('+242')) {
        _userCountryFlag = '🇨🇬';
        _userCountryName = 'Congo (Brazzaville)';
      } else if (user.phone!.startsWith('+243')) {
        _userCountryFlag = '🇨🇩';
        _userCountryName = 'RDC';
      } else if (user.phone!.startsWith('+237')) {
        _userCountryFlag = '🇨🇲';
        _userCountryName = 'Cameroun';
      } else if (user.phone!.startsWith('+225')) {
        _userCountryFlag = '🇨🇮';
        _userCountryName = 'Côte d\'Ivoire';
      }
    }
    
    // Mettre à jour l'origine si elle n'a pas encore été changée
    if (_origins.isNotEmpty && _origins.first.contains('Local')) {
       _origins[0] = 'Local $_userCountryFlag';
       if (widget.productToEdit == null || _origin.contains('Local')) {
           _origin = _origins.first;
       }
    }
  }

  void _loadDynamicOrigins() {
    final cart = context.read<CartProvider>();
    if (cart.logisticsSettings.isNotEmpty) {
      final Set<String> uniqueOrigins = {};
      
      // Ajouter Local
      uniqueOrigins.add('Local');
      
      // Collecter toutes les origines définies dans la matrice
      cart.logisticsSettings.forEach((dest, config) {
        if (config is Map && config.containsKey('International')) {
          final intl = config['International'] as Map;
          if (intl.containsKey('origins')) {
             (intl['origins'] as Map).keys.forEach((o) => uniqueOrigins.add(o.toString()));
          }
        }
      });

      final List<String> dynamicOrigins = [];
      for (var country in uniqueOrigins) {
        String flag = '🌐';
        if (country == 'Local') {
          flag = _userCountryFlag;
          dynamicOrigins.add('Local $flag');
          continue;
        }

        if (country.contains('Congo') && !country.contains('RDC')) flag = '🇨🇬';
        else if (country.contains('RDC')) flag = '🇨🇩';
        else if (country.contains('Chine')) flag = '🇨🇳';
        else if (country.contains('Dubaï') || country.contains('UAE')) flag = '🇦🇪';
        else if (country.contains('France')) flag = '🇫🇷';
        else if (country.contains('Turquie')) flag = '🇹🇷';
        else if (country.contains('Gabon')) flag = '🇬🇦';
        else if (country.contains('Cameroun')) flag = '🇨🇲';
        else if (country.contains('Togo')) flag = '🇹🇬';
        else if (country.contains('Bénin')) flag = '🇧🇯';

        dynamicOrigins.add('$country $flag');
      }

      setState(() {
        _origins = dynamicOrigins;
        if (!_origins.contains(_origin)) {
          _origin = _origins.first;
        }
      });
    }
  }

    @override
  void initState() {
    super.initState();
    _initUserLocation();
    
    // Charger les origines dynamiques après le premier frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadDynamicOrigins();
    });

    if (widget.productToEdit != null) {
       _nameCtrl.text = widget.productToEdit!.name;
       _descCtrl.text = widget.productToEdit!.description;
       _priceCtrl.text = widget.productToEdit!.price.toStringAsFixed(0);
       _stockCtrl.text = widget.productToEdit!.stock.toString();
       
       // Load variants
       if (widget.productToEdit!.variants.isNotEmpty) {
           _variants = List.from(widget.productToEdit!.variants);
       }
       
       // Load specifications properly from the JSON object
       Map<String, dynamic> specMap = widget.productToEdit!.specifications;
       
       if (specMap['État'] != null) _productCondition = specMap['État'];
       if (specMap['Autres informations'] != null) _customSpecsCtrl.text = specMap['Autres informations'];
       if (specMap['Couleurs'] != null && specMap['Couleurs'] is List) {
           for (String hex in specMap['Couleurs']) {
               try {
                  int cVal = int.parse(hex.replaceFirst('#', '0xFF'));
                  _selectedColors.add(Color(cVal));
               } catch(e) {}
           }
       }
       if (specMap['Paiement par prêt'] == 'Oui') {
           _acceptLoan = true;
           _firstAdvanceCtrl.text = specMap['Première avance']?.toString() ?? '';
           _installmentCtrl.text = specMap['Montant de versement']?.toString() ?? '';
           _loanFrequency = specMap['Fréquence de versement']?.toString() ?? 'Mensuel';
       }
       if (specMap['shipping_unit'] != null) _shippingUnit = specMap['shipping_unit'].toString();
       if (specMap['shipping_value'] != null) _shippingValueCtrl.text = specMap['shipping_value'].toString();
       
       // Specific Categories matching
       if (specMap['Marque'] != null) _electronicBrand = specMap['Marque'];
       if (specMap['Mémoire/Stockage'] != null) {
           if (specMap['Mémoire/Stockage'] is List) {
               _electronicMemories = List<String>.from(specMap['Mémoire/Stockage']);
           } else {
               _electronicMemories = [specMap['Mémoire/Stockage'].toString()];
           }
           
           for (var mem in _electronicMemories) {
               final variantMatch = _variants.firstWhere(
                  (v) => v['title'] == 'Capacité: $mem', 
                  orElse: () => <String, dynamic>{}
               );
               String priceText = '';
               if (variantMatch.isNotEmpty && variantMatch['price'] != null) {
                  priceText = variantMatch['price'].toString();
                  if (priceText.endsWith('.0')) priceText = priceText.substring(0, priceText.length - 2);
               }
               _memoryPriceControllers[mem] = TextEditingController(text: priceText);
           }
       }
       if (specMap['Taille'] != null) {
           if (specMap['Taille'] is List) {
               _modeSizes = List<String>.from(specMap['Taille']);
           } else {
               _modeSizes = [specMap['Taille'].toString()];
           }
       }
       if (specMap['Matière'] != null) {
           if (_category == 'Mode M/F') _modeMaterial = specMap['Matière'];
           if (_category == 'Maison & Bureau') _houseMaterial = specMap['Matière'];
       }
       if (specMap['Année'] != null) _yearCtrl.text = specMap['Année'];
       if (specMap['Kilométrage'] != null) _mileageCtrl.text = specMap['Kilométrage'];
       if (specMap['Poids/Volume'] != null) _foodWeight = specMap['Poids/Volume'];
       if (specMap['Conservation'] != null) _foodConservation = specMap['Conservation'];
       if (specMap['État spécifique'] != null) _houseCondition = specMap['État spécifique'];
       if (specMap['Surface'] != null) _immoSurface = specMap['Surface'];
       if (specMap['Pièces'] != null) _immoRooms = specMap['Pièces'];
       if (specMap['Facturation'] != null) _serviceBilling = specMap['Facturation'];
       _priceCtrl.text = widget.productToEdit!.price.toStringAsFixed(0);
       _stockCtrl.text = widget.productToEdit!.stock.toString();
       
       if (!_categories.contains(widget.productToEdit!.category)) {
           _categories.add(widget.productToEdit!.category);
       }
       _category = widget.productToEdit!.category;
       
       if (!_origins.contains(widget.productToEdit!.origin)) {
           _origins.add(widget.productToEdit!.origin);
       }
       _origin = widget.productToEdit!.origin;
       
       if (widget.productToEdit!.imageUrl.isNotEmpty) {
           _enhancedImageUrls.add(widget.productToEdit!.imageUrl);
       }
       if (widget.productToEdit!.galleryUrls != null && widget.productToEdit!.galleryUrls!.isNotEmpty) {
           for (var url in widget.productToEdit!.galleryUrls!) {
              if (url != widget.productToEdit!.imageUrl) _enhancedImageUrls.add(url);
           }
       }
       
       
       // S'assurer que le parent est reconstruit
       if (mounted) setState(() {});
    }
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initUserLocation();
      setState((){});
    });
  }

  void _showAddVariantDialog({int? editIndex}) {
    final Map<String, dynamic>? variantToEdit = editIndex != null ? _variants[editIndex] : null;
    final stockCtrl = TextEditingController(text: variantToEdit?['stock']?.toString() ?? '1');
    final priceCtrl = TextEditingController(text: variantToEdit?['price']?.toString() ?? '');
    List<String> selectedMemories = [];
    List<String> selectedSizes = [];
    String? selectedWeight;
    String? selectedSurface;
    String? selectedCondition;
    String? selectedDuration;
    List<Color> selectedVariantColors = [];
    
    if (variantToEdit != null) {
      // Restaurer les couleurs
      if (variantToEdit['colors'] != null) {
        for (String hex in variantToEdit['colors']) {
          try {
            selectedVariantColors.add(Color(int.parse(hex.replaceFirst('#', '0xFF'))));
          } catch(e) {}
        }
      }
      
      // Restaurer les sélections à partir du titre (Fallback pour compatibilité)
      String title = variantToEdit['title'] ?? '';
      List<String> parts = title.split(' - ');
      for (var p in parts) {
        if (p.startsWith('Capacité: ')) {
          selectedMemories = p.replaceFirst('Capacité: ', '').split(', ');
        } else if (p.startsWith('Taille: ')) {
          selectedSizes = p.replaceFirst('Taille: ', '').split(', ');
        } else if (['100g', '250g', '500g', '1 kg', '2 kg', '5 kg', '10 kg'].contains(p)) {
          selectedWeight = p;
        } else if (['Studio', 'T1', 'T2', 'T3', 'T4', 'T5+', 'Local commercial'].contains(p)) {
          selectedSurface = p;
        } else if (['Neuf', 'Friperie', 'Occasion', 'Très bon état', 'Bon état', 'Acceptable', 'Pour pièces'].contains(p)) {
          selectedCondition = p;
        } else if (['1 heure', '2 heures', '½ journée', '1 jour', '1 semaine', '1 mois', 'Forfait'].contains(p)) {
          selectedDuration = p;
        }
      }
    }

    final List<String> memoryOptions = ['64 Go', '128 Go', '256 Go', '512 Go', '1 To', '2 To'];
    final List<String> sizeOptions = [
      'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL',
      '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46',
      'Unique'
    ];
    final List<String> weightOptions = ['100g', '250g', '500g', '1 kg', '2 kg', '5 kg', '10 kg'];
    final List<String> surfaceOptions = ['Studio', 'T1', 'T2', 'T3', 'T4', 'T5+', 'Local commercial'];
    final List<String> conditionOptions = ['Neuf', 'Très bon état', 'Bon état', 'Acceptable', 'Pour pièces'];
    final List<String> durationOptions = ['1 heure', '2 heures', '½ journée', '1 jour', '1 semaine', '1 mois', 'Forfait'];
    final List<String> materialOptions = ['Coton', 'Soie', 'Laine', 'Polyester', 'Cuir', 'Jean', 'Lin', 'Synthétique'];
    final List<String> genderOptions = ['Unisexe', 'Homme', 'Femme'];
    final List<String> targetOptions = ['Adulte', 'Enfant', 'Bébé', 'Ado'];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          final isDark = Theme.of(context).brightness == Brightness.dark;
          final textColor = isDark ? Colors.white : Colors.black87;
          
          return Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
            child: Container(
              margin: const EdgeInsets.all(24),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: isDark ? AppColors.bgDark1 : Colors.white,
                borderRadius: BorderRadius.circular(24),
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('📝 Nouvelle Déclinaison', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: textColor)),
                    const SizedBox(height: 24),
                     if (_category == 'Électronique') ...[
                      Text('Capacité / Mémoire', style: TextStyle(fontWeight: FontWeight.bold, color: textColor)),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        children: memoryOptions.map((mem) {
                          final isSelected = selectedMemories.contains(mem);
                          return FilterChip(
                            label: Text(mem),
                            selected: isSelected,
                            onSelected: (selected) {
                              setModalState(() {
                                if (selected) selectedMemories.add(mem);
                                else selectedMemories.remove(mem);
                              });
                            },
                            selectedColor: AppColors.violet.withValues(alpha: 0.2),
                            checkmarkColor: AppColors.violet,
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // --- Mode ---
                    if (_category == 'Mode M/F' || _category == 'Beauté') ...[
                      Text('Taille', style: TextStyle(fontWeight: FontWeight.bold, color: textColor)),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        children: sizeOptions.map((size) {
                          final isSelected = selectedSizes.contains(size);
                          return FilterChip(
                            label: Text(size),
                            selected: isSelected,
                            onSelected: (selected) {
                              setModalState(() {
                                if (selected) selectedSizes.add(size);
                                else selectedSizes.remove(size);
                              });
                            },
                            selectedColor: AppColors.violet.withValues(alpha: 0.2),
                            checkmarkColor: AppColors.violet,
                            labelStyle: TextStyle(
                              color: isSelected ? AppColors.violet : textColor,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            ),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // --- Alimentation / Santé ---
                    if (_category == 'Alimentation / Épicerie' || _category == 'Santé') ...[
                      Text('Poids / Contenance', style: TextStyle(fontWeight: FontWeight.bold, color: textColor)),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<String>(
                        value: selectedWeight,
                        dropdownColor: isDark ? AppColors.bgDark1 : Colors.white,
                        style: TextStyle(color: textColor),
                        hint: Text('Sélectionner un poids', style: TextStyle(color: isDark ? Colors.grey : Colors.black54)),
                        decoration: InputDecoration(
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 15),
                        ),
                        items: weightOptions.map((o) => DropdownMenuItem(value: o, child: Text(o))).toList(),
                        onChanged: (v) => setModalState(() => selectedWeight = v),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // --- Immobilier ---
                    if (_category == 'Immobilier') ...[
                      Text('Type / Surface', style: TextStyle(fontWeight: FontWeight.bold, color: textColor)),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<String>(
                        value: selectedSurface,
                        dropdownColor: isDark ? AppColors.bgDark1 : Colors.white,
                        style: TextStyle(color: textColor),
                        hint: Text('Sélectionner un type', style: TextStyle(color: isDark ? Colors.grey : Colors.black54)),
                        decoration: InputDecoration(
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 15),
                        ),
                        items: surfaceOptions.map((o) => DropdownMenuItem(value: o, child: Text(o))).toList(),
                        onChanged: (v) => setModalState(() => selectedSurface = v),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // --- État (Condition) ---
                    if (['Auto/Moto', 'Maison & Bureau', 'Mode M/F', 'Beauté', 'Électronique'].contains(_category)) ...[
                      Text('État', style: TextStyle(fontWeight: FontWeight.bold, color: textColor)),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<String>(
                        value: selectedCondition,
                        dropdownColor: isDark ? AppColors.bgDark1 : Colors.white,
                        style: TextStyle(color: textColor),
                        hint: Text('Sélectionner un état', style: TextStyle(color: isDark ? Colors.grey : Colors.black54)),
                        decoration: InputDecoration(
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 15),
                        ),
                        items: ((_category == 'Mode M/F' || _category == 'Beauté') 
                                ? ['Neuf', 'Friperie', 'Occasion'] 
                                : conditionOptions)
                                .map((o) => DropdownMenuItem(value: o, child: Text(o))).toList(),
                        onChanged: (v) => setModalState(() => selectedCondition = v),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // --- Services ---
                    if (_category == 'Services') ...[
                      Text('Durée / Formule', style: TextStyle(fontWeight: FontWeight.bold, color: textColor)),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<String>(
                        value: selectedDuration,
                        dropdownColor: isDark ? AppColors.bgDark1 : Colors.white,
                        style: TextStyle(color: textColor),
                        hint: Text('Sélectionner une durée', style: TextStyle(color: isDark ? Colors.grey : Colors.black54)),
                        decoration: InputDecoration(
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 15),
                        ),
                        items: durationOptions.map((o) => DropdownMenuItem(value: o, child: Text(o))).toList(),
                        onChanged: (v) => setModalState(() => selectedDuration = v),
                      ),
                      const SizedBox(height: 16),
                    ],

                    Text('Couleurs de la déclinaison (Optionnel)', style: TextStyle(fontWeight: FontWeight.bold, color: textColor)),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: _availableColors.map((color) {
                        bool isSelected = selectedVariantColors.any((c) => c.value == color.value);
                        return GestureDetector(
                          onTap: () {
                            setModalState(() {
                              if (isSelected) {
                                selectedVariantColors.removeWhere((c) => c.value == color.value);
                              } else {
                                selectedVariantColors.add(color);
                              }
                            });
                          },
                          child: Container(
                            width: 36, height: 36,
                            decoration: BoxDecoration(
                              color: color,
                              shape: BoxShape.circle,
                              border: Border.all(color: isSelected ? AppColors.violet : Colors.black12, width: isSelected ? 3 : 1),
                              boxShadow: isSelected ? [BoxShadow(color: AppColors.violet.withValues(alpha: 0.4), blurRadius: 8, spreadRadius: 2)] : [],
                            ),
                            child: isSelected ? Icon(Icons.check, color: color.computeLuminance() > 0.5 ? Colors.black : Colors.white, size: 20) : null,
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 24),

                    Text('Quantité en stock', style: TextStyle(fontWeight: FontWeight.bold, color: textColor)),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: stockCtrl,
                      keyboardType: TextInputType.number,
                      style: TextStyle(color: textColor),
                      decoration: InputDecoration(
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 15),
                      ),
                    ),
                    const SizedBox(height: 24),

                    Text('Prix spécifique (FCFA - Optionnel)', style: TextStyle(fontWeight: FontWeight.bold, color: textColor)),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: priceCtrl,
                      keyboardType: TextInputType.number,
                      style: TextStyle(color: textColor),
                      decoration: InputDecoration(
                        hintText: 'Laisser vide pour utiliser le prix global',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 15),
                      ),
                    ),
                    const SizedBox(height: 32),

                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          List<String> parts = [];
                          if (selectedMemories.isNotEmpty) parts.add('Capacité: ${selectedMemories.join(', ')}');
                          if (selectedSizes.isNotEmpty) parts.add('Taille: ${selectedSizes.join(', ')}');
                          if (selectedWeight != null) parts.add(selectedWeight!);
                          if (selectedSurface != null) parts.add(selectedSurface!);
                          if (selectedCondition != null) parts.add(selectedCondition!);
                          if (selectedDuration != null) parts.add(selectedDuration!);
                          
                          if (parts.isEmpty) parts.add('Standard');
                          String title = parts.join(' - ');
                          
                          List<String> hexColors = selectedVariantColors.map((c) => '#${c.value.toRadixString(16).substring(2, 8).toUpperCase()}').toList();
                          
                          int parsedStock = int.tryParse(stockCtrl.text) ?? 1;
                          double? parsedPrice = double.tryParse(priceCtrl.text);
                          
                          setState(() {
                            final newVariant = {
                              'title': title,
                              'stock': parsedStock,
                              'price': parsedPrice,
                              'colors': hexColors,
                            };
                            if (editIndex != null) {
                              _variants[editIndex] = newVariant;
                            } else {
                              _variants.add(newVariant);
                            }
                          });
                          
                          Navigator.pop(ctx);
                        },
                        style: ElevatedButton.styleFrom(backgroundColor: AppColors.violet, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
                        child: Text(editIndex != null ? 'Modifier la déclinaison' : 'Ajouter la déclinaison', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  void _showAIOptionsDialog() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          margin: const EdgeInsets.all(24),
          padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 24),
          decoration: BoxDecoration(
            color: Theme.of(context).brightness == Brightness.dark ? AppColors.bgDark1 : Colors.white,
            borderRadius: BorderRadius.circular(24),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('⚙️ Configuration IA', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              const SizedBox(height: 8),
              const Text('Définissez le style visuel que l\'IA appliquera à votre produit.', textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: Colors.grey)),
              const SizedBox(height: 24),
              DropdownButtonFormField<String>(
                value: _aiBackgroundStyle,
                decoration: InputDecoration(
                  labelText: 'Style d\'Arrière-plan',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                ),
                items: _aiBgOptions.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                onChanged: (val) {
                  if (val != null) {
                    setModalState(() => _aiBackgroundStyle = val);
                    setState(() => _aiBackgroundStyle = val);
                  }
                },
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => context.pop(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.violet,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: const Text('Valider', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _enhanceWithBackend() async {
    if (_selectedXFiles.isEmpty) return;
    setState(() => _isAIGenerating = true);
    
    try {
      List<String> base64Images = [];
      for (var file in _selectedXFiles) {
        final bytes = await file.readAsBytes();
        base64Images.add('data:image/jpeg;base64,${base64Encode(bytes)}');
      }
      
      final apiClient = mosombi_api.ApiClient();
      final response = await apiClient.dio.post('/ai/enhance', data: {
        'images': base64Images,
        'prompt': 'Mode : $_aiBackgroundStyle. Optimiser l\'éclairage, rendu ultra-réaliste.'
      });

      if (response.statusCode == 200 && response.data['success']) {
        if (mounted) {
          setState(() {
            _isAIGenerating = false;
            _isAIEnhanced = true;
            _enhancedImageUrls = List<String>.from(response.data['data']['optimizedImageUrls'] ?? []);
            _generatedVideoUrl = response.data['data']['videoUrl'];
            
            if (!_descCtrl.text.contains("✨ Vidéo de présentation")) {
               _descCtrl.text = "${_descCtrl.text}\n\n✨ Vidéo de présentation 3s générée incluse par l'IA.".trim();
            }
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('✨ Magie IA : Image optimisée & Vidéo 3s prêtes !'), backgroundColor: Color(0xFF6C4EF6)),
          );
        }
      } else {
        throw Exception("Erreur API");
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isAIGenerating = false);
        ScaffoldMessenger.of(context).showSnackBar(
           SnackBar(content: Text('Erreur IA: ${e.toString()}'), backgroundColor: Colors.redAccent),
        );
      }
    }
  }

  bool _isEstimatingShipping = false;

  Future<void> _estimateShippingWithAI() async {
    if (_nameCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Veuillez d\'abord saisir le nom du produit')));
      return;
    }
    setState(() => _isEstimatingShipping = true);
    try {
      final apiClient = mosombi_api.ApiClient();
      final response = await apiClient.dio.post('/ai/estimate-shipping', data: {
        'name': _nameCtrl.text,
        'description': _descCtrl.text
      });
      if (response.statusCode == 200 && response.data['success']) {
        final data = response.data['data'];
        if (mounted) {
           setState(() {
             if (_shippingUnit == 'kg') {
               _shippingValueCtrl.text = data['weight_kg']?.toString() ?? '1.0';
             } else {
               _shippingValueCtrl.text = data['volume_cbm']?.toString() ?? '0.01';
             }
           });
           ScaffoldMessenger.of(context).showSnackBar(SnackBar(
             content: Text('✨ Estimation IA: ${data['weight_kg']} kg / ${data['volume_cbm']} CBM'),
             backgroundColor: const Color(0xFF6C4EF6)
           ));
        }
      }
    } catch (e) {
      if (mounted) {
         ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Erreur IA: $e'), backgroundColor: Colors.redAccent));
      }
    } finally {
      if (mounted) setState(() => _isEstimatingShipping = false);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isLoading = true);
    
    try {
      final productProvider = context.read<ProductProvider>();
      final agencyProvider = context.read<AgencyProvider>();
      final price = double.tryParse(_priceCtrl.text) ?? 0.0;
      
      // Auto-generate variants from electronic memories if applicable
      if (_category == 'Électronique' && _electronicMemories.isNotEmpty) {
        _variants.clear();
        for (var mem in _electronicMemories) {
           _variants.add({
             'title': 'Capacité: $mem',
             'stock': int.tryParse(_stockCtrl.text) ?? 1,
             'price': double.tryParse(_memoryPriceControllers[mem]?.text ?? '') ?? price,
             'colors': _selectedColors.isNotEmpty ? _selectedColors.map((c) => '#${c.value.toRadixString(16).substring(2, 8).toUpperCase()}').toList() : [],
           });
        }
      }

      int totalStock = 0;
      if (_variants.isNotEmpty) {
         for (var v in _variants) {
           totalStock += (v['stock'] as int?) ?? 0;
         }
      } else {
         totalStock = int.tryParse(_stockCtrl.text) ?? 1;
      }
      
      List<String> finalGallery = [];
      if (_enhancedImageUrls.isNotEmpty) {
          finalGallery = _enhancedImageUrls; // Utiliser la galerie générée par Google Gemini
      } else if (_selectedXFiles.isNotEmpty) {
          for (var file in _selectedXFiles) {
            try {
               final bytes = await file.readAsBytes();
               finalGallery.add('data:image/jpeg;base64,${base64Encode(bytes)}'); 
            } catch(e) {
               debugPrint('Erreur conversion image: $e');
            }
          }
      }
      
      String mainImageUrl = finalGallery.isNotEmpty ? finalGallery.first : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800'; 

      // Constitution des spécifications dynamiques
      Map<String, dynamic> specs = {};
      if (_category == 'Électronique') {
        specs['Marque'] = _electronicBrand;
         specs['Mémoire/Stockage'] = _electronicMemories;
      } else if (_category == 'Mode M/F') {
        specs['Taille'] = _modeSizes;
        specs['Matière'] = _modeMaterial;
        specs['Genre'] = _modeGender;
        specs['Public cible'] = _modeTarget;
      } else if (_category == 'Auto/Moto') {
        specs['Année'] = _yearCtrl.text;
        specs['Kilométrage'] = _mileageCtrl.text;
      } else if (_category == 'Alimentation / Épicerie') {
        specs['Poids/Volume'] = _foodWeight;
        specs['Conservation'] = _foodConservation;
      } else if (_category == 'Maison & Bureau') {
        specs['Matière'] = _houseMaterial;
        specs['État'] = _houseCondition;
      } else if (_category == 'Immobilier') {
        specs['Surface'] = _immoSurface;
        specs['Pièces'] = _immoRooms;
      } else if (_category == 'Services') {
        specs['Facturation'] = _serviceBilling;
      }

      if (_customSpecsCtrl.text.isNotEmpty) {
        specs['Autres informations'] = _customSpecsCtrl.text;
      }

      specs['État'] = _productCondition;
      if (_selectedColors.isNotEmpty) { // RETRAIT DE _variants.isEmpty POUR GARDER LES CERCLES COULEURS
        specs['Couleurs'] = _selectedColors.map((c) => '#${c.value.toRadixString(16).substring(2, 8).toUpperCase()}').toList();
      }
      if (_acceptLoan) {
        specs['Paiement par prêt'] = 'Oui';
        specs['Première avance'] = _firstAdvanceCtrl.text;
        specs['Montant de versement'] = _installmentCtrl.text;
        specs['Fréquence de versement'] = _loanFrequency;
      }
      
      specs['shipping_unit'] = _shippingUnit;
      specs['shipping_value'] = double.tryParse(_shippingValueCtrl.text) ?? 1.0;

      bool success;
      if (widget.productToEdit != null) {
          success = await productProvider.updateAgencyProduct(
            productId: widget.productToEdit!.id,
            name: _nameCtrl.text.trim(),
            description: _descCtrl.text.trim(),
            price: price,
            stock: totalStock, // Somme des variantes ou valeur manuelle
            category: _category,
            brand: _category == 'Électronique' ? _electronicBrand : null,
            origin: _origin,
            imageUrl: mainImageUrl, // Front cover
            galleryUrls: finalGallery, // Toutes les vues
            videoUrl: _generatedVideoUrl ?? "",
            deliveryTime: 'Standard', // Géré par l'admin désormais
            shippingUnit: _shippingUnit,
            shippingValue: double.tryParse(_shippingValueCtrl.text) ?? 1.0,
            specifications: specs,
            variants: _variants,
          );
      } else {
          success = await productProvider.createAgencyProduct(
            name: _nameCtrl.text.trim(),
            description: _descCtrl.text.trim(),
            price: price,
            stock: totalStock, // Somme des variantes ou valeur manuelle
            category: _category,
            brand: _category == 'Électronique' ? _electronicBrand : null,
            origin: _origin,
            agencyId: agencyProvider.currentAgency?.id ?? '',
            imageUrl: mainImageUrl, // Front cover
            galleryUrls: finalGallery, // Toutes les vues
            videoUrl: _generatedVideoUrl ?? "",
            deliveryTime: 'Standard', // Géré par l'admin désormais
            shippingUnit: _shippingUnit,
            shippingValue: double.tryParse(_shippingValueCtrl.text) ?? 1.0,
            specifications: specs,
            variants: _variants,
          );
      }

      if (!mounted) return;
      
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(widget.productToEdit != null ? 'Produit modifié avec succès ✅' : 'Produit ajouté avec succès ✅'), backgroundColor: Colors.green),
        );
        context.pop(true); // Return home
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(productProvider.error ?? 'Erreur lors de l\'ajout'), backgroundColor: Colors.redAccent),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  InputDecoration _buildInputDeco(String hint, bool isDark) {
    return InputDecoration(
      hintText: hint,
      labelText: hint,
      labelStyle: const TextStyle(color: Colors.grey, fontSize: 12),
      hintStyle: const TextStyle(color: Colors.grey),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
      filled: true,
      fillColor: isDark ? Colors.black26 : Colors.grey.shade100,
      contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 15),
    );
  }

  Widget _buildDynamicFields(bool isDark, Color textColor, Color hintColor) {
    if (_category == 'Électronique') {
      return Builder(builder: (context) {
              const List<String> memoryOptions = ['N/A', '64 Go', '128 Go', '256 Go', '512 Go', '1 To'];
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Capacité / Mémoire (Sélection multiple)', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 12)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 4,
                    children: memoryOptions.map((mem) {
                      final isSelected = _electronicMemories.contains(mem);
                      return FilterChip(
                        label: Text(mem, style: TextStyle(fontSize: 12, color: isSelected ? AppColors.violet : textColor)),
                        selected: isSelected,
                        onSelected: (selected) {
                          setState(() {
                            if (selected) {
                              _electronicMemories.add(mem);
                              _memoryPriceControllers[mem] = TextEditingController(text: _priceCtrl.text);
                            } else {
                              _electronicMemories.remove(mem);
                              _memoryPriceControllers[mem]?.dispose();
                              _memoryPriceControllers.remove(mem);
                            }
                          });
                        },
                        selectedColor: AppColors.violet.withValues(alpha: 0.1),
                        checkmarkColor: AppColors.violet,
                        backgroundColor: isDark ? Colors.black26 : Colors.grey.shade100,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8), side: BorderSide.none),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 16),
                  if (_electronicMemories.isNotEmpty) ...[
                    Text('Prix par Capacité/Mémoire (FCFA)', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 12)),
                    const SizedBox(height: 8),
                    ..._electronicMemories.map((mem) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8.0),
                        child: Row(
                          children: [
                            Container(
                              width: 80,
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                              decoration: BoxDecoration(color: isDark ? Colors.black26 : Colors.grey.shade200, borderRadius: BorderRadius.circular(12)),
                              child: Text(mem, style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 12)),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: TextFormField(
                                controller: _memoryPriceControllers[mem],
                                decoration: _buildInputDeco('Prix pour $mem', isDark),
                                keyboardType: TextInputType.number,
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                  ],
                  const SizedBox(height: 16),
                ],
              );
            });
    } else if (_category == 'Mode M/F') {
      final List<String> sizeOptions = [
        'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL',
        '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46',
        'Unique'
      ];
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_variants.isEmpty) ...[
            Text('Taille / Pointure (Sélection multiple)', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 12)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 4,
              children: sizeOptions.map((size) {
                final isSelected = _modeSizes.contains(size);
                return FilterChip(
                  label: Text(size, style: TextStyle(fontSize: 12, color: isSelected ? AppColors.violet : textColor)),
                  selected: isSelected,
                  onSelected: (selected) {
                    setState(() {
                      if (selected) _modeSizes.add(size);
                      else _modeSizes.remove(size);
                    });
                  },
                  selectedColor: AppColors.violet.withValues(alpha: 0.1),
                  checkmarkColor: AppColors.violet,
                  backgroundColor: isDark ? Colors.black26 : Colors.grey.shade100,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8), side: BorderSide.none),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
          ],
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _modeMaterial,
                  decoration: _buildInputDeco('Matière', isDark),
                  items: ['Coton', 'Cuir', 'Synthétique', 'Laine', 'Soie', 'Autre'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                  onChanged: (v) => setState(() => _modeMaterial = v!),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _modeGender,
                  decoration: _buildInputDeco('Genre', isDark),
                  items: ['Homme', 'Femme', 'Unisexe'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                  onChanged: (v) => setState(() => _modeGender = v!),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _modeTarget,
                  decoration: _buildInputDeco('Public cible', isDark),
                  items: ['Bébé', 'Enfant', 'Adulte'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                  onChanged: (v) => setState(() => _modeTarget = v!),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
        ],
      );
    } else if (_category == 'Auto/Moto') {
      return Column(
        children: [
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _yearCtrl,
                  decoration: _buildInputDeco('Année (ex: 2020)', isDark),
                  keyboardType: TextInputType.number,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: TextFormField(
                  controller: _mileageCtrl,
                  decoration: _buildInputDeco('Kilométrage (km)', isDark),
                  keyboardType: TextInputType.number,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
        ],
      );
    } else if (_category == 'Alimentation / Épicerie') {
      return Column(
        children: [
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _foodWeight,
                  decoration: _buildInputDeco('Poids / Volume', isDark),
                  items: ['N/A', '250g', '500g', '1 kg', '5 kg', '10 kg', '1 L', '5 L'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                  onChanged: (v) => setState(() => _foodWeight = v!),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _foodConservation,
                  decoration: _buildInputDeco('Conservation', isDark),
                  items: ['Frais', 'Sec', 'Surgelé', 'Conserve'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                  onChanged: (v) => setState(() => _foodConservation = v!),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
        ],
      );
    } else if (_category == 'Maison & Bureau') {
      return Column(
        children: [
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _houseMaterial,
                  decoration: _buildInputDeco('Matière', isDark),
                  items: ['Bois', 'Métal', 'Plastique', 'Verre', 'Tissu', 'Cuir', 'Autre'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                  onChanged: (v) => setState(() => _houseMaterial = v!),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _houseCondition,
                  decoration: _buildInputDeco('État', isDark),
                  items: ['Neuf', 'Bon état', 'À rénover'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                  onChanged: (v) => setState(() => _houseCondition = v!),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
        ],
      );
    } else if (_category == 'Immobilier') {
      return Column(
        children: [
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _immoSurface,
                  decoration: _buildInputDeco('Surface (approx)', isDark),
                  items: ['N/A', '20 m²', '50 m²', '100 m²', '200 m²', '500 m²', '+500 m²'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                  onChanged: (v) => setState(() => _immoSurface = v!),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _immoRooms,
                  decoration: _buildInputDeco('Pièces', isDark),
                  items: ['1 Pièce', '2 Pièces', '3 Pièces', '4 Pièces', '+5 Pièces'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                  onChanged: (v) => setState(() => _immoRooms = v!),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
        ],
      );
    } else if (_category == 'Services') {
      return Column(
        children: [
          DropdownButtonFormField<String>(
            value: _serviceBilling,
            decoration: _buildInputDeco('Mode de facturation', isDark),
            items: ['Forfait', 'Par Heure', 'Par Jour', 'Sur Devis'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
            onChanged: (v) => setState(() => _serviceBilling = v!),
          ),
          const SizedBox(height: 16),
        ],
      );
    }
    return const SizedBox.shrink(); // Aucune spécificité forte
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white54 : AppColors.textSecondaryLight;

    return Scaffold(
      backgroundColor: isDark ? AppColors.bgDark1 : Colors.white,
      appBar: MossombiAppBar(title: widget.productToEdit != null ? 'Modifier un Produit' : 'Ajouter un Produit'),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          physics: const BouncingScrollPhysics(),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(widget.productToEdit != null ? 'Modifier la fiche produit' : 'Créer une fiche produit', style: TextStyle(color: textColor, fontSize: 24, fontWeight: FontWeight.w900)),
                const SizedBox(height: 8),
                Text('Remplissez les informations de votre article pour le rendre visible sur le Marketplace.', style: TextStyle(color: hintColor, fontSize: 14)),
                const SizedBox(height: 24),

                // Sélecteur d'Image
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Galerie Produit (${_enhancedImageUrls.isNotEmpty ? _enhancedImageUrls.length : _selectedXFiles.length}/3)', style: TextStyle(color: textColor, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: [
                        for (int i = 0; i < (_enhancedImageUrls.isNotEmpty ? _enhancedImageUrls.length : _selectedXFiles.length); i++)
                          _buildThumbnail(i, isDark, hintColor),
                        
                        if ((_enhancedImageUrls.length + _selectedXFiles.length) < 3)
                          GestureDetector(
                            onTap: _showImageSourceDialog,
                            child: Container(
                              height: 120,
                              width: 100,
                              decoration: BoxDecoration(
                                color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.03),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: Colors.grey.withValues(alpha: 0.3), width: 2),
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.add_a_photo_rounded, size: 30, color: hintColor),
                                  const SizedBox(height: 8),
                                  Text('Ajouter', style: TextStyle(color: hintColor, fontSize: 12)),
                                ],
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ).animate().fade().slideY(begin: 0.1, end: 0, delay: 100.ms),
                const SizedBox(height: 16),

                // Feature IA
                if (_selectedXFiles.isNotEmpty && _enhancedImageUrls.isEmpty)
                  Row(
                    children: [
                      Expanded(
                        child: GlassContainer(
                          padding: EdgeInsets.zero,
                          child: InkWell(
                            onTap: _isAIGenerating || _isAIEnhanced ? null : _enhanceWithBackend,
                            borderRadius: BorderRadius.circular(24),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 300),
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                              decoration: BoxDecoration(
                                gradient: _isAIEnhanced ? null : AppGradients.primary,
                                color: _isAIEnhanced ? Colors.green.withValues(alpha: 0.1) : null,
                                borderRadius: BorderRadius.circular(24),
                                border: _isAIEnhanced ? Border.all(color: Colors.green) : null,
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  if (_isAIGenerating)
                                     const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                  else if (_isAIEnhanced)
                                     const Icon(Icons.check_circle_rounded, color: Colors.green)
                                  else
                                     const Icon(Icons.auto_awesome_rounded, color: Colors.white),
                                  const SizedBox(width: 12),
                                  Expanded(
                                     child: Text(
                                        _isAIGenerating
                                            ? 'Nettoyage IA en cours...'
                                            : (_isAIEnhanced ? 'Optimisé' : 'Optimiser image ✨'),
                                        style: TextStyle(
                                           color: _isAIEnhanced ? Colors.green : Colors.white,
                                           fontWeight: FontWeight.bold,
                                           fontSize: 13,
                                        ),
                                        textAlign: TextAlign.center,
                                        maxLines: 2,
                                     ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Bouton Configuration IA
                      GestureDetector(
                        onTap: _showAIOptionsDialog,
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.grey.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Icon(Icons.settings_suggest, color: AppColors.violet),
                        ),
                      )
                    ],
                  ).animate().fade().slideY(begin: 0.1, end: 0, delay: 150.ms),
                const SizedBox(height: 16),

                if (_generatedVideoUrl != null)
                  Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white.withValues(alpha: 0.1) : Colors.black.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.violet, width: 1),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: const BoxDecoration(color: AppColors.violet, shape: BoxShape.circle),
                          child: const Icon(Icons.video_library_rounded, color: Colors.white),
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Vidéo 3D (Spin 360°) prête', style: TextStyle(fontWeight: FontWeight.bold)),
                              Text('Animation générée par Google Veo.', style: TextStyle(fontSize: 12, color: Colors.grey)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ).animate().fade().slideY(delay: 150.ms),

                // Name
                GlassContainer(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                       Text('Nom du produit *', style: TextStyle(color: textColor, fontWeight: FontWeight.bold)),
                       const SizedBox(height: 8),
                       TextFormField(
                         controller: _nameCtrl,
                         style: TextStyle(color: textColor),
                         validator: (v) => v!.isEmpty ? 'Requis' : null,
                         decoration: InputDecoration(
                           hintText: 'Ex: Chaussure Nike',
                           hintStyle: TextStyle(color: hintColor),
                           border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                           filled: true,
                           fillColor: isDark ? Colors.black26 : Colors.grey.shade100,
                         ),
                       ),
                    ],
                  ),
                ).animate().fade().slideY(begin: 0.1, end: 0, delay: 200.ms),
                const SizedBox(height: 16),

                // Category & Origin
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      flex: 5,
                      child: GlassContainer(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Catégorie', style: TextStyle(color: textColor, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 8),
                            DropdownButtonFormField<String>(
                              value: _category,
                              isExpanded: true,
                              dropdownColor: isDark ? AppColors.bgDark1 : Colors.white,
                              style: TextStyle(color: textColor, fontSize: 13, fontWeight: FontWeight.w600),
                              decoration: InputDecoration(
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                                filled: true,
                                fillColor: isDark ? Colors.black26 : Colors.grey.shade100,
                                contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 15),
                              ),
                              items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                              onChanged: (v) => setState(() => _category = v!),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      flex: 4,
                      child: GlassContainer(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Origine', style: TextStyle(color: textColor, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 8),
                            DropdownButtonFormField<String>(
                            // Retrait de "value: _origin" d'ici pour le mettre en bas après l'initialisation des items
                              isExpanded: true,
                              dropdownColor: isDark ? AppColors.bgDark1 : Colors.white,
                              style: TextStyle(color: textColor, fontSize: 13, fontWeight: FontWeight.w600),
                              decoration: InputDecoration(
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                                filled: true,
                                fillColor: isDark ? Colors.black26 : Colors.grey.shade100,
                                contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 15),
                              ),
                              items: _origins.toSet().map((o) => DropdownMenuItem(value: o, child: Text(o))).toList(),
                              value: _origins.contains(_origin) ? _origin : _origins.first,
                              onChanged: (v) => setState(() => _origin = v!),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ).animate().fade().slideY(begin: 0.1, end: 0, delay: 250.ms),
                const SizedBox(height: 16),

                // Price & Stock
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      flex: 2,
                      child: GlassContainer(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Prix * (FCFA)', style: TextStyle(color: textColor, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 8),
                            TextFormField(
                              controller: _priceCtrl,
                              keyboardType: TextInputType.number,
                              style: TextStyle(color: textColor, fontWeight: FontWeight.w900, fontSize: 18),
                              validator: (v) => (double.tryParse(v ?? '') == null) ? 'Invalide' : null,
                              decoration: InputDecoration(
                                hintText: '0',
                                hintStyle: TextStyle(color: hintColor),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                                filled: true,
                                fillColor: isDark ? Colors.black26 : Colors.grey.shade100,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    if (_variants.isEmpty)
                      Expanded(
                        flex: 1,
                        child: GlassContainer(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Stock', style: TextStyle(color: textColor, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 8),
                              TextFormField(
                                controller: _stockCtrl,
                                keyboardType: TextInputType.number,
                                style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 16),
                                validator: (v) => (int.tryParse(v ?? '') == null) ? 'Erreur' : null,
                                decoration: InputDecoration(
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                                  filled: true,
                                  fillColor: isDark ? Colors.black26 : Colors.grey.shade100,
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 15),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ).animate().fade().slideY(begin: 0.1, end: 0, delay: 300.ms),
                const SizedBox(height: 16),

                // Logistique (Shipping)
                GlassContainer(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Logistique (International/Local)', style: TextStyle(color: textColor, fontWeight: FontWeight.bold)),
                          ElevatedButton.icon(
                            onPressed: _isEstimatingShipping ? null : _estimateShippingWithAI,
                            icon: _isEstimatingShipping 
                                ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                : const Icon(Icons.auto_awesome, size: 16, color: Colors.white),
                            label: Text(_isEstimatingShipping ? 'Calcul...' : 'Estimer via IA', style: const TextStyle(color: Colors.white, fontSize: 12)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.violet,
                              visualDensity: VisualDensity.compact,
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            flex: 2,
                            child: DropdownButtonFormField<String>(
                              value: _shippingUnit,
                              isExpanded: true,
                              dropdownColor: isDark ? AppColors.bgDark1 : Colors.white,
                              style: TextStyle(color: textColor, fontSize: 13, fontWeight: FontWeight.w600),
                              decoration: InputDecoration(
                                labelText: 'Unité',
                                labelStyle: const TextStyle(color: Colors.grey, fontSize: 12),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                                filled: true,
                                fillColor: isDark ? Colors.black26 : Colors.grey.shade100,
                                contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 15),
                              ),
                              items: const [
                                DropdownMenuItem(value: 'kg', child: Text('Poids (KG)')),
                                DropdownMenuItem(value: 'cbm', child: Text('Volume (CBM)')),
                              ],
                              onChanged: (v) => setState(() => _shippingUnit = v!),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            flex: 3,
                            child: TextFormField(
                              controller: _shippingValueCtrl,
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 16),
                              decoration: InputDecoration(
                                labelText: 'Valeur',
                                labelStyle: const TextStyle(color: Colors.grey, fontSize: 12),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                                filled: true,
                                fillColor: isDark ? Colors.black26 : Colors.grey.shade100,
                                contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 15),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text('Utilisé pour calculer automatiquement les frais de port (Avion/Bateau) lors du checkout.', style: TextStyle(color: hintColor, fontSize: 11)),
                    ],
                  ),
                ).animate().fade().slideY(begin: 0.1, end: 0, delay: 310.ms),
                const SizedBox(height: 16),

                // Variantes Section
                GlassContainer(
                   padding: const EdgeInsets.all(16),
                   child: Column(
                     crossAxisAlignment: CrossAxisAlignment.start,
                     children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Déclinaisons (Tailles/Couleurs)', style: TextStyle(color: textColor, fontWeight: FontWeight.bold)),
                            Container(
                              decoration: BoxDecoration(
                                color: AppColors.violet.withValues(alpha: 0.1),
                                shape: BoxShape.circle,
                              ),
                              child: IconButton(
                                onPressed: _showAddVariantDialog,
                                icon: const Icon(Icons.add, color: AppColors.violet),
                                tooltip: 'Ajouter une déclinaison',
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints(),
                                iconSize: 24,
                              ),
                            ),
                          ],
                        ),
                        if (_variants.isEmpty)
                           Text('Aucune déclinaison ajoutée. (Stock global : ${_stockCtrl.text})', style: TextStyle(color: hintColor, fontSize: 12))
                        else
                           Column(
                             children: _variants.map((v) => ListTile(
                               contentPadding: EdgeInsets.zero,
                               title: Text(v['title'], style: TextStyle(color: textColor, fontWeight: FontWeight.bold)),
                               subtitle: Text('En stock : ${v['stock']}${v['price'] != null ? ' - ${v['price']} FCFA' : ''}', style: const TextStyle(color: Colors.green)),
                               trailing: Row(
                                 mainAxisSize: MainAxisSize.min,
                                 children: [
                                   IconButton(
                                     icon: const Icon(Icons.edit_outlined, color: Colors.blueAccent),
                                     onPressed: () => _showAddVariantDialog(editIndex: _variants.indexOf(v)),
                                   ),
                                   IconButton(
                                     icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
                                     onPressed: () => setState(() => _variants.remove(v)),
                                   ),
                                 ],
                               ),
                             )).toList(),
                           )
                     ],
                   ),
                ).animate().fade().slideY(begin: 0.1, end: 0, delay: 320.ms),
                const SizedBox(height: 16),

                // Description
                GlassContainer(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Description du produit', style: TextStyle(color: textColor, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _descCtrl,
                        maxLines: 4,
                        style: TextStyle(color: textColor),
                        decoration: InputDecoration(
                          hintText: 'Décrivez les avantages et caractéristiques de l\'article...',
                          hintStyle: TextStyle(color: hintColor),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                          filled: true,
                          fillColor: isDark ? Colors.black26 : Colors.grey.shade100,
                        ),
                      ),
                    ],
                  ),
                ).animate().fade().slideY(begin: 0.1, end: 0, delay: 350.ms),
                const SizedBox(height: 16),

                // Dynamic Fields (Toujours affichés pour la cohérence globale)
                _buildDynamicFields(isDark, textColor, hintColor),

                // Condition, Couleurs et Prêt
                GlassContainer(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // ETAT & COULEURS (Masqués si des déclinaisons existent OU selon la catégorie)
                      if (_variants.isEmpty && !['Alimentation / Épicerie', 'Immobilier', 'Services', 'Santé'].contains(_category)) ...[
                        Text('État du produit', style: TextStyle(color: textColor, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: RadioListTile<String>(
                                title: Text('Neuf', style: TextStyle(color: textColor, fontSize: 14)),
                                contentPadding: EdgeInsets.zero,
                                value: 'Neuf',
                                groupValue: _productCondition,
                                activeColor: AppColors.violet,
                                onChanged: (v) => setState(() => _productCondition = v!),
                              ),
                            ),
                            Expanded(
                              child: RadioListTile<String>(
                                title: Text(_category == 'Mode M/F' ? 'Friperie' : 'Occasion', style: TextStyle(color: textColor, fontSize: 14)),
                                contentPadding: EdgeInsets.zero,
                                value: 'Occasion',
                                groupValue: _productCondition,
                                activeColor: AppColors.violet,
                                onChanged: (v) => setState(() => _productCondition = v!),
                              ),
                            ),
                          ],
                        ),
                        const Divider(height: 32),
                        
                        Text('Couleurs disponibles', style: TextStyle(color: textColor, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 12,
                          runSpacing: 12,
                          children: _availableColors.map((color) {
                            bool isSelected = _selectedColors.any((c) => c.value == color.value);
                            return GestureDetector(
                              onTap: () {
                                setState(() {
                                  if (isSelected) {
                                    _selectedColors.removeWhere((c) => c.value == color.value);
                                  } else {
                                    _selectedColors.add(color);
                                  }
                                });
                              },
                              child: Container(
                                width: 36, height: 36,
                                decoration: BoxDecoration(
                                  color: color,
                                  shape: BoxShape.circle,
                                  border: Border.all(color: isSelected ? AppColors.violet : Colors.black12, width: isSelected ? 3 : 1),
                                  boxShadow: isSelected ? [BoxShadow(color: AppColors.violet.withValues(alpha: 0.4), blurRadius: 8, spreadRadius: 2)] : [],
                                ),
                                child: isSelected ? Icon(Icons.check, color: color.computeLuminance() > 0.5 ? Colors.black : Colors.white, size: 20) : null,
                              ),
                            );
                          }).toList(),
                        ),
                        const Divider(height: 32),
                      ],
                      
                      // PRET
                      SwitchListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text('Accepter le paiement par prêt', style: TextStyle(color: textColor, fontWeight: FontWeight.bold)),
                        subtitle: Text('Permet aux clients d\'acheter à crédit.', style: TextStyle(color: hintColor, fontSize: 12)),
                        activeColor: AppColors.violet,
                        value: _acceptLoan,
                        onChanged: (v) => setState(() => _acceptLoan = v),
                      ),
                      if (_acceptLoan) ...[
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              flex: 1,
                              child: TextFormField(
                                controller: _firstAdvanceCtrl,
                                keyboardType: TextInputType.number,
                                style: TextStyle(color: textColor),
                                decoration: InputDecoration(
                                  labelText: '1ère Avance (FCFA)',
                                  labelStyle: const TextStyle(fontSize: 12),
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                                  filled: true,
                                  fillColor: isDark ? Colors.black26 : Colors.grey.shade100,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              flex: 1,
                              child: TextFormField(
                                controller: _installmentCtrl,
                                keyboardType: TextInputType.number,
                                style: TextStyle(color: textColor),
                                decoration: InputDecoration(
                                  labelText: 'Versement',
                                  labelStyle: const TextStyle(fontSize: 12),
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                                  filled: true,
                                  fillColor: isDark ? Colors.black26 : Colors.grey.shade100,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              flex: 1,
                              child: DropdownButtonFormField<String>(
                                value: _loanFrequency,
                                isExpanded: true,
                                dropdownColor: isDark ? AppColors.bgDark1 : Colors.white,
                                style: TextStyle(color: textColor, fontSize: 13, fontWeight: FontWeight.w600),
                                decoration: InputDecoration(
                                  labelText: 'Fréquence',
                                  labelStyle: const TextStyle(fontSize: 12),
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                                  filled: true,
                                  fillColor: isDark ? Colors.black26 : Colors.grey.shade100,
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 15),
                                ),
                                items: const [
                                  DropdownMenuItem(value: 'Journalier', child: Text('Journalier')),
                                  DropdownMenuItem(value: 'Hebdomadaire', child: Text('Hebdo.')),
                                  DropdownMenuItem(value: 'Mensuel', child: Text('Mensuel')),
                                ],
                                onChanged: (v) => setState(() => _loanFrequency = v!),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ).animate().fade().slideY(begin: 0.1, end: 0, delay: 365.ms),
                const SizedBox(height: 16),

                // Autres détails
                GlassContainer(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Autres spécificités', style: TextStyle(color: textColor, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _customSpecsCtrl,
                        maxLines: 2,
                        decoration: InputDecoration(
                           hintText: 'Couleur, garantie, détails (optionnel).',
                           hintStyle: TextStyle(color: hintColor),
                           border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                           filled: true,
                           fillColor: isDark ? Colors.black26 : Colors.grey.shade100,
                        ),
                        style: TextStyle(color: textColor),
                      ),
                    ],
                  ),
                ).animate().fade().slideY(begin: 0.1, end: 0, delay: 380.ms),
                const SizedBox(height: 32),

                // Submit
                ElevatedButton(
                  onPressed: _isLoading ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.violet,
                    padding: const EdgeInsets.symmetric(vertical: 20),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 5,
                    shadowColor: AppColors.violet.withValues(alpha: 0.5),
                  ),
                  child: _isLoading
                      ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : Text(widget.productToEdit != null ? 'Enregistrer les modifications' : 'Publier l\'article', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                ).animate().fade().scale(curve: Curves.easeOutBack, delay: 400.ms),
                
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

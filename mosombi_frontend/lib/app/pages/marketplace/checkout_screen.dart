import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:dio/dio.dart';
import 'package:mosombi_frontend/core/network/api_config.dart';
import 'package:path_provider/path_provider.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:record/record.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:mosombi_frontend/core/providers/cart_provider.dart';
import 'package:mosombi_frontend/core/providers/product_provider.dart';
import 'package:mosombi_frontend/core/models/cart_item_model.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/product_image.dart';
import 'package:mosombi_frontend/core/widgets/order_success_overlay.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mosombi_frontend/core/providers/auth_provider.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:mosombi_frontend/core/services/geocoding_service.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart' as ll;

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  int _selectedPaymentMethod = 0; // 0: Portefeuille, 1: Livraison
  final Set<String> _expandedCheckoutGroups = {};
  
  String _selectedCountry = 'Bénin';
  final List<String> _countries = ['Bénin', 'Togo', 'Côte d\'Ivoire', 'Congo RDC', 'Congo Brazza', 'France'];

  final SpeechToText _speechToText = SpeechToText();
  bool _speechEnabled = false;

  // Matrice de secours (Fallback) si l'API est vide
  final Map<String, dynamic> _fallbackMatrix = {
    'Bénin': {
      'International': {
        'enabled': true,
        'methods': {
          'intl_avion_express': {'label': 'Avion Express', 'price': 15000, 'unit': 'kg', 'time': '3-5', 'time_unit': 'jours'},
          'intl_avion_normal': {'label': 'Avion Normal', 'price': 10000, 'unit': 'kg', 'time': '7-12', 'time_unit': 'jours'},
          'intl_maritime': {'label': 'Maritime', 'price': 450000, 'unit': 'cbm', 'time': '30-45', 'time_unit': 'jours'},
        }
      },
      'Local': {
        'enabled': true,
        'methods': {
          'local_express': {'label': 'Express', 'price': 2500, 'unit': 'course', 'time': '1-3', 'time_unit': 'heures'},
          'local_normal': {'label': 'Normal', 'price': 1000, 'unit': 'course', 'time': '24', 'time_unit': 'heures'},
        }
      }
    },
    'Togo': {
      'International': {
        'enabled': true,
        'methods': {
          'intl_avion_express': {'label': 'Avion Express', 'price': 16000, 'unit': 'kg', 'time': '3-5', 'time_unit': 'jours'},
          'intl_avion_normal': {'label': 'Avion Normal', 'price': 11000, 'unit': 'kg', 'time': '7-12', 'time_unit': 'jours'},
          'intl_maritime': {'label': 'Maritime', 'price': 480000, 'unit': 'cbm', 'time': '30-45', 'time_unit': 'jours'},
        }
      },
      'Local': {
        'enabled': true,
        'methods': {
          'local_express': {'label': 'Express', 'price': 3000, 'unit': 'course', 'time': '2', 'time_unit': 'heures'},
          'local_normal': {'label': 'Normal', 'price': 1500, 'unit': 'course', 'time': '24', 'time_unit': 'heures'},
        }
      }
    }
  };

  final Map<String, String> _groupDeliveryMethods = {};

  List<Map<String, dynamic>> _savedAddresses = [];
  int? _selectedAddressIndex;
  
  final _cityCtrl = TextEditingController();
  final _streetCtrl = TextEditingController();
  final _numberCtrl = TextEditingController();
  final _detailsCtrl = TextEditingController();
  double _detectedLat = 0.0;
  double _detectedLong = 0.0;
  bool _saveToBackpack = true;

  final AudioRecorder _audioRecorder = AudioRecorder();
  String? _voiceNotePath;
  String? _voiceNoteBase64;
  bool _isRecordingVoice = false;
  Map<String, dynamic>? _matchedZone;
  final GeocodingService _geocodingService = GeocodingService();
  bool _isLoadingLocation = false;
  final MapController _mapController = MapController();

  @override
  void initState() {
    super.initState();
    _loadSavedAddresses();
    _initSpeech();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CartProvider>().fetchLogisticsSettings();
      _initUserLocation();
    });
  }

  void _initSpeech() async {
    try {
      _speechEnabled = await _speechToText.initialize();
      setState(() {});
    } catch (e) {
      debugPrint('Speech initialization failed: $e');
    }
  }

  Future<void> _loadSavedAddresses() async {
    // 1. Try loading from backend API first
    try {
      final dio = Dio(BaseOptions(baseUrl: ApiConfig.baseUrl, connectTimeout: const Duration(seconds: 10), receiveTimeout: const Duration(seconds: 10)));
      final token = await const FlutterSecureStorage().read(key: 'access_token');
      if (token != null && token.isNotEmpty) {
        final response = await dio.get('/users/delivery-addresses', options: Options(headers: {'Authorization': 'Bearer $token'}));
        if (response.statusCode == 200 && response.data['success'] == true) {
          final List<dynamic> apiAddresses = response.data['data'] ?? [];
          if (apiAddresses.isNotEmpty) {
            setState(() {
              _savedAddresses = apiAddresses.map((e) => Map<String, dynamic>.from(e)).toList();
            });
            // Cache locally
            final prefs = await SharedPreferences.getInstance();
            await prefs.setString('backpack_addresses', jsonEncode(_savedAddresses));
            debugPrint('✅ Loaded ${_savedAddresses.length} addresses from backend');
            return;
          }
        }
      }
    } catch (e) {
      debugPrint('⚠️ Backend address load failed, falling back to local: $e');
    }

    // 2. Fallback to SharedPreferences
    final prefs = await SharedPreferences.getInstance();
    final jsonString = prefs.getString('backpack_addresses');
    if (jsonString != null) {
      try {
        final List<dynamic> decoded = jsonDecode(jsonString);
        setState(() {
          _savedAddresses = decoded.map((e) => Map<String, dynamic>.from(e)).toList();
        });
      } catch (e) {
        debugPrint('Erreur lors du chargement des adresses : $e');
      }
    }
  }

  /// Syncs the current _savedAddresses list to both SharedPreferences and backend API.
  Future<void> _syncAddresses() async {
    // Save locally
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('backpack_addresses', jsonEncode(_savedAddresses));

    // Save to backend
    try {
      final dio = Dio(BaseOptions(baseUrl: ApiConfig.baseUrl, connectTimeout: const Duration(seconds: 10), receiveTimeout: const Duration(seconds: 10)));
      final token = await const FlutterSecureStorage().read(key: 'access_token');
      if (token != null && token.isNotEmpty) {
        await dio.put('/users/delivery-addresses', data: {'addresses': _savedAddresses}, options: Options(headers: {'Authorization': 'Bearer $token'}));
        debugPrint('✅ Addresses synced to backend (${_savedAddresses.length})');
      }
    } catch (e) {
      debugPrint('⚠️ Backend address sync failed: $e');
    }
  }

  @override
  void dispose() {
    _cityCtrl.dispose();
    _streetCtrl.dispose();
    _numberCtrl.dispose();
    _detailsCtrl.dispose();
    _audioRecorder.dispose();
    super.dispose();
  }

  String _mapIsoToCountry(String? isoCode) {
    if (isoCode == null) return _selectedCountry;
    switch (isoCode.toUpperCase()) {
      case 'BJ': return 'Bénin';
      case 'CG': return 'Congo Brazza';
      case 'CD': return 'Congo RDC';
      case 'CM': return 'Cameroun';
      case 'CI': return 'Côte d\'Ivoire';
      case 'TG': return 'Togo';
      case 'FR': return 'France';
      case 'SN': return 'Sénégal';
      case 'MA': return 'Maroc';
      case 'DZ': return 'Algérie';
      case 'TN': return 'Tunisie';
      default: return _selectedCountry;
    }
  }

  void _initUserLocation() {
    final authState = ref.read(authProvider);
    final user = authState.user;
    if (user != null && user.phone != null) {
      final p = user.phone!.replaceAll(' ', '').replaceAll('-', '');
      String detected = _selectedCountry;
      if (p.startsWith('+242') || p.startsWith('242')) detected = 'Congo Brazza';
      else if (p.startsWith('+243') || p.startsWith('243')) detected = 'Congo RDC';
      else if (p.startsWith('+237') || p.startsWith('237')) detected = 'Cameroun';
      else if (p.startsWith('+225') || p.startsWith('225')) detected = 'Côte d\'Ivoire';
      else if (p.startsWith('+228') || p.startsWith('228')) detected = 'Togo';
      else if (p.startsWith('+229') || p.startsWith('229')) detected = 'Bénin';
      else if (p.startsWith('+33') || p.startsWith('33')) detected = 'France';
      else if (p.startsWith('+221') || p.startsWith('221')) detected = 'Sénégal';
      else if (p.startsWith('+212') || p.startsWith('212')) detected = 'Maroc';
      else if (p.startsWith('+213') || p.startsWith('213')) detected = 'Algérie';
      else if (p.startsWith('+216') || p.startsWith('216')) detected = 'Tunisie';
      
      setState(() => _selectedCountry = detected);
    }
  }

  Map<String, dynamic> _getEffectiveMatrix(CartProvider cart) {
    if (cart.logisticsSettings.isEmpty) return _fallbackMatrix;
    return cart.logisticsSettings;
  }

  // Helper pour extraire les données d'une section (Local ou une Origine Intl)
  Map<String, dynamic> _getSectionData(Map<String, dynamic> countryData, String origin) {
    if (origin == 'Local') {
      final local = countryData['Local'] ?? {};
      return Map<String, dynamic>.from(local is Map ? local : {});
    }
    
    // Pour l'international
    final intl = countryData['International'] ?? {};
    if (intl is! Map) return {};
    
    final origins = intl['origins'] ?? {};
    if (origins is Map && origins.containsKey(origin)) {
      final originData = origins[origin] ?? {};
      return Map<String, dynamic>.from(originData is Map ? originData : {});
    }
    
    // Fallback ancienne structure
    return Map<String, dynamic>.from(intl);
  }

  // Helper pour extraire les méthodes d'une section
  Map<String, dynamic> _getMethods(Map<String, dynamic> sectionData) {
    if (sectionData.containsKey('methods')) {
      return sectionData['methods'] as Map<String, dynamic>;
    }
    // Si pas de clé 'methods', on considère que l'objet lui-même contient les méthodes (ancienne structure)
    return sectionData.map((key, value) => MapEntry(key.toString(), value));
  }

  IconData _getMethodIcon(String methodId) {
    final id = methodId.toLowerCase();
    if (id.contains('avion_express')) return Icons.bolt_rounded;
    if (id.contains('avion_normal')) return Icons.flight_takeoff_rounded;
    if (id.contains('maritime') || id.contains('bateau')) return Icons.directions_boat_rounded;
    if (id.contains('express')) return Icons.electric_moped_rounded;
    return Icons.local_shipping_rounded;
  }

  double _getGroupDeliveryFee(String groupKey, List<CartItem> items, String origin, CartProvider cart) {
     final method = _groupDeliveryMethods[groupKey];
     if (method == null) return 0.0;
     
     final matrix = _getEffectiveMatrix(cart);
     final countryData = matrix[_selectedCountry] ?? (matrix.isNotEmpty ? matrix.values.first : {});
     
     final bool isLocal = origin.contains('Local') || 
                          origin.contains('Congo-Brazzaville') || 
                          origin.contains('Congo Brazza') || 
                          origin.toLowerCase() == _selectedCountry.toLowerCase();
     final String cleanOrigin = isLocal ? 'Local' : origin.split(' ').first;
     final sectionData = _getSectionData(countryData, cleanOrigin);
     
     final bool isEnabled = sectionData['enabled'] ?? true;
     if (!isEnabled) return 0.0;

     final methods = _getMethods(sectionData);
     final methodData = methods[method];
     
     if (methodData == null) return 0.0;

     double price = double.tryParse(methodData['price']?.toString() ?? '0') ?? 0.0;
     
     double totalKg = 0;
     double totalCbm = 0;
     for (var item in items) {
        double val = item.product.shippingValue ?? 0;
        String unit = item.product.shippingUnit?.toLowerCase() ?? '';
        if (unit == 'kg') totalKg += val * item.quantity;
        else if (unit == 'cbm') totalCbm += val * item.quantity;
     }

     if (cleanOrigin == 'Local') {
        double threshold = double.tryParse(methodData['threshold_weight']?.toString() ?? '10.0') ?? 10.0;
        double fixedPrice = double.tryParse(methodData['fixed_price']?.toString() ?? price.toString()) ?? price;
        double perKgPrice = double.tryParse(methodData['price_per_kg']?.toString() ?? (price / 10).toString()) ?? (price / 10);

        double baseFee = (totalKg < threshold) ? fixedPrice : (perKgPrice * totalKg);
        
        // PRIORITÉ 1: Geofencing (si une zone a été matchée par coordonnées GPS)
        if (_matchedZone != null) {
          double zFee = double.tryParse(_matchedZone!['base_fee']?.toString() ?? '0.0') ?? 0.0;
          double zMult = double.tryParse(_matchedZone!['multiplier']?.toString() ?? '1.0') ?? 1.0;
          return (baseFee * zMult) + zFee;
        }

        // PRIORITÉ 2: Matching textuel par quartier (fallback)
        final addr = _selectedAddressIndex != null && _selectedAddressIndex! < _savedAddresses.length 
            ? _savedAddresses[_selectedAddressIndex!] 
            : {
                'city': _cityCtrl.text.trim(),
                'street': _streetCtrl.text.trim(),
              };
        
        final cityName = addr['city']?.toString() ?? '';
        final streetName = addr['street']?.toString() ?? '';
        
        final cities = sectionData['cities'] as Map?;
        final cityConfig = cities?[cityName];
        
        if (cityConfig != null && cityConfig['zones'] != null) {
          final zones = cityConfig['zones'] as Map;
          var multiplier = 1.0;
          var additionalFee = 0.0;
          
          zones.forEach((zoneName, zoneData) {
            if (zoneData is Map) {
              final neighborhoods = List<String>.from(zoneData['neighborhoods'] ?? []);
              if (neighborhoods.contains(streetName)) {
                multiplier = double.tryParse(zoneData['multiplier']?.toString() ?? '1.0') ?? 1.0;
                additionalFee = double.tryParse(zoneData['fee']?.toString() ?? '0.0') ?? 0.0;
              }
            }
          });
          
          return (baseFee * multiplier) + additionalFee;
        }

        return baseFee;
     }

     if (methodData['unit'] == 'kg') return price * totalKg;
     if (methodData['unit'] == 'cbm') return price * totalCbm;
     
     return price;
  }

  void _processCheckout(BuildContext context, CartProvider cart, ProductProvider products) async {
    final categorized = cart.categorizedItems;
    
    String finalAddress = '';
    double? lat;
    double? long;
    String? voiceNote;

    if (_selectedAddressIndex != null && _selectedAddressIndex! < _savedAddresses.length) {
       final addr = _savedAddresses[_selectedAddressIndex!];
       finalAddress = '${addr['country'] ?? _selectedCountry}, ${addr['city'] ?? ''}, ${addr['street'] ?? ''} ${addr['number'] ?? ''} - ${addr['details'] ?? ''}';
       lat = addr['lat'];
       long = addr['long'];
       voiceNote = addr['voice_note'];
    } else {
       if (_cityCtrl.text.trim().isEmpty || _streetCtrl.text.trim().isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Veuillez renseigner votre ville et votre rue.'), backgroundColor: Colors.redAccent));
          return;
       }
       finalAddress = '$_selectedCountry, ${_cityCtrl.text.trim()}, ${_streetCtrl.text.trim()} ${_numberCtrl.text.trim()} - ${_detailsCtrl.text.trim()}';
       lat = _detectedLat;
       long = _detectedLong;
       voiceNote = _voiceNoteBase64;

       if (_saveToBackpack) {
           final newAddr = {
              'country': _selectedCountry,
              'city': _cityCtrl.text.trim(),
              'street': _streetCtrl.text.trim(),
              'number': _numberCtrl.text.trim(),
              'details': _detailsCtrl.text.trim(),
              'lat': lat,
              'long': long,
              'voice_note': voiceNote,
           };
           bool exists = _savedAddresses.any((a) => a['city'] == newAddr['city'] && a['street'] == newAddr['street'] && a['number'] == newAddr['number']);
           if (!exists) {
              _savedAddresses.add(newAddr);
              _syncAddresses();
           }
       }
    }

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator(color: Color(0xFF00E5C5))),
    );

    bool allSuccess = true;
    
    for (var payType in categorized.keys) {
      final itemsByOrigin = <String, List<CartItem>>{};
      for (var coarseOrigin in categorized[payType]!.keys) {
        for (var item in categorized[payType]![coarseOrigin]!) {
          final origin = item.product.origin ?? 'Local';
          final isLocal = origin.contains('Local') || 
                          origin.contains('Congo-Brazzaville') || 
                          origin.contains('Congo Brazza') || 
                          origin.toLowerCase() == _selectedCountry.toLowerCase();
          final key = isLocal ? 'Local' : origin;
          itemsByOrigin.putIfAbsent(key, () => []).add(item);
        }
      }

      for (var origin in itemsByOrigin.keys) {
        final items = itemsByOrigin[origin]!;
        if (items.isEmpty) continue;

        final method = _groupDeliveryMethods[origin];
        if (method == null) {
          debugPrint('Checkout warning: no delivery method selected for origin $origin');
          continue;
        }
        
        final success = await cart.submitSubOrder(
          subItems: items,
          deliveryMethod: method,
          deliveryAddress: finalAddress,
          productProvider: products,
          paymentMethod: payType == 'loan' ? 'credit_application' : (_selectedPaymentMethod == 0 ? 'wallet' : 'cash_on_delivery'),
          latitude: lat,
          longitude: long,
          voiceNote: voiceNote,
        );

        if (!success) allSuccess = false;
      }
    }

    // Dismiss loading spinner
    if (context.mounted) {
      context.pop();
    }
    
    if (allSuccess) {
        if (context.mounted) {
          // Show full-screen animated success overlay
          Navigator.of(context).push(
            PageRouteBuilder(
              opaque: true,
              transitionDuration: const Duration(milliseconds: 500),
              reverseTransitionDuration: const Duration(milliseconds: 300),
              pageBuilder: (ctx, anim, secondAnim) {
                return OrderSuccessOverlay(
                  onViewOrders: () {
                    // Pop everything back to home and switch to Orders tab (index 1)
                    Navigator.of(ctx).popUntil((route) => route.isFirst);
                    context.go('/home', extra: {'initialTab': 1});
                  },
                  onContinueShopping: () {
                    // Pop everything back to home
                    Navigator.of(ctx).popUntil((route) => route.isFirst);
                    context.go('/home');
                  },
                );
              },
              transitionsBuilder: (ctx, anim, secondAnim, child) {
                return FadeTransition(opacity: anim, child: child);
              },
            ),
          );
        }
      } else {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Certaines parties de votre commande n\'ont pu être validées.'), backgroundColor: Colors.redAccent),
          );
        }
      }
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();
    final products = context.watch<ProductProvider>();
    final categorized = cart.categorizedItems;
    
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white.withValues(alpha: 0.5) : AppColors.textSecondaryLight;

    final effectiveMatrix = _getEffectiveMatrix(cart);
    final countriesList = effectiveMatrix.keys.toList();
    if (countriesList.isEmpty) countriesList.add('Bénin');
    if (!countriesList.contains(_selectedCountry)) {
       countriesList.add(_selectedCountry);
    }

    double totalDelivery = 0;
    
    Set<String> activeOrigins = {};
    categorized.forEach((payType, origins) {
      origins.forEach((origin, items) {
        if (items.isNotEmpty) activeOrigins.add(origin);
      });
    });

    for (var origin in activeOrigins) {
      List<CartItem> allOriginItems = [];
      categorized.forEach((payType, origins) {
         if (origins[origin] != null) allOriginItems.addAll(origins[origin]!);
      });
      if (allOriginItems.isNotEmpty) {
         totalDelivery += _getGroupDeliveryFee(origin, allOriginItems, origin, cart);
      }
    }

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: const MossombiAppBar(title: 'Paiement'),
      body: AnimatedGradientBg(
        isDark: isDark,
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: EdgeInsets.only(top: MediaQuery.of(context).padding.top + AppBar().preferredSize.height + 20, left: 24, right: 24, bottom: 24),
                physics: const BouncingScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ..._buildGroupWidgets(categorized, isDark, textColor, hintColor, cart),

                    const SizedBox(height: 24),
                    Text('Méthode de paiement (Cash)', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    _buildPaymentMethod(0, 'Mossombi Pay', Icons.account_balance_wallet_rounded, const Color(0xFF00E5C5), textColor),
                    const SizedBox(height: 12),
                    _buildPaymentMethod(1, 'Payer à la livraison', Icons.delivery_dining_rounded, const Color(0xFFFF9800), textColor),

                    const SizedBox(height: 32),

                    _buildDeliveryAddressSection(isDark, textColor, hintColor),

                    const SizedBox(height: 32),
                    
                    GlassContainer(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [Text('Articles', style: TextStyle(color: hintColor)), Text('${cart.totalAmount.toStringAsFixed(0)} FCFA', style: TextStyle(color: textColor, fontWeight: FontWeight.bold))],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [Text('Total Livraison', style: TextStyle(color: hintColor)), Text('${totalDelivery.toStringAsFixed(0)} FCFA', style: TextStyle(color: textColor, fontWeight: FontWeight.bold))],
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            child: Divider(color: hintColor.withValues(alpha: 0.2)),
                          ),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [Text('Total Général', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.w900)), Text('${(cart.totalAmount + totalDelivery).toStringAsFixed(0)} FCFA', style: const TextStyle(color: Color(0xFF00E5C5), fontSize: 22, fontWeight: FontWeight.w900, letterSpacing: -1))],
                          ),
                        ],
                      ),
                    ).animate(delay: 300.ms).fade().slideY(begin: 0.2, end: 0),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
            
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E1E2C) : Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 20, offset: const Offset(0, -5))],
              ),
              child: SafeArea(
                top: false,
                child: ElevatedButton.icon(
                  onPressed: () => _processCheckout(context, cart, products),
                  icon: const Icon(Icons.check_circle_rounded, color: Colors.white),
                  label: const Text('Confirmer tout', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16)),
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size(double.infinity, 56),
                    backgroundColor: const Color(0xFF6C4EF6),
                    elevation: 10,
                    shadowColor: const Color(0xFF6C4EF6).withValues(alpha: 0.4),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                ).animate(delay: 400.ms).scale(curve: Curves.elasticOut),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildGroupWidgets(Map<String, Map<String, List<CartItem>>> categorized, bool isDark, Color textColor, Color hintColor, CartProvider cart) {
    final allCashItems = <CartItem>[];
    final allLoanItems = <CartItem>[];
    categorized['cash']?.forEach((origin, items) => allCashItems.addAll(items));
    categorized['loan']?.forEach((origin, items) => allLoanItems.addAll(items));

    if (allCashItems.isEmpty && allLoanItems.isEmpty) return [];

    final itemsByOrigin = <String, List<CartItem>>{};
    for (var item in [...allCashItems, ...allLoanItems]) {
      final origin = item.product.origin ?? 'Local';
      final isLocal = origin.contains('Local') || 
                      origin.contains('Congo-Brazzaville') || 
                      origin.contains('Congo Brazza') || 
                      origin.toLowerCase() == _selectedCountry.toLowerCase();
      final key = isLocal ? 'Local' : origin;
      itemsByOrigin.putIfAbsent(key, () => []).add(item);
    }

    double subTotal = 0;
    for (var item in [...allCashItems, ...allLoanItems]) {
      subTotal += item.unitPrice * item.quantity;
    }

    return [
      GlassContainer(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(gradient: const LinearGradient(colors: [Color(0xFF6C4EF6), Color(0xFF9D7BFF)]), borderRadius: BorderRadius.circular(10)),
                    child: const Icon(Icons.receipt_long_rounded, color: Colors.white, size: 18),
                  ),
                  const SizedBox(width: 10),
                  Text('Votre commande', style: TextStyle(color: textColor, fontWeight: FontWeight.w900, fontSize: 16)),
                ]),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: const Color(0xFF00E5C5).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                  child: Text('${allCashItems.length + allLoanItems.length} article(s)', style: const TextStyle(color: Color(0xFF00E5C5), fontSize: 11, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            const Divider(height: 24),

            if (allCashItems.isNotEmpty) ...[
              Text('CASH (Paiement Comptant)', style: TextStyle(color: textColor, fontSize: 13, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              ..._buildGroupedItems(allCashItems, isDark, textColor, hintColor, 'cash', cart),
              const SizedBox(height: 8),
            ],

            if (allLoanItems.isNotEmpty) ...[
              if (allCashItems.isNotEmpty) const Divider(height: 16),
              Text('PRET (Paiement Echelonne)', style: TextStyle(color: textColor, fontSize: 13, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              ..._buildGroupedItems(allLoanItems, isDark, textColor, hintColor, 'loan', cart),
              const SizedBox(height: 8),
            ],

            const Divider(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Sous-total articles', style: TextStyle(color: hintColor, fontSize: 13)),
                Text('${subTotal.toStringAsFixed(0)} F', style: TextStyle(color: textColor, fontSize: 14, fontWeight: FontWeight.bold)),
              ],
            ),

            const SizedBox(height: 16),
            const Divider(height: 16),
            Text('Mode de livraison :', style: TextStyle(color: textColor, fontSize: 13, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            ...itemsByOrigin.entries.map((entry) {
              final origin = entry.key;
              final items = entry.value;

              double totalKg = 0;
              double totalCbm = 0;
              for (var i in items) {
                final val = i.product.shippingValue ?? 0;
                final unit = i.product.shippingUnit?.toLowerCase() ?? '';
                if (unit == 'kg') totalKg += val * i.quantity;
                else if (unit == 'cbm') totalCbm += val * i.quantity;
              }

              String totalStr = '';
              if (totalKg > 0) totalStr += '${totalKg.toStringAsFixed(2)} kg';
              if (totalCbm > 0) totalStr += '${totalStr.isNotEmpty ? " + " : ""}${totalCbm.toStringAsFixed(3)} cbm';

              final fee = _getGroupDeliveryFee(origin, items, origin, cart);

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(origin == 'Local' ? '📍 Articles locaux' : '✈️ Articles importes ($origin)', style: TextStyle(color: hintColor, fontSize: 11, fontWeight: FontWeight.w600)),
                            Row(children: [
                              if (totalStr.isNotEmpty)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  margin: const EdgeInsets.only(right: 6),
                                  decoration: BoxDecoration(color: AppColors.violet.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(4)),
                                  child: Text(totalStr, style: const TextStyle(color: AppColors.violet, fontSize: 9, fontWeight: FontWeight.bold)),
                                ),
                              if (fee > 0)
                                Text('${fee.toStringAsFixed(0)} F', style: TextStyle(color: textColor, fontSize: 11, fontWeight: FontWeight.w900)),
                            ]),
                          ],
                        ),
                        if (origin == 'Local') ...[
                          Builder(builder: (context) {
                            final method = _groupDeliveryMethods[origin];
                            final matrix = _getEffectiveMatrix(cart);
                            final countryData = matrix[_selectedCountry] ?? (matrix.isNotEmpty ? matrix.values.first : {});
                            final originData = _getSectionData(countryData, 'Local');
                            
                            final bool isEnabled = originData['enabled'] ?? true;
                            if (!isEnabled) return const SizedBox.shrink();

                            final methods = _getMethods(originData);
                            final methodData = methods[method] ?? {};
                            final threshold = double.tryParse(methodData['threshold_weight']?.toString() ?? '10.0') ?? 10.0;

                            return Padding(
                              padding: const EdgeInsets.only(top: 2),
                              child: Text(totalKg < threshold 
                                ? '💡 Tarif fixe car moins de ${threshold.toStringAsFixed(0)}kg' 
                                : '💡 Facturé au kg car ${threshold.toStringAsFixed(0)}kg ou plus', 
                                style: TextStyle(color: totalKg < threshold ? Colors.blue : Colors.orange, fontSize: 8, fontWeight: FontWeight.bold)),
                            );
                          })
                        ]
                      ],
                    ),
                  ),
                  _buildDetailedDeliveryOptions(origin, origin, items, cart, textColor, hintColor),
                  const SizedBox(height: 16),
                ],
              );
            }).toList(),
          ],
        ),
      ),
    ];
  }

  List<Widget> _buildGroupedItems(List<CartItem> items, bool isDark, Color textColor, Color hintColor, String prefix, CartProvider cart) {
    final Map<String, List<CartItem>> grouped = {};
    for (var item in items) {
      grouped.putIfAbsent(item.product.id, () => []).add(item);
    }

    return grouped.entries.map((entry) {
      final productId = entry.key;
      final variants = entry.value;
      final first = variants.first;
      final groupKey = '${prefix}_$productId';
      final isExpanded = _expandedCheckoutGroups.contains(groupKey);

      int totalQty = 0;
      double totalPrice = 0;
      double productTotalKg = 0;
      double productTotalCbm = 0;
      final colorSet = <String>{};
      final variantSet = <String>{};
      final variantKeys = <String>[];
      for (var v in variants) {
        totalQty += v.quantity;
        totalPrice += v.unitPrice * v.quantity;
        if (v.selectedColor != null) colorSet.add(v.selectedColor!);
        if (v.selectedVariant != null) variantSet.add(v.selectedVariant!);
        
        final val = v.product.shippingValue ?? 0;
        final unit = v.product.shippingUnit?.toLowerCase() ?? '';
        if (unit == 'kg') productTotalKg += val * v.quantity;
        else if (unit == 'cbm') productTotalCbm += val * v.quantity;

        final key = cart.items.entries.firstWhere((e) => e.value == v, orElse: () => MapEntry('', v)).key;
        if (key.isNotEmpty) variantKeys.add(key);
      }

      String productShipStr = '';
      if (productTotalKg > 0) productShipStr += '${productTotalKg.toStringAsFixed(2)} kg';
      if (productTotalCbm > 0) productShipStr += '${productShipStr.isNotEmpty ? " + " : ""}${productTotalCbm.toStringAsFixed(3)} cbm';

      return Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Column(children: [
          Row(children: [
            ClipRRect(borderRadius: BorderRadius.circular(8), child: ProductImageHelper.buildImage(first.product.imageUrl, width: 40, height: 40, fit: BoxFit.cover, errorWidget: Container(width: 40, height: 40, color: Colors.grey[300]))),
            const SizedBox(width: 10),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Text(first.product.name ?? 'Produit', style: TextStyle(color: textColor, fontSize: 13, fontWeight: FontWeight.w700), maxLines: 1, overflow: TextOverflow.ellipsis),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: (first.product.origin ?? 'Local').contains('Local') ? Colors.blue.withValues(alpha: 0.1) : Colors.orange.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(4)),
                  child: Text((first.product.origin ?? 'Local').contains('Local') ? '📍 Local' : '✈️ ${first.product.origin}', style: TextStyle(color: (first.product.origin ?? 'Local').contains('Local') ? Colors.blue : Colors.orange, fontSize: 8, fontWeight: FontWeight.bold)),
                ),
                if (productShipStr.isNotEmpty) ...[
                   const SizedBox(width: 6),
                   Text('($productShipStr)', style: TextStyle(color: hintColor, fontSize: 9, fontWeight: FontWeight.bold)),
                ],
              ]),
              const SizedBox(height: 2),
              Row(children: [
                ...colorSet.map((c) {
                  Color parsed;
                  try { final hex = c.replaceAll('#', ''); parsed = Color(int.parse(hex.length == 6 ? 'FF$hex' : hex, radix: 16)); } catch (_) { parsed = Colors.grey; }
                  return Container(width: 10, height: 10, margin: const EdgeInsets.only(right: 3), decoration: BoxDecoration(color: parsed, shape: BoxShape.circle, border: Border.all(color: Colors.grey.withValues(alpha: 0.3))));
                }),
                if (colorSet.isNotEmpty) const SizedBox(width: 4),
                if (variantSet.isNotEmpty)
                  Flexible(child: Text(variantSet.join(', '), style: TextStyle(color: hintColor, fontSize: 9), maxLines: 1, overflow: TextOverflow.ellipsis)),
              ]),
            ])),
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Text('${totalPrice.toStringAsFixed(0)} F', style: TextStyle(color: textColor, fontSize: 12, fontWeight: FontWeight.bold)),
              Row(mainAxisSize: MainAxisSize.min, children: [
                Text('x$totalQty', style: TextStyle(color: hintColor, fontSize: 10, fontWeight: FontWeight.bold)),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: () { for (var k in variantKeys) cart.removeItem(k); },
                  child: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 14),
                ),
              ]),
            ]),
          ]),

          if (variants.length > 1) ...[
            const SizedBox(height: 6),
            GestureDetector(
              onTap: () => setState(() { if (isExpanded) _expandedCheckoutGroups.remove(groupKey); else _expandedCheckoutGroups.add(groupKey); }),
              child: Row(children: [
                Icon(isExpanded ? Icons.expand_less_rounded : Icons.expand_more_rounded, color: AppColors.violet, size: 14),
                const SizedBox(width: 4),
                Text(isExpanded ? 'Masquer' : 'Details (${variants.length} variantes)', style: const TextStyle(color: AppColors.violet, fontSize: 10, fontWeight: FontWeight.bold)),
              ]),
            ),
          ],

          if (isExpanded) ...[
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: isDark ? Colors.white.withValues(alpha: 0.03) : Colors.grey.withValues(alpha: 0.04), borderRadius: BorderRadius.circular(10)),
              child: Column(children: variants.asMap().entries.map((e) {
                final idx = e.key;
                final item = e.value;
                final cartKey = variantKeys[idx];
                Color? pc;
                if (item.selectedColor != null) { try { final h = item.selectedColor!.replaceAll('#', ''); pc = Color(int.parse(h.length == 6 ? 'FF$h' : h, radix: 16)); } catch (_) { pc = Colors.grey; } }
                return Padding(padding: const EdgeInsets.only(bottom: 4), child: Row(children: [
                  if (pc != null) Container(width: 10, height: 10, margin: const EdgeInsets.only(right: 6), decoration: BoxDecoration(color: pc, shape: BoxShape.circle, border: Border.all(color: Colors.grey.withValues(alpha: 0.3)))),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(item.selectedVariant ?? '-', style: TextStyle(color: hintColor, fontSize: 10)),
                    if ((item.product.shippingValue ?? 0) > 0)
                      Text('${item.product.shippingValue} ${item.product.shippingUnit ?? ''} / unité', style: TextStyle(color: hintColor.withValues(alpha: 0.7), fontSize: 8)),
                  ])),
                  Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                    Text('x${item.quantity}', style: TextStyle(color: hintColor, fontSize: 10, fontWeight: FontWeight.bold)),
                    if ((item.product.shippingValue ?? 0) > 0)
                      Text('${((item.product.shippingValue ?? 0) * item.quantity).toStringAsFixed(2)} ${item.product.shippingUnit ?? ''}', style: TextStyle(color: textColor, fontSize: 9, fontWeight: FontWeight.bold)),
                  ]),
                  const SizedBox(width: 8),
                  Text('${(item.unitPrice * item.quantity).toStringAsFixed(0)} F', style: TextStyle(color: textColor, fontSize: 10, fontWeight: FontWeight.bold)),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: () => cart.removeItem(cartKey),
                    child: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 14),
                  ),
                ]));
              }).toList()),
            ),
          ],
        ]),
      );
    }).toList();
  }

  Widget _buildDetailedDeliveryOptions(String groupKey, String origin, List<CartItem> items, CartProvider cart, Color textColor, Color hintColor) {
    final matrix = _getEffectiveMatrix(cart);
    final countryData = matrix[_selectedCountry] ?? (matrix.isNotEmpty ? matrix.values.first : {});
    
    final String cleanOrigin = origin.contains('Local') ? 'Local' : origin.split(' ').first;
    final sectionData = _getSectionData(countryData, cleanOrigin);
    final methods = _getMethods(sectionData);
    
    if (methods.isEmpty) return const Text('Aucune option disponible', style: TextStyle(color: Colors.redAccent, fontSize: 11));

    final hasKg = items.any((i) => i.product.shippingUnit?.toLowerCase() == 'kg');
    final hasCbm = items.any((i) => i.product.shippingUnit?.toLowerCase() == 'cbm');

    final airOptions = methods.entries.where((e) => e.value is Map && e.value['unit'] == 'kg').toList();
    final seaOptions = methods.entries.where((e) => e.value is Map && e.value['unit'] == 'cbm').toList();
    final otherOptions = methods.entries.where((e) => e.value is Map && e.value['unit'] != 'kg' && e.value['unit'] != 'cbm').toList();

    final List<MapEntry<String, dynamic>> filteredAir = hasKg ? airOptions : [];
    final List<MapEntry<String, dynamic>> filteredSea = hasCbm ? seaOptions : [];

    if (filteredAir.isEmpty && filteredSea.isEmpty && otherOptions.isEmpty) {
       return Text('Aucun mode de transport compatible (${hasKg ? "Poids" : ""} ${hasCbm ? "Volume" : ""})', style: const TextStyle(color: Colors.redAccent, fontSize: 10));
    }

    if (_groupDeliveryMethods[groupKey] == null) {
       if (filteredAir.isNotEmpty) _groupDeliveryMethods[groupKey] = filteredAir.first.key;
       else if (filteredSea.isNotEmpty) _groupDeliveryMethods[groupKey] = filteredSea.first.key;
       else if (otherOptions.isNotEmpty) _groupDeliveryMethods[groupKey] = otherOptions.first.key;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (filteredAir.isNotEmpty) ...[
          if (origin != 'Local') Padding(padding: const EdgeInsets.only(bottom: 8), child: Row(children: [const Icon(Icons.flight_takeoff_rounded, size: 14, color: AppColors.violet), const SizedBox(width: 6), Text('Transport par Avion (Vols)', style: TextStyle(color: textColor, fontSize: 11, fontWeight: FontWeight.bold))])),
          ...filteredAir.map((e) => _buildOptionCard(groupKey, e.key, e.value, textColor, hintColor)),
        ],
        if (filteredSea.isNotEmpty) ...[
          if (filteredAir.isNotEmpty) const SizedBox(height: 12),
          if (origin != 'Local') Padding(padding: const EdgeInsets.only(bottom: 8), child: Row(children: [const Icon(Icons.directions_boat_rounded, size: 14, color: Colors.blue), const SizedBox(width: 6), Text('Transport par Bateau (Maritime)', style: TextStyle(color: textColor, fontSize: 11, fontWeight: FontWeight.bold))])),
          ...filteredSea.map((e) => _buildOptionCard(groupKey, e.key, e.value, textColor, hintColor)),
        ],
        if (otherOptions.isNotEmpty) ...[
          if (filteredAir.isNotEmpty || filteredSea.isNotEmpty) const SizedBox(height: 12),
          ...otherOptions.map((e) => _buildOptionCard(groupKey, e.key, e.value, textColor, hintColor)),
        ],
      ],
    );
  }

  Widget _buildOptionCard(String groupKey, String methodId, dynamic data, Color textColor, Color hintColor) {
    final isSelected = _groupDeliveryMethods[groupKey] == methodId;
    final label = data['label']?.toString() ?? 'Option';
    final time = data['time']?.toString() ?? '?';
    final timeUnit = data['time_unit']?.toString() ?? '';
    
    // Pour le local, on affiche le fixed_price s'il existe (ex: 1050 F au lieu de 1000 F)
    final bool isLocal = groupKey == 'Local';
    final String priceStr = (isLocal && data.containsKey('fixed_price')) 
        ? data['fixed_price'].toString() 
        : data['price']?.toString() ?? '0';
        
    final unit = data['unit']?.toString() ?? '';
    final icon = _getMethodIcon(methodId);

    return GestureDetector(
      onTap: () => setState(() => _groupDeliveryMethods[groupKey] = methodId),
      child: Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isSelected ? const Color(0xFF6C4EF6).withValues(alpha: 0.1) : Colors.transparent,
              border: Border.all(color: isSelected ? const Color(0xFF6C4EF6) : Colors.grey.withValues(alpha: 0.2)),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(icon, size: 20, color: isSelected ? const Color(0xFF6C4EF6) : Colors.grey),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: isSelected ? const Color(0xFF6C4EF6) : textColor)),
                      Text('Délai : $time $timeUnit', style: TextStyle(fontSize: 11, color: hintColor)),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('$priceStr F / $unit', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: isSelected ? const Color(0xFF6C4EF6) : textColor)),
                    if (isSelected) const Icon(Icons.check_circle, size: 16, color: Color(0xFF6C4EF6)),
                  ],
                ),
              ],
            ),
          ),
        );
  }

  Widget _buildPaymentMethod(int index, String title, IconData icon, Color color, Color textColor) {
    final isSelected = _selectedPaymentMethod == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedPaymentMethod = index),
      child: GlassContainer(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Icon(isSelected ? Icons.radio_button_checked : Icons.radio_button_off, color: isSelected ? const Color(0xFF6C4EF6) : Colors.grey),
            const SizedBox(width: 16),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: color.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(8)),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(child: Text(title, style: TextStyle(color: textColor, fontWeight: FontWeight.w800, fontSize: 15))),
          ],
        ),
      ),
    );
  }

  Widget _buildDeliveryAddressSection(bool isDark, Color textColor, Color hintColor) {
    final hasManualAddr = _cityCtrl.text.isNotEmpty && _streetCtrl.text.isNotEmpty;
    final hasSavedAddr = _selectedAddressIndex != null && _selectedAddressIndex! < _savedAddresses.length;

    return GlassContainer(
      padding: const EdgeInsets.all(20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(gradient: const LinearGradient(colors: [Color(0xFF6C4EF6), Color(0xFF9D7BFF)]), borderRadius: BorderRadius.circular(12)),
            child: const Icon(Icons.location_on_rounded, color: Colors.white, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Adresse de Livraison', style: TextStyle(color: textColor, fontSize: 17, fontWeight: FontWeight.w900)),
            const SizedBox(height: 2),
            Text('Ou souhaitez-vous etre livre ?', style: TextStyle(color: hintColor, fontSize: 12)),
          ])),
        ]),
        const SizedBox(height: 16),

        // Current address display
        if (hasSavedAddr) ...[
          _buildSelectedAddrCard(_savedAddresses[_selectedAddressIndex!], textColor, hintColor, isDark, onChange: () => setState(() => _selectedAddressIndex = null)),
        ] else if (hasManualAddr) ...[
          _buildManualAddrCard(textColor, hintColor, isDark),
        ] else ...[
          Container(
            width: double.infinity, padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: Colors.amber.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(14), border: Border.all(color: Colors.amber.withValues(alpha: 0.3))),
            child: Row(children: [
              const Icon(Icons.warning_amber_rounded, color: Colors.amber, size: 20), const SizedBox(width: 10),
              Expanded(child: Text('Aucune adresse. Choisissez-en une ou ajoutez-en.', style: TextStyle(color: hintColor, fontSize: 12))),
            ]),
          ),
        ],
        const SizedBox(height: 16),

        // Two action buttons
        Row(children: [
          Expanded(child: _buildActionBtn(
            Icons.backpack_rounded, 
            'Sac a dos (${_savedAddresses.where((a) => a['country'] == _selectedCountry).length})', 
            AppColors.violet.withValues(alpha: 0.1), 
            AppColors.violet, 
            () => _showBackpackModal(isDark, textColor, hintColor)
          )),
          const SizedBox(width: 12),
          Expanded(child: Material(
            borderRadius: BorderRadius.circular(14),
            child: Ink(
              decoration: BoxDecoration(gradient: const LinearGradient(colors: [Color(0xFF00E5C5), Color(0xFF00C9B0)]), borderRadius: BorderRadius.circular(14)),
              child: InkWell(borderRadius: BorderRadius.circular(14), onTap: () => _showAddAddressModal(isDark, textColor, hintColor),
                child: const Padding(padding: EdgeInsets.symmetric(vertical: 14),
                  child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(Icons.add_location_alt_rounded, color: Colors.white, size: 18), SizedBox(width: 8), Text('Nouvelle adresse', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold))]),
                ),
              ),
            ),
          )),
        ]),
      ]),
    );
  }

  Widget _buildSelectedAddrCard(Map<String, dynamic> addr, Color textColor, Color hintColor, bool isDark, {required VoidCallback onChange}) {
    return Container(padding: const EdgeInsets.all(14), decoration: BoxDecoration(color: const Color(0xFF00E5C5).withValues(alpha: 0.08), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFF00E5C5).withValues(alpha: 0.3))),
      child: Row(children: [
        const Icon(Icons.check_circle_rounded, color: Color(0xFF00E5C5), size: 22), const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('${addr['city'] ?? ''}', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 14)),
          Text('${addr['street'] ?? ''} ${addr['number'] ?? ''} ${(addr['details'] ?? '').toString().isNotEmpty ? '- ${addr['details']}' : ''}', style: TextStyle(color: hintColor, fontSize: 12)),
        ])),
        GestureDetector(onTap: onChange, child: Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5), decoration: BoxDecoration(color: AppColors.violet.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)), child: const Text('Changer', style: TextStyle(color: AppColors.violet, fontSize: 11, fontWeight: FontWeight.bold)))),
      ]),
    );
  }

  Widget _buildManualAddrCard(Color textColor, Color hintColor, bool isDark) {
    return Container(padding: const EdgeInsets.all(14), decoration: BoxDecoration(color: const Color(0xFF00E5C5).withValues(alpha: 0.08), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFF00E5C5).withValues(alpha: 0.3))),
      child: Row(children: [
        const Icon(Icons.edit_location_alt_rounded, color: Color(0xFF00E5C5), size: 22), const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(_cityCtrl.text, style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 14)),
          Text('${_streetCtrl.text} ${_numberCtrl.text} ${_detailsCtrl.text.isNotEmpty ? '- ${_detailsCtrl.text}' : ''}', style: TextStyle(color: hintColor, fontSize: 12)),
        ])),
        GestureDetector(onTap: () => _showAddAddressModal(isDark, textColor, hintColor), child: Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5), decoration: BoxDecoration(color: AppColors.violet.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)), child: const Text('Modifier', style: TextStyle(color: AppColors.violet, fontSize: 11, fontWeight: FontWeight.bold)))),
      ]),
    );
  }

  Widget _buildActionBtn(IconData icon, String label, Color bg, Color fg, VoidCallback onTap) {
    return GestureDetector(onTap: onTap, child: Container(padding: const EdgeInsets.symmetric(vertical: 14), decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(14), border: Border.all(color: fg.withValues(alpha: 0.3))),
      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(icon, color: fg, size: 18), const SizedBox(width: 8), Text(label, style: TextStyle(color: fg, fontSize: 13, fontWeight: FontWeight.bold))]),
    ));
  }

  void _showBackpackModal(bool isDark, Color textColor, Color hintColor) {
    showModalBottomSheet(context: context, isScrollControlled: true, backgroundColor: Colors.transparent, builder: (ctx) {
      return StatefulBuilder(builder: (ctx, setMS) {
        final list = _savedAddresses.where((a) => a['country'] == _selectedCountry).toList();
        return Container(
          constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.65),
          decoration: BoxDecoration(color: isDark ? const Color(0xFF1E1E2C) : Colors.white, borderRadius: const BorderRadius.vertical(top: Radius.circular(28))),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(margin: const EdgeInsets.only(top: 12), width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.withValues(alpha: 0.3), borderRadius: BorderRadius.circular(2))),
            Padding(padding: const EdgeInsets.all(20), child: Row(children: [
              const Icon(Icons.backpack_rounded, color: AppColors.violet, size: 24), const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Mon Sac a dos', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.w900)),
                Text('$_selectedCountry - ${list.length} adresse(s)', style: TextStyle(color: hintColor, fontSize: 12)),
              ])),
              GestureDetector(onTap: () => Navigator.pop(ctx), child: Icon(Icons.close_rounded, color: hintColor)),
            ])),
            Divider(color: hintColor.withValues(alpha: 0.15), height: 1),
            if (list.isEmpty)
              Padding(padding: const EdgeInsets.all(40), child: Column(children: [
                Icon(Icons.location_off_rounded, color: hintColor, size: 48), const SizedBox(height: 12),
                Text('Aucune adresse', style: TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text('Ajoutez votre premiere adresse pour ce pays.', textAlign: TextAlign.center, style: TextStyle(color: hintColor, fontSize: 13)),
              ]))
            else
              Flexible(child: ListView.builder(shrinkWrap: true, padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8), itemCount: list.length, itemBuilder: (ctx, i) {
                final addr = list[i];
                final gIdx = _savedAddresses.indexOf(addr);
                final isSel = _selectedAddressIndex == gIdx;
                return GestureDetector(
                onTap: () async { 
                  setState(() => _selectedAddressIndex = gIdx); 
                  Navigator.pop(ctx);
                  
                  // Déclencher le matching de zone si des coordonnées sont présentes
                  if (addr['lat'] != null && addr['long'] != null) {
                    final zone = await _geocodingService.matchLogisticsZone(
                      double.tryParse(addr['lat'].toString()) ?? 0,
                      double.tryParse(addr['long'].toString()) ?? 0,
                    );
                    if (mounted) {
                      setState(() {
                        _matchedZone = zone != null ? Map<String, dynamic>.from(zone) : null;
                      });
                    }
                  } else {
                    setState(() => _matchedZone = null);
                  }
                },
                  child: Container(margin: const EdgeInsets.only(bottom: 10), padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(color: isSel ? AppColors.violet.withValues(alpha: 0.1) : (isDark ? Colors.white.withValues(alpha: 0.04) : Colors.grey.withValues(alpha: 0.05)), borderRadius: BorderRadius.circular(16), border: Border.all(color: isSel ? AppColors.violet : Colors.grey.withValues(alpha: 0.15), width: isSel ? 2 : 1)),
                    child: Row(children: [
                      Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: isSel ? AppColors.violet.withValues(alpha: 0.15) : Colors.grey.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                        child: Icon(Icons.location_on_rounded, color: isSel ? AppColors.violet : hintColor, size: 20)),
                      const SizedBox(width: 12),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('${addr['city'] ?? ''}', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 14)),
                        Text('${addr['street'] ?? ''} ${addr['number'] ?? ''}', style: TextStyle(color: hintColor, fontSize: 12)),
                        if ((addr['details'] ?? '').toString().isNotEmpty) Text('${addr['details']}', style: TextStyle(color: hintColor.withValues(alpha: 0.7), fontSize: 11, fontStyle: FontStyle.italic)),
                      ])),
                      if (isSel) const Icon(Icons.check_circle_rounded, color: AppColors.violet, size: 22)
                      else GestureDetector(
                        onTap: () async {
                          setState(() { _savedAddresses.removeAt(gIdx); if (_selectedAddressIndex == gIdx) _selectedAddressIndex = null; if (_selectedAddressIndex != null && _selectedAddressIndex! > gIdx) _selectedAddressIndex = _selectedAddressIndex! - 1; });
                          setMS(() {});
                          _syncAddresses();
                        },
                        child: Container(padding: const EdgeInsets.all(6), decoration: BoxDecoration(color: Colors.redAccent.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)), child: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 16)),
                      ),
                    ]),
                  ),
                );
              })),
            const SizedBox(height: 16),
          ]),
        );
      });
    });
  }

  Future<void> _handleLocationPick(StateSetter setMS, TextEditingController eCity, TextEditingController eStreet, Map cities) async {
    setMS(() => _isLoadingLocation = true);
    setState(() => _isLoadingLocation = true);

    try {
      final position = await _geocodingService.getCurrentPosition();
      if (position == null) {
        setMS(() => _isLoadingLocation = false);
        setState(() => _isLoadingLocation = false);
        return;
      }

      // 1. Matcher la zone logistique via le backend d'abord (GÉOFENCING)
      final zone = await _geocodingService.matchLogisticsZone(position.latitude, position.longitude);
      if (zone != null) {
        debugPrint('Geofencing Match (Pre): ${zone['name']}');
        setState(() {
          _matchedZone = Map<String, dynamic>.from(zone);
        });
      } else {
        setState(() => _matchedZone = null);
      }

      // 2. Récupérer l'adresse lisible (Natif -> OSM)
      final geoAddr = await _geocodingService.reverseGeocode(position.latitude, position.longitude);
      
      if (geoAddr != null) {
        // Mettre à jour le pays si détecté
        final detectedCountry = _mapIsoToCountry(geoAddr.countryCode);
        if (detectedCountry != _selectedCountry) {
          setState(() => _selectedCountry = detectedCountry);
          setMS(() {});
        }

        // Construire les labels lisibles
        String city = geoAddr.city ?? '';
        String neighborhood = geoAddr.neighborhood ?? '';
        String street = geoAddr.street ?? '';
        String poi = geoAddr.poi ?? '';
        
        // Recoupage intelligent : si un quartier de la zone correspond au POI ou à la rue
        bool matched = false;
        if (_matchedZone != null && _matchedZone!['neighborhoods'] != null) {
          final zoneNeighborhoods = List<String>.from(_matchedZone!['neighborhoods']);
          
          // 1. Chercher si le quartier détecté est dans la zone
          for (var zn in zoneNeighborhoods) {
             if (neighborhood.toLowerCase().contains(zn.toLowerCase()) || zn.toLowerCase().contains(neighborhood.toLowerCase())) {
               neighborhood = zn;
               matched = true;
               break;
             }
          }

          // 2. Si non trouvé, chercher dans le POI ou la rue
          if (!matched) {
            for (var zn in zoneNeighborhoods) {
              final znLower = zn.toLowerCase();
              if (poi.toLowerCase().contains(znLower) || street.toLowerCase().contains(znLower)) {
                neighborhood = zn; 
                matched = true;
                break;
              }
            }
          }

          // 3. Si toujours rien, on force le premier quartier de la zone pour rester cohérent
          if (!matched && zoneNeighborhoods.isNotEmpty) {
            neighborhood = zoneNeighborhoods.first;
          }
        }
        
        String combinedStreet = neighborhood;
        if (poi.isNotEmpty && poi != street && poi != neighborhood) {
          combinedStreet = street.isNotEmpty ? '$poi, $street' : poi;
        } else if (street.isNotEmpty) {
          combinedStreet = (neighborhood.isNotEmpty && neighborhood != street) ? '$neighborhood, $street' : street;
        }

        setMS(() {
          // Save old state to know if map already existed
          final bool mapWasVisible = _detectedLat != 0 && _detectedLong != 0;
          
          _detectedLat = position.latitude;
          _detectedLong = position.longitude;
          
          // Match city with local config
          String matchedCity = '';
          cities.forEach((key, value) {
            if (key.toString().toLowerCase() == city.toLowerCase()) matchedCity = key.toString();
          });
          
          if (matchedCity.isEmpty && cities.isNotEmpty) {
            for (var c in cities.keys) {
              if (city.toLowerCase().contains(c.toString().toLowerCase()) || c.toString().toLowerCase().contains(city.toLowerCase())) {
                matchedCity = c.toString();
                break;
              }
            }
          }
          if (matchedCity.isEmpty && cities.isNotEmpty) matchedCity = cities.keys.first.toString();
          
          if (matchedCity.isNotEmpty) eCity.text = matchedCity;
          if (combinedStreet.isNotEmpty) eStreet.text = combinedStreet;
        });

        // Move the map camera AFTER the widget has had a chance to render
        WidgetsBinding.instance.addPostFrameCallback((_) {
          try {
            _mapController.move(ll.LatLng(_detectedLat, _detectedLong), 16.0);
          } catch (_) {
            // MapController not ready yet — map will use initialCenter instead
          }
        });
      }

    } catch (e) {
      debugPrint('Location pick process failed: $e');
    } finally {
      setMS(() => _isLoadingLocation = false);
      setState(() => _isLoadingLocation = false);
    }
  }

  void _showAddAddressModal(bool isDark, Color textColor, Color hintColor, {bool triggerGPS = false}) {
    bool hasTriggered = false;
    final eCity = TextEditingController(text: _cityCtrl.text);
    final eStreet = TextEditingController(text: _streetCtrl.text);
    final eNum = TextEditingController(text: _numberCtrl.text);
    final eDet = TextEditingController(text: _detailsCtrl.text);
    bool save = _saveToBackpack;
    bool isListening = false;

    showModalBottomSheet(context: context, isScrollControlled: true, backgroundColor: Colors.transparent, builder: (ctx) {
      return StatefulBuilder(builder: (ctx, setMS) {
        final cart = context.watch<CartProvider>();
        final matrix = _getEffectiveMatrix(cart);
        final countryData = matrix[_selectedCountry] ?? (matrix.isNotEmpty ? matrix.values.first : {});
        final localData = _getSectionData(countryData, 'Local');
        final Map? cities = localData['cities'] as Map?;

        if (triggerGPS && !hasTriggered) {
          hasTriggered = true;
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _handleLocationPick(setMS, eCity, eStreet, cities ?? {});
          });
        }

        return Padding(padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
          child: Container(decoration: BoxDecoration(color: isDark ? const Color(0xFF1E1E2C) : Colors.white, borderRadius: const BorderRadius.vertical(top: Radius.circular(28))),
            child: SingleChildScrollView(child: Column(mainAxisSize: MainAxisSize.min, children: [
              Container(margin: const EdgeInsets.only(top: 12), width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.withValues(alpha: 0.3), borderRadius: BorderRadius.circular(2))),
              Padding(padding: const EdgeInsets.all(20), child: Row(children: [
                Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(gradient: const LinearGradient(colors: [Color(0xFF00E5C5), Color(0xFF00C9B0)]), borderRadius: BorderRadius.circular(12)), child: const Icon(Icons.add_location_alt_rounded, color: Colors.white, size: 20)),
                const SizedBox(width: 14),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(_isLoadingLocation ? 'Recherche de localisation...' : (_cityCtrl.text.isEmpty ? 'Nouvelle Adresse' : 'Modifier l\'Adresse'), style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.w900)),
                  Text('Pays: $_selectedCountry', style: TextStyle(color: hintColor, fontSize: 12)),
                ])),
                GestureDetector(
                  onTap: () {
                    Navigator.pop(ctx);
                    _showBackpackModal(isDark, textColor, hintColor);
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.violet.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.violet.withValues(alpha: 0.2)),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.backpack_rounded, size: 14, color: AppColors.violet),
                        SizedBox(width: 6),
                        Text('Sac à dos', style: TextStyle(color: AppColors.violet, fontSize: 11, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                GestureDetector(onTap: () => Navigator.pop(ctx), child: Icon(Icons.close_rounded, color: hintColor)),
              ])),
              Divider(color: hintColor.withValues(alpha: 0.15), height: 1),
              
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: GestureDetector(
                  onTap: () => _handleLocationPick(setMS, eCity, eStreet, cities ?? {}),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [const Color(0xFF00E5C5).withValues(alpha: 0.15), const Color(0xFF00C9B0).withValues(alpha: 0.05)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFF00E5C5).withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        _isLoadingLocation 
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF00E5C5)))
                          : const Icon(Icons.my_location_rounded, color: Color(0xFF00E5C5), size: 24),
                        const SizedBox(width: 12),
                        Text(
                          _isLoadingLocation ? 'DÉTECTION...' : 'UTILISER MA POSITION ACTUELLE',
                          style: const TextStyle(color: Color(0xFF00C9B0), fontWeight: FontWeight.w900, fontSize: 15, letterSpacing: 0.5),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              if (_detectedLat != 0 && _detectedLong != 0)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Container(
                    height: 150,
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.grey.withValues(alpha: 0.15)),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 4)),
                      ],
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: FlutterMap(
                      mapController: _mapController,
                      options: MapOptions(
                        initialCenter: ll.LatLng(_detectedLat, _detectedLong),
                        initialZoom: 16.0,
                        interactionOptions: const InteractionOptions(flags: InteractiveFlag.all & ~InteractiveFlag.rotate),
                      ),
                      children: [
                        TileLayer(
                          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                          userAgentPackageName: 'com.mosombi.app',
                        ),
                        MarkerLayer(
                          markers: [
                            Marker(
                              point: ll.LatLng(_detectedLat, _detectedLong),
                              width: 40,
                              height: 40,
                              child: const Icon(Icons.location_on_rounded, color: Colors.redAccent, size: 30),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),

              Padding(padding: const EdgeInsets.symmetric(horizontal: 20), child: Row(children: [
                Expanded(child: Divider(color: hintColor.withValues(alpha: 0.1))),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: Text('OU REMPLIR MANUELLEMENT', style: TextStyle(color: hintColor, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
                ),
                Expanded(child: Divider(color: hintColor.withValues(alpha: 0.1))),
              ])),
              Padding(padding: const EdgeInsets.all(20), child: Column(children: [
                Builder(builder: (context) {
                  if (cities != null && cities.isNotEmpty) {
                    final cityNames = cities.keys.toList().map((e) => e.toString()).toList();
                    
                    return Column(children: [
                      // City Dropdown
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        decoration: BoxDecoration(
                          color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.withValues(alpha: 0.06),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: Colors.grey.withValues(alpha: 0.15)),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: cityNames.contains(eCity.text) ? eCity.text : null,
                            hint: Text("Choisir une ville", style: TextStyle(color: hintColor, fontSize: 14)),
                            isExpanded: true,
                            dropdownColor: isDark ? const Color(0xFF1E1E2C) : Colors.white,
                            items: cityNames.map((c) => DropdownMenuItem(value: c, child: Text(c, style: TextStyle(color: textColor, fontSize: 14)))).toList(),
                            onChanged: (val) {
                              setMS(() {
                                eCity.text = val ?? '';
                                eStreet.text = ''; // Reset street when city changes
                              });
                            },
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      if (_matchedZone != null)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8.0, left: 4.0),
                          child: Row(
                            children: [
                              const Icon(Icons.gps_fixed_rounded, color: Color(0xFF00E5C5), size: 14),
                              const SizedBox(width: 6),
                              Text(
                                'Zone détectée : ${_matchedZone!['name'].toString().trim()}',
                                style: const TextStyle(color: Color(0xFF00E5C5), fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ),
                      
                      // Neighborhood Dropdown
                      if (eCity.text.isNotEmpty) Builder(builder: (context) {
                        final cityConfig = cities[eCity.text] as Map?;
                        final zones = cityConfig?['zones'] as Map? ?? {};
                        
                        final allN = <String>[];
                        
                        // PRIORITÉ : Si une zone est détectée, on n'affiche que ses quartiers
                        if (_matchedZone != null && _matchedZone!['neighborhoods'] != null) {
                          allN.addAll(List<String>.from(_matchedZone!['neighborhoods']));
                        } else {
                          // Sinon, on affiche tous les quartiers de la ville
                          zones.forEach((zoneName, zoneData) {
                            if (zoneData is Map) {
                              final neighborhoods = List<String>.from(zoneData['neighborhoods'] ?? []);
                              allN.addAll(neighborhoods);
                            }
                          });
                        }
                        
                        // Nettoyer les doublons
                        final uniqueN = allN.toSet().toList();
                        uniqueN.sort();

                        return Container(
                          decoration: BoxDecoration(
                            color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.withValues(alpha: 0.06),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: Colors.grey.withValues(alpha: 0.15)),
                          ),
                          child: Autocomplete<String>(
                            initialValue: TextEditingValue(text: eStreet.text),
                            optionsBuilder: (TextEditingValue textEditingValue) {
                              if (textEditingValue.text.isEmpty) {
                                return uniqueN;
                              }
                              return uniqueN.where((String option) {
                                return option.toLowerCase().contains(textEditingValue.text.toLowerCase());
                              });
                            },
                            onSelected: (String selection) {
                              setMS(() {
                                eStreet.text = selection;
                              });
                            },
                            fieldViewBuilder: (context, controller, focusNode, onFieldSubmitted) {
                              if (eStreet.text.isNotEmpty && controller.text != eStreet.text) {
                                controller.text = eStreet.text;
                              }
                              
                              return TextField(
                                controller: controller,
                                focusNode: focusNode,
                                style: TextStyle(color: textColor, fontSize: 14),
                                decoration: InputDecoration(
                                  hintText: "Rechercher ou saisir un quartier",
                                  hintStyle: TextStyle(color: hintColor, fontSize: 14),
                                  border: InputBorder.none,
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                  suffixIcon: Icon(Icons.search_rounded, color: hintColor, size: 18),
                                ),
                                onChanged: (val) {
                                  setMS(() {
                                    eStreet.text = val;
                                  });
                                },
                              );
                            },
                            optionsViewBuilder: (context, onSelected, options) {
                              return Align(
                                alignment: Alignment.topLeft,
                                child: Material(
                                  elevation: 4,
                                  color: isDark ? const Color(0xFF1E1E2C) : Colors.white,
                                  borderRadius: BorderRadius.circular(12),
                                  child: Container(
                                    width: MediaQuery.of(context).size.width - 40,
                                    constraints: const BoxConstraints(maxHeight: 250),
                                    decoration: BoxDecoration(
                                      border: Border.all(color: Colors.grey.withValues(alpha: 0.2)),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: ListView.builder(
                                      padding: EdgeInsets.zero,
                                      shrinkWrap: true,
                                      itemCount: options.length,
                                      itemBuilder: (BuildContext context, int index) {
                                        final String option = options.elementAt(index);
                                        return InkWell(
                                          onTap: () => onSelected(option),
                                          child: Container(
                                            padding: const EdgeInsets.all(16),
                                            decoration: BoxDecoration(
                                              border: Border(bottom: BorderSide(color: Colors.grey.withValues(alpha: 0.1))),
                                            ),
                                            child: Text(option, style: TextStyle(color: textColor, fontSize: 14)),
                                          ),
                                        );
                                      },
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                        );
                      }),
                    ]);
                  }

                  return Column(children: [
                    _buildCustomModalField(eCity, 'Ville', Icons.location_city_rounded, isDark, hintColor, textColor),
                    const SizedBox(height: 14),
                    _buildCustomModalField(eStreet, 'Rue / Quartier / Avenue', Icons.signpost_rounded, isDark, hintColor, textColor),
                  ]);
                }),
                const SizedBox(height: 14),
                Row(children: [
                  Expanded(flex: 2, child: _buildCustomModalField(eNum, 'N / Lot', Icons.numbers_rounded, isDark, hintColor, textColor)),
                  const SizedBox(width: 12),
                  Expanded(flex: 3, child: _buildCustomModalField(
                    eDet, 
                    'Details / Repere', 
                    Icons.info_outline_rounded, 
                    isDark, 
                    hintColor, 
                    textColor,
                    maxLines: 3,
                    suffix: _speechEnabled ? IconButton(
                      icon: Icon(isListening ? Icons.mic_rounded : Icons.mic_none_rounded, color: isListening ? Colors.redAccent : AppColors.violet, size: 20),
                      onPressed: () async {
                        if (!isListening) {
                          setMS(() => isListening = true);
                          await _speechToText.listen(onResult: (res) {
                            setMS(() {
                               eDet.text = res.recognizedWords;
                               if (res.finalResult) isListening = false;
                            });
                          });
                        } else {
                          await _speechToText.stop();
                          setMS(() => isListening = false);
                        }
                      },
                    ) : null
                  )),
                ]),
                const SizedBox(height: 16),
                _buildVoiceNoteRecorder(setMS, isDark, textColor, hintColor),
                const SizedBox(height: 16),
                GestureDetector(onTap: () => setMS(() => save = !save),
                  child: Container(padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12), decoration: BoxDecoration(color: save ? AppColors.violet.withValues(alpha: 0.08) : (isDark ? Colors.white.withValues(alpha: 0.04) : Colors.grey.withValues(alpha: 0.05)), borderRadius: BorderRadius.circular(12), border: Border.all(color: save ? AppColors.violet.withValues(alpha: 0.3) : Colors.grey.withValues(alpha: 0.15))),
                    child: Row(children: [
                      Icon(save ? Icons.check_box_rounded : Icons.check_box_outline_blank_rounded, color: save ? AppColors.violet : hintColor, size: 22), const SizedBox(width: 10),
                      const Icon(Icons.backpack_outlined, color: AppColors.violet, size: 16), const SizedBox(width: 8),
                      Expanded(child: Text('Enregistrer dans mon Sac a dos', style: TextStyle(color: textColor, fontSize: 13, fontWeight: FontWeight.w600))),
                    ]),
                  ),
                ),
                
                SizedBox(width: double.infinity, height: 52, child: ElevatedButton.icon(
                  onPressed: () async {
                    if (eCity.text.trim().isEmpty || eStreet.text.trim().isEmpty) { 
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Ville et rue sont obligatoires.'), backgroundColor: Colors.redAccent)); 
                      return; 
                    }
                    
                    final newAddr = {
                      'country': _selectedCountry,
                      'city': eCity.text.trim(),
                      'street': eStreet.text.trim(),
                      'number': eNum.text.trim(),
                      'details': eDet.text.trim(),
                      'lat': _detectedLat,
                      'long': _detectedLong,
                    };

                    int? newIdx;
                    if (save) {
                       // Éviter les doublons
                       int existingIdx = _savedAddresses.indexWhere((a) => a['city'] == newAddr['city'] && a['street'] == newAddr['street'] && a['number'] == newAddr['number']);
                       if (existingIdx == -1) {
                         setState(() {
                           _savedAddresses.add(newAddr);
                         });
                         _syncAddresses();
                         newIdx = _savedAddresses.length - 1;
                       } else {
                         newIdx = existingIdx;
                       }
                    }

                    setState(() { 
                      _cityCtrl.text = eCity.text.trim(); 
                      _streetCtrl.text = eStreet.text.trim(); 
                      _numberCtrl.text = eNum.text.trim(); 
                      _detailsCtrl.text = eDet.text.trim(); 
                      _saveToBackpack = save; 
                      _selectedAddressIndex = newIdx; 
                    });
                    Navigator.pop(ctx);
                  },
                  icon: const Icon(Icons.check_rounded, color: Colors.white),
                  label: const Text('Confirmer l\'adresse', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 15)),
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6C4EF6), elevation: 6, shadowColor: const Color(0xFF6C4EF6).withValues(alpha: 0.4), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
                )),
                const SizedBox(height: 10),
              ])),
            ])),
          ),
        );
      });
    });
  }

  Widget _buildVoiceNoteRecorder(StateSetter setMS, bool isDark, Color textColor, Color hintColor) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _isRecordingVoice ? Colors.redAccent.withValues(alpha: 0.1) : (isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.withValues(alpha: 0.05)),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _isRecordingVoice ? Colors.redAccent : hintColor.withValues(alpha: 0.1)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Icon(_voiceNoteBase64 != null ? Icons.mic_external_on_rounded : Icons.mic_rounded, color: _isRecordingVoice ? Colors.redAccent : AppColors.violet),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _isRecordingVoice ? 'Enregistrement en cours...' : (_voiceNoteBase64 != null ? 'Note vocale pour le livreur' : 'Note vocale d\'explication'),
                      style: TextStyle(color: textColor, fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                    Text(
                      _isRecordingVoice ? 'Parlez maintenant' : (_voiceNoteBase64 != null ? 'Le livreur pourra l\'écouter' : 'Pour guider le livreur (optionnel)'),
                      style: TextStyle(color: hintColor, fontSize: 11),
                    ),
                  ],
                ),
              ),
              if (_voiceNoteBase64 != null && !_isRecordingVoice)
                Row(
                  children: [
                    IconButton(
                      onPressed: () async {
                        if (_voiceNotePath != null) {
                          final player = AudioPlayer();
                          if (kIsWeb) {
                            await player.play(UrlSource(_voiceNotePath!));
                          } else {
                            await player.play(DeviceFileSource(_voiceNotePath!));
                          }
                        }
                      },
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      icon: const Icon(Icons.play_circle_fill_rounded, color: AppColors.violet, size: 28),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      onPressed: () {
                        setMS(() {
                          _voiceNoteBase64 = null;
                          _voiceNotePath = null;
                        });
                      },
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      icon: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 22),
                    ),
                  ],
                ),
            ],
          ),
          const SizedBox(height: 12),
          GestureDetector(
            onLongPressStart: (_) async {
              if (await _audioRecorder.hasPermission()) {
                if (kIsWeb) {
                  // Web: record without file path (uses blob)
                  await _audioRecorder.start(const RecordConfig(encoder: AudioEncoder.opus, bitRate: 128000), path: '');
                } else {
                  final dir = await getTemporaryDirectory();
                  final path = '${dir.path}/voice_note_${DateTime.now().millisecondsSinceEpoch}.m4a';
                  await _audioRecorder.start(const RecordConfig(), path: path);
                  _voiceNotePath = path;
                }
                setMS(() {
                  _isRecordingVoice = true;
                });
              }
            },
            onLongPressEnd: (_) async {
              final path = await _audioRecorder.stop();
              if (path != null) {
                if (kIsWeb) {
                  // Web: path is a blob URL, read it via network
                  try {
                    final dio = Dio();
                    final response = await dio.get<List<int>>(path, options: Options(responseType: ResponseType.bytes));
                    final bytes = response.data!;
                    final b64 = base64Encode(bytes);
                    setMS(() {
                      _isRecordingVoice = false;
                      _voiceNoteBase64 = b64;
                      _voiceNotePath = path; // blob URL for playback
                    });
                  } catch (e) {
                    debugPrint('Web voice note read failed: $e');
                    setMS(() => _isRecordingVoice = false);
                  }
                } else {
                  final file = File(path);
                  final bytes = await file.readAsBytes();
                  final b64 = base64Encode(bytes);
                  setMS(() {
                    _isRecordingVoice = false;
                    _voiceNoteBase64 = b64;
                  });
                }
              } else {
                setMS(() => _isRecordingVoice = false);
              }
            },
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                color: _isRecordingVoice ? Colors.redAccent : AppColors.violet.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: _isRecordingVoice ? Colors.transparent : AppColors.violet.withValues(alpha: 0.3)),
              ),
              child: Center(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (_isRecordingVoice) const Icon(Icons.fiber_manual_record, color: Colors.white, size: 12),
                    if (_isRecordingVoice) const SizedBox(width: 8),
                    Text(
                      _isRecordingVoice ? 'RELACHER POUR TERMINER' : (_voiceNoteBase64 != null ? 'MAINTENIR POUR RE-ENREGISTRER' : 'MAINTENIR POUR ENREGISTRER'),
                      style: TextStyle(color: _isRecordingVoice ? Colors.white : AppColors.violet, fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 0.5),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCustomModalField(TextEditingController ctrl, String label, IconData icon, bool isDark, Color hintColor, Color textColor, {int maxLines = 1, Widget? suffix}) {
    return TextFormField(
      controller: ctrl,
      maxLines: maxLines,
      style: TextStyle(color: textColor, fontSize: 14),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: hintColor, fontSize: 12),
        prefixIcon: Icon(icon, color: hintColor, size: 18),
        suffixIcon: suffix,
        filled: true,
        fillColor: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.withValues(alpha: 0.06),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: Colors.grey.withValues(alpha: 0.15))),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.violet, width: 1.5)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
    );
  }
}

import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

class DeliveryTrackingScreen extends StatefulWidget {
  final String orderId;
  final String? deliveryType; // 'local' ou 'international'

  const DeliveryTrackingScreen({
    super.key,
    required this.orderId,
    this.deliveryType,
  });

  @override
  State<DeliveryTrackingScreen> createState() => _DeliveryTrackingScreenState();
}

class _DeliveryTrackingScreenState extends State<DeliveryTrackingScreen> {
  late int _currentStep;
  late List<Map<String, dynamic>> _chatMessages;
  final TextEditingController _messageController = TextEditingController();
  final MapController _mapController = MapController();

  // Coordinates
  static const LatLng _transitaireLatLng = LatLng(22.3964, 114.1095); // Shenzhen / China
  static const LatLng _agencyLatLng = LatLng(-4.2702, 15.2832); // Agence Brazzaville Centre-ville
  static const LatLng _clientLatLng = LatLng(-4.2526, 15.2755); // Client Poto-Poto
  static const LatLng _driverStartLatLng = LatLng(-4.2985, 15.2470); // Livreur initialement à Bacongo

  // Animation values
  LatLng _driverCurrentLatLng = _driverStartLatLng;
  LatLng _planeCurrentLatLng = _transitaireLatLng;
  double _animationProgress = 0.0;
  Timer? _simulationTimer;
  
  // Custom states
  double _radarRadius = 0.0;
  Timer? _radarTimer;

  // Joint Signature states
  bool _agencySigned = false;
  bool _driverSigned = false;
  bool _isSigningTransitionActive = false;

  // Chat Simulation state
  bool _isChatOpen = false;

  // Calling Simulation state
  bool _isCalling = false;
  String _callingName = '';
  String _callingAvatar = '';
  int _callDuration = 0;
  Timer? _callTimer;

  // Voice recording state
  bool _isRecordingVoice = false;
  int _recordingSeconds = 0;
  Timer? _recordingTimer;

  // Dual confirmation & rating state
  bool _isDualConfirming = false;
  bool _driverConfirmed = false;
  bool _clientConfirmed = false;
  bool _showRatingOverlay = false;
  double _ratingStars = 5.0;
  List<String> _selectedRatingTags = [];
  final TextEditingController _ratingCommentController = TextEditingController();

  bool get isLocal => (widget.deliveryType ?? 'local') == 'local';

  List<Map<String, dynamic>> get steps {
    if (isLocal) {
      return [
        {'title': 'Commande Confirmée', 'desc': 'Le vendeur a validé et prépare votre colis.'},
        {'title': 'Recherche du livreur le plus proche de l\'agence', 'desc': 'Recherche d\'un livreur disponible autour de l\'agence de retrait.'},
        {'title': 'Livreur connecté (Jean-Marc L.)', 'desc': 'Le livreur a accepté la livraison.'},
        {'title': 'Livreur en route vers l\'agence', 'desc': 'Le livreur se rend à l\'agence pour récupérer votre colis.'},
        {'title': 'Signature & Retrait à l\'agence', 'desc': 'Le colis est remis au livreur après signature conjointe.'},
        {'title': 'Livreur en route vers chez vous', 'desc': 'Le livreur transporte votre colis vers votre adresse.'},
        {'title': 'Livreur arrivé (Confirmation requise)', 'desc': 'Le livreur a déclaré le colis livré. Veuillez approuver.'},
        {'title': 'Colis livré (Sécurisé)', 'desc': 'Livraison complétée avec succès.'},
      ];
    } else {
      return [
        {'title': 'Commande Confirmée', 'desc': 'Votre commande internationale est validée.'},
        {'title': 'Prise en charge par le Transitaire', 'desc': 'Le transitaire accepte la commande à Shenzhen.'},
        {'title': 'Colis prêt & embarqué', 'desc': 'Le colis a été chargé pour le transit international.'},
        {'title': 'Colis en transit international', 'desc': 'Le colis s\'envole en avion cargo de Shenzhen vers le Congo.'},
        {'title': 'Colis arrivé dans votre pays (Douane)', 'desc': 'Le colis a passé la douane et est au centre de tri.'},
        {'title': 'Arrivé à l\'agence locale de Brazzaville', 'desc': 'Le colis est stocké à l\'agence locale.'},
        {'title': 'Recherche du livreur le plus proche', 'desc': 'Recherche d\'un livreur local autour de l\'agence.'},
        {'title': 'Livreur connecté (Jean-Marc L.)', 'desc': 'Le livreur local a accepté la livraison.'},
        {'title': 'Livreur en route vers l\'agence', 'desc': 'Le livreur se rend à l\'agence pour récupérer votre colis.'},
        {'title': 'Signature & Retrait à l\'agence', 'desc': 'L\'agence et le livreur signent la prise en charge du colis.'},
        {'title': 'Livreur en route vers chez vous', 'desc': 'Le livreur transporte votre colis vers votre adresse.'},
        {'title': 'Livreur arrivé (Confirmation requise)', 'desc': 'Le livreur a déclaré le colis livré. Veuillez approuver.'},
        {'title': 'Colis livré (Sécurisé)', 'desc': 'Livraison internationale complétée.'},
      ];
    }
  }

  Map<String, dynamic>? get activeContact {
    if (isLocal) {
      if (_currentStep < 1) return null;
      return {
        'name': 'Jean-Marc L.',
        'role': 'Livreur Mossombi agréé',
        'avatar': 'https://i.pravatar.cc/150?img=11',
        'rating': '4.8 (124 courses)',
        'phone': '+242 06 123 4567',
      };
    } else {
      if (_currentStep < 1) return null;
      if (_currentStep >= 1 && _currentStep <= 5) {
        return {
          'name': 'Transit Mossombi Logistique',
          'role': 'Transitaire international',
          'avatar': 'https://i.pravatar.cc/150?img=47',
          'rating': '4.9 (4 200 suivis)',
          'phone': '+242 05 987 6543',
        };
      } else {
        return {
          'name': 'Jean-Marc L.',
          'role': 'Livreur Local agréé',
          'avatar': 'https://i.pravatar.cc/150?img=11',
          'rating': '4.8 (124 courses)',
          'phone': '+242 06 123 4567',
        };
      }
    }
  }

  @override
  void initState() {
    super.initState();
    _currentStep = isLocal ? 2 : 4; // default steps: Livreur en route or Transit vol
    _initChatHistory();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _onStepChanged(_currentStep);
    });
  }

  void _startRadarPulse() {
    _radarTimer?.cancel();
    setState(() {
      _radarRadius = 0.0;
    });
    _radarTimer = Timer.periodic(const Duration(milliseconds: 30), (timer) {
      if (mounted) {
        setState(() {
          _radarRadius += 1.8;
          if (_radarRadius > 110) _radarRadius = 0.0;
        });
      }
    });
  }

  void _stopRadarPulse() {
    _radarTimer?.cancel();
    _radarTimer = null;
  }

  void _triggerRouteAnimation({
    required LatLng start,
    required LatLng end,
    required Function(LatLng currentPoint) onUpdate,
    Function()? onComplete,
  }) {
    _simulationTimer?.cancel();
    final List<LatLng> path = [];
    final int stepsCount = 100;
    
    for (int i = 0; i <= stepsCount; i++) {
      final double t = i / stepsCount;
      final double lat = start.latitude + (end.latitude - start.latitude) * t;
      final double lng = start.longitude + (end.longitude - start.longitude) * t;
      path.add(LatLng(lat, lng));
    }
    
    int currentIdx = 0;
    _simulationTimer = Timer.periodic(const Duration(milliseconds: 50), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      
      if (currentIdx < path.length) {
        onUpdate(path[currentIdx]);
        currentIdx++;
      } else {
        timer.cancel();
        if (onComplete != null) onComplete();
      }
    });
  }

  void _initChatHistory() {
    if (isLocal) {
      _chatMessages = [
        {
          'sender': 'driver',
          'text': 'Bonjour ! Je suis le livreur en charge de votre commande.',
          'type': 'text',
        },
        {
          'sender': 'driver',
          'text': 'Je viens de charger votre colis et je démarre.',
          'type': 'text',
        },
      ];
    } else {
      _chatMessages = [
        {
          'sender': 'transitaire',
          'text': 'Bonjour, votre commande internationale a été prise en charge par notre transitaire.',
          'type': 'text',
        },
        {
          'sender': 'transitaire',
          'text': 'Le colis est en route pour le centre d\'embarquement.',
          'type': 'text',
        },
      ];
    }
  }

  void _onStepChanged(int step) {
    _simulationTimer?.cancel();
    _stopRadarPulse();
    
    setState(() {
      _currentStep = step;
      _animationProgress = 0.0;
    });

    // Reset signature states if we move away from signature step
    final bool isSignatureStep = (isLocal && step == 4) || (!isLocal && step == 9);
    if (!isSignatureStep) {
      setState(() {
        _agencySigned = false;
        _driverSigned = false;
      });
    }

    final bool isSearching = (isLocal && step == 1) || (!isLocal && step == 6);
    if (isSearching) {
      _startRadarPulse();
    }

    // Cargo flight animation (Shenzhen to Agency)
    if (!isLocal && step == 3) {
      _triggerRouteAnimation(
        start: _transitaireLatLng,
        end: _agencyLatLng,
        onUpdate: (pt) {
          setState(() {
            _planeCurrentLatLng = pt;
          });
        },
      );
    } else {
      setState(() {
        _planeCurrentLatLng = _transitaireLatLng;
      });
    }
    
    // Livreur -> Agence animation
    final bool goingToAgency = (isLocal && step == 3) || (!isLocal && step == 8);
    if (goingToAgency) {
      _triggerRouteAnimation(
        start: _driverStartLatLng,
        end: _agencyLatLng,
        onUpdate: (pt) {
          setState(() {
            _driverCurrentLatLng = pt;
          });
        },
      );
    }

    // Agence -> Client animation
    final bool goingToClient = (isLocal && step == 5) || (!isLocal && step == 10);
    if (goingToClient) {
      _triggerRouteAnimation(
        start: _agencyLatLng,
        end: _clientLatLng,
        onUpdate: (pt) {
          setState(() {
            _driverCurrentLatLng = pt;
          });
        },
      );
    }

    // If step is signature / pickup or after, we can position the driver at the agency or client
    if (isLocal) {
      if (step == 0 || step == 1 || step == 2) {
        _driverCurrentLatLng = _driverStartLatLng;
      } else if (step == 4) {
        _driverCurrentLatLng = _agencyLatLng;
      } else if (step >= 6) {
        _driverCurrentLatLng = _clientLatLng;
      }
    } else {
      if (step <= 7) {
        _driverCurrentLatLng = _driverStartLatLng;
      } else if (step == 9) {
        _driverCurrentLatLng = _agencyLatLng;
      } else if (step >= 11) {
        _driverCurrentLatLng = _clientLatLng;
      }
    }

    final stepTitle = steps[step]['title'];
    final isDriver = isLocal || step >= 7;
    setState(() {
      _chatMessages.add({
        'sender': isDriver ? 'driver' : 'transitaire',
        'text': 'Mise à jour : $stepTitle',
        'type': 'text',
      });
    });

    // Auto pan/zoom the map to the active coordinate
    try {
      if (!isLocal && step >= 1 && step <= 3) {
        _mapController.move(const LatLng(9.0631, 64.6963), 2.5);
      } else if (!isLocal && step == 0) {
        _mapController.move(_transitaireLatLng, 8.0);
      } else {
        _mapController.move(_agencyLatLng, 13.5);
      }
    } catch (_) {}
  }

  void _reportDispute() {
    context.push('/orders/dispute', extra: widget.orderId);
  }

  // Communication Simulation triggers
  void _startCall(String name, String avatar) {
    setState(() {
      _isCalling = true;
      _callingName = name;
      _callingAvatar = avatar;
      _callDuration = 0;
    });

    Future.delayed(const Duration(seconds: 2), () {
      if (!_isCalling) return;
      _callTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
        if (!mounted) {
          timer.cancel();
          return;
        }
        setState(() {
          _callDuration++;
        });
      });
    });
  }

  void _endCall() {
    _callTimer?.cancel();
    setState(() {
      _isCalling = false;
    });
  }

  void _startVoiceRecordingSimulation() {
    setState(() {
      _isRecordingVoice = true;
      _recordingSeconds = 0;
    });

    _recordingTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      setState(() {
        _recordingSeconds++;
      });
    });
  }

  void _cancelRecording() {
    _recordingTimer?.cancel();
    setState(() {
      _isRecordingVoice = false;
    });
  }

  void _sendVoiceNote() {
    _recordingTimer?.cancel();
    final durationText = '0:${_recordingSeconds.toString().padLeft(2, '0')}';
    setState(() {
      _isRecordingVoice = false;
      _chatMessages.add({
        'sender': 'me',
        'type': 'voice',
        'duration': durationText,
      });
    });

    Future.delayed(const Duration(milliseconds: 1500), () {
      if (!mounted) return;
      setState(() {
        _chatMessages.add({
          'sender': (isLocal || _currentStep >= 6) ? 'driver' : 'transitaire',
          'text': "Reçu, je regarde ça rapidement. Merci !",
          'type': 'text',
        });
      });
    });
  }

  void _sendChatMessage(String text) {
    setState(() {
      _chatMessages.add({
        'sender': 'me',
        'text': text,
        'type': 'text',
      });
      _messageController.clear();
    });

    Future.delayed(const Duration(milliseconds: 1500), () {
      if (!mounted) return;
      String responseText = "D'accord, bien reçu !";
      if (!isLocal && _currentStep < 6) {
        responseText = "Entendu, le transitaire met à jour votre suivi.";
      } else if (_currentStep == 6 || _currentStep == 7) {
        responseText = "Je viens de récupérer le colis. À tout de suite.";
      } else if (_currentStep >= 8) {
        responseText = "Je suis arrivé sur place, à l'entrée.";
      }

      setState(() {
        _chatMessages.add({
          'sender': (isLocal || _currentStep >= 6) ? 'driver' : 'transitaire',
          'text': responseText,
          'type': 'text',
        });
      });
    });
  }

  void _startDualConfirmation() {
    setState(() {
      _isDualConfirming = true;
      _driverConfirmed = false;
      _clientConfirmed = false;
    });

    // Simulate driver confirmation after 2 seconds
    Future.delayed(const Duration(seconds: 2), () {
      if (!mounted) return;
      setState(() {
        _driverConfirmed = true;
      });
    });
  }

  void _clientConfirmFinal() {
    setState(() {
      _isDualConfirming = false;
      _clientConfirmed = true;
      _showRatingOverlay = true;
    });
    _onStepChanged(steps.length - 1);
  }

  @override
  void dispose() {
    _simulationTimer?.cancel();
    _radarTimer?.cancel();
    _callTimer?.cancel();
    _recordingTimer?.cancel();
    _messageController.dispose();
    _ratingCommentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.textPrimaryLight;
    final hintColor = isDark ? Colors.white70 : AppColors.textSecondaryLight;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          isLocal ? 'Suivi Local' : 'Suivi International', 
          style: TextStyle(color: textColor, fontWeight: FontWeight.w900)
        ),
        centerTitle: true,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: textColor),
          onPressed: () => context.pop(),
        ),
      ),
      body: Stack(
        children: [
          AnimatedGradientBg(
            isDark: isDark,
            child: Column(
              children: [
                const SizedBox(height: 70), // space for app bar
                // Dynamic graphic header based on steps
                _buildHeader(isDark, textColor),

                // Main body container
                Expanded(
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.only(left: 24, right: 24, top: 24),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.bgDark1 : Colors.white,
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.1), 
                          blurRadius: 20, 
                          offset: const Offset(0, -5)
                        )
                      ],
                    ),
                    child: SingleChildScrollView(
                      physics: const BouncingScrollPhysics(),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Active Contact Card
                          _buildContactCard(textColor, hintColor, isDark),

                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 16),
                            child: Divider(),
                          ),

                          // Dual confirmation button if final step reached
                          if (_currentStep == steps.length - 1) ...[
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton.icon(
                                onPressed: _startDualConfirmation,
                                icon: const Icon(Icons.verified_rounded, color: Colors.white),
                                label: const Text('Confirmer la réception', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.green.shade600,
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                  elevation: 2,
                                ),
                              ),
                            ).animate().scale(curve: Curves.elasticOut),
                            const SizedBox(height: 24),
                          ],

                          Text(
                            'Étapes de Livraison', 
                            style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 16)
                          ),
                          const SizedBox(height: 16),

                          // Steps vertical list
                          ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: steps.length,
                            itemBuilder: (context, idx) {
                              final step = steps[idx];
                              return _buildStepItem(idx, step['title'], step['desc'], isDark, textColor);
                            },
                          ),

                          const SizedBox(height: 16),

                          // Dispute Action Button
                          SizedBox(
                            width: double.infinity,
                            child: TextButton.icon(
                              onPressed: _reportDispute,
                              icon: const Icon(Icons.report_problem_rounded, color: Colors.redAccent),
                              label: const Text(
                                'Signaler un problème (Litige)', 
                                style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)
                              ),
                              style: TextButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                backgroundColor: Colors.redAccent.withValues(alpha: 0.1),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              ),
                            ),
                          ).animate().fade().slideY(begin: 0.2, end: 0),

                          const SizedBox(height: 140), // spacer to prevent overlap with Dev Bar
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Simulation Controls (Dev Bar)
          Align(
            alignment: Alignment.bottomCenter,
            child: _buildSimulationPanel(textColor, isDark),
          ),

          // Overlays (Appel / Chat / Enregistrement)
          if (_isCalling) _buildCallingOverlay(),
          if (_isChatOpen) _buildChatOverlay(isDark, textColor),
          if (_showRatingOverlay) _buildRatingOverlay(textColor, isDark),
          if (_isRecordingVoice)
            Align(
              alignment: Alignment.bottomCenter,
              child: _buildVoiceRecordingOverlay(),
            ),
          if (_isDualConfirming)
            _buildDualConfirmationDialog(textColor, isDark),
        ],
      ),
    );
  }

  List<LatLng> _getFlightArcPoints(LatLng start, LatLng end) {
    final List<LatLng> points = [];
    final int segments = 60;
    for (int i = 0; i <= segments; i++) {
      final double t = i / segments;
      final double lat = start.latitude + (end.latitude - start.latitude) * t;
      final double lng = start.longitude + (end.longitude - start.longitude) * t;
      final double curve = 18.0 * (1.0 - (2.0 * t - 1.0) * (2.0 * t - 1.0));
      points.add(LatLng(lat + curve, lng));
    }
    return points;
  }

  Widget _buildHeader(bool isDark, Color textColor) {
    final bool showChina = !isLocal && _currentStep <= 4;
    final bool isSearching = (isLocal && _currentStep == 1) || (!isLocal && _currentStep == 6);
    
    final List<Polyline> polylines = [];
    
    if (showChina) {
      polylines.add(
        Polyline(
          points: _getFlightArcPoints(_transitaireLatLng, _agencyLatLng),
          color: AppColors.violet,
          strokeWidth: 3.0,
        ),
      );
    } else {
      final bool hasDriverToAgencyRoute = (isLocal && _currentStep >= 3 && _currentStep <= 4) || 
                                          (!isLocal && _currentStep >= 8 && _currentStep <= 9);
      final bool hasAgencyToClientRoute = (isLocal && _currentStep >= 5) || 
                                          (!isLocal && _currentStep >= 10);
      
      if (hasDriverToAgencyRoute) {
        polylines.add(
          Polyline(
            points: [_driverStartLatLng, _agencyLatLng],
            color: AppColors.violet.withValues(alpha: 0.5),
            strokeWidth: 4.0,
          ),
        );
      }
      if (hasAgencyToClientRoute) {
        polylines.add(
          Polyline(
            points: [_agencyLatLng, _clientLatLng],
            color: Colors.green.withValues(alpha: 0.5),
            strokeWidth: 4.0,
          ),
        );
      }
      
      if (hasDriverToAgencyRoute) {
        polylines.add(
          Polyline(
            points: [_driverStartLatLng, _driverCurrentLatLng],
            color: AppColors.violet,
            strokeWidth: 4.5,
          ),
        );
      } else if (hasAgencyToClientRoute) {
        polylines.add(
          Polyline(
            points: [_agencyLatLng, _driverCurrentLatLng],
            color: Colors.green,
            strokeWidth: 4.5,
          ),
        );
      }
    }

    LatLng centerLatLng = _agencyLatLng;
    double zoom = 13.5;
    if (showChina) {
      if (_currentStep == 3) {
        centerLatLng = _planeCurrentLatLng;
        zoom = 3.5;
      } else if (_currentStep <= 2) {
        centerLatLng = _transitaireLatLng;
        zoom = 8.0;
      } else {
        centerLatLng = _agencyLatLng;
        zoom = 8.0;
      }
    } else {
      if (isSearching) {
        centerLatLng = _agencyLatLng;
        zoom = 13.5;
      } else {
        centerLatLng = _driverCurrentLatLng;
        zoom = 13.8;
      }
    }

    return Container(
      height: 280,
      width: double.infinity,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF13131A) : Colors.grey.shade100,
        boxShadow: const [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 10,
            offset: Offset(0, 4),
          )
        ],
      ),
      child: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: centerLatLng,
              initialZoom: zoom,
              minZoom: 2,
              maxZoom: 18,
            ),
            children: [
              TileLayer(
                urlTemplate: isDark 
                  ? 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png' 
                  : 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.satisfaitdev.mosombi',
              ),
              if (polylines.isNotEmpty)
                PolylineLayer(polylines: polylines),
              if (isSearching)
                CircleLayer(
                  circles: [
                    CircleMarker(
                      point: _agencyLatLng,
                      color: AppColors.violet.withValues(alpha: 0.15),
                      borderStrokeWidth: 2,
                      borderColor: AppColors.violet.withValues(alpha: 0.8),
                      useRadiusInMeter: false,
                      radius: _radarRadius,
                    ),
                  ],
                ),
              MarkerLayer(
                markers: [
                  Marker(
                    point: _agencyLatLng,
                    width: 50,
                    height: 50,
                    child: Center(
                      child: Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: AppColors.violet,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.violet.withValues(alpha: 0.4),
                              blurRadius: 8,
                              spreadRadius: 1,
                            )
                          ],
                        ),
                        child: const Icon(Icons.store_mall_directory_rounded, color: Colors.white, size: 16),
                      ),
                    ),
                  ),

                  if (isLocal || _currentStep >= 5)
                    Marker(
                      point: _clientLatLng,
                      width: 50,
                      height: 50,
                      child: Center(
                        child: Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: Colors.green,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.green.withValues(alpha: 0.4),
                                blurRadius: 8,
                                spreadRadius: 1,
                              )
                            ],
                          ),
                          child: const Icon(Icons.person_pin_circle_rounded, color: Colors.white, size: 18),
                        ),
                      ),
                    ),

                  if (!isLocal && _currentStep <= 4)
                    Marker(
                      point: _transitaireLatLng,
                      width: 50,
                      height: 50,
                      child: Center(
                        child: Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: Colors.amber.shade700,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.amber.withValues(alpha: 0.4),
                                blurRadius: 8,
                              )
                            ],
                          ),
                          child: const Icon(Icons.business_rounded, color: Colors.white, size: 16),
                        ),
                      ),
                    ),

                  if (!isLocal && _currentStep == 3)
                    Marker(
                      point: _planeCurrentLatLng,
                      width: 55,
                      height: 55,
                      child: Center(
                        child: Transform.rotate(
                          angle: -0.25,
                          child: Container(
                            width: 34,
                            height: 34,
                            decoration: BoxDecoration(
                              color: Colors.blue.shade600,
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 2),
                              boxShadow: const [
                                BoxShadow(
                                  color: Colors.black26,
                                  blurRadius: 6,
                                  offset: Offset(0, 2),
                                )
                              ],
                            ),
                            child: const Icon(Icons.flight_takeoff_rounded, color: Colors.white, size: 18),
                          ),
                        ),
                      ),
                    ),

                  if ((isLocal && _currentStep >= 2 && _currentStep < steps.length - 1) || 
                      (!isLocal && _currentStep >= 7 && _currentStep < steps.length - 1))
                    Marker(
                      point: _driverCurrentLatLng,
                      width: 60,
                      height: 60,
                      child: Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                color: AppColors.violet,
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white, width: 2),
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.violet.withValues(alpha: 0.4),
                                    blurRadius: 8,
                                    spreadRadius: 1,
                                  )
                                ],
                              ),
                              child: Icon(
                                isLocal ? Icons.delivery_dining_rounded : Icons.local_shipping_rounded,
                                color: Colors.white,
                                size: 18,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                              decoration: BoxDecoration(
                                color: AppColors.violet.withValues(alpha: 0.95),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                isLocal ? 'Livreur' : 'Livreur Local',
                                style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),

          Positioned(
            top: 16,
            right: 16,
            child: GlassContainer(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              borderRadius: BorderRadius.circular(12),
              child: Row(
                children: [
                  Icon(
                    showChina ? Icons.public_rounded : Icons.my_location_rounded,
                    color: AppColors.violet,
                    size: 14,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    showChina ? 'Transit Global' : 'Position GPS Live',
                    style: TextStyle(
                      color: textColor,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildJointSignatureCard(Color textColor, Color hintColor, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.shade50,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.violet.withValues(alpha: 0.3), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: AppColors.violet.withValues(alpha: 0.05),
            blurRadius: 15,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.draw_rounded, color: AppColors.violet, size: 20),
              const SizedBox(width: 8),
              Text(
                'Signature Conjointe Requise',
                style: TextStyle(color: textColor, fontWeight: FontWeight.w900, fontSize: 15),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'L\'agent de l\'agence et le livreur doivent signer pour confirmer le retrait du colis.',
            style: TextStyle(color: hintColor, fontSize: 11),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.black26 : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: _agencySigned ? Colors.green.withValues(alpha: 0.3) : Colors.grey.withValues(alpha: 0.2)),
                  ),
                  child: Column(
                    children: [
                      Text(
                        'Agence Mossombi',
                        style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        height: 60,
                        width: double.infinity,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: isDark ? Colors.white.withValues(alpha: 0.02) : Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: _agencySigned
                          ? Image.network(
                              'https://upload.wikimedia.org/wikipedia/commons/f/fa/Albert_Einstein_signature.png',
                              height: 45,
                              color: isDark ? Colors.white70 : Colors.black87,
                              errorBuilder: (c, e, s) => const Icon(Icons.check_rounded, color: Colors.green, size: 28),
                            ).animate().fadeIn().scale()
                          : Text(
                              'Attente...',
                              style: TextStyle(color: hintColor, fontSize: 10, fontStyle: FontStyle.italic),
                            ),
                      ),
                      const SizedBox(height: 8),
                      if (!_agencySigned)
                        ElevatedButton(
                          onPressed: () {
                            setState(() {
                              _agencySigned = true;
                            });
                            _checkSignatureCompletion();
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.violet,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          child: const Text('Signer (Agent)', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                        )
                      else
                        const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.check_circle_rounded, color: Colors.green, size: 14),
                            SizedBox(width: 4),
                            Text('Signé', style: TextStyle(color: Colors.green, fontSize: 11, fontWeight: FontWeight.bold)),
                          ],
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.black26 : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: _driverSigned ? Colors.green.withValues(alpha: 0.3) : Colors.grey.withValues(alpha: 0.2)),
                  ),
                  child: Column(
                    children: [
                      Text(
                        'Livreur (Jean-Marc)',
                        style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        height: 60,
                        width: double.infinity,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: isDark ? Colors.white.withValues(alpha: 0.02) : Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: _driverSigned
                          ? Image.network(
                              'https://upload.wikimedia.org/wikipedia/commons/e/ea/John_Hancock_signature.png',
                              height: 45,
                              color: isDark ? Colors.white70 : Colors.black87,
                              errorBuilder: (c, e, s) => const Icon(Icons.check_rounded, color: Colors.green, size: 28),
                            ).animate().fadeIn().scale()
                          : Text(
                              'Attente...',
                              style: TextStyle(color: hintColor, fontSize: 10, fontStyle: FontStyle.italic),
                            ),
                      ),
                      const SizedBox(height: 8),
                      if (!_driverSigned)
                        ElevatedButton(
                          onPressed: () {
                            setState(() {
                              _driverSigned = true;
                            });
                            _checkSignatureCompletion();
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.violet,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          child: const Text('Signer (Livreur)', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                        )
                      else
                        const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.check_circle_rounded, color: Colors.green, size: 14),
                            SizedBox(width: 4),
                            Text('Signé', style: TextStyle(color: Colors.green, fontSize: 11, fontWeight: FontWeight.bold)),
                          ],
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _checkSignatureCompletion() {
    if (_agencySigned && _driverSigned) {
      setState(() {
        _isSigningTransitionActive = true;
      });
      Future.delayed(const Duration(milliseconds: 1500), () {
        if (!mounted) return;
        setState(() {
          _isSigningTransitionActive = false;
          _onStepChanged(_currentStep + 1);
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Colis retiré avec succès ! Le livreur est maintenant en route vers votre adresse.'),
            backgroundColor: Colors.green,
          ),
        );
      });
    }
  }

  Widget _buildClientDeliveryApprovalCard(Color textColor, Color hintColor, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.shade50,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.green.withValues(alpha: 0.35), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.green.withValues(alpha: 0.05),
            blurRadius: 15,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.shield_rounded, color: Colors.green, size: 22),
              const SizedBox(width: 8),
              Text(
                'Double Validation Sécurisée',
                style: TextStyle(color: textColor, fontWeight: FontWeight.w900, fontSize: 14),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Le livreur Jean-Marc L. déclare votre colis livré à votre domicile.',
            style: TextStyle(color: textColor, fontSize: 12, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Text(
            'Pour votre sécurité, confirmez la bonne réception sur votre écran.',
            style: TextStyle(color: hintColor, fontSize: 11),
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.black26 : Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.green.withValues(alpha: 0.2)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle_rounded, color: Colors.green, size: 16),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Déclaration signée par le livreur',
                          style: TextStyle(color: textColor, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {
                _startDualConfirmation();
              },
              icon: const Icon(Icons.verified_rounded, color: Colors.white, size: 18),
              label: const Text(
                'Approuver & Signer la Réception',
                style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 13),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green.shade600,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 2,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContactCard(Color textColor, Color hintColor, bool isDark) {
    final bool isSignatureStep = (isLocal && _currentStep == 4) || (!isLocal && _currentStep == 9);
    if (isSignatureStep) {
      return _buildJointSignatureCard(textColor, hintColor, isDark);
    }
    
    final bool isApprovalStep = (isLocal && _currentStep == 6) || (!isLocal && _currentStep == 11);
    if (isApprovalStep) {
      return _buildClientDeliveryApprovalCard(textColor, hintColor, isDark);
    }

    final contact = activeContact;

    if (contact == null) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDark ? Colors.white.withValues(alpha: 0.03) : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.violet.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.hourglass_empty_rounded, color: AppColors.violet, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Préparation en cours', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 15)),
                  const SizedBox(height: 4),
                  Text('Attribution d\'un livreur très prochainement.', style: TextStyle(color: hintColor, fontSize: 12)),
                ],
              ),
            ),
          ],
        ),
      ).animate().fade();
    }

    final isDriver = isLocal || _currentStep >= 6;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.shade50,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.violet.withValues(alpha: 0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.grey.shade300,
                  image: DecorationImage(
                    image: NetworkImage(contact['avatar']),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(contact['name'], style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 16)),
                    Text(contact['role'], style: TextStyle(color: hintColor, fontSize: 12)),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.star_rounded, color: Colors.amber, size: 14),
                        const SizedBox(width: 4),
                        Text(contact['rating'], style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 11)),
                      ],
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.phone_rounded, color: Colors.green),
                style: IconButton.styleFrom(
                  backgroundColor: Colors.green.withValues(alpha: 0.15),
                  padding: const EdgeInsets.all(10),
                ),
                onPressed: () => _startCall(contact['name'], contact['avatar']),
              ),
              const SizedBox(width: 8),
              IconButton(
                icon: const Icon(Icons.chat_bubble_rounded, color: AppColors.violet),
                style: IconButton.styleFrom(
                  backgroundColor: AppColors.violet.withValues(alpha: 0.15),
                  padding: const EdgeInsets.all(10),
                ),
                onPressed: () => setState(() => _isChatOpen = true),
              ),
            ],
          ),
          if (isDriver) ...[
            const SizedBox(height: 12),
            const Divider(height: 1),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: _startVoiceRecordingSimulation,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.mic_rounded, color: AppColors.violet, size: 16),
                    const SizedBox(width: 6),
                    Text(
                      'Lui envoyer une note vocale',
                      style: TextStyle(
                        color: AppColors.violet, 
                        fontWeight: FontWeight.bold, 
                        fontSize: 12,
                        decoration: TextDecoration.underline,
                        decorationColor: AppColors.violet.withValues(alpha: 0.5),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    ).animate().fade().slideX();
  }

  Widget _buildStepItem(int idx, String title, String desc, bool isDark, Color textColor) {
    final isCompleted = idx < _currentStep;
    final isCurrent = idx == _currentStep;
    final isPast = idx < _currentStep;

    Color statusColor = Colors.grey;
    if (isCompleted) {
      statusColor = Colors.green;
    } else if (isCurrent) {
      statusColor = AppColors.violet;
    }

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                color: isCompleted ? Colors.green : (isCurrent ? Colors.transparent : Colors.grey.withValues(alpha: 0.3)),
                shape: BoxShape.circle,
                border: isCurrent ? Border.all(color: AppColors.violet, width: 3) : null,
              ),
              child: isCompleted
                ? const Icon(Icons.check, size: 12, color: Colors.white)
                : (isCurrent
                    ? Center(
                        child: Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: AppColors.violet,
                            shape: BoxShape.circle,
                          ),
                        ),
                      )
                    : null),
            ),
            if (idx < steps.length - 1)
              Container(
                width: 2,
                height: 48,
                color: isCompleted ? Colors.green : Colors.grey.withValues(alpha: 0.3),
              ),
          ],
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  color: isCurrent ? AppColors.violet : (isPast ? textColor : textColor.withValues(alpha: 0.5)),
                  fontWeight: isCurrent ? FontWeight.w900 : FontWeight.bold,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                desc,
                style: TextStyle(
                  color: isCurrent ? textColor.withValues(alpha: 0.7) : Colors.grey,
                  fontSize: 11,
                ),
              ),
              const SizedBox(height: 14),
            ],
          ),
        ),
        Text(
          isCompleted
            ? '${12 + (idx ~/ 2)}:${(idx * 13) % 60}'
            : (isCurrent ? 'En cours' : '--:--'),
          style: TextStyle(
            color: isCurrent ? AppColors.violet : Colors.grey,
            fontWeight: FontWeight.bold,
            fontSize: 10,
          ),
        ),
      ],
    );
  }

  Widget _buildSimulationPanel(Color textColor, bool isDark) {
    final maxStep = steps.length - 1;
    return Container(
      margin: const EdgeInsets.only(left: 16, right: 16, bottom: 20),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1B162E).withValues(alpha: 0.96) : const Color(0xFFF2EDFD).withValues(alpha: 0.96),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.violet.withValues(alpha: 0.35), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: AppColors.violet.withValues(alpha: 0.15),
            blurRadius: 15,
            spreadRadius: 2,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.settings_suggest_rounded, color: AppColors.violet, size: 18),
                  const SizedBox(width: 8),
                  Text(
                    'Démo Interactive',
                    style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.violet,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  'Étape ${_currentStep + 1}/${steps.length}',
                  style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              )
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.skip_previous_rounded, color: AppColors.violet),
                onPressed: _currentStep > 0 ? () => _onStepChanged(_currentStep - 1) : null,
              ),
              Expanded(
                child: SliderTheme(
                  data: SliderTheme.of(context).copyWith(
                    activeTrackColor: AppColors.violet,
                    inactiveTrackColor: AppColors.violet.withValues(alpha: 0.15),
                    thumbColor: AppColors.violet,
                    overlayColor: AppColors.violet.withValues(alpha: 0.1),
                    valueIndicatorColor: AppColors.violet,
                    valueIndicatorTextStyle: const TextStyle(color: Colors.white),
                  ),
                  child: Slider(
                    value: _currentStep.toDouble(),
                    min: 0,
                    max: maxStep.toDouble(),
                    divisions: maxStep,
                    label: steps[_currentStep]['title'],
                    onChanged: (value) => _onStepChanged(value.toInt()),
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.skip_next_rounded, color: AppColors.violet),
                onPressed: _currentStep < maxStep ? () => _onStepChanged(_currentStep + 1) : null,
              ),
            ],
          ),
          Text(
            'Glissez le slider pour simuler les différentes étapes de livraison.',
            style: TextStyle(color: Colors.grey.shade500, fontSize: 10, fontStyle: FontStyle.italic),
          )
        ],
      ),
    );
  }

  Widget _buildCallingOverlay() {
    final minutes = (_callDuration / 60).floor().toString().padLeft(2, '0');
    final seconds = (_callDuration % 60).toString().padLeft(2, '0');
    final isConnecting = _callDuration == 0;

    return Positioned.fill(
      child: Container(
        color: const Color(0xFF0F0C20),
        padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 30),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              children: [
                const Text(
                  'MOSSOMBI LIVRAISON',
                  style: TextStyle(color: AppColors.violet, fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 2),
                ),
                const SizedBox(height: 50),
                Container(
                  width: 110,
                  height: 110,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.violet.withValues(alpha: 0.25), width: 3),
                    image: DecorationImage(
                      image: NetworkImage(_callingAvatar),
                      fit: BoxFit.cover,
                    ),
                  ),
                ).animate(onPlay: (c) => c.repeat()).scale(
                  begin: const Offset(1, 1),
                  end: const Offset(1.06, 1.06),
                  duration: 1.5.seconds,
                  curve: Curves.easeInOut,
                ),
                const SizedBox(height: 20),
                Text(
                  _callingName,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 22),
                ),
                const SizedBox(height: 8),
                Text(
                  isConnecting ? 'Connexion en cours...' : '$minutes:$seconds',
                  style: TextStyle(
                    color: isConnecting ? AppColors.violet : Colors.white70, 
                    fontSize: 15, 
                    fontWeight: FontWeight.w600
                  ),
                ),
              ],
            ),
            Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildCallOption(Icons.mic_off_rounded, 'Silence'),
                    _buildCallOption(Icons.volume_up_rounded, 'Haut-parleur'),
                    _buildCallOption(Icons.videocam_rounded, 'Vidéo'),
                  ],
                ),
                const SizedBox(height: 60),
                GestureDetector(
                  onTap: _endCall,
                  child: Container(
                    width: 65,
                    height: 65,
                    decoration: const BoxDecoration(
                      color: Colors.redAccent,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(color: Colors.redAccent, blurRadius: 15, spreadRadius: 1)
                      ],
                    ),
                    child: const Icon(Icons.call_end_rounded, color: Colors.white, size: 28),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    ).animate().fade();
  }

  Widget _buildCallOption(IconData icon, String label) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.white.withValues(alpha: 0.1),
          ),
          child: Icon(icon, color: Colors.white, size: 22),
        ),
        const SizedBox(height: 6),
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 11)),
      ],
    );
  }

  Widget _buildChatOverlay(bool isDark, Color textColor) {
    final contact = activeContact ?? {
      'name': 'Mossombi Support',
      'avatar': 'https://i.pravatar.cc/150?img=47',
    };

    return Positioned.fill(
      child: Container(
        color: isDark ? AppColors.bgDark1 : Colors.white,
        child: Column(
          children: [
            AppBar(
              backgroundColor: Colors.transparent,
              elevation: 0,
              leading: IconButton(
                icon: Icon(Icons.arrow_back_ios_new_rounded, color: textColor),
                onPressed: () => setState(() => _isChatOpen = false),
              ),
              title: Row(
                children: [
                  CircleAvatar(
                    backgroundImage: NetworkImage(contact['avatar']),
                    radius: 16,
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        contact['name'],
                        style: TextStyle(color: textColor, fontSize: 14, fontWeight: FontWeight.bold),
                      ),
                      const Text('En ligne', style: TextStyle(color: Colors.green, fontSize: 10)),
                    ],
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _chatMessages.length,
                itemBuilder: (context, index) {
                  final msg = _chatMessages[index];
                  final isMe = msg['sender'] == 'me';
                  final isVoice = msg['type'] == 'voice';

                  return Align(
                    alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                      decoration: BoxDecoration(
                        color: isMe
                          ? AppColors.violet
                          : (isDark ? Colors.white.withValues(alpha: 0.08) : Colors.grey.shade100),
                        borderRadius: BorderRadius.only(
                          topLeft: const Radius.circular(16),
                          topRight: const Radius.circular(16),
                          bottomLeft: isMe ? const Radius.circular(16) : Radius.zero,
                          bottomRight: isMe ? Radius.zero : const Radius.circular(16),
                        ),
                      ),
                      child: isVoice
                        ? Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.play_arrow_rounded, color: isMe ? Colors.white : AppColors.violet, size: 22),
                              const SizedBox(width: 8),
                              ...List.generate(6, (idx) => Container(
                                width: 2.5,
                                height: 8 + (idx % 3 == 0 ? 8 : (idx % 2 == 0 ? 4 : 12)),
                                margin: const EdgeInsets.symmetric(horizontal: 1.5),
                                decoration: BoxDecoration(
                                  color: isMe ? Colors.white70 : Colors.grey,
                                  borderRadius: BorderRadius.circular(2),
                                ),
                              )),
                              const SizedBox(width: 12),
                              Text(
                                msg['duration'] ?? '0:03',
                                style: TextStyle(color: isMe ? Colors.white70 : Colors.grey, fontSize: 10),
                              ),
                            ],
                          )
                        : Text(
                            msg['text'] ?? '',
                            style: TextStyle(color: isMe ? Colors.white : textColor, fontSize: 14),
                          ),
                    ),
                  );
                },
              ),
            ),
            const Divider(height: 1),
            Padding(
              padding: EdgeInsets.only(
                left: 16,
                right: 16,
                top: 8,
                bottom: 8 + MediaQuery.of(context).viewInsets.bottom,
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: Row(
                        children: [
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextField(
                              controller: _messageController,
                              decoration: const InputDecoration(
                                hintText: 'Votre message...',
                                border: InputBorder.none,
                                isDense: true,
                              ),
                              style: TextStyle(color: textColor, fontSize: 14),
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.mic_rounded, color: AppColors.violet),
                            onPressed: _startVoiceRecordingSimulation,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  CircleAvatar(
                    backgroundColor: AppColors.violet,
                    radius: 20,
                    child: IconButton(
                      icon: const Icon(Icons.send_rounded, color: Colors.white, size: 16),
                      onPressed: () {
                        final text = _messageController.text.trim();
                        if (text.isNotEmpty) {
                          _sendChatMessage(text);
                        }
                      },
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ).animate().slideX(begin: 1, end: 0, curve: Curves.easeOutCubic, duration: 300.ms);
  }

  Widget _buildVoiceRecordingOverlay() {
    final seconds = _recordingSeconds.toString().padLeft(2, '0');

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark
          ? const Color(0xFF1E1E2C)
          : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: const [
          BoxShadow(color: Colors.black38, blurRadius: 20, offset: Offset(0, -4))
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            'Enregistrement de note vocale',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 10,
                height: 10,
                decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
              ).animate(onPlay: (c) => c.repeat()).fade(duration: 500.ms),
              const SizedBox(width: 8),
              Text(
                '0:$seconds',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(12, (idx) {
              final double height = 8.0 + (idx % 3 * 8) + (idx % 2 == 0 ? 4 : 10);
              return Container(
                width: 3.5,
                height: height,
                margin: const EdgeInsets.symmetric(horizontal: 2.5),
                decoration: BoxDecoration(
                  color: AppColors.violet.withValues(alpha: 0.65),
                  borderRadius: BorderRadius.circular(2),
                ),
              ).animate(onPlay: (c) => c.repeat(reverse: true)).scaleY(
                begin: 0.5,
                end: 1.4,
                duration: (300 + idx * 40).ms,
              );
            }),
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              TextButton.icon(
                onPressed: _cancelRecording,
                icon: const Icon(Icons.delete_rounded, color: Colors.redAccent, size: 18),
                label: const Text('Annuler', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  backgroundColor: Colors.redAccent.withValues(alpha: 0.1),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              ElevatedButton.icon(
                onPressed: _sendVoiceNote,
                icon: const Icon(Icons.send_rounded, color: Colors.white, size: 16),
                label: const Text('Envoyer', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  backgroundColor: AppColors.violet,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
        ],
      ),
    ).animate().slideY(begin: 1, end: 0, curve: Curves.easeOutBack, duration: 400.ms);
  }

  Widget _buildDualConfirmationDialog(Color textColor, bool isDark) {
    return Positioned.fill(
      child: Container(
        color: Colors.black54,
        child: Center(
          child: Dialog(
            backgroundColor: isDark ? const Color(0xFF1E1E2D) : Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.verified_user_rounded, color: AppColors.violet, size: 44),
                  const SizedBox(height: 16),
                  const Text(
                    'Validation des Parties',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Pour finaliser, le livreur et vous devez valider la réception.',
                    style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Icon(
                        _driverConfirmed ? Icons.check_circle_rounded : Icons.pending_rounded,
                        color: _driverConfirmed ? Colors.green : Colors.amber,
                        size: 22,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _driverConfirmed
                            ? 'Le livreur a validé la livraison.'
                            : 'Attente de confirmation du livreur...',
                          style: TextStyle(
                            color: textColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      ),
                      if (!_driverConfirmed)
                        const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.violet),
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Icon(
                        _clientConfirmed ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                        color: _clientConfirmed ? Colors.green : Colors.grey,
                        size: 22,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Votre validation finale',
                          style: TextStyle(
                            color: textColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton(
                        onPressed: () => setState(() => _isDualConfirming = false),
                        child: const Text('Annuler', style: TextStyle(color: Colors.grey)),
                      ),
                      const SizedBox(width: 12),
                      ElevatedButton(
                        onPressed: _driverConfirmed ? _clientConfirmFinal : null,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.violet,
                          disabledBackgroundColor: Colors.grey.shade300,
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text(
                          'Confirmer Réception', 
                          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRatingOverlay(Color textColor, bool isDark) {
    final tags = ['Rapide', 'Courtois', 'Colis intact', 'Excellent service', 'Respectueux'];

    return Positioned.fill(
      child: Container(
        color: Colors.black87,
        child: Center(
          child: SingleChildScrollView(
            child: Container(
              margin: const EdgeInsets.all(24),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E1E2C) : Colors.white,
                borderRadius: BorderRadius.circular(28),
                boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 20)],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: const BoxDecoration(
                      color: Colors.green,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.check_rounded, color: Colors.white, size: 36),
                  ).animate().scale(curve: Curves.elasticOut, duration: 800.ms),
                  const SizedBox(height: 16),
                  Text(
                    'Merci pour votre confiance !',
                    style: TextStyle(color: textColor, fontWeight: FontWeight.w900, fontSize: 18),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Veuillez attribuer une note à votre livreur.',
                    style: TextStyle(color: Colors.grey, fontSize: 12),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(5, (idx) {
                      final starVal = idx + 1.0;
                      return IconButton(
                        icon: Icon(
                          _ratingStars >= starVal ? Icons.star_rounded : Icons.star_outline_rounded,
                          color: Colors.amber,
                          size: 32,
                        ),
                        onPressed: () {
                          setState(() {
                            _ratingStars = starVal;
                          });
                        },
                      );
                    }),
                  ),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    alignment: WrapAlignment.center,
                    children: tags.map((tag) {
                      final isSelected = _selectedRatingTags.contains(tag);
                      return ChoiceChip(
                        label: Text(tag, style: TextStyle(color: isSelected ? Colors.white : textColor, fontSize: 11)),
                        selected: isSelected,
                        selectedColor: AppColors.violet,
                        backgroundColor: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.shade100,
                        onSelected: (val) {
                          setState(() {
                            if (val) {
                              _selectedRatingTags.add(tag);
                            } else {
                              _selectedRatingTags.remove(tag);
                            }
                          });
                        },
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _ratingCommentController,
                    maxLines: 2,
                    decoration: InputDecoration(
                      hintText: 'Votre avis sur la livraison...',
                      hintStyle: const TextStyle(color: Colors.grey, fontSize: 12),
                      filled: true,
                      fillColor: isDark ? Colors.white.withValues(alpha: 0.03) : Colors.grey.shade50,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    ),
                    style: TextStyle(color: textColor, fontSize: 12),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        setState(() {
                          _showRatingOverlay = false;
                        });
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Avis envoyé. Merci d\'avoir choisi Mossombi !'),
                            backgroundColor: Colors.green,
                          ),
                        );
                        context.pop(); // return to orders screen
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.violet,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Envoyer mon avis', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// Custom Painters are no longer used since we render live OpenStreetMap tiles via FlutterMap.

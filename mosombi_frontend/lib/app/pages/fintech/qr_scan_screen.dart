import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/glass_container.dart';
import '../../../core/providers/wallet_provider.dart';
import '../../../core/providers/auth_provider.dart';

class QRScanScreen extends ConsumerStatefulWidget {
  const QRScanScreen({super.key});
  @override
  ConsumerState<QRScanScreen> createState() => _QRScanScreenState();
}

class _QRScanScreenState extends ConsumerState<QRScanScreen> {
  final MobileScannerController _scannerController = MobileScannerController(
    detectionSpeed: DetectionSpeed.normal,
    facing: CameraFacing.back,
    torchEnabled: false,
    formats: const [BarcodeFormat.qrCode],
  );
  
  bool _isScanning = true;
  bool _showMyQR = false; // Basculer entre l'appareil photo et mon propre QR code

  @override
  void dispose() {
    _scannerController.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (!_isScanning) return;
    
    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isNotEmpty) {
      final String? code = barcodes.first.rawValue;
      if (code != null && code.isNotEmpty) {
        setState(() => _isScanning = false);
        // Stoper la cam
        _scannerController.stop();

        // Par exemple un QR Mossombi peut ressembler à "mossombi:transfert:12345678" ou juste "12345678"
        String parsedCode = code;
        if (code.startsWith('mossombi:transfert:')) {
          parsedCode = code.replaceAll('mossombi:transfert:', '');
        }

        // Naviguer vers Transfer avec l'extra
        context.pushReplacement('/fintech/transfer', extra: {'code': parsedCode});
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final authState = ref.watch(authProvider);
    final user = authState.user;
    
    // Pour l'exemple généré
    final myDisplayCode = user?.userIdDisplay?.replaceAll(RegExp(r'[^0-9]'), '') ?? '00000000';
    final qrData = 'mossombi:transfert:$myDisplayCode';

    return Scaffold(
      backgroundColor: Colors.black,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: Text(_showMyQR ? 'Mon QR Code' : 'Scanner', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900)),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded, color: Colors.white, size: 28),
          onPressed: () => context.pop(),
        ),
        actions: [
          if (!_showMyQR)
            IconButton(
              icon: const Icon(Icons.bolt_rounded, color: Colors.yellow),
              onPressed: () => _scannerController.toggleTorch(),
            ),
        ],
      ),
      body: Stack(
        children: [
          // 1. Camera View ou QR Généré
          if (!_showMyQR)
            MobileScanner(
              controller: _scannerController,
              onDetect: _onDetect,
            )
          else
            Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF1E1E2C), Color(0xFF2D2D44)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                )
              ),
              child: Center(
                child: GlassContainer(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 200,
                        height: 200,
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                        padding: const EdgeInsets.all(12),
                        child: QrImageView(
                          data: qrData,
                          version: QrVersions.auto,
                          backgroundColor: Colors.white,
                          eyeStyle: const QrEyeStyle(eyeShape: QrEyeShape.square, color: Colors.black),
                          dataModuleStyle: const QrDataModuleStyle(dataModuleShape: QrDataModuleShape.square, color: Colors.black),
                        ),
                      ),
                      const SizedBox(height: 24),
                      const Text('Mon Code Mossombi', style: TextStyle(color: Colors.white70, fontSize: 14)),
                      Text(myDisplayCode, style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w900, letterSpacing: 2)),
                      const SizedBox(height: 12),
                      const Text('Présentez ce QR code pour recevoir un transfert', textAlign: TextAlign.center, style: TextStyle(color: Color(0xFF00E5C5), fontSize: 13)),
                    ],
                  ),
                ).animate().scale(curve: Curves.easeOutBack, duration: 600.ms),
              ),
            ),

          // 2. Viewfinder Overlay (seulement en mode scan)
          if (!_showMyQR)
            Positioned.fill(
              child: CustomPaint(
                painter: _QRViewFinderPainter(scanColor: const Color(0xFF00E5C5)),
              ),
            ),

          // 3. Bottom controls
          Positioned(
            bottom: 40,
            left: 24,
            right: 24,
            child: GlassContainer(
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
              child: Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () {
                         setState(() => _showMyQR = false);
                         _scannerController.start();
                         _isScanning = true;
                      },
                      behavior: HitTestBehavior.opaque,
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        decoration: BoxDecoration(
                          color: !_showMyQR ? const Color(0xFF00E5C5).withValues(alpha: 0.2) : Colors.transparent,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Center(
                          child: Text('Scanner', style: TextStyle(
                            color: !_showMyQR ? const Color(0xFF00E5C5) : Colors.white70,
                            fontWeight: FontWeight.bold,
                          )),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: GestureDetector(
                      onTap: () {
                        setState(() => _showMyQR = true);
                        _scannerController.stop();
                      },
                      behavior: HitTestBehavior.opaque,
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        decoration: BoxDecoration(
                          color: _showMyQR ? const Color(0xFFFF6584).withValues(alpha: 0.2) : Colors.transparent,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Center(
                          child: Text('Mon QR Code', style: TextStyle(
                            color: _showMyQR ? const Color(0xFFFF6584) : Colors.white70,
                            fontWeight: FontWeight.bold,
                          )),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ).animate().slideY(begin: 1.0, end: 0, delay: 300.ms),
        ],
      ),
    );
  }
}

class _QRViewFinderPainter extends CustomPainter {
  final Color scanColor;
  _QRViewFinderPainter({required this.scanColor});

  @override
  void paint(Canvas canvas, Size size) {
    final bgPaint = Paint()
      ..color = Colors.black.withValues(alpha: 0.6)
      ..style = PaintingStyle.fill;
    
    // Définir la zone du trou (le carré transparent)
    final double holeSize = 250;
    final Rect holeRect = Rect.fromCenter(
      center: Offset(size.width / 2, size.height / 2 - 50), // Un peu plus haut que le centre
      width: holeSize,
      height: holeSize,
    );
    
    // Peindre le fond obscurci globalement
    canvas.saveLayer(Rect.fromLTWH(0, 0, size.width, size.height), Paint());
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), bgPaint);
    
    // Percer le trou (BlendMode.clear)
    final holePaint = Paint()..blendMode = BlendMode.clear;
    canvas.drawRRect(RRect.fromRectAndRadius(holeRect, const Radius.circular(20)), holePaint);
    canvas.restore();
    
    // Dessiner les coins du viewfinder (brackets)
    final linePaint = Paint()
      ..color = scanColor
      ..strokeWidth = 4
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;
      
    final double cornerRadius = 20;
    final double lineLength = 40;
    
    final path = Path();
    
    // Coin Supérieur Gauche
    path.moveTo(holeRect.left, holeRect.top + lineLength);
    path.arcToPoint(Offset(holeRect.left + cornerRadius, holeRect.top), radius: Radius.circular(cornerRadius));
    path.lineTo(holeRect.left + lineLength, holeRect.top);
    
    // Coin Supérieur Droit
    path.moveTo(holeRect.right - lineLength, holeRect.top);
    path.arcToPoint(Offset(holeRect.right, holeRect.top + cornerRadius), radius: Radius.circular(cornerRadius));
    path.lineTo(holeRect.right, holeRect.top + lineLength);
    
    // Coin Inférieur Gauche
    path.moveTo(holeRect.left, holeRect.bottom - lineLength);
    path.arcToPoint(Offset(holeRect.left + cornerRadius, holeRect.bottom), radius: Radius.circular(cornerRadius), clockwise: false);
    path.lineTo(holeRect.left + lineLength, holeRect.bottom);
    
    // Coin Inférieur Droit
    path.moveTo(holeRect.right - lineLength, holeRect.bottom);
    path.arcToPoint(Offset(holeRect.right, holeRect.bottom - cornerRadius), radius: Radius.circular(cornerRadius), clockwise: false);
    path.lineTo(holeRect.right, holeRect.bottom - lineLength);
    
    canvas.drawPath(path, linePaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

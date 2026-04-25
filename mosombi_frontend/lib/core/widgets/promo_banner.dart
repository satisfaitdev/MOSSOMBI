import 'dart:async';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_gradients.dart';

class PromoBanner extends StatefulWidget {
  const PromoBanner({super.key});

  @override
  State<PromoBanner> createState() => _PromoBannerState();
}

class _PromoBannerState extends State<PromoBanner> {
  final PageController _pageCtrl = PageController(viewportFraction: 1.0);
  Timer? _timer;
  int _currentPage = 0;

  final List<Map<String, String>> _ads = [
    {
      'image': 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=1000',
      'title': 'Mossombi Partenaires',
      'subtitle': '-20% sur vos livraisons cet été !',
    },
    {
      'image': 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&q=80&w=1000',
      'title': 'Paiement sans contact',
      'subtitle': 'La magie de Mossombi Pay.',
    },
    {
      'image': 'https://images.unsplash.com/photo-1601594541570-5b65fdfcc0cc?auto=format&fit=crop&q=80&w=1000',
      'title': 'Nouvelles Boutiques',
      'subtitle': 'Découvrez les offres locales.',
    },
  ];

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 4), (timer) {
      if (_pageCtrl.hasClients) {
        int next = _currentPage + 1;
        if (next >= _ads.length) next = 0;
        _pageCtrl.animateToPage(
          next,
          duration: const Duration(milliseconds: 600),
          curve: Curves.fastOutSlowIn,
        );
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pageCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 125,
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: PageView.builder(
          controller: _pageCtrl,
          onPageChanged: (idx) => setState(() => _currentPage = idx),
          itemCount: _ads.length,
          itemBuilder: (context, index) {
            final ad = _ads[index];
            return Stack(
              fit: StackFit.expand,
              children: [
                Image.network(
                  ad['image']!,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(color: AppColors.violet),
                ),
                Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.black87, Colors.transparent],
                      begin: Alignment.bottomLeft,
                      end: Alignment.topRight,
                    ),
                  ),
                ),
                Positioned(
                  right: -20,
                  top: -20,
                  child: Icon(Icons.campaign_rounded, size: 100, color: Colors.white.withValues(alpha: 0.12)),
                ),
                Positioned(
                  top: 12,
                  left: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.violet.withValues(alpha: 0.9),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text('PUBLICITÉ', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
                  ),
                ),
                Positioned(
                  left: 16,
                  bottom: 16,
                  right: 16,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(ad['title']!, style: const TextStyle(
                        color: Colors.white, 
                        fontSize: 16, 
                        fontWeight: FontWeight.w900
                      )),
                      const SizedBox(height: 2),
                      Text(ad['subtitle']!, style: const TextStyle(
                        color: Colors.white70, 
                        fontSize: 12
                      )),
                    ],
                  ),
                )
              ],
            );
          },
        ),
      ),
    );
  }
}

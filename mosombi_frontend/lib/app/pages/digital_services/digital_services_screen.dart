import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/theme/app_gradients.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/providers/wallet_provider.dart';
import 'package:mosombi_frontend/core/providers/digital_services_provider.dart';

class DigitalServicesScreen extends StatefulWidget {
  const DigitalServicesScreen({super.key});

  @override
  State<DigitalServicesScreen> createState() => _DigitalServicesScreenState();
}

class _DigitalServicesScreenState extends State<DigitalServicesScreen> with TickerProviderStateMixin {
  final _searchController = TextEditingController();
  String _selectedCategory = '';
  List<Map<String, dynamic>> _filteredProviders = [];

  static const _categories = [
    {'id': 'telephone', 'icon': Icons.phone_android_rounded, 'label': 'Téléphone', 'color': Color(0xFF6C4EF6)},
    {'id': 'internet', 'icon': Icons.wifi_rounded, 'label': 'Internet', 'color': Color(0xFF00D4FF)},
    {'id': 'tv', 'icon': Icons.tv_rounded, 'label': 'TV', 'color': Color(0xFF4CAF50)},
    {'id': 'streaming', 'icon': Icons.movie_creation_rounded, 'label': 'Streaming', 'color': Color(0xFFFF6584)},
    {'id': 'gaming', 'icon': Icons.sports_esports_rounded, 'label': 'Gaming', 'color': Color(0xFFE91E63)},
    {'id': 'utilities', 'icon': Icons.flash_on_rounded, 'label': 'Utilitaires', 'color': Color(0xFFFFA000)},
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DigitalServiceProvider>().fetchProviders();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _filterProviders() {
    final provider = context.read<DigitalServiceProvider>();
    final query = _searchController.text.toLowerCase().trim();
    final all = provider.providers;
    setState(() {
      _filteredProviders = all.where((p) {
        final name = (p['name'] as String? ?? '').toLowerCase();
        final cat = (p['category'] as String? ?? '');
        final matchesSearch = query.isEmpty || name.contains(query);
        final matchesCategory = _selectedCategory.isEmpty || cat == _selectedCategory;
        return matchesSearch && matchesCategory;
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white.withValues(alpha: 0.5) : AppColors.bgDark1.withValues(alpha: 0.5);
    final wallet = context.watch<WalletProvider>();
    final dsProvider = context.watch<DigitalServiceProvider>();

    if (_filteredProviders.isEmpty && dsProvider.providers.isNotEmpty && _searchController.text.isEmpty) {
      _filterProviders();
    }

    return Scaffold(
      extendBody: true,
      backgroundColor: Colors.transparent,
      body: AnimatedGradientBg(
        isDark: isDark,
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => context.pop(),
                      child: const Icon(Icons.arrow_back_rounded, color: Colors.white70),
                    ),
                    const SizedBox(width: 12),
                    Text('Services Digitaux',
                        style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: textColor)),
                    const Spacer(),
                    GestureDetector(
                      onTap: () => context.push('/digital-services/history'),
                      child: const Icon(Icons.history_rounded, color: Colors.white70),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: GlassContainer(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  child: Row(
                    children: [
                      const Icon(Icons.account_balance_wallet_rounded, color: AppColors.mint, size: 20),
                      const SizedBox(width: 10),
                      Text('Solde',
                          style: TextStyle(color: hintColor, fontSize: 13)),
                      const Spacer(),
                      Text('${wallet.balance.toStringAsFixed(0)} F CFA',
                          style: TextStyle(
                              color: textColor, fontWeight: FontWeight.w800, fontSize: 16)),
                    ],
                  ),
                ),
              ).animate().fade(duration: 400.ms).slideY(begin: -0.1, end: 0),
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: GlassContainer(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  child: TextField(
                    controller: _searchController,
                    onChanged: (_) => _filterProviders(),
                    style: TextStyle(color: textColor),
                    decoration: InputDecoration(
                      hintText: 'Rechercher un fournisseur...',
                      hintStyle: TextStyle(color: hintColor, fontSize: 14),
                      border: InputBorder.none,
                      icon: Icon(Icons.search, color: hintColor, size: 20),
                      suffixIcon: _searchController.text.isNotEmpty
                          ? GestureDetector(
                              onTap: () {
                                _searchController.clear();
                                _filterProviders();
                              },
                              child: Icon(Icons.close, color: hintColor, size: 18),
                            )
                          : null,
                    ),
                  ),
                ),
              ).animate(delay: 100.ms).fade().slideY(begin: -0.1, end: 0),
              const SizedBox(height: 16),
              SizedBox(
                height: 44,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: [
                    _CategoryChip(
                      label: 'Tous',
                      selected: _selectedCategory.isEmpty,
                      onTap: () {
                        setState(() => _selectedCategory = '');
                        _filterProviders();
                      },
                    ),
                    ..._categories.map((c) => _CategoryChip(
                      label: c['label'] as String,
                      icon: c['icon'] as IconData,
                      selected: _selectedCategory == c['id'],
                      onTap: () {
                        setState(() => _selectedCategory = c['id'] as String);
                        _filterProviders();
                      },
                    )),
                  ],
                ),
              ).animate(delay: 200.ms).fade().slideY(begin: -0.1, end: 0),
              const SizedBox(height: 16),
              Expanded(
                child: dsProvider.loading
                    ? const Center(child: CircularProgressIndicator(color: AppColors.violet))
                    : _filteredProviders.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.search_off_rounded, color: hintColor, size: 48),
                                const SizedBox(height: 12),
                                Text('Aucun fournisseur trouvé',
                                    style: TextStyle(color: hintColor, fontSize: 15)),
                              ],
                            ),
                          )
                        : GridView.builder(
                            padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
                            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 3,
                              childAspectRatio: 0.85,
                              mainAxisSpacing: 16,
                              crossAxisSpacing: 12,
                            ),
                            itemCount: _filteredProviders.length,
                            itemBuilder: (context, i) {
                              final p = _filteredProviders[i];
                              final cat = _categories.firstWhere(
                                (c) => c['id'] == p['category'],
                                orElse: () => {'icon': Icons.settings, 'color': AppColors.violet},
                              );
                              final name = p['name'] as String? ?? '';
                              final logoUrl = p['logo_url'] as String? ?? '';
                              final minPrice = (p['min_price'] as num?)?.toDouble() ?? 0;
                              final maxPrice = (p['max_price'] as num?)?.toDouble() ?? 0;
                              return _ProviderCard(
                                name: name,
                                logoUrl: logoUrl,
                                icon: cat['icon'] as IconData,
                                color: cat['color'] as Color,
                                minPrice: minPrice,
                                maxPrice: maxPrice,
                                productCount: (p['product_count'] as int?) ?? 0,
                                onTap: () {
                                  context.push('/digital-services/purchase', extra: p);
                                },
                                index: i,
                              );
                            },
                          ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  final String label;
  final IconData? icon;
  final bool selected;
  final VoidCallback onTap;

  const _CategoryChip({required this.label, this.icon, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          gradient: selected ? AppGradients.primary : null,
          color: selected ? null : Colors.white.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(22),
          border: Border.all(
            color: selected ? Colors.transparent : Colors.white.withValues(alpha: 0.2),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, color: selected ? Colors.white : Colors.white70, size: 16),
              const SizedBox(width: 6),
            ],
            Text(label,
                style: TextStyle(
                    color: selected ? Colors.white : Colors.white70,
                    fontSize: 13,
                    fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}

class _ProviderCard extends StatelessWidget {
  final String name;
  final String logoUrl;
  final IconData icon;
  final Color color;
  final double minPrice;
  final double maxPrice;
  final int productCount;
  final VoidCallback onTap;
  final int index;

  const _ProviderCard({
    required this.name,
    this.logoUrl = '',
    required this.icon,
    required this.color,
    this.minPrice = 0,
    this.maxPrice = 0,
    this.productCount = 0,
    required this.onTap,
    required this.index,
  });

  @override
  Widget build(BuildContext context) {
    final hasMultiplePrices = maxPrice > minPrice;
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: color.withValues(alpha: 0.3), width: 1.5),
            ),
            clipBehavior: Clip.antiAlias,
            child: logoUrl.isNotEmpty
                ? Image.network(logoUrl, fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Icon(icon, color: color, size: 30))
                : Icon(icon, color: color, size: 30),
          ).animate(delay: (100 + index * 50).ms)
              .scale(begin: const Offset(0.5, 0.5), duration: 400.ms, curve: Curves.elasticOut)
              .fade(),
          const SizedBox(height: 6),
          Text(name,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center),
          if (minPrice > 0) ...[
            const SizedBox(height: 2),
            Text(
              hasMultiplePrices
                  ? '${minPrice.toStringAsFixed(0)} - ${maxPrice.toStringAsFixed(0)} F'
                  : '${minPrice.toStringAsFixed(0)} F',
              style: TextStyle(fontSize: 9, fontWeight: FontWeight.w600, color: color.withValues(alpha: 0.9)),
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';

class GlobalSearchScreen extends StatefulWidget {
  const GlobalSearchScreen({super.key});

  @override
  State<GlobalSearchScreen> createState() => _GlobalSearchScreenState();
}

class _GlobalSearchScreenState extends State<GlobalSearchScreen> {
  String _query = '';
  final TextEditingController _controller = TextEditingController();

  final List<Map<String, dynamic>> allServices = [
    {'title': 'Marketplace', 'desc': 'Acheter des produits', 'route': '/marketplace', 'icon': Icons.store_mall_directory_rounded},
    {'title': 'Transport (Taxi)', 'desc': 'Commander un taxi ou une moto', 'route': '/transport', 'icon': Icons.directions_car_rounded},
    {'title': 'Food (Repas)', 'desc': 'Commander à manger', 'route': '/food', 'icon': Icons.restaurant_rounded},
    {'title': 'Portefeuille (Wallet)', 'desc': 'Gérer mon argent', 'route': '/fintech', 'icon': Icons.account_balance_wallet_rounded},
    {'title': 'Dépôt / Recharger', 'desc': 'Ajouter de l\'argent via Mobile Money', 'route': '/fintech/topup', 'icon': Icons.add_rounded},
    {'title': 'Retrait', 'desc': 'Retirer de l\'argent', 'route': '/fintech/withdraw', 'icon': Icons.arrow_upward_rounded},
    {'title': 'Scanner QR', 'desc': 'Payer via QR Code', 'route': '/fintech/qr', 'icon': Icons.qr_code_scanner_rounded},
    {'title': 'Panier', 'desc': 'Voir mes achats', 'route': '/cart', 'icon': Icons.shopping_cart_rounded},
    {'title': 'Intelligence Artificielle', 'desc': 'Assistant virtuel Mossombi', 'route': '/ai', 'icon': Icons.auto_awesome_rounded},
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;

    final suggestions = allServices.where((s) {
      final q = _query.toLowerCase();
      final title = s['title'] as String;
      final desc = s['desc'] as String;
      return title.toLowerCase().contains(q) || desc.toLowerCase().contains(q);
    }).toList();

    return Scaffold(
      extendBodyBehindAppBar: true,
      body: AnimatedGradientBg(
        isDark: isDark,
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverAppBar(
              pinned: true,
              floating: true,
              backgroundColor: Colors.transparent,
              elevation: 0,
              systemOverlayStyle: SystemUiOverlayStyle(
                statusBarColor: Colors.transparent,
                statusBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
                statusBarBrightness: isDark ? Brightness.dark : Brightness.light,
              ),
              leadingWidth: 64,
              leading: Padding(
                padding: const EdgeInsets.only(left: 16),
                child: IconButton(
                  icon: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white.withValues(alpha: 0.1) : Colors.black.withValues(alpha: 0.05),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.arrow_back_ios_new_rounded, color: textColor, size: 18),
                  ),
                  onPressed: () => context.pop(),
                ),
              ),
              titleSpacing: 0,
              title: Padding(
                padding: const EdgeInsets.only(right: 16),
                child: GlassContainer(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                  child: TextField(
                    controller: _controller,
                    autofocus: true,
                    style: TextStyle(color: textColor, fontSize: 14),
                    decoration: InputDecoration(
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(vertical: 8),
                      hintText: 'Rechercher un service...',
                      hintStyle: TextStyle(color: textColor.withValues(alpha: 0.5), fontSize: 14),
                      border: InputBorder.none,
                      suffixIconConstraints: const BoxConstraints(minHeight: 32, minWidth: 32),
                      suffixIcon: _query.isNotEmpty ? IconButton(
                        padding: EdgeInsets.zero,
                        icon: Icon(Icons.clear, color: textColor.withValues(alpha: 0.5), size: 18),
                        onPressed: () {
                          _controller.clear();
                          setState(() => _query = '');
                        },
                      ) : null,
                    ),
                    onChanged: (val) {
                      setState(() => _query = val);
                    },
                  ),
                ),
              ),
            ),
            const SliverToBoxAdapter(
              child: SizedBox(height: 16),
            ),
            if (suggestions.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Text('Aucun service ne correspond à votre recherche.', style: TextStyle(color: textColor)),
                ),
              )
            else
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final s = suggestions[index];
                    return ListTile(
                      leading: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFF9B77FF).withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(s['icon'] as IconData, color: const Color(0xFF6C4EF6)),
                      ),
                      title: Text(s['title'] as String, style: TextStyle(color: textColor, fontWeight: FontWeight.w600)),
                      subtitle: Text(s['desc'] as String, style: TextStyle(color: textColor.withValues(alpha: 0.7), fontSize: 12)),
                      onTap: () {
                        context.push(s['route'] as String);
                      },
                    );
                  },
                  childCount: suggestions.length,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

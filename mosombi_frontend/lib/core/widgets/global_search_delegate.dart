import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';

class GlobalSearchDelegate extends SearchDelegate<String?> {
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
  String get searchFieldLabel => 'Rechercher un service...';

  @override
  ThemeData appBarTheme(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    return theme.copyWith(
      appBarTheme: AppBarTheme(
        backgroundColor: isDark ? AppColors.bgDark1 : Colors.white,
        elevation: 0,
      ),
      scaffoldBackgroundColor: isDark ? AppColors.bgDark1 : Colors.white,
      inputDecorationTheme: const InputDecorationTheme(
        border: InputBorder.none,
      ),
    );
  }

  @override
  List<Widget>? buildActions(BuildContext context) {
    return [
      if (query.isNotEmpty)
        IconButton(
          icon: const Icon(Icons.clear),
          onPressed: () => query = '',
        )
    ];
  }

  @override
  Widget? buildLeading(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.arrow_back),
      onPressed: () => close(context, null),
    );
  }

  @override
  Widget buildResults(BuildContext context) => _buildSuggestionsList(context);

  @override
  Widget buildSuggestions(BuildContext context) => _buildSuggestionsList(context);

  Widget _buildSuggestionsList(BuildContext context) {
    final suggestions = allServices.where((s) {
      final q = query.toLowerCase();
      final title = s['title'] as String;
      final desc = s['desc'] as String;
      return title.toLowerCase().contains(q) || desc.toLowerCase().contains(q);
    }).toList();

    if (suggestions.isEmpty) {
      return AnimatedGradientBg(
        isDark: Theme.of(context).brightness == Brightness.dark,
        child: const Center(child: Text('Aucun service ne correspond à votre recherche.')),
      );
    }

    return AnimatedGradientBg(
      isDark: Theme.of(context).brightness == Brightness.dark,
      child: ListView.builder(
      itemCount: suggestions.length,
      itemBuilder: (context, index) {
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
          title: Text(s['title'] as String, style: const TextStyle(fontWeight: FontWeight.w600)),
          subtitle: Text(s['desc'] as String, style: const TextStyle(fontSize: 12)),
          onTap: () {
            close(context, null);
            context.push(s['route'] as String);
          },
        );
      },
    ),
    );
  }
}

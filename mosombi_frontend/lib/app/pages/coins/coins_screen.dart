import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:mosombi_frontend/core/providers/coins_provider.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';

class CoinsScreen extends StatefulWidget {
  const CoinsScreen({super.key});

  @override
  State<CoinsScreen> createState() => _CoinsScreenState();
}

class _CoinsScreenState extends State<CoinsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CoinsProvider>().fetchCoins();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white.withValues(alpha: 0.5) : AppColors.textSecondaryLight;

    return Scaffold(
      appBar: const MossombiHeaderType3(title: 'Coins'),
      body: AnimatedGradientBg(
        isDark: isDark,
        child: Consumer<CoinsProvider>(
          builder: (context, cp, _) {
            return Column(
              children: [
                const SizedBox(height: 24),
                _buildBalanceCard(cp, textColor, hintColor),
                const SizedBox(height: 24),
                _buildTabBar(textColor),
                Expanded(child: _buildTabContent(cp, textColor, hintColor)),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildBalanceCard(CoinsProvider cp, Color textColor, Color hintColor) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: GlassContainer(
        padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 24),
        child: Column(
          children: [
            Text('Solde', style: TextStyle(color: hintColor, fontSize: 14)),
            const SizedBox(height: 8),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.monetization_on_rounded, color: const Color(0xFFFFA000), size: 32),
                const SizedBox(width: 8),
                Text(
                  '${cp.balance}',
                  style: TextStyle(
                    color: textColor,
                    fontSize: 48,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _buildStat(Icons.arrow_upward_rounded, 'Gagnés', '800', Colors.green),
                const SizedBox(width: 32),
                _buildStat(Icons.arrow_downward_rounded, 'Dépensés', '375', Colors.redAccent),
              ],
            ),
          ],
        ),
      ).animate().fade(duration: 500.ms).slideY(begin: 0.1, end: 0),
    );
  }

  Widget _buildStat(IconData icon, String label, String value, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: color, size: 16),
        const SizedBox(width: 4),
        Text(value, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 14)),
        const SizedBox(width: 4),
        Text(label, style: TextStyle(color: Colors.white54, fontSize: 12)),
      ],
    );
  }

  Widget _buildTabBar(Color textColor) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 24),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(14),
      ),
      child: TabBar(
        controller: _tabController,
        indicator: BoxDecoration(
          color: AppColors.violet,
          borderRadius: BorderRadius.circular(14),
        ),
        labelColor: Colors.white,
        unselectedLabelColor: textColor.withValues(alpha: 0.6),
        labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
        tabs: const [
          Tab(text: 'Transactions'),
          Tab(text: 'Récompenses'),
        ],
      ),
    );
  }

  Widget _buildTabContent(CoinsProvider cp, Color textColor, Color hintColor) {
    return TabBarView(
      controller: _tabController,
      children: [
        _buildTransactions(cp, textColor, hintColor),
        _buildRewards(cp, textColor, hintColor),
      ],
    );
  }

  Widget _buildTransactions(CoinsProvider cp, Color textColor, Color hintColor) {
    return ListView.separated(
      padding: const EdgeInsets.all(24),
      itemCount: cp.transactions.length,
      separatorBuilder: (ctx, i) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final t = cp.transactions[index];
        final isGain = t['amount'] > 0;
        return GlassContainer(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Container(
                width: 40, height: 40,
                decoration: BoxDecoration(
                  color: (isGain ? Colors.green : Colors.redAccent).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  isGain ? Icons.add_rounded : Icons.remove_rounded,
                  color: isGain ? Colors.green : Colors.redAccent,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(t['label'], style: TextStyle(color: textColor, fontWeight: FontWeight.w600, fontSize: 14)),
                    Text(t['date'], style: TextStyle(color: hintColor, fontSize: 12)),
                  ],
                ),
              ),
              Text(
                '${isGain ? '+' : ''}${t['amount']}',
                style: TextStyle(
                  color: isGain ? Colors.green : Colors.redAccent,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ],
          ),
        ).animate().fade(duration: 300.ms, delay: (50 * index).ms);
      },
    );
  }

  Widget _buildRewards(CoinsProvider cp, Color textColor, Color hintColor) {
    return ListView.separated(
      padding: const EdgeInsets.all(24),
      itemCount: cp.rewards.length,
      separatorBuilder: (ctx, i) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final r = cp.rewards[index];
        final canAfford = cp.balance >= r['cost'];
        return GlassContainer(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 48, height: 48,
                decoration: BoxDecoration(
                  color: AppColors.violet.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(Icons.card_giftcard_rounded, color: AppColors.violet, size: 24),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(r['label'], style: TextStyle(color: textColor, fontWeight: FontWeight.w700, fontSize: 15)),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.monetization_on_rounded, color: const Color(0xFFFFA000), size: 14),
                        const SizedBox(width: 4),
                        Text('${r['cost']} coins', style: TextStyle(color: const Color(0xFFFFA000), fontWeight: FontWeight.bold, fontSize: 13)),
                      ],
                    ),
                  ],
                ),
              ),
              TextButton(
                onPressed: canAfford ? () {} : null,
                style: TextButton.styleFrom(
                  backgroundColor: canAfford ? AppColors.violet.withValues(alpha: 0.15) : null,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                ),
                child: Text(
                  canAfford ? 'Échanger' : 'Indisponible',
                  style: TextStyle(
                    color: canAfford ? AppColors.violet : hintColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
        ).animate().fade(duration: 300.ms, delay: (50 * index).ms);
      },
    );
  }
}

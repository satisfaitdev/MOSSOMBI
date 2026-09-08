import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:mosombi_frontend/core/providers/backpack_provider.dart';
import 'package:mosombi_frontend/core/models/backpack_item_model.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';

class BackpackScreen extends StatefulWidget {
  const BackpackScreen({super.key});

  @override
  State<BackpackScreen> createState() => _BackpackScreenState();
}

class _BackpackScreenState extends State<BackpackScreen> {
  int _selectedTab = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<BackpackProvider>().fetchItems();
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white.withValues(alpha: 0.5) : AppColors.textSecondaryLight;

    return Scaffold(
      appBar: const MossombiHeaderType3(title: 'Sac à Dos'),
      body: AnimatedGradientBg(
        isDark: isDark,
        child: SafeArea(
          bottom: false,
          child: Consumer<BackpackProvider>(
            builder: (context, bp, _) {
              final categories = bp.allCategories;
              final currentItems = bp.itemsByCategory(categories[_selectedTab]);

              return CustomScrollView(
                physics: const BouncingScrollPhysics(),
                slivers: [
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      child: _buildTabBar(categories, textColor),
                    ),
                  ),
                  if (bp.isLoading && bp.items.isEmpty)
                    const SliverFillRemaining(
                      child: Center(child: CircularProgressIndicator(color: AppColors.violet)),
                    )
                  else if (currentItems.isEmpty)
                    SliverFillRemaining(
                      child: Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.inventory_2_outlined, size: 64, color: hintColor),
                            const SizedBox(height: 16),
                            Text('Aucun objet', style: TextStyle(color: hintColor, fontSize: 18)),
                          ],
                        ),
                      ),
                    )
                  else
                    SliverPadding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      sliver: SliverGrid(
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          mainAxisSpacing: 16,
                          crossAxisSpacing: 16,
                          childAspectRatio: 0.75,
                        ),
                        delegate: SliverChildBuilderDelegate(
                          (context, index) => _buildItemCard(currentItems[index], textColor, hintColor, bp),
                          childCount: currentItems.length,
                        ),
                      ),
                    ),
                  const SliverToBoxAdapter(child: SizedBox(height: 100)),
                ],
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildTabBar(List<String> categories, Color textColor) {
    return SizedBox(
      height: 40,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: categories.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final isSelected = _selectedTab == index;
          return GestureDetector(
            onTap: () => setState(() => _selectedTab = index),
            child: AnimatedContainer(
              duration: 300.ms,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              decoration: BoxDecoration(
                color: isSelected ? AppColors.violet : AppColors.violet.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                categories[index],
                style: TextStyle(
                  color: isSelected ? Colors.white : textColor,
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildItemCard(BackpackItem item, Color textColor, Color hintColor, BackpackProvider bp) {
    final rarityColor = _rarityColor(item.rarity);
    return GlassContainer(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 80,
            width: double.infinity,
            decoration: BoxDecoration(
              color: rarityColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Center(
              child: Icon(
                _categoryIcon(item.category),
                size: 36,
                color: rarityColor,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            item.name,
            style: TextStyle(color: textColor, fontWeight: FontWeight.w700, fontSize: 14),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: rarityColor.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  item.rarityLabel,
                  style: TextStyle(color: rarityColor, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
              const Spacer(),
              if (item.acquiredAt != null)
                Text(
                  '${item.acquiredAt!.day}/${item.acquiredAt!.month}',
                  style: TextStyle(color: hintColor, fontSize: 10),
                ),
            ],
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: TextButton(
              onPressed: () {
                if (item.isEquipped) {
                  bp.unequipItem(item.id);
                } else {
                  bp.equipItem(item.id);
                }
              },
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 6),
                backgroundColor: item.isEquipped ? Colors.green.withValues(alpha: 0.15) : AppColors.violet.withValues(alpha: 0.15),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: Text(
                item.isEquipped ? 'Équipé' : 'Équiper',
                style: TextStyle(
                  color: item.isEquipped ? Colors.green : AppColors.violet,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
    ).animate().fade(duration: 400.ms).slideY(begin: 0.1, end: 0);
  }

  Color _rarityColor(String rarity) {
    switch (rarity) {
      case 'common': return Colors.grey;
      case 'rare': return Colors.blue;
      case 'epic': return AppColors.violet;
      case 'legendary': return const Color(0xFFFF9800);
      default: return Colors.grey;
    }
  }

  IconData _categoryIcon(String category) {
    switch (category) {
      case 'subscription': return Icons.card_membership_rounded;
      case 'badge': return Icons.workspace_premium_rounded;
      case 'reward': return Icons.card_giftcard_rounded;
      case 'item': return Icons.inventory_2_rounded;
      case 'achievement': return Icons.emoji_events_rounded;
      default: return Icons.category_rounded;
    }
  }
}

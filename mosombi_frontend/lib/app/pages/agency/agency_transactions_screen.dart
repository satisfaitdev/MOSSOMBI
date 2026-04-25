import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:mosombi_frontend/core/providers/agency_provider.dart';
import 'package:mosombi_frontend/core/models/agency_sale_model.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:flutter_animate/flutter_animate.dart';

class AgencyTransactionsScreen extends StatefulWidget {
  const AgencyTransactionsScreen({super.key});

  @override
  State<AgencyTransactionsScreen> createState() => _AgencyTransactionsScreenState();
}

class _AgencyTransactionsScreenState extends State<AgencyTransactionsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AgencyProvider>().fetchSales();
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.textPrimaryLight;
    final hintColor = isDark ? Colors.white70 : AppColors.textSecondaryLight;

    return Scaffold(
      body: AnimatedGradientBg(
        isDark: isDark,
        child: Consumer<AgencyProvider>(
          builder: (context, provider, child) {
            return RefreshIndicator(
              color: AppColors.violet,
              onRefresh: () => context.read<AgencyProvider>().fetchSales(),
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                slivers: [
                  const MossombiSliverAppBar(
                    title: 'Transactions',
                  ),
                  if (provider.isLoading && provider.sales.isEmpty)
                    const SliverFillRemaining(
                      child: Center(child: CircularProgressIndicator()),
                    )
                  else if (provider.sales.isEmpty)
                    SliverFillRemaining(
                      child: Center(
                        child: Text('Aucune transaction trouvée.', style: TextStyle(color: hintColor)),
                      ),
                    )
                  else
                    SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final sale = provider.sales[index];
                          return _buildTransactionCard(sale, textColor, hintColor)
                              .animate(delay: (index * 50).ms)
                              .fade()
                              .slideY(begin: 0.2, end: 0);
                        },
                        childCount: provider.sales.length,
                      ),
                    ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildTransactionCard(AgencySale sale, Color textColor, Color hintColor) {
    final dateFormat = DateFormat('dd/MM/yyyy HH:mm');
    final isDelivered = sale.deliveryStatus == 'delivered';

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
      child: GlassContainer(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.coral.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.receipt_long_rounded,
                color: AppColors.coral,
                size: 20,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        sale.serviceId.toUpperCase(),
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: textColor),
                      ),
                      Text(
                        '${sale.amount.toStringAsFixed(0)} ${sale.currency}',
                        style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.coral, fontSize: 15),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Client : ${sale.clientName.isEmpty ? "Inconnu" : sale.clientName}',
                    style: TextStyle(color: hintColor, fontSize: 12),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        dateFormat.format(sale.createdAt),
                        style: TextStyle(color: hintColor.withValues(alpha: 0.7), fontSize: 11),
                      ),
                      Container(
                         padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                         decoration: BoxDecoration(
                            color: isDelivered ? const Color(0xFF00E5C5).withValues(alpha: 0.15) : const Color(0xFFFF9800).withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(12),
                         ),
                         child: Text(
                             isDelivered ? 'Livré' : 'En attente',
                             style: TextStyle(
                               color: isDelivered ? const Color(0xFF00E5C5) : const Color(0xFFFF9800), 
                               fontSize: 11, 
                               fontWeight: FontWeight.bold
                             ),
                         ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:mosombi_frontend/core/providers/wallet_provider.dart';
import 'package:intl/intl.dart';

class FintechScreen extends StatelessWidget {
  const FintechScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white.withValues(alpha: 0.5) : AppColors.textSecondaryLight;

    return Consumer<WalletProvider>(
      builder: (context, wallet, child) {
        return Scaffold(
          body: AnimatedGradientBg(
            isDark: isDark,
            child: RefreshIndicator(
              color: AppColors.violet,
              onRefresh: () => context.read<WalletProvider>().fetchWalletData(),
              child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
          slivers: [
            MossombiSliverAppBar(
              title: 'Mon Portefeuille',
              actionIcon: const Icon(Icons.qr_code_scanner_rounded, color: Color(0xFF00E5C5), size: 18),
              onActionTap: () => context.push('/fintech/qr'),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.only(bottom: 40),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 1. Wallet Balance Header
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Solde principal', style: TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.bold)),
                          Text('${wallet.balance.toStringAsFixed(0)} FCFA', style: TextStyle(color: textColor, fontSize: 36, fontWeight: FontWeight.w900, letterSpacing: -1)),
                        ],
                      ).animate().fade().slideY(begin: 0.2, end: 0, duration: 600.ms),
                    ),
                    const SizedBox(height: 24),

                    // 2. Action Grid (Simplifiée)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _buildActionBtn('Envoyer', Icons.arrow_upward_rounded, const Color(0xFFFF6584), textColor, onTap: () => context.push('/fintech/transfer')),
                          _buildActionBtn('Services', Icons.grid_view_rounded, const Color(0xFF6C4EF6), textColor, onTap: () => context.push('/fintech/services')),
                          _buildActionBtn('Factures', Icons.receipt_long_rounded, const Color(0xFF4CAF50), textColor, onTap: () => context.push('/fintech/bills')),
                          _buildActionBtn('Épargne', Icons.savings_rounded, const Color(0xFFFFA000), textColor, onTap: () => context.push('/fintech/savings')),
                        ].animate(interval: 100.ms, delay: 200.ms).fade().slideY(begin: 0.2, end: 0),
                      ),
                    ),
                    const SizedBox(height: 48),

                    // 3. Virtual Visa Card Section
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Mes Cartes Virtuelles', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.w900)),
                          GestureDetector(
                            onTap: () => context.push('/fintech/cards'),
                            child: const Icon(Icons.arrow_forward_ios_rounded, color: Color(0xFF6C4EF6), size: 18),
                          ),
                        ],
                      ).animate().fade(delay: 400.ms),
                    ),
                    const SizedBox(height: 16),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      child: Container(
                        height: 220,
                        width: double.infinity,
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(24),
                          gradient: const LinearGradient(
                            colors: [Color(0xFF1E1E2C), Color(0xFF2D2D44)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          boxShadow: [
                            BoxShadow(color: Colors.black.withValues(alpha: 0.3), blurRadius: 20, offset: const Offset(0, 10)),
                            BoxShadow(color: const Color(0xFF6C4EF6).withValues(alpha: 0.15), blurRadius: 30, spreadRadius: -5),
                          ],
                          border: Border.all(color: Colors.white.withValues(alpha: 0.1), width: 1.5),
                        ),
                        child: Stack(
                          children: [
                            // Sim Card Chip
                            Positioned(
                              top: 0,
                              right: 0,
                              child: Row(
                                children: [
                                  Icon(Icons.wifi_rounded, color: Colors.white.withValues(alpha: 0.5), size: 24),
                                  const SizedBox(width: 8),
                                  const Text('VISA', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic)),
                                ],
                              ),
                            ),
                            
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      width: 40,
                                      height: 28,
                                      decoration: BoxDecoration(
                                        color: Colors.amber.shade200,
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    const Text('Mossombi Virtual', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1)),
                                  ],
                                ),
                                const Spacer(),
                                const Text('Solde de la carte', style: TextStyle(color: Colors.white70, fontSize: 12)),
                                const SizedBox(height: 4),
                                const Text('40 000 FCFA', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900)),
                                const SizedBox(height: 16),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text('**** **** **** 4092', style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 16, letterSpacing: 2, fontFamily: 'Courier')),
                                    const Text('12/28', style: TextStyle(color: Colors.white70, fontSize: 14)),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                      ).animate().scale(curve: Curves.easeOutBack, duration: 600.ms, delay: 400.ms),
                    ),

                    const SizedBox(height: 40),

                    // 3. Transactions Section
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Transactions Récentes', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.w900)),
                          Text('Voir tout', style: TextStyle(color: const Color(0xFF00E5C5), fontSize: 14, fontWeight: FontWeight.bold)),
                        ],
                      ).animate().fade(delay: 600.ms),
                    ),

                    const SizedBox(height: 16),

                    // Transaction List
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Column(
                        children: wallet.transactions.map((tx) {
                          Color color;
                          IconData icon;
                          switch (tx.type) {
                            case TransactionType.topup:
                              color = const Color(0xFF00E5C5);
                              icon = Icons.account_balance_wallet_rounded;
                              break;
                            case TransactionType.ridePayment:
                              color = const Color(0xFF6C4EF6);
                              icon = Icons.directions_car_rounded;
                              break;
                            case TransactionType.marketplacePayment:
                              color = const Color(0xFFFF9800);
                              icon = Icons.shopping_cart_rounded;
                              break;
                            default:
                              color = const Color(0xFFFF6584);
                              icon = Icons.swap_horiz_rounded;
                          }
                          final sign = tx.isCredit ? '+' : '-';
                          final subtitle = DateFormat('dd MMM yyyy, HH:mm').format(tx.date);
                          
                          return _buildTransactionLine(tx.title, subtitle, '$sign ${tx.amount.toStringAsFixed(0)} F', icon, color, textColor, hintColor);
                        }).toList().animate(interval: 100.ms, delay: 700.ms).fade().slideX(begin: 0.1, end: 0),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
              ),
            ),
          );
      },
    );
  }

  Widget _buildActionBtn(String label, IconData icon, Color color, Color textColor, {VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Column(
        children: [
        Container(
          width: 65,
          height: 65,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: color.withValues(alpha: 0.3)),
          ),
          child: Icon(icon, color: color, size: 28),
        ),
        const SizedBox(height: 8),
        Text(label, style: TextStyle(color: textColor, fontWeight: FontWeight.w700, fontSize: 12)),
      ],
      ),
    );
  }

  Widget _buildTransactionLine(String title, String subtitle, String amount, IconData icon, Color color, Color textColor, Color hintColor) {
    final isPositive = amount.startsWith('+');
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: GlassContainer(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 15)),
                  const SizedBox(height: 4),
                  Text(subtitle, style: TextStyle(color: hintColor, fontSize: 12)),
                ],
              ),
            ),
            Text(amount, style: TextStyle(
              color: isPositive ? const Color(0xFF00E5C5) : textColor,
              fontWeight: FontWeight.w900,
              fontSize: 15,
            )),
          ],
        ),
      ),
    );
  }
}

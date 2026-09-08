import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/theme/app_gradients.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/wallet_card.dart';
import 'package:mosombi_frontend/core/widgets/promo_banner.dart';
import 'package:mosombi_frontend/core/widgets/active_ride_banner.dart';
import 'package:mosombi_frontend/app/pages/orders/orders_screen.dart';
import 'package:mosombi_frontend/app/pages/profile/profile_screen.dart';
import 'package:mosombi_frontend/app/pages/notifications/notification_screen.dart';
import 'package:mosombi_frontend/app/pages/ai_assistant/ai_assistant_screen.dart';
import 'package:mosombi_frontend/core/widgets/mossombi_bottom_nav.dart';
import 'package:mosombi_frontend/core/providers/notification_provider.dart';
import 'package:mosombi_frontend/core/providers/wallet_provider.dart';
import 'package:mosombi_frontend/core/providers/agency_provider.dart';
import 'package:mosombi_frontend/core/providers/product_provider.dart';
import 'package:provider/provider.dart';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mosombi_frontend/core/providers/auth_provider.dart';
import 'dart:convert';

class HomeScreen extends ConsumerStatefulWidget {
  final int initialTab;
  const HomeScreen({super.key, this.initialTab = 0});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> with TickerProviderStateMixin {
  int _navIndex = 0;
  bool _showBottomNav = true;
  late final ScrollController _scrollController;

  final GlobalKey _walletKey = GlobalKey();
  final List<GlobalKey> _serviceKeys = List.generate(8, (_) => GlobalKey());

  AppTransaction? _animatingTx;
  Offset? _startOffset;
  Offset? _endOffset;
  late AnimationController _animCtrl;
  late Animation<double> _animFloat;
  late Animation<double> _animScale;

  static const List<_ServiceItem> _services = [
    _ServiceItem(icon: Icons.store_mall_directory_rounded, label: 'Marketplace', gradient: [Color(0xFF6C4EF6), Color(0xFF9B77FF)]),
    _ServiceItem(icon: Icons.directions_car_rounded, label: 'Transport', gradient: [Color(0xFFFF6584), Color(0xFFFF8FA3)]),
    _ServiceItem(icon: Icons.restaurant_rounded, label: 'Food', gradient: [Color(0xFFFF9800), Color(0xFFFFB74D)]),
    _ServiceItem(icon: Icons.confirmation_number_rounded, label: 'Billetterie', gradient: [Color(0xFF00D4FF), Color(0xFF00E5C5)]),
    _ServiceItem(icon: Icons.location_city_rounded, label: 'Smart City', gradient: [Color(0xFF4CAF50), Color(0xFF81C784)]),
    _ServiceItem(icon: Icons.dashboard_customize_rounded, label: 'Services Digitaux', gradient: [Color(0xFFE91E63), Color(0xFFF48FB1)]),
    _ServiceItem(icon: Icons.monetization_on_rounded, label: 'Coins', gradient: [Color(0xFFFFA000), Color(0xFFFFD54F)]),
    _ServiceItem(icon: Icons.flight_takeoff_rounded, label: 'Voyage', gradient: [Color(0xFFF44336), Color(0xFFEF9A9A)]),
  ];

  @override
  void initState() {
    super.initState();
    _navIndex = widget.initialTab;
    _animCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1500));
    _animFloat = CurvedAnimation(parent: _animCtrl, curve: Curves.easeInOut);
    _animScale = Tween<double>(begin: 1.0, end: 0.1).animate(
      CurvedAnimation(parent: _animCtrl, curve: const Interval(0.6, 1.0, curve: Curves.easeIn)),
    );

    WidgetsBinding.instance.addPostFrameCallback((_) {
      // Refresh wallet balance from API
      context.read<WalletProvider>().fetchWalletData();
    });
  }

  @override
  void didUpdateWidget(covariant HomeScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialTab != oldWidget.initialTab) {
      setState(() {
        _navIndex = widget.initialTab;
      });
    }
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    super.dispose();
  }

  void _triggerFlowAnimation(AppTransaction tx) {
    if (!mounted) return;
    final RenderBox? walletBox = _walletKey.currentContext?.findRenderObject() as RenderBox?;
    if (walletBox == null) return;

    _startOffset = walletBox.localToGlobal(walletBox.size.center(Offset.zero));

    int targetIndex = 3; // Par defaut vers Fintech
    switch (tx.type) {
      case TransactionType.ridePayment: targetIndex = 1; break;
      case TransactionType.marketplacePayment: targetIndex = 0; break;
      case TransactionType.topup: targetIndex = -1; break; // specific logic: float up
      case TransactionType.billPayment: targetIndex = 3; break;
      case TransactionType.servicePayment: targetIndex = 3; break;
      case TransactionType.withdrawal: targetIndex = 3; break;
      case TransactionType.transfer: targetIndex = 3; break;
      default: targetIndex = 3;
    }

    if (targetIndex != -1) {
      final RenderBox? sBox = _serviceKeys[targetIndex].currentContext?.findRenderObject() as RenderBox?;
      if (sBox != null) {
        _endOffset = sBox.localToGlobal(sBox.size.center(Offset.zero));
      } else {
        _endOffset = _startOffset! + const Offset(0, 300);
      }
    } else {
      // Topup: flotte vers le haut
      _endOffset = _startOffset! - const Offset(0, 200);
    }

    setState(() => _animatingTx = tx);
    _animCtrl.forward(from: 0).then((_) {
      if (mounted) setState(() => _animatingTx = null);
    });
  }

  @override
  Widget build(BuildContext context) {
    final wallet = context.watch<WalletProvider>();
    if (wallet.latestUnanimatedTx != null && _animatingTx == null) {
      final tx = wallet.latestUnanimatedTx!;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        wallet.markTransactionAsAnimated();
        _triggerFlowAnimation(tx);
      });
    }

    final authState = ref.watch(authProvider);
    final user = authState.user;
    final String displayName = user?.fullName ?? user?.userIdDisplay ?? 'Utilisateur';

    Widget avatarWidget = const Icon(Icons.person, color: Colors.white, size: 28);
    if (user != null && user.avatarUrl != null && user.avatarUrl!.isNotEmpty) {
      if (user.avatarUrl!.startsWith('data:image')) {
        try {
          final parts = user.avatarUrl!.split(',');
          if (parts.length > 1) {
            avatarWidget = ClipOval(child: Image.memory(base64Decode(parts[1]), fit: BoxFit.cover, width: 52, height: 52));
          }
        } catch (_) {}
      } else {
        avatarWidget = ClipOval(child: Image.network(user.avatarUrl!, fit: BoxFit.cover, width: 52, height: 52));
      }
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white.withValues(alpha: 0.5) : AppColors.bgDark1.withValues(alpha: 0.5);

    return Scaffold(
      extendBody: true,
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          // === MAIN CONTENT ===
          AnimatedGradientBg(
            isDark: isDark,
            child: NotificationListener<UserScrollNotification>(
              onNotification: (notification) {
                if (notification.direction == ScrollDirection.reverse) {
                  if (_showBottomNav) setState(() => _showBottomNav = false);
                } else if (notification.direction == ScrollDirection.forward) {
                  if (!_showBottomNav) setState(() => _showBottomNav = true);
                }
                return false;
              },
              child: IndexedStack(
                index: _navIndex,
                children: [
                  // Tab 0: Home Page
                  RefreshIndicator(
                    color: AppColors.violet,
                    onRefresh: () async {
                      await Future.wait([
                        context.read<WalletProvider>().fetchWalletData(),
                        context.read<AgencyProvider>().checkMyAgencyContext(),
                        context.read<ProductProvider>().fetchProducts(),
                      ]);
                    },
                    child: CustomScrollView(
                      physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                      slivers: [
                    // Animated collapsible app bar
                    SliverAppBar(
                      expandedHeight: 156,
                      floating: false,
                      pinned: false,
                      backgroundColor: Colors.transparent,
                      elevation: 0,
                      systemOverlayStyle: SystemUiOverlayStyle(
                        statusBarColor: Colors.transparent,
                        statusBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
                        statusBarBrightness: isDark ? Brightness.dark : Brightness.light,
                      ),
                      flexibleSpace: FlexibleSpaceBar(
                        background: Container(
                          color: Colors.transparent,
                          child: SafeArea(
                            bottom: false,
                            child: Padding(
                              padding: const EdgeInsets.fromLTRB(24, 4, 24, 10),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisAlignment: MainAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text('Bienvenue 👋',
                                              style: TextStyle(color: hintColor, fontSize: 14)),
                                          const SizedBox(height: 4),
                                          ShaderMask(
                                            shaderCallback: (b) => AppGradients.primary.createShader(b),
                                            child: Text(displayName.split(' ').first,
                                                style: TextStyle(
                                                  color: textColor,
                                                  fontSize: 28,
                                                  fontWeight: FontWeight.w800,
                                                )),
                                          ),
                                        ],
                                      ),
                                      // Avatar
                                      Container(
                                        width: 52,
                                        height: 52,
                                        decoration: BoxDecoration(
                                          gradient: AppGradients.primary,
                                          shape: BoxShape.circle,
                                          boxShadow: [
                                            BoxShadow(color: AppColors.violet.withValues(alpha: 0.4), blurRadius: 12)
                                          ],
                                        ),
                                        child: avatarWidget,
                                      )
                                    ],
                                  ),
                                  const SizedBox(height: 20),
                                  // Search bar
                                  GestureDetector(
                                    onTap: () {
                                      context.push('/search');
                                    },
                                    behavior: HitTestBehavior.opaque,
                                    child: GlassContainer(
                                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                      child: Row(
                                        children: [
                                          Icon(Icons.search, color: hintColor),
                                          const SizedBox(width: 10),
                                          Text('Rechercher un service...', style: TextStyle(color: hintColor, fontSize: 15)),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),

                    SliverPadding(
                      padding: const EdgeInsets.all(20),
                      sliver: SliverList(
                        delegate: SliverChildListDelegate([
                          Container(
                            key: _walletKey,
                            child: WalletCard(isDark: isDark)
                                .animate().fade(duration: 500.ms).slideY(begin: 0.1, end: 0),
                          ),
                          const SizedBox(height: 28),

                          // Banner Pub
                          const PromoBanner()
                              .animate(delay: 200.ms).fade().slideX(begin: 0.1, end: 0),
                          const SizedBox(height: 28),

                          // Section title
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Services', style: TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w800,
                                color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                              )),
                              TextButton(
                                onPressed: () {},
                                child: const Text('Voir tout', style: TextStyle(color: AppColors.violet)),
                              ),
                            ],
                          ).animate(delay: 100.ms).fade().slideX(begin: -0.1, end: 0),

                          const SizedBox(height: 4),

                          // Services grid
                          GridView.builder(
                            shrinkWrap: true,
                            padding: EdgeInsets.zero,
                            physics: const NeverScrollableScrollPhysics(),
                            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 4,
                              childAspectRatio: 0.85,
                              mainAxisSpacing: 16,
                              crossAxisSpacing: 12,
                            ),
                            itemCount: _services.length,
                            itemBuilder: (context, i) {
                              final s = _services[i];
                              return Container(
                                key: _serviceKeys[i],
                                child: _ServiceCard(service: s, index: i),
                              );
                            },
                          ),

                          const SizedBox(height: 28),

                          // Featured banner
                          Text('À la une', style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                          )).animate(delay: 300.ms).fade(),

                          const SizedBox(height: 16),

                          // Banner card
                          _FeaturedBanner(isDark: isDark)
                              .animate(delay: 350.ms).fade(duration: 500.ms).slideY(begin: 0.2, end: 0),

                          const SizedBox(height: 28),

                          _buildHorizontalList('Populaire (Market & Food)', const [
                            _HorizontalItem('Iphone 15 Pro Max', 'Marketplace', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=800', '850 000 F'),
                            _HorizontalItem('Burger Double Cheese', 'Food', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800', '4 500 F'),
                            _HorizontalItem('Robe d\'été Fleurie', 'Marketplace', 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=800', '15 000 F'),
                            _HorizontalItem('Pizza Royal', 'Food', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800', '7 000 F'),
                          ], isDark).animate(delay: 400.ms).fade().slideX(begin: 0.1, end: 0),

                          const SizedBox(height: 24),

                          _buildHorizontalList('Tendance (Tickets & Gaming)', const [
                            _HorizontalItem('Concert Fally Ipupa', 'Tickets', 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=800', '25 000 F'),
                            _HorizontalItem('Manette PS5', 'Gaming', 'https://images.unsplash.com/photo-1606144042894-011bc9ed1c64?auto=format&fit=crop&q=80&w=800', '45 000 F'),
                            _HorizontalItem('Léopards vs Maroc', 'Tickets', 'https://images.unsplash.com/photo-1508344928928-71bf7b6e2de5?auto=format&fit=crop&q=80&w=800', '10 000 F'),
                            _HorizontalItem('EA FC 24 PS5', 'Gaming', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800', '35 000 F'),
                          ], isDark).animate(delay: 450.ms).fade().slideX(begin: 0.1, end: 0),

                          const SizedBox(height: 100), // space for nav bar
                        ]),
                      ),
                    ),
                  ],
                ),
              ),
              // Tab 1: Commandes
                const OrdersScreen(),
                // Tab 2: Alertes (Notifications)
                const NotificationScreen(),
                // Tab 3: Profil
                const ProfileScreen(),
              ],
            ),
          ),
          ),

          // === ACTIVE RIDE BANNER OVERLAY ===
          // Appears automatically on top of any tab when a taxi is active
          const ActiveRideBanner(),

          // === TRANSACTION FLOW OVERLAY ===
          if (_animatingTx != null && _startOffset != null && _endOffset != null)
            AnimatedBuilder(
              animation: _animCtrl,
              builder: (context, child) {
                final val = _animFloat.value;
                final currentOffset = Offset.lerp(_startOffset, _endOffset, val)!;
                final scale = _animScale.value;
                final isCredit = _animatingTx!.isCredit;
                
                return Positioned(
                  left: currentOffset.dx - 80, // Centre approximatif
                  top: currentOffset.dy - 20, 
                  child: Transform.scale(
                    scale: scale,
                    child: Opacity(
                      opacity: 1.0 - (val > 0.8 ? (val - 0.8) * 5 : 0),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: isCredit ? Colors.green.withValues(alpha: 0.2) : Colors.red.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: isCredit ? Colors.green : Colors.red, width: 2),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(isCredit ? Icons.add_circle : Icons.remove_circle, color: isCredit ? Colors.green : Colors.red, size: 24),
                            const SizedBox(width: 8),
                            Text(
                              '${_animatingTx!.amount.toStringAsFixed(0)} F',
                              style: TextStyle(
                                color: isCredit ? Colors.green : Colors.red,
                                fontWeight: FontWeight.w900,
                                fontSize: 18,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
        ],
      ),
      // Animated bottom nav
      bottomNavigationBar: AnimatedSlide(
        duration: const Duration(milliseconds: 300),
        offset: _showBottomNav ? Offset.zero : const Offset(0, 1.5),
        child: MossombiBottomNav(
          currentIndex: _navIndex,
          onTap: (i) => setState(() => _navIndex = i),
          isDark: isDark,
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => AiAssistantScreen.showAsBottomSheet(context),
        backgroundColor: const Color(0xFF9C27B0),
        child: const Icon(Icons.auto_awesome_rounded, color: Colors.white),
      )
          .animate(delay: 600.ms)
          .scale(begin: const Offset(0, 0), duration: 500.ms, curve: Curves.elasticOut),
    );
  }

  Widget _buildHorizontalList(String title, List<_HorizontalItem> items, bool isDark) {
    final textColor = isDark ? Colors.white : AppColors.bgDark1;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.w800)),
              const Text('Voir tout', style: TextStyle(color: Color(0xFF6C4EF6), fontSize: 13, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 180,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: items.length,
            itemBuilder: (ctx, i) {
              final item = items[i];
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: SizedBox(
                  width: 140,
                  child: GlassContainer(
                    padding: EdgeInsets.zero,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          flex: 3,
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              ClipRRect(
                                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                                child: Image.network(
                                  item.imageUrl,
                                  fit: BoxFit.cover,
                                  errorBuilder: (c, e, s) => Container(color: Colors.grey[300], child: const Icon(Icons.image)),
                                ),
                              ),
                              Positioned(
                                top: 8,
                                left: 8,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: Colors.black.withValues(alpha: 0.7),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(item.category, style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Expanded(
                          flex: 2,
                          child: Padding(
                            padding: const EdgeInsets.all(10),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(item.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: textColor, fontWeight: FontWeight.w800, fontSize: 12)),
                                const SizedBox(height: 4),
                                Text(item.price, style: const TextStyle(color: Color(0xFF00E5C5), fontWeight: FontWeight.bold, fontSize: 12)),
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
          ),
        ),
      ],
    );
  }
}

class _ServiceItem {
  final IconData icon;
  final String label;
  final List<Color> gradient;
  const _ServiceItem({required this.icon, required this.label, required this.gradient});
}

class _ServiceCard extends StatelessWidget {
  final _ServiceItem service;
  final int index;

  const _ServiceCard({required this.service, required this.index});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        if (service.label == 'Marketplace') {
          context.push('/marketplace');
        } else if (service.label == 'Transport') {
          context.push('/transport');
        } else if (service.label == 'Food') {
          context.push('/food');
        } else if (service.label == 'Billetterie') {
          context.push('/ticketing');
        } else if (service.label == 'Smart City') {
          context.push('/smart-city');
        } else if (service.label == 'Services Digitaux') {
          context.push('/digital-services');
        } else if (service.label == 'Coins') {
          context.push('/coins');
        } else if (service.label == 'Voyage') {
          context.push('/travel');
        }
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 58,
            height: 58,
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: service.gradient),
              borderRadius: BorderRadius.circular(18),
              boxShadow: [
                BoxShadow(
                  color: service.gradient.first.withValues(alpha: 0.35),
                  blurRadius: 12,
                  offset: const Offset(0, 5),
                )
              ],
            ),
            child: Icon(service.icon, color: Colors.white, size: 28),
          )
              .animate(delay: (100 + index * 60).ms)
              .scale(begin: const Offset(0.5, 0.5), duration: 400.ms, curve: Curves.elasticOut)
              .fade(),
          const SizedBox(height: 8),
          Text(service.label,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center),
        ],
      ),
    );
  }
}

class _FeaturedBanner extends StatelessWidget {
  final bool isDark;
  const _FeaturedBanner({required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 160,
      decoration: BoxDecoration(
        gradient: AppGradients.primary,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.violet.withValues(alpha: 0.4),
            blurRadius: 20,
            offset: const Offset(0, 8),
          )
        ],
      ),
      padding: const EdgeInsets.all(24),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                Text('Offre Premium', style: TextStyle(color: Colors.white70, fontSize: 13)),
                SizedBox(height: 4),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text('50% de réduction\nsur le transport',
                      style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800, height: 1.1)),
                ),
                SizedBox(height: 6),
                Text('Profiter →', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
          const Icon(Icons.local_offer_rounded, color: Colors.white54, size: 80),
        ],
      ),
    );
  }
}

class _HorizontalItem {
  final String title;
  final String category;
  final String imageUrl;
  final String price;
  const _HorizontalItem(this.title, this.category, this.imageUrl, this.price);
}

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:mosombi_frontend/core/widgets/custom_loader.dart';
import 'package:mosombi_frontend/core/widgets/empty_state.dart';
import 'package:mosombi_frontend/core/network/api_client.dart';

class RestaurantOrder {
  final String id;
  final String status;
  final List<dynamic> items;
  final double total_amount;
  final String currency;
  final String notes;
  final String created_at;

  RestaurantOrder({
    required this.id,
    required this.status,
    required this.items,
    required this.total_amount,
    this.currency = 'XAF',
    this.notes = '',
    required this.created_at,
  });

  factory RestaurantOrder.fromJson(Map<String, dynamic> json) {
    return RestaurantOrder(
      id: json['id']?.toString() ?? '',
      status: json['status']?.toString() ?? 'pending',
      items: json['items'] is List ? json['items'] as List : [],
      total_amount: (json['total_amount'] as num?)?.toDouble() ?? 0,
      currency: json['currency']?.toString() ?? 'XAF',
      notes: json['notes']?.toString() ?? '',
      created_at: json['created_at']?.toString() ?? '',
    );
  }

  String get statusLabel {
    switch (status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmée';
      case 'preparing': return 'En préparation';
      case 'ready': return 'Prête';
      case 'delivered': return 'Livrée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  }

  Color get statusColor {
    switch (status) {
      case 'pending': return Colors.orange;
      case 'confirmed': return Colors.blue;
      case 'preparing': return AppColors.violet;
      case 'ready': return Colors.green;
      case 'delivered': return Colors.grey;
      case 'cancelled': return Colors.redAccent;
      default: return Colors.grey;
    }
  }
}

class RestaurantOrdersScreen extends StatefulWidget {
  const RestaurantOrdersScreen({super.key});

  @override
  State<RestaurantOrdersScreen> createState() => _RestaurantOrdersScreenState();
}

class _RestaurantOrdersScreenState extends State<RestaurantOrdersScreen> {
  final ApiClient _apiClient = ApiClient();
  List<RestaurantOrder> _orders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchOrders();
  }

  Future<void> _fetchOrders() async {
    setState(() => _isLoading = true);
    try {
      final response = await _apiClient.dio.get('/food/orders');
      if (response.statusCode == 200) {
        final List data = response.data['data'] ?? [];
        setState(() => _orders = data.map((e) => RestaurantOrder.fromJson(e as Map<String, dynamic>)).toList());
      }
    } catch (e) {
      debugPrint('RestaurantOrdersScreen error: $e');
    }
    setState(() => _isLoading = false);
  }

  Future<void> _updateStatus(String orderId, String newStatus) async {
    try {
      await _apiClient.dio.patch('/food/orders/$orderId/status', data: {'status': newStatus});
      await _fetchOrders();
    } catch (e) {
      debugPrint('Update status error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e'), backgroundColor: Colors.redAccent, behavior: SnackBarBehavior.floating),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white.withValues(alpha: 0.5) : AppColors.textSecondaryLight;

    return DefaultTabController(
      length: 4,
      child: Scaffold(
        extendBodyBehindAppBar: true,
        backgroundColor: Colors.transparent,
        body: AnimatedGradientBg(
          isDark: isDark,
          child: NestedScrollView(
            headerSliverBuilder: (_, __) => [
              MossombiSliverAppBar(
                title: 'Commandes Restaurant',
                expandedHeight: 160,
                background: TabBar(
                  indicatorColor: const Color(0xFFFF9800),
                  indicatorWeight: 3,
                  labelColor: const Color(0xFFFF9800),
                  unselectedLabelColor: hintColor,
                  labelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12),
                  tabs: const [
                    Tab(text: 'Toutes'),
                    Tab(text: 'En attente'),
                    Tab(text: 'En cours'),
                    Tab(text: 'Prêtes'),
                  ],
                ),
              ),
            ],
            body: TabBarView(
              children: [
                _buildOrdersList('all', textColor, hintColor),
                _buildOrdersList('pending', textColor, hintColor),
                _buildOrdersList('confirmed,preparing', textColor, hintColor),
                _buildOrdersList('ready', textColor, hintColor),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildOrdersList(String filter, Color textColor, Color hintColor) {
    if (_isLoading) return const Center(child: MosombiLoader());

    final statuses = filter.split(',');
    final filtered = _orders.where((o) => statuses.contains(o.status) || filter == 'all').toList();

    if (filtered.isEmpty) {
      return const MosombiEmptyState(
        title: 'Aucune commande',
        message: 'Vous n\'avez pas encore reçu de commandes',
        icon: Icons.receipt_long_outlined,
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchOrders,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        physics: const BouncingScrollPhysics(),
        itemCount: filtered.length,
        itemBuilder: (_, i) {
          final order = filtered[i];
          return _buildOrderCard(order, textColor, hintColor, isDark).animate().fade(delay: (i * 80).ms).slideY(begin: 0.1, end: 0);
        },
      ),
    );
  }

  bool get isDark => Theme.of(context).brightness == Brightness.dark;

  Widget _buildOrderCard(RestaurantOrder order, Color textColor, Color hintColor, bool isDark) {
    final itemsList = order.items.map((i) => '${i['quantity']}× ${i['name']}').join(', ');

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      color: isDark ? AppColors.cardDark.withValues(alpha: 0.8) : AppColors.cardLight,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Commande #${order.id.substring(0, 8)}', style: TextStyle(color: textColor, fontWeight: FontWeight.w900, fontSize: 15)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: order.statusColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(order.statusLabel, style: TextStyle(color: order.statusColor, fontWeight: FontWeight.w700, fontSize: 12)),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(itemsList, style: TextStyle(color: hintColor, fontSize: 13), maxLines: 2, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(Icons.access_time_rounded, size: 14, color: Colors.grey),
                const SizedBox(width: 4),
                Text(_formatDate(order.created_at), style: TextStyle(color: hintColor, fontSize: 12)),
                const Spacer(),
                Text('${order.total_amount.toInt()} F', style: TextStyle(color: const Color(0xFFFF9800), fontWeight: FontWeight.w900, fontSize: 16)),
              ],
            ),
            if (order.status != 'cancelled' && order.status != 'delivered') ...[
              const SizedBox(height: 12),
              Divider(color: hintColor.withValues(alpha: 0.2)),
              const SizedBox(height: 4),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: _buildStatusActions(order),
              ),
            ],
          ],
        ),
      ),
    );
  }

  List<Widget> _buildStatusActions(RestaurantOrder order) {
    switch (order.status) {
      case 'pending':
        return [
          _smallButton('Confirmer', Colors.green, () => _updateStatus(order.id, 'confirmed')),
          const SizedBox(width: 8),
          _smallButton('Annuler', Colors.redAccent, () => _updateStatus(order.id, 'cancelled')),
        ];
      case 'confirmed':
        return [
          _smallButton('En préparation', AppColors.violet, () => _updateStatus(order.id, 'preparing')),
        ];
      case 'preparing':
        return [
          _smallButton('Prête', Colors.green, () => _updateStatus(order.id, 'ready')),
        ];
      case 'ready':
        return [
          _smallButton('Livrée', Colors.green, () => _updateStatus(order.id, 'delivered')),
        ];
      default:
        return [];
    }
  }

  Widget _smallButton(String label, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 12)),
      ),
    );
  }

  String _formatDate(String isoDate) {
    try {
      final dt = DateTime.parse(isoDate);
      final now = DateTime.now();
      final diff = now.difference(dt);
      if (diff.inMinutes < 60) return 'Il y a ${diff.inMinutes} min';
      if (diff.inHours < 24) return 'Il y a ${diff.inHours}h';
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (_) {
      return isoDate;
    }
  }
}

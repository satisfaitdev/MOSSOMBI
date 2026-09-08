import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_gradients.dart';
import '../../../core/widgets/animated_gradient_bg.dart';
import '../../../core/widgets/glass_container.dart';
import '../../../core/widgets/custom_app_bars.dart';
import '../../../core/widgets/custom_button.dart';

class Event {
  final String id;
  final String title;
  final String category;
  final String date;
  final String location;
  final double price;
  final String image;
  final String description;

  const Event({
    required this.id,
    required this.title,
    required this.category,
    required this.date,
    required this.location,
    required this.price,
    required this.image,
    required this.description,
  });
}

class TicketingScreen extends StatefulWidget {
  const TicketingScreen({super.key});

  @override
  State<TicketingScreen> createState() => _TicketingScreenState();
}

class _TicketingScreenState extends State<TicketingScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedCategory = 'Tous';
  String _searchQuery = '';

  final List<String> _categories = ['Tous', 'Concerts', 'Sports', 'Festivals', 'Cinéma', 'Théâtre'];

  final List<Event> _events = const [
    Event(
      id: '1',
      title: 'Fally Ipupa en Concert Live',
      category: 'Concerts',
      date: 'Sam, 25 Juil • 19:00',
      location: 'Stade Alphonse Massamba-Débat, Brazzaville',
      price: 10000,
      image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=600&auto=format&fit=crop',
      description: 'Retrouvez la superstar de la rumba congolaise Fally Ipupa pour un concert exceptionnel et unique à Brazzaville. Une soirée rythmée par ses plus grands succès.',
    ),
    Event(
      id: '2',
      title: 'Derby Congolais: CARA vs Diables Noirs',
      category: 'Sports',
      date: 'Dim, 12 Juil • 15:30',
      location: 'Stade Municipal de Kintélé, Brazzaville',
      price: 2000,
      image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop',
      description: 'Le choc au sommet du championnat national. Ne manquez pas l\'affrontement mythique entre le CARA et les Diables Noirs dans une ambiance survoltée.',
    ),
    Event(
      id: '3',
      title: 'Festival International de la Rumba (FIRA)',
      category: 'Festivals',
      date: '18-20 Aoû • 14:00 - 23:00',
      location: 'Palais des Congrès, Brazzaville',
      price: 5000,
      image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop',
      description: 'Célébrez la richesse de la rumba congolaise, inscrite au patrimoine immatériel de l\'UNESCO, avec des artistes venus de toute l\'Afrique centrale.',
    ),
    Event(
      id: '4',
      title: 'Congo Fashion Week 2026',
      category: 'Festivals',
      date: 'Ven, 04 Sep • 18:00',
      location: 'Grand Hôtel de Kintélé, Brazzaville',
      price: 15000,
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=600&auto=format&fit=crop',
      description: 'Découvrez les dernières tendances de la mode congolaise et internationale à travers des défilés spectaculaires présentés par des créateurs de renom.',
    ),
    Event(
      id: '5',
      title: 'Cinéma en Plein Air: Les Héros du Congo',
      category: 'Cinéma',
      date: 'Mer, 08 Juil • 19:30',
      location: 'Mairie Centrale de Pointe-Noire',
      price: 1500,
      image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop',
      description: 'Une projection en plein air du documentaire historique retraçant la vie des pères de l\'indépendance du Congo. Pop-corn et rafraîchissements sur place.',
    ),
    Event(
      id: '6',
      title: 'Pièce de Théâtre: Le Cri de la Forêt',
      category: 'Théâtre',
      date: 'Sam, 15 Aoû • 18:00',
      location: 'Institut Français du Congo (IFC), Brazzaville',
      price: 3000,
      image: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=600&auto=format&fit=crop',
      description: 'Une comédie dramatique captivante sur la préservation du bassin du Congo. Présentée par la troupe théâtrale nationale.',
    ),
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<Event> get _filteredEvents {
    return _events.where((event) {
      final matchesCategory = _selectedCategory == 'Tous' || event.category == _selectedCategory;
      final matchesSearch = event.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          event.location.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          event.description.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }).toList();
  }

  void _showPurchaseDialog(Event event) {
    int ticketCount = 1;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final double total = event.price * ticketCount;
            return Container(
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF161622) : Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.3),
                    blurRadius: 20,
                    offset: const Offset(0, -5),
                  )
                ],
              ),
              padding: EdgeInsets.fromLTRB(24, 16, 24, MediaQuery.of(context).padding.bottom + 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: textColor.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.network(
                          event.image,
                          width: 80,
                          height: 80,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return Container(
                              color: AppColors.violet.withValues(alpha: 0.1),
                              width: 80,
                              height: 80,
                              child: const Icon(Icons.confirmation_number_rounded, color: AppColors.violet),
                            );
                          },
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.violet.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                event.category,
                                style: const TextStyle(
                                  color: AppColors.violet,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              event.title,
                              style: TextStyle(
                                color: textColor,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${event.price.toStringAsFixed(0)} FCFA / Ticket',
                              style: const TextStyle(
                                color: AppColors.violet,
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Nombre de tickets',
                        style: TextStyle(
                          color: textColor,
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Row(
                        children: [
                          IconButton(
                            onPressed: ticketCount > 1
                                ? () => setModalState(() => ticketCount--)
                                : null,
                            icon: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                border: Border.all(color: ticketCount > 1 ? AppColors.violet : Colors.grey.withValues(alpha: 0.3)),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                Icons.remove,
                                size: 16,
                                color: ticketCount > 1 ? AppColors.violet : Colors.grey,
                              ),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Text(
                              '$ticketCount',
                              style: TextStyle(
                                color: textColor,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          IconButton(
                            onPressed: ticketCount < 10
                                ? () => setModalState(() => ticketCount++)
                                : null,
                            icon: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                border: Border.all(color: ticketCount < 10 ? AppColors.violet : Colors.grey.withValues(alpha: 0.3)),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                Icons.add,
                                size: 16,
                                color: ticketCount < 10 ? AppColors.violet : Colors.grey,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const Divider(height: 32),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Total à payer',
                        style: TextStyle(
                          color: textColor.withValues(alpha: 0.7),
                          fontSize: 14,
                        ),
                      ),
                      Text(
                        '${total.toStringAsFixed(0)} FCFA',
                        style: TextStyle(
                          color: textColor,
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  MosombiButton.primary(
                    onPressed: () {
                      context.pop();
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          backgroundColor: AppColors.violet,
                          content: Text(
                            'Achat réussi de $ticketCount ticket(s) pour "${event.title}" !',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                      );
                    },
                    text: 'Confirmer le paiement',
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white54 : AppColors.textSecondaryLight;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: AnimatedGradientBg(
        isDark: isDark,
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            MossombiHeaderType2(
              title: 'Billetterie',
              actionIcon: const Icon(Icons.history_rounded, color: Colors.white),
              onActionTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Historique de vos billets à venir')),
                );
              },
            ),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              sliver: SliverToBoxAdapter(
                child: Column(
                  children: [
                    // Search Bar
                    GlassContainer(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      child: TextField(
                        controller: _searchController,
                        style: TextStyle(color: textColor),
                        onChanged: (val) {
                          setState(() {
                            _searchQuery = val;
                          });
                        },
                        decoration: InputDecoration(
                          hintText: 'Rechercher un événement, lieu...',
                          hintStyle: TextStyle(color: hintColor),
                          border: InputBorder.none,
                          icon: Icon(Icons.search, color: hintColor),
                          suffixIcon: _searchController.text.isNotEmpty
                              ? IconButton(
                                  icon: Icon(Icons.clear, color: hintColor),
                                  onPressed: () {
                                    _searchController.clear();
                                    setState(() {
                                      _searchQuery = '';
                                    });
                                  },
                                )
                              : null,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    // Categories horizontal list
                    SizedBox(
                      height: 40,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        physics: const BouncingScrollPhysics(),
                        itemCount: _categories.length,
                        itemBuilder: (context, index) {
                          final cat = _categories[index];
                          final isSelected = _selectedCategory == cat;
                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: ChoiceChip(
                              label: Text(
                                cat,
                                style: TextStyle(
                                  color: isSelected
                                      ? Colors.white
                                      : (isDark ? Colors.white70 : AppColors.bgDark1),
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              selected: isSelected,
                              selectedColor: AppColors.violet,
                              backgroundColor: isDark
                                  ? Colors.white.withValues(alpha: 0.1)
                                  : Colors.black.withValues(alpha: 0.05),
                              checkmarkColor: Colors.white,
                              onSelected: (selected) {
                                if (selected) {
                                  setState(() {
                                    _selectedCategory = cat;
                                  });
                                }
                              },
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // Events list
            _filteredEvents.isEmpty
                ? SliverFillRemaining(
                    hasScrollBody: false,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.confirmation_number_outlined, size: 64, color: hintColor),
                        const SizedBox(height: 16),
                        Text(
                          'Aucun événement trouvé',
                          style: TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  )
                : SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final event = _filteredEvents[index];
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: GlassContainer(
                              padding: EdgeInsets.zero,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Stack(
                                    children: [
                                      ClipRRect(
                                        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                                        child: Image.network(
                                          event.image,
                                          height: 180,
                                          width: double.infinity,
                                          fit: BoxFit.cover,
                                          errorBuilder: (context, error, stackTrace) {
                                            return Container(
                                              height: 180,
                                              width: double.infinity,
                                              color: AppColors.violet.withValues(alpha: 0.1),
                                              child: const Icon(Icons.confirmation_number_rounded, color: AppColors.violet, size: 48),
                                            );
                                          },
                                        ),
                                      ),
                                      Positioned(
                                        top: 12,
                                        right: 12,
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                          decoration: BoxDecoration(
                                            color: Colors.black.withValues(alpha: 0.7),
                                            borderRadius: BorderRadius.circular(12),
                                          ),
                                          child: Text(
                                            event.category,
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  Padding(
                                    padding: const EdgeInsets.all(16),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          event.title,
                                          style: TextStyle(
                                            color: textColor,
                                            fontSize: 18,
                                            fontWeight: FontWeight.w900,
                                            letterSpacing: -0.2,
                                          ),
                                        ),
                                        const SizedBox(height: 8),
                                        Row(
                                          children: [
                                            const Icon(Icons.calendar_today_rounded, size: 14, color: AppColors.violet),
                                            const SizedBox(width: 8),
                                            Text(
                                              event.date,
                                              style: TextStyle(color: hintColor, fontSize: 13),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 4),
                                        Row(
                                          children: [
                                            const Icon(Icons.location_on_rounded, size: 14, color: AppColors.violet),
                                            const SizedBox(width: 8),
                                            Expanded(
                                              child: Text(
                                                event.location,
                                                style: TextStyle(color: hintColor, fontSize: 13),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 12),
                                        Text(
                                          event.description,
                                          style: TextStyle(color: textColor.withValues(alpha: 0.8), fontSize: 13, height: 1.4),
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 16),
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  'À partir de',
                                                  style: TextStyle(color: hintColor, fontSize: 12),
                                                ),
                                                Text(
                                                  '${event.price.toStringAsFixed(0)} FCFA',
                                                  style: TextStyle(
                                                    color: textColor,
                                                    fontSize: 18,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ],
                                            ),
                                            SizedBox(
                                              width: 140,
                                              child: MosombiButton.primary(
                                                onPressed: () => _showPurchaseDialog(event),
                                                text: 'Réserver',
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
                          ).animate().fade().slideY(begin: 0.1, end: 0);
                        },
                        childCount: _filteredEvents.length,
                      ),
                    ),
                  ),
            const SliverToBoxAdapter(
              child: SizedBox(height: 32),
            ),
          ],
        ),
      ),
    );
  }
}

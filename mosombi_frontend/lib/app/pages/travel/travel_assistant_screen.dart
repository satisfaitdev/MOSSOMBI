import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

class TravelAssistantScreen extends StatefulWidget {
  const TravelAssistantScreen({super.key});

  @override
  State<TravelAssistantScreen> createState() => _TravelAssistantScreenState();
}

class _TravelAssistantScreenState extends State<TravelAssistantScreen> {
  final _chatCtrl = TextEditingController();
  final List<_ChatMessage> _messages = [];

  final List<Map<String, String>> _tips = [
    {'emoji': '\u{1F6C2}', 'title': 'Documents de voyage', 'desc': 'Passeport, visa, carte d\'identite. Verifiez les validites avant de partir.'},
    {'emoji': '\u{1F48A}', 'title': 'Pharmacie de voyage', 'desc': 'Antipaludiques, antidiarrheiques, trousse de premiers soins.'},
    {'emoji': '\u{1F324}', 'title': 'Meteo', 'desc': 'Consultez la mete de votre destination pour un bagage adapte.'},
    {'emoji': '\u{1F4B0}', 'title': 'Budget', 'desc': 'Prevoyez 50-100 dollar par jour pour le transport, repas et hebergement.'},
    {'emoji': '\u{1F512}', 'title': 'Securite', 'desc': 'Gardez vos objets de valeur en lieu sur. Evitez les zones isolees la nuit.'},
    {'emoji': '\u{1F5E3}', 'title': 'Langue locale', 'desc': 'Apprenez quelques mots: Bonjour, Merci, Sil vous plait.'},
    {'emoji': '\u{1F695}', 'title': 'Transport local', 'desc': 'Utilisez Mossombi pour vos deplacements. Reservation simple et securisee.'},
    {'emoji': '\u{1F35C}', 'title': 'Gastronomie', 'desc': 'Goutez aux specialites locales. Demandez conseil a votre guide.'},
  ];

  @override
  void dispose() {
    _chatCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white.withValues(alpha: 0.5) : AppColors.textSecondaryLight;

    return Scaffold(
      extendBodyBehindAppBar: true,
      backgroundColor: Colors.transparent,
      body: AnimatedGradientBg(
        isDark: isDark,
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            MossombiSliverAppBar(title: 'Assistant Voyage'),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: GlassContainer(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: AppColors.violet.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.auto_awesome_rounded, color: AppColors.violet, size: 24),
                          ),
                          const SizedBox(width: 12),
                          Text('Conseils de voyage', style: TextStyle(color: textColor, fontWeight: FontWeight.w900, fontSize: 18)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text('Préparez votre voyage en toute sérénité. Découvrez nos conseils et astuces pour voyager en toute sécurité.',
                        style: TextStyle(color: hintColor, fontSize: 13)),
                    ],
                  ),
                ).animate().fade(duration: 500.ms),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final tip = _tips[index];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(tip['emoji']!, style: const TextStyle(fontSize: 28)),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(tip['title']!, style: TextStyle(color: textColor, fontWeight: FontWeight.w800, fontSize: 15)),
                                const SizedBox(height: 4),
                                Text(tip['desc']!, style: TextStyle(color: hintColor, fontSize: 13)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ).animate().fade(delay: (index * 80).ms).slideX(begin: 0.1, end: 0);
                  },
                  childCount: _tips.length,
                ),
              ),
            ),
            // Chat section
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Text('Assistant', style: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.w900)),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                child: GlassContainer(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _chatCtrl,
                          style: TextStyle(color: textColor, fontSize: 14),
                          decoration: InputDecoration(
                            hintText: 'Posez une question...',
                            hintStyle: TextStyle(color: hintColor, fontSize: 13),
                            border: InputBorder.none,
                          ),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.send_rounded, color: AppColors.violet),
                        onPressed: () {
                          if (_chatCtrl.text.trim().isNotEmpty) {
                            setState(() {
                              _messages.insert(0, _ChatMessage(_chatCtrl.text, true));
                              _messages.insert(0, _ChatMessage('Je suis votre assistant voyage. Je peux vous aider avec des conseils sur les destinations, les documents, la sécurité, etc.', false));
                              _chatCtrl.clear();
                            });
                          }
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final msg = _messages[index];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Align(
                        alignment: msg.isUser ? Alignment.centerRight : Alignment.centerLeft,
                        child: Container(
                          constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: msg.isUser ? AppColors.violet.withValues(alpha: 0.15) : Colors.white.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(16).copyWith(
                              bottomRight: msg.isUser ? const Radius.circular(4) : null,
                              bottomLeft: !msg.isUser ? const Radius.circular(4) : null,
                            ),
                          ),
                          child: Text(msg.text, style: TextStyle(color: textColor, fontSize: 13)),
                        ),
                      ),
                    ).animate().fade().slideY(begin: 0.2, end: 0);
                  },
                  childCount: _messages.length,
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 60)),
          ],
        ),
      ),
    );
  }
}

class _ChatMessage {
  final String text;
  final bool isUser;
  const _ChatMessage(this.text, this.isUser);
}

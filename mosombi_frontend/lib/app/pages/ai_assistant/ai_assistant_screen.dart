import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:mosombi_frontend/core/providers/ai_assistant_provider.dart';
import 'package:mosombi_frontend/core/providers/wallet_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

class AiAssistantScreen extends StatefulWidget {
  final bool isBottomSheet;
  static void showAsBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Padding(
        padding: EdgeInsets.only(top: MediaQuery.of(context).size.height * 0.1), // laisse 10% d'espace en haut
        child: const ClipRRect(
          borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
          child: AiAssistantScreen(isBottomSheet: true),
        ),
      ),
    );
  }

  const AiAssistantScreen({super.key, this.isBottomSheet = false});

  @override
  State<AiAssistantScreen> createState() => _AiAssistantScreenState();
}

class _AiAssistantScreenState extends State<AiAssistantScreen> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  void _sendMessage() {
    final text = _controller.text;
    if (text.trim().isEmpty) return;
    _controller.clear();
    context.read<AiAssistantProvider>().sendMessage(text);
    
    Future.delayed(const Duration(milliseconds: 200), _scrollToBottom);
    // After AI thinks (1.5s), it generates a response. Scroll again.
    Future.delayed(const Duration(milliseconds: 1800), _scrollToBottom);
  }

  Widget _buildActionCard(AiMessage msg, BuildContext context) {
    if (msg.actionCard == null) return const SizedBox.shrink();
    final card = msg.actionCard!;
    
    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.15), blurRadius: 15, offset: const Offset(0, 5))
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.violet.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  card.type == AiActionType.bookRide ? Icons.directions_car_rounded : 
                  card.type == AiActionType.orderFood ? Icons.local_pizza_rounded : Icons.receipt_rounded,
                  color: AppColors.violet,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(card.title, style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.bgDark1, fontSize: 15)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(card.subtitle, style: const TextStyle(color: Colors.black54, fontSize: 13, height: 1.3)),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('${card.amount.toStringAsFixed(0)} F', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: AppColors.bgDark1)),
              if (card.isCompleted)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(color: Colors.green.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(20)),
                  child: const Text('Validé ✓', style: TextStyle(color: Colors.green, fontWeight: FontWeight.w800)),
                )
              else
                ElevatedButton(
                  onPressed: () {
                    context.read<AiAssistantProvider>().completeAction(msg.id, context.read<WalletProvider>());
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.violet,
                    foregroundColor: Colors.white,
                    elevation: 5,
                    shadowColor: AppColors.violet.withValues(alpha: 0.5),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  ),
                  child: const Text('Confirmer', style: TextStyle(fontWeight: FontWeight.w800)),
                ),
            ],
          ),
        ],
      ),
    ).animate().scale(curve: Curves.easeOutBack, duration: 600.ms, begin: const Offset(0.8, 0.8)).fade();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white.withValues(alpha: 0.5) : AppColors.textSecondaryLight;

    return Scaffold(
      extendBodyBehindAppBar: true,
      backgroundColor: Colors.transparent,
      appBar: widget.isBottomSheet ? null : MossombiAppBar(
        title: 'Mossombi AI',
        customTitle: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.auto_awesome_rounded, color: Color(0xFFCE93D8), size: 20),
            const SizedBox(width: 8),
            Text('Mossombi AI', style: TextStyle(color: textColor, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
          ],
        ),
      ),
      body: AnimatedGradientBg(
        isDark: isDark,
        child: SafeArea(
          bottom: false,
          top: !widget.isBottomSheet,
          child: Column(
            children: [
              if (widget.isBottomSheet)
                Container(
                  width: 40,
                  height: 5,
                  margin: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: hintColor,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),

              // Futuristic Orb
              Padding(
                padding: EdgeInsets.symmetric(vertical: widget.isBottomSheet ? 10 : 20),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Container(
                      width: 80, height: 80,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(color: const Color(0xFFCE93D8).withValues(alpha: 0.3), blurRadius: 40, spreadRadius: 10),
                          BoxShadow(color: const Color(0xFF00D4FF).withValues(alpha: 0.15), blurRadius: 50, spreadRadius: -10),
                        ],
                        gradient: const RadialGradient(colors: [Color(0xFFCE93D8), Colors.transparent]),
                      ),
                    ).animate(onPlay: (c) => c.repeat(reverse: true)).scale(begin: const Offset(0.8, 0.8), duration: 2.seconds, curve: Curves.easeInOut),
                    
                    Container(
                      width: 50, height: 50,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: const LinearGradient(
                          colors: [Color(0xFF9C27B0), Color(0xFF00D4FF)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        boxShadow: [BoxShadow(color: const Color(0xFF9C27B0).withValues(alpha: 0.5), blurRadius: 20)],
                      ),
                      child: const Center(child: Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 24)),
                    )
                  ],
                ),
              ).animate().fade().slideY(begin: -0.2, end: 0, duration: 600.ms),

              // Chat Area
              Expanded(
                child: Consumer<AiAssistantProvider>(
                  builder: (context, aiProvider, child) {
                    final messages = aiProvider.messages;
                    return ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.only(left: 20, right: 20, top: 10, bottom: 40),
                      itemCount: messages.length,
                      itemBuilder: (context, index) {
                        final msg = messages[index];
                        final isUser = msg.sender == 'user';
                        
                        return Align(
                          alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 16),
                            constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.85),
                            child: Column(
                              crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                                  decoration: BoxDecoration(
                                    color: isUser ? AppColors.violet : Colors.white.withValues(alpha: 0.08),
                                    borderRadius: BorderRadius.only(
                                      topLeft: const Radius.circular(20),
                                      topRight: const Radius.circular(20),
                                      bottomLeft: Radius.circular(isUser ? 20 : 4),
                                      bottomRight: Radius.circular(isUser ? 4 : 20),
                                    ),
                                    border: isUser ? null : Border.all(color: Colors.white.withValues(alpha: 0.1)),
                                  ),
                                  child: msg.isTyping
                                    ? Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Text(msg.text, style: TextStyle(color: textColor, fontStyle: FontStyle.italic)),
                                          const SizedBox(width: 8),
                                          const SizedBox(
                                            height: 12, width: 12, 
                                            child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.violet)
                                          )
                                        ],
                                      )
                                    : Text(msg.text, style: TextStyle(
                                        color: isUser ? Colors.white : textColor,
                                        fontSize: 15,
                                        fontWeight: isUser ? FontWeight.w600 : FontWeight.w500,
                                        height: 1.4,
                                      )),
                                ),
                                // Render Action Card if exists
                                _buildActionCard(msg, context),
                              ],
                            ),
                          ).animate().fade().slideX(begin: isUser ? 0.2 : -0.2, end: 0, curve: Curves.easeOut),
                        );
                      },
                    );
                  },
                ),
              ),

              // Input Area
              SafeArea(
                child: Padding(
                  padding: EdgeInsets.fromLTRB(20, 10, 20, widget.isBottomSheet ? 20 + MediaQuery.of(context).viewInsets.bottom : 20),
                  child: GlassContainer(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                    child: Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.mic_none_rounded, color: Colors.white54, size: 28),
                          onPressed: () {},
                        ),
                        Expanded(
                          child: TextField(
                            controller: _controller,
                            style: TextStyle(color: textColor),
                            decoration: InputDecoration(
                              hintText: 'Une course, une pizza...',
                              hintStyle: TextStyle(color: hintColor, fontSize: 14),
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 8),
                            ),
                            onSubmitted: (_) => _sendMessage(),
                          ),
                        ),
                        Container(
                          decoration: const BoxDecoration(
                            color: AppColors.violet,
                            shape: BoxShape.circle,
                          ),
                          child: IconButton(
                            icon: const Icon(Icons.send_rounded, color: Colors.white, size: 18),
                            onPressed: _sendMessage,
                          ),
                        ),
                      ],
                    ),
                  ),
                ).animate().slideY(begin: 1, end: 0, duration: 400.ms),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

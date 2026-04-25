import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/theme/app_gradients.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mosombi_frontend/core/widgets/popup_pub.dart';
import '../../../../core/providers/auth_provider.dart';

class OtpScreen extends ConsumerStatefulWidget {
  const OtpScreen({super.key});

  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  final List<TextEditingController> _ctrls =
      List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _nodes = List.generate(6, (_) => FocusNode());
  int _seconds = 59;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_seconds == 0) {
        t.cancel();
      } else {
        setState(() => _seconds--);
      }
    });
  }

  @override
  void dispose() {
    for (final c in _ctrls) {
      c.dispose();
    }
    for (final n in _nodes) {
      n.dispose();
    }
    _timer?.cancel();
    super.dispose();
  }

  void _onChanged(int i, String val) async {
    if (val.length == 1 && i < 5) {
      _nodes[i + 1].requestFocus();
    } else if (val.isEmpty && i > 0) {
      _nodes[i - 1].requestFocus();
    }
    
    if (_ctrls.every((c) => c.text.isNotEmpty)) {
      final code = _ctrls.map((c) => c.text).join();
      final success = await ref.read(authProvider.notifier).verifyOtp(code);
      
      if (!mounted) return;
      
      if (success) {
        PopupPub.show(
          context,
          imageUrl: 'https://images.unsplash.com/photo-1555421689-d68471e189f2?auto=format&fit=crop&q=80&w=800',
          title: 'Compte Vérifié ✅',
          description: 'Félicitations ! Votre compte est activé.\nComplétons votre profil pour terminer.',
          onAction: () {},
        ).then((_) {
          if (mounted) context.go('/auth/onboarding');
        });
      } else {
        final errorMsg = ref.read(authProvider).error ?? 'Code invalide';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(errorMsg), backgroundColor: Colors.redAccent),
        );
      }
    }
  }

  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final mins = (_seconds ~/ 60).toString().padLeft(2, '0');
    final secs = (_seconds % 60).toString().padLeft(2, '0');
    final authState = ref.watch(authProvider);

    return Scaffold(
      extendBody: true,
      body: AnimatedGradientBg(
        isDark: isDark,
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Ring timer
                  _RingTimer(seconds: _seconds, isDark: isDark)
                      .animate().scale(begin: const Offset(0.5, 0.5), duration: 700.ms, curve: Curves.elasticOut).fade(),

                  const SizedBox(height: 32),

                  ShaderMask(
                    shaderCallback: (b) => AppGradients.primary.createShader(b),
                    child: const Text('Vérification',
                        style: TextStyle(fontSize: 32, fontWeight: FontWeight.w800, color: Colors.white)),
                  ).animate(delay: 200.ms).fade().slideY(begin: 0.2),

                  const SizedBox(height: 8),
                  Text(
                    authState.pendingPhone != null 
                        ? 'Code envoyé au ${authState.pendingPhone}'
                        : 'Code envoyé à votre téléphone',
                    style: TextStyle(
                        color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight),
                  ).animate(delay: 300.ms).fade(),

                  const SizedBox(height: 40),

                  // OTP boxes
                  GlassContainer(
                    padding: const EdgeInsets.all(28),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: List.generate(6, (i) => _OtpBox(
                            controller: _ctrls[i],
                            focusNode: _nodes[i],
                            isDark: isDark,
                            onChanged: (v) => _onChanged(i, v),
                          ).animate(delay: (i * 80).ms).fade(duration: 300.ms).scale(begin: const Offset(0.7, 0.7))),
                        ),
                        const SizedBox(height: 28),
                        // Resend
                        _seconds > 0
                            ? Text('Renvoyer dans $mins:$secs',
                                style: TextStyle(color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight))
                            : GestureDetector(
                                onTap: () async {
                                  final success = await ref.read(authProvider.notifier).sendOtp();
                                  if (success) {
                                    setState(() => _seconds = 59);
                                    _startTimer();
                                    if (mounted) {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(content: Text('Un nouveau code a été envoyé'), backgroundColor: Colors.green),
                                      );
                                    }
                                  } else {
                                    if (mounted) {
                                      final errorMsg = ref.read(authProvider).error ?? 'Impossible de renvoyer le code';
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(content: Text(errorMsg), backgroundColor: Colors.redAccent),
                                      );
                                    }
                                  }
                                },
                                child: ShaderMask(
                                  shaderCallback: (b) => AppGradients.primary.createShader(b),
                                  child: const Text('Renvoyer le code',
                                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                                ),
                              ),
                      ],
                    ),
                  ).animate(delay: 400.ms).fade(duration: 500.ms).slideY(begin: 0.3, end: 0),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _OtpBox extends StatefulWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final bool isDark;
  final ValueChanged<String> onChanged;

  const _OtpBox({
    required this.controller,
    required this.focusNode,
    required this.isDark,
    required this.onChanged,
  });

  @override
  State<_OtpBox> createState() => _OtpBoxState();
}

class _OtpBoxState extends State<_OtpBox> {
  bool _focused = false;

  @override
  void initState() {
    super.initState();
    widget.focusNode.addListener(() => setState(() => _focused = widget.focusNode.hasFocus));
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      width: 44,
      height: 52,
      decoration: BoxDecoration(
        color: widget.isDark
            ? Colors.white.withValues(alpha: _focused ? 0.12 : 0.06)
            : Colors.white.withValues(alpha: _focused ? 0.9 : 0.6),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: _focused ? AppColors.violet : Colors.transparent,
          width: 2,
        ),
        boxShadow: _focused
            ? [BoxShadow(color: AppColors.violet.withValues(alpha: 0.25), blurRadius: 12)]
            : [],
      ),
      child: TextField(
        controller: widget.controller,
        focusNode: widget.focusNode,
        textAlign: TextAlign.center,
        textAlignVertical: TextAlignVertical.center,
        keyboardType: TextInputType.number,
        maxLength: 1,
        onChanged: widget.onChanged,
        cursorColor: Colors.black,
        decoration: const InputDecoration(
          isDense: true,
          contentPadding: EdgeInsets.zero,
          counterText: '',
          counter: SizedBox.shrink(),
          border: InputBorder.none,
          enabledBorder: InputBorder.none,
          focusedBorder: InputBorder.none,
        ),
        style: const TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w900,
          color: Colors.black,
        ),
      ),
    );
  }
}

class _RingTimer extends StatelessWidget {
  final int seconds;
  final bool isDark;

  const _RingTimer({required this.seconds, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final progress = seconds / 59;
    return SizedBox(
      width: 100,
      height: 100,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CircularProgressIndicator(
            value: progress,
            strokeWidth: 5,
            backgroundColor: (isDark ? Colors.white : Colors.black).withValues(alpha: 0.1),
            valueColor: const AlwaysStoppedAnimation(AppColors.violet),
          ),
          Text(
            '${(seconds % 60).toString().padLeft(2, '0')}s',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
            ),
          ),
        ],
      ),
    );
  }
}

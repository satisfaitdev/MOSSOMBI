import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/providers/agency_provider.dart';

class JoinAgencyScreen extends StatefulWidget {
  const JoinAgencyScreen({super.key});

  @override
  State<JoinAgencyScreen> createState() => _JoinAgencyScreenState();
}

class _JoinAgencyScreenState extends State<JoinAgencyScreen> {
  final _codeController = TextEditingController();

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  void _submitCode() async {
    if (_codeController.text.length < 6) return;

    final provider = context.read<AgencyProvider>();
    final formattedCode = 'MSB-${_codeController.text}';
    final success = await provider.joinAgency(formattedCode, 'Utilisateur', '+242 06 000 00 00');
    
    if (success) {
      if (mounted) {
         ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Demande d\'adhésion envoyée. En attente de validation.')));
         context.pop();
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(provider.error ?? 'Code invalide')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AgencyProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final hintColor = isDark ? Colors.white.withValues(alpha: 0.5) : AppColors.textSecondaryLight;

    return Scaffold(
      body: AnimatedGradientBg(
        isDark: isDark,
        child: Column(
          children: [
            const MossombiAppBar(title: 'Rejoindre une Agence'),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    GlassContainer(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        children: [
                          Icon(Icons.password_rounded, size: 64, color: const Color(0xFF6C4EF6)).animate().scale(curve: Curves.easeOutBack, duration: 600.ms),
                          const SizedBox(height: 24),
                          Text('Code d\'Affiliation', style: TextStyle(color: textColor, fontSize: 20, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          Text(
                            'Entrez les 6 chiffres de l\'identifiant.',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: hintColor, fontSize: 14),
                          ),
                          const SizedBox(height: 32),
                          
                          TextField(
                            controller: _codeController,
                            keyboardType: TextInputType.number,
                            maxLength: 6,
                            textAlign: TextAlign.center,
                            style: TextStyle(color: textColor, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: 8),
                            decoration: InputDecoration(
                              hintText: 'XXXXXX',
                              hintStyle: TextStyle(color: hintColor.withValues(alpha: 0.3), letterSpacing: 8),
                              counterText: '',
                              filled: true,
                              fillColor: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.05),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                            ),
                            onChanged: (v) {
                              if (v.length == 6) setState(() {});
                            },
                          ),
                        ],
                      ),
                    ).animate().fade().slideY(begin: 0.1, end: 0),
                    
                    const SizedBox(height: 40),
                    
                    ElevatedButton(
                      onPressed: (_codeController.text.length >= 6 && !provider.isLoading) ? _submitCode : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF6C4EF6),
                        disabledBackgroundColor: const Color(0xFF6C4EF6).withValues(alpha: 0.3),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: provider.isLoading
                          ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Text('Rejoindre', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                    ).animate(delay: 200.ms).fade().slideY(begin: 0.1, end: 0),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'dart:io';

void main() async {
  final libDir = Directory('lib');
  await for (var entity in libDir.list(recursive: true)) {
    if (entity is File && entity.path.endsWith('.dart')) {
      String content = await entity.readAsString();
      
      if (content.contains(r'$1') || content.contains(r'$2')) {
        // Strip bad imports
        content = content.replaceAll(RegExp(r"import\s+'.*\$[12].*';\r?\n?"), "");
        
        final imports = <String>{};
        
        if (content.contains('AppColors')) imports.add("import 'package:mosombi_frontend/core/theme/app_colors.dart';");
        if (content.contains('AppGradients')) imports.add("import 'package:mosombi_frontend/core/theme/app_gradients.dart';");
        if (content.contains('GlassContainer')) imports.add("import 'package:mosombi_frontend/core/widgets/glass_container.dart';");
        if (content.contains('AnimatedGradientBg')) imports.add("import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';");
        if (content.contains('MossombiAppBar') || content.contains('MossombiSliverAppBar')) imports.add("import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';");
        if (content.contains('WalletCard')) imports.add("import 'package:mosombi_frontend/core/widgets/wallet_card.dart';");
        if (content.contains('PromoBanner')) imports.add("import 'package:mosombi_frontend/core/widgets/promo_banner.dart';");
        if (content.contains('OrdersScreen') && !entity.path.contains('orders_screen')) imports.add("import 'package:mosombi_frontend/app/pages/orders/orders_screen.dart';");
        if (content.contains('ProfileScreen') && !entity.path.contains('profile_screen')) imports.add("import 'package:mosombi_frontend/app/pages/profile/profile_screen.dart';");
        
        // For router specifically
        if (entity.path.contains('app_router')) {
          imports.add("import 'package:mosombi_frontend/app/pages/splash/splash_screen.dart';");
          imports.add("import 'package:mosombi_frontend/app/pages/onboarding/onboarding_screen.dart';");
          imports.add("import 'package:mosombi_frontend/app/pages/auth/login_screen.dart';");
          imports.add("import 'package:mosombi_frontend/app/pages/auth/register_screen.dart';");
          imports.add("import 'package:mosombi_frontend/app/pages/auth/otp_screen.dart';");
          imports.add("import 'package:mosombi_frontend/app/pages/auth/forgot_password_screen.dart';");
          imports.add("import 'package:mosombi_frontend/app/pages/home/home_screen.dart';");
          imports.add("import 'package:mosombi_frontend/app/pages/marketplace/marketplace_screen.dart';");
          imports.add("import 'package:mosombi_frontend/app/pages/transport/transport_screen.dart';");
          imports.add("import 'package:mosombi_frontend/app/pages/food/food_screen.dart';");
          imports.add("import 'package:mosombi_frontend/app/pages/fintech/fintech_screen.dart';");
          imports.add("import 'package:mosombi_frontend/app/pages/ai_assistant/ai_assistant_screen.dart';");
        }
        
        final importBlock = imports.join('\n') + (imports.isNotEmpty ? '\n' : '');
        
        content = importBlock + content;
        
        await entity.writeAsString(content);
        print('Restored imports in ${entity.path}');
      }
    }
  }
}

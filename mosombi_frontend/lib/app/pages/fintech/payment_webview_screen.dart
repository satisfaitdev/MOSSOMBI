import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';

/// Écran WebView contrôlé pour le paiement SWYCHR.
/// Injecte du CSS pour cacher les éléments SWYCHR non désirés
/// et un JS pour détecter la fin du paiement.
class PaymentWebViewScreen extends StatefulWidget {
  final String checkoutUrl;
  final double amount;

  const PaymentWebViewScreen({
    super.key,
    required this.checkoutUrl,
    required this.amount,
  });

  @override
  State<PaymentWebViewScreen> createState() => _PaymentWebViewScreenState();
}

class _PaymentWebViewScreenState extends State<PaymentWebViewScreen> {
  late WebViewController _controller;
  bool _isLoading = true;
  final String _title = 'Paiement';

  // ─────────────────────────────────────────────
  // CSS à injecter sur la page SWYCHR
  // Adapte les sélecteurs selon le vrai HTML de la page SWYCHR
  // ─────────────────────────────────────────────
  String _getInjectedCss(BuildContext context) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDarkMode ? '#0A0E27' : '#FFFFFF';
    final textColor = isDarkMode ? '#FFFFFF' : '#1A1035';

    return '''
      (function() {
        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = `
          /* Cacher le header SWYCHR et TouchPay */
          header, .header, .navbar, nav,
          [class*="header"], [class*="navbar"],
          [id*="header"], [id*="navbar"],
          .tp-header, .touchpay-header, .logo-container,
          /* Cacher uniquement les images estampillées swychr */
          img[src*="swychr"], img[alt*="swychr"] {
            display: none !important;
          }
          /* Cacher le footer */
          footer, .footer, [class*="footer"], [id*="footer"], .tp-footer {
            display: none !important;
          }
          /* Cacher le lien "Powered by" */
          [class*="powered"], [class*="branding"], [class*="brand"], .powered-by {
            display: none !important;
          }
          /* Cacher les spinners de chargement sans casser les conteneurs (ciblage très restrictif) */
          .MuiCircularProgress-root, 
          [role="progressbar"],
          svg[class*="spinner"],
          svg[class*="loader"] {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
          }
          /* Améliorer le body pour l'app mobile (Synchronisé avec le thème) */
          body, html, main, #root, #app, .app-container {
            background-color: ${bgColor} !important;
            color: ${textColor} !important;
            font-family: 'Inter', sans-serif !important;
          }
          /* Textes génériques */
          p, h1, h2, h3, h4, h5, h6, label {
            color: ${textColor} !important;
          }
        `;
        document.head.appendChild(style);
      })();
    ''';
  }

  // ─────────────────────────────────────────────
  // JS pour cacher les textes SWYCHR spécifiques
  // ─────────────────────────────────────────────
  static const String _hideSwychrTextsJs = '''
    (function hideSwychrTexts() {
      var phrases = [
        'Payment Request from',
        'For any queries',
        'please contact',
        'Want to create',
        'want to create a payment',
        'satisfait.it@gmail.com',
        'Powered by',
        'RENCO',
        'connect'
      ];

      function applyAggressiveChanges() {
        if (!document.body) return;

        // 1. Cacher les textes importuns (juste leur conteneur direct)
        var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        var node;
        while ((node = walker.nextNode())) {
          var text = node.nodeValue || '';
          var lowerText = text.toLowerCase();
          for (var i = 0; i < phrases.length; i++) {
            if (lowerText.includes(phrases[i].toLowerCase())) {
              var el = node.parentElement;
              // Remonter juste au niveau du bloc texte direct
              while (el && el !== document.body && el !== document.documentElement) {
                var tag = el.tagName.toLowerCase();
                if (['p','span','h1','h2','h3','h4','h5','h6','li','a','strong','b','em','small','header','footer'].includes(tag)) {
                  el.style.setProperty('display', 'none', 'important');
                  break;
                }
                el = el.parentElement;
              }
              break;
            }
          }
        }

        // 2. Traquer et détruire spécifiquement la CARTE BLEU FONCÉ (récapitulatif TouchPay)
        document.querySelectorAll('div').forEach(function(el) {
          var cleanTxt = (el.innerText || '').toLowerCase().replace(/\\s+/g, '');
          // La carte contient ces 4 lignes obligatoirement
          if (cleanTxt.includes('transaction:') && cleanTxt.includes('montant:') && cleanTxt.includes('frais:') && cleanTxt.includes('total:')) {
             // On cache CE DOM UNIQUEMENT s'il ne déborde pas sur la liste des opérateurs en dessous (qui contient "choisissez")
             if (!cleanTxt.includes('choisissez') && cleanTxt.length < 300) {
                 el.style.setProperty('display', 'none', 'important');
             }
          }
        });

        // 2. Traquer et détruire tous les logos importuns (images Swychr uniquement, on laisse Touchpay natif)
        document.querySelectorAll('img, svg').forEach(function(media) {
          var src = (media.src || '').toLowerCase();
          var alt = (media.alt || '').toLowerCase();
          var id = (media.id || '').toLowerCase();
          var classes = (media.className || '').toString().toLowerCase();
          if (src.includes('swychr') || alt.includes('swychr') || 
              (id.includes('logo') && id.includes('swy')) || 
              (classes.includes('logo') && classes.includes('swy'))) {
            media.style.setProperty('display', 'none', 'important'); 
          }
        });

        // 4. Cibler UNIQUEMENT le bouton principal de paiement (Swychr) pour le restyliser, sans casser les boutons opérateurs TouchPay
        document.querySelectorAll('button, input[type="submit"], input[type="button"], .btn, [role="button"]').forEach(function(btn) {
          var btnTxt = (btn.innerText || btn.value || '').toLowerCase();
          // On n'applique le style lourd QUE si le bouton contient explicitement "pay" ou "payer"
          if (btnTxt.includes('pay') || btnTxt.includes('payer') || btnTxt.includes('proceed')) {
            if (window.getComputedStyle(btn).display !== 'none') {
              btn.style.setProperty('background', 'linear-gradient(135deg, #6C4EF6 0%, #9B77FF 100%)', 'important');
              btn.style.setProperty('background-color', '#6C4EF6', 'important');
              btn.style.setProperty('border', 'none', 'important');
              btn.style.setProperty('border-radius', '16px', 'important');
              btn.style.setProperty('color', '#ffffff', 'important');
              btn.style.setProperty('font-weight', 'bold', 'important');
              // Centrage parfait en bloquant sa position à l'écran
              btn.style.setProperty('display', 'block', 'important');
              btn.style.setProperty('width', 'calc(100% - 48px)', 'important');
              btn.style.setProperty('max-width', '360px', 'important');
              
              // Forcer la position absolue en bas au centre
              btn.style.setProperty('position', 'fixed', 'important');
              btn.style.setProperty('left', '50%', 'important');
              btn.style.setProperty('bottom', '40px', 'important');
              btn.style.setProperty('transform', 'translateX(-50%)', 'important');
              
              // Retrait des anciennes marges polluantes
              btn.style.setProperty('margin', '0', 'important');
              btn.style.setProperty('z-index', '99999', 'important');
              btn.style.setProperty('text-align', 'center', 'important');
            }
          }
        });

        // 5. Supprimer explicitement les headers et footers persistants
        document.querySelectorAll('header, footer, .footer, .header, .touchpay-header, .tp-footer').forEach(function(hf) {
          hf.style.setProperty('display', 'none', 'important');
        });
      }

      setInterval(applyAggressiveChanges, 400);
      applyAggressiveChanges();
    })();
  ''';

  // ─────────────────────────────────────────────
  // JS pour détecter la fin du paiement (succès/échec)
  // Surveille les textes, le console.log et window.close
  // ─────────────────────────────────────────────
  static const String _paymentDetectorJs = '''
    (function() {
      // 1. Hook de console.log pour capter les statuts internes explicites de Touchpay/Swychr
      var originalLog = console.log;
      console.log = function() {
        var args = Array.from(arguments);
        var msg = args.join(' ').toLowerCase();
        
        if (msg.includes('status to handle and redirection processing')) {
           if (msg.includes('success')) {
              window.FlutterChannel.postMessage('PAYMENT_SUCCESS');
           } else if (msg.includes('fail') || msg.includes('error')) {
              window.FlutterChannel.postMessage('PAYMENT_FAILED');
           }
        }
        originalLog.apply(console, arguments);
      };

      // 2. Intercepter window.close() que TouchPay utilise au lieu d'une URL de retour
      var originalClose = window.close;
      window.close = function() {
        // Envoi d'un événement neutre (fermeture de fenêtre), Flutter le traitera comme une sortie (nullable/pending)
        window.FlutterChannel.postMessage('WINDOW_CLOSE');
        originalClose.apply(window, arguments);
      };

      // 3. Observer classique pour les textes affichés à l'écran
      var observer = new MutationObserver(function(mutations) {
        var pageText = (document.body.innerText || '').toLowerCase();
        
        // Détection prioritaire d'un échec (pour éviter les faux "réussi" dans "non réussi")
        if (pageText.includes('failed') || pageText.includes('échoué') || pageText.includes('échec') || 
            pageText.includes('erreur') || pageText.includes('error') || pageText.includes('unsuccessful')) {
          window.FlutterChannel.postMessage('PAYMENT_FAILED');
          return; 
        }
        
        // Détection d'un succès propre
        if (pageText.includes('paiement effectué') || pageText.includes('transaction réussie') || 
            pageText.includes('approuvé') || pageText.includes('approved')) {
          window.FlutterChannel.postMessage('PAYMENT_SUCCESS');
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    })();
  ''';

  @override
  void initState() {
    super.initState();

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.transparent)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (url) {
            if (mounted) setState(() => _isLoading = true);
          },
          onPageFinished: (url) async {
            if (mounted) setState(() => _isLoading = false);
            // Injecter CSS dynamically based on flutter theme
            if (mounted) {
              await _controller.runJavaScript(_getInjectedCss(context));
            }
            // Cacher les textes SWYCHR spécifiques
            await _controller.runJavaScript(_hideSwychrTextsJs);
            // Injecter JS de détection fin de paiement
            await _controller.runJavaScript(_paymentDetectorJs);
          },
          onWebResourceError: (error) {
            debugPrint('WebView error: ${error.description}');
          },
          onNavigationRequest: (request) {
            // Détecter si le portail redirige vers une page de terminaison (notre backend ou swychr)
            final url = request.url.toLowerCase();
            
            // PRIORITÉ 1: Si l'URL contient explicitement une erreur (même si elle redirige vers une page "success" trompeuse)
            if (url.contains('errorcode=') || url.contains('error_code=') || url.contains('status=failed') || url.contains('status=error') || url.contains('cancel') || url.contains('/payment-failed') || url.contains('success=false')) {
              _onPaymentComplete(success: false);
              return NavigationDecision.prevent;
            }
            
            // PRIORITÉ 2: Si aucune erreur n'est détectée dans les paramètres, et qu'on a un lien de succès
            if (url.contains('status=success') || url.contains('/payment-success') || url.contains('/payment/success') || url.contains('success=true')) {
              _onPaymentComplete(success: true);
              return NavigationDecision.prevent;
            }
            
            return NavigationDecision.navigate;
          },
        ),
      )
      // Canal JS → Flutter pour recevoir les messages de paiement
      ..addJavaScriptChannel(
        'FlutterChannel',
        onMessageReceived: (message) {
          if (message.message == 'PAYMENT_SUCCESS') {
            _onPaymentComplete(success: true);
          } else if (message.message == 'PAYMENT_FAILED') {
            _onPaymentComplete(success: false);
          } else if (message.message == 'WINDOW_CLOSE') {
            // Touchpay essaie de fermer la fenêtre après avoir loggé son succès/échec
            // On renvoie "null" pour simuler une fermeture manuelle 
            // (le backend devra vérifier le webhook si nécessaire)
            if (mounted) Navigator.of(context).pop(null);
          }
        },
      )
      ..loadRequest(Uri.parse(widget.checkoutUrl));
  }

  void _onPaymentComplete({required bool success}) {
    if (!mounted) return;
    // Retourner à l'écran précédent avec le résultat
    Navigator.of(context).pop(success);
  }

  @override
  Widget build(BuildContext context) {
    final bgColor = Theme.of(context).scaffoldBackgroundColor;
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDarkMode ? Colors.white : AppColors.textPrimaryLight;

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        backgroundColor: bgColor,
        elevation: 0,
        centerTitle: true,
        iconTheme: IconThemeData(color: textColor),
        title: Column(
          children: [
            Text(
              _title,
              style: TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 2),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: const [
                Icon(Icons.lock_rounded, color: Color(0xFF00E5C5), size: 12),
                SizedBox(width: 4),
                Text('Paiement Sécurisé', style: TextStyle(color: Color(0xFF00E5C5), fontSize: 11)),
              ],
            ),
          ],
        ),
        leading: IconButton(
          icon: Icon(Icons.close_rounded, color: textColor),
          onPressed: () => _onPaymentComplete(success: false),
        ),
        actions: [
          // Bouton recharger
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Colors.white70),
            onPressed: () => _controller.reload(),
          ),
        ],
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
        ],
      ),
    );
  }
}

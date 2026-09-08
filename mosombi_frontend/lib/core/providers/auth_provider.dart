import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../network/api_client.dart';
import '../network/api_config.dart';
import '../models/user_model.dart';
import '../services/ride_notification_service.dart';
import 'dart:developer';

// État de l'authentification
class AuthState {
  final bool isLoading;
  final User? user;
  final String? error;
  final String? pendingPhone; // Utilisé pendant le flow OTP

  AuthState({
    this.isLoading = false,
    this.user,
    this.error,
    this.pendingPhone,
  });

  bool get isAuthenticated => user != null;

  AuthState copyWith({
    bool? isLoading,
    User? user,
    String? error,
    String? pendingPhone,
    bool clearError = false,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      user: user ?? this.user,
      error: clearError ? null : (error ?? this.error),
      pendingPhone: pendingPhone ?? this.pendingPhone,
    );
  }
}

// Provider global pour le client API
final apiClientProvider = Provider((ref) => ApiClient());

// Le Provider Auth
class AuthNotifier extends Notifier<AuthState> {
  late ApiClient _apiClient;
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  @override
  AuthState build() {
    _apiClient = ref.watch(apiClientProvider);
    // On lance la vérification en asynchrone sans bloquer le build
    Future.microtask(() => _checkAuthStatus());
    return AuthState();
  }

  Future<void> _checkAuthStatus() async {
    state = state.copyWith(isLoading: true);
    try {
      final token = await _secureStorage.read(key: 'access_token');
      if (token != null) {
        // Optionnel : appeler un endpoint GET /profile/me pour valider le token et récupérer le User
        final response = await _apiClient.dio.get(ApiConfig.getProfile);
        if (response.statusCode == 200 && response.data['success']) {
          state = state.copyWith(
            user: User.fromJson(response.data['data']),
            isLoading: false,
            clearError: true,
          );
          return;
        }
      }
    } catch (e) {
      log('Check Auth Error: $e');
      // Token invalide ou expiré
      await _secureStorage.delete(key: 'access_token');
    }
    state = state.copyWith(isLoading: false, user: null);
  }

  Future<bool> login(String identifier, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _apiClient.dio.post(ApiConfig.login, data: {
        'identifier': identifier,
        'password': password,
      });

      if (response.statusCode == 200 && response.data['success']) {
        final data = response.data['data'];
        final String accessToken = data['access_token'];
        final user = User.fromJson(data['user']);

        try {
          await _secureStorage.write(key: 'access_token', value: accessToken);
          // Sécurité Bancaire : Sauvegarde des identifiants cryptés pour la biométrie
          await _secureStorage.write(key: 'saved_identifier', value: identifier);
          await _secureStorage.write(key: 'saved_password', value: password);
        } catch (_) {
          log('Warning: SecureStorage failed (expected on some browsers)');
        }
        
        state = state.copyWith(isLoading: false, user: user);

        // Envoyer la notification push de Bienvenue !
        try {
          await RideNotificationService.showWelcomeNotification(user.fullName ?? 'Cher utilisateur');
        } catch (_) {} // Ignorer sur web (plugin non supporté)

        return true;
      }
    } on DioException catch (e) {
      final message = e.response?.data['error'] ?? e.response?.data['message'] ?? 'Erreur de connexion';
      state = state.copyWith(isLoading: false, error: message);
    } catch (e, stack) {
      log('Login Error: $e\n$stack');
      state = state.copyWith(isLoading: false, error: 'Une erreur s\'est produite');
    }
    return false;
  }

  /// Méthode "Ultra-Bancaire" pour l'authentification biométrique
  Future<bool> biometricLogin() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final savedIdentifier = await _secureStorage.read(key: 'saved_identifier');
      final savedPassword = await _secureStorage.read(key: 'saved_password');

      if (savedIdentifier == null || savedPassword == null) {
        state = state.copyWith(isLoading: false, error: 'Identifiants biométriques introuvables. Connectez-vous manuellement.');
        return false;
      }

      // Reconnexion réelle (cachée) avec les identifiants en cache
      final response = await _apiClient.dio.post(ApiConfig.login, data: {
        'identifier': savedIdentifier,
        'password': savedPassword,
      });

      if (response.statusCode == 200 && response.data['success']) {
        final data = response.data['data'];
        final String accessToken = data['access_token'];
        final user = User.fromJson(data['user']);

        await _secureStorage.write(key: 'access_token', value: accessToken);
        
        state = state.copyWith(isLoading: false, user: user);

        // Envoyer la notification push de Bienvenue !
        RideNotificationService.showWelcomeNotification(user.fullName ?? 'Cher utilisateur');

        return true;
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        // Le mot de passe a changé ailleurs !
        state = state.copyWith(isLoading: false, error: 'Mot de passe expiré. Reconnexion manuelle requise.');
        await logout();
      } else {
        final message = e.response?.data['error'] ?? 'Erreur de connexion';
        state = state.copyWith(isLoading: false, error: message);
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Erreur inattendue');
    }
    return false;
  }

  Future<bool> register({
    required String firstName,
    required String lastName,
    required String phone,
    required String password,
    String? email,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _apiClient.dio.post(ApiConfig.register, data: {
        'first_name': firstName,
        'last_name': lastName,
        'phone': phone,
        'password': password,
        if (email != null && email.isNotEmpty) 'email': email,
      });

      if (response.statusCode == 200 && response.data['success']) {
        // Enregistrement OK, un OTP a été envoyé
        state = state.copyWith(
          isLoading: false,
          pendingPhone: response.data['data']['user']['phone'] ?? phone,
        );
        return true;
      }
    } on DioException catch (e) {
      String message = e.response?.data['error'] ?? e.response?.data['message'] ?? 'Erreur d\'inscription';
      
      // Amélioration de l'erreur WhatsApp
      if (message.contains("Impossible d'envoyer le code") || message.contains("Erreur envoi WhatsApp")) {
        message = "Ce numéro WhatsApp n'existe pas ou est invalide. Veuillez utiliser un numéro WhatsApp actif.";
      }
      
      state = state.copyWith(isLoading: false, error: message);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Erreur réseau');
    }
    return false;
  }

  /// Vérifie l'OTP et génère les tokens de profil (pas de login direct dans cette route, on l'oblige à se connecter ensuite)
  /// Ou si le endpoint Verify renvoie les tokens, on les stocke directement.
  Future<bool> verifyOtp(String code) async {
    if (state.pendingPhone == null) return false;
    
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _apiClient.dio.post(ApiConfig.verifyOtp, data: {
        'phone': state.pendingPhone,
        'otp_code': code,
      });

      if (response.statusCode == 200 && response.data['success']) {
        final data = response.data['data'];
        if (data != null && data['access_token'] != null && data['user'] != null) {
          final String accessToken = data['access_token'];
          final user = User.fromJson(data['user']);
          await _secureStorage.write(key: 'access_token', value: accessToken);
          state = state.copyWith(isLoading: false, pendingPhone: null, user: user);
        } else {
          state = state.copyWith(isLoading: false, pendingPhone: null);
        }
        return true; // Vérification réussie (l'utilisateur peut maintenant configurer son profil)
      }
    } on DioException catch (e) {
      final message = e.response?.data['error'] ?? 'Code invalide ou expiré';
      state = state.copyWith(isLoading: false, error: message);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Erreur inattendue');
    }
    return false;
  }

  Future<bool> sendOtp() async {
    if (state.pendingPhone == null) return false;
    
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _apiClient.dio.post(ApiConfig.sendOtp, data: {
        'phone': state.pendingPhone,
      });

      if (response.statusCode == 200 && response.data['success']) {
        state = state.copyWith(isLoading: false);
        return true;
      }
    } on DioException catch (e) {
      final message = e.response?.data['error'] ?? 'Impossible de renvoyer le code';
      state = state.copyWith(isLoading: false, error: message);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Erreur inattendue');
    }
    return false;
  }

  Future<bool> submitOnboarding({
    required String birthDate,
    required String referralCode,
    required String source,
    dynamic avatarFile, // File? from dart:io
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final Map<String, dynamic> payload = {
        'acquisition_source': source,
      };
      
      if (birthDate.isNotEmpty) payload['birth_date'] = birthDate;
      if (referralCode.isNotEmpty) payload['referral_code'] = referralCode;

      if (avatarFile != null) {
        // ATTENTION: La base de données Supabase plantera (Erreur 500) 
        // si on envoie tout le code Base64 de l'image dans la colonne "avatar_url".
        // L'upload fichier (Supabase Storage) arrivera plus tard côté backend.
        // On envoie donc un avatar vide pour laisser passer l'utilisateur.
        payload['avatar_url'] = '';
      }

      final response = await _apiClient.dio.put(ApiConfig.onboarding, data: payload);

      if (response.statusCode == 200 && response.data['success']) {
        state = state.copyWith(isLoading: false);
        return true;
      }
    } on DioException catch (e) {
      final message = e.response?.data['error'] ?? 'Impossible de sauvegarder le profil';
      state = state.copyWith(isLoading: false, error: message);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Erreur inattendue');
    }
    return false;
  }

  Future<Map<String, dynamic>?> fetchUserSettings() async {
    try {
      final response = await _apiClient.dio.get(ApiConfig.getSettings);
      if (response.statusCode == 200 && response.data['success']) {
        return response.data['data'] as Map<String, dynamic>;
      }
    } catch (e) {
      log('Error fetching user settings: $e');
    }
    return null;
  }

  Future<bool> updateSettingsProfile({
    required String username,
    required String displayName,
    required String bio,
    required String location,
    required String gender,
    required String birthDate,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _apiClient.dio.put(ApiConfig.updateSettingsProfile, data: {
        if (username.isNotEmpty) 'username': username,
        if (displayName.isNotEmpty) 'display_name': displayName,
        'bio': bio,
        'location': location,
        'gender': gender,
        if (birthDate.isNotEmpty) 'birth_date': birthDate,
      });

      if (response.statusCode == 200 && response.data['success']) {
        await _checkAuthStatus();
        return true;
      }
    } on DioException catch (e) {
      final message = e.response?.data['error'] ?? 'Impossible de sauvegarder le profil';
      state = state.copyWith(isLoading: false, error: message);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Erreur inattendue');
    }
    return false;
  }

  Future<bool> updateSettingsNotifications(Map<String, bool> notifications) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _apiClient.dio.put(ApiConfig.updateSettingsNotifications, data: notifications);
      if (response.statusCode == 200 && response.data['success']) {
        state = state.copyWith(isLoading: false);
        return true;
      }
    } on DioException catch (e) {
      final message = e.response?.data['error'] ?? 'Impossible de sauvegarder les préférences de notification';
      state = state.copyWith(isLoading: false, error: message);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Erreur inattendue');
    }
    return false;
  }

  Future<bool> updateSettingsPrivacy(Map<String, dynamic> privacy) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _apiClient.dio.put(ApiConfig.updateSettingsPrivacy, data: privacy);
      if (response.statusCode == 200 && response.data['success']) {
        state = state.copyWith(isLoading: false);
        return true;
      }
    } on DioException catch (e) {
      final message = e.response?.data['error'] ?? 'Impossible de sauvegarder les paramètres de confidentialité';
      state = state.copyWith(isLoading: false, error: message);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Erreur inattendue');
    }
    return false;
  }

  Future<void> logout() async {
    await _secureStorage.delete(key: 'access_token');
    // On garde (ne supprime pas) 'saved_identifier' et 'saved_password'
    // Pour que la connexion biométrique marche même après une déconnexion
    state = AuthState(); // Reset state
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(() {
  return AuthNotifier();
});

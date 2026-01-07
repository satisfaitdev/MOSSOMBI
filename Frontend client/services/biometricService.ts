/**
 * SERVICE D'AUTHENTIFICATION BIOMÉTRIQUE - MOSSOMBI
 * Gestion sécurisée de l'authentification biométrique
 */

import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform } from 'react-native';
import { feedbackService } from './feedbackService';

export interface BiometricConfig {
  enabled: boolean;
  requireForLogin: boolean;
  requireForTransactions: boolean;
  requireForSensitiveActions: boolean;
}

export interface AuthenticationResult {
  success: boolean;
  error?: string;
  authType?: 'biometric' | 'passcode' | 'none';
  cancelled?: boolean;
}

class BiometricService {
  private config: BiometricConfig = {
    enabled: false,
    requireForLogin: false,
    requireForTransactions: false,
    requireForSensitiveActions: false,
  };

  private readonly STORAGE_KEY = 'biometric_config';

  /**
   * Initialiser le service biométrique
   */
  async initialize(): Promise<void> {
    try {
      await this.loadConfig();
      const availability = await this.checkAvailability();
      
      console.log(`🔐 Biométrie disponible: ${availability.available} (Hardware: ${availability.hasHardware}, Enrolled: ${availability.isEnrolled})`);
      console.log(`🔐 Types supportés: ${availability.types.join(', ')}`);
      
      // Vérifier si on est dans Expo Go
      const isExpoGo = __DEV__ && typeof expo !== 'undefined';
      if (isExpoGo && availability.hasHardware) {
        console.log('⚠️ Mode Expo Go détecté: Certaines fonctionnalités biométriques peuvent être limitées');
        console.log('💡 Pour une expérience complète, utilisez un development build');
      }
      
      // Synchroniser automatiquement l'état si la biométrie devient disponible
      if (availability.available && !this.config.enabled) {
        console.log('🔄 Synchronisation automatique: biométrie disponible mais désactivée');
        console.log('💡 Conseil: Activez la biométrie dans les paramètres pour une sécurité renforcée');
      } else if (!availability.available && this.config.enabled) {
        console.log('🔄 Synchronisation automatique: biométrie activée mais non disponible');
        // Désactiver automatiquement si plus disponible
        this.config.enabled = false;
        await this.saveConfig();
        console.log('⚠️ Biométrie désactivée automatiquement (matériel non disponible)');
      }
      
      console.log('✅ Service biométrique initialisé');
    } catch (error) {
      console.error('❌ Erreur initialisation biométrique:', error);
    }
  }

  /**
   * Charger la configuration depuis le stockage
   */
  private async loadConfig(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.config = { ...this.config, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Erreur chargement config biométrique:', error);
    }
  }

  /**
   * Sauvegarder la configuration
   */
  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('Erreur sauvegarde config biométrique:', error);
    }
  }

  /**
   * Vérifier la disponibilité de la biométrie
   */
  async checkAvailability(): Promise<{
    available: boolean;
    hasHardware: boolean;
    isEnrolled: boolean;
    types: string[];
  }> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      const types = supportedTypes.map((type: any) => {
        switch (type) {
          case LocalAuthentication.AuthenticationType.FINGERPRINT:
            return 'Empreinte digitale';
          case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
            return 'Face ID';
          case LocalAuthentication.AuthenticationType.IRIS:
            return 'Iris';
          default:
            return 'Biométrie';
        }
      });

      const available = hasHardware && isEnrolled;

      console.log(`🔐 Biométrie disponible: ${available} (Hardware: ${hasHardware}, Enrolled: ${isEnrolled})`);
      console.log(`🔐 Types supportés: ${types.join(', ')}`);

      return {
        available,
        hasHardware,
        isEnrolled,
        types
      };
    } catch (error) {
      console.error('❌ Erreur vérification biométrie:', error);
      return {
        available: false,
        hasHardware: false,
        isEnrolled: false,
        types: []
      };
    }
  }

  /**
   * Activer ou désactiver l'authentification biométrique SANS test (juste pour les paramètres)
   */
  async setEnabledWithoutTest(enabled: boolean): Promise<void> {
    try {
      console.log(`🔐 ${enabled ? 'Activation' : 'Désactivation'} biométrique (paramètre uniquement)`);
      
      // Sauvegarder la configuration SANS test d'authentification
      const config = await this.getConfig();
      const oldEnabled = config.enabled;
      config.enabled = enabled;
      this.config = config; // Mettre à jour la config en mémoire
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
      
      console.log(`✅ Paramètre biométrique ${enabled ? 'activé' : 'désactivé'} (sans test)`);
      console.log(`🔄 État biométrique: ${oldEnabled} → ${enabled}`);
    } catch (error) {
      console.error('❌ Erreur sauvegarde paramètre biométrique:', error);
    }
  }

  /**
   * Activer ou désactiver l'authentification biométrique AVEC test (pour la configuration initiale)
   */
  async setBiometricEnabled(enabled: boolean): Promise<{ success: boolean; needsSetup?: boolean; error?: string }> {
    try {
      console.log(`🔐 ${enabled ? 'Activation' : 'Désactivation'} de l'authentification biométrique`);
      
      if (enabled) {
        // Vérifier la disponibilité avant d'activer
        const availability = await this.checkAvailability();
        
        if (!availability.hasHardware) {
          return { 
            success: false, 
            error: 'Votre appareil ne supporte pas l\'authentification biométrique' 
          };
        }
        
        if (!availability.isEnrolled) {
          return { 
            success: false, 
            needsSetup: true,
            error: 'Aucune empreinte digitale ou Face ID configuré sur cet appareil' 
          };
        }
        
        if (!availability.available) {
          return { 
            success: false, 
            error: 'Authentification biométrique non disponible' 
          };
        }
        
        // Activer temporairement pour permettre le test
        const oldEnabled = this.config.enabled;
        this.config.enabled = true;
        
        try {
          // Test d'authentification pour confirmer
          const testResult = await this.authenticate(
            'Configuration Mossombi - Confirmez votre identité pour activer l\'authentification biométrique'
          );
          
          if (!testResult.success) {
            // Restaurer l'ancien état en cas d'échec
            this.config.enabled = oldEnabled;
            console.log('❌ Test d\'authentification échoué');
            return { 
              success: false, 
              error: testResult.error || 'Authentification échouée' 
            };
          }
        } catch (error) {
          // Restaurer l'ancien état en cas d'erreur
          this.config.enabled = oldEnabled;
          throw error;
        }
      }
      
      // Sauvegarder la configuration
      const config = await this.getConfig();
      config.enabled = enabled;
      this.config = config; // Mettre à jour la config en mémoire
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
      
      console.log(`✅ Authentification biométrique ${enabled ? 'activée' : 'désactivée'}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur configuration biométrique:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      };
    }
  }

  /**
   * Ouvrir les paramètres système pour configurer la biométrie
   */
  async openBiometricSettings(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        // iOS - Paramètres Face ID & Code ou Touch ID & Code
        try {
          await Linking.openURL('App-Prefs:PASSCODE');
          console.log('📱 Paramètres biométriques iOS ouverts');
          return true;
        } catch {
          await Linking.openURL('App-Prefs:root');
          console.log('📱 Paramètres généraux iOS ouverts');
          return true;
        }
      } else {
        // Android - Essayer différentes approches
        const androidUrls = [
          'android.settings.SECURITY_SETTINGS',
          'android.settings.FINGERPRINT_ENROLL',
          'android.settings.BIOMETRIC_ENROLL',
          'android.settings.SETTINGS'
        ];
        
        for (const url of androidUrls) {
          try {
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
              await Linking.openURL(url);
              console.log(`📱 Paramètres Android ouverts: ${url}`);
              return true;
            }
          } catch (error) {
            console.log(`⚠️ Impossible d'ouvrir ${url}:`, error);
            continue;
          }
        }
        
        // Dernier recours : ouvrir les paramètres via Intent
        try {
          await Linking.sendIntent('android.settings.SECURITY_SETTINGS');
          console.log('📱 Paramètres de sécurité ouverts via Intent');
          return true;
        } catch (error) {
          console.log('⚠️ Intent échoué, tentative paramètres généraux');
          await Linking.sendIntent('android.settings.SETTINGS');
          console.log('📱 Paramètres généraux ouverts via Intent');
          return true;
        }
      }
    } catch (error) {
      console.error('❌ Erreur ouverture paramètres:', error);
      // Afficher un message à l'utilisateur
      console.log('💡 Veuillez ouvrir manuellement : Paramètres > Sécurité > Empreinte digitale');
      return false;
    }
  }

  /**
   * Configurer les exigences d'authentification
   */
  async setAuthRequirements(requirements: Partial<BiometricConfig>): Promise<void> {
    this.config = { ...this.config, ...requirements };
    await this.saveConfig();
    console.log('🔐 Exigences d\'authentification mises à jour:', requirements);
  }

  /**
   * Authentifier l'utilisateur
   */
  async authenticate(
    reason: string = 'Authentification requise'
  ): Promise<AuthenticationResult> {
    try {
      // Vérifier d'abord la disponibilité matérielle
      const availability = await this.checkAvailability();
      if (!availability.available) {
        return {
          success: false,
          error: 'Authentification biométrique non disponible',
          authType: 'none'
        };
      }

      // Vérifier que la biométrie est explicitement activée
      if (!this.config.enabled) {
        console.log('❌ Authentification biométrique désactivée dans les paramètres');
        return {
          success: false,
          error: 'Authentification biométrique désactivée. Activez-la dans les paramètres.',
          authType: 'none'
        };
      }

      // Déclencher l'authentification avec configuration adaptée à Expo Go
      console.log('🔐 Tentative d\'authentification biométrique...');
      
      // Configuration différente selon l'environnement
      const isExpoGo = __DEV__ && typeof expo !== 'undefined';
      
      const authOptions = {
        promptMessage: reason,
        cancelLabel: 'Annuler',
        fallbackLabel: isExpoGo ? undefined : '', // Expo Go ne supporte pas fallbackLabel vide
        disableDeviceFallback: !isExpoGo, // Désactiver seulement hors Expo Go
        requireConfirmation: false,
      };
      
      console.log('🔧 Configuration auth:', { isExpoGo, disableDeviceFallback: authOptions.disableDeviceFallback });
      
      const result = await LocalAuthentication.authenticateAsync(authOptions);

      if (result.success) {
        // Dans Expo Go, vérifier si c'était vraiment de la biométrie
        if (isExpoGo) {
          console.log('⚠️ Authentification réussie dans Expo Go - Impossible de garantir que c\'était de la biométrie pure');
          console.log('💡 Dans un development build, seule la biométrie serait acceptée');
        }
        
        // Feedback de succès
        await feedbackService.successFeedback();
        
        console.log('✅ Authentification biométrique réussie');
        return {
          success: true,
          authType: 'biometric'
        };
      } else {
        // Gérer les différents types d'échec
        let error = 'Authentification échouée';
        let cancelled = false;

        // Convertir l'erreur en string pour la comparaison
        const errorCode = result.error?.toString() || '';
        
        if (errorCode === 'UserCancel' || errorCode === 'UserFallback') {
          error = 'Authentification annulée par l\'utilisateur';
          cancelled = true;
        } else if (errorCode === 'BiometricUnavailable') {
          error = 'Biométrie temporairement indisponible';
        } else if (errorCode === 'AuthenticationFailed') {
          error = 'Échec de l\'authentification biométrique';
          await feedbackService.errorFeedback();
        } else if (errorCode === 'missing_usage_description') {
          error = 'Configuration Face ID manquante (limitation Expo Go)';
          console.log('⚠️ Limitation Expo Go: Utilisez un development build pour Face ID complet');
        }

        console.log('❌ Authentification biométrique échouée:', result.error);
        return {
          success: false,
          error,
          cancelled,
          authType: 'none'
        };
      }
    } catch (error) {
      console.error('❌ Erreur authentification biométrique:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        authType: 'none'
      };
    }
  }

  /**
   * Authentifier pour la connexion
   */
  async authenticateForLogin(): Promise<AuthenticationResult> {
    if (!this.config.requireForLogin) {
      return { success: true, authType: 'none' };
    }

    return this.authenticate(
      'Connexion sécurisée - Utilisez votre biométrie pour vous connecter à Mossombi'
    );
  }

  /**
   * Authentifier pour les transactions
   */
  async authenticateForTransaction(amount?: number): Promise<AuthenticationResult> {
    if (!this.config.requireForTransactions) {
      return { success: true, authType: 'none' };
    }

    const message = amount 
      ? `Confirmer la transaction de ${amount} CDF`
      : 'Confirmer la transaction';

    return this.authenticate(
      `${message} - Authentifiez-vous pour valider cette transaction`
    );
  }

  /**
   * Authentifier pour les actions sensibles
   */
  async authenticateForSensitiveAction(action: string): Promise<AuthenticationResult> {
    if (!this.config.requireForSensitiveActions) {
      return { success: true, authType: 'none' };
    }

    return this.authenticate(
      `Confirmer: ${action} - Cette action nécessite une authentification`
    );
  }

  /**
   * Tester l'authentification biométrique
   */
  async testAuthentication(): Promise<void> {
    console.log('🧪 Test de l\'authentification biométrique...');
    
    const result = await this.authenticate(
      'Test Mossombi - Test de l\'authentification biométrique'
    );
    
    if (result.success) {
      console.log('✅ Test biométrique réussi !');
    } else {
      console.log('❌ Test biométrique échoué:', result.error);
    }
  }

  /**
   * Désactiver complètement la biométrie
   */
  async disableBiometric(): Promise<void> {
    this.config = {
      enabled: false,
      requireForLogin: false,
      requireForTransactions: false,
      requireForSensitiveActions: false,
    };
    await this.saveConfig();
    console.log('🔐 Authentification biométrique complètement désactivée');
  }

  /**
   * Obtenir la configuration actuelle
   */
  getConfig(): BiometricConfig {
    return { ...this.config };
  }

  /**
   * Vérifier si la biométrie est activée
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Vérifier si l'authentification est requise pour une action
   */
  isRequiredFor(action: 'login' | 'transaction' | 'sensitive'): boolean {
    if (!this.config.enabled) return false;
    
    switch (action) {
      case 'login':
        return this.config.requireForLogin;
      case 'transaction':
        return this.config.requireForTransactions;
      case 'sensitive':
        return this.config.requireForSensitiveActions;
      default:
        return false;
    }
  }

  /**
   * Obtenir un résumé de l'état de la biométrie
   */
  async getStatus(): Promise<{
    available: boolean;
    enabled: boolean;
    types: string[];
    requirements: BiometricConfig;
  }> {
    const availability = await this.checkAvailability();
    
    return {
      available: availability.available,
      enabled: this.config.enabled,
      types: availability.types,
      requirements: this.getConfig()
    };
  }
}

// Instance singleton
export const biometricService = new BiometricService();

// Types d'export
export { LocalAuthentication };

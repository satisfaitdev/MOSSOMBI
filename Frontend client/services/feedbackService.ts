/**
 * SERVICE DE FEEDBACK UTILISATEUR - MOSSOMBI
 * Gestion du son, vibration et authentification biométrique
 */

import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SoundOptions {
  volume?: number; // 0.0 à 1.0
  rate?: number;   // Vitesse de lecture
  shouldLoop?: boolean;
}

export interface BiometricResult {
  success: boolean;
  error?: string;
  biometricType?: string;
}

class FeedbackService {
  private soundObject: Audio.Sound | null = null;
  private isSoundEnabled = true;
  private isVibrationEnabled = true;

  /**
   * Initialiser le service
   */
  async initialize(): Promise<void> {
    try {
      // Configurer l'audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Charger les préférences
      await this.loadPreferences();
      
      console.log('✅ Service de feedback initialisé');
    } catch (error) {
      console.error('❌ Erreur initialisation service feedback:', error);
    }
  }

  /**
   * Charger les préférences depuis le stockage
   */
  private async loadPreferences(): Promise<void> {
    try {
      const [soundPref, vibrationPref] = await AsyncStorage.multiGet([
        'soundEnabled',
        'vibrationEnabled'
      ]);
      
      this.isSoundEnabled = soundPref[1] !== 'false';
      this.isVibrationEnabled = vibrationPref[1] !== 'false';
    } catch (error) {
      console.error('Erreur chargement préférences feedback:', error);
    }
  }

  /**
   * Mettre à jour les préférences
   */
  async updatePreferences(soundEnabled: boolean, vibrationEnabled: boolean): Promise<void> {
    this.isSoundEnabled = soundEnabled;
    this.isVibrationEnabled = vibrationEnabled;
    
    await AsyncStorage.multiSet([
      ['soundEnabled', soundEnabled.toString()],
      ['vibrationEnabled', vibrationEnabled.toString()]
    ]);
  }

  // ==================== GESTION DU SON ====================

  /**
   * Jouer un son de notification
   */
  async playNotificationSound(options: SoundOptions = {}): Promise<void> {
    if (!this.isSoundEnabled) {
      console.log('🔇 Son désactivé dans les paramètres');
      return;
    }

    try {
      // Nettoyer le son précédent
      if (this.soundObject) {
        await this.soundObject.unloadAsync();
      }

      // Créer un nouveau son
      this.soundObject = new Audio.Sound();
      
      // Charger le son par défaut du système
      await this.soundObject.loadAsync(
        { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' },
        {
          shouldPlay: true,
          volume: options.volume || 0.8,
          rate: options.rate || 1.0,
          isLooping: options.shouldLoop || false,
        }
      );

      console.log('🔊 Son de notification joué');
    } catch (error) {
      console.error('❌ Erreur lecture son:', error);
      // Fallback : utiliser le son système
      await this.playSystemSound();
    }
  }

  /**
   * Jouer un son de succès
   */
  async playSuccessSound(): Promise<void> {
    if (!this.isSoundEnabled) return;

    try {
      await this.playNotificationSound({
        volume: 0.6,
        rate: 1.2,
      });
      console.log('✅ Son de succès joué');
    } catch (error) {
      console.error('❌ Erreur son de succès:', error);
    }
  }

  /**
   * Jouer un son d'erreur
   */
  async playErrorSound(): Promise<void> {
    if (!this.isSoundEnabled) return;

    try {
      await this.playNotificationSound({
        volume: 0.7,
        rate: 0.8,
      });
      console.log('❌ Son d\'erreur joué');
    } catch (error) {
      console.error('❌ Erreur son d\'erreur:', error);
    }
  }

  /**
   * Jouer le son système (fallback)
   */
  private async playSystemSound(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        // Sur iOS, utiliser le son système
        console.log('🍎 Utilisation du son système iOS');
      } else {
        // Sur Android, déclencher une vibration courte comme feedback
        await this.lightVibration();
      }
    } catch (error) {
      console.error('❌ Erreur son système:', error);
    }
  }

  /**
   * Arrêter tous les sons
   */
  async stopAllSounds(): Promise<void> {
    try {
      if (this.soundObject) {
        await this.soundObject.stopAsync();
        await this.soundObject.unloadAsync();
        this.soundObject = null;
      }
      console.log('🔇 Tous les sons arrêtés');
    } catch (error) {
      console.error('❌ Erreur arrêt sons:', error);
    }
  }

  // ==================== GESTION DE LA VIBRATION ====================

  /**
   * Vibration légère (feedback tactile)
   */
  async lightVibration(): Promise<void> {
    if (!this.isVibrationEnabled) {
      console.log('📳 Vibration désactivée dans les paramètres');
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      console.log('📳 Vibration légère');
    } catch (error) {
      console.error('❌ Erreur vibration légère:', error);
    }
  }

  /**
   * Vibration moyenne
   */
  async mediumVibration(): Promise<void> {
    if (!this.isVibrationEnabled) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      console.log('📳 Vibration moyenne');
    } catch (error) {
      console.error('❌ Erreur vibration moyenne:', error);
    }
  }

  /**
   * Vibration forte
   */
  async heavyVibration(): Promise<void> {
    if (!this.isVibrationEnabled) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      console.log('📳 Vibration forte');
    } catch (error) {
      console.error('❌ Erreur vibration forte:', error);
    }
  }

  /**
   * Vibration de succès
   */
  async successVibration(): Promise<void> {
    if (!this.isVibrationEnabled) return;

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log('✅ Vibration de succès');
    } catch (error) {
      console.error('❌ Erreur vibration succès:', error);
    }
  }

  /**
   * Vibration d'erreur
   */
  async errorVibration(): Promise<void> {
    if (!this.isVibrationEnabled) return;

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.log('❌ Vibration d\'erreur');
    } catch (error) {
      console.error('❌ Erreur vibration erreur:', error);
    }
  }

  /**
   * Vibration d'avertissement
   */
  async warningVibration(): Promise<void> {
    if (!this.isVibrationEnabled) return;

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      console.log('⚠️ Vibration d\'avertissement');
    } catch (error) {
      console.error('❌ Erreur vibration avertissement:', error);
    }
  }

  /**
   * Vibration de sélection (pour les boutons)
   */
  async selectionVibration(): Promise<void> {
    if (!this.isVibrationEnabled) return;

    try {
      await Haptics.selectionAsync();
      console.log('👆 Vibration de sélection');
    } catch (error) {
      console.error('❌ Erreur vibration sélection:', error);
    }
  }

  // ==================== AUTHENTIFICATION BIOMÉTRIQUE ====================

  /**
   * Vérifier si l'authentification biométrique est disponible
   */
  async isBiometricAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      console.log(`🔐 Biométrie - Hardware: ${hasHardware}, Enrolled: ${isEnrolled}`);
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('❌ Erreur vérification biométrie:', error);
      return false;
    }
  }

  /**
   * Obtenir les types d'authentification disponibles
   */
  async getBiometricTypes(): Promise<string[]> {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const typeNames = types.map(type => {
        switch (type) {
          case LocalAuthentication.AuthenticationType.FINGERPRINT:
            return 'Empreinte digitale';
          case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
            return 'Reconnaissance faciale';
          case LocalAuthentication.AuthenticationType.IRIS:
            return 'Reconnaissance iris';
          default:
            return 'Biométrie';
        }
      });
      
      console.log('🔐 Types biométriques disponibles:', typeNames);
      return typeNames;
    } catch (error) {
      console.error('❌ Erreur types biométriques:', error);
      return [];
    }
  }

  /**
   * Authentifier avec la biométrie
   */
  async authenticateWithBiometrics(
    promptMessage: string = 'Authentifiez-vous pour continuer'
  ): Promise<BiometricResult> {
    try {
      // Vérifier la disponibilité
      const isAvailable = await this.isBiometricAvailable();
      if (!isAvailable) {
        return {
          success: false,
          error: 'Authentification biométrique non disponible'
        };
      }

      // Déclencher l'authentification
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Annuler',
        fallbackLabel: 'Utiliser le code',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Feedback de succès
        await this.successVibration();
        await this.playSuccessSound();
        
        console.log('✅ Authentification biométrique réussie');
        return {
          success: true,
          biometricType: 'biometric'
        };
      } else {
        // Feedback d'erreur
        await this.errorVibration();
        
        console.log('❌ Authentification biométrique échouée:', result.error);
        return {
          success: false,
          error: result.error || 'Authentification échouée'
        };
      }
    } catch (error) {
      console.error('❌ Erreur authentification biométrique:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Tester l'authentification biométrique
   */
  async testBiometricAuthentication(): Promise<void> {
    console.log('🧪 Test de l\'authentification biométrique...');
    
    const result = await this.authenticateWithBiometrics(
      'Test d\'authentification biométrique Mossombi'
    );
    
    if (result.success) {
      console.log('✅ Test biométrique réussi !');
    } else {
      console.log('❌ Test biométrique échoué:', result.error);
    }
  }

  // ==================== MÉTHODES COMBINÉES ====================

  /**
   * Feedback complet de succès (son + vibration)
   */
  async successFeedback(): Promise<void> {
    await Promise.all([
      this.playSuccessSound(),
      this.successVibration()
    ]);
  }

  /**
   * Feedback complet d'erreur (son + vibration)
   */
  async errorFeedback(): Promise<void> {
    await Promise.all([
      this.playErrorSound(),
      this.errorVibration()
    ]);
  }

  /**
   * Feedback de notification (son + vibration légère)
   */
  async notificationFeedback(): Promise<void> {
    await Promise.all([
      this.playNotificationSound(),
      this.lightVibration()
    ]);
  }

  /**
   * Feedback de sélection (vibration seulement)
   */
  async buttonFeedback(): Promise<void> {
    await this.selectionVibration();
  }

  // ==================== GETTERS ====================

  get soundEnabled(): boolean {
    return this.isSoundEnabled;
  }

  get vibrationEnabled(): boolean {
    return this.isVibrationEnabled;
  }

  /**
   * Nettoyer les ressources
   */
  async cleanup(): Promise<void> {
    await this.stopAllSounds();
    console.log('🧹 Service de feedback nettoyé');
  }
}

// Instance singleton
export const feedbackService = new FeedbackService();

// Types d'export
export type { LocalAuthentication };
export { Haptics, Audio };

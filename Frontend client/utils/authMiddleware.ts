/**
 * MIDDLEWARE D'AUTHENTIFICATION BIOMÉTRIQUE - MOSSOMBI
 * Centralise les vérifications biométriques pour les actions sensibles
 */

import { biometricService } from '@/services/biometricService';
import { Alert } from 'react-native';

export enum AuthLevel {
  LOW = 'low',           // Pas d'auth requise
  MEDIUM = 'medium',     // Auth si activée
  HIGH = 'high',         // Auth obligatoire si disponible
  CRITICAL = 'critical'  // Auth obligatoire + double vérification
}

export interface AuthContext {
  action: string;
  amount?: number;
  currency?: string;
  recipient?: string;
  description?: string;
}

class AuthMiddleware {
  /**
   * Vérifier si l'authentification est requise
   */
  async requireAuth(level: AuthLevel, context: AuthContext): Promise<boolean> {
    try {
      // Vérifier si la biométrie est activée
      const config = biometricService.getConfig();
      const availability = await biometricService.checkAvailability();

      // Niveau LOW : pas d'auth requise
      if (level === AuthLevel.LOW) {
        return true;
      }

      // Niveau MEDIUM : auth si activée
      if (level === AuthLevel.MEDIUM) {
        if (!config.enabled || !availability.available) {
          return true; // Continuer sans auth
        }
      }

      // Niveau HIGH/CRITICAL : auth obligatoire si disponible
      if (level === AuthLevel.HIGH || level === AuthLevel.CRITICAL) {
        if (!availability.available) {
          // Pas de biométrie disponible, demander confirmation alternative
          return await this.fallbackConfirmation(context);
        }
        
        if (!config.enabled) {
          Alert.alert(
            'Sécurité requise',
            'Cette action nécessite l\'authentification biométrique. Activez-la dans les paramètres.',
            [{ text: 'OK' }]
          );
          return false;
        }
      }

      // Effectuer l'authentification
      const message = this.buildAuthMessage(context);
      const result = await biometricService.authenticate(message);

      if (!result.success) {
        Alert.alert(
          'Authentification échouée',
          result.error || 'L\'authentification est requise pour cette action'
        );
        return false;
      }

      // Niveau CRITICAL : double vérification
      if (level === AuthLevel.CRITICAL) {
        return await this.doubleVerification(context);
      }

      return true;
    } catch (error) {
      console.error('❌ Erreur middleware auth:', error);
      return false;
    }
  }

  /**
   * Construire le message d'authentification contextuel
   */
  private buildAuthMessage(context: AuthContext): string {
    const { action, amount, currency, recipient } = context;

    if (amount && currency && recipient) {
      return `Confirmez ${action}: ${amount.toLocaleString()} ${currency} → ${recipient}`;
    }
    
    if (amount && currency) {
      return `Confirmez ${action}: ${amount.toLocaleString()} ${currency}`;
    }

    return `Confirmez: ${action}`;
  }

  /**
   * Confirmation alternative si pas de biométrie
   */
  private async fallbackConfirmation(context: AuthContext): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Confirmation requise',
        `Voulez-vous vraiment ${context.action.toLowerCase()} ?`,
        [
          { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Confirmer', style: 'destructive', onPress: () => resolve(true) }
        ]
      );
    });
  }

  /**
   * Double vérification pour les actions critiques
   */
  private async doubleVerification(context: AuthContext): Promise<boolean> {
    const secondResult = await biometricService.authenticate(
      `DOUBLE VÉRIFICATION: ${context.action}`
    );

    if (!secondResult.success) {
      Alert.alert(
        'Double vérification échouée',
        'Cette action critique nécessite une double authentification'
      );
      return false;
    }

    return true;
  }
}

export const authMiddleware = new AuthMiddleware();

// Helpers pour les cas d'usage courants
export const AuthHelpers = {
  // Transactions financières
  async validateTransaction(amount: number, currency: string, recipient: string): Promise<boolean> {
    return authMiddleware.requireAuth(AuthLevel.CRITICAL, {
      action: 'Envoi d\'argent',
      amount,
      currency,
      recipient
    });
  },

  // Retrait d'argent
  async validateWithdrawal(amount: number, currency: string): Promise<boolean> {
    return authMiddleware.requireAuth(AuthLevel.HIGH, {
      action: 'Retrait d\'argent',
      amount,
      currency
    });
  },

  // Accès au portefeuille
  async validateWalletAccess(): Promise<boolean> {
    return authMiddleware.requireAuth(AuthLevel.MEDIUM, {
      action: 'Accès au portefeuille'
    });
  },

  // Modification des paramètres sensibles
  async validateSettingsChange(settingName: string): Promise<boolean> {
    return authMiddleware.requireAuth(AuthLevel.HIGH, {
      action: `Modification ${settingName}`
    });
  },

  // Ouverture de l'app
  async validateAppAccess(): Promise<boolean> {
    return authMiddleware.requireAuth(AuthLevel.MEDIUM, {
      action: 'Accès à l\'application'
    });
  }
};

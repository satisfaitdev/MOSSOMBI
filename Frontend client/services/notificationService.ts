/**
 * SERVICE DE NOTIFICATIONS PUSH - MOSSOMBI
 * Gestion des notifications push avec Expo Notifications
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { feedbackService } from './feedbackService';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: boolean;
  badge?: number;
}

class NotificationService {
  private expoPushToken: string | null = null;

  /**
   * Initialiser le service de notifications
   */
  async initialize(): Promise<string | null> {
    try {
      // Expo Go: éviter l'enregistrement push distant (peut provoquer des erreurs Keychain sur iOS)
      // On garde uniquement les notifications locales.
      if (Constants.appOwnership === 'expo') {
        console.log('📱 Mode Expo Go détecté : notifications push distantes désactivées');
        await this.setupLocalNotifications();
        return 'local-only-mode';
      }

      // Vérifier si c'est un appareil physique
      if (!Device.isDevice) {
        console.log('📱 Mode développement : notifications locales seulement');
        await this.setupLocalNotifications();
        return 'local-dev-mode';
      }

      // Demander les permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Permission de notification refusée');
        return null;
      }

      // Essayer d'obtenir le token Expo Push (peut échouer en Expo Go)
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId || "550e8400-e29b-41d4-a716-446655440000";
        console.log('🔑 Tentative avec projectId:', projectId);
        
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: projectId,
        });

        this.expoPushToken = token.data;
        console.log('✅ Token Expo Push obtenu:', this.expoPushToken);

        // Configuration pour Android
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Mossombi Notifications',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
            sound: 'default',
          });
        }

        return this.expoPushToken;
      } catch (tokenError) {
        console.warn('⚠️ Impossible d\'obtenir le token Expo (normal en Expo Go)');
        console.warn('🔄 Basculement vers notifications locales uniquement');
        
        // Fallback : notifications locales seulement
        await this.setupLocalNotifications();
        return 'local-only-mode';
      }
    } catch (error) {
      console.error('Erreur initialisation notifications:', error);
      return null;
    }
  }

  /**
   * Configuration des notifications locales (fonctionne en Expo Go)
   */
  private async setupLocalNotifications(): Promise<void> {
    try {
      // Configuration pour Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Mossombi Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });
      }
      console.log('✅ Notifications locales configurées');
    } catch (error) {
      console.error('Erreur configuration notifications locales:', error);
    }
  }

  /**
   * Envoyer une notification locale immédiate
   */
  async sendLocalNotification(notification: NotificationData): Promise<string | null> {
    try {
      const content: any = {
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        sound: notification.sound !== false ? 'default' : undefined,
      };
      
      // Ajouter le badge seulement s'il est défini et valide
      if (notification.badge !== undefined && notification.badge !== null && typeof notification.badge === 'number') {
        content.badge = notification.badge;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content,
        trigger: null, // Immédiat
      });

      // Déclencher le feedback utilisateur (son + vibration)
      try {
        await feedbackService.notificationFeedback();
      } catch (feedbackError) {
        console.warn('Erreur feedback notification:', feedbackError);
      }

      console.log('Notification locale envoyée:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Erreur envoi notification locale:', error);
      return null;
    }
  }

  /**
   * Programmer une notification pour plus tard
   */
  async scheduleNotification(
    notification: NotificationData,
    trigger: Notifications.NotificationTriggerInput
  ): Promise<string | null> {
    try {
      const content: any = {
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        sound: notification.sound !== false ? 'default' : undefined,
      };
      
      // Ajouter le badge seulement s'il est défini et valide
      if (notification.badge !== undefined && notification.badge !== null && typeof notification.badge === 'number') {
        content.badge = notification.badge;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content,
        trigger,
      });

      console.log('Notification programmée:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Erreur programmation notification:', error);
      return null;
    }
  }

  /**
   * Annuler une notification programmée
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('Notification annulée:', notificationId);
    } catch (error) {
      console.error('Erreur annulation notification:', error);
    }
  }

  /**
   * Annuler toutes les notifications programmées
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Toutes les notifications annulées');
    } catch (error) {
      console.error('Erreur annulation toutes notifications:', error);
    }
  }

  /**
   * Obtenir le token Expo Push
   */
  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Vérifier les permissions
   */
  async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Erreur vérification permissions:', error);
      return false;
    }
  }

  /**
   * Exemples de notifications pour les tests
   */
  async sendTestNotifications(): Promise<void> {
    // Notification immédiate
    await this.sendLocalNotification({
      title: '🎉 Test Mossombi',
      body: 'Ceci est une notification de test !',
      data: { type: 'test', timestamp: Date.now() },
    });

    // Notification dans 5 secondes
    await this.scheduleNotification(
      {
        title: '⏰ Notification programmée',
        body: 'Cette notification était programmée pour dans 5 secondes !',
        data: { type: 'scheduled', delay: 5 },
      },
      { seconds: 5 } as any
    );

    // Notification dans 10 secondes avec badge valide
    await this.scheduleNotification(
      {
        title: '🔔 Rappel Mossombi',
        body: 'N\'oubliez pas de vérifier votre portefeuille !',
        data: { type: 'reminder', category: 'wallet' },
        badge: 1, // Badge valide
      },
      { seconds: 10 } as any
    );
  }
}

// Instance singleton
export const notificationService = new NotificationService();

// Types d'export
export type { NotificationTriggerInput } from 'expo-notifications';
export { Notifications };

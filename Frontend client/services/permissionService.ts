/**
 * SERVICE DE GESTION DES PERMISSIONS - MOSSOMBI
 * Gestion des permissions système (Camera, Microphone, Location, Notifications)
 */

import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import * as Notifications from 'expo-notifications';
import { Alert, Linking, Platform } from 'react-native';

export interface PermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}

class PermissionService {
  
  /**
   * 🔔 GESTION DES NOTIFICATIONS PUSH
   */
  async requestNotificationPermission(): Promise<PermissionStatus> {
    try {
      const { status, canAskAgain } = await Notifications.requestPermissionsAsync();
      
      return {
        granted: status === 'granted',
        canAskAgain,
        status
      };
    } catch (error) {
      console.error('Erreur permission notifications:', error);
      return { granted: false, canAskAgain: false, status: 'error' };
    }
  }

  async checkNotificationPermission(): Promise<PermissionStatus> {
    try {
      const { status, canAskAgain } = await Notifications.getPermissionsAsync();
      
      return {
        granted: status === 'granted',
        canAskAgain,
        status
      };
    } catch (error) {
      console.error('Erreur vérification notifications:', error);
      return { granted: false, canAskAgain: false, status: 'error' };
    }
  }

  /**
   * 📍 GESTION DE LA LOCALISATION
   */
  async requestLocationPermission(): Promise<PermissionStatus> {
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      
      return {
        granted: status === 'granted',
        canAskAgain,
        status
      };
    } catch (error) {
      console.error('Erreur permission localisation:', error);
      return { granted: false, canAskAgain: false, status: 'error' };
    }
  }

  async checkLocationPermission(): Promise<PermissionStatus> {
    try {
      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
      
      return {
        granted: status === 'granted',
        canAskAgain,
        status
      };
    } catch (error) {
      console.error('Erreur vérification localisation:', error);
      return { granted: false, canAskAgain: false, status: 'error' };
    }
  }

  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const permission = await this.checkLocationPermission();
      if (!permission.granted) {
        throw new Error('Permission de localisation refusée');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return location;
    } catch (error) {
      console.error('Erreur obtention localisation:', error);
      return null;
    }
  }

  /**
   * 📷 GESTION DE LA CAMÉRA
   */
  async requestCameraPermission(): Promise<PermissionStatus> {
    try {
      const { status, canAskAgain } = await Camera.requestCameraPermissionsAsync();
      
      return {
        granted: status === 'granted',
        canAskAgain,
        status
      };
    } catch (error) {
      console.error('Erreur permission caméra:', error);
      return { granted: false, canAskAgain: false, status: 'error' };
    }
  }

  async checkCameraPermission(): Promise<PermissionStatus> {
    try {
      const permission = await Camera.getCameraPermissionsAsync();
      
      return {
        granted: permission.granted,
        canAskAgain: permission.canAskAgain,
        status: permission.status
      };
    } catch (error) {
      console.error('Erreur vérification caméra:', error);
      return { granted: false, canAskAgain: false, status: 'error' };
    }
  }

  /**
   * 🎤 GESTION DU MICROPHONE
   */
  async requestMicrophonePermission(): Promise<PermissionStatus> {
    try {
      const permission = await Camera.requestMicrophonePermissionsAsync();
      
      return {
        granted: permission.granted,
        canAskAgain: permission.canAskAgain,
        status: permission.status
      };
    } catch (error) {
      console.error('Erreur permission microphone:', error);
      return { granted: false, canAskAgain: false, status: 'error' };
    }
  }

  async checkMicrophonePermission(): Promise<PermissionStatus> {
    try {
      const permission = await Camera.getMicrophonePermissionsAsync();
      
      return {
        granted: permission.granted,
        canAskAgain: permission.canAskAgain,
        status: permission.status
      };
    } catch (error) {
      console.error('Erreur vérification microphone:', error);
      return { granted: false, canAskAgain: false, status: 'error' };
    }
  }

  /**
   * 📊 GESTION DES ANALYTICS (Simulation)
   */
  async enableAnalytics(): Promise<boolean> {
    try {
      // Simulation d'activation des analytics
      console.log('📊 Analytics activés - Collecte de données anonymes démarrée');
      
      // Ici on pourrait intégrer Firebase Analytics, Mixpanel, etc.
      // await analytics().setAnalyticsCollectionEnabled(true);
      
      return true;
    } catch (error) {
      console.error('Erreur activation analytics:', error);
      return false;
    }
  }

  async disableAnalytics(): Promise<boolean> {
    try {
      // Simulation de désactivation des analytics
      console.log('📊 Analytics désactivés - Arrêt de la collecte de données');
      
      // Ici on pourrait désactiver les analytics
      // await analytics().setAnalyticsCollectionEnabled(false);
      
      return true;
    } catch (error) {
      console.error('Erreur désactivation analytics:', error);
      return false;
    }
  }

  /**
   * ⚙️ OUVRIR LES PARAMÈTRES SYSTÈME
   */
  async openAppSettings(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('Erreur ouverture paramètres:', error);
      Alert.alert(
        'Erreur',
        'Impossible d\'ouvrir les paramètres. Veuillez les ouvrir manuellement.'
      );
    }
  }

  /**
   * 🔄 VÉRIFIER TOUTES LES PERMISSIONS
   */
  async checkAllPermissions(): Promise<{
    notifications: PermissionStatus;
    location: PermissionStatus;
    camera: PermissionStatus;
    microphone: PermissionStatus;
  }> {
    const [notifications, location, camera, microphone] = await Promise.all([
      this.checkNotificationPermission(),
      this.checkLocationPermission(),
      this.checkCameraPermission(),
      this.checkMicrophonePermission(),
    ]);

    return {
      notifications,
      location,
      camera,
      microphone,
    };
  }
}

// Instance singleton
export const permissionService = new PermissionService();

// Types d'export
export type { LocationObject } from 'expo-location';

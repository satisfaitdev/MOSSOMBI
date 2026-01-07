import React, { useState, useEffect } from 'react';
import { View, Switch, Pressable, Alert, Linking, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bell, Eye, MapPin, Camera, Mic, Database, Download, Trash2 } from 'lucide-react-native';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@/constants/colors';
import { COMMON_STYLES } from '@/constants/styles';
import { Heading, Body, Caption } from '@/components/atoms';
import { Stack, Row } from '@/components/ui';
import { PageContainer } from '@/components/layouts';
import { useSuccessModal } from '@/hooks';
import { usePrivacySettings } from '@/hooks/usePrivacySettings';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { notificationService } from '@/services/notificationService';
import { permissionService } from '@/services/permissionService';
import Button from '@/components/Button';
import { SuccessModal } from '@/components/organisms/modals';
import DeleteAccountModal from '@/components/DeleteAccountModal';
import LoadingPopup from '@/components/LoadingPopup';

// ==========================================
// CONSTANTES DE TEXTE (À DÉPLACER VERS LES TRADUCTIONS)
// ==========================================
const PRIVACY_TEXTS = {
  title: 'Confidentialité',
  headerTitle: 'Vos données, votre contrôle',
  headerDescription: 'Gérez comment vos données sont collectées et utilisées dans l\'application Mossombi.',
  loadingText: 'Chargement des paramètres...',
  
  // Sections
  dataCollection: 'Collecte de données',
  permissions: 'Autorisations',
  dataManagement: 'Gestion des données',
  
  // Paramètres
  analytics: 'Analyses et statistiques',
  analyticsDesc: 'Aider à améliorer l\'application',
  notifications: 'Notifications push',
  notificationsDesc: 'Recevoir des alertes importantes',
  location: 'Localisation',
  locationDesc: 'Pour les services basés sur la position',
  camera: 'Appareil photo',
  cameraDesc: 'Pour scanner les QR codes et prendre des photos',
  microphone: 'Microphone',
  microphoneDesc: 'Pour les appels vocaux et messages audio',
  
  // Actions
  savePreferences: 'Enregistrer les préférences',
  exportData: 'Exporter mes données',
  deleteAccount: 'Supprimer mon compte',
  privacyPolicy: 'Lire notre politique de confidentialité complète',
  
  // Messages
  saveSuccess: 'Préférences sauvegardées avec succès !',
  exportSuccess: 'Données exportées avec succès !',
  deleteSuccess: 'Compte supprimé avec succès.',
  saveError: 'Une erreur est survenue.',
  exportError: 'Impossible d\'exporter les données.',
  deleteError: 'Impossible de supprimer le compte.',
};

export default function PrivacyScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const { wallet } = useWallet();
  const [permissionStates, setPermissionStates] = useState({
    notifications: false,
    location: false,
    camera: false,
    microphone: false,
  });
  
  // État pour tracker les toggles explicitement désactivés par l'utilisateur
  const [userDisabledToggles, setUserDisabledToggles] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ==========================================
  // FONCTION POUR OBTENIR LES TEXTES TRADUITS
  // ==========================================
  const getText = (key: keyof typeof PRIVACY_TEXTS) => {
    // Mapping des clés vers les nouvelles clés de traduction
    const keyMapping: Record<keyof typeof PRIVACY_TEXTS, string> = {
      title: 'privacyTitle',
      headerTitle: 'privacyHeaderTitle',
      headerDescription: 'privacyHeaderDescription',
      loadingText: 'privacyLoadingText',
      dataCollection: 'privacyDataCollection',
      permissions: 'privacyPermissions',
      dataManagement: 'privacyDataManagement',
      analytics: 'privacyAnalytics',
      analyticsDesc: 'privacyAnalyticsDesc',
      notifications: 'privacyNotifications',
      notificationsDesc: 'privacyNotificationsDesc',
      location: 'privacyLocation',
      locationDesc: 'privacyLocationDesc',
      camera: 'privacyCamera',
      cameraDesc: 'privacyCameraDesc',
      microphone: 'privacyMicrophone',
      microphoneDesc: 'privacyMicrophoneDesc',
      savePreferences: 'privacySavePreferences',
      exportData: 'privacyExportData',
      deleteAccount: 'privacyDeleteAccount',
      privacyPolicy: 'privacyPolicy',
      saveSuccess: 'privacySaveSuccess',
      exportSuccess: 'privacyExportSuccess',
      deleteSuccess: 'privacyDeleteSuccess',
      saveError: 'privacySaveError',
      exportError: 'privacyExportError',
      deleteError: 'privacyDeleteError',
    };
    
    // Utiliser les traductions avec fallback sur les constantes
    return t(keyMapping[key] as any) || PRIVACY_TEXTS[key];
  };
  const {
    settings,
    isLoading,
    isSaving,
    updateSetting,
    saveToBackend,
    deleteAccount,
  } = usePrivacySettings();
  const successModal = useSuccessModal({ autoClose: true });

  // ==========================================
  // SYNCHRONISATION DES PERMISSIONS AU CHARGEMENT
  // ==========================================
  useEffect(() => {
    const syncPermissions = async () => {
      try {
        const permissions = await permissionService.checkAllPermissions();
        
        // Mettre à jour l'état des permissions réelles
        setPermissionStates({
          notifications: permissions.notifications.granted,
          location: permissions.location.granted,
          camera: permissions.camera.granted,
          microphone: permissions.microphone.granted,
        });

        // Synchroniser les settings avec les permissions réelles
        // MAIS respecter les choix explicites de l'utilisateur
        const needsUpdate = {
          pushNotifications: permissions.notifications.granted,
          locationSharing: permissions.location.granted,
          cameraAccess: permissions.camera.granted,
          microphoneAccess: permissions.microphone.granted,
        };

        // Mettre à jour seulement si différent ET si l'utilisateur n'a pas explicitement désactivé
        Object.entries(needsUpdate).forEach(([key, value]) => {
          const currentValue = settings[key as keyof typeof settings];
          const userExplicitlyDisabled = userDisabledToggles.has(key);
          
          // Ne synchroniser que si :
          // 1. La valeur a changé
          // 2. L'utilisateur n'a pas explicitement désactivé ce toggle
          // 3. OU si la permission système a été révoquée (toujours désactiver dans ce cas)
          if (currentValue !== value && (!userExplicitlyDisabled || !value)) {
            console.log(`🔄 Synchronisation ${key}: ${currentValue} → ${value} ${userExplicitlyDisabled ? '(forcée car permission révoquée)' : ''}`);
            updateSetting(key as any, value);
          } else if (userExplicitlyDisabled && value) {
            console.log(`⏸️ Synchronisation ignorée pour ${key}: utilisateur l'a explicitement désactivé`);
          }
        });

      } catch (error) {
        console.error('Erreur synchronisation permissions:', error);
      }
    };

    // Synchroniser au chargement et quand les settings changent
    if (!isLoading) {
      syncPermissions();
    }
  }, [isLoading]); // Dépendance sur isLoading pour éviter les conflits

  // ==========================================
  // FONCTION POUR OBTENIR L'ÉTAT DES PERMISSIONS
  // ==========================================
  const getPermissionStatus = (key: string): boolean => {
    switch (key) {
      case 'pushNotifications':
        return permissionStates.notifications;
      case 'locationSharing':
        return permissionStates.location;
      case 'cameraAccess':
        return permissionStates.camera;
      case 'microphoneAccess':
        return permissionStates.microphone;
      default:
        return true; // Pour les autres paramètres qui ne nécessitent pas de permissions système
    }
  };

  const handleSavePreferences = async () => {
    try {
      await saveToBackend();
      successModal.show({
        title: 'Succès !',
        message: getText('saveSuccess'),
        animation: 'checkmark',
      });
    } catch (error) {
      Alert.alert('Erreur', getText('saveError'));
    }
  };

  // ==========================================
  // FONCTION POUR COLLECTER TOUTES LES DONNÉES UTILISATEUR
  // ==========================================
  const collectUserData = async () => {
    try {
      // Collecter les données depuis AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      const allData = await AsyncStorage.multiGet(allKeys);
      const storageData: Record<string, any> = {};
      
      allData.forEach(([key, value]) => {
        try {
          storageData[key] = value ? JSON.parse(value) : value;
        } catch {
          storageData[key] = value; // Si ce n'est pas du JSON, garder tel quel
        }
      });

      // Données complètes de l'utilisateur
      const userData = {
        // Informations personnelles
        profile: {
          id: user?.id,
          email: user?.email,
          phone: user?.phone,
          fullName: user?.full_name,
          userIdDisplay: user?.user_id_display,
          createdAt: user?.created_at,
          // updatedAt: user?.updated_at, // Propriété non disponible
        },
        
        // Données du portefeuille
        wallet: {
          balance: wallet?.balance,
          currency: wallet?.currency,
          status: wallet?.status,
          points: wallet?.points,
          statistics: wallet?.statistics,
          recentTransactions: wallet?.recentTransactions || [],
          isLoading: wallet?.isLoading,
          error: wallet?.error,
        },
        
        // Paramètres de confidentialité
        privacySettings: settings,
        
        // Données locales (AsyncStorage)
        localStorage: storageData,
        
        // Métadonnées de l'export
        exportInfo: {
          exportDate: new Date().toISOString(),
          appVersion: '1.0.0', // À récupérer depuis app.config.js
          platform: 'mobile',
          language: t('home'), // Utiliser une clé pour détecter la langue
        }
      };

      return userData;
    } catch (error) {
      console.error('Erreur collecte données:', error);
      throw error;
    }
  };

  const handleExportData = async () => {
    try {
      Alert.alert(
        getText('exportData'),
        'Voulez-vous télécharger une copie de toutes vos données personnelles ?',
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: 'Télécharger',
            onPress: async () => {
              try {
                // Afficher un indicateur de chargement
                successModal.show({
                  title: 'Export en cours...',
                  message: 'Collecte de vos données...',
                  animation: 'sparkles',
                });

                // Collecter toutes les données utilisateur
                const userData = await collectUserData();
                
                // Simuler un délai pour l'export
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Créer le fichier JSON
                const jsonData = JSON.stringify(userData, null, 2);
                const fileName = `mossombi-data-${user?.user_id_display || 'user'}-${new Date().toISOString().split('T')[0]}.json`;
                
                // Utiliser l'API Share native avec le contenu JSON
                await Share.share({
                  message: `📱 EXPORT DONNÉES MOSSOMBI 📱\n\nUtilisateur: ${user?.full_name || 'Utilisateur'}\nID: ${user?.user_id_display || 'N/A'}\nDate: ${new Date().toLocaleDateString()}\n\n📊 DONNÉES COMPLÈTES:\n${jsonData}`,
                  title: `Export Mossombi - ${fileName}`,
                }, {
                  dialogTitle: 'Sauvegarder vos données',
                  subject: `Export Mossombi - ${fileName}`,
                });
                
                // Log pour debug
                console.log('📤 Export réussi:', {
                  fileName,
                  dataSize: jsonData.length,
                  userID: user?.user_id_display,
                  timestamp: new Date().toISOString()
                });
                
                successModal.show({
                  title: 'Export terminé !',
                  message: getText('exportSuccess'),
                  animation: 'checkmark',
                });

                console.log('Données exportées:', userData);
                
              } catch (error) {
                console.error('Erreur export:', error);
                Alert.alert('Erreur', getText('exportError'));
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Erreur', getText('saveError'));
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async (password: string) => {
    try {
      await deleteAccount(password);
      
      // Notification de succès avec déconnexion automatique
      Alert.alert(
        '✅ Compte supprimé avec succès', 
        'Votre compte a été supprimé et vos données locales ont été effacées. Vous allez être déconnecté automatiquement.',
        [
          { 
            text: 'OK', 
            onPress: async () => {
              try {
                // Déconnexion automatique via AuthContext
                console.log('🚪 Déconnexion automatique après suppression...');
                await logout();
                console.log('✅ Déconnexion réussie - Redirection vers login');
              } catch (logoutError) {
                console.error('❌ Erreur lors de la déconnexion:', logoutError);
                // Même en cas d'erreur de déconnexion, on force la redirection
                // Le nettoyage des données a déjà été fait par deleteAccount
              }
            }
          }
        ]
      );
    } catch (error) {
      throw error; // Laisser la modal gérer l'erreur
    }
  };

  // Fonction spéciale pour gérer les changements de paramètres avec actions réelles
  const handleSettingChange = async (key: string, value: boolean) => {
    switch (key) {
      case 'locationSharing':
        await handleLocationPermission(value);
        break;
        
      case 'cameraAccess':
        await handleCameraPermission(value);
        break;
        
      case 'microphoneAccess':
        await handleMicrophonePermission(value);
        break;
        
      case 'pushNotifications':
        await handleNotificationPermission(value);
        break;
        
      case 'activityTracking':
        await handleAnalyticsPermission(value);
        break;
        
      default:
        // Pour les autres paramètres, changement direct
        updateSetting(key as any, value);
        break;
    }
  };

  // 📍 GESTION LOCALISATION
  const handleLocationPermission = async (enable: boolean) => {
    if (enable) {
      try {
        const permission = await permissionService.requestLocationPermission();
        
        if (permission.granted) {
          updateSetting('locationSharing', true);
          
          // Mettre à jour l'état local et retirer de la liste des désactivés
          setPermissionStates(prev => ({ ...prev, location: true }));
          setUserDisabledToggles(prev => {
            const newSet = new Set(prev);
            newSet.delete('locationSharing');
            return newSet;
          });
          
          // Obtenir la position actuelle pour démonstration
          const location = await permissionService.getCurrentLocation();
          
          successModal.show({
            title: '📍 Localisation activée',
            message: location 
              ? `Position obtenue : ${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`
              : 'Services de localisation activés avec succès !',
            animation: 'checkmark',
          });
        } else {
          // Permission refusée, garder le toggle désactivé
          updateSetting('locationSharing', false);
          Alert.alert(
            'Permission refusée',
            'Pour activer la localisation, veuillez autoriser l\'accès dans les paramètres.',
            [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Paramètres', onPress: () => permissionService.openAppSettings() }
            ]
          );
        }
      } catch (error) {
        console.error('Erreur localisation:', error);
        updateSetting('locationSharing', false);
        Alert.alert('Erreur', 'Impossible d\'activer la localisation');
      }
    } else {
      // DÉSACTIVATION : Marquer comme explicitement désactivé par l'utilisateur
      updateSetting('locationSharing', false);
      setPermissionStates(prev => ({ ...prev, location: false }));
      setUserDisabledToggles(prev => new Set([...prev, 'locationSharing']));
      
      Alert.alert(
        '📍 Localisation désactivée',
        'Les services de localisation sont maintenant désactivés dans l\'application.\n\n💡 Pour désactiver complètement, allez dans Paramètres > Confidentialité > Services de localisation.',
        [
          { text: 'OK', style: 'default' },
          { text: 'Paramètres', onPress: () => permissionService.openAppSettings() }
        ]
      );
    }
  };

  // 📷 GESTION CAMÉRA
  const handleCameraPermission = async (enable: boolean) => {
    if (enable) {
      try {
        const permission = await permissionService.requestCameraPermission();
        
        if (permission.granted) {
          updateSetting('cameraAccess', true);
          setPermissionStates(prev => ({ ...prev, camera: true }));
          setUserDisabledToggles(prev => {
            const newSet = new Set(prev);
            newSet.delete('cameraAccess');
            return newSet;
          });
          
          successModal.show({
            title: '📷 Caméra activée',
            message: 'Vous pouvez maintenant scanner des QR codes et prendre des photos !',
            animation: 'checkmark',
          });
        } else {
          updateSetting('cameraAccess', false);
          Alert.alert(
            'Permission refusée',
            'Pour activer la caméra, veuillez autoriser l\'accès dans les paramètres.',
            [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Paramètres', onPress: () => permissionService.openAppSettings() }
            ]
          );
        }
      } catch (error) {
        console.error('Erreur caméra:', error);
        updateSetting('cameraAccess', false);
        Alert.alert('Erreur', 'Impossible d\'activer la caméra');
      }
    } else {
      // DÉSACTIVATION : Mise à jour interface + feedback
      updateSetting('cameraAccess', false);
      setPermissionStates(prev => ({ ...prev, camera: false }));
      setUserDisabledToggles(prev => new Set([...prev, 'cameraAccess']));
      
      Alert.alert(
        '📷 Caméra désactivée',
        'L\'accès à la caméra est maintenant désactivé dans l\'application.\n\n💡 Pour désactiver complètement, allez dans Paramètres > Confidentialité > Appareil photo.',
        [
          { text: 'OK', style: 'default' },
          { text: 'Paramètres', onPress: () => permissionService.openAppSettings() }
        ]
      );
    }
  };

  // 🎤 GESTION MICROPHONE
  const handleMicrophonePermission = async (enable: boolean) => {
    if (enable) {
      try {
        const permission = await permissionService.requestMicrophonePermission();
        
        if (permission.granted) {
          updateSetting('microphoneAccess', true);
          setPermissionStates(prev => ({ ...prev, microphone: true }));
          setUserDisabledToggles(prev => {
            const newSet = new Set(prev);
            newSet.delete('microphoneAccess');
            return newSet;
          });
          
          successModal.show({
            title: '🎤 Microphone activé',
            message: 'Vous pouvez maintenant enregistrer des messages audio et passer des appels !',
            animation: 'checkmark',
          });
        } else {
          updateSetting('microphoneAccess', false);
          Alert.alert(
            'Permission refusée',
            'Pour activer le microphone, veuillez autoriser l\'accès dans les paramètres.',
            [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Paramètres', onPress: () => permissionService.openAppSettings() }
            ]
          );
        }
      } catch (error) {
        console.error('Erreur microphone:', error);
        updateSetting('microphoneAccess', false);
        Alert.alert('Erreur', 'Impossible d\'activer le microphone');
      }
    } else {
      // DÉSACTIVATION : Mise à jour interface + feedback
      updateSetting('microphoneAccess', false);
      setPermissionStates(prev => ({ ...prev, microphone: false }));
      setUserDisabledToggles(prev => new Set([...prev, 'microphoneAccess']));
      
      Alert.alert(
        '🎤 Microphone désactivé',
        'L\'accès au microphone est maintenant désactivé dans l\'application.\n\n💡 Pour désactiver complètement, allez dans Paramètres > Confidentialité > Microphone.',
        [
          { text: 'OK', style: 'default' },
          { text: 'Paramètres', onPress: () => permissionService.openAppSettings() }
        ]
      );
    }
  };

  // 🔔 GESTION NOTIFICATIONS
  const handleNotificationPermission = async (enable: boolean) => {
    if (enable) {
      try {
        const permission = await permissionService.requestNotificationPermission();
        
        if (permission.granted) {
          updateSetting('pushNotifications', true);
          setPermissionStates(prev => ({ ...prev, notifications: true }));
          setUserDisabledToggles(prev => {
            const newSet = new Set(prev);
            newSet.delete('pushNotifications');
            return newSet;
          });
          
          // Initialiser le service de notifications
          await notificationService.initialize();
          
          successModal.show({
            title: '🔔 Notifications activées',
            message: 'Vous recevrez maintenant les notifications importantes !',
            animation: 'checkmark',
          });
        } else {
          updateSetting('pushNotifications', false);
          Alert.alert(
            'Permission refusée',
            'Pour activer les notifications, veuillez autoriser l\'accès dans les paramètres.',
            [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Paramètres', onPress: () => permissionService.openAppSettings() }
            ]
          );
        }
      } catch (error) {
        console.error('Erreur notifications:', error);
        updateSetting('pushNotifications', false);
        Alert.alert('Erreur', 'Impossible d\'activer les notifications');
      }
    } else {
      // DÉSACTIVATION : Mise à jour interface + annulation notifications
      updateSetting('pushNotifications', false);
      setPermissionStates(prev => ({ ...prev, notifications: false }));
      setUserDisabledToggles(prev => new Set([...prev, 'pushNotifications']));
      
      // Annuler toutes les notifications programmées
      notificationService.cancelAllNotifications();
      
      Alert.alert(
        '🔔 Notifications désactivées',
        'Les notifications push sont maintenant désactivées dans l\'application.\n\n💡 Pour désactiver complètement, allez dans Paramètres > Notifications.',
        [
          { text: 'OK', style: 'default' },
          { text: 'Paramètres', onPress: () => permissionService.openAppSettings() }
        ]
      );
    }
  };

  // 📊 GESTION ANALYTICS
  const handleAnalyticsPermission = async (enable: boolean) => {
    if (enable) {
      try {
        const success = await permissionService.enableAnalytics();
        
        if (success) {
          updateSetting('activityTracking', true);
          successModal.show({
            title: '📊 Analytics activés',
            message: 'Vos données anonymes nous aideront à améliorer l\'application !',
            animation: 'checkmark',
          });
        } else {
          Alert.alert('Erreur', 'Impossible d\'activer les analytics');
        }
      } catch (error) {
        console.error('Erreur analytics:', error);
        Alert.alert('Erreur', 'Impossible d\'activer les analytics');
      }
    } else {
      Alert.alert(
        'Désactiver les analyses',
        'En désactivant les analyses, vous nous aidez moins à améliorer l\'application. Êtes-vous sûr ?',
        [
          { text: t('cancel'), style: 'cancel' },
          { 
            text: 'Désactiver', 
            style: 'destructive',
            onPress: async () => {
              try {
                await permissionService.disableAnalytics();
                updateSetting('activityTracking', false);
                successModal.show({
                  title: '📊 Analytics désactivés',
                  message: 'La collecte de données anonymes est maintenant arrêtée.',
                  animation: 'checkmark',
                });
              } catch (error) {
                console.error('Erreur désactivation analytics:', error);
                Alert.alert('Erreur', 'Impossible de désactiver les analytics');
              }
            }
          }
        ]
      );
    }
  };

  const handleOpenPrivacyPolicy = async () => {
    try {
      // URL de la politique de confidentialité (à remplacer par la vraie URL)
      const privacyPolicyUrl = 'https://mossombi.com/privacy-policy';
      
      // Vérifier si l'URL peut être ouverte
      const supported = await Linking.canOpenURL(privacyPolicyUrl);
      
      if (supported) {
        await Linking.openURL(privacyPolicyUrl);
      } else {
        // Fallback : afficher le contenu dans une modal ou naviguer vers une page interne
        Alert.alert(
          'Politique de confidentialité',
          'Notre politique de confidentialité détaille comment nous collectons, utilisons et protégeons vos données personnelles.\n\nPour plus d\'informations, visitez notre site web ou contactez notre support.',
          [
            { text: 'OK', style: 'default' },
            { 
              text: 'Contacter le support', 
              onPress: () => {
                // Ouvrir l'email ou la page de contact
                Linking.openURL('mailto:support@mossombi.com?subject=Question sur la politique de confidentialité');
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Erreur ouverture politique:', error);
      Alert.alert('Erreur', 'Impossible d\'ouvrir la politique de confidentialité');
    }
  };

  if (isLoading) {
    return (
      <>
        <PageContainer>
          <HeaderWithBackButton title={getText('title')} />
          <View style={{ flex: 1 }} />
        </PageContainer>
        <LoadingPopup visible={true} />
      </>
    );
  }

  // ==========================================
  // COMPOSANT PRIVACY TOGGLE RÉUTILISABLE
  // ==========================================
  interface PrivacyToggleProps {
    icon: React.ReactNode;
    title: string;
    description?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    settingKey?: string; // Clé pour identifier le type de permission
  }

  const PrivacyToggle = ({ icon, title, description, value, onValueChange, settingKey }: PrivacyToggleProps) => (
    <View style={[
      COMMON_STYLES.card,
      {
        backgroundColor: colors.card,
        borderColor: colors.border,
        padding: SPACING.md,
      }
    ]}>
      <Row justify="space-between" align="center">
        <Row spacing="md" align="center" style={{ flex: 1 }}>
          <View style={{
            backgroundColor: colors.primary + '20',
            width: 40,
            height: 40,
            borderRadius: BORDER_RADIUS.md,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {icon}
          </View>
          <View style={{ flex: 1 }}>
            <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold, color: colors.text }}>
              {title}
            </Body>
            {description && (
              <Caption style={{ 
                marginTop: SPACING.xs / 2,
                color: colors.textSecondary 
              }}>
                {description}
              </Caption>
            )}
          </View>
        </Row>
        <View style={{ alignItems: 'center' }}>
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: colors.border, true: colors.primary + '80' }}
            thumbColor={value ? colors.primary : colors.surface}
          />
          {/* Indicateur d'état des permissions réelles */}
          {(settingKey === 'pushNotifications' || settingKey === 'locationSharing' || 
            settingKey === 'cameraAccess' || settingKey === 'microphoneAccess') && (
            <Caption style={{ 
              fontSize: 10, 
              color: getPermissionStatus(settingKey) ? colors.success : colors.error,
              marginTop: 2,
              textAlign: 'center'
            }}>
              {getPermissionStatus(settingKey) ? 
                (value ? '✅ Actif' : '🔒 Système OK') : 
                '❌ Refusé'
              }
            </Caption>
          )}
        </View>
      </Row>
    </View>
  );

  // ==========================================
  // DONNÉES DE CONFIGURATION DES PARAMÈTRES
  // ==========================================
  const privacySettings = [
    {
      section: getText('permissions'),
      items: [
        {
          key: 'locationSharing',
          icon: <MapPin size={20} color={colors.primary} />,
          title: getText('location'),
          description: getText('locationDesc'),
        },
        {
          key: 'cameraAccess',
          icon: <Camera size={20} color={colors.primary} />,
          title: getText('camera'),
          description: getText('cameraDesc'),
        },
        {
          key: 'microphoneAccess',
          icon: <Mic size={20} color={colors.primary} />,
          title: getText('microphone'),
          description: getText('microphoneDesc'),
        },
      ]
    },
    {
      section: getText('dataCollection'),
      items: [
        {
          key: 'activityTracking',
          icon: <Database size={20} color={colors.primary} />,
          title: getText('analytics'),
          description: getText('analyticsDesc'),
        },
        {
          key: 'pushNotifications',
          icon: <Bell size={20} color={colors.primary} />,
          title: getText('notifications'),
          description: getText('notificationsDesc'),
        },
      ]
    }
  ];

  return (
    <PageContainer>
      <HeaderWithBackButton title={getText('title')} />
      <Stack spacing="xl" style={{ marginTop: SPACING.lg }}>
          {/* En-tête avec informations */}
          <View style={[
            COMMON_STYLES.card,
            {
              backgroundColor: colors.primary + '10',
              borderColor: colors.primary + '30',
              padding: SPACING.md,
            }
          ]}>
            <Row spacing="sm" align="flex-start">
              <Eye size={20} color={colors.primary} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Body style={{ 
                  fontWeight: TYPOGRAPHY.weights.semibold, 
                  color: colors.primary, 
                  marginBottom: SPACING.xs 
                }}>
                  {getText('headerTitle')}
                </Body>
                <Caption style={{ color: colors.textSecondary }}>
                  {getText('headerDescription')}
                </Caption>
              </View>
            </Row>
          </View>

          {/* Sections de paramètres */}
          {privacySettings.map((section, sectionIndex) => (
            <View key={sectionIndex}>
              <Heading level={3} style={{ marginBottom: SPACING.md, color: colors.text }}>
                {section.section}
              </Heading>
              <Stack spacing="sm">
                {section.items.map((item) => (
                  <PrivacyToggle
                    key={item.key}
                    icon={item.icon}
                    title={item.title}
                    description={item.description}
                    value={settings[item.key as keyof typeof settings] as boolean}
                    onValueChange={(value) => handleSettingChange(item.key, value)}
                    settingKey={item.key}
                  />
                ))}
              </Stack>
            </View>
          ))}

          {/* Actions de gestion des données */}
          <View>
            <Heading level={3} style={{ marginBottom: SPACING.md, color: colors.text }}>
              {getText('dataManagement')}
            </Heading>
            <Stack spacing="sm">
              {/* Bouton Exporter */}
              <Pressable
                onPress={handleExportData}
                style={[
                  COMMON_STYLES.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    padding: SPACING.md,
                  }
                ]}
              >
                <Row spacing="md" align="center">
                  <View style={{
                    width: 40,
                    height: 40,
                    backgroundColor: colors.success + '20',
                    borderRadius: BORDER_RADIUS.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Download size={20} color={colors.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold, color: colors.text }}>
                      {getText('exportData')}
                    </Body>
                    <Caption style={{ color: colors.textSecondary }}>
                      Télécharger une copie de vos données
                    </Caption>
                  </View>
                </Row>
              </Pressable>

              {/* Bouton Supprimer compte */}
              <Pressable
                onPress={handleDeleteAccount}
                style={[
                  COMMON_STYLES.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.error + '30',
                    padding: SPACING.md,
                  }
                ]}
              >
                <Row spacing="md" align="center">
                  <View style={{
                    width: 40,
                    height: 40,
                    backgroundColor: colors.error + '20',
                    borderRadius: BORDER_RADIUS.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Trash2 size={20} color={colors.error} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold, color: colors.error }}>
                      {getText('deleteAccount')}
                    </Body>
                    <Caption style={{ color: colors.textSecondary }}>
                      Supprimer définitivement votre compte
                    </Caption>
                  </View>
                </Row>
              </Pressable>

            </Stack>
          </View>

          {/* Bouton d'enregistrement */}
          <Button
            title={getText('savePreferences')}
            onPress={handleSavePreferences}
            loading={isSaving}
            variant="gradient"
          />

          {/* Lien politique de confidentialité */}
          <Pressable
            onPress={handleOpenPrivacyPolicy}
            style={({ pressed }) => ({
              padding: SPACING.sm,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Caption style={{ 
              textAlign: 'center', 
              color: colors.primary, 
              textDecorationLine: 'underline' 
            }}>
              {getText('privacyPolicy')}
            </Caption>
          </Pressable>
      </Stack>

      <SuccessModal {...successModal.props} />
      
      <DeleteAccountModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
      />

      {/* Modal de chargement pour la sauvegarde */}
      <LoadingPopup visible={isSaving} />
    </PageContainer>
  );
}

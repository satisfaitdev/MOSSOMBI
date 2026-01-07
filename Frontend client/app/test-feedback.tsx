/**
 * PAGE DE TEST SIMPLE - SON, VIBRATION ET BIOMÉTRIE - MOSSOMBI
 * Version simplifiée avec composants React Native de base
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Fingerprint, 
  CheckCircle, 
  XCircle, 
  Play,
  Pause,
  Bell
} from 'lucide-react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { usePrivacySettings } from '@/hooks/usePrivacySettings';
import { feedbackService } from '@/services/feedbackService';
import { biometricService } from '@/services/biometricService';
import { SPACING, BORDER_RADIUS } from '@/constants/colors';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';

interface TestResult {
  type: string;
  status: 'idle' | 'testing' | 'success' | 'error';
  message?: string;
}

export default function TestFeedbackPage() {
  const { colors } = useTheme();
  const { settings, updateSetting } = usePrivacySettings();
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<any>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([
    { type: 'sound', status: 'idle' },
    { type: 'vibration', status: 'idle' },
    { type: 'biometric', status: 'idle' },
  ]);

  // Note: Maintenant nous utilisons directement updateSetting du hook usePrivacySettings
  // qui gère la synchronisation avec le backend et les services

  // Debug: Afficher l'état des paramètres
  useEffect(() => {
    console.log('🔍 Page Test - État des paramètres:', {
      pushNotifications: settings.pushNotifications,
      biometricAuth: settings.biometricAuth
    });
  }, [settings]);

  // Initialisation des services
  useEffect(() => {
    initializeServices();
  }, []);

  const initializeServices = async () => {
    try {
      console.log('🚀 Initialisation des services de feedback...');
      
      // Initialiser le service de feedback
      await feedbackService.initialize();
      
      // Initialiser le service biométrique
      await biometricService.initialize();
      
      // Vérifier le statut de la biométrie
      const status = await biometricService.getStatus();
      setBiometricStatus(status);
      
      setIsInitialized(true);
      console.log('✅ Services initialisés avec succès');
    } catch (error) {
      console.error('❌ Erreur initialisation services:', error);
      Alert.alert('Erreur', 'Impossible d\'initialiser les services de feedback');
    }
  };

  // Mettre à jour le résultat d'un test
  const updateTestResult = (type: string, status: TestResult['status'], message?: string) => {
    setTestResults(prev => prev.map(test => 
      test.type === type ? { ...test, status, message } : test
    ));
  };

  // Tests de son
  const testNotificationSound = async () => {
    updateTestResult('sound', 'testing');
    try {
      await feedbackService.playNotificationSound();
      updateTestResult('sound', 'success', 'Son de notification joué');
    } catch (error) {
      updateTestResult('sound', 'error', 'Erreur lecture son');
    }
  };

  const testSuccessSound = async () => {
    updateTestResult('sound', 'testing');
    try {
      await feedbackService.playSuccessSound();
      updateTestResult('sound', 'success', 'Son de succès joué');
    } catch (error) {
      updateTestResult('sound', 'error', 'Erreur son de succès');
    }
  };

  // Tests de vibration
  const testLightVibration = async () => {
    updateTestResult('vibration', 'testing');
    try {
      await feedbackService.lightVibration();
      updateTestResult('vibration', 'success', 'Vibration légère');
    } catch (error) {
      updateTestResult('vibration', 'error', 'Erreur vibration légère');
    }
  };

  const testSuccessVibration = async () => {
    updateTestResult('vibration', 'testing');
    try {
      await feedbackService.successVibration();
      updateTestResult('vibration', 'success', 'Vibration de succès');
    } catch (error) {
      updateTestResult('vibration', 'error', 'Erreur vibration succès');
    }
  };

  // Tests biométriques
  const testBiometricAuthentication = async () => {
    updateTestResult('biometric', 'testing');
    try {
      // Vérifier d'abord si la biométrie est activée dans les paramètres
      if (!settings.biometricAuth) {
        updateTestResult('biometric', 'error', 'Biométrie désactivée - Activez-la d\'abord avec le toggle');
        Alert.alert(
          'Biométrie désactivée',
          'Vous devez d\'abord activer l\'authentification biométrique avec le toggle ci-dessus pour pouvoir la tester.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Vérifier la disponibilité matérielle
      const availability = await biometricService.checkAvailability();
      
      if (!availability.hasHardware) {
        updateTestResult('biometric', 'error', 'Matériel biométrique non disponible');
        return;
      }
      
      if (!availability.isEnrolled) {
        updateTestResult('biometric', 'error', 'Aucune empreinte configurée');
        Alert.alert(
          'Configuration requise',
          'Aucune empreinte digitale ou Face ID n\'est configuré sur cet appareil. Voulez-vous ouvrir les paramètres pour en ajouter ?',
          [
            { text: 'Plus tard', style: 'cancel' },
            { 
              text: 'Ouvrir paramètres', 
              onPress: async () => {
                await biometricService.openBiometricSettings();
              }
            }
          ]
        );
        return;
      }
      
      // Maintenant tester l'authentification (UNIQUEMENT Face ID/Touch ID)
      const result = await biometricService.authenticate(
        'Test Mossombi - Utilisez Face ID ou Touch ID (PAS le code)'
      );
      
      if (result.success) {
        updateTestResult('biometric', 'success', 'Authentification Face ID/Touch ID réussie !');
      } else {
        updateTestResult('biometric', 'error', result.error || 'Authentification échouée');
      }
    } catch (error) {
      updateTestResult('biometric', 'error', 'Erreur test biométrique');
    }
  };

  // Test pour montrer que la biométrie ne marche pas quand désactivée
  const testBiometricWhenDisabled = async () => {
    updateTestResult('biometric', 'testing');
    try {
      if (settings.biometricAuth) {
        updateTestResult('biometric', 'error', 'Désactivez d\'abord la biométrie pour voir ce test');
        return;
      }

      // Essayer d'authentifier quand c'est désactivé
      const result = await biometricService.authenticate(
        'Test - Ceci ne devrait PAS marcher'
      );
      
      if (result.success) {
        updateTestResult('biometric', 'error', 'ERREUR: Biométrie a marché alors qu\'elle est désactivée !');
      } else {
        updateTestResult('biometric', 'success', 'Correct: Biométrie bloquée car désactivée');
      }
    } catch (error) {
      updateTestResult('biometric', 'success', 'Correct: Biométrie bloquée car désactivée');
    }
  };

  // Tests combinés
  const testSuccessFeedback = async () => {
    try {
      await feedbackService.successFeedback();
      Alert.alert('✅ Succès', 'Feedback de succès (son + vibration)');
    } catch (error) {
      Alert.alert('❌ Erreur', 'Erreur feedback de succès');
    }
  };

  // Obtenir l'icône de statut
  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'testing':
        return <Play size={16} color={colors.warning} />;
      case 'success':
        return <CheckCircle size={16} color={colors.success} />;
      case 'error':
        return <XCircle size={16} color={colors.error} />;
      default:
        return <Pause size={16} color={colors.textSecondary} />;
    }
  };

  // Obtenir la couleur de statut
  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'testing':
        return colors.warning;
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      padding: SPACING.md,
    },
    section: {
      backgroundColor: colors.card,
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      marginBottom: SPACING.md,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: SPACING.md,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: SPACING.sm,
    },
    settingLabel: {
      fontSize: 16,
      color: colors.text,
      marginLeft: SPACING.sm,
    },
    button: {
      backgroundColor: colors.primary,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderRadius: BORDER_RADIUS.md,
      marginBottom: SPACING.sm,
      alignItems: 'center',
    },
    buttonOutline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
    },
    buttonText: {
      color: colors.background,
      fontSize: 14,
      fontWeight: '500',
    },
    buttonTextOutline: {
      color: colors.text,
    },
    toggleButton: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
      borderRadius: BORDER_RADIUS.sm,
      minWidth: 40,
      alignItems: 'center',
    },
    toggleButtonOn: {
      backgroundColor: colors.primary,
    },
    toggleButtonOff: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
    },
    toggleButtonText: {
      fontSize: 12,
      fontWeight: '600',
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.sm,
    },
    statusText: {
      flex: 1,
      marginLeft: SPACING.sm,
    },
    statusTitle: {
      fontSize: 14,
      fontWeight: '500',
    },
    statusMessage: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    biometricInfo: {
      backgroundColor: colors.surface,
      padding: SPACING.sm,
      borderRadius: BORDER_RADIUS.sm,
      marginBottom: SPACING.sm,
    },
    biometricText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: SPACING.xs,
    },
    infoBox: {
      padding: SPACING.sm,
      borderRadius: BORDER_RADIUS.sm,
      borderWidth: 1,
      marginBottom: SPACING.md,
    },
    infoText: {
      fontSize: 13,
      lineHeight: 18,
    },
  });

  if (!isInitialized) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderWithBackButton title="Test Feedback" />
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: colors.text }}>Initialisation des services...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <HeaderWithBackButton title="Test Feedback" />
      <ScrollView style={styles.content}>
        
        {/* Paramètres actuels */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres Actuels</Text>
          
          <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              ℹ️ Les paramètres de son et vibration sont maintenant gérés directement par votre téléphone.
              Utilisez les boutons de test ci-dessous pour tester les fonctionnalités.
            </Text>
          </View>

          <View style={styles.settingRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Bell size={20} color={settings.pushNotifications ? colors.primary : colors.textSecondary} />
              <Text style={styles.settingLabel}>Notifications push</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                settings.pushNotifications ? styles.toggleButtonOn : styles.toggleButtonOff
              ]}
              onPress={() => updateSetting('pushNotifications', !settings.pushNotifications)}
            >
              <Text style={[
                styles.toggleButtonText,
                { color: settings.pushNotifications ? colors.background : colors.text }
              ]}>
                {settings.pushNotifications ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.settingRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Fingerprint size={20} color={settings.biometricAuth ? colors.primary : colors.textSecondary} />
              <Text style={styles.settingLabel}>Biométrie activée</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                settings.biometricAuth ? styles.toggleButtonOn : styles.toggleButtonOff
              ]}
              onPress={async () => {
                if (!settings.biometricAuth) {
                  // Vérifier si les empreintes sont configurées avant d'activer
                  const availability = await biometricService.checkAvailability();
                  if (!availability.isEnrolled) {
                    Alert.alert(
                      'Configuration requise',
                      'Vous devez d\'abord configurer une empreinte digitale ou Face ID dans les paramètres de votre appareil.',
                      [
                        { text: 'Plus tard', style: 'cancel' },
                        { 
                          text: 'Ouvrir paramètres', 
                          onPress: async () => {
                            await biometricService.openBiometricSettings();
                          }
                        }
                      ]
                    );
                    return;
                  }
                }
                // Changer l'état avec synchronisation complète (backend + services)
                updateSetting('biometricAuth', !settings.biometricAuth);
              }}
            >
              <Text style={[
                styles.toggleButtonText,
                { color: settings.biometricAuth ? colors.background : colors.text }
              ]}>
                {settings.biometricAuth ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tests de son */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tests de Son</Text>
          
          <TouchableOpacity style={styles.button} onPress={testNotificationSound}>
            <Text style={styles.buttonText}>🔔 Son de notification</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={testSuccessSound}>
            <Text style={styles.buttonText}>✅ Son de succès</Text>
          </TouchableOpacity>
        </View>

        {/* Tests de vibration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tests de Vibration</Text>
          
          <TouchableOpacity style={styles.button} onPress={testLightVibration}>
            <Text style={styles.buttonText}>📳 Vibration légère</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={testSuccessVibration}>
            <Text style={styles.buttonText}>✅ Vibration de succès</Text>
          </TouchableOpacity>
        </View>

        {/* Tests biométriques */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tests Biométriques</Text>
          
          {/* Message informatif Expo Go */}
          <View style={[styles.infoBox, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
            <Text style={[styles.infoText, { color: colors.warning }]}>
              ⚠️ Limitation Expo Go: La biométrie pure (sans fallback code) nécessite un development build. 
              Dans Expo Go, le code à 6 chiffres peut apparaître comme fallback.
            </Text>
          </View>
          
          {biometricStatus && (
            <View style={styles.biometricInfo}>
              <Text style={styles.biometricText}>
                Statut: {biometricStatus.available ? '✅ Disponible' : '❌ Non disponible'}
              </Text>
              <Text style={styles.biometricText}>
                Types: {biometricStatus.types.join(', ') || 'Aucun'}
              </Text>
              <Text style={styles.biometricText}>
                Activé: {biometricStatus.enabled ? 'Oui' : 'Non'}
              </Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={[styles.button, !biometricStatus?.available && styles.buttonOutline]} 
            onPress={testBiometricAuthentication}
            disabled={!biometricStatus?.available}
          >
            <Text style={[
              styles.buttonText, 
              !biometricStatus?.available && styles.buttonTextOutline
            ]}>
              🔐 Test authentification (ON)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.buttonOutline]} 
            onPress={testBiometricWhenDisabled}
          >
            <Text style={[styles.buttonText, styles.buttonTextOutline]}>
              🚫 Test authentification (OFF)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tests combinés */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tests Combinés</Text>
          
          <TouchableOpacity style={styles.button} onPress={testSuccessFeedback}>
            <Text style={styles.buttonText}>✅ Feedback de succès</Text>
          </TouchableOpacity>
        </View>

        {/* Résultats des tests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Résultats des Tests</Text>
          
          {testResults.map((test) => (
            <View key={test.type} style={styles.statusRow}>
              {getStatusIcon(test.status)}
              <View style={styles.statusText}>
                <Text style={[styles.statusTitle, { color: getStatusColor(test.status) }]}>
                  {test.type.charAt(0).toUpperCase() + test.type.slice(1)}
                </Text>
                {test.message && (
                  <Text style={styles.statusMessage}>{test.message}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

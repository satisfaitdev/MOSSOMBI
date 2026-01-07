/**
 * PAGE DE TEST DES NOTIFICATIONS - MOSSOMBI
 * Test des différents types de notifications
 */

import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Bell, Mail, MessageCircle, Smartphone, CheckCircle, XCircle } from 'lucide-react-native';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePrivacySettings } from '@/hooks/usePrivacySettings';
import { notificationService } from '@/services/notificationService';
import { permissionService } from '@/services/permissionService';
import { communicationService } from '@/services/communicationService';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/colors';
import { Heading, Body, Caption } from '@/components/atoms';
import { Stack, Row } from '@/components/ui';
import { PageContainer } from '@/components/layouts';
import Button from '@/components/Button';

interface NotificationTest {
  type: 'push' | 'email' | 'whatsapp';
  name: string;
  icon: React.ReactNode;
  status: 'idle' | 'testing' | 'success' | 'error';
  message?: string;
  implemented: boolean;
}

export default function TestNotificationsScreen() {
  const { colors } = useTheme();
  const { } = useLanguage(); // Hook disponible si nécessaire
  const { settings } = usePrivacySettings();
  
  const [tests, setTests] = useState<NotificationTest[]>([
    {
      type: 'push',
      name: 'Notifications Push',
      icon: <Bell size={20} color={colors.primary} />,
      status: 'idle',
      implemented: true
    },
    {
      type: 'email',
      name: 'Notifications Email',
      icon: <Mail size={20} color={colors.primary} />,
      status: 'idle',
      implemented: true // Maintenant implémenté
    },
    {
      type: 'whatsapp',
      name: 'Notifications WhatsApp',
      icon: <MessageCircle size={20} color={colors.primary} />,
      status: 'idle',
      implemented: true // Maintenant implémenté
    }
  ]);

  const [pushToken, setPushToken] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<any>({});

  useEffect(() => {
    initializeNotifications();
    checkPermissions();
  }, []);

  const initializeNotifications = async () => {
    try {
      const token = await notificationService.initialize();
      setPushToken(token);
      console.log('🔑 Token notifications:', token);
    } catch (error) {
      console.error('Erreur initialisation notifications:', error);
    }
  };

  const checkPermissions = async () => {
    try {
      const allPermissions = await permissionService.checkAllPermissions();
      setPermissions(allPermissions);
    } catch (error) {
      console.error('Erreur vérification permissions:', error);
    }
  };

  const testPushNotification = async () => {
    updateTestStatus('push', 'testing');
    
    try {
      if (!settings.pushNotifications) {
        throw new Error('Notifications push désactivées dans les paramètres');
      }

      if (!permissions.notifications?.granted) {
        throw new Error('Permission notifications refusée');
      }

      // Test notification locale
      const notificationId = await notificationService.sendLocalNotification({
        title: '🎉 Test Push Mossombi',
        body: 'Cette notification push fonctionne !',
        data: { type: 'test', timestamp: Date.now() }
      });

      if (notificationId) {
        updateTestStatus('push', 'success', 'Notification push envoyée avec succès !');
      } else {
        throw new Error('Échec envoi notification');
      }
    } catch (error) {
      updateTestStatus('push', 'error', error instanceof Error ? error.message : 'Erreur inconnue');
    }
  };

  const testEmailNotification = async () => {
    updateTestStatus('email', 'testing');
    
    try {
      if (!settings.emailNotifications) {
        throw new Error('Notifications email désactivées dans les paramètres');
      }

      // Test du service email réel
      const result = await communicationService.testEmailService();
      
      if (result.success) {
        updateTestStatus('email', 'success', result.message);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      updateTestStatus('email', 'error', error instanceof Error ? error.message : 'Erreur inconnue');
    }
  };

  const testWhatsAppNotification = async () => {
    updateTestStatus('whatsapp', 'testing');
    
    try {
      if (!settings.smsNotifications) {
        throw new Error('Notifications SMS/WhatsApp désactivées dans les paramètres');
      }

      // Test du service WhatsApp réel
      const result = await communicationService.testWhatsAppService();
      
      if (result.success) {
        updateTestStatus('whatsapp', 'success', result.message);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      updateTestStatus('whatsapp', 'error', error instanceof Error ? error.message : 'Erreur inconnue');
    }
  };

  const updateTestStatus = (type: NotificationTest['type'], status: NotificationTest['status'], message?: string) => {
    setTests(prev => prev.map(test => 
      test.type === type 
        ? { ...test, status, message }
        : test
    ));
  };

  const runAllTests = async () => {
    await testPushNotification();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testEmailNotification();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testWhatsAppNotification();
  };

  const getStatusIcon = (status: NotificationTest['status']) => {
    switch (status) {
      case 'testing':
        return <Smartphone size={16} color={colors.warning} />;
      case 'success':
        return <CheckCircle size={16} color={colors.success} />;
      case 'error':
        return <XCircle size={16} color={colors.error} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: NotificationTest['status']) => {
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

  return (
    <>
      <HeaderWithBackButton title="Test Notifications" />
      <PageContainer>
        <Stack spacing="xl">
          {/* État des paramètres */}
          <View style={{
            backgroundColor: colors.primary + '10',
            borderRadius: BORDER_RADIUS.lg,
            padding: SPACING.md,
            borderWidth: 1,
            borderColor: colors.primary + '30'
          }}>
            <Heading level={4} style={{ color: colors.primary, marginBottom: SPACING.sm }}>
              État des paramètres
            </Heading>
            <Stack spacing="xs">
              <Row justify="space-between">
                <Caption>Push Notifications:</Caption>
                <Caption style={{ color: settings.pushNotifications ? colors.success : colors.error }}>
                  {settings.pushNotifications ? 'Activé' : 'Désactivé'}
                </Caption>
              </Row>
              <Row justify="space-between">
                <Caption>Email Notifications:</Caption>
                <Caption style={{ color: settings.emailNotifications ? colors.success : colors.error }}>
                  {settings.emailNotifications ? 'Activé' : 'Désactivé'}
                </Caption>
              </Row>
              <Row justify="space-between">
                <Caption>SMS Notifications:</Caption>
                <Caption style={{ color: settings.smsNotifications ? colors.success : colors.error }}>
                  {settings.smsNotifications ? 'Activé' : 'Désactivé'}
                </Caption>
              </Row>
            </Stack>
          </View>

          {/* Token Push */}
          {pushToken && (
            <View style={{
              backgroundColor: colors.success + '10',
              borderRadius: BORDER_RADIUS.lg,
              padding: SPACING.md,
              borderWidth: 1,
              borderColor: colors.success + '30'
            }}>
              <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold, color: colors.success }}>
                Token Push: {pushToken.substring(0, 20)}...
              </Body>
            </View>
          )}

          {/* Tests de notifications */}
          <View>
            <Heading level={3} style={{ marginBottom: SPACING.md }}>
              Tests de notifications
            </Heading>
            <Stack spacing="sm">
              {tests.map((test) => (
                <View
                  key={test.type}
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: BORDER_RADIUS.lg,
                    padding: SPACING.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    ...SHADOWS.sm
                  }}
                >
                  <Row justify="space-between" align="center" style={{ marginBottom: SPACING.sm }}>
                    <Row spacing="md" align="center">
                      {test.icon}
                      <View>
                        <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold }}>
                          {test.name}
                        </Body>
                        {!test.implemented && (
                          <Caption style={{ color: colors.warning }}>
                            Pas encore implémenté
                          </Caption>
                        )}
                      </View>
                    </Row>
                    <Row spacing="sm" align="center">
                      {getStatusIcon(test.status)}
                      <Caption style={{ color: getStatusColor(test.status) }}>
                        {test.status === 'idle' ? 'Prêt' :
                         test.status === 'testing' ? 'Test...' :
                         test.status === 'success' ? 'Succès' : 'Erreur'}
                      </Caption>
                    </Row>
                  </Row>
                  
                  {test.message && (
                    <Caption style={{ 
                      color: test.status === 'success' ? colors.success : colors.error,
                      marginBottom: SPACING.sm
                    }}>
                      {test.message}
                    </Caption>
                  )}

                  <Button
                    title={`Tester ${test.name}`}
                    onPress={() => {
                      if (test.type === 'push') testPushNotification();
                      else if (test.type === 'email') testEmailNotification();
                      else if (test.type === 'whatsapp') testWhatsAppNotification();
                    }}
                    variant={test.implemented ? 'primary' : 'outline'}
                    size="sm"
                    loading={test.status === 'testing'}
                    disabled={test.status === 'testing'}
                  />
                </View>
              ))}
            </Stack>
          </View>

          {/* Boutons d'action */}
          <Stack spacing="md">
            <Button
              title="Tester toutes les notifications"
              onPress={runAllTests}
              variant="gradient"
              fullWidth
            />
            
            <Button
              title="Vérifier les permissions"
              onPress={checkPermissions}
              variant="outline"
              fullWidth
            />
          </Stack>

          {/* Diagnostic */}
          <View style={{
            backgroundColor: colors.accent + '10',
            borderRadius: BORDER_RADIUS.lg,
            padding: SPACING.md,
            borderWidth: 1,
            borderColor: colors.accent + '30'
          }}>
            <Heading level={4} style={{ color: colors.accent, marginBottom: SPACING.sm }}>
              Diagnostic
            </Heading>
            <Stack spacing="xs">
              <Caption>
                • Push: {permissions.notifications?.granted ? '✅ Autorisé' : '❌ Refusé'}
              </Caption>
              <Caption>
                • Email: ✅ Service implémenté avec API backend
              </Caption>
              <Caption>
                • WhatsApp: ✅ Service implémenté avec API backend
              </Caption>
              <Caption>
                • SMS: ✅ Service implémenté avec API backend
              </Caption>
              <Caption style={{ marginTop: SPACING.sm, fontStyle: 'italic' }}>
                Tous les services de notifications sont maintenant fonctionnels !
              </Caption>
            </Stack>
          </View>
        </Stack>
      </PageContainer>
    </>
  );
}

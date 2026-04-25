import React, { useState, useEffect } from 'react';
import { View, Pressable, Switch, Alert, ActivityIndicator, TouchableOpacity, Image, Modal, Clipboard, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Shield, AlertTriangle, Key, X, Copy } from 'lucide-react-native';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/colors';
import { Heading, Body, Caption } from '@/components/atoms';
import { Stack, Row } from '@/components/ui';
import { PageContainer } from '@/components/layouts';
import { useSuccessModal } from '@/hooks';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { SuccessModal } from '@/components/organisms/modals';
import { biometricService } from '@/services/biometricService';
import { apiService } from '@/services/api';
import GradientBackground from '@/components/atoms/GradientBackground';

interface SecuritySettings {
  authenticatorAuth: boolean;
  twoFactorAuth: boolean;
  loginAlerts: boolean;
}

interface SessionInfo {
  id: string;
  device?: string;                   // Structure backend réelle
  location?: string;                 // Structure backend réelle
  ip_address?: string;
  last_active?: string;              // Structure backend réelle
  is_current?: boolean;
  user_agent?: string;
  os?: string;                       // Système d'exploitation détecté
  
  // Propriétés optionnelles pour compatibilité future
  device_info?: {
    device_type?: string;
    os?: string;
    browser?: string;
  };
  location_info?: {
    city?: string;
    country?: string;
    ip?: string;
  };
  created_at?: string;
  last_activity?: string;
}

export default function SecurityScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  
  // États des paramètres de sécurité
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    authenticatorAuth: false,
    twoFactorAuth: false,
    loginAlerts: true
  });

  // États des sessions actives
  const [activeSessions, setActiveSessions] = useState<SessionInfo[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  
  // États du formulaire de changement de mot de passe
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword] = useState(false);
  const [showNewPassword] = useState(false);
  const [showConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // États 2FA
  const [twoFactorPhone, setTwoFactorPhone] = useState('');
  const [twoFactorMethod, setTwoFactorMethod] = useState<'authenticator' | 'whatsapp'>('authenticator');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [qrCode, setQrCode] = useState<string>('');
  const [manualEntryKey, setManualEntryKey] = useState<string>('');
  const [tempSecret, setTempSecret] = useState<string>('');
  const [showAuthenticatorModal, setShowAuthenticatorModal] = useState(false);
  
  // Modales
  const passwordModal = useSuccessModal({ autoClose: true });
  const logoutModal = useSuccessModal({ autoClose: true });

  // Charger les paramètres de sécurité au démarrage
  useEffect(() => {
    loadSecuritySettings();
    loadActiveSessions();
  }, []);

  const loadSecuritySettings = async () => {
    try {
      console.log('🔒 Chargement des paramètres de sécurité...');
      
      // Utiliser l'API existante pour récupérer les paramètres de sécurité
      const result = await apiService.getSecuritySettings();
      
      console.log('📡 Réponse API Security:', result);
      
      if (result.success && result.data) {
        // L'API retourne: { security_settings: { two_factor_enabled, login_alerts_enabled, ... } }
        const apiSettings = result.data.security_settings;
        
        setSecuritySettings({
          authenticatorAuth: apiSettings?.authenticator_enabled || false,
          twoFactorAuth: apiSettings?.two_factor_enabled || false,
          loginAlerts: apiSettings?.login_alerts_enabled || true
        });
        
        console.log('✅ Paramètres sécurité chargés:', {
          authenticatorAuth: apiSettings?.authenticator_enabled || false,
          twoFactorAuth: apiSettings?.two_factor_enabled || false,
          loginAlerts: apiSettings?.login_alerts_enabled || true
        });
      }
    } catch (error) {
      console.error('❌ Erreur chargement paramètres sécurité:', error);
    }
  };

  const loadActiveSessions = async () => {
    try {
      setSessionsLoading(true);
      console.log('🔄 Chargement des sessions actives...');
      
      const result = await apiService.getActiveSessions();
      
      console.log('📡 Réponse API Sessions:', result);
      
      if (result.success && result.data) {
        const sessions = result.data.sessions || [];
        console.log('📋 Structure des sessions reçues:', JSON.stringify(sessions, null, 2));
        setActiveSessions(sessions);
        console.log('✅ Sessions actives chargées:', sessions.length);
      }
    } catch (error) {
      console.error('❌ Erreur chargement sessions actives:', error);
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (!currentPassword || !newPassword) {
      Alert.alert('Erreur', 'Tous les champs sont requis');
      return;
    }

    try {
      setIsLoading(true);
      
      // 1. Authentification biométrique OBLIGATOIRE (service existant)
      const biometricResult = await biometricService.authenticateForSensitiveAction(
        'Changement de mot de passe'
      );

      if (!biometricResult.success) {
        Alert.alert('Authentification requise', biometricResult.error || 'Face ID/Touch ID requis');
        return;
      }

      // 2. Appel API existant pour changer le mot de passe
      const result = await apiService.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });

      if (result.success) {
        passwordModal.show({
          title: 'Mot de passe modifié !',
          message: 'Votre mot de passe a été changé avec succès',
          animation: 'checkmark',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de changer le mot de passe');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecurityToggle = async (setting: keyof SecuritySettings, newValue: boolean) => {
    try {
      setIsLoading(true);
      
      // 1. Authentification biométrique OBLIGATOIRE pour les changements de sécurité
      const biometricResult = await biometricService.authenticateForSensitiveAction(
        `Modification de ${setting}`
      );

      if (!biometricResult.success) {
        Alert.alert('Authentification requise', biometricResult.error || 'Face ID/Touch ID requis');
        return;
      }

      // Cas spécial : activation de l'Authenticator → ouvrir le modal de configuration
      if (setting === 'authenticatorAuth' && newValue === true) {
        setTwoFactorMethod('authenticator');
        setShowAuthenticatorModal(true);
        return;
      }

      // Cas spécial : 2FA WhatsApp → activer/désactiver directement (numéro déjà vérifié)
      if (setting === 'twoFactorAuth') {
        const result = await apiService.updateSecuritySettings({ two_factor_enabled: newValue });
        if (result.success) {
          setSecuritySettings(prev => ({ ...prev, twoFactorAuth: newValue }));
          console.log(`✅ Paramètre twoFactorAuth mis à jour: ${newValue} (WhatsApp sans configuration)`);
        } else {
          Alert.alert('Erreur', result.error || 'Impossible de modifier ce paramètre');
        }
        return;
      }

      // 2. Mapper les autres paramètres pour l'API
      const apiMapping = {
        authenticatorAuth: 'authenticator_enabled',
        twoFactorAuth: 'two_factor_enabled',
        loginAlerts: 'login_alerts_enabled'
      };

      const apiKey = apiMapping[setting];
      
      // 3. Appel API générique
      const result = await apiService.updateSecuritySettings({ [apiKey]: newValue });
      
      if (result.success) {
        setSecuritySettings(prev => ({ ...prev, [setting]: newValue }));
        console.log(`✅ Paramètre ${setting} mis à jour: ${newValue} (avec authentification biométrique)`);
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de modifier ce paramètre');
      }
      
    } catch (error) {
      console.error('❌ Erreur mise à jour paramètre sécurité:', error);
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutSession = async (sessionId: string) => {
    try {
      setIsLoading(true);
      
      // 1. Authentification biométrique OBLIGATOIRE
      const biometricResult = await biometricService.authenticateForSensitiveAction(
        'Déconnexion de session'
      );

      if (!biometricResult.success) {
        Alert.alert('Authentification requise', biometricResult.error || 'Face ID/Touch ID requis');
        return;
      }

      // 2. Appel API pour déconnecter la session spécifique
      const result = await apiService.deleteSession(sessionId);
      
      if (result.success) {
        console.log('✅ Session déconnectée:', sessionId);
        
        // 3. Recharger la liste des sessions
        await loadActiveSessions();
        
        Alert.alert('Succès', 'Session déconnectée avec succès');
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de déconnecter cette session');
      }
      
    } catch (error) {
      console.error('❌ Erreur déconnexion session:', error);
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir déconnecter tous les autres appareils ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnecter', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              // 1. Authentification biométrique OBLIGATOIRE
              const biometricResult = await biometricService.authenticateForSensitiveAction(
                'Déconnexion de tous les appareils'
              );

              if (!biometricResult.success) {
                Alert.alert('Authentification requise', biometricResult.error || 'Face ID/Touch ID requis');
                return;
              }

              // 2. Déconnecter toutes les autres sessions (sauf la session actuelle)
              const otherSessions = activeSessions.filter(session => !session.is_current);
              
              if (otherSessions.length === 0) {
                Alert.alert('Information', 'Aucune autre session à déconnecter');
                return;
              }

              // Déconnecter chaque session une par une
              for (const session of otherSessions) {
                try {
                  await apiService.deleteSession(session.id);
                  console.log('✅ Session déconnectée:', session.id);
                } catch (error) {
                  console.error('❌ Erreur déconnexion session:', session.id, error);
                }
              }
              
              // 3. Recharger la liste des sessions
              await loadActiveSessions();
              
              console.log('✅ Toutes les autres sessions déconnectées (avec authentification biométrique)');
              
              logoutModal.show({
                title: 'Appareils déconnectés !',
                message: `${otherSessions.length} session(s) déconnectée(s) avec succès`,
                animation: 'checkmark',
              });
            } catch (error) {
              Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  // =====================================================
  // 🔐 FONCTIONS 2FA
  // =====================================================

  const handleGenerateAuthenticatorQR = async () => {
    setTwoFactorLoading(true);
    try {
      const result = await apiService.generateAuthenticatorQR();

      if (result.success && result.data) {
        setQrCode(result.data.qr_code);
        setManualEntryKey(result.data.manual_entry_key);
        setTempSecret(result.data.temp_secret);
        setCodeSent(true); // Réutilise l'état pour afficher l'étape suivante
        
        Alert.alert(
          'QR Code Généré !', 
          'Scannez le QR code avec votre application Authenticator (Google Authenticator, Microsoft Authenticator, etc.)'
        );
      } else {
        Alert.alert('Erreur', result.error || 'Erreur lors de la génération du QR code');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleSendTwoFactorCode = async () => {
    if (!twoFactorPhone.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un numéro de téléphone');
      return;
    }

    setTwoFactorLoading(true);
    try {
      const result = await apiService.sendTwoFactorCode({
        method: 'whatsapp', // Forcer WhatsApp car c'est la seule méthode supportée
        phone_number: twoFactorPhone
      });

      if (result.success) {
        setCodeSent(true);
        Alert.alert(
          'Code envoyé !', 
          'Un code de vérification a été envoyé par WhatsApp'
        );
      } else {
        Alert.alert('Erreur', result.error || 'Erreur lors de l\'envoi du code');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleVerifyTwoFactorCode = async (): Promise<boolean> => {
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      Alert.alert('Erreur', 'Veuillez saisir un code à 6 chiffres');
      return false;
    }

    setTwoFactorLoading(true);
    try {
      const result = await apiService.verifyTwoFactorCode({
        code: verificationCode,
        method: twoFactorMethod,
        temp_secret: twoFactorMethod === 'authenticator' ? tempSecret : undefined
      });

      if (result.success) {
        setCodeVerified(true);
        Alert.alert('Code vérifié !', 'Le code est valide. Vous pouvez maintenant activer 2FA.');
        return true;
      } else {
        Alert.alert('Erreur', result.error || 'Code invalide');
        return false;
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
      return false;
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleCopyManualKey = async () => {
    try {
      Clipboard.setString(manualEntryKey);
      Alert.alert('Copié !', 'Le code manuel a été copié dans le presse-papiers');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de copier le code');
    }
  };

  const handleSetupTwoFactor = async () => {
    if (!codeVerified) {
      Alert.alert('Erreur', 'Veuillez d\'abord vérifier le code');
      return;
    }

    setTwoFactorLoading(true);
    try {
      const result = await apiService.setupTwoFactor({
        phone_number: twoFactorMethod === 'whatsapp' ? twoFactorPhone : undefined,
        method: twoFactorMethod,
        verification_code: verificationCode,
        temp_secret: twoFactorMethod === 'authenticator' ? tempSecret : undefined
      });

      if (result.success && result.data) {
        setBackupCodes(result.data.backup_codes);
        setSecuritySettings(prev => ({ ...prev, twoFactorAuth: true }));
        
        Alert.alert(
          '2FA Activé !', 
          `L'authentification à deux facteurs via ${twoFactorMethod === 'authenticator' ? 'Authenticator' : 'WhatsApp'} a été activée avec succès. Sauvegardez vos codes de récupération.`,
          [
            {
              text: 'Voir les codes',
              onPress: () => showBackupCodes(result.data!.backup_codes)
            }
          ]
        );
        
        // Reset du formulaire
        setTwoFactorPhone('');
        setVerificationCode('');
        setCodeSent(false);
        setCodeVerified(false);
        setQrCode('');
        setManualEntryKey('');
        setTempSecret('');
      } else {
        Alert.alert('Erreur', result.error || 'Erreur lors de l\'activation de 2FA');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const showBackupCodes = (codes: string[]) => {
    Alert.alert(
      'Codes de Récupération',
      `Sauvegardez ces codes dans un endroit sûr :\n\n${codes.join('\n')}\n\nIls vous permettront de vous connecter si vous perdez l'accès à votre téléphone.`,
      [{ text: 'J\'ai sauvegardé', style: 'default' }]
    );
  };

  const SecurityToggle = ({ icon, title, description, value, onValueChange }: any) => (
    <View style={{ backgroundColor: colors.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: colors.border, ...SHADOWS.sm }}>
      <Row justify="space-between" align="center">
        <Row spacing="md" align="center" style={{ flex: 1 }}>
          <View style={{ width: 40, height: 40, backgroundColor: colors.primary + '20', borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </View>
          <View style={{ flex: 1 }}>
            <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold }}>{title}</Body>
            {description && <Caption style={{ marginTop: SPACING.xs / 2 }}>{description}</Caption>}
          </View>
        </Row>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.border, true: colors.primary + '80' }}
          thumbColor={value ? colors.primary : colors.surface}
        />
      </Row>
    </View>
  );

  const SecurityButton = ({ icon, title, description, onPress, variant = 'default' }: any) => (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <View style={{ 
        backgroundColor: variant === 'danger' ? colors.error + '10' : colors.card, 
        borderRadius: BORDER_RADIUS.lg, 
        padding: SPACING.md, 
        borderWidth: 1, 
        borderColor: variant === 'danger' ? colors.error + '30' : colors.border, 
        ...SHADOWS.sm 
      }}>
        <Row spacing="md" align="center">
          <View style={{ 
            width: 40, 
            height: 40, 
            backgroundColor: variant === 'danger' ? colors.error + '20' : colors.primary + '20', 
            borderRadius: BORDER_RADIUS.md, 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            {icon}
          </View>
          <View style={{ flex: 1 }}>
            <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold, color: variant === 'danger' ? colors.error : colors.text }}>
              {title}
            </Body>
            {description && <Caption style={{ marginTop: SPACING.xs / 2 }}>{description}</Caption>}
          </View>
        </Row>
      </View>
    </Pressable>
  );

  return (
    <GradientBackground style={{ flex: 1 }} opacity="10">
      <HeaderWithBackButton title={t('securityTitle' as any)} />
      <PageContainer style={{ backgroundColor: 'transparent' }}>
        <Stack spacing="xl">
            {/* Authentification */}
            <View>
              <Heading level={3} style={{ marginBottom: SPACING.md }}>{t('authentication' as any)}</Heading>
              
              {/* Note informative sur la biométrie */}
              <View style={{ backgroundColor: colors.primary + '10', borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.md, borderWidth: 1, borderColor: colors.primary + '20' }}>
                <Caption style={{ color: colors.primary, textAlign: 'center' }}>
                  💡 {t('biometricAuthNote' as any) || 'L\'authentification biométrique est configurée dans les paramètres généraux'}
                </Caption>
              </View>
              
              <Stack spacing="sm">
                <SecurityToggle
                  icon={<Key size={20} color={colors.primary} />}
                  title={t('authenticatorAuth' as any)}
                  description={t('authenticatorAuthDesc' as any)}
                  value={securitySettings.authenticatorAuth}
                  onValueChange={(value: boolean) => handleSecurityToggle('authenticatorAuth', value)}
                />
                <SecurityToggle
                  icon={<Shield size={20} color={colors.primary} />}
                  title={t('twoFactorAuth' as any)}
                  description={t('twoFactorAuthDesc' as any)}
                  value={securitySettings.twoFactorAuth}
                  onValueChange={(value: boolean) => handleSecurityToggle('twoFactorAuth', value)}
                />
                <SecurityToggle
                  icon={<AlertTriangle size={20} color={colors.primary} />}
                  title={t('loginAlerts' as any)}
                  description={t('loginAlertsDesc' as any)}
                  value={securitySettings.loginAlerts}
                  onValueChange={(value: boolean) => handleSecurityToggle('loginAlerts', value)}
                />
              </Stack>

              {/* La configuration WhatsApp ne nécessite plus de section dédiée :
                  on utilise directement le numéro vérifié de l'utilisateur. */}
            </View>

            {/* Changer le mot de passe */}
            <View>
              <Heading level={3} style={{ marginBottom: SPACING.md }}>{t('changePasswordTitle' as any)}</Heading>
              <Stack spacing="md">
                <Input
                  label={t('currentPassword' as any)}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder={t('currentPasswordPlaceholder' as any)}
                  secureTextEntry={!showCurrentPassword}
                />
                <Input
                  label={t('newPassword' as any)}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder={t('newPasswordPlaceholder' as any)}
                  secureTextEntry={!showNewPassword}
                />
                <Input
                  label={t('confirmNewPassword' as any)}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder={t('confirmPasswordPlaceholder' as any)}
                  secureTextEntry={!showConfirmPassword}
                />
                <Button
                  title={t('changePasswordButton' as any)}
                  onPress={handleChangePassword}
                  variant="gradient"
                  size="lg"
                  fullWidth
                  disabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || isLoading}
                  loading={isLoading}
                />
              </Stack>
            </View>

            {/* Sessions actives */}
            <View>
              <Row justify="space-between" align="center" style={{ marginBottom: SPACING.md }}>
                <Heading level={3}>{t('activeSessions' as any)}</Heading>
                {sessionsLoading && (
                  <ActivityIndicator size="small" color={colors.primary} />
                )}
              </Row>
              <Stack spacing="sm">
                {activeSessions.length > 0 ? (
                  activeSessions.map((session) => (
                    <View key={session.id} style={{ backgroundColor: colors.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: session.is_current ? colors.primary : colors.border, ...SHADOWS.sm }}>
                      <Row justify="space-between" align="center">
                        <View style={{ flex: 1 }}>
                          <Row spacing="sm" align="center">
                            <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold }}>
                              {session.is_current ? t('currentDevice' as any) : (session.device || session.device_info?.device_type || 'Appareil inconnu')}
                            </Body>
                            {session.is_current && (
                              <View style={{ backgroundColor: colors.success, paddingHorizontal: SPACING.xs, paddingVertical: 2, borderRadius: BORDER_RADIUS.sm }}>
                                <Caption style={{ color: 'white', fontSize: 10 }}>Actuel</Caption>
                              </View>
                            )}
                          </Row>
                          <Caption style={{ marginTop: SPACING.xs / 2 }}>
                            {session.os && `${session.os} • `}
                            {session.location || session.location_info?.city ? 
                              (session.location || `${session.location_info?.city}, ${session.location_info?.country}`) : 
                              'Localisation inconnue'
                            }
                            {session.ip_address && ` • ${session.ip_address}`}
                          </Caption>
                          <Caption style={{ color: session.is_current ? colors.success : colors.text }}>
                            {session.is_current ? 'Actif maintenant' : (() => {
                              const lastActive = session.last_active || session.last_activity;
                              return lastActive ? `Dernière activité: ${new Date(lastActive).toLocaleDateString('fr-FR')}` : 'Dernière activité: Inconnue';
                            })()}
                          </Caption>
                        </View>
                        {!session.is_current && (
                          <TouchableOpacity
                            onPress={() => handleLogoutSession(session.id)}
                            style={{ padding: SPACING.xs }}
                          >
                            <X size={16} color={colors.error} />
                          </TouchableOpacity>
                        )}
                      </Row>
                    </View>
                  ))
                ) : (
                  <View style={{ backgroundColor: colors.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: colors.border, ...SHADOWS.sm }}>
                    <Body style={{ textAlign: 'center', color: colors.textSecondary }}>
                      {sessionsLoading ? 'Chargement des sessions...' : 'Aucune session active'}
                    </Body>
                  </View>
                )}

              {activeSessions.length > 1 && (
                <SecurityButton
                  icon={<AlertTriangle size={20} color={colors.error} />}
                  title={t('logoutAllDevices' as any)}
                  description={t('logoutAllDevicesDesc' as any)}
                  onPress={handleLogoutAllDevices}
                  variant="danger"
                />
              )}
            </Stack>
          </View>

          {/* Avertissement */}
            <View style={{ backgroundColor: colors.warning + '10', borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: colors.warning + '30' }}>
              <Row spacing="sm" align="flex-start">
                <AlertTriangle size={20} color={colors.warning} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold, color: colors.warning }}>
                    {t('securityWarning' as any)}
                  </Body>
                  <Caption style={{ marginTop: SPACING.xs }}>
                    {t('securityWarningDesc' as any)}
                  </Caption>
                </View>
              </Row>
            </View>
        </Stack>
      </PageContainer>

      <SuccessModal {...passwordModal.props} />
      <SuccessModal {...logoutModal.props} />

      {/* Modal de configuration Authenticator (Google / Microsoft) */}
      <Modal
        visible={showAuthenticatorModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowAuthenticatorModal(false);
          setQrCode('');
          setManualEntryKey('');
          setTempSecret('');
          setVerificationCode('');
          setCodeVerified(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View
              style={{
                backgroundColor: colors.background,
                borderTopLeftRadius: BORDER_RADIUS.xl,
                borderTopRightRadius: BORDER_RADIUS.xl,
                paddingHorizontal: SPACING.md,
                paddingVertical: SPACING.lg,
                maxHeight: '90%',
              }}
            >
              <Row
                justify="space-between"
                align="center"
                style={{ marginBottom: SPACING.lg, paddingHorizontal: SPACING.xs }}
              >
                <Heading level={3} style={{ flex: 1, marginRight: SPACING.md }}>
                  Configurer Authenticator
                </Heading>
                <Pressable
                  onPress={() => {
                    setShowAuthenticatorModal(false);
                    setQrCode('');
                    setManualEntryKey('');
                    setTempSecret('');
                    setVerificationCode('');
                    setCodeVerified(false);
                  }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: BORDER_RADIUS.full,
                    backgroundColor: colors.border,
                    borderWidth: 1,
                    borderColor: colors.textTertiary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: colors.shadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <X size={18} color={colors.textSecondary} />
                </Pressable>
              </Row>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: SPACING.lg }}
              >
                <Stack spacing="md">
                  {!qrCode && (
                    <Button
                      title="Générer le QR code"
                      onPress={handleGenerateAuthenticatorQR}
                      loading={twoFactorLoading}
                      variant="gradient"
                      size="lg"
                      fullWidth
                    />
                  )}

                  {qrCode !== '' && (
                    <>
                      <View style={{ alignItems: 'center', marginBottom: SPACING.md }}>
                        <View
                          style={{
                            width: 200,
                            height: 200,
                            backgroundColor: colors.surface,
                            borderRadius: BORDER_RADIUS.md,
                            overflow: 'hidden',
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: colors.border,
                          }}
                        >
                          <Image
                            source={{ uri: qrCode }}
                            style={{ width: 200, height: 200, resizeMode: 'contain' }}
                          />
                        </View>
                        <Caption style={{ marginTop: SPACING.sm, textAlign: 'center' }}>
                          Scanne ce QR code avec Google Authenticator ou Microsoft Authenticator.
                        </Caption>
                      </View>

                      <View
                        style={{
                          backgroundColor: colors.surface,
                          padding: SPACING.md,
                          borderRadius: BORDER_RADIUS.md,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                      >
                        <Row justify="space-between" align="center" style={{ marginBottom: SPACING.xs }}>
                          <Caption style={{ fontWeight: TYPOGRAPHY.weights.medium }}>Code manuel :</Caption>
                          <Pressable
                            onPress={handleCopyManualKey}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              backgroundColor: colors.primary + '20',
                              paddingHorizontal: SPACING.sm,
                              paddingVertical: SPACING.xs,
                              borderRadius: BORDER_RADIUS.sm,
                            }}
                          >
                            <Copy size={14} color={colors.primary} />
                            <Caption
                              style={{
                                marginLeft: SPACING.xs,
                                color: colors.primary,
                                fontWeight: TYPOGRAPHY.weights.medium,
                              }}
                            >
                              Copier
                            </Caption>
                          </Pressable>
                        </Row>
                        <Body style={{ fontFamily: 'monospace', fontSize: 14, lineHeight: 20 }}>{manualEntryKey}</Body>
                      </View>

                      <Input
                        label="Code à 6 chiffres"
                        keyboardType="number-pad"
                        value={verificationCode}
                        onChangeText={setVerificationCode}
                        maxLength={6}
                        placeholder="123456"
                        variant="default"
                      />

                      <Button
                        title="Vérifier et activer Authenticator"
                        onPress={async () => {
                          const ok = await handleVerifyTwoFactorCode();
                          if (!ok) return;

                          await handleSetupTwoFactor();
                          const result = await apiService.updateSecuritySettings({ authenticator_enabled: true });
                          if (result.success) {
                            setSecuritySettings((prev) => ({ ...prev, authenticatorAuth: true }));
                            setShowAuthenticatorModal(false);
                          }
                        }}
                        loading={twoFactorLoading}
                        variant="gradient"
                        size="lg"
                        fullWidth
                      />
                    </>
                  )}
                </Stack>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </GradientBackground>
  );
}

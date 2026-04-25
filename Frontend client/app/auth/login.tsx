import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, HelpCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SPACING, BORDER_RADIUS } from '@/constants/colors';
import { Stack, Row } from '@/components/ui';
import { AdaptiveCard, AdaptiveText } from '@/components/ui';
import { PageContainer } from '@/components/layouts';
import Button from '@/components/Button';
import Input from '@/components/Input';
import PhoneInput from '@/components/PhoneInput';
import LoadingPopup from '@/components/LoadingPopup';
import AuthLogo from '@/components/AuthLogo';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import BaseModal from '@/components/organisms/modals/BaseModal';
import AuthPageLayout from '@/components/layouts/AuthPageLayout';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const { login, verifyLogin2FA, isAuthenticating, error, clearError } = useAuth();
  
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phoneExists, setPhoneExists] = useState(false);
  const [phoneValid, setPhoneValid] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [availableMethods, setAvailableMethods] = useState<Array<'authenticator' | 'whatsapp'>>([]);
  const [selectedMethod, setSelectedMethod] = useState<'authenticator' | 'whatsapp'>('authenticator');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [whatsappCodeSent, setWhatsappCodeSent] = useState(false);

  const twoFactorRequired = !!challengeId;
  const methodLabel = selectedMethod === 'authenticator'
    ? 'Authenticator (Google/Microsoft)'
    : 'WhatsApp';

  const getMaskedPhoneForWhatsApp = () => {
    if (!phone) return '';
    const raw = phone.replace(/\s/g, '');
    if (raw.length <= 6) return raw;
    const visibleStart = raw.slice(0, 6);
    const visibleEnd = raw.slice(-2);
    const hiddenLength = Math.max(raw.length - visibleStart.length - visibleEnd.length, 0);
    const hidden = '*'.repeat(hiddenLength);
    return `${visibleStart}${hidden}${visibleEnd}`;
  };

  const handleCountryChange = () => {
    // Logique de gestion du changement de pays si nécessaire
  };

  const handlePhoneValidation = (isValid: boolean, exists: boolean) => {
    setPhoneValid(isValid);
    setPhoneExists(exists);
    // Effacer l'erreur quand l'utilisateur modifie le numéro
    if (error) clearError();
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    // Effacer l'erreur quand l'utilisateur modifie le mot de passe
    if (error) clearError();
  };

  const handleLogin = async () => {
    // Effacer les erreurs précédentes
    clearError();
    
    if (!phone || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (!phoneValid || !phoneExists) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro de téléphone valide avec un compte existant');
      return;
    }

    const result = await login(phone, password);
    
    if (result.success && result.requires2FA) {
      setChallengeId(result.challengeId || null);

      const rawMethods = (result.methods || []) as string[];
      const normalizedMethods = rawMethods.filter(m => m === 'authenticator' || m === 'whatsapp') as Array<'authenticator' | 'whatsapp'>;

      setAvailableMethods(normalizedMethods);

      if (normalizedMethods.includes('authenticator')) {
        setSelectedMethod('authenticator');
      } else if (normalizedMethods.includes('whatsapp')) {
        setSelectedMethod('whatsapp');
      }

      setTwoFactorCode('');
      setWhatsappCodeSent(false);

      if (!normalizedMethods.includes('authenticator') && normalizedMethods.includes('whatsapp')) {
        Alert.alert('Vérification requise', 'Un code de connexion a été envoyé sur votre WhatsApp.');
      } else if (normalizedMethods.includes('authenticator')) {
        Alert.alert('Vérification requise', 'Veuillez saisir le code affiché dans votre application Authenticator.');
      }

      return;
    }

    if (!result.success) {
      // L'erreur est déjà stockée dans le contexte, pas besoin d'Alert
      // L'utilisateur reste sur la page de login
      console.log('Erreur de connexion:', result.error);
    }
    // La redirection se fait automatiquement via AuthContext si succès
  };

  const handleVerify2FA = async () => {
    if (!challengeId) return;

    if (!twoFactorCode || twoFactorCode.length !== 6) {
      Alert.alert('Erreur', 'Veuillez entrer le code à 6 chiffres.');
      return;
    }

    const result = await verifyLogin2FA({
      challengeId,
      method: selectedMethod,
      code: twoFactorCode,
    });

    if (result.success) {
      setChallengeId(null);
      setTwoFactorCode('');
      setAvailableMethods([]);
      setSelectedMethod('authenticator');
      setWhatsappCodeSent(false);
    } else {
      console.log('Erreur de vérification 2FA:', result.error);
    }
  };

  const sendWhatsAppLoginCode = async () => {
    if (!challengeId) return;

    try {
      const response = await apiService.sendLoginTwoFactorCode({
        challenge_id: challengeId,
        method: 'whatsapp',
      });

      if (response.success) {
        setWhatsappCodeSent(true);
        Alert.alert(
          'Code envoyé',
          `Un code de connexion a été envoyé au ${getMaskedPhoneForWhatsApp()} sur WhatsApp.`
        );
      } else if (response.error) {
        Alert.alert('Erreur', response.error || "Impossible d'envoyer le code WhatsApp");
      }
    } catch (e) {
      Alert.alert('Erreur', "Impossible d'envoyer le code WhatsApp");
    }
  };

  return (
    <AuthPageLayout title={t('loginTitle' as any)}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: 'transparent' }}
      >
        <PageContainer style={{ backgroundColor: 'transparent' }}>
        <Stack spacing="md" style={{ alignItems: 'center', marginTop: SPACING.lg }}>
          <AuthLogo size={96} />
          <Stack spacing="xs" style={{ alignItems: 'center' }}>
            <AdaptiveText variant="display" weight="bold" style={{ textAlign: 'center' }}>
              {t('loginTitle' as any)}
            </AdaptiveText>
            <AdaptiveText variant="caption" weight="regular" style={{ textAlign: 'center' }}>
              {t('loginTitle' as any) === 'Login' ? 'Sign in to your account' : 'Connectez-vous à votre compte'}
            </AdaptiveText>
          </Stack>
        </Stack>

        <AdaptiveCard
          margin={0}
          padding={Platform.select({ ios: 18, android: 16 })}
          variant="elevated"
          style={{ width: '100%', marginTop: SPACING.lg }}
        >
        <Stack spacing="md">
            <PhoneInput
              label={t('phoneNumber' as any)}
              value={phone}
              onChangeText={setPhone}
              onCountryChange={handleCountryChange}
              onPhoneValidation={handlePhoneValidation}
              countrySelectable={true}
              mode="login"
            />
            <Input 
              label={t('password' as any)} 
              value={password} 
              onChangeText={handlePasswordChange} 
              secureTextEntry={!showPassword} 
              placeholder={t('password' as any)} 
              icon={<Lock size={20} color={colors.textSecondary} />} 
              rightIcon={
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                  {showPassword ? 
                    <EyeOff size={20} color={colors.textSecondary} /> : 
                    <Eye size={20} color={colors.textSecondary} />
                  }
                </Pressable>
              } 
            />
            
            {/* Affichage de l'erreur */}
            {error && (
              <View style={{ 
                backgroundColor: colors.error + '15', 
                borderColor: colors.error, 
                borderWidth: 1, 
                borderRadius: BORDER_RADIUS.md, 
                padding: SPACING.md,
                marginVertical: SPACING.xs
              }}>
                <AdaptiveText variant="body" weight="medium" color={colors.error} style={{ textAlign: 'center' }}>
                  {error}
                </AdaptiveText>
              </View>
            )}
            
            <Pressable onPress={() => router.push('/auth/forgot-password-step1' as any)} style={{ alignSelf: 'flex-end' }}>
              <AdaptiveText variant="body" weight="medium" color={colors.primary}>
                {t('forgotPassword' as any)}
              </AdaptiveText>
            </Pressable>

            <Button 
              title={t('login' as any)} 
              onPress={handleLogin} 
              variant="gradient" 
              loading={isAuthenticating && !twoFactorRequired} 
              disabled={!phone || !password || !phoneValid || !phoneExists} 
              fullWidth 
            />
        </Stack>
        </AdaptiveCard>

        <Row align="center" style={{ marginTop: SPACING.md, marginBottom: SPACING.sm }}>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          <AdaptiveText variant="caption" weight="regular" style={{ marginHorizontal: SPACING.sm }}>
            {t('or' as any)}
          </AdaptiveText>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        </Row>

        <Button 
          title={t('createAccount' as any)} 
          onPress={() => router.push('/auth/register-step1' as any)} 
          variant="secondary" 
          fullWidth 
        />

        <Pressable 
          onPress={() => {
            console.log('🔄 Navigation vers page d\'aide auth...');
            router.push('/auth/help' as any);
          }} 
          style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginTop: SPACING.lg, 
            gap: SPACING.xs 
          }}
        >
          <HelpCircle size={16} color={colors.textSecondary} />
          <AdaptiveText variant="caption" weight="regular" color={colors.textSecondary}>
            {t('needHelp' as any)}
          </AdaptiveText>
        </Pressable>
        </PageContainer>

      {/* Modal de vérification 2FA (pattern BaseModal comme recharge/success) */}
      <BaseModal
        visible={twoFactorRequired}
        onClose={() => {
          setChallengeId(null);
          setTwoFactorCode('');
          setAvailableMethods([]);
          setSelectedMethod('authenticator');
          setWhatsappCodeSent(false);
          clearError();
        }}
        title="Vérification 2FA"
        variant="bottom-sheet"
        size="sm"
        closeOnBackdrop={false}
      >
        <Stack spacing="md">
          {availableMethods.length > 1 && (
            <Row justify="center" spacing="sm">
              {availableMethods.map(method => {
                const isActive = selectedMethod === method;
                const label = method === 'authenticator' ? 'Authenticator' : 'WhatsApp';
                return (
                  <Pressable
                    key={method}
                    onPress={async () => {
                      setSelectedMethod(method);
                      setTwoFactorCode('');
                      if (error) clearError();

                      // Si l'utilisateur choisit WhatsApp et qu'un challenge est actif, envoyer le code si pas déjà fait
                      if (method === 'whatsapp' && challengeId && !whatsappCodeSent) {
                        await sendWhatsAppLoginCode();
                      }
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: SPACING.sm,
                      borderRadius: BORDER_RADIUS.md,
                      borderWidth: 1,
                      borderColor: isActive ? colors.primary : colors.border,
                      backgroundColor: isActive ? colors.primary + '20' : colors.card,
                      alignItems: 'center',
                    }}
                  >
                    <AdaptiveText
                      variant="caption"
                      weight="medium"
                      color={isActive ? colors.primary : colors.textSecondary}
                    >
                      {label}
                    </AdaptiveText>
                  </Pressable>
                );
              })}
            </Row>
          )}

          <AdaptiveText variant="caption" weight="regular" color={colors.textSecondary} style={{ textAlign: 'center' }}>
            {selectedMethod === 'authenticator'
              ? 'Saisissez le code à 6 chiffres généré par votre application Authenticator.'
              : `Saisissez le code à 6 chiffres reçu au ${getMaskedPhoneForWhatsApp()} sur WhatsApp.`}
          </AdaptiveText>

          <Input
            label={`Code 2FA (${methodLabel})`}
            value={twoFactorCode}
            onChangeText={text => {
              setTwoFactorCode(text);
              if (error) clearError();
            }}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="123456"
          />

          <Stack spacing="sm">
            <Button
              title={
                selectedMethod === 'authenticator'
                  ? 'Valider le code Authenticator'
                  : 'Valider le code WhatsApp'
              }
              onPress={handleVerify2FA}
              variant="gradient"
              loading={isAuthenticating && twoFactorRequired}
              disabled={twoFactorCode.length !== 6}
              fullWidth
            />

            {selectedMethod === 'whatsapp' && challengeId && (
              <Pressable
                onPress={sendWhatsAppLoginCode}
                style={{ alignSelf: 'center', marginTop: SPACING.xs }}
              >
                <AdaptiveText variant="caption" weight="medium" color={colors.primary} style={{ textDecorationLine: 'underline' }}>
                  Renvoyer le code
                </AdaptiveText>
                <AdaptiveText variant="caption" weight="regular" color={colors.textSecondary} style={{ fontSize: 11, marginTop: 2 }}>
                  Maximum 3 envois par tentative de connexion
                </AdaptiveText>
              </Pressable>
            )}

            <Pressable
              onPress={() => {
                setChallengeId(null);
                setTwoFactorCode('');
                clearError();
              }}
              style={{ alignSelf: 'center', marginTop: SPACING.xs }}
            >
              <AdaptiveText variant="caption" weight="regular" color={colors.textSecondary}>
                Annuler
              </AdaptiveText>
            </Pressable>
          </Stack>
        </Stack>
      </BaseModal>

      {/* Popup de chargement pour la connexion */}
      <LoadingPopup visible={isAuthenticating} />
      </KeyboardAvoidingView>
    </AuthPageLayout>
  );
}

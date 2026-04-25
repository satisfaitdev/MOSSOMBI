import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SPACING } from '@/constants/colors';
import { Stack, Row } from '@/components/ui';
import { PageContainer } from '@/components/layouts';
import Button from '@/components/Button';
import PhoneInput from '@/components/PhoneInput';
import AuthLogo from '@/components/AuthLogo';
import { useAuth } from '@/contexts/AuthContext';
import { AdaptiveCard } from '@/components/ui/AdaptiveCard';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import AuthPageLayout from '@/components/layouts/AuthPageLayout';

export default function RegisterStep1Screen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const { isLoading } = useAuth();
  
  const [phone, setPhone] = useState('');
  const [phoneExists, setPhoneExists] = useState(false);
  const [phoneIsVerified, setPhoneIsVerified] = useState<boolean | null>(null);
  const [phoneValid, setPhoneValid] = useState(false);

  const handleContinue = async () => {
    // Validation du numéro de téléphone
    if (!phone) {
      Alert.alert('Erreur', 'Veuillez entrer votre numéro de téléphone');
      return;
    }

    if (!phoneValid) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro de téléphone valide');
      return;
    }

    // Important: si is_verified est NULL/undefined (données legacy), on considère le compte comme déjà vérifié.
    if (phoneExists && phoneIsVerified !== false) {
      Alert.alert('Erreur', 'Ce numéro de téléphone est déjà utilisé. Essayez de vous connecter.');
      return;
    }

    if (phoneExists && phoneIsVerified === false) {
      console.log('📱 Compte existant mais non vérifié, redirection vers vérification OTP:', phone);
      router.push({
        pathname: '/auth/register-step2',
        params: {
          phone,
          otpSent: 'false',
          accountCreated: 'true',
          flow: 'verify_existing_unverified_user',
        },
      } as any);
      return;
    }

    console.log('📱 Numéro validé, passage à l\'étape 3 (création profil):', phone);
    
    // Passer à l'étape 3 pour créer le profil complet
    // La vérification OTP se fera à la fin (étape 2)
    router.push({
      pathname: '/auth/register-step3',
      params: { phone }
    } as any);
  };

  const handlePhoneValidation = (isValid: boolean, exists: boolean, isVerified?: boolean | null) => {
    setPhoneValid(isValid);
    setPhoneExists(exists);
    setPhoneIsVerified(isVerified ?? null);
  };

  return (
    <AuthPageLayout title={t('registerTitle' as any)}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <PageContainer style={{ backgroundColor: 'transparent' }}>
          <Stack spacing="md" style={{ alignItems: 'center', marginTop: SPACING.lg }}>
            <AuthLogo size={96} />
            <Stack spacing="xs" style={{ alignItems: 'center' }}>
              <AdaptiveText variant="display" weight="bold" style={{ textAlign: 'center' }}>
                {t('registerTitle' as any)}
              </AdaptiveText>
              <AdaptiveText variant="caption" weight="regular" style={{ textAlign: 'center' }}>
                {t('step1Title' as any)}
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
                label={t('whatsappNumber' as any)}
                value={phone}
                onChangeText={setPhone}
                onPhoneValidation={handlePhoneValidation}
                countrySelectable={false}
              />
              <AdaptiveText variant="caption" weight="regular" color={colors.textSecondary}>
                {t('whatsappNumber' as any) === 'WhatsApp Number'
                  ? 'We will send you a verification code via SMS'
                  : 'Nous vous enverrons un code de vérification par SMS'}
              </AdaptiveText>
              <Button
                title={t('next' as any)}
                onPress={handleContinue}
                variant="gradient"
                loading={isLoading}
                disabled={!phone || phone.length < 10 || !phoneValid || phoneExists}
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
            title={t('alreadyHaveAccount' as any)}
            onPress={() => router.back()}
            variant="secondary"
            fullWidth
          />
        </PageContainer>
      </KeyboardAvoidingView>
    </AuthPageLayout>
  );
}

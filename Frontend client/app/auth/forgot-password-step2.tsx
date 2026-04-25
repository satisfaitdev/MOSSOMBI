import React, { useState, useRef } from 'react';
import { KeyboardAvoidingView, Platform, View, TextInput, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@/constants/colors';
import { Stack as VStack } from '@/components/ui';
import { PageContainer } from '@/components/layouts';
import AuthLogo from '@/components/AuthLogo';
import { AdaptiveCard } from '@/components/ui/AdaptiveCard';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import { apiService } from '@/services/api';
import AuthPageLayout from '@/components/layouts/AuthPageLayout';

export default function ForgotPasswordStep2Screen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const params = useLocalSearchParams();
  const phone = params.phone as string;
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) value = value[value.length - 1];
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Navigation automatique vers le champ suivant
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Validation automatique quand tous les champs sont remplis
    if (newOtp.every(digit => digit !== '')) {
      const otpCode = newOtp.join('');
      handleAutoVerify(otpCode);
    }
  };

  const handleAutoVerify = async (otpCode: string) => {
    if (loading) return; // Éviter les appels multiples
    
    if (!phone) {
      Alert.alert('Erreur', 'Numéro de téléphone manquant. Veuillez recommencer.');
      router.replace('/auth/forgot-password-step1' as any);
      return;
    }

    setLoading(true);
    try {
      const result = await apiService.verifyResetOtp({ phone, otp_code: otpCode });
      if (!result.success) {
        Alert.alert('Erreur', result.error || 'Code invalide.');
        return;
      }

      const resetToken = (result as any)?.data?.reset_token;
      if (!resetToken) {
        Alert.alert('Erreur', 'Token de réinitialisation manquant.');
        return;
      }

      router.push({
        pathname: '/auth/forgot-password-step3' as any,
        params: { phone, reset_token: resetToken }
      });
    } catch (e) {
      Alert.alert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <AuthPageLayout title={t('verificationCode' as any)}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: 'transparent' }}
      >
        <PageContainer style={{ backgroundColor: 'transparent' }}>
          <VStack spacing="md" style={{ alignItems: 'center', marginTop: SPACING.lg }}>
            <AuthLogo size={96} />
            <VStack spacing="xs" style={{ alignItems: 'center' }}>
              <AdaptiveText variant="display" weight="bold" style={{ textAlign: 'center' }}>
                {t('verificationCode' as any)}
              </AdaptiveText>
              <AdaptiveText variant="caption" weight="regular" style={{ textAlign: 'center' }}>
                {t('enterCodeSent' as any)} {phone ? phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2') : 'numéro'}
              </AdaptiveText>
            </VStack>
          </VStack>

          <AdaptiveCard
            margin={0}
            padding={Platform.select({ ios: 18, android: 16 })}
            variant="elevated"
            style={{ width: '100%', marginTop: SPACING.lg }}
          >
            <VStack spacing="md">
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    style={{
                      width: 50,
                      height: 60,
                      backgroundColor: colors.surface,
                      borderColor: digit ? colors.primary : colors.border,
                      borderWidth: 2,
                      borderRadius: BORDER_RADIUS.lg,
                      color: colors.text,
                      fontSize: TYPOGRAPHY.sizes.xxl,
                      fontWeight: TYPOGRAPHY.weights.bold,
                      textAlign: 'center',
                      opacity: loading ? 0.6 : 1,
                    }}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    editable={!loading}
                  />
                ))}
              </View>

              {/* Indicateur de validation automatique */}
              {loading && (
                <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md }}>
                  <AdaptiveText variant="caption" weight="regular" style={{ color: colors.primary }}>
                    {t('validationInProgress' as any)}
                  </AdaptiveText>
                </View>
              )}

              {/* Message d'aide */}
              {!loading && (
                <AdaptiveText
                  variant="caption"
                  weight="regular"
                  style={{ textAlign: 'center', color: colors.textSecondary, marginTop: SPACING.sm }}
                >
                  {t('verificationCode' as any) === 'Verification Code'
                    ? 'The code will be validated automatically once you enter all 6 digits'
                    : 'Le code sera validé automatiquement dès que vous aurez saisi les 6 chiffres'}
                </AdaptiveText>
              )}
            </VStack>
          </AdaptiveCard>
        </PageContainer>
      </KeyboardAvoidingView>
    </AuthPageLayout>
  );
}

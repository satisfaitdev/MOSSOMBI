import React, { useState, useRef } from 'react';
import { KeyboardAvoidingView, Platform, View, TextInput, Alert } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@/constants/colors';
import { Heading, Caption } from '@/components/atoms';
import { Stack as VStack, Row } from '@/components/ui';
import { PageContainer } from '@/components/layouts';

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
    
    // Délai court pour l'UX
    setTimeout(() => {
      setLoading(false);
      router.push({
        pathname: '/auth/forgot-password-step3' as any,
        params: { phone, otp_code: otpCode }
      });
    }, 800);
  };


  return (
    <>
      <Stack.Screen options={{ 
        title: t('verificationCode' as any), 
        headerStyle: { backgroundColor: colors.card }, 
        headerTintColor: colors.text 
      }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <PageContainer>
          <VStack spacing="lg" style={{ marginTop: SPACING.xl }}>
            <VStack spacing="xs" style={{ alignItems: 'center' }}>
              <Heading level={2}>{t('verificationCode' as any)}</Heading>
              <Caption style={{ textAlign: 'center' }}>
                {t('enterCodeSent' as any)} {phone ? phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2') : 'numéro'}
              </Caption>
            </VStack>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: SPACING.xl }}>
                {otp.map((digit, index) => (
                  <TextInput 
                    key={index} 
                    ref={(ref) => { inputRefs.current[index] = ref; }} 
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
                      opacity: loading ? 0.6 : 1
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
                <View style={{ 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  paddingVertical: SPACING.md 
                }}>
                  <Caption style={{ color: colors.primary }}>
                    {t('validationInProgress' as any)}
                  </Caption>
                </View>
              )}
              
              {/* Message d'aide */}
            {!loading && (
              <Caption style={{ 
                textAlign: 'center', 
                color: colors.textSecondary,
                marginTop: SPACING.sm
              }}>
                {t('verificationCode' as any) === 'Verification Code' ?
                  'The code will be validated automatically once you enter all 6 digits' :
                  'Le code sera validé automatiquement dès que vous aurez saisi les 6 chiffres'
                }
              </Caption>
            )}
          </VStack>
        </PageContainer>
      </KeyboardAvoidingView>
    </>
  );
}

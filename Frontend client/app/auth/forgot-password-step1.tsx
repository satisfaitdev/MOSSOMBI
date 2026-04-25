import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { SPACING } from '@/constants/colors';
import { Stack as VStack } from '@/components/ui';
import { PageContainer } from '@/components/layouts';
import Button from '@/components/Button';
import PhoneInput from '@/components/PhoneInput';
import AuthLogo from '@/components/AuthLogo';
import { apiService } from '@/services/api';
import { AdaptiveCard } from '@/components/ui/AdaptiveCard';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import AuthPageLayout from '@/components/layouts/AuthPageLayout';

export default function ForgotPasswordStep1Screen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [phoneValid, setPhoneValid] = useState(false);
  const [phoneExists, setPhoneExists] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePhoneValidation = (isValid: boolean, exists: boolean) => {
    setPhoneValid(isValid);
    setPhoneExists(exists);
  };

  const handleContinue = async () => {
    if (!phone || !phoneValid || !phoneExists) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro de téléphone valide avec un compte existant.');
      return;
    }

    setLoading(true);
    try {
      console.log('📤 Forgot password: demande envoi OTP (WhatsApp) - phone:', phone);
      const result = await apiService.forgotPassword(phone);

      console.log('📨 Forgot password: réponse API:', {
        phone,
        success: result.success,
        error: result.error,
        data: result.data,
      });
      
      if (result.success) {
        console.log('✅ Forgot password: OTP envoyé', { phone, message: result.data?.message });
        Alert.alert(
          'Code envoyé',
          result.data?.message || 'Un code de vérification a été envoyé par WhatsApp.',
          [
            {
              text: 'OK',
              onPress: () => router.push({
                pathname: '/auth/forgot-password-step2' as any,
                params: { phone }
              })
            }
          ]
        );
      } else {
        console.log('❌ Forgot password: échec envoi OTP', { phone, error: result.error });
        Alert.alert('Erreur', result.error || 'Impossible d\'envoyer le code.');
      }
    } catch (error) {
      console.error('Erreur forgot password:', error);
      console.log('❌ Forgot password: exception envoi OTP', { phone, error });
      Alert.alert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout title={t('forgotPassword' as any)}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: 'transparent' }}
      >
        <PageContainer style={{ backgroundColor: 'transparent' }}>
          <VStack spacing="md" style={{ alignItems: 'center', marginTop: SPACING.lg }}>
            <AuthLogo size={96} />
            <VStack spacing="xs" style={{ alignItems: 'center' }}>
              <AdaptiveText variant="display" weight="bold" style={{ textAlign: 'center' }}>
                {t('forgotPassword' as any) === 'Forgot Password?' ? 'Reset Password' : 'Réinitialiser le mot de passe'}
              </AdaptiveText>
              <AdaptiveText variant="caption" weight="regular" style={{ textAlign: 'center' }}>
                {t('phoneNumber' as any) === 'Phone Number'
                  ? 'Enter your phone number to receive a WhatsApp verification code'
                  : 'Entrez votre numéro de téléphone pour recevoir un code de vérification par WhatsApp'}
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
              <PhoneInput
                label={t('phoneNumber' as any)}
                value={phone}
                onChangeText={setPhone}
                onPhoneValidation={handlePhoneValidation}
                countrySelectable={true}
                mode="login"
              />
              
              <Button 
                title={t('phoneNumber' as any) === 'Phone Number' ? 'Send Code' : 'Envoyer le code'} 
                onPress={handleContinue} 
                variant="gradient" 
                loading={loading} 
                disabled={!phone || !phoneValid || !phoneExists} 
                fullWidth 
              />
            </VStack>
          </AdaptiveCard>
        </PageContainer>
      </KeyboardAvoidingView>
    </AuthPageLayout>
  );
}

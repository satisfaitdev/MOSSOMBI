import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SPACING } from '@/constants/colors';
import { Heading, Caption } from '@/components/atoms';
import { Stack as VStack } from '@/components/ui';
import { PageContainer } from '@/components/layouts';
import Button from '@/components/Button';
import PhoneInput from '@/components/PhoneInput';
import AuthLogo from '@/components/AuthLogo';
import { apiService } from '@/services/api';

export default function ForgotPasswordStep1Screen() {
  const { colors } = useTheme();
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
      const result = await apiService.forgotPassword(phone);
      
      if (result.success) {
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
        Alert.alert('Erreur', result.error || 'Impossible d\'envoyer le code.');
      }
    } catch (error) {
      console.error('Erreur forgot password:', error);
      Alert.alert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: t('forgotPassword' as any), 
        headerStyle: { backgroundColor: colors.card }, 
        headerTintColor: colors.text 
      }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <PageContainer>
          <VStack spacing="lg" style={{ alignItems: 'center', marginTop: SPACING.xl }}>
            <AuthLogo size={100} />
            <VStack spacing="xs" style={{ alignItems: 'center' }}>
              <Heading level={2}>
                {t('forgotPassword' as any) === 'Forgot Password?' ? 'Reset Password' : 'Réinitialiser le mot de passe'}
              </Heading>
              <Caption style={{ textAlign: 'center' }}>
                {t('phoneNumber' as any) === 'Phone Number' ? 
                  'Enter your phone number to receive a WhatsApp verification code' :
                  'Entrez votre numéro de téléphone pour recevoir un code de vérification par WhatsApp'
                }
              </Caption>
            </VStack>
          </VStack>

          <VStack spacing="md" style={{ marginTop: SPACING.xl }}>
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
        </PageContainer>
      </KeyboardAvoidingView>
    </>
  );
}

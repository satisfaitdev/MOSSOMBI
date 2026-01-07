import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@/constants/colors';
import { Heading, Caption } from '@/components/atoms';
import { Stack, Row } from '@/components/ui';
import { PageContainer } from '@/components/layouts';
import Button from '@/components/Button';
import PhoneInput from '@/components/PhoneInput';
import AuthLogo from '@/components/AuthLogo';
import { Country } from '@/components/CountryPicker';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterStep1Screen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const { register, isLoading } = useAuth();
  
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [phoneExists, setPhoneExists] = useState(false);
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

    if (phoneExists) {
      Alert.alert('Erreur', 'Ce numéro de téléphone est déjà utilisé. Essayez de vous connecter.');
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

  const handlePhoneValidation = (isValid: boolean, exists: boolean) => {
    setPhoneValid(isValid);
    setPhoneExists(exists);
  };

  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <PageContainer>
        <Stack spacing="lg" style={{ alignItems: 'center', marginTop: SPACING.xl }}>
          <AuthLogo size={120} />
          <Stack spacing="xs" style={{ alignItems: 'center' }}>
            <Heading level={1}>{t('registerTitle' as any)}</Heading>
            <Caption style={{ textAlign: 'center' }}>{t('step1Title' as any)}</Caption>
          </Stack>
        </Stack>

        <Stack spacing="md" style={{ marginTop: SPACING.xl }}>
          <PhoneInput
            label={t('whatsappNumber' as any)}
            value={phone}
            onChangeText={setPhone}
            onCountryChange={handleCountryChange}
            onPhoneValidation={handlePhoneValidation}
            countrySelectable={false}
          />
          <Caption>
            {t('whatsappNumber' as any) === 'WhatsApp Number' ? 
              'We will send you a verification code via SMS' : 
              'Nous vous enverrons un code de vérification par SMS'
            }
          </Caption>
          <Button 
            title={t('next' as any)} 
            onPress={handleContinue} 
            variant="gradient" 
            loading={isLoading} 
            disabled={!phone || phone.length < 10 || !phoneValid || phoneExists} 
            fullWidth 
          />

          <Row align="center" style={{ marginVertical: SPACING.md }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            <Caption style={{ marginHorizontal: SPACING.sm }}>{t('or' as any)}</Caption>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          </Row>

          <Button 
            title={t('alreadyHaveAccount' as any)} 
            onPress={() => router.back()} 
            variant="outline" 
            fullWidth 
          />
        </Stack>
      </PageContainer>
    </KeyboardAvoidingView>
  );
}

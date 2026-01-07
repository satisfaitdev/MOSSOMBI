import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Pressable, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@/constants/colors';
import { Heading, Body, Caption } from '@/components/atoms';
import { Stack, Row } from '@/components/ui';
import { PageContainer } from '@/components/layouts';
import Button from '@/components/Button';
import { apiService } from '@/services/api';
import { CheckCircle, XCircle, Loader } from 'lucide-react-native';

export default function RegisterStep2Screen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [otpSent, setOtpSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCodeValid, setIsCodeValid] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const pollingRef = useRef<any>(null);
  
  const phone = params.phone as string;

  // Vérifier si l'OTP a déjà été envoyé depuis l'étape précédente
  useEffect(() => {
    const otpAlreadySent = params.otpSent as string;
    if (otpAlreadySent === 'true') {
      setOtpSent(true);
      console.log('📱 OTP déjà envoyé depuis l\'étape précédente');
    }
  }, [params.otpSent]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Nettoyage du polling au démontage du composant
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }
    };
  }, []);

  // Fonction pour vérifier automatiquement le code OTP
  const checkOTPAutomatically = async (otpCode: string) => {
    if (otpCode.length !== 6) return;
    
    setIsVerifying(true);
    try {
      // Vérifier automatiquement le code OTP et finaliser la vérification du compte
      const verifyResult = await apiService.verifyOTP({
        phone: phone,
        otp_code: otpCode
      });
      
      if (verifyResult.success) {
        setIsCodeValid(true);
        setIsVerifying(false);
        // Arrêter le polling
        if (pollingRef.current) {
          clearTimeout(pollingRef.current);
          pollingRef.current = null;
        }
        console.log('✅ Code OTP valide détecté automatiquement, compte vérifié !');
        
        // Le compte est maintenant complètement vérifié (is_verified = true)
        // Redirection directe vers login après validation OTP
        setTimeout(() => {
          console.log('🚀 Redirection vers login - Compte vérifié et prêt');
          Alert.alert('Succès', 'Compte créé et vérifié avec succès !', [
            {
              text: 'Se connecter',
              onPress: () => {
                router.replace('/auth/login' as any);
              }
            }
          ]);
        }, 1000); // Délai de 1s pour montrer le succès
      } else {
        setIsCodeValid(false);
        setIsVerifying(false);
      }
    } catch (error) {
      setIsCodeValid(false);
      setIsVerifying(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) value = value[value.length - 1];
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Focus sur le champ suivant
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    
    // Vérifier automatiquement si le code est complet
    const fullCode = newOtp.join('');
    if (fullCode.length === 6) {
      // Démarrer le polling pour vérifier le code
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }
      pollingRef.current = setTimeout(() => {
        checkOTPAutomatically(fullCode);
      }, 500); // Délai de 500ms pour éviter trop de requêtes
    } else {
      // Réinitialiser l'état si le code n'est pas complet
      setIsCodeValid(false);
      setIsVerifying(false);
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
        pollingRef.current = null;
      }
    }
  };

  const handleVerify = async () => {
    // Cette fonction n'est plus utilisée car tout est automatique
    // Mais on la garde au cas où l'utilisateur clique manuellement
    console.log('🔄 Bouton continuer cliqué - Transition déjà en cours...');
  };

  const handleResendOTP = async () => {
    if (!phone) return;
    
    try {
      const response = await apiService.sendOTP(phone);
      if (response.success) {
        setCountdown(60);
        setOtpSent(true);
        Alert.alert('Code renvoyé', 'Un nouveau code a été envoyé par WhatsApp');
      } else {
        Alert.alert('Erreur', 'Impossible de renvoyer le code');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <PageContainer>
        <Stack spacing="md" style={{ marginTop: SPACING.xl }}>
          <Stack spacing="xs" style={{ alignItems: 'center' }}>
            <Heading level={2}>{t('verificationCode' as any)}</Heading>
            <Caption style={{ textAlign: 'center' }}>
              {t('step3Title' as any)} : {t('enterCodeSent' as any)} {phone}
            </Caption>
            {otpSent && (
              <Caption style={{ marginTop: SPACING.xs, color: colors.success || '#10B981' }}>
                {t('codeSentSuccess' as any)}
              </Caption>
            )}
          </Stack>
          <View style={{ alignItems: 'center', marginVertical: SPACING.lg }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              {otp.map((digit, index) => (
                <TextInput key={index} ref={(ref) => { inputRefs.current[index] = ref; }} style={{ width: 50, height: 60, backgroundColor: colors.surface, borderColor: digit ? colors.primary : colors.border, borderWidth: 2, borderRadius: BORDER_RADIUS.lg, color: colors.text, fontSize: TYPOGRAPHY.sizes.xxl, fontWeight: TYPOGRAPHY.weights.bold, textAlign: 'center' }} value={digit} onChangeText={(value) => handleOtpChange(value, index)} keyboardType="number-pad" maxLength={1} selectTextOnFocus />
              ))}
            </View>
            
            {/* Indicateur visuel du polling */}
            {otp.join('').length === 6 && (
              <Row align="center" style={{ marginTop: SPACING.md }}>
                {isVerifying && (
                  <>
                    <Loader size={16} color={colors.textSecondary} />
                    <Caption style={{ marginLeft: SPACING.xs, color: colors.textSecondary }}>
                      {t('verifying' as any)}
                    </Caption>
                  </>
                )}
                {!isVerifying && isCodeValid && (
                  <>
                    <CheckCircle size={16} color={colors.success || '#10B981'} />
                    <Caption style={{ marginLeft: SPACING.xs, color: colors.success || '#10B981' }}>
                      {t('codeValid' as any)}
                    </Caption>
                  </>
                )}
                {!isVerifying && !isCodeValid && otp.join('').length === 6 && (
                  <>
                    <XCircle size={16} color={colors.error} />
                    <Caption style={{ marginLeft: SPACING.xs, color: colors.error }}>
                      {t('codeIncorrect' as any)}
                    </Caption>
                  </>
                )}
              </Row>
            )}
          </View>
          <Button 
            title={isCodeValid ? t('next' as any) : t('verifying' as any)} 
            onPress={handleVerify} 
            variant="gradient" 
            loading={isVerifying} 
            disabled={!isCodeValid} 
            fullWidth 
          />
          {countdown > 0 ? (
            <Caption style={{ textAlign: 'center' }}>
              {t('next' as any) === 'Next' ? 
                `Resend code in ${countdown}s` : 
                `Renvoyer le code dans ${countdown}s`
              }
            </Caption>
          ) : (
            <Pressable onPress={handleResendOTP}>
              <Body style={{ color: colors.primary, textAlign: 'center', fontWeight: TYPOGRAPHY.weights.medium }}>
                {t('next' as any) === 'Next' ? 'Resend code' : 'Renvoyer le code'}
              </Body>
            </Pressable>
          )}
        </Stack>
      </PageContainer>
    </View>
  );
}

import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Alert, View, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Eye, EyeOff, User, Lock, Mail } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@/constants/colors';
import { Heading, Caption } from '@/components/atoms';
import { Stack, Row } from '@/components/ui';
import { PageContainer } from '@/components/layouts';
import Button from '@/components/Button';
import Input from '@/components/Input';
import AuthLogo from '@/components/AuthLogo';
import { useAuth } from '@/contexts/AuthContext';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator';
import { apiService } from '@/services/api';

export default function RegisterStep3Screen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { register } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const phone = params.phone as string;

  const handleRegister = async () => {
    // Validations
    if (!fullName || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    // La validation du mot de passe sera gérée par le backend
    // Le composant PasswordStrengthIndicator guide l'utilisateur

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    console.log('📝 Profil créé, création du compte et envoi OTP...', { phone, fullName, email });
    
    setIsLoading(true);
    try {
      // Créer le compte directement avec toutes les données
      const registerResult = await apiService.register({
        phone,
        full_name: fullName,
        email: email || undefined,
        password,
        country_code: 'CG'
      });
      
      if (registerResult.success) {
        console.log('✅ Compte créé avec succès, passage à l\'étape 2 pour vérification OTP');
        
        // L'OTP est automatiquement envoyé par le backend lors du register
        const otpWasSent = (registerResult.data as any)?.verification?.message_sent || false;
        
        router.push({
          pathname: '/auth/register-step2',
          params: {
            phone,
            fullName,
            email: email || '',
            password,
            otpSent: otpWasSent ? 'true' : 'false',
            accountCreated: 'true'
          }
        } as any);
      } else {
        console.log('❌ Erreur création compte:', registerResult.error);
        Alert.alert('Erreur', registerResult.error || 'Impossible de créer le compte. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Erreur création compte:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la création du compte.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <PageContainer>
        <Stack spacing="lg" style={{ alignItems: 'center', marginTop: SPACING.xl }}>
          <AuthLogo size={120} />
          <Stack spacing="xs" style={{ alignItems: 'center' }}>
            <Heading level={1}>{t('createProfile' as any)}</Heading>
            <Caption style={{ textAlign: 'center' }}>{t('step2Title' as any)}</Caption>
          </Stack>
        </Stack>

        <Stack spacing="md" style={{ marginTop: SPACING.xl }}>
          <Input 
            label={t('fullNameRequired' as any)} 
            value={fullName} 
            onChangeText={setFullName} 
            placeholder={t('fullNameRequired' as any)} 
            icon={<User size={20} color={colors.textSecondary} />}
          />
          
          <Input 
            label={t('emailOptional' as any)} 
              value={email} 
              onChangeText={setEmail} 
              keyboardType="email-address" 
              placeholder="votre@email.com" 
              icon={<Mail size={20} color={colors.textSecondary} />}
            />
            
          <Input 
            label={t('password' as any)} 
            value={password} 
            onChangeText={setPassword} 
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
            
            {/* Indicateur de force du mot de passe */}
            {password.length > 0 && (
              <PasswordStrengthIndicator 
                password={password}
                userInfo={{
                  full_name: fullName,
                  email: email
                }}
                showCriteria={true}
              />
            )}
            
            <Input 
              label="Confirmer le mot de passe" 
              value={confirmPassword} 
              onChangeText={setConfirmPassword} 
              secureTextEntry={!showConfirmPassword}
              placeholder="Répétez votre mot de passe" 
              icon={<Lock size={20} color={colors.textSecondary} />}
              rightIcon={
                <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} hitSlop={8}>
                  {showConfirmPassword ? 
                    <EyeOff size={20} color={colors.textSecondary} /> : 
                    <Eye size={20} color={colors.textSecondary} />
                  }
                </Pressable>
              }
            />

          <Caption style={{ textAlign: 'center', marginTop: SPACING.md }}>
            {t('termsAccept' as any)}
          </Caption>

          <Button 
            title={t('createAccount' as any)} 
            onPress={handleRegister} 
            variant="gradient" 
            loading={isLoading} 
            disabled={!fullName || !password || !confirmPassword || password !== confirmPassword} 
            fullWidth 
          />

          <Row align="center" style={{ marginVertical: SPACING.md }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            <Caption style={{ marginHorizontal: SPACING.md }}>{t('or' as any)}</Caption>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          </Row>

          <Button 
            title={t('alreadyHaveAccount' as any)} 
            onPress={() => router.replace('/auth/login' as any)} 
            variant="outline" 
            fullWidth 
          />
        </Stack>
      </PageContainer>
    </KeyboardAvoidingView>
  );
}

import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Eye, EyeOff, Lock } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SPACING } from '@/constants/colors';
import { Stack as VStack } from '@/components/ui';
import { PageContainer } from '@/components/layouts';
import Button from '@/components/Button';
import Input from '@/components/Input';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator';
import { apiService } from '@/services/api';
import AuthLogo from '@/components/AuthLogo';
import { AdaptiveCard } from '@/components/ui/AdaptiveCard';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import AuthPageLayout from '@/components/layouts/AuthPageLayout';

export default function ForgotPasswordStep3Screen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const params = useLocalSearchParams();
  const phone = params.phone as string;
  const reset_token = params.reset_token as string;
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (!phone || !reset_token) {
      Alert.alert('Erreur', 'Informations manquantes. Veuillez recommencer.');
      router.replace('/auth/forgot-password-step1' as any);
      return;
    }

    setLoading(true);
    try {
      const result = await apiService.resetPassword({
        phone,
        reset_token,
        new_password: password
      });

      if (result.success) {
        Alert.alert(
          'Succès',
          result.data?.message || 'Mot de passe réinitialisé avec succès !',
          [
            {
              text: 'Se connecter',
              onPress: () => router.replace('/auth/login' as any)
            }
          ]
        );
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de réinitialiser le mot de passe.');
      }
    } catch (error) {
      console.error('Erreur reset password:', error);
      Alert.alert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout
      title={t('password' as any) === 'Password' ? 'New Password' : 'Nouveau mot de passe'}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: 'transparent' }}
      >
        <PageContainer style={{ backgroundColor: 'transparent' }}>
          <VStack spacing="md" style={{ alignItems: 'center', marginTop: SPACING.lg }}>
            <AuthLogo size={96} />
            <VStack spacing="xs" style={{ alignItems: 'center' }}>
              <AdaptiveText variant="display" weight="bold" style={{ textAlign: 'center' }}>
                {t('password' as any) === 'Password' ? 'New Password' : 'Nouveau mot de passe'}
              </AdaptiveText>
              <AdaptiveText variant="caption" weight="regular" style={{ textAlign: 'center' }}>
                {t('password' as any) === 'Password' ? 'Choose a secure password' : 'Choisissez un mot de passe sécurisé'}
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
                    showCriteria={true}
                  />
                )}
                
              <Input 
                label={t('confirmPassword' as any)} 
                value={confirmPassword} 
                onChangeText={setConfirmPassword} 
                secureTextEntry={!showConfirmPassword} 
                placeholder={t('confirmPassword' as any)} 
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
              <Button 
                title={t('password' as any) === 'Password' ? 'Reset Password' : 'Réinitialiser le mot de passe'} 
                onPress={handleReset} 
                variant="gradient" 
                loading={loading} 
                disabled={!password || !confirmPassword || password !== confirmPassword} 
                fullWidth 
              />
            </VStack>
          </AdaptiveCard>
        </PageContainer>
      </KeyboardAvoidingView>
    </AuthPageLayout>
  );
}

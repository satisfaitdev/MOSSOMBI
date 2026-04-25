import { useRouter } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import React, { useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import LoadingPopup from '@/components/LoadingPopup';

export default function CustomTabLayout() {
  const { colors, isDark } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // AuthGuard - Rediriger vers login si non authentifié
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Afficher le popup de chargement pendant la vérification
  if (isLoading) {
    return <LoadingPopup visible={true} />;
  }

  // Bloquer l'affichage si non authentifié
  if (!isAuthenticated) {
    return <LoadingPopup visible={true} />;
  }

  return (
    <NativeTabs
      blurEffect={isDark ? 'systemMaterialDark' : 'systemMaterial'}
      backgroundColor={null}
      disableIndicator
      disableTransparentOnScrollEdge
      minimizeBehavior="onScrollDown"
      tintColor={colors.gradient.start}
      iconColor={colors.tabIconDefault}
      labelStyle={{
        fontSize: 10,
        fontWeight: '500',
        color: colors.tabIconDefault,
      }}
    >
      <NativeTabs.Trigger name="index">
        <Label>Accueil</Label>
        <Icon sf="house.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="services">
        <Label>Services</Label>
        <Icon sf="square.grid.2x2.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="orders">
        <Label>Commandes</Label>
        <Icon sf="bag.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Label>Profil</Label>
        <Icon sf="person.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="wallet" hidden />
    </NativeTabs>
  );
}

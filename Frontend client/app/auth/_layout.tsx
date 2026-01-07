import { Stack } from 'expo-router';
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function AuthLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerBackTitle: 'Retour',
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: 'Connexion',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="register-step1"
        options={{
          title: 'Inscription',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="register-step2"
        options={{
          title: 'Vérification',
        }}
      />
      <Stack.Screen
        name="register-step3"
        options={{
          title: 'Informations personnelles',
        }}
      />
      <Stack.Screen
        name="forgot-password-step1"
        options={{
          title: 'Mot de passe oublié',
        }}
      />
      <Stack.Screen
        name="forgot-password-step2"
        options={{
          title: 'Vérification',
        }}
      />
      <Stack.Screen
        name="forgot-password-step3"
        options={{
          title: 'Nouveau mot de passe',
        }}
      />
    </Stack>
  );
}

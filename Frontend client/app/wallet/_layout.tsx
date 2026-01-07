import { Stack } from 'expo-router';
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function WalletLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Mon Portefeuille',
        }}
      />
      <Stack.Screen
        name="recharge"
        options={{
          title: 'Recharger',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="withdraw"
        options={{
          title: 'Retirer',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="transactions"
        options={{
          title: 'Historique',
        }}
      />
    </Stack>
  );
}

import React from 'react';
import { View } from 'react-native';
import { Link, Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';
import { Heading, Body } from '@/components/atoms';
import { Stack as VStack } from '@/components/ui';

export default function NotFoundScreen() {
  const { colors } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg, backgroundColor: colors.background }}>
        <VStack spacing="md" style={{ alignItems: 'center' }}>
          <Heading level={1}>404</Heading>
          <Body style={{ textAlign: 'center' }}>Cette page n&apos;existe pas.</Body>
          <Link href="/" style={{ marginTop: SPACING.md }}>
            <Body style={{ color: colors.primary }}>Retour à l&apos;accueil</Body>
          </Link>
        </VStack>
      </View>
    </>
  );
}

import React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '@/constants/colors';
import { Heading, Body } from '@/components/atoms';
import { Stack } from '@/components/ui';
import Button from '@/components/Button';

export default function ModalScreen() {
  const { colors } = useTheme();

  return (
    <Modal animationType="fade" transparent visible onRequestClose={() => router.back()}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }} onPress={() => router.back()}>
        <View style={{ backgroundColor: colors.card, borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl, margin: SPACING.lg, alignItems: 'center', minWidth: 300 }}>
          <Stack spacing="md" style={{ alignItems: 'center' }}>
            <Heading level={3}>Modal</Heading>
            <Body style={{ textAlign: 'center', color: colors.textSecondary }}>Ceci est un exemple de modal avec animation fade. Vous pouvez l&apos;éditer dans app/modal.tsx.</Body>
            <Button title="Fermer" onPress={() => router.back()} variant="primary" fullWidth />
          </Stack>
        </View>
      </Pressable>
      <StatusBar style="light" />
    </Modal>
  );
}

/**
 * Bouton de montant rapide
 * Composant réutilisable pour la sélection rapide de montants
 */

import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '@/constants/colors';
import { Caption } from '@/components/atoms';

interface QuickAmountButtonProps {
  amount: number;
  onPress: () => void;
}

export default function QuickAmountButton({ amount, onPress }: QuickAmountButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <Caption>{amount.toLocaleString()} CDF</Caption>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
  },
});

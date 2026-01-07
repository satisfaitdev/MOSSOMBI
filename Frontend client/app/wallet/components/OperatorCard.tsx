/**
 * Carte de sélection d'opérateur
 * Composant réutilisable pour recharge et retrait
 */

import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@/constants/colors';
import { Caption } from '@/components/atoms';
import { Operator } from '../types';

interface OperatorCardProps {
  operator: Operator;
  selected: boolean;
  onPress: () => void;
}

export default function OperatorCard({ operator, selected, onPress }: OperatorCardProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: selected ? operator.color + '20' : colors.surface,
          borderColor: selected ? operator.color : colors.border,
        },
      ]}
    >
      <Caption style={{ fontWeight: TYPOGRAPHY.weights.bold }}>{operator.name}</Caption>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '47%',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.sm,
    alignItems: 'center',
  },
});

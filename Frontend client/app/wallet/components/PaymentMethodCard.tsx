/**
 * Carte de sélection de méthode de paiement
 * Composant réutilisable pour recharge et retrait
 */

import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '@/constants/colors';
import { Caption } from '@/components/atoms';
import { PaymentMethod } from '../types';

interface PaymentMethodCardProps {
  method: PaymentMethod;
  selected: boolean;
  onPress: () => void;
}

export default function PaymentMethodCard({ method, selected, onPress }: PaymentMethodCardProps) {
  const { colors } = useTheme();
  const Icon = method.icon;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: selected ? method.color + '20' : colors.surface,
          borderColor: selected ? method.color : colors.border,
        },
      ]}
    >
      <Icon size={20} color={method.color} />
      <Caption style={styles.label}>{method.name}</Caption>
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
  label: {
    marginTop: SPACING.xs / 2,
    textAlign: 'center',
  },
});

/**
 * Carte de sélection de numéro de téléphone
 * Composant réutilisable pour la gestion des numéros
 */

import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@/constants/colors';
import { COMMON_STYLES } from '@/constants/styles';
import { Body, Caption } from '@/components/atoms';
import { Stack } from '@/components/ui';

interface PhoneNumberCardProps {
  id: string;
  number: string;
  operator: string;
  selected: boolean;
  onPress: () => void;
}

export default function PhoneNumberCard({ 
  number, 
  operator, 
  selected, 
  onPress 
}: PhoneNumberCardProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        COMMON_STYLES.rowCenter,
        {
          backgroundColor: colors.card,
          borderRadius: BORDER_RADIUS.lg,
          padding: SPACING.lg,
          borderWidth: 1,
          borderColor: selected ? colors.primary : colors.border,
        }
      ]}
    >
      <View 
        style={[
          COMMON_STYLES.center,
          {
            width: 40,
            height: 40,
            backgroundColor: colors.error + '20',
            borderRadius: BORDER_RADIUS.md,
            marginRight: SPACING.md
          }
        ]}
      >
        <Text>📱</Text>
      </View>
      <Stack style={{ flex: 1 }}>
        <Body style={{ fontWeight: TYPOGRAPHY.weights.medium }}>{operator}</Body>
        <Caption>{number}</Caption>
      </Stack>
    </Pressable>
  );
}

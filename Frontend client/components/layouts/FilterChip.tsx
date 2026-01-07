import React from 'react';
import { Pressable, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@/constants/colors';
import { Body } from '@/components/atoms';

interface FilterChipProps {
  /** Label du filtre */
  label: string;
  /** Est sélectionné */
  selected: boolean;
  /** Callback au clic */
  onPress: () => void;
  /** Icône optionnelle (React Element) */
  icon?: React.ReactNode;
  /** Style supplémentaire */
  style?: ViewStyle;
}

/**
 * Chip de filtre standardisé
 * Utilisé dans: orders, team, transactions, backpack, etc.
 */
export default function FilterChip({
  label,
  selected,
  onPress,
  icon,
  style,
}: FilterChipProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          backgroundColor: selected ? colors.primary : colors.card,
          borderRadius: BORDER_RADIUS.full,
          paddingHorizontal: SPACING.md,
          paddingVertical: SPACING.xs,
          borderWidth: 1,
          borderColor: selected ? colors.primary : colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: icon ? SPACING.xs : 0,
        },
        style,
      ]}
    >
      {icon}
      <Body
        style={{
          color: selected ? '#FFFFFF' : colors.text,
          fontSize: TYPOGRAPHY.sizes.xs,
          fontWeight: TYPOGRAPHY.weights.medium,
        }}
      >
        {label}
      </Body>
    </Pressable>
  );
}

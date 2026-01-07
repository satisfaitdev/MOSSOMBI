import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/constants/colors';

interface SelectionOption {
  id: string;
  name: string;
  subtitle?: string;
  color?: string;
}

interface SelectionGridProps {
  options: SelectionOption[];
  selected: string;
  onSelect: (value: string) => void;
  columns?: 2 | 4;
  accentColor?: string;
}

/**
 * Grille de sélection pour les services publics
 * Utilisée pour: opérateurs, fournisseurs, types de documents, périodes
 */
export default function SelectionGrid({
  options,
  selected,
  onSelect,
  columns = 2,
  accentColor,
}: SelectionGridProps) {
  const { colors } = useTheme();
  const defaultAccentColor = accentColor || colors.primary;

  return (
    <View style={[styles.grid, columns === 4 && styles.grid4]}>
      {options.map((option) => {
        const isSelected = selected === option.name;
        const bgColor = isSelected ? defaultAccentColor : colors.surface;
        const textColor = isSelected ? '#FFFFFF' : colors.text;
        const borderColor = isSelected ? defaultAccentColor : colors.border;

        return (
          <Pressable
            key={option.id}
            onPress={() => onSelect(option.name)}
            style={({ pressed }) => [
              styles.optionButton,
              columns === 4 && styles.optionButton4,
              {
                backgroundColor: bgColor,
                borderRadius: BORDER_RADIUS.md,
                borderWidth: 2,
                borderColor: borderColor,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.optionText,
                {
                  color: textColor,
                  fontSize: columns === 4 ? TYPOGRAPHY.sizes.xs : TYPOGRAPHY.sizes.sm,
                  fontWeight: TYPOGRAPHY.weights.semibold,
                  textAlign: 'center',
                },
              ]}
              numberOfLines={columns === 4 ? 2 : 1}
            >
              {option.name}
            </Text>
            {option.subtitle && (
              <Text
                style={[
                  styles.optionSubtitle,
                  {
                    color: isSelected ? '#FFFFFF' : colors.textSecondary,
                    fontSize: TYPOGRAPHY.sizes.xs,
                    marginTop: 4,
                  },
                ]}
              >
                {option.subtitle}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  grid4: {
    gap: SPACING.xs,
  },
  optionButton: {
    flex: 1,
    minWidth: '48%',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  optionButton4: {
    minWidth: '23%',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    minHeight: 64,
  },
  optionText: {},
  optionSubtitle: {
    textAlign: 'center',
  },
});

import React from 'react';
import { ScrollView, Pressable, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '@/constants/colors';
import { Body } from '@/components/atoms';

interface FilterOption {
  id: string;
  label: string;
}

interface FilterChipsProps {
  options: FilterOption[] | string[];
  selected: string;
  onSelect: (value: string) => void;
  style?: any;
}

/**
 * FilterChips - Composant de filtres horizontaux réutilisable
 * 
 * @example Avec tableau de strings
 * <FilterChips
 *   options={['Tous', 'Poppo', 'TikTok', 'Gaming']}
 *   selected={selectedCategory}
 *   onSelect={setSelectedCategory}
 * />
 * 
 * @example Avec tableau d'objets
 * <FilterChips
 *   options={[
 *     { id: 'all', label: 'Tous' },
 *     { id: 'income', label: 'Revenus' },
 *     { id: 'expense', label: 'Dépenses' }
 *   ]}
 *   selected={filter}
 *   onSelect={setFilter}
 * />
 */
export default function FilterChips({
  options,
  selected,
  onSelect,
  style,
}: FilterChipsProps) {
  const { colors } = useTheme();

  // Normaliser les options (string[] ou FilterOption[])
  const normalizedOptions: FilterOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { id: opt, label: opt };
    }
    return opt;
  });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: SPACING.lg,
        gap: SPACING.sm,
      }}
      style={[{ marginBottom: SPACING.md }, style]}
    >
      {normalizedOptions.map((option) => {
        const isSelected = selected === option.id;
        
        return (
          <Pressable
            key={option.id}
            onPress={() => onSelect(option.id)}
            style={({ pressed }) => [
              {
                backgroundColor: isSelected ? colors.primary : colors.card,
                borderRadius: BORDER_RADIUS.full,
                paddingHorizontal: SPACING.md,
                paddingVertical: SPACING.xs,
                opacity: pressed ? 0.7 : 1,
              },
              SHADOWS.sm,
            ]}
          >
            <Body
              style={{
                color: isSelected ? '#FFFFFF' : colors.text,
                fontSize: TYPOGRAPHY.sizes.xs,
                fontWeight: TYPOGRAPHY.weights.medium,
              }}
            >
              {option.label.charAt(0).toUpperCase() + option.label.slice(1)}
            </Body>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

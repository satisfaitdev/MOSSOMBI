/**
 * FILTRES DE CLASSE RÉUTILISABLES
 *
 * Composant pour sélectionner la classe de service (économique, affaires, première)
 * Utilisé dans flight, train et autres services avec classes.
 *
 * @example
 * ```tsx
 * <ClassFilters
 *   selectedClass={flightClass}
 *   onClassChange={setFlightClass}
 *   classes={[
 *     { id: 'economy', label: 'Économique', description: 'Confort standard' },
 *     { id: 'business', label: 'Affaires', description: 'Confort supérieur' },
 *     { id: 'first', label: 'Première', description: 'Luxe maximum' }
 *   ]}
 * />
 * ```
 */

import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants/colors';
import { Body, Caption } from '@/components/atoms';
import { Row } from '@/components/ui';

interface ClassOption {
  id: string;
  label: string;
  description: string;
}

interface ClassFiltersProps {
  selectedClass: string;
  onClassChange: (classId: string) => void;
  classes: ClassOption[];
  title?: string;
  style?: any;
}

export default function ClassFilters({
  selectedClass,
  onClassChange,
  classes,
  title = 'Classe de service',
  style,
}: ClassFiltersProps) {
  const { colors } = useTheme();

  return (
    <View style={style}>
      {title && (
        <Body
          style={{
            fontSize: TYPOGRAPHY.sizes.sm,
            fontWeight: TYPOGRAPHY.weights.semibold,
            marginBottom: SPACING.sm,
          }}
        >
          {title}
        </Body>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Row spacing="sm">
          {classes.map((cls) => (
            <Pressable
              key={cls.id}
              onPress={() => onClassChange(cls.id)}
              style={{
                paddingHorizontal: SPACING.md,
                paddingVertical: SPACING.sm,
                borderRadius: BORDER_RADIUS.md,
                backgroundColor: selectedClass === cls.id ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: selectedClass === cls.id ? colors.primary : colors.border,
                alignItems: 'center',
                minWidth: 100,
              }}
            >
              <Body
                style={{
                  color: selectedClass === cls.id ? '#FFFFFF' : colors.text,
                  fontSize: TYPOGRAPHY.sizes.sm,
                  fontWeight: TYPOGRAPHY.weights.semibold,
                  textAlign: 'center',
                }}
                numberOfLines={1}
              >
                {cls.label}
              </Body>
              <Caption
                style={{
                  color: selectedClass === cls.id ? 'rgba(255,255,255,0.8)' : colors.textSecondary,
                  fontSize: TYPOGRAPHY.sizes.xs,
                  textAlign: 'center',
                }}
                numberOfLines={2}
              >
                {cls.description}
              </Caption>
            </Pressable>
          ))}
        </Row>
      </ScrollView>
    </View>
  );
}

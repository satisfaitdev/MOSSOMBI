/**
 * FILTRES DE TYPE DE VOYAGE RÉUTILISABLES
 *
 * Composant pour sélectionner le type de voyage (aller simple/aller-retour)
 * Utilisé dans flight, bus, train et autres services de transport.
 *
 * @example
 * ```tsx
 * <TripTypeFilters
 *   tripType={tripType}
 *   onTripTypeChange={setTripType}
 *   labels={{
 *     oneWay: 'Aller simple',
 *     roundTrip: 'Aller-retour'
 *   }}
 * />
 * ```
 */

import React from 'react';
import { Pressable } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants/colors';
import { Body } from '@/components/atoms';
import { Row } from '@/components/ui';

interface TripTypeFiltersProps {
  tripType: 'one-way' | 'round-trip';
  onTripTypeChange: (type: 'one-way' | 'round-trip') => void;
  labels?: {
    oneWay: string;
    roundTrip: string;
  };
  style?: any;
}

export default function TripTypeFilters({
  tripType,
  onTripTypeChange,
  labels = {
    oneWay: 'Aller simple',
    roundTrip: 'Aller-retour'
  },
  style,
}: TripTypeFiltersProps) {
  const { colors } = useTheme();

  return (
    <Row spacing="sm" style={style}>
      {[
        { id: 'one-way' as const, label: labels.oneWay },
        { id: 'round-trip' as const, label: labels.roundTrip },
      ].map((type) => (
        <Pressable
          key={type.id}
          onPress={() => onTripTypeChange(type.id)}
          style={{
            flex: 1,
            paddingVertical: SPACING.sm,
            borderRadius: BORDER_RADIUS.md,
            backgroundColor: tripType === type.id ? colors.primary : colors.card,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: tripType === type.id ? colors.primary : colors.border,
          }}
        >
          <Body
            style={{
              color: tripType === type.id ? '#FFFFFF' : colors.text,
              fontWeight: TYPOGRAPHY.weights.medium,
            }}
          >
            {type.label}
          </Body>
        </Pressable>
      ))}
    </Row>
  );
}

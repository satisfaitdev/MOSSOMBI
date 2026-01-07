/**
 * SUGGESTIONS DE LOCALISATION RÉUTILISABLES
 *
 * Modal de suggestions pour la sélection de destinations, gares, aéroports, etc.
 * Utilisé dans flight, bus, train et autres services de transport.
 *
 * @example
 * ```tsx
 * <LocationSuggestions
 *   visible={showSuggestions}
 *   suggestions={filteredAirports}
 *   onSelect={(airport) => {
 *     setDestination(airport.code);
 *     setDestinationSearch(airport.city);
 *     setShowSuggestions(false);
 *   }}
 *   renderItem={(airport) => (
 *     <LocationItem
 *       title={airport.city}
 *       subtitle={`${airport.code} - ${airport.name}`}
 *       description={airport.country}
 *       icon={MapPin}
 *     />
 *   )}
 *   position={{ top: 247, left: SPACING.lg, right: SPACING.lg }}
 *   maxHeight={250}
 * />
 * ```
 */

import React from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS , SHADOWS } from '@/constants/colors';
import { Body, Caption } from '@/components/atoms';
import { LucideIcon } from 'lucide-react-native';

interface LocationItemProps {
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
}

interface LocationSuggestionsProps {
  visible: boolean;
  suggestions: any[];
  onSelect: (item: any) => void;
  renderItem: (item: any) => React.ReactNode;
  position: {
    top: number;
    left: number;
    right: number;
  };
  maxHeight?: number;
  onClose?: () => void;
}

export default function LocationSuggestions({
  visible,
  suggestions,
  onSelect,
  renderItem,
  position,
  maxHeight = 250,
  onClose,
}: LocationSuggestionsProps) {
  const { colors } = useTheme();

  if (!visible || suggestions.length === 0) return null;

  return (
    <Modal visible={false} transparent>
      <Pressable
        style={{
          position: 'absolute',
          top: position.top,
          left: position.left,
          right: position.right,
          backgroundColor: colors.card,
          borderRadius: BORDER_RADIUS.lg,
          maxHeight,
          zIndex: 1000,
          ...SHADOWS.xl,
        }}
        onPress={onClose}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingVertical: SPACING.xs,
          }}
        >
          {suggestions.slice(0, 5).map((item, index) => (
            <Pressable
              key={index}
              onPress={() => onSelect(item)}
              style={{
                padding: SPACING.md,
                borderBottomWidth: index < suggestions.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
              }}
            >
              {renderItem(item)}
            </Pressable>
          ))}
        </ScrollView>
      </Pressable>
    </Modal>
  );
}

// Composant pour afficher un item de localisation
export function LocationItem({ title, subtitle, description, icon: Icon }: LocationItemProps) {
  const { colors } = useTheme();

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    }}>
      <Icon size={18} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <Body
          style={{
            fontSize: TYPOGRAPHY.sizes.md,
            fontWeight: TYPOGRAPHY.weights.semibold,
          }}
        >
          {title}
        </Body>
        <Caption style={{ fontSize: TYPOGRAPHY.sizes.sm }}>
          {subtitle}
        </Caption>
        <Caption
          style={{
            fontSize: TYPOGRAPHY.sizes.xs,
            color: colors.textTertiary,
          }}
        >
          {description}
        </Caption>
      </View>
    </View>
  );
}

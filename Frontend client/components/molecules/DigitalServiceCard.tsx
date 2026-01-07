import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '@/constants/colors';
import Button from '@/components/Button';


interface DigitalServiceCardProps {
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  icon: React.ReactNode;
  duration?: string;
  onPress: () => void;
}

/**
 * Carte de service digital pour la grille (2 colonnes)
 */
export default function DigitalServiceCard({
  name,
  description,
  price,
  compareAtPrice,
  icon,
  duration,
  onPress,
}: DigitalServiceCardProps) {
  const { colors } = useTheme();

  const calculateDiscount = () => {
    if (!compareAtPrice) return 0;
    return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
  };

  const discount = calculateDiscount();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderRadius: BORDER_RADIUS.lg,
          padding: SPACING.md,
        },
        SHADOWS.sm,
      ]}
    >
      {/* Badge réduction */}
      {discount > 0 && (
        <View
          style={[
            styles.discountBadge,
            {
              backgroundColor: colors.error,
              borderRadius: BORDER_RADIUS.sm,
            },
          ]}
        >
          <Text
            style={[
              styles.discountText,
              {
                fontSize: TYPOGRAPHY.sizes.xs,
                fontWeight: TYPOGRAPHY.weights.bold,
              },
            ]}
          >
            -{discount}%
          </Text>
        </View>
      )}

      {/* Icône */}
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: colors.primary + '15',
            borderRadius: BORDER_RADIUS.md,
            marginBottom: SPACING.sm,
          },
        ]}
      >
        {icon}
      </View>

      {/* Nom */}
      <Text
        style={[
          styles.name,
          {
            color: colors.text,
            fontSize: TYPOGRAPHY.sizes.sm,
            fontWeight: TYPOGRAPHY.weights.semibold,
            textAlign: 'center',
            marginBottom: SPACING.xs,
          },
        ]}
        numberOfLines={1}
      >
        {name}
      </Text>

      {/* Description */}
      <Text
        style={[
          styles.description,
          {
            color: colors.textSecondary,
            fontSize: TYPOGRAPHY.sizes.xs,
            textAlign: 'center',
            marginBottom: SPACING.sm,
          },
        ]}
        numberOfLines={2}
      >
        {description}
      </Text>

      {/* Durée */}
      {duration && (
        <Text
          style={[
            styles.duration,
            {
              color: colors.accent,
              fontSize: TYPOGRAPHY.sizes.xs,
              textAlign: 'center',
              marginBottom: SPACING.sm,
            },
          ]}
        >
          {duration}
        </Text>
      )}

      {/* Prix */}
      <View
        style={[
          styles.pricing,
          {
            marginBottom: SPACING.sm,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: SPACING.xs,
            flexWrap: 'wrap',
          },
        ]}
      >
        <Text
          style={[
            styles.price,
            {
              color: colors.primary,
              fontSize: TYPOGRAPHY.sizes.md,
              fontWeight: TYPOGRAPHY.weights.bold,
            },
          ]}
        >
          {price.toLocaleString()} FCFA
        </Text>
        {compareAtPrice && (
          <Text
            style={[
              styles.oldPrice,
              {
                color: colors.textTertiary,
                fontSize: TYPOGRAPHY.sizes.xs,
                textDecorationLine: 'line-through',
              },
            ]}
          >
            {compareAtPrice.toLocaleString()} FCFA
          </Text>
        )}
      </View>

      {/* Bouton */}
      <Button
        title="S'abonner"
        onPress={onPress}
        variant="gradient"
        size="sm"
        fullWidth
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 200,
  },
  discountBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    zIndex: 1,
  },
  discountText: {
    color: '#FFFFFF',
  },
  iconContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {},
  description: {},
  duration: {},
  pricing: {
    alignItems: 'center',
  },
  price: {},
  oldPrice: {},
});

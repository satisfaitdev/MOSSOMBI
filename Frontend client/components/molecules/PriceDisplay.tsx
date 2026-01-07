import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Body, Caption, Badge } from '@/components/atoms';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, TYPOGRAPHY } from '@/constants/colors';

// ==========================================
// TYPES
// ==========================================

interface PriceDisplayProps {
  price: number;
  compareAtPrice?: number;
  currency?: string;
  showDiscount?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// ==========================================
// PRICE DISPLAY COMPONENT
// ==========================================

/**
 * PriceDisplay - Affichage de prix avec discount
 * 
 * @example
 * <PriceDisplay
 *   price={50000}
 *   compareAtPrice={75000}
 *   currency="FCFA"
 *   showDiscount
 * />
 */
export default function PriceDisplay({
  price,
  compareAtPrice,
  currency = 'FCFA',
  showDiscount = true,
  size = 'md',
}: PriceDisplayProps) {
  const { colors } = useTheme();

  const discount = compareAtPrice
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  const sizeStyles = {
    sm: TYPOGRAPHY.sizes.md,
    md: TYPOGRAPHY.sizes.lg,
    lg: TYPOGRAPHY.sizes.xxl,
  };

  return (
    <View style={styles.container}>
      <View style={styles.priceRow}>
        <Body
          style={{
            fontSize: sizeStyles[size],
            fontWeight: TYPOGRAPHY.weights.bold,
            color: colors.primary,
          }}
        >
          {price.toLocaleString()} {currency}
        </Body>

        {showDiscount && discount > 0 && (
          <Badge variant="error" size="sm">
            -{discount}%
          </Badge>
        )}
      </View>

      {compareAtPrice && compareAtPrice > price && (
        <Caption
          style={{
            textDecorationLine: 'line-through',
            color: colors.textTertiary,
          }}
        >
          {compareAtPrice.toLocaleString()} {currency}
        </Caption>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
});

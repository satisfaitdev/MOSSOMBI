import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { Body, Caption } from '@/components/atoms';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';

// ==========================================
// TYPES
// ==========================================

interface RatingDisplayProps {
  rating: number;
  maxRating?: number;
  reviewCount?: number;
  size?: number | 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

// ==========================================
// RATING DISPLAY COMPONENT
// ==========================================

/**
 * RatingDisplay - Affichage de notation avec étoiles
 * 
 * @example
 * <RatingDisplay
 *   rating={4.5}
 *   reviewCount={123}
 *   size={20}
 * />
 */
export default function RatingDisplay({
  rating,
  maxRating = 5,
  reviewCount,
  size = 16,
  showValue = true,
}: RatingDisplayProps) {
  const { colors } = useTheme();
  const pixelSize = typeof size === 'number' ? size : (size === 'sm' ? 12 : size === 'md' ? 16 : 20);

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>
        {[...Array(maxRating)].map((_, index) => {
          const isFilled = index < fullStars;
          const isHalf = index === fullStars && hasHalfStar;

          return (
            <Star
              key={index}
              size={pixelSize}
              color={isFilled || isHalf ? colors.warning : colors.border}
              fill={isFilled || isHalf ? colors.warning : 'transparent'}
            />
          );
        })}
      </View>

      {showValue && (
        <Body style={{ marginLeft: SPACING.xs }}>
          {rating.toFixed(1)}
        </Body>
      )}

      {reviewCount !== undefined && (
        <Caption style={{ marginLeft: SPACING.xs }}>
          ({reviewCount.toLocaleString()})
        </Caption>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
});

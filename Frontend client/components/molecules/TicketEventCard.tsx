import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ticket, Calendar, MapPin, Star } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/colors';

interface TicketEventCardProps {
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  date: string;
  location: string;
  rating?: number;
  onPress: () => void;
}

export default function TicketEventCard({
  name,
  description,
  price,
  compareAtPrice,
  date,
  location,
  rating,
  onPress,
}: TicketEventCardProps) {
  const { colors } = useTheme();

  const calculateDiscount = () => {
    if (!compareAtPrice) return 0;
    return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
  };

  const discount = calculateDiscount();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.card,
          opacity: pressed ? 0.8 : 1,
        },
        SHADOWS.sm,
      ]}
    >
      {/* Badge réduction */}
      {discount > 0 && (
        <View style={[styles.discountBadge, { backgroundColor: colors.error }]}>
          <Text style={styles.discountText}>
            -{discount}%
          </Text>
        </View>
      )}

      <View style={styles.content}>
        {/* Icône */}
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
          <Ticket size={32} color={colors.primary} />
        </View>

        {/* Informations */}
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]}>
            {name}
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
            {description}
          </Text>

          {/* Métadonnées */}
          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Calendar size={14} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {new Date(date).toLocaleDateString('fr-FR')}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <MapPin size={14} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
                {location}
              </Text>
            </View>
            {rating && (
              <View style={styles.metaItem}>
                <Star size={14} color={colors.accent} fill={colors.accent} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {rating}
                </Text>
              </View>
            )}
          </View>

          {/* Prix */}
          <View style={styles.pricing}>
            {compareAtPrice && (
              <Text style={[styles.oldPrice, { color: colors.textTertiary }]}>
                {compareAtPrice.toLocaleString()} FCFA
              </Text>
            )}
            <Text style={[styles.price, { color: colors.primary }]}>
              {price.toLocaleString()} FCFA
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    position: 'relative',
  },
  discountBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    zIndex: 1,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  content: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: SPACING.xs,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  metaText: {
    fontSize: TYPOGRAPHY.sizes.xs,
  },
  pricing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  oldPrice: {
    fontSize: TYPOGRAPHY.sizes.xs,
    textDecorationLine: 'line-through',
  },
  price: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ticket, Star, Calendar, MapPin } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/colors';

interface ExclusiveTicketCardProps {
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  date: string;
  location: string;
  onPress: () => void;
  width?: number;
}

export default function ExclusiveTicketCard({
  name,
  description,
  price,
  compareAtPrice,
  date,
  location,
  onPress,
  width,
}: ExclusiveTicketCardProps) {
  const { colors } = useTheme();

  const calculateDiscount = () => {
    if (!compareAtPrice) return 0;
    return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
  };

  return (
    <LinearGradient
      colors={[colors.gradient.start, colors.gradient.middle, colors.gradient.end]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, width ? { width } : undefined, SHADOWS.lg]}
    >
      {/* Sparkles decoration */}
      <View style={styles.sparklesContainer}>
        <Star size={20} color="#FFFFFF" style={{ opacity: 0.3, position: 'absolute', top: 10, left: 20 }} />
        <Star size={16} color="#FFFFFF" style={{ opacity: 0.2, position: 'absolute', top: 30, right: 30 }} />
        <Star size={12} color="#FFFFFF" style={{ opacity: 0.25, position: 'absolute', bottom: 40, left: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Icône + Nom + Badge EXCLUSIF */}
        <View style={styles.header}>
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: BORDER_RADIUS.md }]}>
            <Ticket size={28} color="#FFFFFF" />
          </View>
          <Text style={[styles.title, { flex: 1 }]} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.badge}>
            <Star size={10} color="#FFD700" fill="#FFD700" />
            <Text style={styles.badgeText}>EXCLUSIF</Text>
          </View>
        </View>

        {/* Prix */}
        <View style={[styles.pricing, { marginTop: SPACING.sm }]}>
          <Text style={styles.price}>
            {price.toLocaleString()} FCFA
          </Text>
          {compareAtPrice && (
            <>
              <Text style={styles.oldPrice}>
                {compareAtPrice.toLocaleString()} FCFA
              </Text>
              <View style={[styles.discountBadge, { backgroundColor: colors.error }]}>
                <Text style={styles.discountText}>
                  -{calculateDiscount()}%
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Description, Date et Lieu */}
        <View style={{ marginTop: SPACING.xs }}>
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.xs }}>
            <Calendar size={12} color="#FFFFFF" style={{ opacity: 0.8 }} />
            <Text style={styles.meta}>
              {new Date(date).toLocaleDateString('fr-FR')}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: 2 }}>
            <MapPin size={12} color="#FFFFFF" style={{ opacity: 0.8 }} />
            <Text style={styles.meta} numberOfLines={1}>
              {location}
            </Text>
          </View>
        </View>

        {/* Bouton Réserver */}
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: '#FFFFFF',
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <Ticket size={18} color={colors.primary} />
          <Text style={[styles.buttonText, { color: colors.primary }]}>
            Réserver
          </Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.md,
    minHeight: 180,
    position: 'relative',
    overflow: 'hidden',
  },
  sparklesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconWrapper: {
    padding: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    flexShrink: 0,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  pricing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  price: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  oldPrice: {
    color: '#FFFFFF',
    opacity: 0.7,
    textDecorationLine: 'line-through',
    fontSize: TYPOGRAPHY.sizes.md,
  },
  discountBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  description: {
    color: '#FFFFFF',
    opacity: 0.85,
    fontSize: TYPOGRAPHY.sizes.xs,
  },
  meta: {
    color: '#FFFFFF',
    opacity: 0.85,
    fontSize: TYPOGRAPHY.sizes.xs,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});

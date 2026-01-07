import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, ShoppingCart, Film } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '@/constants/colors';
import { Body, Caption } from '@/components/atoms';

interface ExclusiveDigitalServiceCardProps {
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  icon?: React.ReactNode;
  duration?: string;
  width?: number;
  onPress: () => void;
}

/**
 * Carte exclusive pour services digitaux (carrousel)
 */
export default function ExclusiveDigitalServiceCard({
  name,
  description,
  price,
  compareAtPrice,
  icon,
  duration,
  width,
  onPress,
}: ExclusiveDigitalServiceCardProps) {
  const { colors } = useTheme();

  const calculateDiscount = () => {
    if (!compareAtPrice) return 0;
    return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
  };

  const discount = calculateDiscount();

  return (
    <LinearGradient
      colors={[colors.gradient.start, colors.gradient.middle, colors.gradient.end]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        {
          width,
          borderRadius: BORDER_RADIUS.xxl,
          padding: SPACING.md,
          minHeight: 180,
          position: 'relative',
          overflow: 'hidden',
        },
        SHADOWS.lg,
      ]}
    >
      {/* Sparkles decoration */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Star
          size={20}
          color="#FFFFFF"
          style={{ opacity: 0.3, position: 'absolute', top: 10, left: 20 }}
        />
        <Star
          size={16}
          color="#FFFFFF"
          style={{ opacity: 0.2, position: 'absolute', top: 30, right: 30 }}
        />
        <Star
          size={12}
          color="#FFFFFF"
          style={{ opacity: 0.25, position: 'absolute', bottom: 40, left: 40 }}
        />
      </View>

      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        {/* Icône + Nom + Badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <View
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: BORDER_RADIUS.md,
              padding: SPACING.sm,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon || <Film size={28} color="#FFFFFF" />}
          </View>
          <Body style={{ color: '#FFFFFF', fontSize: TYPOGRAPHY.sizes.lg, fontWeight: TYPOGRAPHY.weights.bold }} numberOfLines={1}>
            {name}
          </Body>
          <View
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              borderRadius: BORDER_RADIUS.full,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.3)',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 3,
              paddingHorizontal: SPACING.sm,
              paddingVertical: 2,
              marginLeft: 'auto',
            }}
          >
            <Star size={10} color="#FFD700" fill="#FFD700" />
            <Caption style={{ color: '#FFFFFF', fontSize: 10, fontWeight: TYPOGRAPHY.weights.bold }}>
              EXCLUSIF
            </Caption>
          </View>
        </View>

        {/* Prix */}
        <View style={{ marginTop: SPACING.sm, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <Body style={{ color: '#FFFFFF', fontSize: TYPOGRAPHY.sizes.xl, fontWeight: TYPOGRAPHY.weights.bold }}>
            {price.toLocaleString()} FCFA
          </Body>
          {compareAtPrice && (
            <>
              <Body style={{ color: 'rgba(255,255,255,0.7)', fontSize: TYPOGRAPHY.sizes.md, textDecorationLine: 'line-through' }}>
                {compareAtPrice.toLocaleString()} FCFA
              </Body>
              <View style={{ backgroundColor: colors.error, borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.xs, paddingVertical: 2 }}>
                <Caption style={{ color: '#FFFFFF', fontSize: TYPOGRAPHY.sizes.xs, fontWeight: TYPOGRAPHY.weights.bold }}>
                  -{discount}%
                </Caption>
              </View>
            </>
          )}
        </View>

        {/* Description et durée */}
        <View style={{ marginTop: SPACING.xs }}>
          <Text
            style={{
              color: '#FFFFFF',
              opacity: 0.85,
              fontSize: TYPOGRAPHY.sizes.xs,
            }}
            numberOfLines={2}
          >
            {description}
          </Text>
          {duration && (
            <Text
              style={{
                color: '#FFFFFF',
                opacity: 0.85,
                fontSize: TYPOGRAPHY.sizes.xs,
                marginTop: SPACING.xs,
              }}
            >
              Durée: {duration}
            </Text>
          )}
        </View>

        {/* Bouton */}
        <Pressable
          onPress={onPress}
          style={({ pressed }) => ({
            backgroundColor: '#FFFFFF',
            borderRadius: BORDER_RADIUS.full,
            paddingVertical: SPACING.sm,
            paddingHorizontal: SPACING.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: SPACING.xs,
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <ShoppingCart size={18} color={colors.primary} />
          <Body style={{ color: colors.primary, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.bold }}>
            S'abonner
          </Body>
        </Pressable>
      </View>
    </LinearGradient>
  );
}


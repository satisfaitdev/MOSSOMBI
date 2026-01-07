import React from 'react';
import { View, Image } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '@/constants/colors';
import { Body, Caption } from '@/components/atoms';
import Button from '@/components/Button';

interface CoinServiceCardProps {
  coins: number;
  price: number;
  compareAtPrice?: number;
  onPress: () => void;
}

export default function CoinServiceCard({
  coins,
  price,
  compareAtPrice,
  onPress,
}: CoinServiceCardProps) {
  const { colors } = useTheme();

  const calculateDiscount = (price: number, comparePrice?: number) => {
    if (!comparePrice) return 0;
    return Math.round(((comparePrice - price) / comparePrice) * 100);
  };

  const discount = calculateDiscount(price, compareAtPrice);

  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: BORDER_RADIUS.lg,
          padding: SPACING.sm,
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 140,
          position: 'relative',
          borderWidth: 1,
          borderColor: colors.border,
        },
        SHADOWS.sm,
      ]}
    >
      {/* Badge de réduction */}
      {discount > 0 && (
        <View
          style={{
            position: 'absolute',
            top: SPACING.sm,
            right: SPACING.sm,
            backgroundColor: colors.error,
            borderRadius: BORDER_RADIUS.sm,
            paddingHorizontal: SPACING.xs,
            paddingVertical: 2,
            zIndex: 1,
          }}
        >
          <Caption style={{ color: '#FFFFFF', fontSize: TYPOGRAPHY.sizes.xs, fontWeight: TYPOGRAPHY.weights.bold }}>
            -{discount}%
          </Caption>
        </View>
      )}

      {/* Icône */}
      <View
        style={{
          width: 40,
          height: 40,
          backgroundColor: colors.primary + '15',
          borderRadius: BORDER_RADIUS.md,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: SPACING.sm,
        }}
      >
        <Image
          source={require('@/assets/images/coins (2).png')}
          style={{ width: 24, height: 24 }}
          resizeMode="contain"
        />
      </View>

      {/* Coins et prix */}
      <View style={{ alignItems: 'center', marginBottom: SPACING.sm }}>
        <Caption style={{ color: colors.textSecondary, fontSize: TYPOGRAPHY.sizes.xs, marginBottom: SPACING.xs }}>
          {coins.toLocaleString()} coins
        </Caption>
        <Body style={{ color: colors.primary, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.bold }}>
          {(price * 655).toLocaleString()} FCFA
        </Body>
        {compareAtPrice && (
          <Caption style={{ textDecorationLine: 'line-through', color: colors.textTertiary, fontSize: TYPOGRAPHY.sizes.xs }}>
            {(compareAtPrice * 655).toLocaleString()} FCFA
          </Caption>
        )}
      </View>

      {/* Bouton */}
      <Button title="Acheter" onPress={onPress} variant="gradient" size="sm" fullWidth />
    </View>
  );
}

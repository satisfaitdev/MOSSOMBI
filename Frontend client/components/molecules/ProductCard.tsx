import React from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { Star, ShoppingCart, Package, Plus } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '@/constants/colors';
import { Product } from '@/hooks/useShoppingCart';
import Button from '@/components/Button';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onAddToCart: () => void;
  viewMode?: 'grid' | 'list';
}

/**
 * Carte produit réutilisable pour toutes les pages supermarket
 * Supporte les modes Grid et List
 */
export default function ProductCard({ product, onPress, onAddToCart, viewMode = 'grid' }: ProductCardProps) {
  const { colors } = useTheme();

  const availabilityColors = {
    'in-stock': colors.success,
    'france': '#0055A4',
    'china': '#DE2910',
    'dubai': '#00732F',
  };

  const availabilityLabels = {
    'in-stock': 'En stock',
    'france': 'France',
    'china': 'Chine',
    'dubai': 'Dubai',
  };

  if (viewMode === 'list') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.listCard,
          {
            backgroundColor: colors.card,
            borderRadius: BORDER_RADIUS.lg,
            opacity: pressed ? 0.8 : 1,
            ...SHADOWS.md,
          },
        ]}
      >
        <View style={styles.listContent}>
          {/* Image du produit en mode liste avec badges */}
          <View style={[styles.listImage, { backgroundColor: colors.surface }]}>
            {product.image ? (
              <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
            ) : (
              <Package size={32} color={colors.textSecondary} />
            )}
            
            {/* Note en haut à gauche */}
            <View style={[styles.ratingBadgeList, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
              <Star size={10} color="#FFB800" fill="#FFB800" />
              <Text style={[styles.rating, { color: '#FFFFFF', fontSize: TYPOGRAPHY.sizes.xs, marginLeft: 2 }]}>{product.rating}</Text>
            </View>
            
            {/* Tag stock en bas à gauche */}
            {product.availability && (
              <View style={[styles.availabilityBadge, styles.availabilityBadgeList, { backgroundColor: availabilityColors[product.availability] }]}>
                <Text style={[styles.availabilityText, { fontSize: TYPOGRAPHY.sizes.xs }]}>
                  {availabilityLabels[product.availability]}
                </Text>
              </View>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.productName, { color: colors.text, fontSize: TYPOGRAPHY.sizes.md, fontWeight: TYPOGRAPHY.weights.semibold }]} numberOfLines={2}>
              {product.name}
            </Text>

            {/* Prix barré juste sous le nom */}
            {product.compareAtPrice && (
              <Text style={[styles.comparePrice, { color: colors.textSecondary, fontSize: TYPOGRAPHY.sizes.sm, marginBottom: SPACING.xs }]}>
                {product.compareAtPrice.toLocaleString()} FCFA
              </Text>
            )}

            {/* Prix actuel */}
            <Text style={[styles.price, { color: colors.primary, fontSize: TYPOGRAPHY.sizes.lg, fontWeight: TYPOGRAPHY.weights.bold }]}>
              {product.price.toLocaleString()} FCFA
            </Text>
          </View>

          <Pressable
            onPress={onAddToCart}
            style={({ pressed }) => [
              styles.addButtonList,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Plus size={20} color="#FFFFFF" strokeWidth={3} />
          </Pressable>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.gridCard,
        {
          backgroundColor: colors.card,
          borderRadius: BORDER_RADIUS.lg,
          opacity: pressed ? 0.8 : 1,
          ...SHADOWS.md,
        },
      ]}
    >
      {product.compareAtPrice && (
        <View style={[styles.discountBadge, { backgroundColor: colors.error }]}>
          <Text style={[styles.discountText, { fontSize: TYPOGRAPHY.sizes.xs }]}>
            -{Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%
          </Text>
        </View>
      )}

      {product.availability && (
        <View style={[styles.availabilityBadge, styles.availabilityBadgeGrid, { backgroundColor: availabilityColors[product.availability] }]}>
          <Text style={[styles.availabilityText, { fontSize: TYPOGRAPHY.sizes.xs }]}>
            {availabilityLabels[product.availability]}
          </Text>
        </View>
      )}

      {/* Image du produit */}
      <View style={[styles.productImage, { backgroundColor: colors.surface }]}>
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
        ) : (
          <Package size={40} color={colors.textSecondary} />
        )}
      </View>

      <View style={styles.gridContent}>
        <Text style={[styles.productName, { color: colors.text, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.semibold }]} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.ratingContainer}>
          <Star size={12} color="#FFB800" fill="#FFB800" />
          <Text style={[styles.rating, { color: colors.text, fontSize: TYPOGRAPHY.sizes.xs }]}>{product.rating}</Text>
        </View>

        <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: colors.primary, fontSize: TYPOGRAPHY.sizes.md, fontWeight: TYPOGRAPHY.weights.bold }]}>
            {product.price.toLocaleString()}
          </Text>
          {product.compareAtPrice && (
            <Text style={[styles.comparePrice, { color: colors.textSecondary, fontSize: TYPOGRAPHY.sizes.xs }]}>
              {product.compareAtPrice.toLocaleString()}
            </Text>
          )}
        </View>

        <Button
          title="Ajouter"
          icon={<ShoppingCart size={14} color="#FFFFFF" />}
          onPress={onAddToCart}
          variant="primary"
          size="sm"
          fullWidth
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gridCard: {
    width: '47.5%',
    marginBottom: SPACING.md,
  },
  listCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  productImage: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  listImage: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    position: 'relative',
  },
  ratingBadgeList: {
    position: 'absolute',
    top: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    zIndex: 2,
  },
  availabilityBadgeList: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    zIndex: 2,
  },
  gridContent: {
    padding: SPACING.md,
  },
  listContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  productName: {
    marginBottom: SPACING.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.xs,
  },
  rating: {},
  priceContainer: {
    marginBottom: SPACING.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  price: {},
  comparePrice: {
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    position: 'absolute',
    top: SPACING.xs,
    left: SPACING.xs,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    zIndex: 1,
  },
  discountText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  availabilityBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  availabilityBadgeGrid: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    zIndex: 1,
  },
  availabilityText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  addButtonList: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
});

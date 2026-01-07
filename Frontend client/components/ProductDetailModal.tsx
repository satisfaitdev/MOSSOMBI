import { Star, ShoppingCart, Package, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/components/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/constants/colors';
import { Product, getDiscount } from '@/types/product';
import { HeaderLayout } from '@/components/layouts';

interface ProductDetailModalProps {
  visible: boolean;
  onClose: () => void;
  product: Product | null;
  onAddToCart: (productId: string) => void;
  productIcon: React.ReactNode;
  quantity?: number;
}

export default function ProductDetailModal({
  visible,
  onClose,
  product,
  onAddToCart,
  productIcon,
  quantity = 0,
}: ProductDetailModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  if (!product) return null;

  const discount = getDiscount(product);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header unifié (Migration Phase 3) */}
        <HeaderLayout
          title="Détails du produit"
          showCloseButton
          onClose={onClose}
          variant="modal"
          backgroundColor={colors.card}
        />

        <ScrollView style={{ flex: 1 }}>
          {/* Product Image */}
          <View style={[styles.imageContainer, { backgroundColor: colors.surface }]}>
            {productIcon}
            {discount > 0 && (
              <View style={[styles.discountBadge, { backgroundColor: colors.error }]}>
                <Text style={[styles.discountText, { fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.bold }]}>
                  -{discount}%
                </Text>
              </View>
            )}
          </View>

          {/* Product Info */}
          <View style={styles.infoContainer}>
            <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.categoryText, { color: colors.primary, fontSize: TYPOGRAPHY.sizes.xs, fontWeight: TYPOGRAPHY.weights.medium }]}>
                {product.category}
              </Text>
            </View>

            <Text style={[styles.productName, { color: colors.text, fontSize: TYPOGRAPHY.sizes.xxl, fontWeight: TYPOGRAPHY.weights.bold }]}>
              {product.name}
            </Text>

            {/* Rating */}
            <View style={styles.ratingContainer}>
              <Star size={20} color={colors.warning} fill={colors.warning} />
              <Text style={[styles.ratingText, { color: colors.text, fontSize: TYPOGRAPHY.sizes.md, fontWeight: TYPOGRAPHY.weights.semibold }]}>
                {product.rating}
              </Text>
              <Text style={[styles.ratingCount, { color: colors.textSecondary, fontSize: TYPOGRAPHY.sizes.sm }]}>
                (4.2k avis)
              </Text>
            </View>

            {/* Price */}
            <View style={styles.priceContainer}>
              <Text style={[styles.price, { color: colors.primary, fontSize: TYPOGRAPHY.sizes.xxxl, fontWeight: TYPOGRAPHY.weights.bold }]}>
                {product.price.toLocaleString()} FCFA
              </Text>
              {product.compareAtPrice && (
                <Text style={[styles.oldPrice, { color: colors.textTertiary, fontSize: TYPOGRAPHY.sizes.lg, textDecorationLine: 'line-through' }]}>
                  {product.compareAtPrice.toLocaleString()} FCFA
                </Text>
              )}
            </View>

            {/* Stock Status */}
            <View style={[styles.stockBadge, { backgroundColor: product.inStock ? colors.success + '20' : colors.error + '20' }]}>
              <Package size={16} color={product.inStock ? colors.success : colors.error} />
              <Text style={[styles.stockText, { color: product.inStock ? colors.success : colors.error, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.medium }]}>
                {product.inStock ? 'En stock' : 'Rupture de stock'}
              </Text>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: TYPOGRAPHY.sizes.lg, fontWeight: TYPOGRAPHY.weights.bold }]}>
                Description
              </Text>
              <Text style={[styles.description, { color: colors.textSecondary, fontSize: TYPOGRAPHY.sizes.md, lineHeight: 22 }]}>
                {product.description || `${product.name} est un produit de haute qualité offrant d'excellentes performances et une grande durabilité. Idéal pour un usage quotidien avec des fonctionnalités avancées.`}
              </Text>
            </View>

            {/* Features */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: TYPOGRAPHY.sizes.lg, fontWeight: TYPOGRAPHY.weights.bold }]}>
                Caractéristiques
              </Text>
              <View style={styles.featuresList}>
                {['Garantie 1 an', 'Livraison gratuite', 'Retour sous 14 jours', 'Service client 24/7'].map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={[styles.featureDot, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.featureText, { color: colors.textSecondary, fontSize: TYPOGRAPHY.sizes.md }]}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Popular Badge */}
            {product.rating >= 4.7 && (
              <View style={[styles.popularBadge, { backgroundColor: colors.accent + '20', borderRadius: BORDER_RADIUS.md }]}>
                <TrendingUp size={20} color={colors.accent} />
                <Text style={[styles.popularText, { color: colors.accent, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.semibold }]}>
                  🔥 Produit populaire - Très demandé
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + SPACING.md }]}>
          {quantity > 0 && (
            <View style={[styles.quantityBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.quantityText, { color: '#FFFFFF', fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.bold }]}>
                {quantity} dans le panier
              </Text>
            </View>
          )}
          <Button
            title={quantity > 0 ? "Ajouter encore" : "Ajouter au panier"}
            onPress={() => {
              onAddToCart(product.id);
              onClose();
            }}
            variant="gradient"
            size="lg"
            icon={<ShoppingCart size={20} color="#FFFFFF" />}
            fullWidth
            disabled={!product.inStock}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: SPACING.md, borderBottomWidth: 1 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg },
  headerTitle: {},
  closeButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  imageContainer: { height: 300, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  discountBadge: { position: 'absolute', top: SPACING.lg, right: SPACING.lg, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md },
  discountText: { color: '#FFFFFF' },
  infoContainer: { padding: SPACING.lg },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.sm, marginBottom: SPACING.md },
  categoryText: {},
  productName: { marginBottom: SPACING.sm },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.md },
  ratingText: {},
  ratingCount: {},
  priceContainer: { flexDirection: 'row', alignItems: 'baseline', gap: SPACING.sm, marginBottom: SPACING.md },
  price: {},
  oldPrice: {},
  stockBadge: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, alignSelf: 'flex-start', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.sm, marginBottom: SPACING.lg },
  stockText: {},
  section: { marginBottom: SPACING.lg },
  sectionTitle: { marginBottom: SPACING.sm },
  description: {},
  featuresList: { gap: SPACING.sm },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  featureDot: { width: 6, height: 6, borderRadius: 3 },
  featureText: {},
  popularBadge: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.md, marginTop: SPACING.md },
  popularText: {},
  footer: { padding: SPACING.lg, borderTopWidth: 1 },
  quantityBadge: { alignSelf: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.sm, marginBottom: SPACING.sm },
  quantityText: {},
});

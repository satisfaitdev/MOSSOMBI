import React from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Animated, Modal } from 'react-native';
import { Search, SlidersHorizontal, Grid3X3, List, ShoppingCart, X, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import MaskedView from '@react-native-masked-view/masked-view';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '@/constants/colors';
import { FilterChips, ProductCard } from '@/components/molecules';
import Button from '@/components/Button';
import CartModal from '@/components/CartModal';
import ProductDetailModal from '@/components/ProductDetailModal';
import CheckoutModal from '@/components/CheckoutModal';
import { FloatingCartButton } from '@/components/organisms';
import { Product } from '@/hooks/useShoppingCart';

interface ShoppingPageLayoutProps {
  title: string;
  products: Product[];
  categories: string[];
  
  // Search & Filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  priceRange: 'all' | 'low' | 'mid' | 'high';
  setPriceRange: (range: 'all' | 'low' | 'mid' | 'high') => void;
  availabilityFilter: 'all' | 'in-stock' | 'france' | 'china' | 'dubai';
  setAvailabilityFilter: (filter: 'all' | 'in-stock' | 'france' | 'china' | 'dubai') => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  filteredProducts: Product[];
  
  // Cart
  cart: { [key: string]: number };
  cartModalVisible: boolean;
  setCartModalVisible: (visible: boolean) => void;
  productDetailModal: Product | null;
  setProductDetailModal: (product: Product | null) => void;
  checkoutModalVisible: boolean;
  setCheckoutModalVisible: (visible: boolean) => void;
  successModalVisible: boolean;
  successAnim: Animated.Value;
  checkAnim: Animated.Value;
  addToCartAnim: Animated.Value;
  addToCart: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemsCount: () => number;
  handleCheckout: () => void;
  handleConfirmCheckout: (paymentMethod: 'full' | 'installment', deliveryOption: string) => void;
}

/**
 * Template partagé pour toutes les pages supermarket
 * Gère l'affichage complet: header, recherche, filtres, produits, modals
 */
export default function ShoppingPageLayout({
  title,
  products,
  categories,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  sortBy,
  setSortBy,
  showFilters,
  setShowFilters,
  priceRange,
  setPriceRange,
  availabilityFilter,
  setAvailabilityFilter,
  viewMode,
  setViewMode,
  filteredProducts,
  cart,
  cartModalVisible,
  setCartModalVisible,
  productDetailModal,
  setProductDetailModal,
  checkoutModalVisible,
  setCheckoutModalVisible,
  successModalVisible,
  successAnim,
  checkAnim,
  addToCartAnim,
  addToCart,
  removeFromCart,
  clearCart,
  getCartTotal,
  getCartItemsCount,
  handleCheckout,
  handleConfirmCheckout,
}: ShoppingPageLayoutProps) {
  const { colors, colorScheme } = useTheme();
  const cartCount = getCartItemsCount();

  return (
    <>
      <HeaderWithBackButton
        title={title}
        rightButton={
          <Pressable
            onPress={() => setCartModalVisible(true)}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, marginRight: SPACING.sm }]}
          >
            <Animated.View style={{ transform: [{ scale: addToCartAnim }] }}>
              <ShoppingCart size={24} color={colors.text} />
              {cartCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.badgeText, { fontSize: TYPOGRAPHY.sizes.xs }]}>{cartCount}</Text>
                </View>
              )}
            </Animated.View>
          </Pressable>
        }
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={{
            padding: SPACING.lg,
            paddingBottom: cartCount > 0 ? 100 : SPACING.lg,
          }}
        >
          {/* Barre de recherche */}
          <View
            style={[
              styles.searchContainer,
              {
                backgroundColor: colors.surface,
                borderRadius: BORDER_RADIUS.md,
                marginBottom: SPACING.lg,
              },
            ]}
          >
            <Search size={20} color={colors.textSecondary} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={`Rechercher dans ${title}...`}
              placeholderTextColor={colors.textTertiary}
              style={[styles.searchInput, { color: colors.text, fontSize: TYPOGRAPHY.sizes.md }]}
            />
          </View>

          {/* Filtres catégories */}
          <View style={styles.filtersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
              <FilterChips
                options={categories}
                selected={selectedCategory}
                onSelect={setSelectedCategory}
              />
            </ScrollView>

            {/* Tri, Filtres, Vue */}
            <View style={styles.sortFilterRow}>
              <Pressable
                onPress={() => setShowFilters(!showFilters)}
                style={[styles.filterButton, { backgroundColor: colors.surface, borderRadius: BORDER_RADIUS.md }]}
              >
                <SlidersHorizontal size={16} color={colors.text} />
                <Text style={[styles.filterButtonText, { color: colors.text, fontSize: TYPOGRAPHY.sizes.sm }]}>
                  Filtres
                </Text>
              </Pressable>

              <View style={styles.viewToggle}>
                <Pressable
                  onPress={() => setViewMode('grid')}
                  style={[
                    styles.viewButton,
                    {
                      backgroundColor: viewMode === 'grid' ? colors.primary : colors.surface,
                      borderRadius: BORDER_RADIUS.sm,
                    },
                  ]}
                >
                  <Grid3X3 size={16} color={viewMode === 'grid' ? '#FFFFFF' : colors.text} />
                </Pressable>
                <Pressable
                  onPress={() => setViewMode('list')}
                  style={[
                    styles.viewButton,
                    {
                      backgroundColor: viewMode === 'list' ? colors.primary : colors.surface,
                      borderRadius: BORDER_RADIUS.sm,
                    },
                  ]}
                >
                  <List size={16} color={viewMode === 'list' ? '#FFFFFF' : colors.text} />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Panel de filtres */}
          {showFilters && (
            <View
              style={[
                styles.filtersPanel,
                {
                  backgroundColor: colors.surface,
                  borderRadius: BORDER_RADIUS.md,
                  marginBottom: SPACING.lg,
                  ...SHADOWS.sm,
                },
              ]}
            >
              {/* Prix */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterTitle, { color: colors.text, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.semibold }]}>
                  Prix
                </Text>
                <View style={styles.filterOptions}>
                  {[
                    { value: 'all', label: 'Tous' },
                    { value: 'low', label: 'Bas' },
                    { value: 'mid', label: 'Moyen' },
                    { value: 'high', label: 'Élevé' },
                  ].map((option) => (
                    <Pressable
                      key={option.value}
                      onPress={() => setPriceRange(option.value as any)}
                      style={[
                        styles.filterOption,
                        {
                          backgroundColor: priceRange === option.value ? colors.primary : colors.card,
                          borderRadius: BORDER_RADIUS.sm,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          {
                            color: priceRange === option.value ? '#FFFFFF' : colors.text,
                            fontSize: TYPOGRAPHY.sizes.xs,
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Disponibilité */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterTitle, { color: colors.text, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.semibold }]}>
                  Disponibilité
                </Text>
                <View style={styles.filterOptions}>
                  {[
                    { value: 'all', label: 'Tous' },
                    { value: 'in-stock', label: 'En stock' },
                    { value: 'france', label: 'France' },
                    { value: 'china', label: 'Chine' },
                    { value: 'dubai', label: 'Dubai' },
                  ].map((option) => (
                    <Pressable
                      key={option.value}
                      onPress={() => setAvailabilityFilter(option.value as any)}
                      style={[
                        styles.filterOption,
                        {
                          backgroundColor: availabilityFilter === option.value ? colors.primary : colors.card,
                          borderRadius: BORDER_RADIUS.sm,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          {
                            color: availabilityFilter === option.value ? '#FFFFFF' : colors.text,
                            fontSize: TYPOGRAPHY.sizes.xs,
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Tri */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterTitle, { color: colors.text, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.semibold }]}>
                  Trier par
                </Text>
                <View style={styles.filterOptions}>
                  {[
                    { value: 'popular', label: 'Populaire' },
                    { value: 'price-asc', label: 'Prix ↑' },
                    { value: 'price-desc', label: 'Prix ↓' },
                    { value: 'rating', label: 'Note' },
                    { value: 'name', label: 'Nom' },
                  ].map((option) => (
                    <Pressable
                      key={option.value}
                      onPress={() => setSortBy(option.value)}
                      style={[
                        styles.filterOption,
                        {
                          backgroundColor: sortBy === option.value ? colors.primary : colors.card,
                          borderRadius: BORDER_RADIUS.sm,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          {
                            color: sortBy === option.value ? '#FFFFFF' : colors.text,
                            fontSize: TYPOGRAPHY.sizes.xs,
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Liste de produits */}
          <View style={viewMode === 'grid' ? styles.productsGrid : styles.productsList}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={() => setProductDetailModal(product)}
                onAddToCart={() => addToCart(product.id)}
                viewMode={viewMode}
              />
            ))}
          </View>

          {filteredProducts.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textSecondary, fontSize: TYPOGRAPHY.sizes.md }]}>
                Aucun produit trouvé
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Bouton panier flottant - Composant réutilisable */}
        <FloatingCartButton
          itemCount={cartCount}
          onPress={() => setCartModalVisible(true)}
          title="Voir le panier"
          height={75}
          bottomMargin={20}
          disabled={false}
        />
      </View>

      {/* Modals */}
      <CartModal
        visible={cartModalVisible}
        onClose={() => setCartModalVisible(false)}
        cart={cart}
        products={products}
        onAddToCart={(productId: string) => addToCart(productId)}
        onRemoveFromCart={(productId: string) => removeFromCart(productId)}
        onClearCart={clearCart}
        onCheckout={handleCheckout}
        productIcon={<ShoppingCart size={24} color="#FFFFFF" />}
      />

      {productDetailModal && (
        <ProductDetailModal
          visible={!!productDetailModal}
          onClose={() => setProductDetailModal(null)}
          product={productDetailModal}
          onAddToCart={() => {
            addToCart(productDetailModal.id);
            setProductDetailModal(null);
          }}
          productIcon={<ShoppingCart size={20} color="#FFFFFF" />}
        />
      )}

      <CheckoutModal
        visible={checkoutModalVisible}
        onClose={() => setCheckoutModalVisible(false)}
        cart={cart}
        products={products}
        onConfirm={handleConfirmCheckout}
      />

      {/* Modal de succès */}
      <Modal visible={successModalVisible} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <Animated.View
            style={[
              styles.successModal,
              {
                backgroundColor: colors.card,
                borderRadius: BORDER_RADIUS.xl,
                transform: [{ scale: successAnim }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.checkCircle,
                {
                  backgroundColor: colors.success,
                  opacity: checkAnim,
                  transform: [{ scale: checkAnim }],
                },
              ]}
            >
              <Check size={48} color="#FFFFFF" strokeWidth={3} />
            </Animated.View>
            <Text style={[styles.successTitle, { color: colors.text, fontSize: TYPOGRAPHY.sizes.xl, fontWeight: TYPOGRAPHY.weights.bold }]}>
              Commande confirmée !
            </Text>
            <Text style={[styles.successMessage, { color: colors.textSecondary, fontSize: TYPOGRAPHY.sizes.md }]}>
              Votre commande a été passée avec succès
            </Text>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  searchInput: { flex: 1 },
  filtersContainer: {},
  sortFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  filterButtonText: {},
  viewToggle: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  viewButton: {
    padding: SPACING.sm,
  },
  filtersPanel: {
    padding: SPACING.md,
  },
  filterSection: {
    marginBottom: SPACING.md,
  },
  filterTitle: {
    marginBottom: SPACING.xs,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  filterOption: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  filterOptionText: {},
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  productsList: {},
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyText: {},
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  successModal: {
    padding: SPACING.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  successTitle: {
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  successMessage: {
    textAlign: 'center',
  },
});

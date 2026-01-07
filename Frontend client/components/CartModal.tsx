import { LinearGradient } from 'expo-linear-gradient';
import { ShoppingCart, X, Trash2 } from 'lucide-react-native';
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Button from '@/components/Button';
import { StyledCloseButton, AnimatedQuantityButton } from '@/components/atoms';
import ModalHeader from '@/components/organisms/ModalHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/constants/colors';
import { COMMON_STYLES, MODAL_STYLES } from '@/constants/styles';
import {
  ANIMATION_COLORS,
  ANIMATION_DURATIONS,
  ANIMATION_VALUES,
} from '@/constants/animations';
import { CartProduct } from '@/types/product';

interface CartModalProps {
  visible: boolean;
  onClose: () => void;
  cart: { [key: string]: number };
  products: CartProduct[];
  onAddToCart: (productId: string) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  productIcon: React.ReactNode;
}

export default function CartModal({
  visible,
  onClose,
  cart,
  products,
  onAddToCart,
  onRemoveFromCart,
  onClearCart,
  onCheckout,
  productIcon,
}: CartModalProps) {
  const { colors, colorScheme } = useTheme();

  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const cartTotal = Object.keys(cart).reduce((total, productId) => {
    const product = products.find(p => p.id === productId);
    return total + (product?.price || 0) * cart[productId];
  }, 0);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <ModalHeader
          title="Mon Panier"
          onClose={onClose}
          animateOnMount={true}
          closeButtonKey={`close-${visible}`}
          titleSize="lg"
          paddingBottom="sm"
        />

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: SPACING.lg }}>
          {Object.keys(cart).length === 0 ? (
            <View style={styles.emptyCart}>
              <ShoppingCart size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyCartText, { color: colors.textSecondary, fontSize: TYPOGRAPHY.sizes.md, marginTop: SPACING.md }]}>
                Votre panier est vide
              </Text>
            </View>
          ) : (
            <>
              {Object.keys(cart).map((productId) => {
                const product = products.find(p => p.id === productId);
                if (!product) return null;
                
                return (
                  <View key={productId} style={[styles.cartItem, { backgroundColor: colors.card, borderRadius: BORDER_RADIUS.lg, marginBottom: SPACING.md }]}>
                    <View style={[styles.cartItemImage, { backgroundColor: colors.surface, borderRadius: BORDER_RADIUS.md }]}>
                      {productIcon}
                    </View>
                    <View style={styles.cartItemInfo}>
                      <Text style={[styles.cartItemName, { color: colors.text, fontSize: TYPOGRAPHY.sizes.md, fontWeight: TYPOGRAPHY.weights.semibold }]} numberOfLines={2}>
                        {product.name}
                      </Text>
                      <Text style={[styles.cartItemPrice, { color: colors.primary, fontSize: TYPOGRAPHY.sizes.md, fontWeight: TYPOGRAPHY.weights.bold, marginTop: 4 }]}>
                        {product.price.toLocaleString()} FCFA
                      </Text>
                    </View>
                    <View style={styles.cartItemActions}>
                      <AnimatedQuantityButton
                        onPress={() => onRemoveFromCart(productId)}
                        backgroundColor={colors.surface}
                        textColor={colors.text}
                        size={32}
                        withRipple={true}
                      >
                        −
                      </AnimatedQuantityButton>
                      <Text style={[styles.quantityText, { color: colors.text, fontSize: TYPOGRAPHY.sizes.md, fontWeight: TYPOGRAPHY.weights.semibold }]}>
                        {cart[productId]}
                      </Text>
                      <AnimatedQuantityButton
                        onPress={() => onAddToCart(productId)}
                        backgroundColor={colors.primary}
                        textColor="#FFFFFF"
                        size={32}
                        withRipple={true}
                      >
                        +
                      </AnimatedQuantityButton>
                    </View>
                  </View>
                );
              })}

              <Pressable onPress={onClearCart} style={[styles.clearButton, { marginTop: SPACING.md }]}>
                <Trash2 size={16} color={colors.error} />
                <Text style={[styles.clearButtonText, { color: colors.error, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.medium, marginLeft: SPACING.xs }]}>
                  Vider le panier
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>

          <View style={[styles.modalFooterContainer, { paddingBottom: 0, marginBottom: 20, marginHorizontal: 15 }]}>
            {/* Background avec blur */}
              <BlurView
                intensity={30}
                tint={colorScheme === 'dark' ? 'dark' : 'light'}
                style={[styles.modalFooterBlur, {
                  backgroundColor: colors.card + '80',
                  borderWidth: 2,
                  borderColor: 'rgba(0, 85, 164, 0.6)',
                }]}
              />
            
            {/* Contenu */}
            <View style={styles.modalFooter}>
              <View style={styles.modalTotal}>
                <Text style={[{ color: colors.textSecondary, fontSize: TYPOGRAPHY.sizes.xs }]}>Total</Text>
                <Text style={[{ color: colors.primary, fontSize: TYPOGRAPHY.sizes.lg, fontWeight: TYPOGRAPHY.weights.bold }]}>
                  {cartTotal.toLocaleString()} FCFA
                </Text>
              </View>
              <Button
                title="Commander maintenant"
                onPress={() => {
                  onClose();
                  onCheckout();
                }}
                variant="gradient"
                size="md"
                icon={<ShoppingCart size={18} color="#FFFFFF" />}
                fullWidth
                withAnimation={true}
              />
            </View>
          </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: COMMON_STYLES.modalContainer,
  emptyCart: COMMON_STYLES.emptyState,
  emptyCartText: { textAlign: 'center' },
  cartItem: { flexDirection: 'row', padding: SPACING.md, alignItems: 'center' },
  cartItemImage: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  cartItemInfo: { flex: 1, marginLeft: SPACING.md },
  cartItemName: {},
  cartItemPrice: {},
  cartItemActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  quantityText: { minWidth: 24, textAlign: 'center' },
  clearButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: SPACING.md },
  clearButtonText: {},
  modalFooterContainer: {
    position: 'relative',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  modalFooterBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  modalFooter: {
    padding: 10,
    position: 'relative',
    zIndex: 1,
  },
  modalTotal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
});

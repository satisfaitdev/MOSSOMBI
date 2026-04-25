import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ShoppingCart } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/constants/colors';
import { COMMON_STYLES } from '@/constants/styles';
import { AnimatedQuantityButton } from '@/components/atoms';
import { CartModalProps } from '@/types/modal';
import HeaderLayout from '@/components/layouts/HeaderLayout';
import EmptyStateLayout from '@/components/layouts/EmptyStateLayout';
import ButtonGroupLayout from '@/components/layouts/ButtonGroupLayout';

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
  const { colors } = useTheme();

  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const cartTotal = Object.keys(cart).reduce((total, productId) => {
    const product = products.find(p => p.id === productId);
    return total + (product?.price || 0) * cart[productId];
  }, 0);

  const cartTotalFormatted = `${cartTotal.toLocaleString()} FCFA`;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <HeaderLayout
          title="Mon Panier"
          showCloseButton
          onClose={onClose}
          variant="modal"
          rightContent={
            cartCount > 0 ? (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            ) : undefined
          }
        />

        {Object.keys(cart).length === 0 ? (
          <EmptyStateLayout
            type="empty-cart"
            onAction={onClose}
            actionText="Découvrir les produits"
            style={{ flex: 1 }}
          />
        ) : (
          <>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: SPACING.lg }}>
              {Object.keys(cart).map((productId) => {
                const product = products.find(p => p.id === productId);
                if (!product) return null;
                
                return (
                  <View key={productId} style={[styles.cartItem, { backgroundColor: colors.card, marginBottom: SPACING.md }]}>
                    <View style={[styles.cartItemImage, { backgroundColor: colors.surface }]}>
                      {productIcon}
                    </View>
                    <View style={styles.cartItemInfo}>
                      <Text style={[styles.cartItemName, { color: colors.text }]} numberOfLines={2}>
                        {product.name}
                      </Text>
                      <Text style={[styles.cartItemPrice, { color: colors.primary }]}>
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
                      <Text style={[styles.quantityText, { color: colors.text }]}>
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

              <ButtonGroupLayout
                actions={[
                  {
                    title: "Vider le panier",
                    onPress: onClearCart,
                    variant: "ghost",
                    style: { marginTop: SPACING.sm },
                    icon: undefined // Trash icon was used but ghost variant usually text only or allow icon logic if Button supports it
                  }
                ]}
                variant="inline"
              />
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
               <View style={styles.totalRow}>
                <Text style={[{ color: colors.textSecondary, fontSize: TYPOGRAPHY.sizes.sm }]}>Total</Text>
                <Text style={[{ color: colors.primary, fontSize: TYPOGRAPHY.sizes.lg, fontWeight: TYPOGRAPHY.weights.bold }]}>
                  {cartTotalFormatted}
                </Text>
              </View>
              <ButtonGroupLayout
                actions={[
                  {
                    title: "Commander maintenant",
                    onPress: () => {
                      onClose();
                      onCheckout();
                    },
                    variant: "gradient", // Assuming Button supports this, previous code had it
                    // icon: <ShoppingCart size={18} color="#FFFFFF" /> // ButtonGroupLayout passes icon to Button
                  }
                ]}
                variant="default" // Using default as we handle container style manually for now to match exactly or use 'footer' variant if it matches
              />
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: COMMON_STYLES.modalContainer,
  cartItem: { 
    ...COMMON_STYLES.card, // Use unified card style 
    flexDirection: 'row', 
    alignItems: 'center',
    padding: SPACING.md 
  },
  cartItemImage: { 
    width: 60, 
    height: 60, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md
  },
  cartItemInfo: { 
    flex: 1, 
    marginLeft: SPACING.md 
  },
  cartItemName: {
    fontSize: TYPOGRAPHY.sizes.md, 
    fontWeight: TYPOGRAPHY.weights.semibold
  },
  cartItemPrice: {
    fontSize: TYPOGRAPHY.sizes.md, 
    fontWeight: TYPOGRAPHY.weights.bold, 
    marginTop: 4
  },
  cartItemActions: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.sm 
  },
  quantityText: { 
    minWidth: 24, 
    textAlign: 'center',
    fontSize: TYPOGRAPHY.sizes.md, 
    fontWeight: TYPOGRAPHY.weights.semibold
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
  },
  totalRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: SPACING.md 
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  }
});

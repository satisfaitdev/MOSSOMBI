import { useState } from 'react';
import { Animated } from 'react-native';
import { Product } from '@/types/product';

/**
 * Hook partagé pour la gestion du panier d'achat
 * Utilisé dans toutes les pages supermarket
 */
export function useShoppingCart(products: Product[]) {
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [productDetailModal, setProductDetailModal] = useState<Product | null>(null);
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successAnim] = useState(new Animated.Value(0));
  const [checkAnim] = useState(new Animated.Value(0));
  const [addToCartAnim] = useState(new Animated.Value(1));

  const addToCart = (productId: string) => {
    setCart(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
    // Animation d'ajout
    Animated.sequence([
      Animated.timing(addToCartAnim, { toValue: 1.3, duration: 150, useNativeDriver: true }),
      Animated.timing(addToCartAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[productId] > 1) {
        newCart[productId]--;
      } else {
        delete newCart[productId];
      }
      return newCart;
    });
  };

  const clearCart = () => {
    setCart({});
  };

  const getCartTotal = () => {
    return Object.keys(cart).reduce((total, productId) => {
      const product = products.find(p => p.id === productId);
      return total + (product?.price || 0) * cart[productId];
    }, 0);
  };

  const getCartItemsCount = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  };

  const handleCheckout = () => {
    if (getCartItemsCount() === 0) {
      alert('Votre panier est vide');
      return;
    }
    setCheckoutModalVisible(true);
  };

  const handleConfirmCheckout = (paymentMethod: 'full' | 'installment', deliveryOption: string) => {
    setCheckoutModalVisible(false);
    setSuccessModalVisible(true);
    
    Animated.sequence([
      Animated.spring(successAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 }),
      Animated.timing(checkAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      setSuccessModalVisible(false);
      setCart({});
      successAnim.setValue(0);
      checkAnim.setValue(0);
    }, 2500);
  };

  return {
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
  };
}

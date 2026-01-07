import React from 'react';
import ShoppingPageLayout from '@/components/templates/ShoppingPageLayout';
import { renderWithThemeAsync } from '../test-utils';
import { Product } from '@/hooks/useShoppingCart';
import { Animated } from 'react-native';
import { fireEvent } from '@testing-library/react-native';

function pressAll(root: any, limit = 8) {
  const stack: any[] = [root];
  const hits: any[] = [];
  while (stack.length && hits.length < limit) {
    const n = stack.pop();
    if (n?.props && typeof n.props.onPress === 'function') {
      hits.push(n);
    }
    if (n?.children) stack.push(...n.children);
  }
  hits.forEach((p) => fireEvent.press(p));
}

describe('ShoppingPageLayout (extra branches)', () => {
  const products: Product[] = [
    { id: '1', name: 'P1', price: 10, rating: 4, inStock: true, category: 'Cat1' },
  ];

  it('covers filters/view toggles and success modal', async () => {
    const setShowFilters = jest.fn();
    const setViewMode = jest.fn();
    const setCartModalVisible = jest.fn();

    const utils: any = await renderWithThemeAsync(
      <ShoppingPageLayout
        title="Shop"
        products={products}
        categories={['Tous', 'Cat1']}
        searchQuery=""
        setSearchQuery={jest.fn()}
        selectedCategory="Tous"
        setSelectedCategory={jest.fn()}
        sortBy="popular"
        setSortBy={jest.fn()}
        showFilters={true}
        setShowFilters={setShowFilters}
        priceRange="all"
        setPriceRange={jest.fn()}
        availabilityFilter="all"
        setAvailabilityFilter={jest.fn()}
        viewMode="grid"
        setViewMode={setViewMode}
        filteredProducts={products}
        cart={{}}
        cartModalVisible={false}
        setCartModalVisible={setCartModalVisible}
        productDetailModal={null}
        setProductDetailModal={jest.fn()}
        checkoutModalVisible={false}
        setCheckoutModalVisible={jest.fn()}
        successModalVisible={true}
        successAnim={new Animated.Value(1)}
        checkAnim={new Animated.Value(1)}
        addToCartAnim={new Animated.Value(1)}
        addToCart={jest.fn()}
        removeFromCart={jest.fn()}
        clearCart={jest.fn()}
        getCartTotal={() => 0}
        getCartItemsCount={() => 0}
        handleCheckout={jest.fn()}
        handleConfirmCheckout={jest.fn()}
      />
    );

    // Filtres visible: press some pressables including filter toggle and view buttons
    pressAll(utils.root, 10);

    // Success modal content rendered
    expect(utils.getByText('Commande confirmée !')).toBeTruthy();
  });

  it('renders empty state when no products', async () => {
    const utils: any = await renderWithThemeAsync(
      <ShoppingPageLayout
        title="Shop"
        products={[]}
        categories={['Tous']}
        searchQuery=""
        setSearchQuery={jest.fn()}
        selectedCategory="Tous"
        setSelectedCategory={jest.fn()}
        sortBy="popular"
        setSortBy={jest.fn()}
        showFilters={false}
        setShowFilters={jest.fn()}
        priceRange="all"
        setPriceRange={jest.fn()}
        availabilityFilter="all"
        setAvailabilityFilter={jest.fn()}
        viewMode="grid"
        setViewMode={jest.fn()}
        filteredProducts={[]}
        cart={{}}
        cartModalVisible={false}
        setCartModalVisible={jest.fn()}
        productDetailModal={null}
        setProductDetailModal={jest.fn()}
        checkoutModalVisible={false}
        setCheckoutModalVisible={jest.fn()}
        successModalVisible={false}
        successAnim={new Animated.Value(1)}
        checkAnim={new Animated.Value(1)}
        addToCartAnim={new Animated.Value(1)}
        addToCart={jest.fn()}
        removeFromCart={jest.fn()}
        clearCart={jest.fn()}
        getCartTotal={() => 0}
        getCartItemsCount={() => 0}
        handleCheckout={jest.fn()}
        handleConfirmCheckout={jest.fn()}
      />
    );

    expect(utils.getByText('Aucun produit trouvé')).toBeTruthy();
  });
});

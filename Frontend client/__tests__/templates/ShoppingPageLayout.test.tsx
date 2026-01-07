import React from 'react';
import ShoppingPageLayout from '@/components/templates/ShoppingPageLayout';
import { renderWithThemeAsync } from '../test-utils';
import { Product } from '@/hooks/useShoppingCart';
import { fireEvent } from '@testing-library/react-native';

const products: Product[] = [
  { id: '1', name: 'P1', price: 10, rating: 4, inStock: true, category: 'Cat1' },
  { id: '2', name: 'P2', price: 20, rating: 5, inStock: true, category: 'Cat2' },
];

describe('ShoppingPageLayout', () => {
  it('renders grid products and opens cart modal via header button', async () => {
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
        showFilters={false}
        setShowFilters={jest.fn()}
        priceRange="all"
        setPriceRange={jest.fn()}
        availabilityFilter="all"
        setAvailabilityFilter={jest.fn()}
        viewMode="grid"
        setViewMode={jest.fn()}
        filteredProducts={products}
        cart={{}}
        cartModalVisible={false}
        setCartModalVisible={setCartModalVisible}
        productDetailModal={null}
        setProductDetailModal={jest.fn()}
        checkoutModalVisible={false}
        setCheckoutModalVisible={jest.fn()}
        successModalVisible={false}
        successAnim={{} as any}
        checkAnim={{} as any}
        addToCartAnim={{} as any}
        addToCart={jest.fn()}
        removeFromCart={jest.fn()}
        clearCart={jest.fn()}
        getCartTotal={() => 0}
        getCartItemsCount={() => 0}
        handleCheckout={jest.fn()}
        handleConfirmCheckout={jest.fn()}
      />
    );

    // Find a Pressable with onPress in header right and press it
    const inst: any = utils.root;
    let target: any = null;
    const stack: any[] = [inst];
    while (stack.length) {
      const node = stack.pop();
      if (node?.props && typeof node.props.onPress === 'function') { target = node; break; }
      if (node?.children) stack.push(...node.children);
    }
    expect(target).toBeTruthy();
    fireEvent.press(target);
    expect(setCartModalVisible).toHaveBeenCalledWith(true);
  });
});

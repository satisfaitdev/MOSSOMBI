import React from 'react';
import ShoppingPageLayout from '@/components/templates/ShoppingPageLayout';
import { renderWithThemeAsync, fireEvent } from '../test-utils';
import { BlurView } from 'expo-blur';
import { Product } from '@/hooks/useShoppingCart';

function findPressableAncestor(node: any): any | null {
  let cur: any = node;
  while (cur) {
    if (cur?.props && typeof cur.props.onPress === 'function') return cur;
    cur = cur.parent;
  }
  return null;
}

describe('ShoppingPageLayout (branches)', () => {
  const products: Product[] = [
    { id: '1', name: 'P1', price: 10, rating: 4, inStock: true, category: 'Cat1' },
  ];

  it('couvre filtres et actions via libellés', async () => {
    const setShowFilters = jest.fn();
    const setPriceRange = jest.fn();
    const setAvailabilityFilter = jest.fn();
    const setSortBy = jest.fn();
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
        setSortBy={setSortBy}
        showFilters={true}
        setShowFilters={setShowFilters}
        priceRange="all"
        setPriceRange={setPriceRange}
        availabilityFilter="all"
        setAvailabilityFilter={setAvailabilityFilter}
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
        getCartItemsCount={() => 1}
        handleCheckout={jest.fn()}
        handleConfirmCheckout={jest.fn()}
      />
    );

    // Bouton Filtres
    const filtresText = utils.getByText('Filtres') as any;
    fireEvent.press(findPressableAncestor(filtresText));
    expect(setShowFilters).toHaveBeenCalled();

    // Options prix / disponibilité / tri
    fireEvent.press(findPressableAncestor(utils.getByText('Bas')));
    expect(setPriceRange).toHaveBeenCalledWith('low');

    fireEvent.press(findPressableAncestor(utils.getByText('France')));
    expect(setAvailabilityFilter).toHaveBeenCalledWith('france');

    fireEvent.press(findPressableAncestor(utils.getByText('Prix ↑')));
    expect(setSortBy).toHaveBeenCalledWith('price-asc');

    // Bouton flottant: trouver le BlurView puis remonter au Pressable
    const blur = utils.UNSAFE_getByType(BlurView) as any;
    const cartPressable = findPressableAncestor(blur);
    fireEvent.press(cartPressable);
    expect(setCartModalVisible).toHaveBeenCalledWith(true);
  });
});

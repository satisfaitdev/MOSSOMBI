import React from 'react';
import ShoppingPageLayout from '@/components/templates/ShoppingPageLayout';
import { renderWithThemeAsync, fireEvent } from '../test-utils';
import { Product } from '@/hooks/useShoppingCart';
import { Grid3X3, List, ShoppingCart } from 'lucide-react-native';

function findPressableAncestor(node: any): any | null {
  let cur: any = node;
  while (cur) {
    if (cur?.props && typeof cur.props.onPress === 'function') return cur;
    cur = cur.parent;
  }
  return null;
}

describe('ShoppingPageLayout (more handlers)', () => {
  const products: Product[] = [
    { id: '1', name: 'P1', price: 10, rating: 4, inStock: true, category: 'Cat1' },
  ];

  it('couvre recherche, catégories, tri additionnel, vue grid/list et bouton panier header', async () => {
    const setSearchQuery = jest.fn();
    const setSelectedCategory = jest.fn();
    const setSortBy = jest.fn();
    const setViewMode = jest.fn();
    const setCartModalVisible = jest.fn();

    const utils: any = await renderWithThemeAsync(
      <ShoppingPageLayout
        title="Shop"
        products={products}
        categories={['Tous', 'Cat1']}
        searchQuery=""
        setSearchQuery={setSearchQuery}
        selectedCategory="Tous"
        setSelectedCategory={setSelectedCategory}
        sortBy="popular"
        setSortBy={setSortBy}
        showFilters={true}
        setShowFilters={jest.fn()}
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

    // Recherche
    const input = utils.getByPlaceholderText('Rechercher dans Shop...');
    fireEvent.changeText(input, 'abc');
    expect(setSearchQuery).toHaveBeenCalledWith('abc');

    // Catégories
    fireEvent.press(findPressableAncestor(utils.getByText('Cat1')));
    expect(setSelectedCategory).toHaveBeenCalledWith('Cat1');

    // Tri additionnel
    fireEvent.press(findPressableAncestor(utils.getByText('Prix ↓')));
    fireEvent.press(findPressableAncestor(utils.getByText('Note')));
    expect(setSortBy).toHaveBeenCalledWith('price-desc');
    expect(setSortBy).toHaveBeenCalledWith('rating');

    // Vue grid/list via icônes
    const gridIcon = utils.UNSAFE_getByType(Grid3X3) as any;
    fireEvent.press(findPressableAncestor(gridIcon));
    const listIcon = utils.UNSAFE_getByType(List) as any;
    fireEvent.press(findPressableAncestor(listIcon));
    expect(setViewMode).toHaveBeenCalledWith('grid');
    expect(setViewMode).toHaveBeenCalledWith('list');

    // Bouton panier (flottant): sélectionner le BlurView et remonter vers un Pressable ancêtre
    const blur = utils.UNSAFE_getByType(require('expo-blur').BlurView) as any;
    fireEvent.press(findPressableAncestor(blur));
    expect(setCartModalVisible).toHaveBeenCalledWith(true);
  });
});

import React from 'react';
import { Text } from 'react-native';
import ProductDetailModal from '@/components/ProductDetailModal';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';

const productBase = {
  id: 'p1',
  name: 'Produit Test',
  price: 800,
  rating: 4.5,
  inStock: true,
  category: 'Catégorie',
  description: 'Desc',
} as const;

describe('ProductDetailModal', () => {
  it('renders info, discount and adds to cart then closes', async () => {
    const onClose = jest.fn();
    const onAddToCart = jest.fn();

    const product = { ...productBase, compareAtPrice: 1000 };

    const { getByText } = await renderWithThemeAsync(
      <ProductDetailModal
        visible
        onClose={onClose}
        product={product}
        onAddToCart={onAddToCart}
        productIcon={<Text>ICON</Text>}
      />
    );

    // Discount badge visible
    expect(getByText(/-20%/)).toBeTruthy();

    // Button label depends on quantity (default 0)
    const addBtn = getByText('Ajouter au panier');
    fireEvent.press(addBtn);

    expect(onAddToCart).toHaveBeenCalledWith('p1');
    expect(onClose).toHaveBeenCalled();

    // Quantity > 0 shows different label
    const { getByText: getByText2, queryByText: queryByText2 } = await renderWithThemeAsync(
      <ProductDetailModal
        visible
        onClose={onClose}
        product={product}
        onAddToCart={onAddToCart}
        productIcon={<Text>ICON</Text>}
        quantity={2}
      />
    );
    expect(getByText2('Ajouter encore')).toBeTruthy();
    expect(queryByText2(/2\s+dans le panier/i)).toBeTruthy();
  });

  it('disables add button when out of stock', async () => {
    const onClose = jest.fn();
    const onAddToCart = jest.fn();

    const product = { ...productBase, inStock: false };

    const { getByText } = await renderWithThemeAsync(
      <ProductDetailModal
        visible
        onClose={onClose}
        product={product}
        onAddToCart={onAddToCart}
        productIcon={<Text>ICON</Text>}
      />
    );

    const btn = getByText('Ajouter au panier');
    fireEvent.press(btn);
    expect(onAddToCart).not.toHaveBeenCalled();
  });
});

import React from 'react';
import ProductCard from '@/components/molecules/ProductCard';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';

const baseProduct = {
  id: 'p1',
  name: 'Produit test',
  price: 500,
  compareAtPrice: 1000,
  rating: 4.2,
  inStock: true,
  category: 'cat',
  availability: 'in-stock' as const,
};

describe('ProductCard', () => {
  it('renders grid view with discount and handles presses', async () => {
    const onPress = jest.fn();
    const onAddToCart = jest.fn();

    const utils = await renderWithThemeAsync(
      <ProductCard product={baseProduct} onPress={onPress} onAddToCart={onAddToCart} />
    );

    // Discount badge visible (allowing whitespace/newlines between characters)
    expect(utils.getByText(/-\s*\d+\s*%/)).toBeTruthy();

    // Press add button
    fireEvent.press(utils.getByText('Ajouter'));
    expect(onAddToCart).toHaveBeenCalled();

    // Press card
    fireEvent.press(utils.getByText('Produit test'));
    expect(onPress).toHaveBeenCalled();
  });

  it('renders list view and pressing card triggers onPress', async () => {
    const onPress = jest.fn();
    const onAddToCart = jest.fn();

    const utils = await renderWithThemeAsync(
      <ProductCard product={baseProduct} onPress={onPress} onAddToCart={onAddToCart} viewMode="list" />
    );

    // Pressing the product name triggers onPress
    fireEvent.press(utils.getByText('Produit test'));
    expect(onPress).toHaveBeenCalled();
  });
});

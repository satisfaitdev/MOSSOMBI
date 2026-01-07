import React from 'react';
import { Text } from 'react-native';
import CartModal from '@/components/CartModal';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';

describe('CartModal', () => {
  const products = [
    { id: 'p1', name: 'Prod 1', price: 500 },
    { id: 'p2', name: 'Prod 2', price: 200 },
  ];

  it('shows empty state when cart is empty', async () => {
    const onClose = jest.fn();
    const onCheckout = jest.fn();

    const { getByText } = await renderWithThemeAsync(
      <CartModal
        visible
        onClose={onClose}
        cart={{}}
        products={products}
        onAddToCart={() => {}}
        onRemoveFromCart={() => {}}
        onClearCart={() => {}}
        onCheckout={onCheckout}
        productIcon={<Text>ICON</Text>}
      />
    );

    expect(getByText('Votre panier est vide')).toBeTruthy();
  });

  it('renders items, can add/remove and checkout clears via callbacks', async () => {
    const onClose = jest.fn();
    const onCheckout = jest.fn();
    const onAddToCart = jest.fn();
    const onRemoveFromCart = jest.fn();
    const onClearCart = jest.fn();

    const { getByText, getAllByText } = await renderWithThemeAsync(
      <CartModal
        visible
        onClose={onClose}
        cart={{ p1: 2, p2: 1 }}
        products={products}
        onAddToCart={onAddToCart}
        onRemoveFromCart={onRemoveFromCart}
        onClearCart={onClearCart}
        onCheckout={onCheckout}
        productIcon={<Text>ICON</Text>}
      />
    );

    // Buttons + and − trigger callbacks for the first product (p1)
    const plusButtons = getAllByText('+');
    fireEvent.press(plusButtons[0]);
    expect(onAddToCart).toHaveBeenCalledWith('p1');

    const minusButtons = getAllByText('−');
    fireEvent.press(minusButtons[0]);
    expect(onRemoveFromCart).toHaveBeenCalledWith('p1');

    // Clear cart
    fireEvent.press(getByText('Vider le panier'));
    expect(onClearCart).toHaveBeenCalled();

    // Checkout triggers both close and checkout
    fireEvent.press(getByText('Commander maintenant'));
    expect(onClose).toHaveBeenCalled();
    expect(onCheckout).toHaveBeenCalled();
  });
});

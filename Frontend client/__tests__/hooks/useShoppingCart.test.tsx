import React, { useEffect, useRef } from 'react';
import { render, act } from '@testing-library/react-native';
import { useShoppingCart, Product } from '@/hooks/useShoppingCart';
import { Animated } from 'react-native';

type Api = ReturnType<typeof useShoppingCart>;

function TestComponent({ products, onReady }: { products: Product[]; onReady: (api: any) => void }) {
  const api = useShoppingCart(products);
  const latest = useRef<Api>(api);
  latest.current = api;
  useEffect(() => {
    onReady({ get: () => latest.current });
  }, [onReady, api]);
  return null;
}

describe('useShoppingCart', () => {
  beforeEach(() => {
    // @ts-ignore
    global.alert = jest.fn();
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  const products: Product[] = [
    { id: '1', name: 'A', price: 100, rating: 4, inStock: true, category: 'cat' },
    { id: '2', name: 'B', price: 50, rating: 3, inStock: true, category: 'cat' },
  ];

  it('adds/removes/clears and computes totals; checkout empty alerts and with items opens modal', async () => {
    const expose: any = {};
    const onReady = (x: any) => Object.assign(expose, x);
    render(<TestComponent products={products} onReady={onReady} />);
    await act(async () => {});

    // add
    act(() => {
      expose.get().addToCart('1');
    });
    expect(expose.get().getCartItemsCount()).toBe(1);
    expect(expose.get().getCartTotal()).toBe(100);

    // add second
    act(() => {
      expose.get().addToCart('2');
    });
    expect(expose.get().getCartItemsCount()).toBe(2);
    expect(expose.get().getCartTotal()).toBe(150);

    // remove one
    act(() => {
      expose.get().removeFromCart('1');
    });
    expect(expose.get().getCartItemsCount()).toBe(1);
    expect(expose.get().getCartTotal()).toBe(50);

    // clear
    act(() => {
      expose.get().clearCart();
    });
    expect(expose.get().getCartItemsCount()).toBe(0);

    // checkout empty
    act(() => {
      expose.get().handleCheckout();
    });
    expect(global.alert).toHaveBeenCalled();

    // checkout with items (ensure cart state has updated before calling checkout)
    await act(async () => {
      expose.get().addToCart('2');
    });
    expect(expose.get().getCartItemsCount()).toBe(1);
    await act(async () => {
      expose.get().handleCheckout();
    });
    expect(expose.get().checkoutModalVisible).toBe(true);
  });

  it('confirm checkout shows success and clears after delay', async () => {
    const expose: any = {};
    const onReady = (x: any) => Object.assign(expose, x);
    jest.spyOn(Animated, 'sequence').mockReturnValue({ start: (cb?: any) => cb && cb() } as any);
    render(<TestComponent products={products} onReady={onReady} />);
    await act(async () => {});

    jest.useFakeTimers();
    await act(async () => {
      expose.get().addToCart('1');
      expose.get().handleConfirmCheckout('full', 'home');
    });

    expect(expose.get().checkoutModalVisible).toBe(false);
    expect(expose.get().successModalVisible).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(2500);
    });

    expect(expose.get().successModalVisible).toBe(false);
    expect(expose.get().getCartItemsCount()).toBe(0);
    jest.useRealTimers();
  });
});

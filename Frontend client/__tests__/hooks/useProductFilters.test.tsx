import React, { useEffect, useRef } from 'react';
import { render, act } from '@testing-library/react-native';
import { useProductFilters, PriceRanges } from '@/hooks/useProductFilters';
import { Product } from '@/hooks/useShoppingCart';

type Api = ReturnType<typeof useProductFilters>;

function TestComponent({ products, ranges, onReady }: { products: Product[]; ranges: PriceRanges; onReady: (api: any) => void }) {
  const api = useProductFilters(products, ranges);
  const latest = useRef<Api>(api);
  latest.current = api;
  useEffect(() => { onReady({ get: () => latest.current }); }, [onReady, api]);
  return null;
}

describe('useProductFilters', () => {
  const products: Product[] = [
    { id: '1', name: 'Apple', price: 30, rating: 4, inStock: true, category: 'Fruits' },
    { id: '2', name: 'Banana', price: 60, rating: 5, inStock: true, category: 'Fruits' },
    { id: '3', name: 'Carrot', price: 120, rating: 3, inStock: true, category: 'Vegetables' },
  ];
  const ranges: PriceRanges = { low: 50, mid: 100, high: 200 };

  it('filters by search, category and price range, and sorts', async () => {
    const expose: any = {};
    const onReady = (x: any) => Object.assign(expose, x);
    render(<TestComponent products={products} ranges={ranges} onReady={onReady} />);
    await act(async () => {});

    // search 'a' matches all 3 (case-insensitive)
    act(() => { expose.get().setSearchQuery('a'); });
    expect(expose.get().filteredProducts.length).toBe(3);

    // category Fruits only
    act(() => { expose.get().setSelectedCategory('Fruits'); });
    expect(expose.get().filteredProducts.length).toBe(2);

    // price low (<50) leaves only Apple
    act(() => { expose.get().setPriceRange('low'); });
    expect(expose.get().filteredProducts.length).toBe(1);

    // sort by name (single item remains but call is safe)
    act(() => { expose.get().setSortBy('name'); });
    expect(expose.get().filteredProducts[0].name).toBe('Apple');
  });
});

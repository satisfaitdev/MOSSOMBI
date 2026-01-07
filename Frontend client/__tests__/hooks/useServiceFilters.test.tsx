import React, { useEffect, useRef } from 'react';
import { render, act } from '@testing-library/react-native';
import { useServiceFilters } from '@/hooks/useServiceFilters';

type Item = { id: string; name: string; description?: string; category: string; isExclusive?: boolean };

type Api = ReturnType<typeof useServiceFilters<Item>>;

function TestComponent({ items, onReady }: { items: Item[]; onReady: (api: any) => void }) {
  const api = useServiceFilters(items);
  const latest = useRef<Api>(api as any);
  latest.current = api as any;
  useEffect(() => { onReady({ get: () => latest.current }); }, [onReady, api]);
  return null;
}

describe('useServiceFilters', () => {
  const items: Item[] = [
    { id: '1', name: 'Hotel', category: 'Travel', isExclusive: true },
    { id: '2', name: 'Flight', category: 'Travel' },
    { id: '3', name: 'Gym', category: 'Health' },
  ];

  it('computes categories, filters exclusive and by search/category', async () => {
    const expose: any = {};
    const onReady = (x: any) => Object.assign(expose, x);
    render(<TestComponent items={items} onReady={onReady} />);
    await act(async () => {});

    expect(expose.get().categories).toEqual(expect.arrayContaining(['Tous', 'Travel', 'Health']));
    expect(expose.get().exclusiveItems.length).toBe(1);

    act(() => { expose.get().setSelectedCategory('Travel'); });
    expect(expose.get().filteredItems.length).toBe(2);

    act(() => { expose.get().setSearchQuery('gy'); });
    // With selectedCategory 'Travel', 'Gym' (Health) is filtered out; no item in Travel matches 'gy'
    expect(expose.get().filteredItems.length).toBe(0);

    act(() => { expose.get().setSelectedCategory('Tous'); });
    expect(expose.get().filteredItems.find((x: Item) => x.name === 'Gym')).toBeTruthy();
  });
});

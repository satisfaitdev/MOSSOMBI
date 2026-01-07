import React, { useEffect, useRef } from 'react';
import { render, act } from '@testing-library/react-native';
import { usePurchaseFlow } from '@/hooks/usePurchaseFlow';

interface Item { id: string; name: string; price: number }

type Api = ReturnType<typeof usePurchaseFlow<Item>>;

function TestComponent({ onReady, onPurchase, successDelay = 100 }: { onReady: (api: any) => void; onPurchase?: (item: Item) => void; successDelay?: number }) {
  const api = usePurchaseFlow<Item>({ onPurchase, successDelay });
  const latest = useRef<Api>(api as any);
  latest.current = api as any;
  useEffect(() => { onReady({ get: () => latest.current }); }, [onReady, api]);
  return null;
}

describe('usePurchaseFlow', () => {
  afterEach(() => { jest.useRealTimers(); });

  it('handles purchase, submit, and success flow', async () => {
    const expose: any = {};
    const onPurchase = jest.fn();
    const onReady = (x: any) => Object.assign(expose, x);
    render(<TestComponent onReady={onReady} onPurchase={onPurchase} successDelay={50} />);
    await act(async () => {});

    const item = { id: '1', name: 'Coin', price: 10 };

    act(() => { expose.get().handlePurchase(item); });
    expect(expose.get().showModal).toBe(true);

    jest.useFakeTimers();
    await act(async () => { expose.get().handleSubmit(); });

    expect(onPurchase).toHaveBeenCalledWith(item);
    expect(expose.get().showModal).toBe(false);

    await act(async () => { jest.advanceTimersByTime(50); });
    expect(expose.get().showSuccess).toBe(true);

    act(() => { expose.get().closeSuccess(); });
    expect(expose.get().showSuccess).toBe(false);

    act(() => { expose.get().closeModal(); });
    expect(expose.get().showModal).toBe(false);
  });
});

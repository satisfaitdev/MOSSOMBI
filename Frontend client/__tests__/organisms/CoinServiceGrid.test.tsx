import React from 'react';
import CoinServiceGrid from '@/components/organisms/CoinServiceGrid';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';

const services = [
  { id: '1', name: 'S1', coins: 10, price: 5, currency: 'FCFA', category: 'cat' },
  { id: '2', name: 'S2', coins: 20, price: 8, currency: 'FCFA', category: 'cat' },
  { id: '3', name: 'S3', coins: 30, price: 12, currency: 'FCFA', category: 'cat' },
];

describe('CoinServiceGrid', () => {
  it('returns null when no services', async () => {
    const { toJSON } = await renderWithThemeAsync(
      // @ts-ignore onServicePress can be noop
      <CoinServiceGrid services={[]} onServicePress={() => {}} />
    );
    expect(toJSON()).toBeNull();
  });

  it('renders services and triggers onServicePress', async () => {
    const onPress = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <CoinServiceGrid services={services as any} onServicePress={onPress} showCategoryTitle categoryTitle="Cat" />
    );
    // Pick the first Pressable in tree
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
    expect(onPress).toHaveBeenCalled();
  });
});

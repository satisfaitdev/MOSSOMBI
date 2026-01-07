import React from 'react';
import CoinServiceCard from '@/components/molecules/CoinServiceCard';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';

function findPressableAncestor(node: any): any | null {
  let cur: any = node;
  while (cur) {
    if (cur?.props && typeof cur.props.onPress === 'function') return cur;
    cur = cur.parent;
  }
  return null;
}

describe('CoinServiceCard', () => {
  it('renders and pressing Acheter triggers onPress', async () => {
    const onPress = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <CoinServiceCard coins={100} price={10} compareAtPrice={12} onPress={onPress} />
    );

    const btn = utils.getByText('Acheter') as any;
    const pressable = findPressableAncestor(btn);
    expect(pressable).toBeTruthy();
    fireEvent.press(pressable);
    expect(onPress).toHaveBeenCalled();
  });
});

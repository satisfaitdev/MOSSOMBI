import React from 'react';
import NativeAd from '@/components/NativeAd';
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

describe('NativeAd', () => {
  it('renders and CTA press calls onPress', async () => {
    const onPress = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <NativeAd title="App" description="Desc" imageUrl="https://x" onPress={onPress} rating={4.5} />
    );
    const cta = utils.getByText('Installer') as any;
    const pressable = findPressableAncestor(cta);
    fireEvent.press(pressable);
    expect(onPress).toHaveBeenCalled();
    expect(utils.getByText('4.5')).toBeTruthy();
  });
});

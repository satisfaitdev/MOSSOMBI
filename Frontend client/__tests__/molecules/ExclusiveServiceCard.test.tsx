import React from 'react';
import ExclusiveServiceCard from '@/components/molecules/ExclusiveServiceCard';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';

function findPressable(root: any): any | null {
  const stack: any[] = [root];
  while (stack.length) {
    const n = stack.pop();
    if (n?.props && typeof n.props.onPress === 'function') return n;
    if (n?.children) stack.push(...n.children);
  }
  return null;
}

describe('ExclusiveServiceCard', () => {
  it('renders and triggers onPress', async () => {
    const onPress = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <ExclusiveServiceCard
        coins={100}
        price={10}
        compareAtPrice={12}
        currency="FCFA"
        onPress={onPress}
        width={240}
      />
    );
    const pressable = findPressable(utils.root);
    expect(pressable).toBeTruthy();
    fireEvent.press(pressable);
    expect(onPress).toHaveBeenCalled();
  });
});

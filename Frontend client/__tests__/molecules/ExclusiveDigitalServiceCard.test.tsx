import React from 'react';
import ExclusiveDigitalServiceCard from '@/components/molecules/ExclusiveDigitalServiceCard';
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

describe('ExclusiveDigitalServiceCard', () => {
  it('renders and pressing subscribe triggers onPress', async () => {
    const onPress = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <ExclusiveDigitalServiceCard
        name="Spotify Premium"
        description="Musique illimitée"
        price={2000}
        compareAtPrice={3000}
        onPress={onPress}
      />
    );

    const textNode = utils.getByText("S'abonner") as any;
    const pressable = findPressableAncestor(textNode);
    expect(pressable).toBeTruthy();
    fireEvent.press(pressable);
    expect(onPress).toHaveBeenCalled();
  });

  it('shows discount badge when compareAtPrice is provided', async () => {
    const utils: any = await renderWithThemeAsync(
      <ExclusiveDigitalServiceCard
        name="Spotify Premium"
        description="Musique illimitée"
        price={2000}
        compareAtPrice={3000}
        onPress={() => {}}
      />
    );
    expect(utils.getByText('-33%')).toBeTruthy();
  });
});

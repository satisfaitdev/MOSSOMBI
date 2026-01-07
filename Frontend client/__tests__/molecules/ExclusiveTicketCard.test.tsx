import React from 'react';
import ExclusiveTicketCard from '@/components/molecules/ExclusiveTicketCard';
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

describe('ExclusiveTicketCard', () => {
  it('renders and pressing Réserver triggers onPress', async () => {
    const onPress = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <ExclusiveTicketCard
        name="Concert"
        description="Live show"
        price={10000}
        compareAtPrice={15000}
        date={new Date('2025-01-01').toISOString()}
        location="Kinshasa"
        onPress={onPress}
      />
    );

    const textNode = utils.getByText('Réserver') as any;
    const pressable = findPressableAncestor(textNode);
    expect(pressable).toBeTruthy();
    fireEvent.press(pressable);
    expect(onPress).toHaveBeenCalled();
  });

  it('shows discount badge when compareAtPrice is provided', async () => {
    const utils: any = await renderWithThemeAsync(
      <ExclusiveTicketCard
        name="Concert"
        description="Live show"
        price={10000}
        compareAtPrice={15000}
        date={new Date('2025-01-01').toISOString()}
        location="Kinshasa"
        onPress={() => {}}
      />
    );
    expect(utils.getByText('-33%')).toBeTruthy();
  });
});

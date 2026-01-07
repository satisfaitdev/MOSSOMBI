import React from 'react';
import BookingResultCard from '@/components/organisms/BookingResultCard';
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

describe('BookingResultCard (extra)', () => {
  it('disabled: pressing Réserver does nothing', async () => {
    const onPress = jest.fn();
    const onBook = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <BookingResultCard
        title="Hotel X"
        subtitle="Ville Y"
        rating={4}
        reviewCount={10}
        price={1000}
        currency="CDF"
        disabled
        onPress={onPress}
        onBook={onBook}
      />
    );

    const bookBtn = utils.getByText('Réserver') as any;
    fireEvent.press(findPressableAncestor(bookBtn));

    expect(onPress).not.toHaveBeenCalled();
    expect(onBook).not.toHaveBeenCalled();
  });

  it('renders availability badge text', async () => {
    const utils: any = await renderWithThemeAsync(
      <BookingResultCard
        title="Hotel Z"
        subtitle="Lieu Z"
        rating={5}
        reviewCount={1}
        price={500}
        currency="CDF"
        availability={{ status: 'limited', text: 'Presque complet' }}
        onPress={jest.fn()}
        onBook={jest.fn()}
      />
    );

    expect(utils.getByText('Presque complet')).toBeTruthy();
  });
});

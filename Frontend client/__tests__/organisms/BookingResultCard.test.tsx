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

describe('BookingResultCard', () => {
  beforeEach(() => jest.clearAllMocks());

  const baseProps: any = {
    title: 'Test Hotel',
    subtitle: 'Test Location',
    rating: 4.5,
    reviewCount: 12,
    price: 50000,
    currency: 'CDF',
    onPress: jest.fn(),
    onBook: jest.fn(),
    badges: ['WiFi'],
    features: [],
  };

  it('pressing card triggers onPress', async () => {
    const utils: any = await renderWithThemeAsync(<BookingResultCard {...baseProps} />);
    const titleNode = utils.getByText('Test Hotel') as any;
    const cardPressable = findPressableAncestor(titleNode);
    expect(cardPressable).toBeTruthy();
    fireEvent.press(cardPressable);
    expect(baseProps.onPress).toHaveBeenCalled();
  });

  it('pressing Réserver triggers onBook', async () => {
    const utils: any = await renderWithThemeAsync(<BookingResultCard {...baseProps} />);
    const buttonText = utils.getByText('Réserver') as any;
    const buttonPressable = findPressableAncestor(buttonText);
    expect(buttonPressable).toBeTruthy();
    fireEvent.press(buttonPressable);
    expect(baseProps.onBook).toHaveBeenCalled();
  });
});

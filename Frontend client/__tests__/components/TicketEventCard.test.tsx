import React from 'react';
import TicketEventCard from '@/components/molecules/TicketEventCard';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';

describe('TicketEventCard', () => {
  it('renders info, discount badge and handles press', async () => {
    const onPress = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <TicketEventCard
        name="Concert Test"
        description="Description courte"
        price={500}
        compareAtPrice={1000}
        date="2025-11-01"
        location="Paris"
        rating={4.5}
        onPress={onPress}
      />
    );

    // Basic fields
    expect(utils.getByText('Concert Test')).toBeTruthy();
    expect(utils.getByText('Description courte')).toBeTruthy();

    // Discount badge like "-50%" with potential whitespace/newlines
    expect(utils.getByText(/-\s*\d+\s*%/)).toBeTruthy();

    // Prices
    expect(utils.getByText(/500/)).toBeTruthy();
    expect(utils.getByText(/1000|1\s?000|1\u202f000/)).toBeTruthy();

    // Press card by traversing from a text node to nearest ancestor with onPress
    const textNode: any = utils.getByText('Concert Test');
    let cur: any = textNode;
    let pressed = false;
    while (cur && !pressed) {
      if (cur?.props && typeof cur.props.onPress === 'function') {
        fireEvent.press(cur);
        pressed = true;
        break;
      }
      cur = cur.parent;
    }
    expect(pressed).toBe(true);
    expect(onPress).toHaveBeenCalled();
  });
});

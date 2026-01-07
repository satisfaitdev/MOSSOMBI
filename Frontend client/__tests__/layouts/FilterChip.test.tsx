import React from 'react';
import FilterChip from '@/components/layouts/FilterChip';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';

describe('FilterChip', () => {
  it('renders label and triggers onPress', async () => {
    const onPress = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <FilterChip label="Promo" selected={false} onPress={onPress} />
    );
    const textNode = utils.getByText('Promo') as any;
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

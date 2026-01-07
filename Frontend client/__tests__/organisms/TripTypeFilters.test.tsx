import React from 'react';
import TripTypeFilters from '@/components/organisms/TripTypeFilters';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';

describe('TripTypeFilters', () => {
  function findPressableAncestor(node: any): any | null {
    let cur: any = node;
    while (cur) {
      if (cur?.props && typeof cur.props.onPress === 'function') return cur;
      cur = cur.parent;
    }
    return null;
  }

  it('changes trip type on press', async () => {
    const onTripTypeChange = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <TripTypeFilters tripType="one-way" onTripTypeChange={onTripTypeChange} />
    );
    const node = utils.getByText('Aller-retour') as any;
    const pressable = findPressableAncestor(node);
    expect(pressable).toBeTruthy();
    fireEvent.press(pressable);
    expect(onTripTypeChange).toHaveBeenCalledWith('round-trip');
  });
});

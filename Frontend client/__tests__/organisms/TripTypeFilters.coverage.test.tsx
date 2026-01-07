import React from 'react';
import TripTypeFilters from '@/components/organisms/TripTypeFilters';
import { renderWithThemeAsync, fireEvent } from '../test-utils';

function findPressableAncestor(node: any): any | null {
  let cur: any = node;
  while (cur) {
    if (cur?.props && typeof cur.props.onPress === 'function') return cur;
    cur = cur.parent;
  }
  return null;
}

describe('TripTypeFilters (coverage)', () => {
  it('couvre onTripTypeChange pour aller simple et aller-retour', async () => {
    const onTripTypeChange = jest.fn();

    const utils: any = await renderWithThemeAsync(
      <TripTypeFilters
        tripType="one-way"
        onTripTypeChange={onTripTypeChange}
        labels={{
          oneWay: 'Aller simple',
          roundTrip: 'Aller-retour'
        }}
      />
    );

    // Presser "Aller-retour"
    const roundTripText = utils.getByText('Aller-retour') as any;
    fireEvent.press(findPressableAncestor(roundTripText));
    expect(onTripTypeChange).toHaveBeenCalledWith('round-trip');

    // Presser "Aller simple"
    const oneWayText = utils.getByText('Aller simple') as any;
    fireEvent.press(findPressableAncestor(oneWayText));
    expect(onTripTypeChange).toHaveBeenCalledWith('one-way');
  });
});

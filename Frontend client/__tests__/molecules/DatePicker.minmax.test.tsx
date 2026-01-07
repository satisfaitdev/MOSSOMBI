import React from 'react';
import DatePicker from '@/components/molecules/DatePicker';
import { renderWithThemeAsync, fireEvent } from '../test-utils';

function findPressableAncestor(node: any): any | null {
  let cur: any = node;
  while (cur) {
    if (cur?.props && typeof cur.props.onPress === 'function') return cur;
    cur = cur.parent;
  }
  return null;
}

describe('DatePicker (min/max disabled)', () => {
  it('ne sélectionne pas un jour disabled par minDate', async () => {
    const utils: any = await renderWithThemeAsync(
      <DatePicker value={new Date(2020, 5, 15)} minDate={new Date(2020, 5, 20)} />
    );

    // Ouvrir le calendrier
    const field = findPressableAncestor(utils.getByText('15/06/2020'));
    fireEvent.press(field);

    // Jour 15 devrait être disabled
    const d15 = utils.getByText('15') as any;
    const cell = findPressableAncestor(d15);
    expect(cell?.props?.disabled).toBe(true);

    // Tente de presser, la modale ne se ferme pas (Aujourd'hui reste visible)
    fireEvent.press(cell);
    expect(utils.getByText("Aujourd'hui")).toBeTruthy();
  });
});

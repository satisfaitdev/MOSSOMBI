import React from 'react';
import BookingsTest from '@/components/organisms/BookingsTest';
import { renderWithThemeAsync, fireEvent } from '../test-utils';

function findPressableAncestor(node: any): any | null {
  let cur: any = node;
  while (cur) {
    if (cur?.props && typeof cur.props.onPress === 'function') return cur;
    cur = cur.parent;
  }
  return null;
}

describe('BookingsTest (coverage)', () => {
  it('rend la carte et déclenche onPress et onBook (console.log)', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const utils: any = await renderWithThemeAsync(<BookingsTest />);

      // Carte présente
      const title = utils.getByText('Test Hotel') as any;
      // onPress de la carte
      fireEvent.press(findPressableAncestor(title));
      expect(consoleSpy).toHaveBeenCalledWith('Card pressed');

      // onBook via le bouton "Réserver"
      const book = utils.getByText('Réserver') as any;
      fireEvent.press(findPressableAncestor(book));
      expect(consoleSpy).toHaveBeenCalledWith('Book pressed');
    } finally {
      consoleSpy.mockRestore();
    }
  });
});

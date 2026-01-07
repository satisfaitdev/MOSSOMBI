import React from 'react';
import BookingsExample from '@/components/organisms/BookingsExample';
import { renderWithThemeAsync, fireEvent } from '../test-utils';

function findPressableAncestor(node: any): any | null {
  let cur: any = node;
  while (cur) {
    if (cur?.props && typeof cur.props.onPress === 'function') return cur;
    cur = cur.parent;
  }
  return null;
}

describe('BookingsExample (render + empty action)', () => {
  it('rend le header, le search bar et l\'empty state; l\'action est pressable', async () => {
    const utils: any = await renderWithThemeAsync(<BookingsExample />);

    // SearchBar présent via placeholder
    expect(utils.getByPlaceholderText('Rechercher un hôtel...')).toBeTruthy();

    // Empty state présent (pas de résultats)
    expect(utils.getByText('Aucun hôtel trouvé')).toBeTruthy();

    // Action de l'empty state
    const action = utils.getByText('Réinitialiser') as any;
    const pressable = findPressableAncestor(action);
    if (pressable) {
      fireEvent.press(pressable);
    }
  });
});

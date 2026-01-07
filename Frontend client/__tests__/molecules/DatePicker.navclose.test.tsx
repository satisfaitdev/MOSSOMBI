import React from 'react';
import DatePicker from '@/components/molecules/DatePicker';
import { renderWithThemeAsync, fireEvent, waitFor } from '../test-utils';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';

function findPressableAncestor(node: any): any | null {
  let cur: any = node;
  while (cur) {
    if (cur?.props && typeof cur.props.onPress === 'function') return cur;
    cur = cur.parent;
  }
  return null;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

describe('DatePicker navigation & close', () => {
  it('navigue mois précédent/suivant et se ferme via X', async () => {
    const base = new Date();
    const utils: any = await renderWithThemeAsync(
      <DatePicker value={base} />
    );

    // Ouvrir le calendrier
    const placeholder = utils.getByText(
      base.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    ) as any;
    const field = findPressableAncestor(placeholder);
    fireEvent.press(field);

    // Vérifier le header courant
    const currentHeader = utils.getByText(monthLabel(new Date(base.getFullYear(), base.getMonth(), 1)));

    // Appuyer sur mois suivant
    const rightIcon = utils.UNSAFE_getByType(ChevronRight) as any;
    const rightBtn = findPressableAncestor(rightIcon);
    fireEvent.press(rightBtn);
    const nextHeader = monthLabel(addMonths(base, 1));
    expect(utils.getByText(nextHeader)).toBeTruthy();

    // Appuyer sur mois précédent (revient au mois courant)
    const leftIcon = utils.UNSAFE_getByType(ChevronLeft) as any;
    const leftBtn = findPressableAncestor(leftIcon);
    fireEvent.press(leftBtn);
    const backHeader = monthLabel(new Date(base.getFullYear(), base.getMonth(), 1));
    expect(utils.getByText(backHeader)).toBeTruthy();

    // Fermer via X
    const closeIcon = utils.UNSAFE_getByType(X) as any;
    const closeBtn = findPressableAncestor(closeIcon);
    fireEvent.press(closeBtn);

    await waitFor(() => {
      expect(utils.queryByText("Aujourd'hui")).toBeNull();
    });

    // Eviter warning unused var
    expect(currentHeader).toBeTruthy();
  });
});

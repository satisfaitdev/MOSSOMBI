import React from 'react';
import DatePicker from '@/components/molecules/DatePicker';
import { renderWithThemeAsync, fireEvent, waitFor } from '../test-utils';

function findPressableAncestor(node: any): any | null {
  let cur: any = node;
  while (cur) {
    if (cur?.props && typeof cur.props.onPress === 'function') return cur;
    cur = cur.parent;
  }
  return null;
}

function findOverlayAncestor(node: any): any | null {
  // Find nearest ancestor Pressable whose onPress expects 0 args (overlay uses () => ...)
  let cur: any = node;
  while (cur) {
    if (cur?.props && typeof cur.props.onPress === 'function') {
      const fn = cur.props.onPress;
      if (typeof fn === 'function' && fn.length === 0) return cur;
    }
    cur = cur.parent;
  }
  return null;
}

function findNodeWithOnRequestClose(root: any): any | null {
  const stack: any[] = [root];
  while (stack.length) {
    const n = stack.pop();
    if (n?.props && typeof n.props.onRequestClose === 'function') return n;
    if (n?.children) stack.push(...n.children);
  }
  return null;
}

describe('DatePicker (extra)', () => {
  it('fermeture via overlay', async () => {
    const utils: any = await renderWithThemeAsync(
      <DatePicker placeholder="Sélectionner une date" />
    );
    const fieldText = utils.getByText('Sélectionner une date') as any;
    const field = findPressableAncestor(fieldText);
    fireEvent.press(field);

    // Overlay ouvert
    expect(utils.getByText("Aujourd'hui")).toBeTruthy();

    // Ferme via l'API onRequestClose du Modal
    const modalNode = findNodeWithOnRequestClose(utils.root);
    expect(modalNode).toBeTruthy();
    modalNode.props.onRequestClose();

    // Après fermeture, Aujourd'hui n'est plus présent
    await waitFor(() => expect(utils.queryByText("Aujourd'hui")).toBeNull());
  });

  it('range: sélection 15 puis 10 (inversion) ferme le calendrier', async () => {
    function Wrapper() {
      const [start, setStart] = React.useState<Date | undefined>();
      const [end, setEnd] = React.useState<Date | undefined>();
      return (
        <DatePicker
          mode="range"
          startDate={start}
          endDate={end}
          onRangeChange={(s, e) => {
            if (s.getTime() === e.getTime()) {
              setStart(s);
              setEnd(undefined);
            } else {
              setStart(s);
              setEnd(e);
            }
          }}
        />
      );
    }

    const utils: any = await renderWithThemeAsync(<Wrapper />);

    // Open
    const ph = utils.getByText('Sélectionner une date') as any;
    fireEvent.press(findPressableAncestor(ph));

    // Pick day 15 as start
    const d15 = utils.getByText('15');
    fireEvent.press(findPressableAncestor(d15));

    // Pick earlier day 10 to trigger (date < tempStartDate) branch which closes
    const d10 = utils.getByText('10');
    fireEvent.press(findPressableAncestor(d10));

    // Calendar should close after end selection; ensure no Aujourd'hui button present
    await waitFor(() => expect(utils.queryByText("Aujourd'hui")).toBeNull());
  });
});

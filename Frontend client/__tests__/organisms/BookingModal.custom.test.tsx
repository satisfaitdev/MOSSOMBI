import React from 'react';
import BookingModal from '@/components/organisms/BookingModal';
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

describe('BookingModal (custom submit label)', () => {
  it('shows custom submitLabel and calls onConfirm', async () => {
    const onConfirm = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <BookingModal
        visible
        onClose={() => {}}
        onConfirm={onConfirm}
        title="Réservation"
        serviceName="Service"
        totalPrice={1000}
        currency="CDF"
        fields={[{ key: 'name', label: 'Nom', placeholder: '...' }]}
        submitLabel="Payer maintenant"
      />
    );

    const node = utils.getByText('Payer maintenant') as any;
    const pressable = findPressableAncestor(node);
    fireEvent.press(pressable);
    expect(onConfirm).toHaveBeenCalled();
  });
});

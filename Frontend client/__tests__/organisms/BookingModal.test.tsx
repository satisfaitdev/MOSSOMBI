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

describe('BookingModal', () => {
  const baseProps: any = {
    visible: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    title: 'Réservation Hôtel',
    serviceName: 'Hôtel Test',
    serviceDetails: '2 nuits • 2 invités',
    totalPrice: 1000,
    currency: 'CDF',
    fields: [
      { key: 'name', label: 'Nom', placeholder: 'Votre nom' },
    ],
  };

  beforeEach(() => jest.clearAllMocks());

  it('pressing submit calls onConfirm', async () => {
    const utils: any = await renderWithThemeAsync(<BookingModal {...baseProps} />);
    const text = utils.getByText('Confirmer la réservation') as any;
    const pressable = findPressableAncestor(text);
    expect(pressable).toBeTruthy();
    fireEvent.press(pressable);
    expect(baseProps.onConfirm).toHaveBeenCalled();
  });

  it('pressing cancel calls onClose', async () => {
    const utils: any = await renderWithThemeAsync(<BookingModal {...baseProps} />);
    const text = utils.getByText('Annuler') as any;
    const pressable = findPressableAncestor(text);
    expect(pressable).toBeTruthy();
    fireEvent.press(pressable);
    expect(baseProps.onClose).toHaveBeenCalled();
  });
});

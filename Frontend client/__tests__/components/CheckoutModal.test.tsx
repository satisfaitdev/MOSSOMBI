import React from 'react';
import CheckoutModal from '@/components/CheckoutModal';
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

describe('CheckoutModal', () => {
  const baseProps = {
    visible: true,
    onClose: jest.fn(),
    cart: { '1': 2 },
    products: [{ id: '1', name: 'Prod', price: 1000 }],
    onConfirm: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('pressing Annuler calls onClose', async () => {
    const utils: any = await renderWithThemeAsync(<CheckoutModal {...baseProps} />);
    const cancel = utils.getByText('Annuler') as any;
    const pressable = findPressableAncestor(cancel);
    expect(pressable).toBeTruthy();
    fireEvent.press(pressable);
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  it('pressing Confirmer calls onConfirm with default choices', async () => {
    const utils: any = await renderWithThemeAsync(<CheckoutModal {...baseProps} />);
    const confirm = utils.getByText('Confirmer') as any;
    const pressable = findPressableAncestor(confirm);
    fireEvent.press(pressable);
    expect(baseProps.onConfirm).toHaveBeenCalledWith('full', 'standard');
  });

  it('supports changing payment and delivery options before confirming', async () => {
    const onConfirm = jest.fn();
    const utils: any = await renderWithThemeAsync(<CheckoutModal {...baseProps} onConfirm={onConfirm} />);

    const installment = utils.getByText('Paiement en 3 fois') as any;
    fireEvent.press(findPressableAncestor(installment));

    const express = utils.getByText('Livraison express') as any;
    fireEvent.press(findPressableAncestor(express));

    const confirm = utils.getByText('Confirmer') as any;
    fireEvent.press(findPressableAncestor(confirm));

    expect(onConfirm).toHaveBeenCalledWith('installment', 'express');
  });
});

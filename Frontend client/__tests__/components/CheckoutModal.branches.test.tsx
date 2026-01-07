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

describe('CheckoutModal (branches paiement/livraison)', () => {
  const baseProps = {
    visible: true,
    onClose: jest.fn(),
    cart: { '1': 1 },
    products: [{ id: '1', name: 'P', price: 1000 }],
    onConfirm: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('sélectionne paiement en 3 fois + livraison express puis confirme', async () => {
    const utils: any = await renderWithThemeAsync(<CheckoutModal {...baseProps} />);

    const p3 = utils.getByText('Paiement en 3 fois') as any;
    fireEvent.press(findPressableAncestor(p3));

    const express = utils.getByText('Livraison express') as any;
    fireEvent.press(findPressableAncestor(express));

    const confirmer = utils.getByText('Confirmer') as any;
    fireEvent.press(findPressableAncestor(confirmer));

    expect(baseProps.onConfirm).toHaveBeenCalledWith('installment', 'express');
  });
});

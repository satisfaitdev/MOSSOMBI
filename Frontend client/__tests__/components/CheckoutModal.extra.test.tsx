import React from 'react';
import CheckoutModal from '@/components/CheckoutModal';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent, act } from '@testing-library/react-native';
import { Alert } from 'react-native';

function findPressableAncestor(node: any): any | null {
  let cur: any = node;
  while (cur) {
    if (cur?.props && typeof cur.props.onPress === 'function') return cur;
    cur = cur.parent;
  }
  return null;
}

jest.useFakeTimers();

describe('CheckoutModal (extra branches)', () => {
  const baseProps = {
    visible: true,
    onClose: jest.fn(),
    cart: { '1': 1 },
    products: [{ id: '1', name: 'Prod', price: 1000 }],
    onConfirm: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('switches to manual address and fills fields', async () => {
    const utils: any = await renderWithThemeAsync(<CheckoutModal {...baseProps} />);
    const manual = utils.getByText('Manuelle') as any;
    fireEvent.press(findPressableAncestor(manual));

    const street = utils.getByPlaceholderText('Ex: Avenue de la Paix, N°123');
    fireEvent.changeText(street, '12 Rue');

    const commune = utils.getByPlaceholderText('Ex: Gombe');
    fireEvent.changeText(commune, 'Gombe');

    const city = utils.getByPlaceholderText('Kinshasa');
    fireEvent.changeText(city, 'Kinshasa');

    const details = utils.getByPlaceholderText('Ex: Bâtiment A, 2ème étage, porte gauche');
    fireEvent.changeText(details, '2e étage');

    const confirm = utils.getByText('Confirmer') as any;
    fireEvent.press(findPressableAncestor(confirm));
    expect(baseProps.onConfirm).toHaveBeenCalled();
  });

  it('detects location (auto) and shows alert', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const utils: any = await renderWithThemeAsync(<CheckoutModal {...baseProps} />);

    const detect = utils.getByText('Détecter ma position') as any;
    fireEvent.press(findPressableAncestor(detect));

    await act(async () => {
      jest.advanceTimersByTime(1600);
    });

    expect(alertSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});

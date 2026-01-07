import React from 'react';
import WalletCard from '@/components/WalletCard';
import { renderWithThemeAsync, fireEvent } from '../test-utils';

describe('WalletCard (callbacks par défaut)', () => {
  it('appuyer sur Recharger/Retirer utilise les callbacks par défaut', async () => {
    const utils: any = await renderWithThemeAsync(<WalletCard balance={1000} points={10} />);

    // Les Pressable existent via leurs testID
    const recharge = utils.getByTestId('recharge-button');
    const withdraw = utils.getByTestId('withdraw-button');

    // Appuyer ne doit pas lever d'erreur et couvre les fonctions par défaut
    fireEvent.press(recharge);
    fireEvent.press(withdraw);

    // Toujours rendu
    expect(utils.getByText('Solde disponible')).toBeTruthy();
  });
});

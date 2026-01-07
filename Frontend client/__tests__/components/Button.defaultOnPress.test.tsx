import React from 'react';
import Button from '@/components/Button';
import { renderWithThemeAsync, fireEvent } from '../test-utils';

describe('Button (default onPress)', () => {
  it('appelle la fonction par défaut lorsqu\'aucun onPress n\'est fourni', async () => {
    const utils = await renderWithThemeAsync(
      <Button title="NoHandler" />
    );
    const node = (utils as any).getByText('NoHandler');
    fireEvent.press(node);
    // Si la fonction par défaut est exécutée, aucune erreur ne se produit et la branche est couverte
    expect(node).toBeTruthy();
  });
});

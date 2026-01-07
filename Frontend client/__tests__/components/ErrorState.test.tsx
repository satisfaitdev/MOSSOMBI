import React from 'react';
import ErrorState from '@/components/molecules/ErrorState';
import { renderWithThemeAsync, screen } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';

describe('ErrorState', () => {
  it('renders default title and message', async () => {
    await renderWithThemeAsync(
      <ErrorState message="Impossible de charger" />
    );
    expect(screen.getByText('Une erreur est survenue')).toBeTruthy();
    expect(screen.getByText('Impossible de charger')).toBeTruthy();
  });

  it('renders action button and triggers onAction', async () => {
    const onAction = jest.fn();
    await renderWithThemeAsync(
      <ErrorState message="Echec" actionLabel="Réessayer" onAction={onAction} />
    );
    fireEvent.press(screen.getByText('Réessayer'));
    expect(onAction).toHaveBeenCalled();
  });
});

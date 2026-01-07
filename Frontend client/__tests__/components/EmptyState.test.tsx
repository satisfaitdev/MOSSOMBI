import React from 'react';
import EmptyState from '@/components/molecules/EmptyState';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';
import { Package } from 'lucide-react-native';

describe('EmptyState', () => {
  it('renders title and message', async () => {
    const { getByText } = await renderWithThemeAsync(
      <EmptyState title="Aucun résultat" message="Essayez encore" />
    );
    expect(getByText('Aucun résultat')).toBeTruthy();
    expect(getByText('Essayez encore')).toBeTruthy();
  });

  it('renders action button and triggers onAction', async () => {
    const onAction = jest.fn();
    const { getByText } = await renderWithThemeAsync(
      <EmptyState
        icon={<Package />}
        title="Vide"
        actionLabel="Réinitialiser"
        onAction={onAction}
      />
    );
    fireEvent.press(getByText('Réinitialiser'));
    expect(onAction).toHaveBeenCalled();
  });
});

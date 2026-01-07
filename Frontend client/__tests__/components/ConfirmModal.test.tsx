import React from 'react';
import { renderWithTheme } from '../test-utils';
import { ConfirmModal } from '@/components/organisms/modals';
import { fireEvent } from '@testing-library/react-native';

describe('ConfirmModal', () => {
  it('calls onClose when pressing cancel and onConfirm when pressing confirm', () => {
    const onClose = jest.fn();
    const onConfirm = jest.fn();

    const { getByText } = renderWithTheme(
      <ConfirmModal
        visible
        onClose={onClose}
        onConfirm={onConfirm}
        title="Titre"
        message="Message"
        type="info"
      />
    );

    fireEvent.press(getByText('Annuler'));
    expect(onClose).toHaveBeenCalled();

    fireEvent.press(getByText('Confirmer'));
    expect(onConfirm).toHaveBeenCalled();
  });
});

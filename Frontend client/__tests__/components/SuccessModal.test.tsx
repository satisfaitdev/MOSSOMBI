import React from 'react';
import SuccessModal from '@/components/organisms/modals/SuccessModal';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';

describe('SuccessModal', () => {
  it('renders title and message and calls onClose when pressing button (no autoClose)', async () => {
    const onClose = jest.fn();
    const { getByText, queryByText } = await renderWithThemeAsync(
      <SuccessModal
        visible
        onClose={onClose}
        title="Bravo"
        message="Opération réussie"
      />
    );

    expect(getByText('Bravo')).toBeTruthy();
    expect(getByText('Opération réussie')).toBeTruthy();

    // Button present when autoClose = false
    const btn = getByText('Parfait !');
    fireEvent.press(btn);
    expect(onClose).toHaveBeenCalled();

    // Button label alias
    const { getByText: getByText2 } = await renderWithThemeAsync(
      <SuccessModal
        visible
        onClose={onClose}
        title="Bravo"
        message="Opération réussie"
        buttonLabel="OK"
      />
    );
    expect(getByText2('OK')).toBeTruthy();
  });

  it('auto closes after duration and hides the button when autoClose is true', async () => {
    jest.useFakeTimers();
    const onClose = jest.fn();

    const { queryByText } = await renderWithThemeAsync(
      <SuccessModal
        visible
        onClose={onClose}
        title="Terminé"
        message="Tout est bon"
        autoClose
        autoCloseDuration={100}
      />
    );

    // No action button when autoClose
    expect(queryByText('Parfait !')).toBeNull();

    // Advance timers to trigger autoClose
    await Promise.resolve();
    jest.advanceTimersByTime(100);

    expect(onClose).toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('renders with sparkles animation', async () => {
    const onClose = jest.fn();
    const { getByText } = await renderWithThemeAsync(
      <SuccessModal
        visible
        onClose={onClose}
        title="Effet"
        message="Animation sparkles"
        animation="sparkles"
      />
    );
    expect(getByText('Effet')).toBeTruthy();
    expect(getByText('Animation sparkles')).toBeTruthy();
  });

  it('renders with confetti animation', async () => {
    const onClose = jest.fn();
    const { getByText } = await renderWithThemeAsync(
      <SuccessModal
        visible
        onClose={onClose}
        title="Confetti"
        message="Animation confetti"
        animation="confetti"
      />
    );
    expect(getByText('Confetti')).toBeTruthy();
    expect(getByText('Animation confetti')).toBeTruthy();
  });
});

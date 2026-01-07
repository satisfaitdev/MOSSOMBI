import React from 'react';
import SplashAd from '@/components/SplashAd';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent, act } from '@testing-library/react-native';

jest.useFakeTimers();

describe('SplashAd', () => {
  it('counts down and allows close then CTA', async () => {
    const onClose = jest.fn();
    const onCta = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <SplashAd visible title="Titre" description="Desc" duration={1} onClose={onClose} onCta={onCta} />
    );

    // countdown 1s -> allow close
    await act(async () => {
      jest.advanceTimersByTime(1100);
    });

    // press CTA
    const cta = utils.getByText('Découvrir maintenant');
    fireEvent.press(cta);
    expect(onCta).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});

import React from 'react';
import SplashAd from '@/components/SplashAd';
import { renderWithThemeAsync } from '../test-utils';
import { act, fireEvent } from '@testing-library/react-native';
import { Platform } from 'react-native';

describe('SplashAd (Android CTA)', () => {
  const realOS = Platform.OS;
  beforeEach(() => {
    jest.useFakeTimers();
    Object.defineProperty(Platform, 'OS', { value: 'android' });
  });
  afterEach(() => {
    jest.useRealTimers();
    Object.defineProperty(Platform, 'OS', { value: realOS });
    jest.clearAllMocks();
  });

  it('CTA press appelle setButtonStyleAsync("dark"), onCta et onClose', async () => {
    const navBar = require('expo-navigation-bar');
    const onClose = jest.fn();
    const onCta = jest.fn();

    const utils: any = await renderWithThemeAsync(
      <SplashAd visible title="Titre" description="Desc" duration={1} onClose={onClose} onCta={onCta} />
    );

    // Après montage: style light
    expect(navBar.setButtonStyleAsync).toHaveBeenCalledWith('light');

    // Attendre la fin du compte à rebours
    act(() => {
      jest.advanceTimersByTime(1100);
    });

    const cta = utils.getByText('Découvrir maintenant') as any;
    // Monter à un ancêtre pressable
    let cur: any = cta;
    let pressable: any = null;
    for (let i = 0; i < 6 && cur && !pressable; i++) {
      if (cur?.props && typeof cur.props.onPress === 'function') { pressable = cur; break; }
      cur = cur.parent;
    }
    expect(pressable).toBeTruthy();
    fireEvent.press(pressable);

    expect(navBar.setButtonStyleAsync).toHaveBeenCalledWith('dark');
    expect(onCta).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});

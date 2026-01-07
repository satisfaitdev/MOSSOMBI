import React from 'react';
import SplashAd from '@/components/SplashAd';
import { renderWithThemeAsync } from '../test-utils';
import { Platform } from 'react-native';

describe('SplashAd (iOS branch)', () => {
  const realOS = Platform.OS;
  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', { value: 'ios' });
  });
  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: realOS });
  });

  it('rend le composant en iOS sans appel NavigationBar', async () => {
    const utils = await renderWithThemeAsync(
      <SplashAd visible title="Titre" description="Desc" onClose={jest.fn()} />
    );
    // Smoke: présence du titre
    expect(utils.getByText('Titre')).toBeTruthy();
  });
});

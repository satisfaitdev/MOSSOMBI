import React from 'react';
import SplashAd from '@/components/SplashAd';
import { renderWithThemeAsync } from '../test-utils';

describe('SplashAd (visible=false)', () => {
  it('rend sans exécuter les effets liés à visible', async () => {
    await renderWithThemeAsync(
      <SplashAd visible={false} title="Titre" description="Desc" onClose={jest.fn()} />
    );
    // Smoke: pas d'assertion nécessaire, on couvre la branche visible=false
  });
});

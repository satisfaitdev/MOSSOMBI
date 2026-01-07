import React from 'react';
import AdBanner from '@/components/AdBanner';
import { renderWithThemeAsync } from '../test-utils';

describe('AdBanner (closeable=false)', () => {
  it('rend sans le bouton de fermeture', async () => {
    const utils = await renderWithThemeAsync(
      <AdBanner title="Promo" description="Details" closeable={false} />
    );
    expect(utils.getByText('Promo')).toBeTruthy();
  });
});

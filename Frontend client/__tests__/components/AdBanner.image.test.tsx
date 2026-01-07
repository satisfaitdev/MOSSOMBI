import React from 'react';
import AdBanner from '@/components/AdBanner';
import { renderWithThemeAsync } from '../test-utils';

describe('AdBanner (image background)', () => {
  it('renders with imageUrl branch', async () => {
    const { getByText } = await renderWithThemeAsync(
      <AdBanner title="Info" description="Desc" imageUrl={{ uri: 'https://img' }} />
    );
    expect(getByText('Info')).toBeTruthy();
    expect(getByText('Desc')).toBeTruthy();
  });
});

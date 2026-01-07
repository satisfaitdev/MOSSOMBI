import React from 'react';
import PriceDisplay from '@/components/molecules/PriceDisplay';
import { renderWithThemeAsync, screen } from '../test-utils';

describe('PriceDisplay', () => {
  it('renders price and currency', async () => {
    await renderWithThemeAsync(<PriceDisplay price={50} currency="FCFA" />);
    expect(screen.getByText(/FCFA/)).toBeTruthy();
  });

  it('shows discount badge when compareAtPrice > price', async () => {
    await renderWithThemeAsync(<PriceDisplay price={50} compareAtPrice={100} currency="FCFA" />);
    expect(screen.getByText('-50%')).toBeTruthy();
  });

  it('hides discount when showDiscount=false but still shows compareAtPrice', async () => {
    await renderWithThemeAsync(<PriceDisplay price={50} compareAtPrice={100} currency="FCFA" showDiscount={false} />);
    expect(screen.queryByText(/-%/)).toBeNull();
    expect(screen.getByText('100 FCFA')).toBeTruthy();
  });
});

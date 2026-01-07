import React from 'react';
import RatingDisplay from '@/components/molecules/RatingDisplay';
import { renderWithThemeAsync, screen } from '../test-utils';

describe('RatingDisplay', () => {
  it('renders rating value and review count', async () => {
    await renderWithThemeAsync(<RatingDisplay rating={4.5} reviewCount={123} />);
    expect(screen.getByText('4.5')).toBeTruthy();
    expect(screen.getByText('(123)')).toBeTruthy();
  });

  it('does not render rating value when showValue=false', async () => {
    await renderWithThemeAsync(<RatingDisplay rating={3.2} showValue={false} />);
    expect(screen.queryByText('3.2')).toBeNull();
  });
});

import React from 'react';
import Avatar from '@/components/atoms/Avatar';
import { renderWithThemeAsync, screen } from '../test-utils';

describe('Avatar', () => {
  it('renders initials uppercased', async () => {
    await renderWithThemeAsync(<Avatar initials="js" />);
    expect(screen.getByText('JS')).toBeTruthy();
  });
});

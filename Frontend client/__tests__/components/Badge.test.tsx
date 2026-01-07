import React from 'react';
import Badge from '@/components/atoms/Badge';
import { renderWithThemeAsync, screen } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';

describe('Badge', () => {
  it('renders children (default variant)', async () => {
    await renderWithThemeAsync(<Badge>En stock</Badge>);
    expect(screen.getByText('En stock')).toBeTruthy();
  });

  it('calls onPress when provided', async () => {
    const onPress = jest.fn();
    await renderWithThemeAsync(<Badge onPress={onPress}>Cliquer</Badge>);
    fireEvent.press(screen.getByText('Cliquer'));
    expect(onPress).toHaveBeenCalled();
  });

  it('renders success variant', async () => {
    await renderWithThemeAsync(<Badge variant="success">OK</Badge>);
    expect(screen.getByText('OK')).toBeTruthy();
  });

  it('renders warning variant and different size', async () => {
    await renderWithThemeAsync(<Badge variant="warning" size="lg">Attention</Badge>);
    expect(screen.getByText('Attention')).toBeTruthy();
  });
});

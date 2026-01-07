import React from 'react';
import ExclusiveCarousel from '@/components/organisms/ExclusiveCarousel';
import { renderWithThemeAsync } from '../test-utils';
import { Text } from 'react-native';

describe('ExclusiveCarousel (generic)', () => {
  it('returns null when no items', async () => {
    const { toJSON } = await renderWithThemeAsync(
      <ExclusiveCarousel items={[]} renderItem={(item: any) => <Text>{item.label}</Text>} />
    );
    expect(toJSON()).toBeNull();
  });

  it('renders a single item without auto-scroll', async () => {
    const { getByText } = await renderWithThemeAsync(
      <ExclusiveCarousel items={[{ id: '1', label: 'A' }]} renderItem={(item: any) => <Text>{item.label}</Text>} />
    );
    expect(getByText('A')).toBeTruthy();
  });
});

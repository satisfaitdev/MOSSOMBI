import React from 'react';
import ServiceGrid from '@/components/organisms/ServiceGrid';
import { renderWithThemeAsync } from '../test-utils';
import { Text } from 'react-native';

describe('ServiceGrid (generic)', () => {
  it('returns null when items empty', async () => {
    const { toJSON } = await renderWithThemeAsync(
      <ServiceGrid items={[]} renderItem={(item: any) => <Text>{item.label}</Text>} />
    );
    expect(toJSON()).toBeNull();
  });

  it('renders items with custom renderItem', async () => {
    const items = [
      { id: '1', label: 'A' },
      { id: '2', label: 'B' },
    ];
    const { getByText } = await renderWithThemeAsync(
      <ServiceGrid items={items} renderItem={(item: any) => <Text>Item: {item.label}</Text>} />
    );
    expect(getByText('Item: A')).toBeTruthy();
    expect(getByText('Item: B')).toBeTruthy();
  });
});

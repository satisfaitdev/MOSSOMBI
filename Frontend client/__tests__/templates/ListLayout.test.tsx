import React from 'react';
import ListLayout from '@/components/templates/ListLayout';
import { renderWithThemeAsync } from '../test-utils';
import { Text } from 'react-native';

describe('ListLayout', () => {
  it('renders title and items', async () => {
    const items = ['A', 'B'];
    const { getByText } = await renderWithThemeAsync(
      <ListLayout
        title="Services"
        items={items}
        renderItem={(item) => <Text>{item}</Text>}
      />
    );

    expect(getByText('Services')).toBeTruthy();
    expect(getByText('A')).toBeTruthy();
    expect(getByText('B')).toBeTruthy();
  });
});

import React from 'react';
import ServicePageLayout from '@/components/templates/ServicePageLayout';
import { renderWithThemeAsync } from '../test-utils';
import { Text } from 'react-native';

describe('ServicePageLayout', () => {
  it('renders search input and empty message', async () => {
    const onSearchChange = jest.fn();
    const onCategoryChange = jest.fn();

    const { getByPlaceholderText, getByText } = await renderWithThemeAsync(
      <ServicePageLayout
        title="Services"
        searchQuery=""
        onSearchChange={onSearchChange}
        searchPlaceholder="Recherchez ici"
        categories={['Tous', 'Cat1']}
        selectedCategory="Tous"
        onCategoryChange={onCategoryChange}
        showEmpty
        emptyMessage="Rien"
      >
        <Text>Content</Text>
      </ServicePageLayout>
    );

    expect(getByPlaceholderText('Recherchez ici')).toBeTruthy();
    expect(getByText('Rien')).toBeTruthy();
  });
});

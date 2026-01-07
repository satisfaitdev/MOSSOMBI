import React from 'react';
import SearchLayout from '@/components/templates/SearchLayout';
import { renderWithThemeAsync } from '../test-utils';
import { Text, ActivityIndicator } from 'react-native';

describe('SearchLayout', () => {
  it('shows loading state', async () => {
    const utils: any = await renderWithThemeAsync(
      <SearchLayout
        results={[]}
        renderItem={(x: string) => <Text>{x}</Text>}
        loading
      />
    );
    // ActivityIndicator present
    expect(utils.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('renders result count and items when not loading', async () => {
    const utils = await renderWithThemeAsync(
      <SearchLayout
        results={[{ id: '1' }, { id: '2' }]}
        renderItem={(x: any) => <Text>Item {x.id}</Text>}
        keyExtractor={(x: any) => x.id}
      />
    );
    expect(utils.getByText(/2\s*résultat/)).toBeTruthy();
    expect(utils.getByText('Item 1')).toBeTruthy();
    expect(utils.getByText('Item 2')).toBeTruthy();
  });

  it('renders default empty state when no results', async () => {
    const { getByText } = await renderWithThemeAsync(
      <SearchLayout
        results={[]}
        renderItem={(x: any) => <Text>Item</Text>}
      />
    );
    expect(getByText('Aucun résultat trouvé')).toBeTruthy();
  });
});

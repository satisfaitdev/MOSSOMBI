import React from 'react';
import SearchLayout from '@/components/templates/SearchLayout';
import { renderWithThemeAsync } from '../test-utils';
import { Text } from 'react-native';

describe('SearchLayout default keyExtractor', () => {
  it('utilise le keyExtractor par défaut quand non fourni', async () => {
    const { getByText } = await renderWithThemeAsync(
      <SearchLayout
        results={[{ name: 'A' }, { name: 'B' }]}
        renderItem={(x: any) => <Text>Item {x.name}</Text>}
      />
    );
    expect(getByText(/2\s*résultat/)).toBeTruthy();
  });
});

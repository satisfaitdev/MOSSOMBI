import React from 'react';
import SearchLayout from '@/components/templates/SearchLayout';
import { renderWithThemeAsync } from '../test-utils';
import { Text } from 'react-native';

describe('SearchLayout (customResults & empty singular)', () => {
  it('affiche customResults lorsqu\'ils sont fournis', async () => {
    const { getByText, queryByText } = await renderWithThemeAsync(
      <SearchLayout
        results={[{ id: '1' }]}
        renderItem={(x: any) => <Text>Item {x.id}</Text>}
        customResults={<Text>Custom Results</Text>}
      />
    );
    expect(getByText('Custom Results')).toBeTruthy();
    expect(queryByText(/1\s*résultat/)).toBeNull();
  });

  it('affiche le libellé singulier pour 1 résultat', async () => {
    const { getByText } = await renderWithThemeAsync(
      <SearchLayout
        results={[{ id: '1' }]}
        renderItem={(x: any) => <Text>Item {x.id}</Text>}
        keyExtractor={(x: any) => x.id}
      />
    );
    expect(getByText(/1\s*résultat\s*trouvé/)).toBeTruthy();
  });
});

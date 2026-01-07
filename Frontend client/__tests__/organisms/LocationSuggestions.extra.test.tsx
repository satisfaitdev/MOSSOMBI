import React from 'react';
import LocationSuggestions from '@/components/organisms/LocationSuggestions';
import { renderWithThemeAsync } from '../test-utils';
import { Text } from 'react-native';

describe('LocationSuggestions (extra)', () => {
  it('visible avec suggestions reste non rendu (Modal visible=false)', async () => {
    const suggestions = [
      { title: 'Ville A', subtitle: 'A1', description: 'Pays A' },
    ];
    const { toJSON } = await renderWithThemeAsync(
      <LocationSuggestions
        visible
        suggestions={suggestions}
        onSelect={jest.fn()}
        onClose={jest.fn()}
        position={{ top: 10, left: 10, right: 10 }}
        renderItem={(it) => <Text>{it.title}</Text>}
      />
    );
    expect(toJSON()).toBeNull();
  });
});

import React from 'react';
import { Text } from 'react-native';
import { renderWithThemeAsync } from '../test-utils';
import LocationSuggestions from '@/components/organisms/LocationSuggestions';
describe('LocationSuggestions (stable null render)', () => {
  it('reste non rendu même quand visible et avec suggestions (Modal interne visible=false)', async () => {
    const suggestions = [
      { title: 'Ville A', subtitle: 'A1', description: 'Pays A' },
    ];
    const { toJSON } = await renderWithThemeAsync(
      <LocationSuggestions
        visible
        suggestions={suggestions as any}
        onSelect={jest.fn()}
        onClose={jest.fn()}
        position={{ top: 10, left: 10, right: 10 }}
        renderItem={(it: any) => <Text>{it.title}</Text>}
      />
    );
    expect(toJSON()).toBeNull();
  });
});

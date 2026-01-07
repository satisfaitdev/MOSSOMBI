import React from 'react';
import LocationSuggestions from '@/components/organisms/LocationSuggestions';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';
import { Text, Pressable } from 'react-native';

describe('LocationSuggestions', () => {
  it('returns null when not visible or no suggestions', async () => {
    const { toJSON } = await renderWithThemeAsync(
      <LocationSuggestions visible={false} suggestions={[]} onSelect={jest.fn()} renderItem={() => <Text>Item</Text>} position={{ top: 0, left: 0, right: 0 }} />
    );
    expect(toJSON()).toBeNull();
  });

  it('returns null when visible with empty suggestions', async () => {
    const { toJSON } = await renderWithThemeAsync(
      <LocationSuggestions
        visible
        suggestions={[]}
        onSelect={jest.fn()}
        renderItem={(item: any) => <Text>Item {item?.name}</Text>}
        position={{ top: 10, left: 0, right: 0 }}
      />
    );
    expect(toJSON()).toBeNull();
  });
});

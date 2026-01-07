import React from 'react';
import { renderWithThemeAsync } from '../test-utils';
import { View } from 'react-native';
import { LocationItem } from '@/components/organisms/LocationSuggestions';

describe('LocationItem', () => {
  it('affiche title, subtitle et description', async () => {
    const DummyIcon: any = () => <View />;
    const { getByText } = await renderWithThemeAsync(
      <LocationItem
        title="Ville A"
        subtitle="A1 - Aéroport"
        description="Pays A"
        icon={DummyIcon}
      />
    );
    expect(getByText('Ville A')).toBeTruthy();
    expect(getByText('A1 - Aéroport')).toBeTruthy();
    expect(getByText('Pays A')).toBeTruthy();
  });
});

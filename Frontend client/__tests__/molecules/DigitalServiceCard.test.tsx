import React from 'react';
import DigitalServiceCard from '@/components/molecules/DigitalServiceCard';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';

describe('DigitalServiceCard', () => {
  it('renders and pressing subscribe triggers onPress', async () => {
    const onPress = jest.fn();
    const utils = await renderWithThemeAsync(
      <DigitalServiceCard
        name="Netflix"
        description="Films et séries"
        price={500}
        compareAtPrice={1000}
        icon={<Text>Icon</Text>}
        duration="1 mois"
        onPress={onPress}
      />
    );

    const btn = (utils as any).getByText("S'abonner");
    fireEvent.press(btn);
    expect(onPress).toHaveBeenCalled();
  });

  it('shows discount badge when compareAtPrice is provided', async () => {
    const utils: any = await renderWithThemeAsync(
      <DigitalServiceCard
        name="Service"
        description="Desc"
        price={500}
        compareAtPrice={1000}
        icon={<Text>Icon</Text>}
        onPress={() => {}}
      />
    );
    expect(utils.getByText('-50%')).toBeTruthy();
  });
});

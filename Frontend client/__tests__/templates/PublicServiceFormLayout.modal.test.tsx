import React from 'react';
import PublicServiceFormLayout from '@/components/templates/PublicServiceFormLayout';
import { renderWithThemeAsync } from '../test-utils';
import { Animated, Text } from 'react-native';

describe('PublicServiceFormLayout (success modal)', () => {
  it('shows success modal contents when visible', async () => {
    const successAnim = new Animated.Value(1);
    const checkAnim = new Animated.Value(1);

    const utils: any = await renderWithThemeAsync(
      <PublicServiceFormLayout
        title="Paiement"
        icon={<Text>Icon</Text>}
        iconColor="#00f"
        loading={false}
        successModalVisible={true}
        successAnim={successAnim}
        checkAnim={checkAnim}
        onSubmit={() => {}}
      >
        <Text>Form</Text>
      </PublicServiceFormLayout>
    );

    expect(utils.getByText('Succès !')).toBeTruthy();
  });
});

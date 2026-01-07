import React from 'react';
import CategoryPageLayout from '@/components/templates/CategoryPageLayout';
import { renderWithThemeAsync } from '../test-utils';
import { Text, Animated } from 'react-native';

describe('CategoryPageLayout', () => {
  it('renders title and children', async () => {
    jest.spyOn(Animated, 'spring').mockReturnValue({ start: jest.fn() } as any);
    const { getByText } = await renderWithThemeAsync(
      <CategoryPageLayout title="Catégories">
        <Text>Child</Text>
      </CategoryPageLayout>
    );
    expect(getByText('Catégories')).toBeTruthy();
    expect(getByText('Child')).toBeTruthy();
  });
});

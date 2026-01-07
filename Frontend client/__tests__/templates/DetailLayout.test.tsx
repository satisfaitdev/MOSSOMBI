import React from 'react';
import DetailLayout from '@/components/templates/DetailLayout';
import { renderWithThemeAsync } from '../test-utils';
import { Text } from 'react-native';

describe('DetailLayout', () => {
  it('renders header, content, actions and footer', async () => {
    const { getByText } = await renderWithThemeAsync(
      <DetailLayout
        header={<Text>Header</Text>}
        content={<Text>Content</Text>}
        actions={<Text>Actions</Text>}
        footer={<Text>Footer</Text>}
      />
    );

    expect(getByText('Header')).toBeTruthy();
    expect(getByText('Content')).toBeTruthy();
    expect(getByText('Actions')).toBeTruthy();
    expect(getByText('Footer')).toBeTruthy();
  });
});

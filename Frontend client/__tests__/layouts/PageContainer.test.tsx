import React from 'react';
import PageContainer from '@/components/layouts/PageContainer';
import { renderWithThemeAsync } from '../test-utils';
import { Text, ScrollView } from 'react-native';

describe('PageContainer', () => {
  it('renders with ScrollView by default', async () => {
    const utils: any = await renderWithThemeAsync(
      <PageContainer><Text>Child</Text></PageContainer>
    );
    expect(() => utils.UNSAFE_getByType(ScrollView)).not.toThrow();
  });

  it('renders non-scrollable when scrollable=false', async () => {
    const utils: any = await renderWithThemeAsync(
      <PageContainer scrollable={false}><Text>Child</Text></PageContainer>
    );
    expect(() => utils.UNSAFE_getByType(ScrollView)).toThrow();
  });
});

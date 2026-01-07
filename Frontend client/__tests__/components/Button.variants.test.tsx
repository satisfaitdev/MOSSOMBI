import React from 'react';
import Button from '@/components/Button';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';

describe('Button variants', () => {
  const variants: any[] = ['primary','secondary','danger','success','outline','ghost','gradient'];

  it('renders all variants without crashing', async () => {
    for (const v of variants) {
      await renderWithThemeAsync(<Button title={`T-${v}`} variant={v as any} />);
    }
  });

  it('gradient withAnimation triggers onPress', async () => {
    const onPress = jest.fn();
    const { getByText } = await renderWithThemeAsync(
      <Button title="Go" variant="gradient" withAnimation onPress={onPress} />
    );
    const node = getByText('Go');
    fireEvent.press(node);
    expect(onPress).toHaveBeenCalled();
  });
});

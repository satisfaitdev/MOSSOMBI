import React from 'react';
import Button from '@/components/Button';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';

describe('Button', () => {
  it('renders title and triggers onPress', async () => {
    const onPress = jest.fn();
    const { getByText } = await renderWithThemeAsync(
      <Button title="Click me" onPress={onPress} />
    );

    const btn = getByText('Click me');
    fireEvent.press(btn);
    expect(onPress).toHaveBeenCalled();
  });

  it('does not trigger onPress when loading', async () => {
    const onPress = jest.fn();
    const { getByTestId } = await renderWithThemeAsync(
      <Button title="Save" onPress={onPress} loading testID="btn" />
    );

    const pressable = getByTestId('btn');
    fireEvent.press(pressable);
    expect(onPress).not.toHaveBeenCalled();
  });
});

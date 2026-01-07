import React from 'react';
import AnimatedButton from '@/components/atoms/AnimatedButton';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';
import * as animations from '@/constants/animations';

describe('AnimatedButton', () => {
  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    const startMock = jest.fn((cb?: any) => cb && cb());
    jest.spyOn(animations, 'createScaleBounceAnimation').mockReturnValue({ start: startMock } as any);
    const { getByText } = await renderWithThemeAsync(<AnimatedButton title="Go" onPress={onPress} />);
    fireEvent.press(getByText('Go'));
    expect(startMock).toHaveBeenCalled();
    expect(onPress).toHaveBeenCalled();
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    jest.spyOn(animations, 'createScaleBounceAnimation').mockReturnValue({ start: jest.fn((cb?: any) => cb && cb()) } as any);
    const { getByText } = await renderWithThemeAsync(<AnimatedButton title="Go" onPress={onPress} disabled />);
    fireEvent.press(getByText('Go'));
    expect(onPress).not.toHaveBeenCalled();
  });
});

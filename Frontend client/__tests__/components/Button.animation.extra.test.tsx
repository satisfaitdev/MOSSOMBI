import React from 'react';
import Button from '@/components/Button';
import { renderWithThemeAsync, fireEvent } from '../test-utils';
import { Animated } from 'react-native';
import * as animations from '@/constants/animations';

describe('Button (withAnimation non-gradient)', () => {
  it('déclenche onPress après animations', async () => {
    const onPress = jest.fn();

    // Mock ripple (timing) et parallel pour appeler le callback de fin
    jest.spyOn(Animated, 'timing').mockReturnValue({ start: (cb?: any) => cb && cb() } as any);
    jest.spyOn(Animated, 'parallel').mockImplementation((arr: any[]) => {
      return { start: (cb?: any) => {
        // Démarre chaque anim individuellement
        arr.forEach((a: any) => a && a.start && a.start());
        cb && cb();
      }} as any;
    });
    jest.spyOn(animations, 'createScaleBounceAnimation').mockReturnValue({ start: (cb?: any) => cb && cb() } as any);

    const utils = await renderWithThemeAsync(
      <Button title="Play" onPress={onPress} withAnimation variant="primary" />
    );

    const text = (utils as any).getByText('Play');
    fireEvent.press(text);
    expect(onPress).toHaveBeenCalled();
  });
});

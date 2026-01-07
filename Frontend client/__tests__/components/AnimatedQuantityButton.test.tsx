import React from 'react';
import AnimatedQuantityButton from '@/components/atoms/AnimatedQuantityButton';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';
import { Animated, Pressable } from 'react-native';

describe('AnimatedQuantityButton', () => {
  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    jest.spyOn(Animated, 'parallel').mockReturnValue({ start: (cb?: any) => cb && cb() } as any);
    const utils: any = await renderWithThemeAsync(
      <AnimatedQuantityButton backgroundColor="#000" onPress={onPress}>+</AnimatedQuantityButton>
    );
    const textNode = utils.getByText('+') as any;
    let cur: any = textNode;
    let pressed = false;
    while (cur && !pressed) {
      if (cur?.props && typeof cur.props.onPress === 'function') {
        fireEvent.press(cur);
        pressed = true;
        break;
      }
      cur = cur.parent;
    }
    expect(pressed).toBe(true);
    expect(onPress).toHaveBeenCalled();
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <AnimatedQuantityButton backgroundColor="#000" onPress={onPress} disabled>-</AnimatedQuantityButton>
    );
    const textNode = utils.getByText('-') as any;
    let cur: any = textNode;
    let pressed = false;
    while (cur && !pressed) {
      if (cur?.props && typeof cur.props.onPress === 'function') {
        fireEvent.press(cur);
        pressed = true;
        break;
      }
      cur = cur.parent;
    }
    expect(pressed).toBe(true);
    expect(onPress).not.toHaveBeenCalled();
  });
});

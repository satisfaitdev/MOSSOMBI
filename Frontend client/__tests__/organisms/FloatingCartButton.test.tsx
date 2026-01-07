import React from 'react';
import FloatingCartButton from '@/components/organisms/FloatingCartButton';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';
import { Animated } from 'react-native';

describe('FloatingCartButton', () => {
  it('returns null when itemCount is 0', async () => {
    const { toJSON } = await renderWithThemeAsync(
      <FloatingCartButton itemCount={0} onPress={jest.fn()} />
    );
    expect(toJSON()).toBeNull();
  });

  it('press triggers onPress (with animations mocked)', async () => {
    const onPress = jest.fn();
    jest.spyOn(Animated, 'parallel').mockReturnValue({ start: (cb?: any) => cb && cb() } as any);
    const utils: any = await renderWithThemeAsync(
      <FloatingCartButton itemCount={3} onPress={onPress} />
    );
    // Find first node with onPress
    const inst: any = utils.root;
    const stack: any[] = [inst];
    let pressable: any = null;
    while (stack.length) {
      const n = stack.pop();
      if (n?.props && typeof n.props.onPress === 'function') { pressable = n; break; }
      if (n?.children) stack.push(...n.children);
    }
    expect(pressable).toBeTruthy();
    fireEvent.press(pressable);
    expect(onPress).toHaveBeenCalled();
  });
});

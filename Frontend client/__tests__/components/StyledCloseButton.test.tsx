import React from 'react';
import StyledCloseButton from '@/components/atoms/StyledCloseButton';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';
import { Animated } from 'react-native';

describe('StyledCloseButton', () => {
  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    jest.spyOn(Animated, 'parallel').mockReturnValue({ start: (cb?: any) => cb && cb() } as any);
    const utils: any = await renderWithThemeAsync(<StyledCloseButton onPress={onPress} />);
    // Find the icon by hierarchy: the X icon isn't text; traverse from root to find onPress handler
    const tree: any = utils.toJSON();
    // Fallback: simulate press by walking ReactTestInstance tree from any leaf with parent onPress
    const inst: any = utils.root;
    let target: any = null;
    const stack: any[] = [inst];
    while (stack.length) {
      const node = stack.pop();
      if (node?.props && typeof node.props.onPress === 'function') { target = node; break; }
      if (node?.children) stack.push(...node.children);
    }
    expect(target).toBeTruthy();
    fireEvent.press(target);
    expect(onPress).toHaveBeenCalled();
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    const utils: any = await renderWithThemeAsync(<StyledCloseButton onPress={onPress} disabled />);
    const inst: any = utils.root;
    let target: any = null;
    const stack: any[] = [inst];
    while (stack.length) {
      const node = stack.pop();
      if (node?.props && typeof node.props.onPress === 'function') { target = node; break; }
      if (node?.children) stack.push(...node.children);
    }
    expect(target).toBeTruthy();
    fireEvent.press(target);
    expect(onPress).not.toHaveBeenCalled();
  });
});

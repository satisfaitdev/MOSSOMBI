import React from 'react';
import OrderButtonExample from '@/components/ButtonAnimationExample';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';

function pressAllPressables(root: any) {
  const stack = [root];
  const pressables: any[] = [];
  while (stack.length) {
    const n: any = stack.pop();
    if (n?.props && typeof n.props.onPress === 'function') pressables.push(n);
    if (n?.children) stack.push(...n.children);
  }
  pressables.forEach((p) => fireEvent.press(p));
}

describe('ButtonAnimationExample', () => {
  it('renders and buttons are pressable', async () => {
    const utils: any = await renderWithThemeAsync(<OrderButtonExample />);
    pressAllPressables(utils.root);
  });
});

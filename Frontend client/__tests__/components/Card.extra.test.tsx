import React from 'react';
import Card from '@/components/Card';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';

function findFirstPressable(root: any): any | null {
  const stack: any[] = [root];
  while (stack.length) {
    const n = stack.pop();
    if (n?.props && typeof n.props.onPress === 'function') return n;
    if (n?.children) stack.push(...n.children);
  }
  return null;
}

describe('Card (branches)', () => {
  it('gradient without onPress renders LinearGradient path', async () => {
    const utils: any = await renderWithThemeAsync(
      <Card variant="gradient"><Text>G</Text></Card>
    );
    const pressable = findFirstPressable(utils.root);
    expect(pressable).toBeNull();
  });

  it('default without onPress renders plain View', async () => {
    const utils: any = await renderWithThemeAsync(
      <Card><Text>V</Text></Card>
    );
    const pressable = findFirstPressable(utils.root);
    expect(pressable).toBeNull();
  });

  it('default with onPress renders Pressable and fires', async () => {
    const onPress = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <Card onPress={onPress}><Text>P</Text></Card>
    );
    const node = utils.getByText('P') as any;
    let cur: any = node;
    let pressable: any = null;
    for (let i = 0; i < 6 && cur && !pressable; i++) {
      if (cur?.props && typeof cur.props.onPress === 'function') { pressable = cur; break; }
      cur = cur.parent;
    }
    expect(pressable).toBeTruthy();
    fireEvent.press(pressable);
    expect(onPress).toHaveBeenCalled();
  });
});

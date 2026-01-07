import React from 'react';
import Card from '@/components/Card';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';

function findPressableAncestor(node: any): any | null {
  let cur: any = node;
  while (cur) {
    if (cur?.props && typeof cur.props.onPress === 'function') return cur;
    cur = cur.parent;
  }
  return null;
}

describe('Card', () => {
  it('renders gradient variant and handles onPress', async () => {
    const onPress = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <Card variant="gradient" onPress={onPress}><Text>Content</Text></Card>
    );
    const node = utils.getByText('Content') as any;
    const pressable = findPressableAncestor(node);
    expect(pressable).toBeTruthy();
    fireEvent.press(pressable);
    expect(onPress).toHaveBeenCalled();
  });
});

import React from 'react';
import Counter from '@/components/molecules/Counter';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';
function findPressablesNearNode(node: any): any[] {
  let cur: any = node;
  for (let i = 0; i < 8 && cur; i++) {
    const children = cur?.children || [];
    const clickable = children.filter((c: any) => c?.props && typeof c.props.onPress === 'function');
    if (clickable.length) return clickable;
    cur = cur.parent;
  }
  return [];
}

describe('Counter (min boundary)', () => {
  it('does not decrement below min', async () => {
    const onChange = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <Counter value={0} onChange={onChange} min={0} max={5} />
    );
    const valueNode = utils.getByText('0') as any;
    const clickable = findPressablesNearNode(valueNode);
    const minus = clickable[0];
    fireEvent.press(minus);
    expect(onChange).not.toHaveBeenCalled();
  });
});

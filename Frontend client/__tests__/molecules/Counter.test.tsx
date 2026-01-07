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

describe('Counter', () => {
  it('increments when pressing plus within max', async () => {
    const onChange = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <Counter value={1} onChange={onChange} min={0} max={5} />
    );
    const valueNode = utils.getByText('1') as any;
    const clickable = findPressablesNearNode(valueNode);
    const target = clickable[clickable.length - 1];
    fireEvent.press(target);
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('does not change when disabled', async () => {
    const onChange = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <Counter value={3} onChange={onChange} disabled />
    );
    const valueNode = utils.getByText('3') as any;
    const clickable = findPressablesNearNode(valueNode);
    clickable.forEach((p: any) => fireEvent.press(p));
    expect(onChange).not.toHaveBeenCalled();
  });
});

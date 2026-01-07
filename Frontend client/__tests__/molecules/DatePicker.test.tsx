import React from 'react';
import DatePicker from '@/components/molecules/DatePicker';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';

function findPressableAncestor(node: any): any | null {
  let cur: any = node;
  while (cur) {
    if (cur?.props && typeof cur.props.onPress === 'function') return cur;
    cur = cur.parent;
  }
  return null;
}

describe('DatePicker', () => {
  it('single mode: opens calendar and selects today calling onChange', async () => {
    const onChange = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <DatePicker onChange={onChange} placeholder="Sélectionner une date" />
    );

    const placeholder = utils.getByText('Sélectionner une date') as any;
    const field = findPressableAncestor(placeholder);
    expect(field).toBeTruthy();
    fireEvent.press(field);

    const todayBtn = utils.getByText("Aujourd'hui") as any;
    fireEvent.press(todayBtn);

    expect(onChange).toHaveBeenCalled();
    const arg = (onChange as any).mock.calls[0][0];
    expect(arg instanceof Date).toBe(true);
  });

  it('range mode: opens calendar and triggers onRangeChange', async () => {
    const onRangeChange = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <DatePicker mode="range" onRangeChange={onRangeChange} />
    );

    // Open
    const placeholder = utils.getByText('Sélectionner une date') as any;
    const field = findPressableAncestor(placeholder);
    fireEvent.press(field);

    // Pick today once (starts range)
    const todayBtn = utils.getByText("Aujourd'hui") as any;
    fireEvent.press(todayBtn);

    expect(onRangeChange).toHaveBeenCalled();
    const [start, end] = (onRangeChange as any).mock.calls[0];
    expect(start instanceof Date).toBe(true);
    expect(end instanceof Date).toBe(true);
  });
});

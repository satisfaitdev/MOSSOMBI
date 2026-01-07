import React from 'react';
import FilterChips from '@/components/molecules/FilterChips';
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

describe('FilterChips', () => {
  it('calls onSelect with option id when a chip is pressed (string[] input)', async () => {
    const onSelect = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <FilterChips options={['all', 'income']} selected={'all'} onSelect={onSelect} />
    );
    // Label is capitalized by component, so 'Income'
    const node = utils.getByText('Income') as any;
    const pressable = findPressableAncestor(node);
    expect(pressable).toBeTruthy();
    fireEvent.press(pressable);
    expect(onSelect).toHaveBeenCalledWith('income');
  });

  it('works with object options as well', async () => {
    const onSelect = jest.fn();
    const options = [
      { id: 'all', label: 'Tous' },
      { id: 'expense', label: 'Dépenses' },
    ];
    const utils: any = await renderWithThemeAsync(
      <FilterChips options={options as any} selected={'all'} onSelect={onSelect} />
    );
    const node = utils.getByText('Dépenses') as any;
    const pressable = findPressableAncestor(node);
    fireEvent.press(pressable);
    expect(onSelect).toHaveBeenCalledWith('expense');
  });
});

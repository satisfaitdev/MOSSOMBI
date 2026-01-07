import React from 'react';
import ClassFilters from '@/components/organisms/ClassFilters';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';

describe('ClassFilters', () => {
  const classes = [
    { id: 'economy', label: 'Économique', description: 'Confort standard' },
    { id: 'business', label: 'Affaires', description: 'Confort supérieur' },
    { id: 'first', label: 'Première', description: 'Luxe maximum' },
  ];

  function findPressableAncestor(node: any): any | null {
    let cur: any = node;
    while (cur) {
      if (cur?.props && typeof cur.props.onPress === 'function') return cur;
      cur = cur.parent;
    }
    return null;
  }

  it('calls onClassChange when selecting another class', async () => {
    const onClassChange = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <ClassFilters selectedClass="economy" onClassChange={onClassChange} classes={classes as any} />
    );
    const node = utils.getByText('Affaires') as any;
    const pressable = findPressableAncestor(node);
    expect(pressable).toBeTruthy();
    fireEvent.press(pressable);
    expect(onClassChange).toHaveBeenCalledWith('business');
  });
});

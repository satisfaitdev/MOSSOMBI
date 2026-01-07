import React from 'react';
import ExclusiveCarousel from '@/components/organisms/ExclusiveCarousel';
import { renderWithThemeAsync } from '../test-utils';
import { Text } from 'react-native';
import { act } from '@testing-library/react-native';

function getDotWidths(root: any): number[] {
  const stack: any[] = [root];
  while (stack.length) {
    const n = stack.pop();
    if (Array.isArray(n?.children) && n.children.length > 1) {
      const widths = n.children.map((c: any) => {
        const st = Array.isArray(c?.props?.style)
          ? Object.assign({}, ...c.props.style)
          : c?.props?.style || {};
        return st?.width;
      });
      if (widths.every((w: any) => w === 8 || w === 20)) {
        return widths as number[];
      }
    }
    if (n?.children) stack.push(...n.children);
  }
  return [];
}

describe('ExclusiveCarousel (auto-scroll)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('active les points successivement et revient au début', async () => {
    const items = [
      { id: '1', label: 'A' },
      { id: '2', label: 'B' },
      { id: '3', label: 'C' },
    ];

    const utils: any = await renderWithThemeAsync(
      <ExclusiveCarousel items={items} renderItem={(it: any) => <Text>{it.label}</Text>} autoScrollInterval={3000} />
    );

    const seq: number[][] = [];
    seq.push(getDotWidths(utils.root));

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    seq.push(getDotWidths(utils.root));

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    seq.push(getDotWidths(utils.root));

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    seq.push(getDotWidths(utils.root));

    // Vérifie un cycle: [20,8,8] -> [8,20,8] -> [8,8,20] -> [20,8,8]
    expect(seq[0]).toEqual([20, 8, 8]);
    expect(seq[1]).toEqual([8, 20, 8]);
    expect(seq[2]).toEqual([8, 8, 20]);
    expect(seq[3]).toEqual([20, 8, 8]);
  });
});

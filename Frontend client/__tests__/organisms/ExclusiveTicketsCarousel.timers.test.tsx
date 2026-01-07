import React from 'react';
import ExclusiveTicketsCarousel from '@/components/organisms/ExclusiveTicketsCarousel';
import { renderWithThemeAsync } from '../test-utils';
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
      // ExclusiveTicketsCarousel uses width 24 for active dot
      if (widths.every((w: any) => w === 8 || w === 24)) return widths as number[];
    }
    if (n?.children) stack.push(...n.children);
  }
  return [];
}

describe('ExclusiveTicketsCarousel (auto-scroll)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('active les points successivement et revient au début', async () => {
    const events = [
      { id: '1', name: 'E1', description: 'D1', price: 10, date: '2025-11-01', location: 'Paris' },
      { id: '2', name: 'E2', description: 'D2', price: 20, date: '2025-12-01', location: 'Lyon' },
      { id: '3', name: 'E3', description: 'D3', price: 30, date: '2026-01-01', location: 'Marseille' },
    ];

    const utils: any = await renderWithThemeAsync(
      <ExclusiveTicketsCarousel events={events as any} onEventPress={jest.fn()} />
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

    expect(seq[0]).toEqual([24, 8, 8]);
    expect(seq[1]).toEqual([8, 24, 8]);
    expect(seq[2]).toEqual([8, 8, 24]);
    expect(seq[3]).toEqual([24, 8, 8]);
  });
});

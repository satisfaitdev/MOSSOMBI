import React from 'react';
import ExclusiveServicesCarousel from '@/components/organisms/ExclusiveServicesCarousel';
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
      // ExclusiveServicesCarousel uses width 20 for active dot
      if (widths.every((w: any) => w === 8 || w === 20)) return widths as number[];
    }
    if (n?.children) stack.push(...n.children);
  }
  return [];
}

describe('ExclusiveServicesCarousel (auto-scroll)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('active les points successivement et revient au début', async () => {
    const services = [
      { id: '1', name: 'S1', coins: 10, price: 5, currency: 'FCFA', category: 'cat' },
      { id: '2', name: 'S2', coins: 20, price: 8, currency: 'FCFA', category: 'cat' },
      { id: '3', name: 'S3', coins: 30, price: 12, currency: 'FCFA', category: 'cat' },
    ];

    const utils: any = await renderWithThemeAsync(
      <ExclusiveServicesCarousel services={services as any} onServicePress={jest.fn()} />
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

    expect(seq[0]).toEqual([20, 8, 8]);
    expect(seq[1]).toEqual([8, 20, 8]);
    expect(seq[2]).toEqual([8, 8, 20]);
    expect(seq[3]).toEqual([20, 8, 8]);
  });
});

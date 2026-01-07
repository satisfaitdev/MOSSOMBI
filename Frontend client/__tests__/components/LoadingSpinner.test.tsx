import React from 'react';
import LoadingSpinner from '@/components/atoms/LoadingSpinner';
import { renderWithThemeAsync, screen } from '../test-utils';

describe('LoadingSpinner', () => {
  it('renders with message', async () => {
    await renderWithThemeAsync(<LoadingSpinner message="Chargement..." />);
    expect(screen.getByText('Chargement...')).toBeTruthy();
  });

  it('renders in fullScreen mode', async () => {
    await renderWithThemeAsync(<LoadingSpinner fullScreen message="Please wait" />);
    const msg = screen.getByText('Please wait') as any;

    const getStyleProp = (el: any, prop: string) => {
      const styles = Array.isArray(el?.props?.style) ? el.props.style.flat(Infinity) : el?.props?.style ? [el.props.style] : [];
      for (let i = styles.length - 1; i >= 0; i--) {
        const s = styles[i];
        if (s && typeof s === 'object' && prop in s) return s[prop];
      }
      return undefined;
    };
    const findAncestorWithProp = (el: any, prop: string) => {
      let cur: any = el;
      while (cur) {
        const val = getStyleProp(cur, prop);
        if (val !== undefined) return [cur, val] as const;
        cur = cur.parent;
      }
      return [null, undefined] as const;
    };

    const [, flexVal] = findAncestorWithProp(msg, 'flex');
    expect(flexVal).toBe(1);
  });
});

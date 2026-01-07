import React from 'react';
import AdBanner from '@/components/AdBanner';
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

describe('AdBanner', () => {
  it('renders and pressing CTA without url is safe', async () => {
    const utils: any = await renderWithThemeAsync(
      <AdBanner title="Promo" description="Details" ctaText="Voir" closeable={false} />
    );
    const cta = utils.getByText('Voir') as any;
    const pressable = findPressableAncestor(cta);
    expect(pressable).toBeTruthy();
    fireEvent.press(pressable);
  });

  it('pressing close calls onClose', async () => {
    const onClose = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <AdBanner title="Promo" description="Details" onClose={onClose} />
    );
    const stack: any[] = [utils.root];
    let pressable: any = null;
    while (stack.length) {
      const n = stack.pop();
      if (n?.props && typeof n.props.onPress === 'function') { pressable = n; break; }
      const children = (n?.children || []).slice().reverse();
      stack.push(...children);
    }
    expect(pressable).toBeTruthy();
    fireEvent.press(pressable);
    expect(onClose).toHaveBeenCalled();
  });
});

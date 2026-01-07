import React from 'react';
import PopupAd from '@/components/PopupAd';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';

function findPressableWithText(root: any, text: string): any | null {
  const stack: any[] = [root];
  let targetTextNode: any = null;
  while (stack.length) {
    const n = stack.pop();
    if (typeof n?.props?.children === 'string' && n.props.children === text) {
      targetTextNode = n; break;
    }
    if (n?.children) stack.push(...n.children);
  }
  if (!targetTextNode) return null;
  let cur = targetTextNode.parent;
  while (cur) {
    if (cur?.props && typeof cur.props.onPress === 'function') return cur;
    cur = cur.parent;
  }
  return null;
}

describe('PopupAd', () => {
  it('pressing Plus tard calls onClose', async () => {
    const onClose = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <PopupAd visible title="Titre" description="Desc" onClose={onClose} />
    );
    const pressable = findPressableWithText(utils.root, 'Plus tard');
    expect(pressable).toBeTruthy();
    fireEvent.press(pressable);
    expect(onClose).toHaveBeenCalled();
  });

  it('pressing CTA calls onCta and onClose', async () => {
    const onClose = jest.fn();
    const onCta = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <PopupAd visible title="Titre" description="Desc" onClose={onClose} onCta={onCta} />
    );
    const pressable = findPressableWithText(utils.root, 'Découvrir');
    fireEvent.press(pressable);
    expect(onCta).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});

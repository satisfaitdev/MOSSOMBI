import React from 'react';
import AdBanner from '@/components/AdBanner';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';
import { Linking } from 'react-native';

function findPressableAncestor(node: any): any | null {
  let cur: any = node;
  while (cur) {
    if (cur?.props && typeof cur.props.onPress === 'function') return cur;
    cur = cur.parent;
  }
  return null;
}

function findAllPressables(root: any): any[] {
  const res: any[] = [];
  const stack: any[] = [root];
  while (stack.length) {
    const n = stack.pop();
    if (n?.props && typeof n.props.onPress === 'function') res.push(n);
    if (n?.children) stack.push(...n.children);
  }
  return res;
}

describe('AdBanner (CTA & close)', () => {
  beforeEach(() => {
    jest.spyOn(Linking, 'openURL').mockResolvedValueOnce(undefined as any);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('ouvre l\'URL CTA quand ctaUrl est défini', async () => {
    const utils: any = await renderWithThemeAsync(
      <AdBanner title="T" description="D" ctaText="Go" ctaUrl="https://example.com" />
    );
    const ctaText = utils.getByText('Go');
    const ctaPressable = findPressableAncestor(ctaText);
    expect(ctaPressable).toBeTruthy();
    fireEvent.press(ctaPressable);
    expect(Linking.openURL).toHaveBeenCalledWith('https://example.com');
  });

  it('ferme la bannière quand on presse le bouton X et appelle onClose', async () => {
    const onClose = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <AdBanner title="T2" description="D2" onClose={onClose} />
    );
    const pressables = findAllPressables(utils.root);
    expect(pressables.length).toBeGreaterThan(0);
    // Presse chaque Pressable jusqu'à ce que onClose soit appelé
    for (const p of pressables) {
      fireEvent.press(p);
      if (onClose.mock.calls.length) break;
    }
    expect(onClose).toHaveBeenCalled();
  });
});

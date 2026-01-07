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

describe('AdBanner (CTA url)', () => {
  it('pressing CTA opens url', async () => {
    const openSpy = jest.spyOn(Linking, 'openURL').mockImplementation(async () => true as any);
    const url = 'https://example.com';
    const utils: any = await renderWithThemeAsync(
      <AdBanner title="Promo" description="Details" ctaText="Go" ctaUrl={url} />
    );
    const node = utils.getByText('Go') as any;
    const pressable = findPressableAncestor(node);
    fireEvent.press(pressable);
    expect(openSpy).toHaveBeenCalledWith(url);
    openSpy.mockRestore();
  });
});

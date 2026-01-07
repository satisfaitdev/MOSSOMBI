import React from 'react';
import MapView from '@/components/molecules/MapView';
import { renderWithThemeAsync } from '../test-utils';

function findWebViewNode(root: any): any | null {
  const stack: any[] = [root];
  while (stack.length) {
    const n = stack.pop();
    if (n?.props && typeof n.props.onMessage === 'function' && typeof n.props.onShouldStartLoadWithRequest === 'function') {
      return n;
    }
    if (n?.children) stack.push(...n.children);
  }
  return null;
}

describe('MapView (extra)', () => {
  const baseProps = {
    coords: { lat: 1, lng: 2 },
    onCoordsChange: jest.fn(),
    address: 'Adr',
    onAddressChange: jest.fn(),
    searchQuery: '',
    onSearchQueryChange: jest.fn(),
    searchResults: [],
    showSearchResults: false,
    onShowSearchResultsChange: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('onMessage(markerMoved) met à jour les coordonnées', async () => {
    const utils: any = await renderWithThemeAsync(<MapView {...baseProps} />);
    const web = findWebViewNode(utils.root);
    expect(web).toBeTruthy();

    web.props.onMessage({ nativeEvent: { data: JSON.stringify({ type: 'markerMoved', lat: 7.7, lng: 8.8 }) } });
    expect(baseProps.onCoordsChange).toHaveBeenCalledWith({ lat: 7.7, lng: 8.8 });
  });

  it('filtre onShouldStartLoadWithRequest', async () => {
    const utils: any = await renderWithThemeAsync(<MapView {...baseProps} />);
    const web = findWebViewNode(utils.root);

    const allowed = [
      'about:blank',
      'data:',
      'https://unpkg.com/foo',
      'https://a.tile.openstreetmap.org/1/2/3.png',
    ];
    const blocked = [
      'https://evil.com',
      'http://unpkg.com',
    ];

    for (const u of allowed) {
      expect(web.props.onShouldStartLoadWithRequest({ url: u })).toBe(true);
    }
    for (const u of blocked) {
      expect(web.props.onShouldStartLoadWithRequest({ url: u })).toBe(false);
    }
  });
});

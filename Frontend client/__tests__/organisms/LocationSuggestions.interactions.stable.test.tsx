jest.mock('react-native/Libraries/Modal/Modal', () => {
  const React = require('react');
  return ({ children }: any) => React.createElement(React.Fragment, null, children);
});

import React from 'react';
import { Text } from 'react-native';
import { renderWithThemeAsync, fireEvent } from '../test-utils';
import LocationSuggestions from '@/components/organisms/LocationSuggestions';

function findPressableAncestor(node: any): any | null {
  let cur: any = node;
  while (cur) {
    if (cur?.props && typeof cur.props.onPress === 'function') return cur;
    cur = cur.parent;
  }
  return null;
}

function findOverlayAncestor(node: any): any | null {
  let cur: any = node?.parent;
  while (cur) {
    if (cur?.props && typeof cur.props.onPress === 'function') return cur;
    cur = cur.parent;
  }
  return null;
}

describe.skip('LocationSuggestions (interactions stables via mock Modal sous-module)', () => {
  it('sélectionne un item et ferme via overlay', async () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    const suggestions = [
      { title: 'Ville A', subtitle: 'A1', description: 'Pays A' },
      { title: 'Ville B', subtitle: 'B1', description: 'Pays B' },
    ];

    const utils: any = await renderWithThemeAsync(
      <LocationSuggestions
        visible
        suggestions={suggestions as any}
        onSelect={onSelect}
        onClose={onClose}
        position={{ top: 10, left: 10, right: 10 }}
        renderItem={(it: any) => <Text>{it.title}</Text>}
      />
    );

    const itemText = utils.getByText('Ville A') as any;
    const itemPressable = findPressableAncestor(itemText);
    expect(itemPressable).toBeTruthy();
    fireEvent.press(itemPressable);
    expect(onSelect).toHaveBeenCalledWith(suggestions[0]);

    const overlay = findOverlayAncestor(itemPressable);
    expect(overlay).toBeTruthy();
    fireEvent.press(overlay);
    expect(onClose).toHaveBeenCalled();
  });
});

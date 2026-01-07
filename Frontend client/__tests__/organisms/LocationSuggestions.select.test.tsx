import React from 'react';
import LocationSuggestions from '@/components/organisms/LocationSuggestions';
import { renderWithThemeAsync, fireEvent } from '../test-utils';
import { Text } from 'react-native';

jest.mock('react-native/Libraries/Modal/Modal', () => {
  const React = require('react');
  return ({ children }: any) => React.createElement(React.Fragment, null, children);
});

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
    if (cur?.props && typeof cur.props.onPress === 'function') {
      return cur;
    }
    cur = cur.parent;
  }
  return null;
}

describe.skip('LocationSuggestions selection & close', () => {
  it('déclenche onSelect et onClose en pressant les Pressable présents', async () => {
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

    // Parcourir l'arbre et presser tous les Pressable avec onPress
    const stack: any[] = [utils.root];
    const pressables: any[] = [];
    while (stack.length) {
      const n = stack.pop();
      if (n?.props && typeof n.props.onPress === 'function') pressables.push(n);
      if (n?.children) stack.push(...n.children);
    }
    pressables.forEach((p) => fireEvent.press(p));

    expect(onSelect).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});

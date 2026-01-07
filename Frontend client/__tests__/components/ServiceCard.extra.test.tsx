import React from 'react';
import ServiceCard from '@/components/ServiceCard';
import { renderWithThemeAsync } from '../test-utils';
import { Text } from 'react-native';

function findPressableAncestor(node: any): any | null {
  let cur: any = node;
  while (cur) {
    if (cur?.props && typeof cur.props.onPress === 'function') return cur;
    cur = cur.parent;
  }
  return null;
}

describe('ServiceCard (extra branches)', () => {
  it('rend le badge et évalue la branche pressed du style', async () => {
    const onPress = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <ServiceCard title="Wifi" icon={<Text>Icon</Text>} badge="Nouveau" onPress={onPress} />
    );
    expect(utils.getByText('Nouveau')).toBeTruthy();

    const titleNode = utils.getByText('Wifi') as any;
    const pressable = findPressableAncestor(titleNode);
    expect(pressable).toBeTruthy();
    // Force l'évaluation de la branche pressed ? 0.7 : 1
    const styleFn = pressable.props.style as (s: { pressed: boolean }) => any;
    if (typeof styleFn === 'function') {
      styleFn({ pressed: true });
    }
  });
});

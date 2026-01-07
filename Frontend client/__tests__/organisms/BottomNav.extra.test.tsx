import React from 'react';
import BottomNav from '@/components/organisms/BottomNav';
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

describe('BottomNav (extra tabs)', () => {
  it('pressing Commandes pushes /orders', async () => {
    const expoRouter: any = require('expo-router');
    const router = expoRouter.useRouter();

    const utils: any = await renderWithThemeAsync(<BottomNav />);
    const txt = utils.getByText('Commandes') as any;
    const pressable = findPressableAncestor(txt);
    fireEvent.press(pressable);
    expect(router.push).toHaveBeenCalledWith('/orders');
  });

  it('pressing Profil pushes /profile', async () => {
    const expoRouter: any = require('expo-router');
    const router = expoRouter.useRouter();

    const utils: any = await renderWithThemeAsync(<BottomNav />);
    const txt = utils.getByText('Profil') as any;
    const pressable = findPressableAncestor(txt);
    fireEvent.press(pressable);
    expect(router.push).toHaveBeenCalledWith('/profile');
  });
});

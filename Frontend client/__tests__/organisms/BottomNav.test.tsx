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

describe('BottomNav', () => {
  it('pressing Services tab pushes /services', async () => {
    const expoRouter: any = require('expo-router');
    const router = expoRouter.useRouter();

    const utils: any = await renderWithThemeAsync(<BottomNav />);
    const txt = utils.getByText('Services') as any;
    const pressable = findPressableAncestor(txt);
    expect(pressable).toBeTruthy();
    fireEvent.press(pressable);
    expect(router.push).toHaveBeenCalledWith('/services');
  });
});

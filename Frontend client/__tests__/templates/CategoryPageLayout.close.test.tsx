import React from 'react';
import CategoryPageLayout from '@/components/templates/CategoryPageLayout';
import { renderWithThemeAsync } from '../test-utils';
import { Text, Animated } from 'react-native';
import { fireEvent } from '@testing-library/react-native';

function findPressables(root: any): any[] {
  const res: any[] = [];
  const stack: any[] = [root];
  while (stack.length) {
    const n = stack.pop();
    if (n?.props && typeof n.props.onPress === 'function') res.push(n);
    if (n?.children) stack.push(...n.children);
  }
  return res;
}

describe('CategoryPageLayout (fermeture)', () => {
  it('appelle router.back via backdrop et bouton X', async () => {
    jest.spyOn(Animated, 'spring').mockReturnValue({ start: jest.fn() } as any);
    const expoRouter: any = require('expo-router');
    const router = expoRouter.useRouter();

    const utils: any = await renderWithThemeAsync(
      <CategoryPageLayout title="Catégories">
        <Text>Child</Text>
      </CategoryPageLayout>
    );

    const pressables = findPressables(utils.root);
    expect(pressables.length).toBeGreaterThanOrEqual(2);

    // 1) Backdrop
    fireEvent.press(pressables[0]);
    // 2) Bouton X
    fireEvent.press(pressables[1]);

    expect(router.back).toHaveBeenCalledTimes(2);
  });
});

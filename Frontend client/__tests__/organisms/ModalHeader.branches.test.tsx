import React from 'react';
import ModalHeader from '@/components/organisms/ModalHeader';
import { renderWithThemeAsync, fireEvent } from '../test-utils';

function pressFirstPressable(root: any) {
  const stack: any[] = [root];
  while (stack.length) {
    const n = stack.pop();
    if (n?.props && typeof n.props.onPress === 'function') return n;
    if (n?.children) stack.push(...n.children);
  }
  return null;
}

describe('ModalHeader (branches)', () => {
  it('fermeture et variations de titleSize/paddingBottom', async () => {
    const onClose = jest.fn();

    const utilsSm: any = await renderWithThemeAsync(
      <ModalHeader title="Titre" onClose={onClose} titleSize="sm" paddingBottom="xs" />
    );
    expect(utilsSm.getByText('Titre')).toBeTruthy();
    fireEvent.press(pressFirstPressable(utilsSm.root));

    const utilsMd: any = await renderWithThemeAsync(
      <ModalHeader title="Titre" onClose={onClose} titleSize="md" paddingBottom="md" />
    );
    fireEvent.press(pressFirstPressable(utilsMd.root));

    const utilsLg: any = await renderWithThemeAsync(
      <ModalHeader title="Titre" onClose={onClose} titleSize="lg" paddingBottom="lg" />
    );
    fireEvent.press(pressFirstPressable(utilsLg.root));

    expect(onClose).toHaveBeenCalledTimes(3);
  });
});

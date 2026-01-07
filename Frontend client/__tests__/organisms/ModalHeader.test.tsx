import React from 'react';
import ModalHeader from '@/components/organisms/ModalHeader';
import { renderWithThemeAsync } from '../test-utils';
import { Animated } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';

describe('ModalHeader', () => {
  it('renders title and triggers onClose when pressing close button', async () => {
    const onClose = jest.fn();
    jest.spyOn(Animated, 'parallel').mockReturnValue({ start: (cb?: any) => cb && cb() } as any);
    const utils: any = await renderWithThemeAsync(
      <ModalHeader title="Titre" onClose={onClose} animateOnMount />
    );
    expect(utils.getByText('Titre')).toBeTruthy();

    const inst: any = utils.root;
    let target: any = null;
    const stack: any[] = [inst];
    while (stack.length) {
      const node = stack.pop();
      if (node?.props && typeof node.props.onPress === 'function') { target = node; break; }
      if (node?.children) stack.push(...node.children);
    }
    expect(target).toBeTruthy();
    fireEvent.press(target);
    expect(onClose).toHaveBeenCalled();
  });
});

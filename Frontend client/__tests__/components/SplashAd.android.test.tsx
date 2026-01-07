import React from 'react';
import SplashAd from '@/components/SplashAd';
import { renderWithThemeAsync } from '../test-utils';
import { act, fireEvent } from '@testing-library/react-native';
import { Platform } from 'react-native';

function findFirstPressableWithOnPress(root: any): any | null {
  const stack: any[] = [root];
  while (stack.length) {
    const node = stack.pop();
    if (node?.props && typeof node.props.onPress === 'function') return node;
    if (node?.children) stack.push(...node.children);
  }
  return null;
}

describe('SplashAd (Android NavigationBar)', () => {
  const realOS = Platform.OS;
  beforeEach(() => {
    jest.useFakeTimers();
    Object.defineProperty(Platform, 'OS', { value: 'android' });
  });
  afterEach(() => {
    jest.useRealTimers();
    Object.defineProperty(Platform, 'OS', { value: realOS });
    jest.clearAllMocks();
  });

  it('appelle NavigationBar.setButtonStyleAsync("light") au montage puis "dark" à la fermeture', async () => {
    const navBar = require('expo-navigation-bar');
    const onClose = jest.fn();

    const utils: any = await renderWithThemeAsync(
      <SplashAd visible title="Titre" description="Desc" duration={1} onClose={onClose} />
    );

    expect(navBar.setButtonStyleAsync).toHaveBeenCalledWith('light');

    // Laisser le compte à rebours atteindre 0 pour afficher le bouton de fermeture
    act(() => {
      jest.advanceTimersByTime(1100);
    });

    const closeButton = findFirstPressableWithOnPress(utils.root);
    expect(closeButton).toBeTruthy();
    fireEvent.press(closeButton);
    expect(navBar.setButtonStyleAsync).toHaveBeenCalledWith('dark');
    expect(onClose).toHaveBeenCalled();
  });
});

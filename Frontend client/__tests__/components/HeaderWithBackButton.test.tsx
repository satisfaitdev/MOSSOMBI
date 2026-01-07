import React from 'react';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import { renderWithThemeAsync } from '../test-utils';
import { Platform, Text } from 'react-native';

// Helper to traverse tree and find the first node with onPress
function findFirstPressableWithOnPress(root: any): any | null {
  const stack: any[] = [root];
  while (stack.length) {
    const node = stack.pop();
    if (node?.props && typeof node.props.onPress === 'function') return node;
    if (node?.children) stack.push(...node.children);
  }
  return null;
}

describe('HeaderWithBackButton', () => {
  const originalOS = Platform.OS;
  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: originalOS });
    jest.restoreAllMocks();
  });

  it('iOS branch: renders Stack.Screen with proper options', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios' });
    const expoRouter: any = require('expo-router');
    const screenSpy = jest.spyOn(expoRouter.Stack, 'Screen');

    await renderWithThemeAsync(
      <HeaderWithBackButton title="Titre" rightButton={<Text>RB</Text>} />
    );

    expect(screenSpy).toHaveBeenCalled();
    const props: any = screenSpy.mock.calls[0][0];
    expect(props.options.headerShown).toBe(true);
    expect(typeof props.options.headerLeft).toBe('function');
    expect(typeof props.options.headerRight).toBe('function');
  });

  it('Android branch: renders custom header and triggers onBack', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'android' });
    const onBack = jest.fn();
    const expoRouter: any = require('expo-router');
    const screenSpy = jest.spyOn(expoRouter.Stack, 'Screen');

    const utils: any = await renderWithThemeAsync(
      <HeaderWithBackButton title="Titre" onBack={onBack} rightButton={<Text>RB</Text>} />
    );

    // Assert Stack.Screen called with headerShown: false on Android
    expect(screenSpy).toHaveBeenCalled();
    const props: any = screenSpy.mock.calls[0][0];
    expect(props.options.headerShown).toBe(false);

    const pressable = findFirstPressableWithOnPress(utils.root);
    expect(pressable).toBeTruthy();
    // Simulate press
    // @ts-ignore testing-library event
    const { fireEvent } = require('@testing-library/react-native');
    fireEvent.press(pressable);
    expect(onBack).toHaveBeenCalled();
  });
});

import React from 'react';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import { renderWithThemeAsync } from '../test-utils';
import { Platform, Text } from 'react-native';

describe('HeaderWithBackButton (iOS extra)', () => {
  const realOS = Platform.OS;
  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: realOS });
    jest.restoreAllMocks();
  });

  it('headerLeft press calls router.back on iOS', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios' });
    const expoRouter: any = require('expo-router');
    const router = expoRouter.useRouter();
    const screenSpy = jest.spyOn(expoRouter.Stack, 'Screen');

    await renderWithThemeAsync(
      <HeaderWithBackButton title="Titre" rightButton={<Text>RB</Text>} />
    );

    const props: any = screenSpy.mock.calls[0][0];
    const leftEl = props.options.headerLeft();
    leftEl.props.onPress();
    expect(router.back).toHaveBeenCalled();
  });
});

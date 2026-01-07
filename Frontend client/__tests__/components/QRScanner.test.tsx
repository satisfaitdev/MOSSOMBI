import React from 'react';
import QRScanner from '@/components/QRScanner';
import { renderWithThemeAsync } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';

jest.mock('expo-camera', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    CameraView: (props: any) => React.createElement(View, props, props.children),
    useCameraPermissions: jest.fn(() => [{ granted: false }, jest.fn()]),
  };
});

describe('QRScanner', () => {
  it('permission modal: pressing Annuler calls onClose', async () => {
    const onClose = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <QRScanner visible onClose={onClose} onScan={() => {}} />
    );

    const cancel = utils.getByText('Annuler');
    fireEvent.press(cancel);
    expect(onClose).toHaveBeenCalled();
  });
});

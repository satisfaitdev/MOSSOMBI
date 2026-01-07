import React from 'react';
import QRScanner from '@/components/QRScanner';
import { renderWithThemeAsync } from '../test-utils';
import { act } from '@testing-library/react-native';

jest.useFakeTimers();

jest.mock('expo-camera', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    CameraView: (props: any) => React.createElement(View, props, props.children),
    useCameraPermissions: jest.fn(() => [{ granted: true }, jest.fn()]),
  };
});

describe('QRScanner (granted)', () => {
  it('onBarcodeScanned triggers onScan and closes after delay', async () => {
    const onClose = jest.fn();
    const onScan = jest.fn();
    const utils: any = await renderWithThemeAsync(
      <QRScanner visible onClose={onClose} onScan={onScan} />
    );

    // Find the CameraView proxy by locating a node that has onBarcodeScanned prop
    const stack: any[] = [utils.root];
    let cameraNode: any = null;
    while (stack.length) {
      const n = stack.pop();
      if (n?.props && 'onBarcodeScanned' in n.props) { cameraNode = n; break; }
      if (n?.children) stack.push(...n.children);
    }

    expect(cameraNode).toBeTruthy();
    act(() => {
      cameraNode.props.onBarcodeScanned({ data: 'HELLO' });
    });

    expect(onScan).toHaveBeenCalledWith('HELLO');

    await act(async () => {
      jest.advanceTimersByTime(600);
    });

    expect(onClose).toHaveBeenCalled();
  });
});

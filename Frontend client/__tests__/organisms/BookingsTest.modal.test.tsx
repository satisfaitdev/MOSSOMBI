import React from 'react';
import BookingsTest from '@/components/organisms/BookingsTest';
import { renderWithThemeAsync, fireEvent } from '../test-utils';

function findPressableAncestor(node: any): any | null {
  let cur: any = node;
  while (cur) {
    if (cur?.props && typeof cur.props.onPress === 'function') return cur;
    cur = cur.parent;
  }
  return null;
}

// Mock BookingModal pour forcer visible=true et tester les callbacks
jest.mock('@/components/organisms/BookingModal', () => {
  return function MockBookingModal({ onClose, onConfirm, ...props }: any) {
    const React = require('react');
    const { View, Text, Pressable } = require('react-native');
    
    return (
      <View>
        <Text>Mock Booking Modal</Text>
        <Pressable onPress={onClose}>
          <Text>Close</Text>
        </Pressable>
        <Pressable onPress={onConfirm}>
          <Text>Confirm</Text>
        </Pressable>
      </View>
    );
  };
});

describe('BookingsTest (modal callbacks FNDA:0)', () => {
  it('couvre les callbacks onClose et onConfirm du BookingModal (lignes 22-23)', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    try {
      const utils: any = await renderWithThemeAsync(<BookingsTest />);

      // 1. Tester onClose callback (ligne 22)
      const closeButton = utils.getByText('Close') as any;
      fireEvent.press(findPressableAncestor(closeButton));
      expect(consoleSpy).toHaveBeenCalledWith('Modal closed');

      // 2. Tester onConfirm callback (ligne 23)
      const confirmButton = utils.getByText('Confirm') as any;
      fireEvent.press(findPressableAncestor(confirmButton));
      expect(consoleSpy).toHaveBeenCalledWith('Booking confirmed');

    } finally {
      consoleSpy.mockRestore();
    }
  });
});

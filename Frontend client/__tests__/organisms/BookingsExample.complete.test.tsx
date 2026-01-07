import React from 'react';
import BookingsExample from '@/components/organisms/BookingsExample';
import { renderWithThemeAsync, fireEvent } from '../test-utils';

function findPressableAncestor(node: any): any | null {
  let cur: any = node;
  while (cur) {
    if (cur?.props && typeof cur.props.onPress === 'function') return cur;
    cur = cur.parent;
  }
  return null;
}

// Mock BookingResultCard pour exposer les callbacks onPress et onBook
jest.mock('@/components/organisms/BookingResultCard', () => {
  return function MockBookingResultCard({ onPress, onBook, title }: any) {
    const React = require('react');
    const { View, Text, Pressable } = require('react-native');
    
    return (
      <View>
        <Text>{title}</Text>
        <Pressable onPress={onPress}>
          <Text>Press Card</Text>
        </Pressable>
        <Pressable onPress={onBook}>
          <Text>Book Now</Text>
        </Pressable>
      </View>
    );
  };
});

// Mock BookingModal pour exposer onClose et onConfirm
jest.mock('@/components/organisms/BookingModal', () => {
  return function MockBookingModal({ visible, onClose, onConfirm }: any) {
    const React = require('react');
    const { View, Text, Pressable } = require('react-native');
    
    if (!visible) return null;
    
    return (
      <View>
        <Text>Booking Modal</Text>
        <Pressable onPress={onClose}>
          <Text>Close Modal</Text>
        </Pressable>
        <Pressable onPress={onConfirm}>
          <Text>Confirm Booking</Text>
        </Pressable>
      </View>
    );
  };
});

// Mock SearchLayout pour forcer le rendu avec des résultats
jest.mock('@/components/templates/SearchLayout', () => {
  return function MockSearchLayout({ results, renderItem, emptyState }: any) {
    const React = require('react');
    const { View } = require('react-native');
    
    // Simuler des résultats pour déclencher renderItem
    const mockResults = [
      { name: 'Hôtel Test', location: 'Kinshasa', available: true, rating: 4.5, reviews: 100, price: 150000 }
    ];
    
    return (
      <View>
        {mockResults.map((item, index) => (
          <View key={index}>
            {renderItem(item)}
          </View>
        ))}
        {mockResults.length === 0 && emptyState}
      </View>
    );
  };
});

describe('BookingsExample (100% FNDA coverage)', () => {
  it('couvre TOUS les callbacks FNDA:0: onPress, onBook, modal callbacks', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    try {
      const utils: any = await renderWithThemeAsync(<BookingsExample />);

      // 1. Callback onPress de BookingResultCard (ligne 48)
      const pressCardButton = utils.getByText('Press Card');
      fireEvent.press(findPressableAncestor(pressCardButton));
      expect(consoleSpy).toHaveBeenCalledWith('Card pressed');

      // 2. Callback onBook de BookingResultCard (ligne 49)
      const bookNowButton = utils.getByText('Book Now');
      fireEvent.press(findPressableAncestor(bookNowButton));
      // Ceci devrait ouvrir le modal

      // 3. Vérifier que le modal est maintenant visible
      const modalText = utils.queryByText('Booking Modal');
      expect(modalText).toBeTruthy();

      // 4. Callback onClose du BookingModal (ligne 86)
      const closeModalButton = utils.getByText('Close Modal');
      fireEvent.press(findPressableAncestor(closeModalButton));

      // 5. Rouvrir le modal pour tester onConfirm
      fireEvent.press(findPressableAncestor(bookNowButton));
      
      // 6. Callback onConfirm du BookingModal (ligne 87-89)
      const confirmBookingButton = utils.getByText('Confirm Booking');
      fireEvent.press(findPressableAncestor(confirmBookingButton));
      expect(consoleSpy).toHaveBeenCalledWith('Booking confirmed');

    } finally {
      consoleSpy.mockRestore();
    }
  });
});

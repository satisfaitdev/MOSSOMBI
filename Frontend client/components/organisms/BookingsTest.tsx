/**
 * TEST DES NOUVEAUX COMPOSANTS BOOKINGS
 *
 * Ce fichier teste que les composants réutilisables fonctionnent correctement
 * avec les pages de réservation existantes.
 */

import React from 'react';
import { View } from 'react-native';
import BookingModal from './BookingModal';
import BookingResultCard from './BookingResultCard';
import { useTheme } from '@/contexts/ThemeContext';

// Test component pour valider les imports et l'utilisation
export default function BookingsTest() {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}>
      {/* Test BookingModal */}
      <BookingModal
        visible={false}
        onClose={() => console.log('Modal closed')}
        onConfirm={() => console.log('Booking confirmed')}
        title="Test Booking"
        serviceName="Test Service"
        serviceDetails="Test details"
        totalPrice={1000}
        currency="CDF"
        fields={[
          { key: 'name', label: 'Nom', placeholder: 'Votre nom', required: true },
          { key: 'email', label: 'Email', placeholder: 'email@test.com', required: true, keyboardType: 'email-address' }
        ]}
      />

      {/* Test BookingResultCard */}
      <BookingResultCard
        title="Test Hotel"
        subtitle="Test Location"
        rating={4.5}
        reviewCount={100}
        price={50000}
        currency="CDF"
        badges={['WiFi', 'Pool']}
        features={[]}
        availability={{ status: 'available', text: 'Available' }}
        onPress={() => console.log('Card pressed')}
        onBook={() => console.log('Book pressed')}
      />
    </View>
  );
}

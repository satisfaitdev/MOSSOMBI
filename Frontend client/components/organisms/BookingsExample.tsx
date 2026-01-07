/**
 * EXEMPLE D'UTILISATION DES COMPOSANTS BOOKINGS RÉUTILISABLES
 *
 * Montre comment utiliser les nouveaux composants réutilisables
 * pour créer des pages de réservation cohérentes et maintenables.
 */

import React, { useState } from 'react';
import { View } from 'react-native';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import SearchLayout from '@/components/templates/SearchLayout';
import BookingModal from './BookingModal';
import BookingResultCard from './BookingResultCard';
import TripTypeFilters from './TripTypeFilters';
import ClassFilters from './ClassFilters';
import { SearchBar, DatePicker, Counter, EmptyState } from '@/components/molecules';
import { Stack } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';

export default function BookingExample() {
  const { colors } = useTheme();
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Exemple d'utilisation de BookingModal
  const bookingModalFields = [
    { key: 'name', label: 'Nom complet', placeholder: 'Votre nom', required: true },
    { key: 'email', label: 'Email', placeholder: 'votre@email.com', required: true, keyboardType: 'email-address' as const },
    { key: 'phone', label: 'Téléphone', placeholder: '+243...', required: true, variant: 'phone' as const },
    { key: 'requests', label: 'Demandes spéciales', placeholder: 'Demandes particulières...', variant: 'textarea' as const }
  ];

  // Exemple d'utilisation de BookingResultCard
  const renderBookingCard = (item: any) => (
    <BookingResultCard
      title={item.name}
      subtitle={item.location}
      rating={item.rating}
      reviewCount={item.reviews}
      price={item.price}
      currency="CDF"
      compareAtPrice={item.compareAtPrice}
      badges={item.amenities || []}
      features={[
        { icon: require('lucide-react-native').Users, label: `${item.maxGuests} invités` },
        { icon: require('lucide-react-native').MapPin, label: item.district }
      ]}
      availability={{
        status: item.available ? 'available' : 'unavailable',
        text: item.available ? 'Disponible' : 'Complet'
      }}
      onPress={() => console.log('Card pressed')}
      onBook={() => setShowBookingModal(true)}
    />
  );

  // Exemple d'utilisation de TripTypeFilters
  const tripTypeFilters = (
    <TripTypeFilters
      tripType="one-way"
      onTripTypeChange={(type) => console.log('Trip type changed:', type)}
      labels={{
        oneWay: 'Aller simple',
        roundTrip: 'Aller-retour'
      }}
    />
  );

  // Exemple d'utilisation de ClassFilters
  const classFilters = (
    <ClassFilters
      selectedClass="economy"
      onClassChange={(classId) => console.log('Class changed:', classId)}
      classes={[
        { id: 'economy', label: 'Économique', description: 'Confort standard' },
        { id: 'business', label: 'Affaires', description: 'Confort supérieur' },
        { id: 'first', label: 'Première', description: 'Luxe maximum' }
      ]}
      title="Classe de service"
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <HeaderWithBackButton title="Réservation Hôtel" />

      {/* Exemple de modal de réservation */}
      <BookingModal
        visible={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onConfirm={() => {
          setShowBookingModal(false);
          console.log('Booking confirmed');
        }}
        title="Confirmer la réservation"
        serviceName="Hôtel Memling"
        serviceDetails="Suite Deluxe • 2 nuits • 3 invités"
        totalPrice={360000}
        currency="CDF"
        fields={bookingModalFields}
      />

      {/* Layout de recherche avec tous les composants */}
      <SearchLayout
        searchBar={
          <SearchBar
            value=""
            onChange={() => {}}
            placeholder="Rechercher un hôtel..."
          />
        }
        topFilters={tripTypeFilters}
        filters={
          <Stack spacing="md">
            <DatePicker mode="range" label="Dates de séjour" />
            <Counter value={2} onChange={() => {}} label="Invités" />
            {classFilters}
          </Stack>
        }
        results={[]}
        renderItem={renderBookingCard}
        emptyState={
          <EmptyState
            title="Aucun hôtel trouvé"
            message="Modifiez vos critères de recherche"
            actionLabel="Réinitialiser"
            onAction={() => {}}
          />
        }
      />
    </View>
  );
}

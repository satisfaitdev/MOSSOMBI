/**
 * TEST DE MIGRATION - VERSION SIMPLIFIÉE DE HOTEL.TSX
 *
 * Cette version teste les nouveaux composants BookingModal et BookingResultCard
 * avec une structure simplifiée pour valider que tout fonctionne.
 */

import React, { useState } from 'react';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import { SearchLayout } from '@/components/templates';
import { BookingModal, BookingResultCard } from '@/components/organisms';
import { SearchBar, DatePicker, Counter, EmptyState } from '@/components/molecules';
import { useTheme } from '@/contexts/ThemeContext';
import { MapPin, Users } from 'lucide-react-native';

// Données de test simplifiées
const TEST_ACCOMMODATIONS = [
  {
    id: '1',
    name: 'Hôtel Memling',
    location: 'Boulevard du 30 Juin',
    district: 'Gombe',
    price: 180000,
    rating: 4.8,
    reviews: 124,
    maxGuests: 4,
    amenities: ['WiFi', 'Piscine', 'Restaurant', 'Spa'],
    available: true,
  },
  {
    id: '2',
    name: 'Villa Moderne',
    location: 'Avenue Tombalbaye',
    district: 'Gombe',
    price: 250000,
    rating: 4.9,
    reviews: 89,
    maxGuests: 8,
    amenities: ['WiFi', 'Jardin', 'Parking', 'Cuisine'],
    available: true,
  },
];

export default function HotelTest() {
  const { colors } = useTheme();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedAccommodation, setSelectedAccommodation] = useState(TEST_ACCOMMODATIONS[0]);

  // Calcul du prix total (simplifié)
  const calculateTotal = () => {
    return selectedAccommodation.price * 2; // 2 nuits par défaut
  };

  // Composant de recherche simplifié
  const renderSearchBar = () => (
    <SearchBar
      value=""
      onChange={() => {}}
      placeholder="Rechercher un hôtel..."
    />
  );

  // Composant de filtres simplifié
  const renderFilters = () => (
    <DatePicker mode="range" label="Dates de séjour" />
  );

  // Composant de carte simplifié avec les nouveaux composants
  const renderAccommodationCard = (accommodation: typeof TEST_ACCOMMODATIONS[0]) => (
    <BookingResultCard
      title={accommodation.name}
      subtitle={`${accommodation.location}, ${accommodation.district}`}
      rating={accommodation.rating}
      reviewCount={accommodation.reviews}
      price={accommodation.price}
      currency="CDF"
      badges={accommodation.amenities}
      features={[
        { icon: Users, label: `${accommodation.maxGuests} invités max` },
        { icon: MapPin, label: accommodation.district }
      ]}
      availability={{
        status: accommodation.available ? 'available' : 'unavailable',
        text: accommodation.available ? 'Disponible' : 'Complet'
      }}
      onPress={() => console.log('Hôtel sélectionné:', accommodation.name)}
      onBook={() => {
        setSelectedAccommodation(accommodation);
        setShowBookingModal(true);
      }}
    />
  );

  // Modal de réservation avec les nouveaux composants
  const renderBookingModal = () => (
    <BookingModal
      visible={showBookingModal}
      onClose={() => setShowBookingModal(false)}
      onConfirm={() => {
        setShowBookingModal(false);
        console.log('Réservation confirmée pour:', selectedAccommodation.name);
      }}
      title="Confirmer la réservation"
      serviceName={selectedAccommodation.name}
      serviceDetails={`${selectedAccommodation.district} • 2 nuits`}
      totalPrice={calculateTotal()}
      currency="CDF"
      fields={[
        { key: 'name', label: 'Nom complet', placeholder: 'Votre nom', required: true },
        { key: 'email', label: 'Email', placeholder: 'votre@email.com', required: true, keyboardType: 'email-address' },
        { key: 'phone', label: 'Téléphone', placeholder: '+243...', required: true, variant: 'phone' },
        { key: 'requests', label: 'Demandes spéciales', placeholder: 'Demandes particulières...', variant: 'textarea' }
      ]}
      submitLabel="Confirmer"
      size="lg"
    />
  );

  return (
    <>
      <HeaderWithBackButton title="Hébergement (Test)" />
      <SearchLayout
        searchBar={renderSearchBar()}
        filters={renderFilters()}
        results={TEST_ACCOMMODATIONS}
        renderItem={renderAccommodationCard}
        emptyState={
          <EmptyState
            title="Aucun hôtel trouvé"
            message="Essayez de modifier vos critères"
            actionLabel="Réinitialiser"
            onAction={() => console.log('Réinitialiser')}
          />
        }
      />
      {renderBookingModal()}
    </>
  );
}

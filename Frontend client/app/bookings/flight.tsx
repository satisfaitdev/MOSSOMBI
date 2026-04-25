import React, { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Plane, Users, Clock } from 'lucide-react-native';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants/colors';

import { Heading, Body, Caption, Badge } from '@/components/atoms';
import { Section, Stack, Row } from '@/components/ui';
import { SuccessModal } from '@/components/organisms/modals';
import { SearchBar, DatePicker, Counter, RatingDisplay, PriceDisplay, EmptyState } from '@/components/molecules';
import { SearchLayout } from '@/components/templates';
import { BookingModal, BookingResultCard, TripTypeFilters, ClassFilters } from '@/components/organisms';
import Button from '@/components/Button';
import GradientBackground from '@/components/atoms/GradientBackground';

interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  departure: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  compareAtPrice?: number;
  class: 'economy' | 'business' | 'first';
  availableSeats: number;
  aircraft: string;
  rating: number;
  reviews: number;
}

const FLIGHTS: Flight[] = [
  {
    id: '1',
    airline: 'Air Congo',
    flightNumber: 'AC101',
    departure: 'Kinshasa (FIH)',
    destination: 'Lubumbashi (FBM)',
    departureTime: '08:00',
    arrivalTime: '10:30',
    duration: '2h 30m',
    price: 250000,
    compareAtPrice: 300000,
    class: 'economy',
    availableSeats: 12,
    aircraft: 'Boeing 737',
    rating: 4.5,
    reviews: 89,
  },
  {
    id: '2',
    airline: 'Congo Airways',
    flightNumber: 'CW202',
    departure: 'Kinshasa (FIH)',
    destination: 'Goma (GOM)',
    departureTime: '12:00',
    arrivalTime: '14:15',
    duration: '2h 15m',
    price: 180000,
    class: 'economy',
    availableSeats: 8,
    aircraft: 'Airbus A320',
    rating: 4.2,
    reviews: 56,
  },
  {
    id: '3',
    airline: 'Ethiopian Airlines',
    flightNumber: 'ET551',
    departure: 'Kinshasa (FIH)',
    destination: 'Addis-Abeba (ADD)',
    departureTime: '23:30',
    arrivalTime: '06:45+1',
    duration: '5h 15m',
    price: 850000,
    compareAtPrice: 950000,
    class: 'business',
    availableSeats: 4,
    aircraft: 'Boeing 787',
    rating: 4.8,
    reviews: 234,
  },
];

export default function FlightBookingScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [departure, setDeparture] = useState('Kinshasa (FIH)');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState<Date | undefined>();
  const [returnDate, setReturnDate] = useState<Date | undefined>();
  const [passengers, setPassengers] = useState(1);
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('one-way');
  const [flightClass, setFlightClass] = useState<'economy' | 'business' | 'first'>('economy');
  
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const suggestions = useMemo(() => [
    'Kinshasa (FIH)', 'Lubumbashi (FBM)', 'Goma (GOM)', 'Kisangani (FKI)',
    'Addis-Abeba (ADD)', 'Paris (CDG)', 'Bruxelles (BRU)',
  ], []);

  const filteredFlights = useMemo(() => {
    let filtered = FLIGHTS;
    
    if (searchQuery) {
      filtered = filtered.filter(f =>
        f.airline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.departure.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.destination.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (destination) {
      filtered = filtered.filter(f => f.destination.includes(destination));
    }

    if (flightClass !== 'economy') {
      filtered = filtered.filter(f => f.class === flightClass);
    }

    return filtered;
  }, [searchQuery, destination, flightClass]);

  const handleSearch = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleBookFlight = (flight: Flight) => {
    setSelectedFlight(flight);
    setShowBookingModal(true);
  };

  const handleConfirmBooking = () => {
    setShowBookingModal(false);
    setShowSuccessModal(true);
  };

  const renderSearchBar = () => (
    <SearchBar
      value={searchQuery}
      onChange={setSearchQuery}
      suggestions={suggestions.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)}
      onSelectSuggestion={setSearchQuery}
      showSuggestions={searchQuery.length >= 2}
      placeholder="Rechercher une destination..."
    />
  );

  const renderTopFilters = () => (
    <TripTypeFilters
      tripType={tripType}
      onTripTypeChange={setTripType}
      labels={{
        oneWay: 'Aller simple',
        roundTrip: 'Aller-retour'
      }}
    />
  );

  const renderFilters = () => (
    <Stack spacing="md">
      <DatePicker
        mode={tripType === 'round-trip' ? 'range' : 'single'}
        value={departureDate}
        startDate={departureDate}
        endDate={returnDate}
        onChange={setDepartureDate}
        onRangeChange={(start, end) => {
          setDepartureDate(start);
          setReturnDate(end);
        }}
        label={tripType === 'round-trip' ? 'Dates de voyage' : 'Date de départ'}
        minDate={new Date()}
      />

      <Counter
        value={passengers}
        onChange={setPassengers}
        min={1}
        max={9}
        label="Passagers"
      />

      <ClassFilters
        selectedClass={flightClass}
        onClassChange={(classId) => setFlightClass(classId as 'economy' | 'business' | 'first')}
        classes={[
          { id: 'economy', label: 'Économique', description: 'Confort standard' },
          { id: 'business', label: 'Affaires', description: 'Confort supérieur' },
          { id: 'first', label: 'Première', description: 'Luxe maximum' }
        ]}
        title="Classe de service"
      />

      <Button
        title="Rechercher des vols"
        onPress={handleSearch}
        variant="gradient"
        size="lg"
        fullWidth
        loading={isLoading}
      />
    </Stack>
  );

  const renderFlightCard = (flight: Flight) => (
    <BookingResultCard
      title={`${flight.airline} ${flight.flightNumber}`}
      subtitle={`${flight.departure} → ${flight.destination}`}
      rating={flight.rating}
      reviewCount={flight.reviews}
      price={flight.price}
      currency="CDF"
      compareAtPrice={flight.compareAtPrice}
      badges={[flight.class, flight.aircraft]}
      features={[
        { icon: Clock, label: flight.duration },
        { icon: Users, label: `${flight.availableSeats} places` }
      ]}
      availability={{
        status: flight.availableSeats > 5 ? 'available' : flight.availableSeats > 0 ? 'limited' : 'unavailable',
        text: flight.availableSeats > 5 ? 'Disponible' : flight.availableSeats > 0 ? 'Places limitées' : 'Complet'
      }}
      onPress={() => console.log('Flight selected:', flight.flightNumber)}
      onBook={() => handleBookFlight(flight)}
    />
  );

  const renderBookingModal = () => (
    <BookingModal
      visible={showBookingModal}
      onClose={() => setShowBookingModal(false)}
      onConfirm={handleConfirmBooking}
      title="Réserver votre vol"
      serviceName={`${selectedFlight?.airline} ${selectedFlight?.flightNumber}`}
      serviceDetails={`${selectedFlight?.departure} → ${selectedFlight?.destination}`}
      totalPrice={(selectedFlight?.price || 0) * passengers}
      currency="CDF"
      fields={[
        { key: 'name', label: 'Nom complet', placeholder: 'Nom et prénom', required: true },
        { key: 'email', label: 'Email', placeholder: 'votre@email.com', required: true, keyboardType: 'email-address' },
        { key: 'phone', label: 'Téléphone', placeholder: '+243...', required: true, variant: 'phone' },
        { key: 'passport', label: 'Numéro de passeport', placeholder: 'AB1234567', required: true }
      ]}
      submitLabel="Confirmer la réservation"
      size="lg"
    />
  );

  const renderSuccessModal = () => (
    <SuccessModal
      visible={showSuccessModal}
      onClose={() => {
        setShowSuccessModal(false);
        setSelectedFlight(null);
      }}
      title="Vol réservé !"
      message={`Votre vol ${selectedFlight?.flightNumber} a été réservé avec succès. Vous recevrez votre billet par email.`}
      animation="confetti"
      autoClose
      buttonLabel="Voir mes réservations"
    />
  );

  return (
    <GradientBackground style={{ flex: 1 }} opacity="10">
      <HeaderWithBackButton title="Réservation de vol" />
      <SearchLayout
        searchBar={renderSearchBar()}
        topFilters={renderTopFilters()}
        filters={renderFilters()}
        results={filteredFlights}
        renderItem={renderFlightCard}
        loading={isLoading}
        emptyState={
          <EmptyState
            title="Aucun vol trouvé"
            message="Essayez de modifier vos critères de recherche"
            actionLabel="Réinitialiser"
            onAction={() => {
              setSearchQuery('');
              setDestination('');
              setFlightClass('economy');
            }}
          />
        }
      />
      {renderBookingModal()}
      {renderSuccessModal()}
    </GradientBackground>
  );
}

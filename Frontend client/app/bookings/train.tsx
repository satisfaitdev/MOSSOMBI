import React, { useState, useMemo } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Train, Clock, ArrowUpDown } from 'lucide-react-native';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants/colors';

import { Heading, Body, Caption, Badge } from '@/components/atoms';
import { Section, Stack, Row } from '@/components/ui';
import { SuccessModal } from '@/components/organisms/modals';
import { SearchBar, DatePicker, Counter, PriceDisplay, EmptyState } from '@/components/molecules';
import { SearchLayout } from '@/components/templates';
import { BookingModal, BookingResultCard, TripTypeFilters, ClassFilters } from '@/components/organisms';
import Button from '@/components/Button';
import Input from '@/components/Input';

interface TrainTrip {
  id: string;
  company: string;
  trainNumber: string;
  departure: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  compareAtPrice?: number;
  class: 'standard' | 'first';
  availableSeats: number;
}

const TRAINS: TrainTrip[] = [
  {
    id: '1',
    company: 'SNCC',
    trainNumber: 'TN101',
    departure: 'Kinshasa Central',
    destination: 'Matadi',
    departureTime: '06:00',
    arrivalTime: '12:30',
    duration: '6h 30m',
    price: 25000,
    compareAtPrice: 30000,
    class: 'standard',
    availableSeats: 45,
  },
  {
    id: '2',
    company: 'SNCC',
    trainNumber: 'TN202',
    departure: 'Lubumbashi',
    destination: 'Kolwezi',
    departureTime: '08:00',
    arrivalTime: '14:00',
    duration: '6h',
    price: 35000,
    class: 'first',
    availableSeats: 12,
  },
];

export default function TrainBookingScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [departure, setDeparture] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState<Date | undefined>();
  const [returnDate, setReturnDate] = useState<Date | undefined>();
  const [passengers, setPassengers] = useState(1);
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('one-way');
  const [trainClass, setTrainClass] = useState<'standard' | 'first'>('standard');
  
  const [selectedTrain, setSelectedTrain] = useState<TrainTrip | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const stations = useMemo(() => [
    'Kinshasa Central', 'Matadi', 'Lubumbashi', 'Kolwezi', 'Kisangani', 'Kananga',
  ], []);

  const filteredTrains = useMemo(() => {
    let filtered = TRAINS;
    
    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.departure.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.destination.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (trainClass !== 'standard') {
      filtered = filtered.filter(t => t.class === trainClass);
    }

    return filtered;
  }, [searchQuery, trainClass]);

  const handleSearch = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleBookTrain = (train: TrainTrip) => {
    setSelectedTrain(train);
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
      suggestions={stations.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)}
      onSelectSuggestion={setSearchQuery}
      showSuggestions={searchQuery.length >= 2}
      placeholder="Rechercher une gare..."
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

      <Counter value={passengers} onChange={setPassengers} min={1} max={10} label="Passagers" />

      <ClassFilters
        selectedClass={trainClass}
        onClassChange={(classId) => setTrainClass(classId as 'standard' | 'first')}
        classes={[
          { id: 'standard', label: 'Standard', description: 'Confort de base' },
          { id: 'first', label: 'Première classe', description: 'Confort supérieur' }
        ]}
        title="Classe de voyage"
      />

      <Button title="Rechercher des trains" onPress={handleSearch} variant="gradient" size="lg" fullWidth loading={isLoading} />
    </Stack>
  );

  const renderTrainCard = (train: TrainTrip) => (
    <BookingResultCard
      title={`${train.company} ${train.trainNumber}`}
      subtitle={`${train.departure} → ${train.destination}`}
      rating={4.2}
      reviewCount={45}
      price={train.price}
      currency="CDF"
      compareAtPrice={train.compareAtPrice}
      badges={[train.class === 'standard' ? 'Standard' : 'Première classe']}
      features={[
        { icon: Clock, label: train.duration },
        { icon: Train, label: `${train.availableSeats} places` }
      ]}
      availability={{
        status: train.availableSeats > 10 ? 'available' : train.availableSeats > 0 ? 'limited' : 'unavailable',
        text: train.availableSeats > 10 ? 'Disponible' : train.availableSeats > 0 ? 'Places limitées' : 'Complet'
      }}
      onPress={() => console.log('Train selected:', train.trainNumber)}
      onBook={() => handleBookTrain(train)}
    />
  );

  const renderBookingModal = () => (
    <BookingModal
      visible={showBookingModal}
      onClose={() => setShowBookingModal(false)}
      onConfirm={handleConfirmBooking}
      title="Réserver votre train"
      serviceName={`${selectedTrain?.company} ${selectedTrain?.trainNumber}`}
      serviceDetails={`${selectedTrain?.departure} → ${selectedTrain?.destination}`}
      totalPrice={(selectedTrain?.price || 0) * passengers}
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
        setSelectedTrain(null);
      }}
      title="Train réservé !"
      message={`Votre billet pour le train ${selectedTrain?.trainNumber} a été réservé avec succès.`}
      animation="confetti"
      autoClose
      buttonText="Voir mes réservations"
    />
  );

  return (
    <>
      <HeaderWithBackButton title="Réservation de train" />
      <SearchLayout
        searchBar={renderSearchBar()}
        topFilters={renderTopFilters()}
        filters={renderFilters()}
        results={filteredTrains}
        renderItem={renderTrainCard}
        loading={isLoading}
        emptyState={
          <EmptyState
            title="Aucun train trouvé"
            message="Essayez de modifier vos critères de recherche"
            actionLabel="Réinitialiser"
            onAction={() => {
              setSearchQuery('');
              setTrainClass('standard');
            }}
          />
        }
      />
      {renderBookingModal()}
      {renderSuccessModal()}
    </>
  );
}

import React, { useState, useMemo } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Bus, Clock, ArrowUpDown } from 'lucide-react-native';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants/colors';

import { Heading, Body, Caption, Badge } from '@/components/atoms';
import { Section, Stack, Row } from '@/components/ui';
import { SuccessModal } from '@/components/organisms/modals';
import { SearchBar, DatePicker, Counter, PriceDisplay, EmptyState } from '@/components/molecules';
import { SearchLayout } from '@/components/templates';
import { BookingModal, BookingResultCard, TripTypeFilters } from '@/components/organisms';
import Button from '@/components/Button';
import Input from '@/components/Input';

interface BusTrip {
  id: string;
  company: string;
  busNumber: string;
  departure: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  compareAtPrice?: number;
  type: 'standard' | 'vip' | 'express';
  availableSeats: number;
}

const BUSES: BusTrip[] = [
  { id: '1', company: 'City Express', busNumber: 'CE101', departure: 'Kinshasa Gare Centrale', destination: 'Matadi', departureTime: '06:00', arrivalTime: '10:30', duration: '4h 30m', price: 15000, compareAtPrice: 18000, type: 'standard', availableSeats: 25 },
  { id: '2', company: 'Trans Africa', busNumber: 'TA202', departure: 'Kinshasa Gare Sud', destination: 'Kikwit', departureTime: '08:00', arrivalTime: '16:00', duration: '8h', price: 35000, type: 'vip', availableSeats: 12 },
  { id: '3', company: 'Express Bus', busNumber: 'EB303', departure: 'Lubumbashi Centre', destination: 'Kolwezi', departureTime: '07:00', arrivalTime: '13:30', duration: '6h 30m', price: 28000, type: 'express', availableSeats: 8 },
];

export default function BusBookingScreen() {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [departure, setDeparture] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState<Date | undefined>();
  const [returnDate, setReturnDate] = useState<Date | undefined>();
  const [passengers, setPassengers] = useState(1);
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('one-way');
  const [busType, setBusType] = useState<'all' | 'standard' | 'vip' | 'express'>('all');
  const [selectedBus, setSelectedBus] = useState<BusTrip | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const stations = ['Kinshasa Gare Centrale', 'Kinshasa Gare Sud', 'Matadi', 'Kikwit', 'Lubumbashi Centre', 'Kolwezi'];

  const filteredBuses = useMemo(() => {
    let filtered = BUSES;
    if (searchQuery) filtered = filtered.filter(b => b.departure.toLowerCase().includes(searchQuery.toLowerCase()) || b.destination.toLowerCase().includes(searchQuery.toLowerCase()));
    if (busType !== 'all') filtered = filtered.filter(b => b.type === busType);
    return filtered;
  }, [searchQuery, busType]);

  const renderSearchBar = () => (
    <SearchBar value={searchQuery} onChange={setSearchQuery} suggestions={stations.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)} onSelectSuggestion={setSearchQuery} showSuggestions={searchQuery.length >= 2} placeholder="Rechercher une station..." />
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
      <DatePicker mode={tripType === 'round-trip' ? 'range' : 'single'} value={departureDate} startDate={departureDate} endDate={returnDate} onChange={setDepartureDate} onRangeChange={(start, end) => { setDepartureDate(start); setReturnDate(end); }} label={tripType === 'round-trip' ? 'Dates de voyage' : 'Date de départ'} minDate={new Date()} />
      <Counter value={passengers} onChange={setPassengers} min={1} max={15} label="Passagers" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Row spacing="sm">
          {[{ id: 'all', label: 'Tous' }, { id: 'standard', label: 'Standard' }, { id: 'vip', label: 'VIP' }, { id: 'express', label: 'Express' }].map((type) => (
            <Pressable key={type.id} onPress={() => setBusType(type.id as any)} style={{ paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.lg, backgroundColor: busType === type.id ? colors.primary : colors.surface }}>
              <Body style={{ color: busType === type.id ? '#FFFFFF' : colors.text, fontWeight: TYPOGRAPHY.weights.medium }}>{type.label}</Body>
            </Pressable>
          ))}
        </Row>
      </ScrollView>
      <Button title="Rechercher des bus" onPress={() => { setIsLoading(true); setTimeout(() => setIsLoading(false), 1000); }} variant="gradient" size="lg" fullWidth loading={isLoading} />
    </Stack>
  );

  const renderBusCard = (bus: BusTrip) => (
    <BookingResultCard
      title={`${bus.company} ${bus.busNumber}`}
      subtitle={`${bus.departure} → ${bus.destination}`}
      rating={4.3}
      reviewCount={67}
      price={bus.price}
      currency="CDF"
      compareAtPrice={bus.compareAtPrice}
      badges={[bus.type.toUpperCase()]}
      features={[
        { icon: Clock, label: bus.duration },
        { icon: Bus, label: `${bus.availableSeats} places` }
      ]}
      availability={{
        status: bus.availableSeats > 10 ? 'available' : bus.availableSeats > 0 ? 'limited' : 'unavailable',
        text: bus.availableSeats > 10 ? 'Disponible' : bus.availableSeats > 0 ? 'Places limitées' : 'Complet'
      }}
      onPress={() => console.log('Bus selected:', bus.busNumber)}
      onBook={() => { setSelectedBus(bus); setShowBookingModal(true); }}
    />
  );

  return (
    <>
      <HeaderWithBackButton title="Réservation de bus" />
      <SearchLayout searchBar={renderSearchBar()} topFilters={renderTopFilters()} filters={renderFilters()} results={filteredBuses} renderItem={renderBusCard} loading={isLoading} emptyState={<EmptyState title="Aucun bus trouvé" message="Essayez de modifier vos critères" actionLabel="Réinitialiser" onAction={() => { setSearchQuery(''); setBusType('all'); }} />} />
      <BookingModal
        visible={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onConfirm={() => { setShowBookingModal(false); setShowSuccessModal(true); }}
        title="Réserver votre bus"
        serviceName={`${selectedBus?.company} ${selectedBus?.busNumber}`}
        serviceDetails={`${selectedBus?.departure} → ${selectedBus?.destination}`}
        totalPrice={(selectedBus?.price || 0) * passengers}
        currency="CDF"
        fields={[
          { key: 'name', label: 'Nom complet', placeholder: 'Nom et prénom', required: true },
          { key: 'email', label: 'Email', placeholder: 'votre@email.com', required: true, keyboardType: 'email-address' },
          { key: 'phone', label: 'Téléphone', placeholder: '+243...', required: true, variant: 'phone' }
        ]}
        submitLabel="Confirmer"
        size="lg"
      />
      <SuccessModal visible={showSuccessModal} onClose={() => { setShowSuccessModal(false); setSelectedBus(null); }} title="Bus réservé !" message={`Votre billet pour le bus ${selectedBus?.busNumber} a été réservé.`} animation="confetti" autoClose buttonLabel="Voir mes réservations" />
    </>
  );
}

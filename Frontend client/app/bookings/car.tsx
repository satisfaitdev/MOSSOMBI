import React, { useState, useMemo } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Car, Users, Fuel } from 'lucide-react-native';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants/colors';

import { Heading, Body, Caption, Badge } from '@/components/atoms';
import { Section, Stack, Row } from '@/components/ui';
import { SuccessModal } from '@/components/organisms/modals';
import { SearchBar, DatePicker, Counter, RatingDisplay, PriceDisplay, EmptyState } from '@/components/molecules';
import { SearchLayout } from '@/components/templates';
import { BookingModal, BookingResultCard } from '@/components/organisms';
import Button from '@/components/Button';
import Input from '@/components/Input';

interface CarRental {
  id: string;
  company: string;
  model: string;
  brand: string;
  year: number;
  type: 'economy' | 'suv' | 'luxury' | 'van';
  transmission: 'automatic' | 'manual';
  fuelType: 'diesel' | 'essence';
  seats: number;
  pricePerDay: number;
  compareAtPrice?: number;
  rating: number;
  reviews: number;
  available: boolean;
  features: string[];
}

const CARS: CarRental[] = [
  { id: '1', company: 'Congo Rent', model: 'Corolla', brand: 'Toyota', year: 2022, type: 'economy', transmission: 'automatic', fuelType: 'essence', seats: 5, pricePerDay: 45000, compareAtPrice: 55000, rating: 4.5, reviews: 78, available: true, features: ['Climatisation', 'GPS', 'Bluetooth'] },
  { id: '2', company: 'Premium Cars', model: 'Land Cruiser', brand: 'Toyota', year: 2023, type: 'suv', transmission: 'automatic', fuelType: 'diesel', seats: 7, pricePerDay: 120000, rating: 4.8, reviews: 124, available: true, features: ['4x4', 'Climatisation', 'GPS', 'Cuir'] },
  { id: '3', company: 'City Drive', model: 'Celerio', brand: 'Suzuki', year: 2021, type: 'economy', transmission: 'manual', fuelType: 'essence', seats: 4, pricePerDay: 30000, rating: 4.2, reviews: 45, available: true, features: ['Climatisation', 'Radio'] },
  { id: '4', company: 'Luxury Rentals', model: 'S-Class', brand: 'Mercedes', year: 2023, type: 'luxury', transmission: 'automatic', fuelType: 'diesel', seats: 5, pricePerDay: 250000, rating: 4.9, reviews: 56, available: false, features: ['Cuir', 'GPS', 'Massage', 'Wifi'] },
];

export default function CarRentalScreen() {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [pickupDate, setPickupDate] = useState<Date | undefined>();
  const [returnDate, setReturnDate] = useState<Date | undefined>();
  const [carType, setCarType] = useState<'all' | 'economy' | 'suv' | 'luxury' | 'van'>('all');
  const [transmission, setTransmission] = useState<'all' | 'automatic' | 'manual'>('all');
  const [selectedCar, setSelectedCar] = useState<CarRental | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const carModels = useMemo(() => CARS.map(c => `${c.brand} ${c.model}`), []);

  const filteredCars = useMemo(() => {
    let filtered = CARS;
    if (searchQuery) filtered = filtered.filter(c => c.brand.toLowerCase().includes(searchQuery.toLowerCase()) || c.model.toLowerCase().includes(searchQuery.toLowerCase()));
    if (carType !== 'all') filtered = filtered.filter(c => c.type === carType);
    if (transmission !== 'all') filtered = filtered.filter(c => c.transmission === transmission);
    return filtered;
  }, [searchQuery, carType, transmission]);

  const calculateTotal = () => {
    if (!selectedCar || !pickupDate || !returnDate) return 0;
    const days = Math.ceil((returnDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24));
    return selectedCar.pricePerDay * Math.max(1, days);
  };

  const renderSearchBar = () => (
    <SearchBar value={searchQuery} onChange={setSearchQuery} suggestions={carModels.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)} onSelectSuggestion={setSearchQuery} showSuggestions={searchQuery.length >= 2} placeholder="Rechercher une voiture..." />
  );

  const renderFilters = () => (
    <Stack spacing="md">
      <DatePicker mode="range" startDate={pickupDate} endDate={returnDate} onRangeChange={(start, end) => { setPickupDate(start); setReturnDate(end); }} label="Dates de location" minDate={new Date()} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Row spacing="sm">
          {[{ id: 'all', label: 'Tous' }, { id: 'economy', label: 'Économique' }, { id: 'suv', label: 'SUV' }, { id: 'luxury', label: 'Luxe' }, { id: 'van', label: 'Van' }].map((type) => (
            <Pressable key={type.id} onPress={() => setCarType(type.id as any)} style={{ paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.lg, backgroundColor: carType === type.id ? colors.primary : colors.surface }}>
              <Body style={{ color: carType === type.id ? '#FFFFFF' : colors.text, fontWeight: TYPOGRAPHY.weights.medium }}>{type.label}</Body>
            </Pressable>
          ))}
        </Row>
      </ScrollView>
      <Row spacing="sm">
        {[{ id: 'all', label: 'Toutes transmissions' }, { id: 'automatic', label: 'Automatique' }, { id: 'manual', label: 'Manuelle' }].map((trans) => (
          <Pressable key={trans.id} onPress={() => setTransmission(trans.id as any)} style={{ flex: 1, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md, backgroundColor: transmission === trans.id ? colors.primary : colors.card, alignItems: 'center' }}>
            <Caption style={{ color: transmission === trans.id ? '#FFFFFF' : colors.text }}>{trans.label}</Caption>
          </Pressable>
        ))}
      </Row>
      <Button title="Rechercher" onPress={() => { setIsLoading(true); setTimeout(() => setIsLoading(false), 1000); }} variant="gradient" size="lg" fullWidth loading={isLoading} />
    </Stack>
  );

  const renderCarCard = (car: CarRental) => (
    <BookingResultCard
      title={`${car.brand} ${car.model}`}
      subtitle={`${car.year} • ${car.company}`}
      rating={car.rating}
      reviewCount={car.reviews}
      price={car.pricePerDay}
      currency="CDF"
      compareAtPrice={car.compareAtPrice}
      badges={[car.transmission === 'automatic' ? 'Automatique' : 'Manuelle', ...car.features.slice(0, 2)]}
      features={[
        { icon: Users, label: `${car.seats} places` },
        { icon: Fuel, label: car.fuelType }
      ]}
      availability={{
        status: car.available ? 'available' : 'unavailable',
        text: car.available ? 'Disponible' : 'Indisponible'
      }}
      onPress={() => console.log('Car selected:', car.model)}
      onBook={() => { setSelectedCar(car); setShowBookingModal(true); }}
    />
  );

  return (
    <>
      <HeaderWithBackButton title="Location de voiture" />
      <SearchLayout searchBar={renderSearchBar()} filters={renderFilters()} results={filteredCars} renderItem={renderCarCard} loading={isLoading} emptyState={<EmptyState title="Aucune voiture trouvée" message="Modifiez vos critères" actionLabel="Réinitialiser" onAction={() => { setSearchQuery(''); setCarType('all'); setTransmission('all'); }} />} />
      <BookingModal
        visible={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onConfirm={() => { setShowBookingModal(false); setShowSuccessModal(true); }}
        title="Réserver votre voiture"
        serviceName={`${selectedCar?.brand} ${selectedCar?.model}`}
        serviceDetails={`${selectedCar?.year} • ${selectedCar?.seats} places`}
        totalPrice={calculateTotal()}
        currency="CDF"
        fields={[
          { key: 'name', label: 'Nom complet', placeholder: 'Nom et prénom', required: true },
          { key: 'email', label: 'Email', placeholder: 'votre@email.com', required: true, keyboardType: 'email-address' },
          { key: 'phone', label: 'Téléphone', placeholder: '+243...', required: true, variant: 'phone' },
          { key: 'license', label: 'Numéro de permis', placeholder: 'Permis de conduire', required: true }
        ]}
        submitLabel="Confirmer"
        size="lg"
      />
      <SuccessModal visible={showSuccessModal} onClose={() => { setShowSuccessModal(false); setSelectedCar(null); }} title="Voiture réservée !" message={`Votre ${selectedCar?.brand} ${selectedCar?.model} a été réservée.`} animation="confetti" autoClose buttonLabel="Voir mes réservations" />
    </>
  );
}

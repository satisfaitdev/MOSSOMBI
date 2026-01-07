import React, { useState, useMemo } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Users, ChevronDown } from 'lucide-react-native';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants/colors';

// ==========================================
// IMPORTS DESIGN SYSTEM
// ==========================================
import { Heading, Body, Caption, Badge } from '@/components/atoms';
import { Section, Stack, Row } from '@/components/ui';
import { 
  SearchBar, 
  DatePicker, 
  Counter, 
  RatingDisplay, 
  PriceDisplay,
  EmptyState 
} from '@/components/molecules';
import { SearchLayout } from '@/components/templates';
import { SuccessModal } from '@/components/organisms/modals';
import { BookingModal, BookingResultCard } from '@/components/organisms';
import Button from '@/components/Button';

// ==========================================
// TYPES
// ==========================================
interface Accommodation {
  id: string;
  name: string;
  type: 'hotel' | 'maison' | 'appartement';
  subType: string;
  location: string;
  district: string;
  price: number;
  compareAtPrice?: number;
  rating: number;
  reviews: number;
  maxGuests: number;
  amenities: string[];
  available: boolean;
}

interface LocationData {
  name: string;
  flag: string;
  currency: string;
  cities: Record<string, {
    name: string;
    districts: string[];
  }>;
}

// ==========================================
// DONNÉES
// ==========================================
const LOCATION_DATA: Record<string, LocationData> = {
  'CD': {
    name: 'RD Congo',
    flag: '🇨🇩',
    currency: 'CDF',
    cities: {
      'kinshasa': {
        name: 'Kinshasa',
        districts: ['Gombe', 'Kalamu', 'Lemba', 'Bandalungwa', 'Kintambo']
      }
    }
  }
};

const ACCOMMODATIONS: Accommodation[] = [
  {
    id: '1',
    name: 'Hôtel Memling',
    type: 'hotel',
    subType: 'Suite Deluxe',
    location: 'Boulevard du 30 Juin',
    district: 'Gombe',
    price: 180000,
    compareAtPrice: 220000,
    rating: 4.8,
    reviews: 124,
    maxGuests: 4,
    amenities: ['WiFi', 'Piscine', 'Restaurant', 'Spa'],
    available: true,
  },
  {
    id: '2',
    name: 'Villa Moderne Gombe',
    type: 'maison',
    subType: 'Villa',
    location: 'Avenue Tombalbaye',
    district: 'Gombe',
    price: 250000,
    rating: 4.9,
    reviews: 89,
    maxGuests: 8,
    amenities: ['WiFi', 'Jardin', 'Parking', 'Cuisine'],
    available: true,
  },
  {
    id: '3',
    name: 'Appartement Centre-Ville',
    type: 'appartement',
    subType: '2 Chambres Salon',
    location: 'Avenue Kasa-Vubu',
    district: 'Kalamu',
    price: 85000,
    compareAtPrice: 95000,
    rating: 4.2,
    reviews: 67,
    maxGuests: 4,
    amenities: ['WiFi', 'Cuisine', 'Balcon'],
    available: true,
  },
  {
    id: '4',
    name: 'Studio Cosy Lemba',
    type: 'maison',
    subType: 'Studio',
    location: 'Avenue Université',
    district: 'Lemba',
    price: 45000,
    rating: 4.0,
    reviews: 23,
    maxGuests: 2,
    amenities: ['WiFi', 'Cuisine'],
    available: true,
  },
];

// ==========================================
// COMPONENT PRINCIPAL
// ==========================================
export default function HotelBookingScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  // États de recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [checkInDate, setCheckInDate] = useState<Date | undefined>();
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>();
  const [guests, setGuests] = useState(2);
  const [selectedCountry, setSelectedCountry] = useState('CD');
  const [selectedCity, setSelectedCity] = useState('kinshasa');

  // États des filtres
  const [selectedType, setSelectedType] = useState<'all' | 'hotel' | 'maison' | 'appartement'>('all');
  const [priceRange, setPriceRange] = useState<'all' | 'low' | 'mid' | 'high'>('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');

  // États des modals
  const [selectedAccommodation, setSelectedAccommodation] = useState<Accommodation | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Données utilitaires
  const currentCountry = LOCATION_DATA[selectedCountry];
  const currentCity = currentCountry?.cities[selectedCity];

  // Suggestions pour SearchBar
  const suggestions = useMemo(() => {
    const sugg = new Set<string>();
    currentCity?.districts.forEach(d => sugg.add(d));
    ACCOMMODATIONS.forEach(acc => {
      sugg.add(acc.name);
      sugg.add(acc.district);
    });
    return Array.from(sugg);
  }, [currentCity]);

  // Filtrage des hébergements
  const filteredAccommodations = useMemo(() => {
    let filtered = ACCOMMODATIONS;

    // Recherche
    if (searchQuery) {
      filtered = filtered.filter(acc =>
        acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type
    if (selectedType !== 'all') {
      filtered = filtered.filter(acc => acc.type === selectedType);
    }

    // District
    if (selectedDistrict !== 'all') {
      filtered = filtered.filter(acc => acc.district === selectedDistrict);
    }

    // Prix
    if (priceRange === 'low') {
      filtered = filtered.filter(acc => acc.price < 80000);
    } else if (priceRange === 'mid') {
      filtered = filtered.filter(acc => acc.price >= 80000 && acc.price < 150000);
    } else if (priceRange === 'high') {
      filtered = filtered.filter(acc => acc.price >= 150000);
    }

    // Invités
    if (guests > 0) {
      filtered = filtered.filter(acc => acc.maxGuests >= guests);
    }

    return filtered;
  }, [searchQuery, selectedType, selectedDistrict, priceRange, guests]);

  // Handlers
  const handleSearch = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleBookNow = (accommodation: Accommodation) => {
    setSelectedAccommodation(accommodation);
    setShowBookingModal(true);
  };

  const handleConfirmBooking = () => {
    setShowBookingModal(false);
    setShowSuccessModal(true);
  };

  // Calcul du prix total
  const calculateTotal = () => {
    if (!selectedAccommodation || !checkInDate || !checkOutDate) return 0;
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    return selectedAccommodation.price * Math.max(1, nights);
  };

  // ==========================================
  // RENDER - SearchBar
  // ==========================================
  const renderSearchBar = () => (
    <SearchBar
      value={searchQuery}
      onChange={setSearchQuery}
      suggestions={filteredSuggestions}
      onSelectSuggestion={(suggestion) => setSearchQuery(suggestion)}
      showSuggestions={searchQuery.length >= 2}
      placeholder="Rechercher par lieu, quartier..."
    />
  );

  const filteredSuggestions = useMemo(() => {
    if (!searchQuery) return [];
    return suggestions
      .filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 6);
  }, [searchQuery, suggestions]);

  // ==========================================
  // RENDER - Top Filters (Location)
  // ==========================================
  const renderTopFilters = () => (
    <Row spacing="sm" justify="space-between">
      <Pressable
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.xs,
          backgroundColor: colors.card,
          padding: SPACING.sm,
          borderRadius: BORDER_RADIUS.md,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Body>{currentCountry?.flag}</Body>
        <Body variant="secondary" style={{ flex: 1 }}>
          {currentCountry?.name}
        </Body>
        <ChevronDown size={16} color={colors.textSecondary} />
      </Pressable>

      <Pressable
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.xs,
          backgroundColor: colors.card,
          padding: SPACING.sm,
          borderRadius: BORDER_RADIUS.md,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Body variant="secondary" style={{ flex: 1 }}>
          {currentCity?.name}
        </Body>
        <ChevronDown size={16} color={colors.textSecondary} />
      </Pressable>
    </Row>
  );

  // ==========================================
  // RENDER - Filters
  // ==========================================
  const renderFilters = () => (
    <Stack spacing="md">
      {/* Dates et Invités */}
      <Row spacing="sm">
        <View style={{ flex: 1 }}>
          <DatePicker
            mode="range"
            startDate={checkInDate}
            endDate={checkOutDate}
            onRangeChange={(start, end) => {
              setCheckInDate(start);
              setCheckOutDate(end);
            }}
            label="Dates de séjour"
            minDate={new Date()}
          />
        </View>
      </Row>

      <Counter
        value={guests}
        onChange={setGuests}
        min={1}
        max={10}
        label="Nombre d'invités"
      />

      {/* Filtres par type */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Row spacing="sm">
          {[
            { id: 'all', label: 'Tous' },
            { id: 'hotel', label: 'Hôtel' },
            { id: 'maison', label: 'Maison' },
            { id: 'appartement', label: 'Appartement' },
          ].map((type) => (
            <Pressable
              key={type.id}
              onPress={() => setSelectedType(type.id as any)}
              style={{
                paddingHorizontal: SPACING.md,
                paddingVertical: SPACING.sm,
                borderRadius: BORDER_RADIUS.lg,
                backgroundColor: selectedType === type.id ? colors.primary : colors.surface,
              }}
            >
              <Body
                style={{
                  color: selectedType === type.id ? '#FFFFFF' : colors.text,
                  fontWeight: TYPOGRAPHY.weights.medium,
                }}
              >
                {type.label}
              </Body>
            </Pressable>
          ))}
        </Row>
      </ScrollView>

      {/* Bouton Rechercher */}
      <Button
        title="Rechercher"
        onPress={handleSearch}
        variant="gradient"
        size="lg"
        fullWidth
        loading={isLoading}
      />
    </Stack>
  );

  // ==========================================
  // RENDER - Accommodation Card
  // ==========================================
  const renderAccommodationCard = (accommodation: Accommodation) => (
    <BookingResultCard
      title={accommodation.name}
      subtitle={`${accommodation.location}, ${accommodation.district}`}
      rating={accommodation.rating}
      reviewCount={accommodation.reviews}
      price={accommodation.price}
      currency={currentCountry?.currency || 'CDF'}
      compareAtPrice={accommodation.compareAtPrice}
      badges={accommodation.amenities}
      features={[
        { icon: Users, label: `${accommodation.maxGuests} invités max` },
        { icon: MapPin, label: accommodation.district }
      ]}
      availability={{
        status: accommodation.available ? 'available' : 'unavailable',
        text: accommodation.available ? 'Disponible' : 'Complet'
      }}
      onPress={() => console.log('Accommodation selected:', accommodation.name)}
      onBook={() => handleBookNow(accommodation)}
    />
  );

  // ==========================================
  // RENDER - Booking Modal
  // ==========================================
  const renderBookingModal = () => (
    <BookingModal
      visible={showBookingModal}
      onClose={() => setShowBookingModal(false)}
      onConfirm={handleConfirmBooking}
      title="Confirmer la réservation"
      serviceName={selectedAccommodation?.name || ''}
      serviceDetails={selectedAccommodation ? `${selectedAccommodation.subType} • ${selectedAccommodation.district}` : ''}
      totalPrice={calculateTotal()}
      currency={currentCountry?.currency || 'CDF'}
      fields={[
        { key: 'name', label: 'Nom complet', placeholder: 'Votre nom', required: true },
        { key: 'email', label: 'Email', placeholder: 'votre@email.com', required: true, keyboardType: 'email-address' },
        { key: 'phone', label: 'Téléphone', placeholder: '+243...', required: true, variant: 'phone' },
        { key: 'requests', label: 'Demandes spéciales', placeholder: 'Ajoutez des demandes spéciales...', variant: 'textarea' }
      ]}
      submitLabel="Confirmer"
      size="lg"
    />
  );

  // ==========================================
  // RENDER - Success Modal
  // ==========================================
  const renderSuccessModal = () => (
    <SuccessModal
      visible={showSuccessModal}
      onClose={() => {
        setShowSuccessModal(false);
        setSelectedAccommodation(null);
      }}
      title="Réservation confirmée !"
      message={`Votre réservation chez ${selectedAccommodation?.name} a été confirmée. Vous recevrez un email de confirmation.`}
      animation="confetti"
      autoClose
      buttonLabel="Voir mes réservations"
    />
  );

  // ==========================================
  // RENDER PRINCIPAL
  // ==========================================
  return (
    <>
      <HeaderWithBackButton title="Hébergement" />
      <SearchLayout
        searchBar={renderSearchBar()}
        topFilters={renderTopFilters()}
        filters={renderFilters()}
        results={filteredAccommodations}
        renderItem={renderAccommodationCard}
        loading={isLoading}
        emptyState={
          <EmptyState
            title="Aucun hébergement trouvé"
            message="Essayez de modifier vos critères de recherche"
            actionLabel="Réinitialiser les filtres"
            onAction={() => {
              setSearchQuery('');
              setSelectedType('all');
              setPriceRange('all');
              setSelectedDistrict('all');
            }}
          />
        }
      />

      {/* Modals */}
      {renderBookingModal()}
      {renderSuccessModal()}
    </>
  );
}

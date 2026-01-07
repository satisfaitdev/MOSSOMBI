import React, { useState, useMemo } from 'react';
import { ScrollView, View, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Calendar, Search, Users, Star, Clock, X, ChevronDown, Camera, Phone, Mail, Languages, Award } from 'lucide-react-native';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@/constants/colors';
import { BookingModal, BookingResultCard } from '@/components/organisms';
import { Heading, Body, Caption, Badge } from '@/components/atoms';
import { Stack, Row } from '@/components/ui';
import { Counter } from '@/components/molecules';
import { PageContainer, FilterChip } from '@/components/layouts';

interface TouristSite {
  id: string;
  name: string;
  category: 'culture' | 'nature' | 'adventure' | 'history' | 'shopping' | 'nightlife';
  description: string;
  duration: string;
  difficulty: 'easy' | 'medium' | 'hard';
  rating: number;
  reviews: number;
  district: string;
  city: string;
  guidesCount: number;
  priceFrom: number;
}

const SITES: TouristSite[] = [
  { id: '1', name: 'Musée National', category: 'culture', description: 'Histoire du Congo', duration: '2-3h', difficulty: 'easy', rating: 4.8, reviews: 245, district: 'Gombe', city: 'Kinshasa', guidesCount: 12, priceFrom: 15000 },
  { id: '2', name: 'Marché Central', category: 'shopping', description: 'Artisanat local', duration: '1-2h', difficulty: 'easy', rating: 4.5, reviews: 189, district: 'Kalamu', city: 'Kinshasa', guidesCount: 8, priceFrom: 12000 },
  { id: '3', name: 'Parc de la Nsele', category: 'nature', description: 'Nature et faune', duration: '4-5h', difficulty: 'medium', rating: 4.7, reviews: 156, district: 'Lemba', city: 'Kinshasa', guidesCount: 15, priceFrom: 18000 },
  { id: '4', name: 'Cathédrale Notre-Dame', category: 'history', description: 'Architecture coloniale', duration: '1h', difficulty: 'easy', rating: 4.6, reviews: 203, district: 'Gombe', city: 'Kinshasa', guidesCount: 10, priceFrom: 14000 },
  { id: '5', name: 'Chutes de Boyoma', category: 'nature', description: 'Cascades spectaculaires', duration: '6-8h', difficulty: 'hard', rating: 4.9, reviews: 98, district: 'Centre', city: 'Goma', guidesCount: 6, priceFrom: 20000 },
  { id: '6', name: 'Vie Nocturne Matonge', category: 'nightlife', description: 'Musique et culture', duration: '3-4h', difficulty: 'easy', rating: 4.4, reviews: 312, district: 'Bandalungwa', city: 'Kinshasa', guidesCount: 20, priceFrom: 13000 },
];

const CATEGORIES = [
  { id: 'all', label: 'Tous', emoji: '🌍' },
  { id: 'culture', label: 'Culture', emoji: '🏛️' },
  { id: 'nature', label: 'Nature', emoji: '🌿' },
  { id: 'adventure', label: 'Aventure', emoji: '🏔️' },
  { id: 'history', label: 'Histoire', emoji: '🏰' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { id: 'nightlife', label: 'Vie Nocturne', emoji: '🌃' },
];

const DIFFICULTIES = [
  { id: 'all', label: 'Tous', color: '' },
  { id: 'easy', label: 'Facile', color: '#10B981' },
  { id: 'medium', label: 'Modéré', color: '#F59E0B' },
  { id: 'hard', label: 'Difficile', color: '#EF4444' },
];

export default function GuideScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Kinshasa');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedSite, setSelectedSite] = useState<TouristSite | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [groupSize, setGroupSize] = useState(2);
  const [tourDate, setTourDate] = useState('');

  const handleBookGuide = (site: TouristSite) => {
    setSelectedSite(site);
    setShowBookingModal(true);
  };

  const handleConfirmBooking = () => {
    setShowBookingModal(false);
    setSelectedSite(null);
    console.log('Guide booking confirmed for:', selectedSite?.name);
  };

  const filteredSites = useMemo(() => {
    let filtered = SITES;
    if (selectedCity !== 'all') filtered = filtered.filter(s => s.city === selectedCity);
    if (selectedCategory !== 'all') filtered = filtered.filter(s => s.category === selectedCategory);
    if (selectedDifficulty !== 'all') filtered = filtered.filter(s => s.difficulty === selectedDifficulty);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => s.name.toLowerCase().includes(query) || s.description.toLowerCase().includes(query));
    }
    return filtered;
  }, [searchQuery, selectedCity, selectedCategory, selectedDifficulty]);

  const getDifficultyColor = (difficulty: string) => {
    const diff = DIFFICULTIES.find(d => d.id === difficulty);
    return diff?.color || colors.textSecondary;
  };

  return (
    <>
      <HeaderWithBackButton title="Guide Touristique" />
      <PageContainer>
        <Stack spacing="lg">
          <View><Heading level={2}>Découvrez la RDC</Heading><Caption>Guides locaux expérimentés</Caption></View>

          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: SPACING.md }}>
            <Search size={20} color={colors.textTertiary} />
            <TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Rechercher un site..." placeholderTextColor={colors.textTertiary} style={{ flex: 1, paddingVertical: SPACING.md, paddingHorizontal: SPACING.sm, color: colors.text, fontSize: TYPOGRAPHY.sizes.md }} />
            {searchQuery.length > 0 && <Pressable onPress={() => setSearchQuery('')}><X size={20} color={colors.textTertiary} /></Pressable>}
          </View>

          <Row spacing="md">
            <View style={{ flex: 1 }}>
              <Caption style={{ marginBottom: SPACING.xs }}>Ville</Caption>
              <Pressable style={{ backgroundColor: colors.surface, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: colors.border }}>
                <Row justify="space-between" align="center">
                  <Body>{selectedCity}</Body>
                  <ChevronDown size={20} color={colors.textSecondary} />
                </Row>
              </Pressable>
            </View>
            <View style={{ flex: 1 }}>
              <Caption style={{ marginBottom: SPACING.xs }}>Groupe</Caption>
              <Counter value={groupSize} onChange={setGroupSize} min={1} max={20} />
            </View>
          </Row>

          <View><Caption>Catégories</Caption></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm }}>
            {CATEGORIES.map((cat) => (
              <FilterChip key={cat.id} label={cat.label} emoji={cat.emoji} selected={selectedCategory === cat.id} onPress={() => setSelectedCategory(cat.id)} />
            ))}
          </ScrollView>

          <View><Caption>Difficulté</Caption></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm }}>
            {DIFFICULTIES.map((diff) => (
              <Badge key={diff.id} variant={selectedDifficulty === diff.id ? 'info' : 'default'} onPress={() => setSelectedDifficulty(diff.id)}>{diff.label}</Badge>
            ))}
          </ScrollView>

          <View><Heading level={3}>{filteredSites.length} site{filteredSites.length > 1 ? 's' : ''}</Heading></View>

          <Stack spacing="md">
            {filteredSites.map((site) => (
              <BookingResultCard
                key={site.id}
                title={site.name}
                subtitle={`${site.description} • ${site.district}, ${site.city}`}
                rating={site.rating}
                reviewCount={site.reviews}
                price={site.priceFrom}
                currency="CDF"
                badges={[CATEGORIES.find(c => c.id === site.category)?.emoji || '', site.duration]}
                features={[
                  { icon: MapPin, label: `${site.district}, ${site.city}` },
                  { icon: Clock, label: site.duration },
                  { icon: Users, label: `${site.guidesCount} guides` }
                ]}
                availability={{
                  status: site.guidesCount > 5 ? 'available' : site.guidesCount > 0 ? 'limited' : 'unavailable',
                  text: site.guidesCount > 5 ? 'Guides disponibles' : site.guidesCount > 0 ? 'Guides limités' : 'Complet'
                }}
                onPress={() => console.log('Site selected:', site.name)}
                onBook={() => handleBookGuide(site)}
              />
            ))}
          </Stack>
        </Stack>
      </PageContainer>

      {/* Booking Modal */}
      <BookingModal
        visible={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onConfirm={handleConfirmBooking}
        title="Réserver un guide"
        serviceName={selectedSite?.name || ''}
        serviceDetails={`${selectedSite?.description} • ${selectedSite?.duration}`}
        totalPrice={(selectedSite?.priceFrom || 0) * groupSize * 2}
        currency="CDF"
        fields={[
          { key: 'name', label: 'Nom complet', placeholder: 'Votre nom', required: true },
          { key: 'email', label: 'Email', placeholder: 'votre@email.com', required: true, keyboardType: 'email-address' },
          { key: 'phone', label: 'Téléphone', placeholder: '+243...', required: true, variant: 'phone' },
          { key: 'groupSize', label: 'Nombre de personnes', placeholder: 'Taille du groupe', required: true }
        ]}
        submitLabel="Confirmer la réservation"
        size="lg"
      />
    </>
  );
}

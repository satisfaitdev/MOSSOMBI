import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Ticket, Music, Film, Trophy, Calendar } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/colors';
import { Heading, Body, Caption, Badge } from '@/components/atoms';
import { Section, Stack, Row } from '@/components/ui';
import { useSuccessModal , useServiceFilters, usePurchaseFlow } from '@/hooks';
import { SuccessModal , FormModal } from '@/components/organisms/modals';
import Button from '@/components/Button';
import ExclusiveTicketCard from '@/components/molecules/ExclusiveTicketCard';
import TicketEventCard from '@/components/molecules/TicketEventCard';
import { ServicePageLayout } from '@/components/templates';
import { ExclusiveCarousel } from '@/components/organisms';
import Input from '@/components/Input';

interface TicketEvent {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  date: string;
  location: string;
  image?: string;
  isExclusive?: boolean;
  rating?: number;
}

const EVENTS: TicketEvent[] = [
  {
    id: '1',
    name: 'Concert Fally Ipupa',
    description: 'Concert exceptionnel de Fally Ipupa à Kinshasa',
    price: 50000,
    compareAtPrice: 75000,
    category: 'concerts',
    date: '2025-11-15',
    location: 'Stade des Martyrs, Kinshasa',
    isExclusive: true,
    rating: 4.9,
  },
  {
    id: '2',
    name: 'Festival Amani',
    description: 'Festival de musique et culture congolaise',
    price: 30000,
    compareAtPrice: 40000,
    category: 'festivals',
    date: '2025-12-01',
    location: 'Goma',
    isExclusive: true,
    rating: 4.7,
  },
  {
    id: '3',
    name: 'Match TP Mazembe',
    description: 'Match de football - TP Mazembe vs AS Vita Club',
    price: 15000,
    category: 'sports',
    date: '2025-10-20',
    location: 'Stade TP Mazembe, Lubumbashi',
    rating: 4.5,
  },
  {
    id: '4',
    name: 'Théâtre Congolais',
    description: 'Pièce de théâtre "La Vie est Belle"',
    price: 20000,
    category: 'theatre',
    date: '2025-11-05',
    location: 'Centre Culturel, Kinshasa',
    rating: 4.6,
  },
  {
    id: '5',
    name: 'Conférence Tech',
    description: 'Conférence sur l\'innovation technologique en Afrique',
    price: 25000,
    compareAtPrice: 35000,
    category: 'conferences',
    date: '2025-10-30',
    location: 'Pullman Hotel, Kinshasa',
    isExclusive: true,
    rating: 4.8,
  },
];

const BilletterieScreen = () => {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [recipientName, setRecipientName] = useState('');
  const successModal = useSuccessModal({ autoClose: true });

  const handleBookTicket = (eventName: string) => {
    successModal.show({
      title: 'Billet réservé !',
      message: `Votre billet pour ${eventName} a été réservé`,
      animation: 'confetti',
    });
  };

  // Hooks partagés
  const filters = useServiceFilters(EVENTS);
  const purchase = usePurchaseFlow<TicketEvent>();

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handlePurchase = (event: TicketEvent) => {
    setQuantity(1);
    setRecipientName('');
    purchase.handlePurchase(event);
  };

  const handleSubmit = () => {
    if (!purchase.selectedItem) return;

    const totalAmount = purchase.selectedItem.price * quantity;

    // Log des informations d'achat
    console.log('Achat de billets:', {
      event: purchase.selectedItem,
      quantity,
      recipientName: recipientName || 'Moi-même',
      totalAmount,
      date: new Date().toISOString(),
    });

    // Utiliser le hook pour gérer la transition
    purchase.handleSubmit();
    setRecipientName('');
    setQuantity(1);
  };

  return (
    <>
      <ServicePageLayout
        title="Billetterie"
        searchQuery={filters.searchQuery}
        onSearchChange={filters.setSearchQuery}
        searchPlaceholder="Rechercher un événement..."
        categories={filters.categories}
        selectedCategory={filters.selectedCategory}
        onCategoryChange={filters.setSelectedCategory}
        exclusiveCarousel={
          <ExclusiveCarousel
            items={filters.exclusiveItems}
            renderItem={(event, width) => (
              <ExclusiveTicketCard
                name={event.name}
                description={event.description}
                price={event.price}
                compareAtPrice={event.compareAtPrice}
                date={event.date}
                location={event.location}
                width={width}
                onPress={() => handlePurchase(event)}
              />
            )}
          />
        }
        refreshing={refreshing}
        onRefresh={handleRefresh}
        showEmpty={filters.filteredItems.length === 0}
        emptyMessage="Aucun événement trouvé"
      >
        {filters.filteredItems.map((event) => (
          <TicketEventCard
            key={event.id}
            name={event.name}
            description={event.description}
            price={event.price}
            compareAtPrice={event.compareAtPrice}
            date={event.date}
            location={event.location}
            rating={event.rating}
            onPress={() => handlePurchase(event)}
          />
        ))}
      </ServicePageLayout>

      {/* Modal d'achat */}
      <FormModal
        visible={purchase.showModal}
        onClose={purchase.closeModal}
        onSubmit={handleSubmit}
        title="Réserver vos billets"
        submitText="Confirmer la réservation"
        size="md"
      >
        {purchase.selectedItem && (
          <Stack spacing="md">
            {/* Infos événement (Date et Lieu) */}
            <Section variant="outlined">
              <Stack spacing="sm">
                <Row spacing="xs">
                  <Calendar size={16} color={colors.textSecondary} />
                  <Caption>
                    {new Date(purchase.selectedItem.date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Caption>
                </Row>
                <Row spacing="xs">
                  <Body style={{ fontWeight: 'bold' }}>{purchase.selectedItem.name}</Body>
                  <Caption>{purchase.selectedItem.date}</Caption>
                  <Caption>{purchase.selectedItem.location}</Caption>
                </Row>
              </Stack>
            </Section>

            {/* Nombre de billets */}
            <View>
              <Body style={{ marginBottom: SPACING.xs }}>Nombre de billets</Body>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Body style={{ fontSize: 24, fontWeight: 'bold' }}>{quantity}</Body>
                </View>
              </View>
            </View>

            {/* Nom du bénéficiaire */}
            <Input
              label="Nom du bénéficiaire (optionnel)"
              placeholder="Pour quelqu'un d'autre ?"
              value={recipientName}
              onChangeText={setRecipientName}
            />

            {/* Récapitulatif total */}
            <Section variant="outlined">
              <Stack spacing="sm">
                <Row justify="space-between">
                  <Caption>Prix unitaire:</Caption>
                  <Body>{purchase.selectedItem?.price.toLocaleString()} FCFA</Body>
                </Row>
                <Row justify="space-between">
                  <Caption>Quantité:</Caption>
                  <Body>{quantity}</Body>
                </Row>
                <Row justify="space-between">
                  <Heading level={4}>Total:</Heading>
                  <Heading level={4}>
                    {((purchase.selectedItem?.price || 0) * quantity).toLocaleString()} FCFA
                  </Heading>
                </Row>
              </Stack>
            </Section>
          </Stack>
        )}
      </FormModal>

      <SuccessModal {...successModal.props} />
    </>
  );
};

export default BilletterieScreen;

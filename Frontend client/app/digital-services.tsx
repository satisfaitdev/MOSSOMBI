import React, { useState } from 'react';
import { View, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
import { Sparkles, Film, Music, Wifi, Tv, Book } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';
import { Body, Heading } from '@/components/atoms';
import { Section, Stack } from '@/components/ui';
import { FormModal, SuccessModal } from '@/components/organisms/modals';
import { ExclusiveCarousel } from '@/components/organisms';
import ExclusiveDigitalServiceCard from '@/components/molecules/ExclusiveDigitalServiceCard';
import DigitalServiceCard from '@/components/molecules/DigitalServiceCard';
import { ServicePageLayout } from '@/components/templates';
import { useServiceFilters, usePurchaseFlow, useSuccessModal } from '@/hooks';


interface DigitalService {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  icon: React.ReactNode;
  duration?: string;
  isExclusive?: boolean;
}

export default function DigitalServicesScreen() {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - À remplacer par API
  const services: DigitalService[] = [
    {
      id: '1',
      name: 'Netflix Premium',
      description: 'Abonnement Netflix 1 mois - 4 écrans',
      price: 15000,
      compareAtPrice: 20000,
      category: 'streaming',
      icon: <Film size={24} color={colors.primary} />,
      duration: '1 mois',
      isExclusive: true,
    },
    {
      id: '2',
      name: 'Spotify Premium',
      description: 'Musique illimitée sans pub',
      price: 8000,
      category: 'musique',
      icon: <Music size={24} color={colors.secondary} />,
      duration: '1 mois',
    },
    {
      id: '3',
      name: 'VPN Premium',
      description: 'Connexion sécurisée et anonyme',
      price: 12000,
      category: 'securite',
      icon: <Wifi size={24} color={colors.accent} />,
      duration: '1 mois',
    },
    {
      id: '4',
      name: 'YouTube Premium',
      description: 'Sans pub + YouTube Music',
      price: 10000,
      compareAtPrice: 13000,
      category: 'streaming',
      icon: <Tv size={24} color={colors.primary} />,
      duration: '1 mois',
      isExclusive: true,
    },
    {
      id: '5',
      name: 'Audible',
      description: 'Livres audio illimités',
      price: 9000,
      category: 'education',
      icon: <Book size={24} color={colors.secondary} />,
      duration: '1 mois',
    },
    {
      id: '6',
      name: 'Canva Pro',
      description: 'Design graphique professionnel',
      price: 11000,
      compareAtPrice: 15000,
      category: 'productivite',
      icon: <Sparkles size={24} color={colors.accent} />,
      duration: '1 mois',
      isExclusive: true,
    },
  ];

  // Hooks partagés
  const filters = useServiceFilters(services);
  const purchase = usePurchaseFlow<DigitalService>();
  const successModal = useSuccessModal({ autoClose: true });

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleSubmit = () => {
    if (!purchase.selectedItem) return;

    console.log('Achat d\'abonnement:', {
      service: purchase.selectedItem,
      amount: purchase.selectedItem.price,
      date: new Date().toISOString(),
    });

    purchase.handleSubmit();
    successModal.show({
      title: 'Abonnement activé !',
      message: `Votre abonnement ${purchase.selectedItem.name} a été activé avec succès`,
      animation: 'confetti',
    });
  };

  return (
    <>
      <ServicePageLayout
      title="Services Numériques"
      searchQuery={filters.searchQuery}
      onSearchChange={filters.setSearchQuery}
      searchPlaceholder="Rechercher un service..."
      categories={filters.categories}
      selectedCategory={filters.selectedCategory}
      onCategoryChange={filters.setSelectedCategory}
      exclusiveCarousel={
        <ExclusiveCarousel
          items={filters.exclusiveItems}
          renderItem={(service, width) => (
            <ExclusiveDigitalServiceCard
              name={service.name}
              description={service.description}
              price={service.price}
              compareAtPrice={service.compareAtPrice}
              icon={service.icon}
              duration={service.duration}
              width={width}
              onPress={() => purchase.handlePurchase(service)}
            />
          )}
        />
      }
      refreshing={refreshing}
      onRefresh={handleRefresh}
      showEmpty={filters.filteredItems.length === 0}
      emptyMessage="Aucun service trouvé"
    >
      <View style={{ 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        gap: SPACING.md,
      }}>
        {filters.filteredItems.map((service) => (
          <View 
            key={service.id} 
            style={{ 
              width: (width - SPACING.md * 2 - SPACING.md) / 2, // Largeur précise pour 2 colonnes
            }}
          >
            <DigitalServiceCard
              name={service.name}
              description={service.description}
              price={service.price}
              compareAtPrice={service.compareAtPrice}
              icon={service.icon}
              duration={service.duration}
              onPress={() => purchase.handlePurchase(service)}
            />
          </View>
        ))}
      </View>
    </ServicePageLayout>

    {/* Modal d'achat */}
    <FormModal
        visible={purchase.showModal}
        onClose={purchase.closeModal}
        onSubmit={handleSubmit}
        onConfirm={handleSubmit}
        title="Confirmer l'abonnement"
        submitText="Confirmer"
        size="md"
      >
        {purchase.selectedItem && (
          <Stack spacing="md">
            {/* Infos service */}
            <Section variant="outlined">
              <Stack spacing="sm">
                <View style={{ alignItems: 'center' }}>
                  <Body style={{ color: colors.textSecondary, marginBottom: SPACING.xs }}>
                    Service
                  </Body>
                  <Heading level={3} style={{ textAlign: 'center' }}>
                    {purchase.selectedItem.name}
                  </Heading>
                  {purchase.selectedItem.duration && (
                    <Body style={{ color: colors.textSecondary, marginTop: SPACING.xs }}>
                      Durée: {purchase.selectedItem.duration}
                    </Body>
                  )}
                </View>

                <View style={{ height: 1, backgroundColor: colors.border, opacity: 0.3 }} />

                <View style={{ alignItems: 'center' }}>
                  <Body style={{ color: colors.textSecondary, marginBottom: SPACING.xs }}>
                    Prix
                  </Body>
                  <Heading level={2} style={{ color: colors.primary }}>
                    {purchase.selectedItem.price.toLocaleString()} FCFA
                  </Heading>
                </View>
              </Stack>
            </Section>
          </Stack>
        )}
      </FormModal>

      <SuccessModal {...successModal.props} />
    </>
  );
}

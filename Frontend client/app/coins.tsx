import React, { useState } from 'react';
import { View, Pressable, Image, Text } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/constants/colors';
import { Body } from '@/components/atoms';
import { Row } from '@/components/ui';
import { FormModal, SuccessModal } from '@/components/organisms/modals';
import { ExclusiveCarousel } from '@/components/organisms';
import ExclusiveServiceCard from '@/components/molecules/ExclusiveServiceCard';
import CoinServiceGrid from '@/components/organisms/CoinServiceGrid';
import { ServicePageLayout } from '@/components/templates';
import { useServiceFilters, usePurchaseFlow , useSuccessModal } from '@/hooks';
import Input from '@/components/Input';

interface CoinService {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  category: string;
  coins: number;
  isExclusive?: boolean;
}

// Mock data
const SERVICES: CoinService[] = [
  {
    id: '1',
    name: 'Pack Premium',
    price: 149,
    compareAtPrice: 200,
    currency: 'USD',
    category: 'poppo',
    coins: 1500000,
    isExclusive: true,
  },
  {
    id: '2',
    name: 'Pack Standard',
    price: 50,
    currency: 'USD',
    category: 'poppo',
    coins: 500000,
  },
  {
    id: '3',
    name: 'Pack Starter',
    price: 20,
    currency: 'USD',
    category: 'poppo',
    coins: 200000,
  },
  {
    id: '4',
    name: 'TikTok Coins Pro',
    price: 99,
    compareAtPrice: 120,
    currency: 'USD',
    category: 'tiktok',
    coins: 1000000,
  },
  {
    id: '5',
    name: 'TikTok Coins Basic',
    price: 30,
    currency: 'USD',
    category: 'tiktok',
    coins: 300000,
  },
  {
    id: '6',
    name: 'Gaming Pack Elite',
    price: 75,
    currency: 'USD',
    category: 'gaming',
    coins: 750000,
    isExclusive: true,
  },
];

export default function CoinsScreen() {
  const { colors } = useTheme();
  const [userId, setUserId] = useState('');
  const [accountType, setAccountType] = useState<'user' | 'agent'>('user');
  const [refreshing, setRefreshing] = useState(false);

  const successModal = useSuccessModal({ autoClose: true });

  const handleBuyCoins = (packName: string, coins: number) => {
    successModal.show({
      title: 'Coins achetés !',
      message: `${coins} coins ont été ajoutés à votre compte`,
      animation: 'confetti',
    });
  };

  // Hooks partagés
  const filters = useServiceFilters(SERVICES);
  const purchase = usePurchaseFlow<CoinService>();

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleSubmit = () => {
    if (!userId.trim()) {
      alert('Veuillez entrer votre ID utilisateur');
      return;
    }

    if (!purchase.selectedItem) return;

    console.log('Achat de coins:', {
      service: purchase.selectedItem,
      userId,
      accountType,
      totalPrice: purchase.selectedItem.price * 655,
      date: new Date().toISOString(),
    });

    purchase.handleSubmit();
    setUserId('');
    setAccountType('user');
  };

  return (
    <>
      <ServicePageLayout
      title="Marché des Coins"
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
              <ExclusiveServiceCard
                coins={service.coins}
                price={service.price}
                compareAtPrice={service.compareAtPrice}
                currency={service.currency}
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
        {filters.selectedCategory === 'Tous' ? (
          // Affichage par catégorie
          filters.categories.filter((cat) => cat !== 'Tous').map((category) => {
            const categoryServices = SERVICES.filter(
              (s) => s.category === category && !s.isExclusive
            );
            if (categoryServices.length === 0) return null;

            return (
              <CoinServiceGrid
                key={category}
                services={categoryServices}
                showCategoryTitle
                categoryTitle={category.charAt(0).toUpperCase() + category.slice(1)}
                onServicePress={(service) => purchase.handlePurchase(service)}
              />
            );
          })
        ) : (
          // Affichage catégorie sélectionnée
          <CoinServiceGrid
            services={filters.filteredItems.filter((s) => !s.isExclusive)}
            showCategoryTitle={false}
            onServicePress={(service) => purchase.handlePurchase(service)}
          />
        )}
    </ServicePageLayout>

    {/* Modal d'achat */}
      <FormModal
        visible={purchase.showModal}
        onClose={purchase.closeModal}
        onSubmit={handleSubmit}
        title="Confirmer l'achat"
        submitText="Confirmer"
        size="md"
      >
        {purchase.selectedItem && (
          <View style={{ gap: SPACING.md }}>
            {/* Service Info Card */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: BORDER_RADIUS.xl,
                padding: SPACING.md,
                borderWidth: 2,
                borderColor: colors.primary + '20',
              }}
            >
              {/* Quantité avec icône */}
              <View style={{ marginBottom: SPACING.md }}>
                <Body style={{ color: colors.textSecondary, marginBottom: SPACING.xs }}>
                  Quantité
                </Body>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                  <Image
                    source={require('@/assets/images/coins (2).png')}
                    style={{ width: 20, height: 20 }}
                    resizeMode="contain"
                  />
                  <Text style={{ 
                    color: colors.text, 
                    fontSize: TYPOGRAPHY.sizes.xl, 
                    fontWeight: TYPOGRAPHY.weights.bold 
                  }}>
                    {purchase.selectedItem.coins.toLocaleString()}
                  </Text>
                  <Body style={{ color: colors.textSecondary }}>coins</Body>
                </View>
              </View>

              {/* Divider */}
              <View style={{ 
                height: 1, 
                backgroundColor: colors.border, 
                marginVertical: SPACING.sm 
              }} />

              {/* Prix total */}
              <View>
                <Body style={{ color: colors.textSecondary, marginBottom: SPACING.xs }}>
                  Prix total
                </Body>
                <Text style={{ 
                  color: colors.primary, 
                  fontSize: TYPOGRAPHY.sizes.xxl, 
                  fontWeight: TYPOGRAPHY.weights.bold 
                }}>
                  {(purchase.selectedItem.price * 655).toLocaleString()} FCFA
                </Text>
              </View>
            </View>

            {/* ID Utilisateur */}
            <Input
              value={userId}
              onChangeText={setUserId}
              placeholder="Entrez votre ID"
              label="ID Utilisateur"
            />

            {/* Type de compte */}
            <View>
              <Body style={{ marginBottom: SPACING.xs, color: colors.textSecondary }}>
                Type de compte
              </Body>
              <Row spacing="sm">
                <Pressable
                  onPress={() => setAccountType('user')}
                  style={{
                    flex: 1,
                    backgroundColor: accountType === 'user' ? colors.primary : colors.surface,
                    borderRadius: BORDER_RADIUS.full,
                    padding: SPACING.md,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: accountType === 'user' ? colors.primary : colors.border,
                  }}
                >
                  <Text
                    style={{
                      color: accountType === 'user' ? '#FFFFFF' : colors.text,
                      fontWeight: TYPOGRAPHY.weights.medium,
                      fontSize: TYPOGRAPHY.sizes.sm,
                    }}
                  >
                    Utilisateur
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setAccountType('agent')}
                  style={{
                    flex: 1,
                    backgroundColor: accountType === 'agent' ? colors.primary : colors.surface,
                    borderRadius: BORDER_RADIUS.full,
                    padding: SPACING.md,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: accountType === 'agent' ? colors.primary : colors.border,
                  }}
                >
                  <Text
                    style={{
                      color: accountType === 'agent' ? '#FFFFFF' : colors.text,
                      fontWeight: TYPOGRAPHY.weights.medium,
                      fontSize: TYPOGRAPHY.sizes.sm,
                    }}
                  >
                    Agent
                  </Text>
                </Pressable>
              </Row>
            </View>
          </View>
        )}
      </FormModal>

      <SuccessModal {...successModal.props} />
    </>
  );
}


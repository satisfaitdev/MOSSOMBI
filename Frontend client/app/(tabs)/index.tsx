import React from 'react';
import { View, Pressable, Image, ScrollView, useWindowDimensions } from 'react-native';
import { useTypedNavigation } from '@/utils/navigation';
import { Bell } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@/constants/colors';
import { COMMON_STYLES } from '@/constants/styles';
import { Heading, Body, Caption } from '@/components/atoms';
import { Section, Stack, Row } from '@/components/ui';
import { PageContainer } from '@/components/layouts';
import ServiceCard from '@/components/ServiceCard';
import WalletCard from '@/components/WalletCard';
import BannerCarousel from '@/components/organisms/BannerCarousel';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getGreetingKey } from '@/utils/greetings';
import ServiceGrid from '@/components/organisms/ServiceGrid';

const gap = SPACING.xs; // 8px - gap optimal pour 4 colonnes

export default function HomeScreen() {
  const { colors } = useTheme();
  const navigation = useTypedNavigation();
  const { width } = useWindowDimensions(); // Hook dynamique pour la largeur
  
  // Connexion au backend pour les données du wallet et utilisateur
  const { wallet } = useWallet();
  const { user } = useAuth();
  const { t } = useLanguage();
  
  // Extraire le prénom de l'utilisateur
  const firstName = user?.full_name?.split(' ')[0] || 'Utilisateur';
  
  // Obtenir la salutation selon l'heure avec traductions
  const greetingKey = getGreetingKey();
  const greetingText = t(greetingKey as any); // Cast pour éviter l'erreur TypeScript
  

  // Données externalisées
  const { getMainServices, getTrendingServices, homeBanners } = require('@/constants/homeData');
  const mainServices = getMainServices(colors);
  const trendingServices = getTrendingServices(colors);

  return (
    <PageContainer>
      <Stack spacing="lg" style={{ marginTop: SPACING.xl }}>
        {/* Header avec salutation et notifications */}
        <Row justify="space-between" align="center">
          <Row spacing="sm" align="center" style={{ flex: 1 }}>
            <Image 
              source={require('@/assets/images/icon.png')} 
              style={{ width: 40, height: 40, borderRadius: BORDER_RADIUS.md, marginRight: SPACING.xs }} 
              resizeMode="contain"
            />
            <View>
              <Heading level={3} style={{ 
                marginBottom: SPACING.xs 
              }}>
                {greetingText}, {firstName} 👋
              </Heading>
              <Caption style={{ color: colors.textSecondary }}>
                {t('whatToDo')}
              </Caption>
            </View>
          </Row>
          <Pressable 
            onPress={() => navigation.push('/notifications')} 
            style={[COMMON_STYLES.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Bell size={20} color={colors.text} />
          </Pressable>
        </Row>

        {/* Carousel de banners */}
        <BannerCarousel banners={homeBanners} />


        {/* Wallet Card */}
        <WalletCard 
          balance={wallet.balance}
          points={wallet.points}
          isLoading={wallet.isLoading}
          onRecharge={() => navigation.push('/wallet/recharge')} 
          onWithdraw={() => navigation.push('/wallet/withdraw')} 
        />

        {/* Services populaires */}
        <View>
          <Heading level={3} style={{ marginBottom: SPACING.md }}>{t('popularServices')}</Heading>
          <ServiceGrid
            items={mainServices}
            gap={gap}
            paddingHorizontal={0} // PageContainer gère déjà le padding
            renderItem={(service: any, itemWidth: number) => {
              const IconComponent = service.iconComponent;
              return (
                <View key={service.id} style={{ width: itemWidth }}>
                  <ServiceCard 
                    title={t(service.titleKey as any)} 
                    icon={<IconComponent size={28} color={service.color} />} 
                    onPress={() => navigation.push(service.route)} 
                  />
                </View>
              );
            }}
          />
        </View>

        {/* Services en vogue */}
        <View>
          <Heading level={3} style={{ marginBottom: SPACING.md }}>Services en vogue 🔥</Heading>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.md }}>
            {trendingServices.map((service: any) => {
              const IconComponent = service.iconComponent;
              return (
                <Pressable
                  key={service.id}
                  onPress={() => navigation.push(service.route)}
                  style={{
                    width: width * 0.7,
                    backgroundColor: colors.card,
                    borderRadius: BORDER_RADIUS.lg,
                    padding: SPACING.lg,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Row spacing="md" align="center">
                    <View
                      style={[
                        COMMON_STYLES.center,
                        {
                          width: 56,
                          height: 56,
                          borderRadius: BORDER_RADIUS.lg,
                          backgroundColor: service.color + '20',
                        }
                      ]}
                    >
                      <IconComponent size={24} color={service.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Heading level={4}>{service.title}</Heading>
                      <Caption>{service.subtitle}</Caption>
                    </View>
                  </Row>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Offre spéciale */}
        <Section variant="elevated">
          <LinearGradient colors={[colors.primary, colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg }}>
            <Stack spacing="md">
              <Heading level={3} style={{ color: '#FFFFFF' }}>🎁 Offre spéciale</Heading>
              <Body style={{ color: 'rgba(255,255,255,0.9)' }}>Profitez de 20% de réduction sur tous les services de voyage ce week-end !</Body>
              <Pressable onPress={() => navigation.push('/bookings')} style={{ backgroundColor: '#FFFFFF', borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, alignSelf: 'flex-start' }}>
                <Body style={{ color: colors.primary, fontWeight: TYPOGRAPHY.weights.bold }}>Découvrir</Body>
              </Pressable>
            </Stack>
          </LinearGradient>
        </Section>
      </Stack>
    </PageContainer>
  );
}

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTypedNavigation } from '@/utils/navigation';
import { Bell } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@/constants/colors';
import { COMMON_STYLES } from '@/constants/styles';
import { Heading, Body, Caption } from '@/components/atoms';
import { AdaptiveCard, Section, Stack, Row } from '@/components/ui';
import { PageContainer } from '@/components/layouts';
import ServiceCard from '@/components/ServiceCard';
import WalletCard from '@/components/WalletCard';
import BannerCarousel from '@/components/organisms/BannerCarousel';
import GradientBackground from '@/components/atoms/GradientBackground';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getGreetingKey } from '@/utils/greetings';
import ServiceGrid from '@/components/organisms/ServiceGrid';
import { apiService, Ad } from '@/services/api';
import { useLocation } from '@/contexts/LocationContext';

const gap = SPACING.sm; // 8px - gap optimal pour 4 colonnes

const homeAnimations = {
  taxi: require('@/assets/images/lotifile/course&livraison.json'),
  coins: require('@/assets/images/lotifile/coins.json'),
  tickets: require('@/assets/images/lotifile/tickets.json'),
  digital: require('@/assets/images/lotifile/digital.json'),
  public: require('@/assets/images/lotifile/public.json'),
  banking: require('@/assets/images/lotifile/banking.json'),
  bookings: require('@/assets/images/lotifile/Boking.json'),
  supermarket: require('@/assets/images/lotifile/supermarche.json'),
};

const getServiceLottieSpeed = (serviceId?: string | null) => {
  if (!serviceId) return 1;
  if (
    serviceId === 'billetterie' ||
    serviceId === 'bookings' ||
    serviceId === 'supermarket' ||
    serviceId === 'digital-services' ||
    serviceId === 'public-services' ||
    serviceId === 'delivery'
  ) {
    return 0.6;
  }
  return 1;
};

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useTypedNavigation();
  const router = useRouter();
  const { walletRechargeSuccess } = useLocalSearchParams<{ walletRechargeSuccess?: string }>();
  const [rechargeSuccessKey, setRechargeSuccessKey] = useState<string | undefined>(undefined);
  const { width } = useWindowDimensions(); // Hook dynamique pour la largeur
  const insets = useSafeAreaInsets();

  const [apiBanners, setApiBanners] = useState<any[]>([]);

  // Connexion au backend pour les données du wallet et utilisateur
  const { wallet } = useWallet();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { location } = useLocation();

  const [launchingService, setLaunchingService] = useState<null | {
    id: string;
    route: any;
    color: string;
    iconComponent?: any;
    animationSource?: any;
  }>(null);
  const navigatingRef = useRef(false);
  const launchOpacity = useRef(new Animated.Value(0)).current;
  const launchScale = useRef(new Animated.Value(0.6)).current;
  const loadingBarX = useRef(new Animated.Value(0)).current;
  const loadingAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  // Extraire le prénom de l'utilisateur
  const firstName = user?.full_name?.split(' ')[0] || 'Utilisateur';

  // Obtenir la salutation selon l'heure avec traductions
  const greetingKey = getGreetingKey();
  const greetingText = t(greetingKey as any); // Cast pour éviter l'erreur TypeScript

  // Données externalisées
  const { getMainServices, getTrendingServices, homeBanners } = require('@/constants/homeData');
  const mainServices = getMainServices(colors);
  const trendingServices = getTrendingServices(colors);

  const getServiceAnimationSource = useMemo(() => {
    return (serviceId: string) => {
      if (serviceId === 'delivery') return homeAnimations.taxi;
      if (serviceId === 'coins') return homeAnimations.coins;
      if (serviceId === 'billetterie') return homeAnimations.tickets;
      if (serviceId === 'digital-services') return homeAnimations.digital;
      if (serviceId === 'public-services') return homeAnimations.public;
      if (serviceId === 'supermarket') return homeAnimations.supermarket;
      if (serviceId === 'banking') return homeAnimations.banking;
      if (serviceId === 'bookings') return homeAnimations.bookings;
      return null;
    };
  }, []);

  const openServiceWithTransition = (service: any) => {
    if (launchingService) return;

    navigatingRef.current = false;
    const animationSource = getServiceAnimationSource(service.id);

    setLaunchingService({
      id: service.id,
      route: service.route as any,
      color: service.color,
      iconComponent: service.iconComponent,
      animationSource: animationSource || undefined,
    });

    launchOpacity.setValue(0);
    launchScale.setValue(0.6);
    Animated.parallel([
      Animated.timing(launchOpacity, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(launchScale, {
          toValue: 1.08,
          duration: 340,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(launchScale, {
          toValue: 1,
          duration: 160,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    if (!animationSource) {
      setTimeout(() => {
        if (navigatingRef.current) return;
        navigatingRef.current = true;
        navigation.push(service.route as any);
        setLaunchingService(null);
      }, 650);
    }
  };

  useEffect(() => {
    if (!launchingService) {
      loadingAnimRef.current?.stop();
      loadingAnimRef.current = null;
      return;
    }

    loadingBarX.setValue(0);
    const anim = Animated.loop(
      Animated.timing(loadingBarX, {
        toValue: 1,
        duration: 900,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      })
    );
    loadingAnimRef.current = anim;
    anim.start();

    return () => {
      anim.stop();
      loadingAnimRef.current = null;
    };
  }, [launchingService, loadingBarX]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiService.getAds({ type: 'banner', city: location.city || undefined });
        if (!mounted) return;

        if (res.success && Array.isArray(res.data)) {
          const mapped = (res.data as Ad[]).map((ad) => {
            const imageUrl = ad.image_url
              ? ({ uri: ad.image_url } as any)
              : undefined;

            return {
              id: ad.id,
              title: ad.title || 'Info',
              description: '',
              ctaText: 'Découvrir',
              imageUrl,
              ctaUrl: ad.link_url || undefined,
            };
          });

          setApiBanners(mapped);
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      mounted = false;
    };
  }, [location.city]);

  useEffect(() => {
    if (!walletRechargeSuccess) return;

    setRechargeSuccessKey(String(walletRechargeSuccess));
  }, [router, walletRechargeSuccess]);

  return (
    <GradientBackground style={{ flex: 1 }} opacity="10">
      <View style={{ height: insets.top }} />
      <PageContainer verticalPadding={0} style={{ backgroundColor: 'transparent' }}>
        <Stack spacing="lg">
          <View style={{ height: SPACING.xxl }} />

        {/* Carousel de banners */}
        <BannerCarousel banners={apiBanners.length > 0 ? apiBanners : homeBanners} />

        {/* Services populaires */}
        <View>
          <Heading level={3} style={{ marginBottom: SPACING.md }}>
            {t('popularServices')}
          </Heading>
          <ServiceGrid
            items={mainServices}
            gap={gap}
            paddingHorizontal={0} // PageContainer gère déjà le padding
            renderItem={(service: any, itemWidth: number) => {
              const IconComponent = service.iconComponent;

              const iconNode =
                service.id === 'delivery' ||
                  service.id === 'coins' ||
                  service.id === 'billetterie' ||
                  service.id === 'digital-services' ||
                  service.id === 'public-services' ||
                  service.id === 'supermarket' ||
                  service.id === 'banking' ||
                  service.id === 'bookings' ? (
                  <View
                    style={{
                      width:
                        service.id === 'public-services'
                          ? 76
                          : service.id === 'banking'
                            ? 60
                            : service.id === 'bookings'
                              ? 68
                              : 64,
                      height:
                        service.id === 'public-services'
                          ? 48
                          : service.id === 'banking'
                            ? 38
                            : service.id === 'coins'
                              ? 44
                              : 48,
                      overflow: 'hidden',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                    }}
                  >
                    <LottieView
                      source={
                        service.id === 'delivery'
                          ? homeAnimations.taxi
                          : service.id === 'coins'
                            ? homeAnimations.coins
                            : service.id === 'billetterie'
                              ? homeAnimations.tickets
                              : service.id === 'digital-services'
                                ? homeAnimations.digital
                                : service.id === 'supermarket'
                                  ? homeAnimations.supermarket
                                  : service.id === 'banking'
                                    ? homeAnimations.banking
                                    : service.id === 'bookings'
                                      ? homeAnimations.bookings
                                      : homeAnimations.public
                      }
                      autoPlay
                      loop
                      speed={getServiceLottieSpeed(service.id)}
                      style={{
                        width:
                          service.id === 'public-services'
                            ? 88
                            : service.id === 'banking'
                              ? 60
                              : service.id === 'bookings'
                                ? 76
                                : 64,
                        height:
                          service.id === 'public-services'
                            ? 80
                            : service.id === 'banking'
                              ? 52
                              : service.id === 'coins'
                                ? 60
                                : service.id === 'bookings'
                                  ? 76
                                  : 64,
                        transform: [
                          {
                            translateY:
                              service.id === 'coins'
                                ? -6
                                : service.id === 'billetterie'
                                  ? -8
                                  : service.id === 'digital-services'
                                    ? -8
                                    : service.id === 'supermarket'
                                      ? -8
                                      : service.id === 'banking'
                                        ? -3
                                        : service.id === 'public-services'
                                          ? -12
                                          : service.id === 'bookings'
                                            ? -10
                                            : 0,
                          },
                        ],
                      }}
                    />
                  </View>
                ) : (
                  <IconComponent size={24} color={service.color} />
                );

              return (
                <View key={service.id} style={{ width: itemWidth }}>
                  <ServiceCard
                    title={t(service.titleKey as any)}
                    icon={iconNode}
                    titleStyle={
                      service.id === 'supermarket' || service.id === 'bookings'
                        ? { marginBottom: SPACING.sm + 2 }
                        : service.id === 'coins' ||
                          service.id === 'billetterie' ||
                          service.id === 'digital-services' ||
                          service.id === 'public-services'
                          ? { marginTop: -2 }
                          : undefined
                    }
                    onPress={() => openServiceWithTransition(service)}
                  />
                </View>
              );
            }}
          />
        </View>

        {/* Wallet Card */}
        <WalletCard
          balance={wallet.balance}
          points={wallet.points}
          isLoading={wallet.isLoading}
          rechargeSuccessKey={rechargeSuccessKey}
          onRechargeSuccessAnimationFinish={() => {
            setRechargeSuccessKey(undefined);
            router.replace('/' as any);
          }}
          onRecharge={() => navigation.push('/wallet/recharge')}
          onWithdraw={() => navigation.push('/wallet/withdraw')}
        />

        {/* Services en vogue */}
        <View>
          <Heading level={3} style={{ marginBottom: SPACING.md }}>
            Services en vogue 🔥
          </Heading>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.md }}>
            {trendingServices.map((service: any) => {
              const IconComponent = service.iconComponent;
              return (
                <AdaptiveCard
                  key={service.id}
                  onPress={() => navigation.push(service.route)}
                  borderRadius={BORDER_RADIUS.lg}
                  padding={SPACING.md}
                  style={{ width: width * 0.65 }}
                >
                  <Row spacing="md" align="center">
                    <View
                      style={[
                        COMMON_STYLES.center,
                        {
                          width: 48,
                          height: 48,
                          borderRadius: BORDER_RADIUS.lg,
                          backgroundColor: service.color + '20',
                        },
                      ]}
                    >
                      <IconComponent size={20} color={service.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Heading level={4}>{service.title}</Heading>
                      <Caption>{service.subtitle}</Caption>
                    </View>
                  </Row>
                </AdaptiveCard>
              );
            })}
          </ScrollView>
        </View>

        {/* Offre spéciale */}
        <Section variant="elevated">
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg }}
          >
            <Stack spacing="md">
              <Heading level={3} style={{ color: '#FFFFFF' }}>
                🎁 Offre spéciale
              </Heading>
              <Body style={{ color: 'rgba(255,255,255,0.9)' }}>
                Profitez de 20% de réduction sur tous les services de voyage ce week-end !
              </Body>
              <Pressable
                onPress={() => navigation.push('/bookings')}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: BORDER_RADIUS.md,
                  paddingVertical: SPACING.sm,
                  paddingHorizontal: SPACING.md,
                  alignSelf: 'flex-start',
                }}
              >
                <Body style={{ color: colors.primary, fontWeight: TYPOGRAPHY.weights.bold }}>Découvrir</Body>
              </Pressable>
            </Stack>
          </LinearGradient>
        </Section>
      </Stack>

      <Modal
        visible={!!launchingService}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setLaunchingService(null);
        }}
      >
        <Animated.View style={{ flex: 1, opacity: launchOpacity }}>
          <BlurView
            intensity={8}
            tint={isDark ? 'dark' : 'light'}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <LinearGradient
              colors={[
                `${colors.gradient.start}2A`,
                `${colors.gradient.middle}22`,
                `${colors.gradient.end}2A`,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />

            <Animated.View
              style={{
                transform: [{ scale: launchScale }],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {launchingService?.animationSource ? (
                <LottieView
                  source={launchingService.animationSource}
                  autoPlay
                  loop={false}
                  speed={1.1}
                  style={{ width: 180, height: 180 }}
                  onAnimationFinish={() => {
                    if (!launchingService) return;
                    if (navigatingRef.current) return;
                    navigatingRef.current = true;
                    navigation.push(launchingService.route as any);
                    setLaunchingService(null);
                  }}
                />
              ) : launchingService?.iconComponent ? (
                (() => {
                  const Icon = launchingService.iconComponent;
                  return <Icon size={84} color={launchingService.color} />;
                })()
              ) : null}

              <View
                style={{
                  marginTop: 16,
                  width: 170,
                  height: 6,
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.14)',
                  overflow: 'hidden',
                }}
              >
                <Animated.View
                  style={{
                    width: 70,
                    height: 6,
                    borderRadius: 999,
                    backgroundColor: launchingService?.color || colors.primary,
                    opacity: 0.9,
                    transform: [
                      {
                        translateX: loadingBarX.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-70, 170],
                        }),
                      },
                    ],
                  }}
                />
              </View>
            </Animated.View>
          </BlurView>
        </Animated.View>
      </Modal>
    </PageContainer>
  </GradientBackground>
);
}

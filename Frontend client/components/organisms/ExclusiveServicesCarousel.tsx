import React, { useRef, useState, useEffect } from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';
import ExclusiveServiceCard from '@/components/molecules/ExclusiveServiceCard';

const { width } = Dimensions.get('window');

interface CoinService {
  id: string;
  name: string;
  coins: number;
  price: number;
  compareAtPrice?: number;
  currency: string;
  category: string;
  isExclusive?: boolean;
}

interface ExclusiveServicesCarouselProps {
  services: CoinService[];
  onServicePress: (service: CoinService) => void;
}

export default function ExclusiveServicesCarousel({
  services,
  onServicePress,
}: ExclusiveServicesCarouselProps) {
  const { colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const cardWidth = width - SPACING.lg * 2 - SPACING.sm; // Réduire pour moins de visibilité

  // Auto-scroll
  useEffect(() => {
    if (services.length <= 1) return;

    const interval = setInterval(() => {
      setScrollPosition((prev) => {
        const nextPosition = prev + cardWidth + SPACING.sm;
        const maxScroll = (cardWidth + SPACING.sm) * services.length;

        if (nextPosition >= maxScroll) {
          scrollViewRef.current?.scrollTo({ x: 0, animated: true });
          return 0;
        }

        scrollViewRef.current?.scrollTo({ x: nextPosition, animated: true });
        return nextPosition;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [services.length, cardWidth]);

  if (services.length === 0) return null;

  return (
    <View style={{ marginTop: SPACING.sm, marginBottom: SPACING.lg }}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: SPACING.lg,
          gap: SPACING.sm,
        }}
        onScroll={(e) => setScrollPosition(e.nativeEvent.contentOffset.x)}
        scrollEventThrottle={16}
      >
        {services.map((service) => (
          <ExclusiveServiceCard
            key={service.id}
            coins={service.coins}
            price={service.price}
            compareAtPrice={service.compareAtPrice}
            currency={service.currency}
            onPress={() => onServicePress(service)}
            width={cardWidth}
          />
        ))}
      </ScrollView>

      {/* Pagination dots */}
      {services.length > 1 && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: SPACING.xs,
            marginTop: SPACING.md,
          }}
        >
          {services.map((_, index) => {
            const isActive = Math.round(scrollPosition / (cardWidth + SPACING.sm)) === index;
            return (
              <View
                key={index}
                style={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: isActive ? colors.primary : colors.border,
                  width: isActive ? 20 : 8,
                }}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

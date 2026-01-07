import React, { useRef, useState, useEffect } from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';

const { width } = Dimensions.get('window');

interface ExclusiveCarouselProps<T> {
  items: T[];
  renderItem: (item: T, width: number) => React.ReactNode;
  autoScrollInterval?: number;
  cardGap?: number;
}

/**
 * Carrousel générique pour afficher des offres exclusives avec auto-scroll
 * 
 * @example
 * <ExclusiveCarousel
 *   items={exclusiveServices}
 *   renderItem={(service, width) => (
 *     <ExclusiveServiceCard {...service} width={width} />
 *   )}
 * />
 */
export default function ExclusiveCarousel<T extends { id: string }>({
  items,
  renderItem,
  autoScrollInterval = 3000,
  cardGap = SPACING.sm,
}: ExclusiveCarouselProps<T>) {
  const { colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const cardWidth = width - SPACING.md * 2; // Augmentation de la largeur des cartes exclusives

  // Auto-scroll
  useEffect(() => {
    if (items.length <= 1) return;

    const interval = setInterval(() => {
      setScrollPosition((prev) => {
        const nextPosition = prev + cardWidth + cardGap;
        const maxScroll = (cardWidth + cardGap) * items.length;

        if (nextPosition >= maxScroll) {
          scrollViewRef.current?.scrollTo({ x: 0, animated: true });
          return 0;
        }

        scrollViewRef.current?.scrollTo({ x: nextPosition, animated: true });
        return nextPosition;
      });
    }, autoScrollInterval);

    return () => clearInterval(interval);
  }, [items.length, cardWidth, cardGap, autoScrollInterval]);

  if (items.length === 0) return null;

  return (
    <View style={{ marginTop: SPACING.md, marginBottom: SPACING.lg }}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: SPACING.md, // Cohérent avec la largeur des cartes
          gap: cardGap,
        }}
        onScroll={(e) => setScrollPosition(e.nativeEvent.contentOffset.x)}
        scrollEventThrottle={16}
      >
        {items.map((item) => (
          <View key={item.id}>
            {renderItem(item, cardWidth)}
          </View>
        ))}
      </ScrollView>

      {/* Pagination dots */}
      {items.length > 1 && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: SPACING.xs,
            marginTop: SPACING.md,
          }}
        >
          {items.map((_, index) => {
            const isActive = Math.round(scrollPosition / (cardWidth + cardGap)) === index;
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

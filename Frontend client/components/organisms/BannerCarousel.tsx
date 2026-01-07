/**
 * BannerCarousel - Carousel de banners promotionnels
 * Organism réutilisable pour afficher les bannières avec pagination
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, useWindowDimensions } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';
import { COMMON_STYLES } from '@/constants/styles';
import AdBanner from '@/components/AdBanner';
import GradientDot from '@/components/atoms/GradientDot';
import { HomeBanner } from '@/constants/homeData';

interface BannerCarouselProps {
  banners: HomeBanner[];
  autoScrollInterval?: number;
  showPagination?: boolean;
  peekAmount?: number; // Quantité de peek du banner suivant
}

export default function BannerCarousel({ 
  banners, 
  autoScrollInterval = 4000,
  showPagination = true,
  peekAmount = 30
}: BannerCarouselProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Largeur de chaque item avec peek
  const itemWidth = width - (SPACING.md * 2) - peekAmount;

  // Auto-scroll
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setScrollPosition((prev) => {
        const nextPosition = prev + itemWidth + SPACING.sm;
        const maxScroll = (itemWidth + SPACING.sm) * banners.length;

        if (nextPosition >= maxScroll) {
          scrollViewRef.current?.scrollTo({ x: 0, animated: true });
          return 0;
        }

        scrollViewRef.current?.scrollTo({ x: nextPosition, animated: true });
        return nextPosition;
      });
    }, autoScrollInterval);

    return () => clearInterval(interval);
  }, [banners.length, itemWidth, autoScrollInterval]);

  if (banners.length === 0) return null;

  return (
    <View>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        snapToInterval={itemWidth + SPACING.sm}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingLeft: SPACING.md,
          paddingRight: SPACING.md + peekAmount,
        }}
        onScroll={(e) => setScrollPosition(e.nativeEvent.contentOffset.x)}
        scrollEventThrottle={16}
      >
        {banners.map((banner, index) => (
          <View 
            key={banner.id} 
            style={{ 
              width: itemWidth,
              marginRight: index < banners.length - 1 ? SPACING.sm : 0
            }}
          >
            <AdBanner
              title={banner.title}
              description={banner.description}
              ctaText={banner.ctaText}
              imageUrl={banner.imageUrl}
              closeable={false}
            />
          </View>
        ))}
      </ScrollView>

      {/* Pagination dots */}
      {showPagination && banners.length > 1 && (
        <View style={[
          COMMON_STYLES.rowCenter, 
          { justifyContent: 'center', marginTop: SPACING.sm, gap: SPACING.xs }
        ]}>
          {banners.map((_, index) => {
            const isActive = Math.round(scrollPosition / (itemWidth + SPACING.sm)) === index;
            
            if (isActive) {
              return (
                <GradientDot
                  key={index}
                  width={20}
                  height={8}
                />
              );
            }
            
            return (
              <View
                key={index}
                style={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.border,
                  width: 8,
                }}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

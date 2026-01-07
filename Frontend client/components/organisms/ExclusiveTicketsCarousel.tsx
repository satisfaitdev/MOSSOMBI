import React, { useRef, useState, useEffect } from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';
import ExclusiveTicketCard from '@/components/molecules/ExclusiveTicketCard';

const { width } = Dimensions.get('window');

interface TicketEvent {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  date: string;
  location: string;
}

interface ExclusiveTicketsCarouselProps {
  events: TicketEvent[];
  onEventPress: (event: TicketEvent) => void;
}

export default function ExclusiveTicketsCarousel({
  events,
  onEventPress,
}: ExclusiveTicketsCarouselProps) {
  const { colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const cardWidth = width - SPACING.lg * 2 - SPACING.sm; // Réduire pour moins de visibilité

  // Auto-scroll
  useEffect(() => {
    if (events.length <= 1) return;

    const interval = setInterval(() => {
      setScrollPosition((prev) => {
        const nextPosition = prev + cardWidth + SPACING.sm;
        const maxScroll = (cardWidth + SPACING.sm) * events.length;

        if (nextPosition >= maxScroll) {
          scrollViewRef.current?.scrollTo({ x: 0, animated: true });
          return 0;
        }

        scrollViewRef.current?.scrollTo({ x: nextPosition, animated: true });
        return nextPosition;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [events.length, cardWidth]);

  if (events.length === 0) return null;

  return (
    <View style={{ marginTop: SPACING.lg, marginBottom: SPACING.lg }}>
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
        {events.map((event) => (
          <ExclusiveTicketCard
            key={event.id}
            name={event.name}
            description={event.description}
            price={event.price}
            compareAtPrice={event.compareAtPrice}
            date={event.date}
            location={event.location}
            onPress={() => onEventPress(event)}
            width={cardWidth}
          />
        ))}
      </ScrollView>

      {/* Pagination dots */}
      {events.length > 1 && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: SPACING.xs,
            marginTop: SPACING.md,
          }}
        >
          {events.map((_, index) => {
            const isActive = Math.floor(scrollPosition / (cardWidth + SPACING.sm)) === index;
            return (
              <View
                key={index}
                style={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: isActive ? colors.primary : colors.border,
                  width: isActive ? 24 : 8,
                }}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

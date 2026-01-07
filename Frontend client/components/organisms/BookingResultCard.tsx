/**
 * CARTE DE RÉSULTAT DE RÉSERVATION RÉUTILISABLE
 *
 * Composant générique pour afficher les résultats de recherche
 * dans les pages de réservation (hôtel, vol, voiture, bus, train).
 *
 * @example
 * ```tsx
 * <BookingResultCard
 *   title="Hôtel Memling"
 *   subtitle="Gombe, Kinshasa"
 *   rating={4.8}
 *   reviewCount={124}
 *   price={180000}
 *   currency="CDF"
 *   compareAtPrice={220000}
 *   badges={['WiFi', 'Piscine', 'Spa']}
 *   features={[
 *     { icon: Users, label: '4 invités max' },
 *     { icon: MapPin, label: 'Centre-ville' }
 *   ]}
 *   onPress={() => handleBooking(item)}
 *   onBook={() => handleBooking(item)}
 * />
 * ```
 */

import React from 'react';
import { Pressable, View, ScrollView } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS , SHADOWS } from '@/constants/colors';

// Composants du design system
import { Heading, Body, Caption, Badge } from '@/components/atoms';
import { Section, Stack, Row } from '@/components/ui';
import { RatingDisplay, PriceDisplay } from '@/components/molecules';
import Button from '@/components/Button';
import { LucideIcon } from 'lucide-react-native';

interface Feature {
  icon: LucideIcon;
  label: string;
}

interface BookingResultCardProps {
  title: string;
  subtitle: string;
  rating: number;
  reviewCount: number;
  price: number;
  currency: string;
  compareAtPrice?: number;
  badges?: string[];
  features?: Feature[];
  availability?: {
    status: 'available' | 'limited' | 'unavailable';
    text: string;
  };
  onPress: () => void;
  onBook: () => void;
  bookButtonText?: string;
  disabled?: boolean;
}

export default function BookingResultCard({
  title,
  subtitle,
  rating,
  reviewCount,
  price,
  currency,
  compareAtPrice,
  badges = [],
  features = [],
  availability,
  onPress,
  onBook,
  bookButtonText = 'Réserver',
  disabled = false,
}: BookingResultCardProps) {
  const { colors } = useTheme();

  return (
    <Section variant="elevated">
      <Pressable onPress={onPress} disabled={disabled}>
        <Stack spacing="md">
          {/* Header */}
          <Row justify="space-between" align="flex-start">
            <View style={{ flex: 1 }}>
              <Heading level={3}>{title}</Heading>
              <Caption style={{ marginTop: SPACING.xs }}>
                {subtitle}
              </Caption>
            </View>
            {availability && (
              <Badge
                variant={
                  availability.status === 'available' ? 'success' :
                  availability.status === 'limited' ? 'warning' : 'error'
                }
              >
                {availability.text}
              </Badge>
            )}
          </Row>

          {/* Rating et Features */}
          <Row spacing="md" align="center">
            <RatingDisplay
              rating={rating}
              reviewCount={reviewCount}
              size={14}
            />
            {features.map((feature, index) => (
              <Row key={index} spacing="xs">
                <feature.icon size={14} color={colors.textSecondary} />
                <Caption>{feature.label}</Caption>
              </Row>
            ))}
          </Row>

          {/* Badges */}
          {badges.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Row spacing="xs">
                {badges.map((badge, index) => (
                  <Badge key={index} variant="info" size="sm">
                    {badge}
                  </Badge>
                ))}
              </Row>
            </ScrollView>
          )}

          {/* Price et Action */}
          <Row justify="space-between" align="center">
            <PriceDisplay
              price={price}
              compareAtPrice={compareAtPrice}
              currency={currency}
              showDiscount
            />
            <Button
              title={bookButtonText}
              onPress={onBook}
              variant="primary"
              size="md"
              disabled={disabled}
            />
          </Row>
        </Stack>
      </Pressable>
    </Section>
  );
}

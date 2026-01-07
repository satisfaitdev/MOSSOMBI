import { Image } from 'expo-image';
import { Star } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Card from '@/components/Card';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/constants/colors';

interface NativeAdProps {
  title: string;
  description: string;
  imageUrl: string;
  rating?: number;
  ctaText?: string;
  onPress?: () => void;
}

export default function NativeAd({
  title,
  description,
  imageUrl,
  rating,
  ctaText = 'Installer',
  onPress,
}: NativeAdProps) {
  const { colors } = useTheme();

  return (
    <Card padding="md">
      <View style={[styles.adBadge, { backgroundColor: colors.textTertiary + '40', borderRadius: BORDER_RADIUS.sm, alignSelf: 'flex-start', marginBottom: SPACING.sm }]}>
        <Text style={[styles.adBadgeText, { color: colors.textSecondary, fontSize: TYPOGRAPHY.sizes.xs }]}>
          Annonce
        </Text>
      </View>

      <View style={styles.content}>
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, { borderRadius: BORDER_RADIUS.md }]}
          contentFit="cover"
        />

        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.text, fontSize: TYPOGRAPHY.sizes.md, fontWeight: TYPOGRAPHY.weights.bold }]} numberOfLines={2}>
            {title}
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary, fontSize: TYPOGRAPHY.sizes.sm, marginTop: SPACING.xs }]} numberOfLines={2}>
            {description}
          </Text>

          {rating && (
            <View style={[styles.rating, { marginTop: SPACING.xs }]}>
              <Star size={14} color={colors.accent} fill={colors.accent} />
              <Text style={[styles.ratingText, { color: colors.textSecondary, fontSize: TYPOGRAPHY.sizes.xs }]}>
                {rating.toFixed(1)}
              </Text>
            </View>
          )}

          <Pressable
            onPress={onPress}
            style={({ pressed }) => [
              styles.ctaButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1, borderRadius: BORDER_RADIUS.md, marginTop: SPACING.md },
            ]}
          >
            <Text style={[styles.ctaText, { fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.semibold }]}>
              {ctaText}
            </Text>
          </Pressable>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  adBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  adBadgeText: {},
  content: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  image: {
    width: 80,
    height: 80,
  },
  info: {
    flex: 1,
  },
  title: {},
  description: {},
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  ratingText: {},
  ctaButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
  },
});

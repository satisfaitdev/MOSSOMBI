import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '@/constants/colors';

const { width } = Dimensions.get('window');

interface CategoryCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  iconColor?: string;
  isNew?: boolean;
  onPress: () => void;
}

/**
 * Carte de catégorie/service pour les pages de navigation
 * Utilisée dans: public-services, supermarket, bookings, delivery
 */
export default function CategoryCard({
  name,
  description,
  icon,
  iconColor,
  isNew,
  onPress,
}: CategoryCardProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.card,
          borderRadius: BORDER_RADIUS.xl,
          opacity: pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        SHADOWS.md,
      ]}
    >
      {/* Badge NOUVEAU */}
      {isNew && (
        <View
          style={[
            styles.newBadge,
            {
              backgroundColor: colors.primary,
              borderRadius: BORDER_RADIUS.full,
            },
          ]}
        >
          <Text
            style={[
              styles.newBadgeText,
              {
                fontSize: TYPOGRAPHY.sizes.xs,
                fontWeight: TYPOGRAPHY.weights.bold,
              },
            ]}
          >
            NOUVEAU
          </Text>
        </View>
      )}

      {/* Icône */}
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: iconColor ? iconColor + '15' : colors.primary + '15',
            borderRadius: BORDER_RADIUS.lg,
          },
        ]}
      >
        {icon}
      </View>

      {/* Contenu */}
      <View style={styles.content}>
        <Text
          style={[
            styles.name,
            {
              color: colors.text,
              fontSize: TYPOGRAPHY.sizes.sm,
              fontWeight: TYPOGRAPHY.weights.semibold,
            },
          ]}
          numberOfLines={2}
        >
          {name}
        </Text>
        <Text
          style={[
            styles.description,
            {
              color: colors.textSecondary,
              fontSize: TYPOGRAPHY.sizes.xs,
            },
          ]}
          numberOfLines={2}
        >
          {description}
        </Text>
      </View>

      {/* Flèche */}
      <View style={styles.arrow}>
        <ChevronRight size={20} color={colors.textTertiary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: (width - SPACING.lg * 2 - SPACING.md) / 2,
    padding: SPACING.md,
    minHeight: 160,
    position: 'relative',
  },
  newBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    zIndex: 1,
  },
  newBadgeText: {
    color: '#FFFFFF',
  },
  iconContainer: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  content: {
    flex: 1,
    marginBottom: SPACING.xs,
  },
  name: {
    marginBottom: SPACING.xs,
  },
  description: {
    lineHeight: 16,
  },
  arrow: {
    alignSelf: 'flex-end',
  },
});

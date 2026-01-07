import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/colors';

interface VlogServiceCardProps {
  title: string;
  description: string;
  price: string;
  icon: React.ReactNode;
  iconColor?: string;
  onPress: () => void;
  badge?: string;
  testID?: string;
}

export default function VlogServiceCard({
  title,
  description,
  price,
  icon,
  iconColor,
  onPress,
  badge,
  testID,
}: VlogServiceCardProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: BORDER_RADIUS.lg,
          padding: SPACING.md,
          opacity: pressed ? 0.7 : 1,
        },
        SHADOWS.sm,
      ]}
    >
      {badge && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: colors.accent,
              borderRadius: BORDER_RADIUS.sm,
              paddingHorizontal: 6,
              paddingVertical: 2,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                color: '#FFFFFF',
                fontSize: 9,
                fontWeight: TYPOGRAPHY.weights.semibold,
              },
            ]}
          >
            {badge}
          </Text>
        </View>
      )}
      
      <View style={[styles.iconContainer, { marginBottom: SPACING.sm }]}>
        <View style={[
          styles.iconBackground,
          {
            backgroundColor: (iconColor || colors.primary) + '15', // 15% d'opacité
            borderRadius: BORDER_RADIUS.md,
            padding: SPACING.sm,
          }
        ]}>
          {icon}
        </View>
      </View>
      
      <Text
        style={[
          styles.title,
          {
            color: colors.text,
            fontSize: TYPOGRAPHY.sizes.sm,
            fontWeight: TYPOGRAPHY.weights.medium,
          },
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>
      
      <Text
        style={[
          styles.description,
          {
            color: colors.textSecondary,
            fontSize: TYPOGRAPHY.sizes.xs,
            marginTop: 4,
          },
        ]}
        numberOfLines={2}
      >
        {description}
      </Text>
      
      <Text
        style={[
          styles.price,
          {
            color: colors.primary,
            fontSize: TYPOGRAPHY.sizes.sm,
            fontWeight: TYPOGRAPHY.weights.bold,
            marginTop: SPACING.xs,
          },
        ]}
      >
        {price}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    minHeight: 140,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    zIndex: 1,
  },
  badgeText: {},
  iconContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  iconBackground: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'left',
    width: '100%',
  },
  description: {
    textAlign: 'left',
    width: '100%',
  },
  price: {
    textAlign: 'left',
    width: '100%',
  },
});

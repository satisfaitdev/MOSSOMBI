import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/colors';

interface ServiceCardProps {
  title: string;
  icon: React.ReactNode;
  iconColor?: string;
  onPress: () => void;
  badge?: string;
  testID?: string;
}

export default function ServiceCard({
  title,
  icon,
  iconColor,
  onPress,
  badge,
  testID,
}: ServiceCardProps) {
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
          paddingVertical: SPACING.xs,
          paddingHorizontal: SPACING.xs,
          opacity: pressed ? 0.7 : 1,
          borderWidth: 1,
          borderColor: colors.border,
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
              paddingHorizontal: 4,
              paddingVertical: 1,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                color: '#FFFFFF',
                fontSize: 8,
                fontWeight: TYPOGRAPHY.weights.semibold,
              },
            ]}
          >
            {badge}
          </Text>
        </View>
      )}
      <View style={[styles.iconContainer, { marginBottom: SPACING.xs }]}>
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
            fontSize: 9,
            fontWeight: TYPOGRAPHY.weights.regular,
          },
        ]}
        numberOfLines={2}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1.05, // Plus large que haut pour réduire encore la hauteur
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBackground: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
});

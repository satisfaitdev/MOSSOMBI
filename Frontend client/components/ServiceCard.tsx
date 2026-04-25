import React from 'react';
import { StyleSheet, Text, View, type TextStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/constants/colors';
import { AdaptiveCard } from '@/components/ui';

interface ServiceCardProps {
  title: string;
  icon: React.ReactNode;
  iconColor?: string;
  onPress: () => void;
  badge?: string;
  testID?: string;
  titleStyle?: TextStyle;
}

export default function ServiceCard({
  title,
  icon,
  iconColor: _iconColor,
  onPress,
  badge,
  testID,
  titleStyle,
}: ServiceCardProps) {
  const { colors } = useTheme();

  return (
    <AdaptiveCard
      onPress={onPress}
      testID={testID}
      padding={0}
      borderRadius={BORDER_RADIUS.lg}
      elevation={0}
      variant="outlined"
      margin={0}
      style={[styles.card, { backgroundColor: colors.card }]}
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
      <View style={[styles.iconContainer, { marginBottom: 0 }]}>
        {icon}
      </View>
      <Text
        style={[
          styles.title,
          {
            color: colors.text,
            fontSize: 8,
            fontWeight: TYPOGRAPHY.weights.regular,
          },
          titleStyle,
        ]}
        numberOfLines={2}
      >
        {title}
      </Text>
    </AdaptiveCard>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1.25,
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
  title: {
    textAlign: 'center',
  },
});

import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SHADOWS, SPACING } from '@/constants/colors';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'gradient' | 'outline';
  padding?: keyof typeof SPACING;
  style?: ViewStyle;
  testID?: string;
}

export default function Card({
  children,
  onPress,
  variant = 'default',
  padding = 'md',
  style,
  testID,
}: CardProps) {
  const { colors } = useTheme();

  const cardStyle = [
    styles.card,
    {
      backgroundColor: variant === 'outline' ? 'transparent' : colors.card,
      borderRadius: BORDER_RADIUS.xl,
      padding: SPACING[padding],
      borderWidth: variant === 'outline' ? 1 : 0,
      borderColor: colors.border,
    },
    variant !== 'gradient' && SHADOWS.md,
    style,
  ];

  if (variant === 'gradient') {
    const content = <View style={{ padding: SPACING[padding] }}>{children}</View>;

    if (onPress) {
      return (
        <Pressable
          onPress={onPress}
          testID={testID}
          style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
        >
          <LinearGradient
            colors={[colors.gradient.start, colors.gradient.middle, colors.gradient.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, { borderRadius: BORDER_RADIUS.xl }, SHADOWS.lg]}
          >
            {content}
          </LinearGradient>
        </Pressable>
      );
    }

    return (
      <LinearGradient
        colors={[colors.gradient.start, colors.gradient.middle, colors.gradient.end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { borderRadius: BORDER_RADIUS.xl }, SHADOWS.lg]}
      >
        {content}
      </LinearGradient>
    );
  }

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        testID={testID}
        style={({ pressed }) => [cardStyle, { opacity: pressed ? 0.8 : 1 }]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={cardStyle} testID={testID}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});

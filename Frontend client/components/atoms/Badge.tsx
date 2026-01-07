import React from 'react';
import { Text, View, ViewStyle, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/constants/colors';

// ==========================================
// TYPES
// ==========================================

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
  onPress?: () => void;
}

// ==========================================
// BADGE COMPONENT
// ==========================================

/**
 * Badge component pour afficher des statuts, tags, ou compteurs
 * 
 * @example
 * <Badge variant="success">En stock</Badge>
 * <Badge variant="warning">Stock limité</Badge>
 * <Badge variant="error">Épuisé</Badge>
 * <Badge variant="info">Nouveau</Badge>
 */
export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  style,
  onPress,
}: BadgeProps) {
  const { colors } = useTheme();

  const variantStyles = {
    success: {
      backgroundColor: colors.success + '20',
      color: colors.success,
    },
    warning: {
      backgroundColor: colors.warning + '20',
      color: colors.warning,
    },
    error: {
      backgroundColor: colors.error + '20',
      color: colors.error,
    },
    info: {
      backgroundColor: colors.info + '20',
      color: colors.info,
    },
    default: {
      backgroundColor: colors.primary + '20',
      color: colors.primary,
    },
  };

  const sizeStyles = {
    sm: {
      paddingHorizontal: SPACING.xs,
      paddingVertical: 2,
      fontSize: TYPOGRAPHY.sizes.xs,
      borderRadius: BORDER_RADIUS.sm,
    },
    md: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
      fontSize: TYPOGRAPHY.sizes.sm,
      borderRadius: BORDER_RADIUS.md,
    },
    lg: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      fontSize: TYPOGRAPHY.sizes.md,
      borderRadius: BORDER_RADIUS.lg,
    },
  };

  const content = (
    <Text
      style={[
        styles.text,
        {
          color: variantStyles[variant].color,
          fontSize: sizeStyles[size].fontSize,
          fontWeight: TYPOGRAPHY.weights.semibold,
        },
      ]}
    >
      {children}
    </Text>
  );

  const containerStyle = [
    styles.badge,
    {
      backgroundColor: variantStyles[variant].backgroundColor,
      paddingHorizontal: sizeStyles[size].paddingHorizontal,
      paddingVertical: sizeStyles[size].paddingVertical,
      borderRadius: sizeStyles[size].borderRadius,
    },
    style,
  ] as const;

  if (onPress) {
    return (
      <Pressable style={({ pressed }) => [containerStyle as any, { opacity: pressed ? 0.8 : 1 }]} onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return <View style={containerStyle as any}>{content}</View>;
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  text: {
    textAlign: 'center',
  },
});

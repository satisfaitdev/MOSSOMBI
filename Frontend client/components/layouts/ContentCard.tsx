import React from 'react';
import { View, ViewStyle, Pressable } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/colors';

interface ContentCardProps {
  children: React.ReactNode;
  /** Rendre la card cliquable */
  onPress?: () => void;
  /** Padding interne (défaut: SPACING.md) */
  padding?: number;
  /** Afficher l'ombre */
  shadow?: boolean;
  /** Style supplémentaire */
  style?: ViewStyle;
  /** Désactiver le pressable */
  disabled?: boolean;
}

/**
 * Card standardisée pour afficher du contenu
 * Utilisée dans: orders, team, transactions, backpack, etc.
 */
export default function ContentCard({
  children,
  onPress,
  padding = SPACING.md,
  shadow = true,
  style,
  disabled = false,
}: ContentCardProps) {
  const { colors } = useTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: colors.card,
    borderRadius: BORDER_RADIUS.lg,
    padding,
    borderWidth: 1,
    borderColor: colors.border,
    ...(shadow ? SHADOWS.sm : {}),
    ...style,
  };

  if (onPress && !disabled) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          cardStyle,
          { opacity: pressed ? 0.7 : 1 },
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

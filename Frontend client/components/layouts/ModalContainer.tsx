import React from 'react';
import { View, ViewStyle, DimensionValue } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '@/constants/colors';

interface ModalContainerProps {
  children: React.ReactNode;
  /** Padding horizontal (défaut: SPACING.md = 16px, même que PageContainer) */
  horizontalPadding?: number;
  /** Padding vertical (défaut: SPACING.lg = 24px) */
  verticalPadding?: number;
  /** Padding bottom spécifique pour iOS (défaut: SPACING.lg) */
  bottomPadding?: number;
  /** Hauteur maximale du modal (défaut: '50%') */
  maxHeight?: DimensionValue;
  /** Style supplémentaire */
  style?: ViewStyle;
}

/**
 * Container standardisé pour tous les modals bottom-sheet
 * Assure un padding cohérent avec PageContainer
 * Centralise la gestion des marges des modals
 */
export default function ModalContainer({
  children,
  horizontalPadding = SPACING.md, // Même valeur que PageContainer
  verticalPadding = SPACING.lg,
  bottomPadding,
  maxHeight = '50%',
  style,
}: ModalContainerProps) {
  const { colors } = useTheme();

  const containerStyle: ViewStyle = {
    backgroundColor: colors.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingHorizontal: horizontalPadding,
    paddingVertical: verticalPadding,
    paddingBottom: bottomPadding || verticalPadding,
    maxHeight,
    ...style,
  };

  return <View style={containerStyle}>{children}</View>;
}

import React from 'react';
import { ScrollView, View, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';

interface PageContainerProps {
  children: React.ReactNode;
  /** Utilise ScrollView au lieu de View */
  scrollable?: boolean;
  /** Padding horizontal (défaut: SPACING.md = 16px) */
  horizontalPadding?: number;
  /** Padding vertical (défaut: SPACING.lg = 24px) */
  verticalPadding?: number;
  /** Style supplémentaire */
  style?: ViewStyle;
  /** Props supplémentaires pour ScrollView */
  scrollViewProps?: React.ComponentProps<typeof ScrollView>;
}

/**
 * Container standardisé pour toutes les pages
 * Assure un padding cohérent sur toutes les pages
 * Padding horizontal: SPACING.md (16px)
 * Padding vertical: 24px (SPACING.lg)
 */
export default function PageContainer({
  children,
  scrollable = true,
  horizontalPadding = SPACING.md,
  verticalPadding = SPACING.lg,
  style,
  scrollViewProps,
}: PageContainerProps) {
  const { colors } = useTheme();

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.background,
    ...style,
  };

  const contentStyle: ViewStyle = {
    paddingHorizontal: horizontalPadding,
    paddingVertical: verticalPadding,
  };

  if (scrollable) {
    return (
      <View style={containerStyle}>
        <ScrollView
          contentContainerStyle={contentStyle}
          showsVerticalScrollIndicator={false}
          {...scrollViewProps}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[containerStyle, contentStyle]}>
      {children}
    </View>
  );
}

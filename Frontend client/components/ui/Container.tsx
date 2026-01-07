import React from 'react';
import { View, ViewProps, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SHADOWS, SPACING } from '@/constants/colors';

// ==========================================
// TYPES
// ==========================================

type SpacingValue = keyof typeof SPACING;
type Direction = 'vertical' | 'horizontal';
type JustifyContent = 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
type AlignItems = 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';

interface BaseContainerProps extends Omit<ViewProps, 'style'> {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface SectionProps extends BaseContainerProps {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: SpacingValue;
}

interface BoxProps extends BaseContainerProps {
  padding?: SpacingValue;
  paddingHorizontal?: SpacingValue;
  paddingVertical?: SpacingValue;
  margin?: SpacingValue;
  marginHorizontal?: SpacingValue;
  marginVertical?: SpacingValue;
  backgroundColor?: string;
  borderRadius?: keyof typeof BORDER_RADIUS;
}

interface StackProps extends BaseContainerProps {
  spacing?: SpacingValue;
  direction?: Direction;
  justify?: JustifyContent;
  align?: AlignItems;
}

// ==========================================
// SECTION COMPONENT
// ==========================================

/**
 * Section component pour les grandes sections de contenu
 * 
 * @example
 * <Section>Contenu</Section>
 * <Section variant="elevated">Contenu avec ombre</Section>
 * <Section variant="outlined">Contenu avec bordure</Section>
 */
export function Section({
  children,
  variant = 'default',
  padding = 'md',
  style,
  ...props
}: SectionProps) {
  const { colors } = useTheme();
  
  const variantStyles = {
    default: {
      backgroundColor: colors.surface,
    },
    elevated: {
      backgroundColor: colors.card,
      ...SHADOWS.md,
    },
    outlined: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
  };

  return (
    <View
      style={[
        styles.section,
        variantStyles[variant],
        {
          padding: SPACING[padding],
          borderRadius: BORDER_RADIUS.lg,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

// ==========================================
// BOX COMPONENT
// ==========================================

/**
 * Box component utilitaire pour spacing et layout
 * 
 * @example
 * <Box padding="md" backgroundColor="surface">Contenu</Box>
 * <Box paddingHorizontal="lg" paddingVertical="sm">Contenu</Box>
 */
export function Box({
  children,
  padding,
  paddingHorizontal,
  paddingVertical,
  margin,
  marginHorizontal,
  marginVertical,
  backgroundColor,
  borderRadius,
  style,
  ...props
}: BoxProps) {
  const { colors } = useTheme();
  
  const boxStyle: ViewStyle = {};
  
  if (padding) boxStyle.padding = SPACING[padding];
  if (paddingHorizontal) boxStyle.paddingHorizontal = SPACING[paddingHorizontal];
  if (paddingVertical) boxStyle.paddingVertical = SPACING[paddingVertical];
  if (margin) boxStyle.margin = SPACING[margin];
  if (marginHorizontal) boxStyle.marginHorizontal = SPACING[marginHorizontal];
  if (marginVertical) boxStyle.marginVertical = SPACING[marginVertical];
  if (backgroundColor) boxStyle.backgroundColor = (colors as any)[backgroundColor] || backgroundColor;
  if (borderRadius) boxStyle.borderRadius = BORDER_RADIUS[borderRadius];

  return (
    <View
      style={[
        boxStyle,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

// ==========================================
// STACK COMPONENT
// ==========================================

/**
 * Stack component pour empiler des éléments avec espacement
 * 
 * @example
 * <Stack spacing="md">
 *   <Item />
 *   <Item />
 *   <Item />
 * </Stack>
 * <Stack spacing="lg" direction="horizontal" justify="space-between">
 *   <Item />
 *   <Item />
 * </Stack>
 */
export function Stack({
  children,
  spacing = 'md',
  direction = 'vertical',
  justify = 'flex-start',
  align = 'stretch',
  style,
  ...props
}: StackProps) {
  const spacingValue = SPACING[spacing];
  
  return (
    <View
      style={[
        styles.stack,
        {
          flexDirection: direction === 'vertical' ? 'column' : 'row',
          justifyContent: justify,
          alignItems: align,
          gap: spacingValue,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

// ==========================================
// ROW COMPONENT (Alias de Stack horizontal)
// ==========================================

/**
 * Row component pour aligner des éléments horizontalement
 * 
 * @example
 * <Row spacing="sm">
 *   <Icon />
 *   <Text>Texte</Text>
 * </Row>
 * <Row spacing="md" justify="space-between" align="center">
 *   <LeftContent />
 *   <RightContent />
 * </Row>
 */
export function Row({
  children,
  spacing = 'md',
  justify = 'flex-start',
  align = 'center',
  style,
  ...props
}: Omit<StackProps, 'direction'>) {
  return (
    <Stack
      spacing={spacing}
      direction="horizontal"
      justify={justify}
      align={align}
      style={style}
      {...props}
    >
      {children}
    </Stack>
  );
}

// ==========================================
// DIVIDER COMPONENT
// ==========================================

/**
 * Divider component pour séparer des sections
 * 
 * @example
 * <Divider />
 * <Divider spacing="lg" />
 */
export function Divider({
  spacing = 'md',
  style,
  ...props
}: {
  spacing?: SpacingValue;
  style?: ViewStyle;
} & ViewProps) {
  const { colors } = useTheme();
  
  return (
    <View
      style={[
        styles.divider,
        {
          height: 1,
          backgroundColor: colors.border,
          marginVertical: SPACING[spacing],
        },
        style,
      ]}
      {...props}
    />
  );
}

// ==========================================
// SPACER COMPONENT
// ==========================================

/**
 * Spacer component pour ajouter de l'espace vertical ou horizontal
 * 
 * @example
 * <Spacer size="lg" />
 * <Spacer size="md" direction="horizontal" />
 */
export function Spacer({
  size = 'md',
  direction = 'vertical',
}: {
  size?: SpacingValue;
  direction?: Direction;
}) {
  const spacingValue = SPACING[size];
  
  return (
    <View
      style={{
        [direction === 'vertical' ? 'height' : 'width']: spacingValue,
      }}
    />
  );
}

// ==========================================
// CENTER COMPONENT
// ==========================================

/**
 * Center component pour centrer le contenu
 * 
 * @example
 * <Center>
 *   <Icon />
 *   <Text>Contenu centré</Text>
 * </Center>
 */
export function Center({
  children,
  style,
  ...props
}: BaseContainerProps) {
  return (
    <View
      style={[
        styles.center,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  section: {
    overflow: 'hidden',
  },
  stack: {
    // Gap est géré dynamiquement dans le style inline
  },
  divider: {
    width: '100%',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ==========================================
// EXPORTS
// ==========================================

export default {
  Section,
  Box,
  Stack,
  Row,
  Divider,
  Spacer,
  Center,
};

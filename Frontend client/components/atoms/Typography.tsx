import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { TYPOGRAPHY } from '@/constants/colors';
import { AdaptiveText } from '@/components/ui/AdaptiveText';

// ==========================================
// TYPES
// ==========================================

type HeadingLevel = 1 | 2 | 3 | 4;
type BodyVariant = 'regular' | 'secondary' | 'tertiary';
type TextAlign = 'left' | 'center' | 'right' | 'justify';

interface BaseTypographyProps extends Omit<TextProps, 'style'> {
  children: React.ReactNode;
  align?: TextAlign;
  color?: string;
  style?: TextProps['style'];
}

interface HeadingProps extends BaseTypographyProps {
  level?: HeadingLevel;
}

interface BodyProps extends BaseTypographyProps {
  variant?: BodyVariant;
}

interface LabelProps extends BaseTypographyProps {
  required?: boolean;
}

// ==========================================
// HEADING COMPONENT
// ==========================================

/**
 * Heading component pour les titres
 * 
 * @example
 * <Heading level={1}>Titre principal</Heading>
 * <Heading level={2} align="center">Sous-titre</Heading>
 * <Heading level={3}>Section</Heading>
 */
export function Heading({
  level = 1,
  children,
  align = 'left',
  color,
  style,
  ...props
}: HeadingProps) {
  const { colors } = useTheme();
  
  const headingStyles = {
    1: {
      fontSize: TYPOGRAPHY.sizes.xxxl,
      fontWeight: TYPOGRAPHY.weights.bold,
      lineHeight: TYPOGRAPHY.sizes.xxxl * 1.2,
    },
    2: {
      fontSize: TYPOGRAPHY.sizes.xxl,
      fontWeight: TYPOGRAPHY.weights.bold,
      lineHeight: TYPOGRAPHY.sizes.xxl * 1.3,
    },
    3: {
      fontSize: TYPOGRAPHY.sizes.xl,
      fontWeight: TYPOGRAPHY.weights.semibold,
      lineHeight: TYPOGRAPHY.sizes.xl * 1.4,
    },
    4: {
      fontSize: TYPOGRAPHY.sizes.lg,
      fontWeight: TYPOGRAPHY.weights.semibold,
      lineHeight: TYPOGRAPHY.sizes.lg * 1.4,
    },
  };

  const adaptiveVariant = level === 1 ? 'display' : level === 2 ? 'headline' : 'title';
  return (
    <AdaptiveText
      variant={adaptiveVariant}
      weight={level <= 2 ? 'bold' : 'semibold'}
      color={color || colors.text}
      style={[{ textAlign: align }, headingStyles[level], style]}
      {...(props as any)}
    >
      {children}
    </AdaptiveText>
  );
}

// ==========================================
// BODY COMPONENT
// ==========================================

/**
 * Body component pour le texte normal
 * 
 * @example
 * <Body>Texte principal</Body>
 * <Body variant="secondary">Texte secondaire</Body>
 * <Body variant="tertiary">Texte tertiaire</Body>
 */
export function Body({
  variant = 'regular',
  children,
  align = 'left',
  color,
  style,
  ...props
}: BodyProps) {
  const { colors } = useTheme();
  
  const variantColors = {
    regular: colors.text,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
  };

  return (
    <AdaptiveText
      variant="body"
      weight="regular"
      color={color || variantColors[variant]}
      style={[{ textAlign: align }, styles.body, style]}
      {...(props as any)}
    >
      {children}
    </AdaptiveText>
  );
}

// ==========================================
// CAPTION COMPONENT
// ==========================================

/**
 * Caption component pour les petits textes
 * 
 * @example
 * <Caption>Petite note</Caption>
 * <Caption align="center">Note centrée</Caption>
 */
export function Caption({
  children,
  align = 'left',
  color,
  style,
  ...props
}: BaseTypographyProps) {
  const { colors } = useTheme();

  return (
    <AdaptiveText
      variant="caption"
      weight="regular"
      color={color || colors.textSecondary}
      style={[{ textAlign: align }, styles.caption, style]}
      {...(props as any)}
    >
      {children}
    </AdaptiveText>
  );
}

// ==========================================
// LABEL COMPONENT
// ==========================================

/**
 * Label component pour les étiquettes de formulaire
 * 
 * @example
 * <Label>Nom</Label>
 * <Label required>Email</Label>
 */
export function Label({
  children,
  required = false,
  align = 'left',
  color,
  style,
  ...props
}: LabelProps) {
  const { colors } = useTheme();

  return (
    <Text
      style={[
        styles.base,
        styles.label,
        {
          color: color || colors.text,
          textAlign: align,
        },
        style,
      ]}
      {...props}
    >
      {children}
      {required && <Text style={{ color: colors.error }}> *</Text>}
    </Text>
  );
}

// ==========================================
// LINK COMPONENT
// ==========================================

/**
 * Link component pour les liens cliquables
 * 
 * @example
 * <Link onPress={() => {}}>Cliquez ici</Link>
 */
export function Link({
  children,
  align = 'left',
  color,
  style,
  ...props
}: BaseTypographyProps) {
  const { colors } = useTheme();

  return (
    <Text
      style={[
        styles.base,
        styles.link,
        {
          color: color || colors.primary,
          textAlign: align,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

// ==========================================
// HELPER COMPONENTS
// ==========================================

/**
 * Strong component pour le texte en gras
 * 
 * @example
 * <Body>Texte normal avec <Strong>texte en gras</Strong></Body>
 */
export function Strong({ children, style, ...props }: BaseTypographyProps) {
  return (
    <Text
      style={[
        styles.strong,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

/**
 * Muted component pour le texte atténué
 * 
 * @example
 * <Muted>Texte discret</Muted>
 */
export function Muted({ children, style, ...props }: BaseTypographyProps) {
  const { colors } = useTheme();
  
  return (
    <Text
      style={[
        styles.base,
        styles.muted,
        { color: colors.textTertiary },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  base: {
    fontFamily: undefined, // Utilise la police par défaut du système
  },
  body: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.regular,
    lineHeight: TYPOGRAPHY.sizes.md * 1.5,
  },
  caption: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.regular,
    lineHeight: TYPOGRAPHY.sizes.sm * 1.5,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    lineHeight: TYPOGRAPHY.sizes.sm * 1.4,
  },
  link: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    lineHeight: TYPOGRAPHY.sizes.md * 1.5,
    textDecorationLine: 'underline',
  },
  strong: {
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  muted: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.regular,
    opacity: 0.7,
  },
});

// ==========================================
// EXPORTS
// ==========================================

export default {
  Heading,
  Body,
  Caption,
  Label,
  Link,
  Strong,
  Muted,
};

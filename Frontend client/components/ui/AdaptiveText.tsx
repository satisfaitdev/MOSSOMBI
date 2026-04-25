import React from 'react';
import { Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface AdaptiveTextProps {
  children: React.ReactNode;
  variant?: 'display' | 'headline' | 'title' | 'body' | 'caption';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  color?: string;
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
  style?: any;
}

export const AdaptiveText: React.FC<AdaptiveTextProps> = ({
  children,
  variant = 'body',
  size,
  weight,
  color,
  numberOfLines,
  ellipsizeMode,
  style
}) => {
  const { colors } = useTheme();

  const getVariantStyle = () => {
    switch (variant) {
      case 'display':
        return {
          fontSize: Platform.select({ ios: 32, android: 28 }),
          fontWeight: '700' as const,
          letterSpacing: Platform.select({ ios: -0.5, android: 0 }),
          lineHeight: Platform.select({ ios: 40, android: 36 }),
        };
      case 'headline':
        return {
          fontSize: Platform.select({ ios: 24, android: 22 }),
          fontWeight: '600' as const,
          letterSpacing: Platform.select({ ios: -0.25, android: 0 }),
          lineHeight: Platform.select({ ios: 32, android: 30 }),
        };
      case 'title':
        return {
          fontSize: Platform.select({ ios: 20, android: 18 }),
          fontWeight: '600' as const,
          letterSpacing: Platform.select({ ios: 0, android: 0.15 }),
          lineHeight: Platform.select({ ios: 28, android: 26 }),
        };
      case 'body':
        return {
          fontSize: Platform.select({ ios: 16, android: 16 }),
          fontWeight: '400' as const,
          letterSpacing: Platform.select({ ios: 0.25, android: 0.5 }),
          lineHeight: Platform.select({ ios: 24, android: 22 }),
        };
      case 'caption':
        return {
          fontSize: Platform.select({ ios: 12, android: 12 }),
          fontWeight: '400' as const,
          letterSpacing: Platform.select({ ios: 0.4, android: 0.4 }),
          lineHeight: Platform.select({ ios: 16, android: 16 }),
        };
      default:
        return {};
    }
  };

  const getSizeStyle = () => {
    if (!size) return {};
    const sizes = {
      xs: Platform.select({ ios: 12, android: 12 }),
      sm: Platform.select({ ios: 14, android: 14 }),
      md: Platform.select({ ios: 16, android: 16 }),
      lg: Platform.select({ ios: 18, android: 18 }),
      xl: Platform.select({ ios: 20, android: 20 }),
      xxl: Platform.select({ ios: 24, android: 24 }),
      xxxl: Platform.select({ ios: 32, android: 28 }),
    };
    return { fontSize: sizes[size] };
  };

  const getWeightStyle = () => {
    if (!weight) return {};
    const weights = {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    };
    return { fontWeight: weights[weight] };
  };

  const textColor = color || colors.text;

  const textStyle = [
    styles.text,
    getVariantStyle(),
    getSizeStyle(),
    getWeightStyle(),
    { color: textColor },
    style
  ];

  return (
    <Text style={textStyle} numberOfLines={numberOfLines} ellipsizeMode={ellipsizeMode}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    // Base text styles
  },
});

export default AdaptiveText;

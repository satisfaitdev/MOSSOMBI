import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface Material3CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'filled' | 'outlined' | 'tonal';
  borderRadius?: number;
  padding?: number;
  margin?: number;
  elevation?: number;
  style?: any;
}

export const Material3Card: React.FC<Material3CardProps> = ({
  children,
  variant = 'elevated',
  borderRadius = 16,
  padding = 16,
  margin = 8,
  elevation = 3,
  style
}) => {
  const { colors } = useTheme();

  const getVariantStyle = () => {
    switch (variant) {
      case 'filled':
        return {
          backgroundColor: colors.surfaceVariant,
          borderColor: 'transparent',
          elevation: 0,
          shadowOpacity: 0,
        };
      case 'outlined':
        return {
          backgroundColor: colors.surface,
          borderColor: colors.outline,
          borderWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        };
      case 'tonal':
        return {
          backgroundColor: colors.secondaryContainer,
          borderColor: 'transparent',
          elevation: 1,
          shadowOpacity: 0.1,
        };
      case 'elevated':
      default:
        return {
          backgroundColor: colors.surface,
          borderColor: 'transparent',
          elevation,
          shadowOpacity: 0.2,
        };
    }
  };

  const variantStyle = getVariantStyle();

  const containerStyle = [
    styles.container,
    variantStyle,
    {
      borderRadius,
      padding,
      margin,
      shadowColor: colors.shadow,
    },
    style
  ];

  return (
    <View style={containerStyle}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 4,
  },
});

export default Material3Card;

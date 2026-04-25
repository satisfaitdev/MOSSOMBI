import React from 'react';
import { Pressable, StyleSheet, Platform, View, Text } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface AdaptiveButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'surface';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  style?: any;
}

export const AdaptiveButton: React.FC<AdaptiveButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onPress,
  style
}) => {
  const { colors } = useTheme();

  const getVariantStyle = () => {
    const baseStyle = {
      borderRadius: Platform.select({
        ios: 12,
        android: 20,
      }),
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? colors.outline : colors.primary,
          borderWidth: 0,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderColor: disabled ? colors.outline : colors.primary,
          borderWidth: 2,
        };
      case 'tertiary':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
      case 'surface':
        return {
          ...baseStyle,
          backgroundColor: disabled ? colors.surfaceVariant : colors.surface,
          borderColor: colors.outline,
          borderWidth: 1,
          elevation: Platform.OS === 'android' ? 2 : 0,
        };
      default:
        return baseStyle;
    }
  };

  const getSizeStyle = () => {
    const sizes = {
      sm: {
        paddingHorizontal: Platform.select({ ios: 16, android: 24 }),
        paddingVertical: Platform.select({ ios: 8, android: 8 }),
        minHeight: Platform.select({ ios: 36, android: 40 }),
      },
      md: {
        paddingHorizontal: Platform.select({ ios: 24, android: 32 }),
        paddingVertical: Platform.select({ ios: 12, android: 12 }),
        minHeight: Platform.select({ ios: 44, android: 48 }),
      },
      lg: {
        paddingHorizontal: Platform.select({ ios: 32, android: 40 }),
        paddingVertical: Platform.select({ ios: 16, android: 16 }),
        minHeight: Platform.select({ ios: 52, android: 56 }),
      },
      xl: {
        paddingHorizontal: Platform.select({ ios: 40, android: 48 }),
        paddingVertical: Platform.select({ ios: 20, android: 20 }),
        minHeight: Platform.select({ ios: 60, android: 64 }),
      },
    };
    return sizes[size];
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return '#FFFFFF';
      case 'secondary':
        return disabled ? colors.outline : colors.primary;
      case 'tertiary':
        return disabled ? colors.outline : colors.primary;
      case 'surface':
        return colors.text;
      default:
        return colors.text;
    }
  };

  const buttonStyle = [
    styles.button,
    getVariantStyle(),
    getSizeStyle(),
    {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: Platform.OS === 'ios' ? 0.2 : 0,
      shadowRadius: 4,
      elevation: Platform.OS === 'android' ? 4 : 0,
    },
    style
  ];

  const textStyle = [
    styles.text,
    {
      color: getTextColor(),
      fontSize: Platform.select({
        ios: size === 'sm' ? 14 : size === 'lg' ? 18 : 16,
        android: size === 'sm' ? 14 : size === 'lg' ? 16 : 16,
      }),
      fontWeight: '600' as const,
      textAlign: 'center',
    }
  ];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      android_ripple={
        Platform.OS === 'android'
          ? {
              color:
                variant === 'primary'
                  ? 'rgba(255,255,255,0.18)'
                  : `${colors.primary}22`,
              borderless: false,
            }
          : undefined
      }
      style={({ pressed }) => [
        buttonStyle,
        Platform.OS === 'ios' && pressed ? { opacity: 0.85 } : null,
      ]}
    >
      <View style={styles.content}>
        {typeof children === 'string' ? (
          <Text style={textStyle}>{loading ? 'Chargement...' : children}</Text>
        ) : loading ? (
          <Text style={textStyle}>Chargement...</Text>
        ) : (
          children
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    // Base text styles
  },
});

export default AdaptiveButton;

import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, StyleProp, ViewStyle, Animated } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/colors';
import { GRADIENTS } from '@/constants/gradients';
import { AdaptiveButton } from '@/components/ui/AdaptiveButton';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import {
  ANIMATION_DURATIONS,
  ANIMATION_VALUES,
  createScaleBounceAnimation
} from '@/constants/animations';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient' | 'gradient3d' | 'danger' | 'success';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  withAnimation?: boolean;
}

export default function Button({
  title,
  onPress = () => {},
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  testID,
  style,
  withAnimation = false,
}: ButtonProps) {
  const { colors } = useTheme();

  // Use the new adaptive design system for the common button variants.
  // Keep the legacy gradient variants and animation mode untouched.
  if (!withAnimation && variant !== 'gradient' && variant !== 'gradient3d') {
    const adaptiveVariant: React.ComponentProps<typeof AdaptiveButton>['variant'] =
      variant === 'outline' ? 'secondary' :
      variant === 'ghost' ? 'tertiary' :
      variant === 'secondary' ? 'surface' :
      'primary';

    const adaptiveSize: React.ComponentProps<typeof AdaptiveButton>['size'] =
      size === 'xs' || size === 'sm' ? 'sm' :
      size === 'lg' ? 'lg' :
      'md';

    const textColor =
      adaptiveVariant === 'primary' ? '#FFFFFF' :
      adaptiveVariant === 'secondary' ? colors.primary :
      adaptiveVariant === 'tertiary' ? colors.primary :
      colors.text;

    const backgroundOverride =
      variant === 'danger' ? { backgroundColor: colors.error, borderColor: 'transparent', borderWidth: 0 } :
      variant === 'success' ? { backgroundColor: colors.success, borderColor: 'transparent', borderWidth: 0 } :
      undefined;

    return (
      <View style={fullWidth ? styles.fullWidth : undefined}>
        <AdaptiveButton
          variant={adaptiveVariant}
          size={adaptiveSize}
          disabled={disabled}
          loading={loading}
          onPress={onPress}
          style={[fullWidth ? styles.fullWidth : undefined, backgroundOverride, style]}
        >
          <View style={[styles.content, { gap: SPACING.sm }]}>
            {icon}
            <AdaptiveText
              variant="body"
              weight="semibold"
              color={textColor}
              style={{
                fontSize:
                  size === 'xs' ? TYPOGRAPHY.sizes.xs :
                  size === 'sm' ? TYPOGRAPHY.sizes.sm :
                  size === 'lg' ? TYPOGRAPHY.sizes.lg :
                  TYPOGRAPHY.sizes.md,
              }}
            >
              {title}
            </AdaptiveText>
          </View>
        </AdaptiveButton>
      </View>
    );
  }

  // Animations seulement si withAnimation est activé
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const rippleOpacity = React.useRef(new Animated.Value(0)).current;

  const sizeStyles = {
    xs: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm, fontSize: TYPOGRAPHY.sizes.xs },
    sm: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, fontSize: TYPOGRAPHY.sizes.sm },
    md: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, fontSize: TYPOGRAPHY.sizes.md },
    lg: { paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xl, fontSize: TYPOGRAPHY.sizes.lg },
  };

  const handlePress = () => {
    if (disabled || loading || !onPress) return;

    if (withAnimation) {
      // Reset animations
      rippleOpacity.setValue(1);
      scaleAnim.setValue(1);

      // Start animations
      Animated.parallel([
        // Ripple animation (bulle d'eau)
        Animated.timing(rippleOpacity, {
          toValue: 0,
          duration: ANIMATION_DURATIONS.RIPPLE,
          useNativeDriver: true,
        }),
        // Scale animation (bounce effect)
        createScaleBounceAnimation(scaleAnim, ANIMATION_VALUES.SCALE_BOUNCE, ANIMATION_DURATIONS.BOUNCE),
      ]).start(() => {
        onPress();
      });
    } else {
      onPress();
    }
  };

  const getBackgroundColor = () => {
    if (disabled) return colors.border;
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'danger':
        return colors.error;
      case 'success':
        return colors.success;
      case 'outline':
      case 'ghost':
        return 'transparent';
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textTertiary;
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'gradient':
      case 'gradient3d':
      case 'danger':
      case 'success':
        return '#FFFFFF';
      case 'outline':
      case 'ghost':
        return colors.primary;
      default:
        return '#FFFFFF';
    }
  };

  const content = (
    <View style={[styles.content, { gap: SPACING.sm }]}>
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: sizeStyles[size].fontSize,
                fontWeight: TYPOGRAPHY.weights.semibold,
              },
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </View>
  );

  const buttonStyle = [
    styles.button,
    {
      paddingVertical: sizeStyles[size].paddingVertical,
      paddingHorizontal: sizeStyles[size].paddingHorizontal,
      backgroundColor: getBackgroundColor(),
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: variant === 'outline' ? 2 : 0,
      borderColor: variant === 'outline' ? colors.primary : 'transparent',
    },
    fullWidth && styles.fullWidth,
    !disabled && variant !== 'ghost' && SHADOWS.md,
    disabled && styles.disabled,
  ];

  if ((variant === 'gradient' || variant === 'gradient3d') && !disabled) {
    const gradientContent = (
      <LinearGradient
        colors={GRADIENTS.primary.colors}
        start={GRADIENTS.primary.start}
        end={GRADIENTS.primary.end}
        style={[
          styles.button,
          {
            paddingVertical: sizeStyles[size].paddingVertical,
            paddingHorizontal: sizeStyles[size].paddingHorizontal,
            borderRadius: BORDER_RADIUS.lg,
          },
          variant === 'gradient3d' ? SHADOWS.wallet3D : SHADOWS.md,
        ]}
      >
        {content}
      </LinearGradient>
    );

    if (withAnimation) {
      return (
        <View style={{ position: 'relative' }}>
          {/* Water bubble animation */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: BORDER_RADIUS.lg,
                backgroundColor: colors.primary + '40',
                opacity: rippleOpacity,
                zIndex: 2,
                elevation: 5,
              },
              fullWidth && styles.fullWidth,
              style,
            ]}
          />

          <Animated.View
            style={[
              {
                transform: [{ scale: scaleAnim }],
              },
              fullWidth && styles.fullWidth,
              style,
            ]}
          >
            <Pressable
              onPress={handlePress}
              disabled={disabled || loading}
              testID={testID}
              style={({ pressed }) => [
                fullWidth && styles.fullWidth,
                { opacity: pressed ? 0.8 : 1 },
                style,
              ]}
            >
              {gradientContent}
            </Pressable>
          </Animated.View>
        </View>
      );
    }

    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled || loading}
        testID={testID}
        style={({ pressed }) => [
          fullWidth && styles.fullWidth,
          { opacity: pressed ? 0.8 : 1 },
          style,
        ]}
      >
        {gradientContent}
      </Pressable>
    );
  }

  const finalButton = (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      testID={testID}
      style={({ pressed }) => [
        buttonStyle,
        { opacity: pressed && !disabled ? 0.8 : 1 },
        style,
      ]}
    >
      {content}
    </Pressable>
  );

  if (withAnimation) {
    return (
      <View style={{ position: 'relative' }}>
        {/* Water bubble animation */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: BORDER_RADIUS.lg,
              backgroundColor: getBackgroundColor() + '40',
              opacity: rippleOpacity,
              zIndex: 2,
              elevation: 5,
            },
            fullWidth && styles.fullWidth,
            style,
          ]}
        />

        <Animated.View
          style={[
            {
              transform: [{ scale: scaleAnim }],
            },
            fullWidth && styles.fullWidth,
            style,
          ]}
        >
          {finalButton}
        </Animated.View>
      </View>
    );
  }

  return finalButton;
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});

/**
 * BOUTON ANIMÉ AVEC SYSTÈME D'ANIMATIONS CENTRALISÉ
 *
 * Exemple d'utilisation du système d'animations pour d'autres boutons
 */

import React from 'react';
import { Pressable, Animated, View, Text } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import {
  ANIMATION_COLORS,
  ANIMATION_DURATIONS,
  ANIMATION_VALUES,
  createScaleBounceAnimation
} from '@/constants/animations';

interface AnimatedButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: any;
}

export default function AnimatedButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
}: AnimatedButtonProps) {
  const { colors } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (disabled || !onPress) return;

    // Animation de scale bounce
    createScaleBounceAnimation(scaleAnim, ANIMATION_VALUES.SCALE_GENTLE, ANIMATION_DURATIONS.QUICK).start(() => {
      onPress();
    });
  };

  const getVariantColors = () => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: colors.success,
          rippleColor: ANIMATION_COLORS.SUCCESS,
        };
      case 'warning':
        return {
          backgroundColor: colors.warning,
          rippleColor: ANIMATION_COLORS.WARNING,
        };
      case 'error':
        return {
          backgroundColor: colors.error,
          rippleColor: ANIMATION_COLORS.ERROR,
        };
      case 'secondary':
        return {
          backgroundColor: colors.surface,
          rippleColor: colors.primary + '40',
        };
      default: // primary
        return {
          backgroundColor: colors.primary,
          rippleColor: colors.primary + '40',
        };
    }
  };

  const variantColors = getVariantColors();

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={({ pressed }) => [
          {
            paddingHorizontal: size === 'sm' ? 12 : size === 'lg' ? 24 : 16,
            paddingVertical: size === 'sm' ? 8 : size === 'lg' ? 16 : 12,
            borderRadius: 8,
            backgroundColor: variantColors.backgroundColor,
            opacity: pressed || disabled ? 0.7 : 1,
          },
        ]}
      >
        <Text style={{
          color: '#FFFFFF',
          fontSize: size === 'sm' ? 14 : size === 'lg' ? 18 : 16,
          fontWeight: '600',
          textAlign: 'center',
        }}>
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

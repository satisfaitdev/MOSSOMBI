/**
 * BOUTON DE QUANTITÉ ANIMÉ (+ et -)
 *
 * Utilise le système d'animations centralisé de Mossombi :
 * - ANIMATION_COLORS.PRIMARY_BLUE_RIPPLE pour la bulle d'eau
 * - ANIMATION_DURATIONS.RIPPLE pour le timing
 * - ANIMATION_VALUES.SCALE_GENTLE pour l'effet bounce
 * - createScaleBounceAnimation() pour l'animation principale
 *
 * Fonctionnalités :
 * - Scale bounce au clic (1 → 1.05 → 1)
 * - Effet bulle d'eau optionnel (avec withRipple)
 * - Couleur cohérente avec le système
 * - Totalement personnalisable
 *
 * @example
 * ```tsx
 * // Bouton simple avec scale bounce
 * <AnimatedQuantityButton
 *   onPress={() => addToCart(productId)}
 *   backgroundColor={colors.primary}
 *   textColor="#FFFFFF"
 * >
 *   +
 * </AnimatedQuantityButton>
 *
 * // Avec effet bulle d'eau
 * <AnimatedQuantityButton
 *   onPress={() => addToCart(productId)}
 *   backgroundColor={colors.primary}
 *   textColor="#FFFFFF"
 *   withRipple={true}
 * >
 *   +
 * </AnimatedQuantityButton>
 * ```
 */

import React from 'react';
import { Pressable, Animated, Text, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import {
  ANIMATION_DURATIONS,
  ANIMATION_VALUES,
  ANIMATION_COLORS,
  createScaleBounceAnimation
} from '@/constants/animations';

interface AnimatedQuantityButtonProps {
  onPress?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  backgroundColor: string;
  textColor?: string;
  size?: number;
  // Option pour activer l'effet bulle d'eau
  withRipple?: boolean;
}

export default function AnimatedQuantityButton({
  onPress,
  disabled = false,
  children,
  backgroundColor,
  textColor = '#FFFFFF',
  size = 32,
  withRipple = false,
}: AnimatedQuantityButtonProps) {
  const { colors } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const rippleOpacity = React.useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    if (disabled || !onPress) return;

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
      createScaleBounceAnimation(scaleAnim, ANIMATION_VALUES.SCALE_GENTLE, ANIMATION_DURATIONS.QUICK),
    ]).start(() => {
      onPress();
    });
  };

  return (
    <View style={{ position: 'relative' }}>
      {/* Water bubble animation - seulement si withRipple est true */}
      {withRipple && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: ANIMATION_COLORS.PRIMARY_BLUE_RIPPLE,
              opacity: rippleOpacity,
              zIndex: 2,
              elevation: 5,
            },
          ]}
        />
      )}

      <Animated.View
        style={{
          width: size,
          height: size,
          transform: [{ scale: scaleAnim }],
          zIndex: 1,
        }}
      >
        <Pressable
          onPress={handlePress}
          disabled={disabled}
          style={({ pressed }) => [
            {
              width: size,
              height: size,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: size / 2,
              backgroundColor,
              opacity: pressed || disabled ? 0.7 : 1,
            },
          ]}
        >
          <Text style={{
            color: textColor,
            fontSize: size * 0.4,
            fontWeight: '700',
          }}>
            {children}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

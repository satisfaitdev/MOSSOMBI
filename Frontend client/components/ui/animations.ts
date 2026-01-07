import { Animated } from 'react-native';

// ==========================================
// ANIMATIONS CENTRALISÉES
// ==========================================

/**
 * Animations réutilisables dans toute l'app
 */

// Fade In
export const fadeIn = (
  animatedValue: Animated.Value,
  duration: number = 300
) => {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    useNativeDriver: true,
  });
};

// Fade Out
export const fadeOut = (
  animatedValue: Animated.Value,
  duration: number = 300
) => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    useNativeDriver: true,
  });
};

// Scale In
export const scaleIn = (
  animatedValue: Animated.Value,
  duration: number = 300
) => {
  return Animated.spring(animatedValue, {
    toValue: 1,
    tension: 50,
    friction: 7,
    useNativeDriver: true,
  });
};

// Slide Up
export const slideUp = (
  animatedValue: Animated.Value,
  duration: number = 300
) => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    useNativeDriver: true,
  });
};

// Bounce
export const bounce = (animatedValue: Animated.Value) => {
  return Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: 1.2,
      duration: 150,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }),
  ]);
};

// Shake
export const shake = (animatedValue: Animated.Value) => {
  return Animated.sequence([
    Animated.timing(animatedValue, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(animatedValue, { toValue: -10, duration: 50, useNativeDriver: true }),
    Animated.timing(animatedValue, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(animatedValue, { toValue: 0, duration: 50, useNativeDriver: true }),
  ]);
};

// Pulse
export const pulse = (animatedValue: Animated.Value) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1.05,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ])
  );
};

export default {
  fadeIn,
  fadeOut,
  scaleIn,
  slideUp,
  bounce,
  shake,
  pulse,
};

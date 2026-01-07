/**
 * SYSTÈME D'ANIMATIONS CENTRALISÉ POUR MOSSOMBI
 *
 * Ce fichier contient toutes les constantes et utilitaires d'animations
 * utilisés dans l'application pour garantir la cohérence et faciliter
 * la maintenance.
 *
 * AVANTAGES :
 * ✅ Cohérence visuelle sur tous les composants
 * ✅ Maintenance centralisée (1 fichier pour toutes les animations)
 * ✅ Performance optimisée (useNativeDriver activé)
 * ✅ TypeScript strict pour la sécurité
 * ✅ Documentation complète avec exemples
 *
 * UTILISATION :
 * ```tsx
 * import {
 *   ANIMATION_COLORS,
 *   ANIMATION_DURATIONS,
 *   createScaleBounceAnimation
 * } from '@/constants/animations';
 *
 * const MyComponent = () => {
 *   const scaleAnim = useRef(new Animated.Value(1));
 *
 *   const handlePress = () => {
 *     createScaleBounceAnimation(scaleAnim).start(() => {
 *       // Action après animation
 *     });
 *   };
 * };
 * ```
 *
 * COMPOSANTS UTILISANT CE SYSTÈME :
 * ✅ StyledCloseButton (bulle d'eau + scale)
 * ✅ AnimatedButton (scale bounce)
 * ✅ AnimatedQuantityButton (scale bounce + bulle optionnelle)
 * ✅ Button Component (scale bounce + bulle avec withAnimation)
 * ✅ FloatingCartButton (scale bounce + bulle d'eau)
 * ✅ ModalHeader (titre + bouton animé)
 * ✅ ShoppingPageLayout (bottom bar animations)
 * ✅ CartModal (footer animations)
 * ✅ CheckoutModal (footer animations)
 *
 * COULEURS SYSTÈME :
 * - PRIMARY_BLUE: rgba(0, 85, 164, 0.6) - Bordures principales
 * - PRIMARY_BLUE_RIPPLE: rgba(0, 85, 164, 0.4) - Bulles d'eau
 * - SUCCESS/WARNING/ERROR: Couleurs sémantiques
 *
 * @see StyledCloseButton.tsx - Exemple complet d'utilisation
 * @see AnimationSystemExamples.tsx - Guide d'utilisation détaillé
 */

import { Animated } from 'react-native';

// Couleurs des animations (cohérentes avec le design system)
export const ANIMATION_COLORS = {
  // Bleu principal du système (même que bottom bar)
  PRIMARY_BLUE: 'rgba(0, 85, 164, 0.6)',    // Bordures
  PRIMARY_BLUE_RIPPLE: 'rgba(0, 85, 164, 0.4)', // Bulles d'eau
  PRIMARY_BLUE_WEAK: 'rgba(0, 85, 164, 0.3)',   // Bottom bar ripple

  // Autres couleurs système
  SUCCESS: 'rgba(34, 197, 94, 0.6)',
  WARNING: 'rgba(251, 191, 36, 0.6)',
  ERROR: 'rgba(239, 68, 68, 0.6)',
} as const;

// Durées des animations (en ms)
export const ANIMATION_DURATIONS = {
  // Animations rapides
  FAST: 100,
  QUICK: 150,
  NORMAL: 300,
  SLOW: 400,

  // Animations spéciales
  BOUNCE: 200,
  RIPPLE: 300,
  MOUNT: 400,
} as const;

// Valeurs des animations
export const ANIMATION_VALUES = {
  // Scale animations
  SCALE_BOUNCE: 1.15,
  SCALE_STRONG: 1.1,
  SCALE_GENTLE: 1.05,

  // Ripple animations
  RIPPLE_SCALE_START: 0.6,
  RIPPLE_SCALE_END: 1.4,
  RIPPLE_OPACITY_START: 1,
  RIPPLE_OPACITY_END: 0,

  // Mount animations
  MOUNT_SCALE_START: 0,
  MOUNT_SCALE_END: 1,
  MOUNT_OPACITY_START: 0,
  MOUNT_OPACITY_END: 1,
} as const;

/**
 * CONFIGURATIONS D'ANIMATIONS PRÉ-CONSTRUITES
 */
export const BUTTON_ANIMATIONS = {
  // Animation complète pour boutons (bulle + scale + callback)
  COMPLETE: {
    ripple: {
      scale: { input: [0, 1], output: [ANIMATION_VALUES.RIPPLE_SCALE_START, ANIMATION_VALUES.RIPPLE_SCALE_END] },
      opacity: { input: [0, 1], output: [ANIMATION_VALUES.RIPPLE_OPACITY_START, ANIMATION_VALUES.RIPPLE_OPACITY_END] },
      duration: ANIMATION_DURATIONS.RIPPLE,
      color: ANIMATION_COLORS.PRIMARY_BLUE_RIPPLE,
    },
    scale: {
      sequence: [
        { toValue: ANIMATION_VALUES.SCALE_BOUNCE, duration: ANIMATION_DURATIONS.BOUNCE },
        { toValue: ANIMATION_VALUES.MOUNT_SCALE_END, duration: ANIMATION_DURATIONS.BOUNCE },
      ],
    },
  },

  // Animation simple pour scale seulement
  SCALE_ONLY: {
    scale: {
      toValue: ANIMATION_VALUES.SCALE_GENTLE,
      duration: ANIMATION_DURATIONS.QUICK,
    },
  },

  // Animation pour ouverture de page
  MOUNT: {
    scale: {
      from: ANIMATION_VALUES.MOUNT_SCALE_START,
      to: ANIMATION_VALUES.MOUNT_SCALE_END,
      duration: ANIMATION_DURATIONS.MOUNT,
      type: 'spring',
      tension: 120,
      friction: 10,
    },
    opacity: {
      from: ANIMATION_VALUES.MOUNT_OPACITY_START,
      to: ANIMATION_VALUES.MOUNT_OPACITY_END,
      duration: ANIMATION_DURATIONS.MOUNT,
    },
  },
} as const;

/**
 * FONCTIONS UTILITAIRES POUR ANIMATIONS
 */

// Créer une animation de scale bounce
export const createScaleBounceAnimation = (
  animatedValue: Animated.Value,
  toValue: number = ANIMATION_VALUES.SCALE_BOUNCE,
  duration: number = ANIMATION_DURATIONS.BOUNCE
) => {
  return Animated.sequence([
    Animated.timing(animatedValue, {
      toValue,
      duration,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: ANIMATION_VALUES.MOUNT_SCALE_END,
      duration,
      useNativeDriver: true,
    }),
  ]);
};

// Créer une animation de ripple (bulle d'eau)
export const createRippleAnimation = (
  scaleAnim: Animated.Value,
  opacityAnim: Animated.Value,
  color: string = ANIMATION_COLORS.PRIMARY_BLUE_RIPPLE,
  duration: number = ANIMATION_DURATIONS.RIPPLE
) => {
  return Animated.parallel([
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }),
    Animated.timing(opacityAnim, {
      toValue: 0,
      duration,
      useNativeDriver: true,
    }),
  ]);
};

// Créer une animation d'ouverture
export const createMountAnimation = (
  scaleAnim: Animated.Value,
  opacityAnim: Animated.Value,
  duration: number = ANIMATION_DURATIONS.MOUNT
) => {
  return Animated.parallel([
    Animated.spring(scaleAnim, {
      toValue: ANIMATION_VALUES.MOUNT_SCALE_END,
      tension: 120,
      friction: 10,
      useNativeDriver: true,
    }),
    Animated.timing(opacityAnim, {
      toValue: ANIMATION_VALUES.MOUNT_OPACITY_END,
      duration,
      useNativeDriver: true,
    }),
  ]);
};

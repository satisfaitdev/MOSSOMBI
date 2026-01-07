import React from 'react';
import { Pressable, Animated, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import {
  ANIMATION_COLORS,
  ANIMATION_DURATIONS,
  ANIMATION_VALUES,
  createMountAnimation,
  createRippleAnimation,
  createScaleBounceAnimation
} from '@/constants/animations';

interface StyledCloseButtonProps {
  onPress?: () => void;
  size?: number;
  disabled?: boolean;
  style?: any;
  // Animation d'ouverture de page
  animateOnMount?: boolean;
}

/**
 * Composant bouton de fermeture stylisé avec BlurView et bordure bleue
 *
 * Utilise le système d'animations centralisé de Mossombi :
 * - Couleurs cohérentes : ANIMATION_COLORS.PRIMARY_BLUE
 * - Durées standardisées : ANIMATION_DURATIONS
 * - Valeurs optimisées : ANIMATION_VALUES
 * - Fonctions utilitaires : createMountAnimation, createRippleAnimation
 *
 * Fonctionnalités :
 * - Design cohérent avec le système (BlurView + bordure bleue)
 * - Animation de clic (bounce effect)
 * - Animation d'ouverture optionnelle
 * - Effet bulle d'eau BLEUE instantanée (pas d'animation de scale)
 * - Animation d'agrandissement au clic
 * - Couleur cohérente avec le bottom bar principal (rgba(0, 85, 164, ...))
 * - Totalement personnalisable (taille, style)
 *
 * @example
 * ```tsx
 * // Utilisation basique
 * <StyledCloseButton onPress={() => navigation.goBack()} />
 *
 * // Avec animation d'ouverture
 * <StyledCloseButton
 *   onPress={() => navigation.goBack()}
 *   animateOnMount={true}
 *   size={50}
 * />
 * ```
 */
export default function StyledCloseButton({
  onPress,
  size = 46,
  disabled = false,
  style,
  animateOnMount = false,
}: StyledCloseButtonProps) {
  const { colors, colorScheme } = useTheme();

  // Animations
  const scaleAnim = React.useRef(new Animated.Value(animateOnMount ? 0 : 1)).current;
  const opacityAnim = React.useRef(new Animated.Value(animateOnMount ? 0 : 1)).current;
  const rippleOpacity = React.useRef(new Animated.Value(0)).current;

  // Animation d'ouverture de page
  React.useEffect(() => {
    if (animateOnMount) {
      createMountAnimation(scaleAnim, opacityAnim, ANIMATION_DURATIONS.MOUNT).start();
    }
  }, [animateOnMount]);

  const handlePress = () => {
    if (disabled || !onPress) return;

    console.log('🚀 StyledCloseButton: Starting animations...');

    // Reset animations
    rippleOpacity.setValue(ANIMATION_VALUES.RIPPLE_OPACITY_START);
    scaleAnim.setValue(ANIMATION_VALUES.MOUNT_SCALE_END);

    // Start animations using centralized utilities
    Animated.parallel([
      // Ripple animation (bulle d'eau)
      Animated.timing(rippleOpacity, {
        toValue: ANIMATION_VALUES.RIPPLE_OPACITY_END,
        duration: ANIMATION_DURATIONS.RIPPLE,
        useNativeDriver: true,
      }),
      // Scale animation (bounce effect)
      createScaleBounceAnimation(scaleAnim, ANIMATION_VALUES.SCALE_BOUNCE, ANIMATION_DURATIONS.BOUNCE),
    ]).start(() => {
      // Execute onPress after animations complete
      console.log('✅ StyledCloseButton: Animations completed');
      onPress();
    });
  };

  return (
    <View style={[style, { position: 'relative' }]}>
      {/* Water bubble animation - couvre tout le bouton */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: ANIMATION_COLORS.PRIMARY_BLUE_RIPPLE, // Même bleu que le bottom bar
            opacity: rippleOpacity,
            // Pas d'animation de scale - apparait directement à la taille du bouton
            zIndex: 2, // Au-dessus de tout
            elevation: 5, // Pour Android
          },
        ]}
      />

      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <BlurView
          intensity={30}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: size / 2,
            backgroundColor: colors.card + '80',
            borderWidth: 2,
            borderColor: ANIMATION_COLORS.PRIMARY_BLUE, // Même bleu que le bottom bar
            zIndex: 1,
          }}
        />
        <Pressable
          onPress={handlePress}
          disabled={disabled}
          style={{
            width: size,
            height: size,
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 3, // Au-dessus de la bulle
          }}
        >
          <X
            size={size * 0.48} // 48% de la taille pour être proportionnel
            color={colors.text}
            strokeWidth={2.5}
          />
        </Pressable>
      </Animated.View>
    </View>
  );
}

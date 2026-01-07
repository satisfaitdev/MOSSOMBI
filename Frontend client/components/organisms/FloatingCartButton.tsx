/**
 * BOUTON PANIER FLOTTANT RÉUTILISABLE
 *
 * Composant pour afficher un bouton panier flottant en bas de l'écran
 * avec animations de bulle d'eau et scale bounce au clic.
 *
 * Utilise le système d'animations centralisé de Mossombi :
 * - ANIMATION_COLORS.PRIMARY_BLUE pour la bordure
 * - ANIMATION_COLORS.PRIMARY_BLUE_WEAK pour la bulle
 * - ANIMATION_DURATIONS.RIPPLE pour le timing
 * - ANIMATION_VALUES.SCALE_BOUNCE pour l'effet bounce
 * - createScaleBounceAnimation() pour l'animation principale
 *
 * @example
 * ```tsx
 * // Utilisation basique
 * <FloatingCartButton
 *   itemCount={cartCount}
 *   onPress={() => setCartModalVisible(true)}
 *   title="Voir le panier"
 * />
 *
 * // Personnalisé
 * <FloatingCartButton
 *   itemCount={cartCount}
 *   onPress={() => setCartModalVisible(true)}
 *   title="Mon panier"
 *   height={80}
 *   bottomMargin={15}
 * />
 * ```
 */

import React from 'react';
import { Pressable, Animated, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import MaskedView from '@react-native-masked-view/masked-view';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/constants/colors';
import {
  ANIMATION_COLORS,
  ANIMATION_DURATIONS,
  ANIMATION_VALUES,
  createScaleBounceAnimation
} from '@/constants/animations';

interface FloatingCartButtonProps {
  itemCount: number;
  onPress: () => void;
  title?: string;
  height?: number;
  bottomMargin?: number;
  disabled?: boolean;
}

export default function FloatingCartButton({
  itemCount,
  onPress,
  title = 'Voir le panier',
  height = 75,
  bottomMargin = 20,
  disabled = false,
}: FloatingCartButtonProps) {
  const { colors, colorScheme } = useTheme();

  // Animations
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const rippleAnim = React.useRef(new Animated.Value(0)).current;
  const rippleOpacity = React.useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    if (disabled) return;

    // Reset animations
    rippleAnim.setValue(0);
    rippleOpacity.setValue(0.8);
    scaleAnim.setValue(1);

    // Start animations using centralized system
    Animated.parallel([
      // Ripple animation (bulle d'eau)
      Animated.timing(rippleAnim, {
        toValue: 1,
        duration: ANIMATION_DURATIONS.RIPPLE,
        useNativeDriver: true,
      }),
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
  };

  // N'afficher que s'il y a des items
  if (itemCount === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: bottomMargin,
          left: 15,
          right: 15,
          height,
          borderRadius: 20,
          overflow: 'hidden',
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Pressable
        style={{ flex: 1 }}
        onPress={handlePress}
        disabled={disabled}
      >
        {/* Background avec blur */}
        <BlurView
          intensity={30}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 20,
            backgroundColor: colors.card + '80',
            borderWidth: 2,
            borderColor: ANIMATION_COLORS.PRIMARY_BLUE,
          }}
        />

        {/* Water bubble animation - couvre tout le bouton */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: '100%',
              height,
              borderRadius: 20,
              backgroundColor: ANIMATION_COLORS.PRIMARY_BLUE_WEAK,
              opacity: rippleOpacity,
              transform: [
                {
                  scale: rippleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.2],
                  }),
                },
              ],
              zIndex: 2,
              elevation: 5,
            },
          ]}
        />

        {/* Contenu - Texte avec gradient */}
        <View style={{
          flex: 1,
          paddingHorizontal: SPACING.md,
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 3,
        }}>
          <MaskedView
            style={{ width: '100%', height: 30, alignItems: 'center', justifyContent: 'center' }}
            maskElement={
              <View style={{ width: '100%', height: 30, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{
                  fontSize: TYPOGRAPHY.sizes.lg,
                  fontWeight: TYPOGRAPHY.weights.bold,
                  color: '#FFFFFF',
                  textAlign: 'center',
                }}>
                  {title} ({itemCount})
                </Text>
              </View>
            }
          >
            <LinearGradient
              colors={[colors.gradient.start, colors.gradient.middle, colors.gradient.end]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: '100%', height: 30 }}
            />
          </MaskedView>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/**
 * GradientBackground - Container avec fond dégradé réutilisable
 * Atom pour les containers avec le dégradé de l'application
 */

import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface GradientBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
  opacity?: string; // '20' pour 20% d'opacité
}

export default function GradientBackground({ 
  children, 
  style,
  opacity = ''
}: GradientBackgroundProps) {
  const { colors } = useTheme();
  
  const gradientColors = opacity 
    ? [
        colors.gradient.start + opacity,
        colors.gradient.middle + opacity,
        colors.gradient.end + opacity
      ] as const
    : [colors.gradient.start, colors.gradient.middle, colors.gradient.end] as const;
  
  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ backgroundColor: colors.background }, style]}
    >
      {children}
    </LinearGradient>
  );
}

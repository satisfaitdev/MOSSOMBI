/**
 * GradientDot - Dot avec dégradé réutilisable
 * Atom pour les indicateurs avec le dégradé de l'application
 */

import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

interface GradientDotProps {
  size?: number;
  width?: number;
  height?: number;
}

export default function GradientDot({ 
  size = 8, 
  width, 
  height 
}: GradientDotProps) {
  const { colors } = useTheme();
  
  const dotWidth = width || size;
  const dotHeight = height || size;
  
  return (
    <LinearGradient
      colors={[colors.gradient.start, colors.gradient.middle, colors.gradient.end]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: dotWidth,
        height: dotHeight,
        borderRadius: Math.min(dotWidth, dotHeight) / 2,
      }}
    />
  );
}

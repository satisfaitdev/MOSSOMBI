/**
 * GradientIcon - Icône avec fond dégradé réutilisable
 * Atom pour les icônes avec le dégradé de l'application
 */

import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

interface GradientIconProps {
  children: React.ReactNode;
  size?: number;
  borderRadius?: number;
  padding?: number;
}

export default function GradientIcon({ 
  children, 
  size = 24, 
  borderRadius = 10,
  padding = 2
}: GradientIconProps) {
  const { colors } = useTheme();
  
  return (
    <LinearGradient
      colors={[colors.gradient.start, colors.gradient.middle, colors.gradient.end]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ 
        borderRadius, 
        padding,
        alignItems: 'center',
        justifyContent: 'center',
        width: size + (padding * 2),
        height: size + (padding * 2),
      }}
    >
      {children}
    </LinearGradient>
  );
}

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS } from '@/constants/colors';

// ==========================================
// TYPES
// ==========================================

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: keyof typeof BORDER_RADIUS;
  style?: any;
}

// ==========================================
// SKELETON COMPONENT
// ==========================================

/**
 * Skeleton - Loading placeholder animé
 * 
 * @example
 * <Skeleton width="100%" height={20} />
 * <Skeleton width={100} height={100} borderRadius="full" />
 */
export default function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 'md',
  style,
}: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          backgroundColor: colors.border,
          borderRadius: BORDER_RADIUS[borderRadius],
          opacity,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
});

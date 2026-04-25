import React from 'react';
import { StyleSheet, Platform, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

interface LiquidGlassCardProps {
  children: React.ReactNode;
  intensity?: number;
  borderRadius?: number;
  padding?: number;
  margin?: number;
  animated?: boolean;
  style?: any;
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  intensity = 60,
  borderRadius = 24,
  padding = 20,
  margin = 0,
  animated = true,
  style
}) => {
  const { colors, isDark } = useTheme();
  const animatedValue = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (animated) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }

    return undefined;
  }, [animated, animatedValue]);

  const glassStyle = Platform.select({
    ios: {
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.22)' : 'rgba(255, 255, 255, 0.08)',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.15)',
      borderWidth: 1,
    },
    android: {
      backgroundColor: `${colors.surface}CC`, // 80% opacity
      borderColor: colors.outline,
      borderWidth: 1,
      elevation: 12,
      shadowColor: colors.shadow,
    }
  });

  const containerStyle = [
    styles.container,
    glassStyle,
    {
      borderRadius,
      padding,
      margin,
      transform: animated ? [{ scale: animatedValue }] : [],
    },
    style
  ];

  if (Platform.OS === 'ios') {
    return (
      <AnimatedBlurView
        intensity={intensity}
        tint={isDark ? 'dark' : 'light'}
        style={containerStyle}
      >
        {children}
      </AnimatedBlurView>
    );
  }

  return (
    <Animated.View style={containerStyle}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
});

export default LiquidGlassCard;

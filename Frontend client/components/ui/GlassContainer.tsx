import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';

interface GlassContainerProps {
  children: React.ReactNode;
  blur?: number;
  tint?: 'light' | 'dark' | 'default';
  opacity?: number;
  borderRadius?: number;
  style?: any;
}

export const GlassContainer: React.FC<GlassContainerProps> = ({
  children,
  blur = 60,
  tint = 'light',
  opacity = 0.1,
  borderRadius = 20,
  style
}) => {
  const { colors } = useTheme();

  const backgroundColor =
    tint === 'dark'
      ? `rgba(0, 0, 0, ${opacity})`
      : `rgba(255, 255, 255, ${opacity})`;

  const borderColor =
    tint === 'dark'
      ? `rgba(255, 255, 255, ${Math.max(opacity * 0.25, 0.05)})`
      : `rgba(255, 255, 255, ${opacity * 0.3})`;

  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={blur}
        tint={tint}
        style={[
          styles.glassContainer,
          {
            backgroundColor,
            borderRadius,
            borderColor,
          },
          style
        ]}
      >
        {children}
      </BlurView>
    );
  }

  // Android fallback with elevated card
  return (
    <View
      style={[
        styles.androidGlassContainer,
        {
          backgroundColor: Platform.select({
            ios: `rgba(255, 255, 255, ${opacity})`,
            android: `${colors.surface}E6`, // 90% opacity
          }),
          borderRadius,
          borderColor: Platform.select({
            ios: `rgba(255, 255, 255, ${opacity * 0.3})`,
            android: colors.outline,
          }),
          elevation: 8,
          shadowColor: colors.shadow,
        },
        style
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  glassContainer: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  androidGlassContainer: {
    borderWidth: 1,
    overflow: 'hidden',
  },
});

export default GlassContainer;

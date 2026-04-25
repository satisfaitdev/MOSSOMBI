import React from 'react';
import { Platform, Pressable } from 'react-native';
import { LiquidGlassCard } from './LiquidGlassCard';
import { Material3Card } from './Material3Card';

interface AdaptiveCardProps {
  children: React.ReactNode;
  // iOS Liquid Glass props
  intensity?: number;
  animated?: boolean;
  // Android Material 3 props
  variant?: 'elevated' | 'filled' | 'outlined' | 'tonal';
  elevation?: number;
  // Common props
  borderRadius?: number;
  padding?: number;
  margin?: number;
  style?: any;
  onPress?: () => void;
  testID?: string;
}

export const AdaptiveCard: React.FC<AdaptiveCardProps> = ({
  children,
  // iOS props
  intensity = 60,
  animated = true,
  // Android props
  variant = 'elevated',
  elevation = 3,
  // Common props
  borderRadius = Platform.select({
    ios: 24,
    android: 16,
  }),
  padding = Platform.select({
    ios: 20,
    android: 16,
  }),
  margin = 0,
  style,
  onPress,
  testID
}) => {
  const CardComponent = Platform.OS === 'ios' ? LiquidGlassCard : Material3Card;
  
  const cardProps = Platform.OS === 'ios' ? {
    intensity,
    borderRadius,
    padding,
    margin: 0, // Remove margin from card, handle in Pressable
    animated,
    style
  } : {
    variant,
    borderRadius,
    padding,
    margin: 0, // Remove margin from card, handle in Pressable
    elevation,
    style
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        testID={testID}
        style={({ pressed }) => [
          {
            margin,
            opacity: pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
      >
        <CardComponent {...cardProps}>
          {children}
        </CardComponent>
      </Pressable>
    );
  }

  return (
    <CardComponent {...cardProps} style={[cardProps.style, { margin }]}>
      {children}
    </CardComponent>
  );
};

export default AdaptiveCard;

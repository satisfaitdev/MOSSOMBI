import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Body } from './Typography';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';

// ==========================================
// TYPES
// ==========================================

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  message?: string;
  fullScreen?: boolean;
}

// ==========================================
// LOADING SPINNER COMPONENT
// ==========================================

/**
 * LoadingSpinner - Indicateur de chargement
 * 
 * @example
 * <LoadingSpinner message="Chargement..." />
 * <LoadingSpinner size="large" fullScreen />
 */
export default function LoadingSpinner({
  size = 'large',
  message,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const { colors } = useTheme();

  const content = (
    <>
      <ActivityIndicator size={size} color={colors.primary} />
      {message && (
        <Body
          variant="secondary"
          style={{ marginTop: SPACING.md, textAlign: 'center' }}
        >
          {message}
        </Body>
      )}
    </>
  );

  if (fullScreen) {
    return (
      <View
        style={[
          styles.fullScreen,
          { backgroundColor: colors.background },
        ]}
      >
        {content}
      </View>
    );
  }

  return <View style={styles.container}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

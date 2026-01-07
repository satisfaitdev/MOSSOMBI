import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { Heading, Body } from '@/components/atoms';
import { Center, Stack } from '@/components/ui';
import Button from '@/components/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';

// ==========================================
// TYPES
// ==========================================

interface ErrorStateProps {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

// ==========================================
// ERROR STATE COMPONENT
// ==========================================

/**
 * ErrorState - État d'erreur avec retry
 * 
 * @example
 * <ErrorState
 *   message="Impossible de charger les données"
 *   actionLabel="Réessayer"
 *   onAction={handleRetry}
 * />
 */
export default function ErrorState({
  title = 'Une erreur est survenue',
  message,
  actionLabel = 'Réessayer',
  onAction,
}: ErrorStateProps) {
  const { colors } = useTheme();

  return (
    <Center style={styles.container}>
      <Stack spacing="lg" align="center">
        <AlertCircle size={64} color={colors.error} />
        
        <Heading level={3} align="center">
          {title}
        </Heading>
        
        <Body variant="secondary" align="center">
          {message}
        </Body>
        
        {onAction && (
          <Button
            title={actionLabel}
            onPress={onAction}
            variant="primary"
            size="md"
          />
        )}
      </Stack>
    </Center>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.xxl * 2,
    paddingHorizontal: SPACING.lg,
  },
});

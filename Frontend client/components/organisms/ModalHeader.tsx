/**
 * EN-TÊTE DE MODAL RÉUTILISABLE
 *
 * Composant générique pour les en-têtes de modals avec titre et bouton de fermeture.
 * Utilisé dans CartModal, CheckoutModal et autres modals de l'application.
 *
 * @example
 * ```tsx
 * <ModalHeader
 *   title="Mon Panier"
 *   onClose={() => setModalVisible(false)}
 *   animateOnMount={true}
 * />
 * ```
 */

import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyledCloseButton } from '@/components/atoms';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, TYPOGRAPHY } from '@/constants/colors';

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
  animateOnMount?: boolean;
  closeButtonKey?: string;
  titleSize?: 'sm' | 'md' | 'lg';
  paddingBottom?: 'xs' | 'sm' | 'md' | 'lg';
}

export default function ModalHeader({
  title,
  onClose,
  animateOnMount = false,
  closeButtonKey = 'modal-close',
  titleSize = 'lg',
  paddingBottom = 'sm',
}: ModalHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const getTitleSize = () => {
    switch (titleSize) {
      case 'sm': return TYPOGRAPHY.sizes.md;
      case 'md': return TYPOGRAPHY.sizes.lg;
      case 'lg': return TYPOGRAPHY.sizes.xl;
      default: return TYPOGRAPHY.sizes.lg;
    }
  };

  const getPaddingBottom = () => {
    switch (paddingBottom) {
      case 'xs': return SPACING.xs;
      case 'sm': return SPACING.sm;
      case 'md': return SPACING.md;
      case 'lg': return SPACING.lg;
      default: return SPACING.sm;
    }
  };

  return (
    <View style={{
      backgroundColor: colors.card,
      paddingTop: insets.top + SPACING.xs,
      paddingBottom: getPaddingBottom(),
    }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
      }}>
        <Text style={{
          color: colors.text,
          fontSize: getTitleSize(),
          fontWeight: TYPOGRAPHY.weights.bold,
        }}>
          {title}
        </Text>

        <StyledCloseButton
          key={closeButtonKey}
          onPress={onClose}
          animateOnMount={animateOnMount}
        />
      </View>
    </View>
  );
}

/**
 * ButtonGroupLayout - Template unifié pour les groupes de boutons
 * Élimine la duplication des patterns de boutons répétés
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';
import { COMMON_STYLES } from '@/constants/styles';
import Button from '@/components/Button';

// ==========================================
// TYPES
// ==========================================

interface ButtonAction {
  /** Texte du bouton */
  title: string;
  /** Callback du bouton */
  onPress: () => void;
  /** Variant du bouton */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** Bouton désactivé */
  disabled?: boolean;
  /** Icône du bouton */
  icon?: React.ReactNode;
  /** Bouton en chargement */
  loading?: boolean;
  /** Style personnalisé */
  style?: any;
}

interface ButtonGroupLayoutProps {
  /** Actions des boutons */
  actions: ButtonAction[];
  /** Direction des boutons */
  direction?: 'horizontal' | 'vertical';
  /** Espacement entre les boutons */
  spacing?: keyof typeof SPACING;
  /** Répartition égale de l'espace */
  equalWidth?: boolean;
  /** Style personnalisé */
  style?: any;
  /** Variant du groupe */
  variant?: 'default' | 'footer' | 'inline';
}

// ==========================================
// BUTTON GROUP LAYOUT COMPONENT
// ==========================================

/**
 * ButtonGroupLayout - Template réutilisable pour les groupes de boutons
 * 
 * Remplace les patterns de boutons répétés (footer modals, actions, etc.)
 * 
 * @example
 * ```tsx
 * // Footer de modal (pattern très fréquent)
 * <ButtonGroupLayout
 *   actions={[
 *     { title: 'Annuler', onPress: onClose, variant: 'outline' },
 *     { title: 'Confirmer', onPress: onConfirm, variant: 'primary' }
 *   ]}
 *   variant="footer"
 *   direction="horizontal"
 *   equalWidth
 * />
 * 
 * // Actions verticales
 * <ButtonGroupLayout
 *   actions={[
 *     { title: 'Modifier', onPress: onEdit },
 *     { title: 'Supprimer', onPress: onDelete, variant: 'outline' }
 *   ]}
 *   direction="vertical"
 * />
 * 
 * // Actions inline
 * <ButtonGroupLayout
 *   actions={[
 *     { title: 'Précédent', onPress: onPrev, variant: 'ghost' },
 *     { title: 'Suivant', onPress: onNext }
 *   ]}
 *   variant="inline"
 * />
 * ```
 */
export default function ButtonGroupLayout({
  actions,
  direction = 'horizontal',
  spacing = 'md',
  equalWidth = false,
  style,
  variant = 'default',
}: ButtonGroupLayoutProps) {
  const { colors } = useTheme();

  // Styles selon le variant
  const getVariantStyles = () => {
    switch (variant) {
      case 'footer':
        return {
          padding: SPACING.lg,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.card,
        };
      case 'inline':
        return {
          paddingHorizontal: SPACING.sm,
        };
      default:
        return {};
    }
  };

  // Style du container selon la direction
  const getContainerStyle = () => {
    const baseStyle = direction === 'horizontal' 
      ? { ...COMMON_STYLES.row, gap: SPACING[spacing] }
      : { ...COMMON_STYLES.column, gap: SPACING[spacing] };

    return baseStyle;
  };

  // Style des boutons
  const getButtonStyle = (index: number) => {
    if (equalWidth && direction === 'horizontal') {
      return { flex: 1 };
    }
    return {};
  };

  return (
    <View style={[getVariantStyles(), style]}>
      <View style={getContainerStyle()}>
        {actions.map((action, index) => (
          <Button
            key={index}
            title={action.title}
            onPress={action.onPress}
            variant={action.variant || 'primary'}
            disabled={action.disabled}
            loading={action.loading}
            icon={action.icon}
            style={[getButtonStyle(index), action.style]}
          />
        ))}
      </View>
    </View>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  // Styles de base si nécessaire
});

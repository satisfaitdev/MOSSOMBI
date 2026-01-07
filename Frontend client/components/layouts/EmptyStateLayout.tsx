/**
 * EmptyStateLayout - Template unifié pour les états vides
 * Élimine la duplication des patterns EmptyState répétés
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Search, Package, ShoppingCart, AlertCircle, Wifi, RefreshCw } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants/colors';
import { COMMON_STYLES } from '@/constants/styles';
import { Heading, Body } from '@/components/atoms';
import Button from '@/components/Button';

// ==========================================
// TYPES
// ==========================================

type EmptyStateType = 
  | 'no-results'      // Pas de résultats de recherche
  | 'empty-cart'      // Panier vide
  | 'no-products'     // Pas de produits
  | 'no-connection'   // Pas de connexion
  | 'error'           // Erreur générale
  | 'loading'         // Chargement
  | 'custom';         // Personnalisé

interface EmptyStateLayoutProps {
  /** Type d'état vide prédéfini */
  type?: EmptyStateType;
  /** Icône personnalisée */
  icon?: React.ReactNode;
  /** Titre personnalisé */
  title?: string;
  /** Message personnalisé */
  message?: string;
  /** Texte du bouton d'action */
  actionText?: string;
  /** Callback du bouton d'action */
  onAction?: () => void;
  /** Afficher le bouton d'action */
  showAction?: boolean;
  /** Style personnalisé */
  style?: any;
  /** Variant de l'état vide */
  variant?: 'default' | 'compact' | 'minimal';
}

// ==========================================
// CONFIGURATIONS PRÉDÉFINIES
// ==========================================

const EMPTY_STATE_CONFIGS = {
  'no-results': {
    icon: <Search size={48} />,
    title: 'Aucun résultat',
    message: 'Essayez de modifier vos critères de recherche ou explorez nos autres catégories.',
    actionText: 'Réinitialiser les filtres',
  },
  'empty-cart': {
    icon: <ShoppingCart size={48} />,
    title: 'Panier vide',
    message: 'Votre panier est vide. Découvrez nos produits et ajoutez vos favoris.',
    actionText: 'Découvrir les produits',
  },
  'no-products': {
    icon: <Package size={48} />,
    title: 'Aucun produit',
    message: 'Aucun produit disponible pour le moment. Revenez plus tard.',
    actionText: 'Actualiser',
  },
  'no-connection': {
    icon: <Wifi size={48} />,
    title: 'Pas de connexion',
    message: 'Vérifiez votre connexion internet et réessayez.',
    actionText: 'Réessayer',
  },
  'error': {
    icon: <AlertCircle size={48} />,
    title: 'Une erreur est survenue',
    message: 'Quelque chose s\'est mal passé. Veuillez réessayer.',
    actionText: 'Réessayer',
  },
  'loading': {
    icon: <RefreshCw size={48} />,
    title: 'Chargement...',
    message: 'Veuillez patienter pendant le chargement des données.',
    actionText: null,
  },
} as const;

// ==========================================
// EMPTY STATE LAYOUT COMPONENT
// ==========================================

/**
 * EmptyStateLayout - Template réutilisable pour tous les états vides
 * 
 * Remplace les patterns EmptyState répétés dans le projet
 * 
 * @example
 * ```tsx
 * // État vide prédéfini
 * <EmptyStateLayout
 *   type="no-results"
 *   onAction={() => resetFilters()}
 * />
 * 
 * // État vide personnalisé
 * <EmptyStateLayout
 *   icon={<CustomIcon />}
 *   title="Titre personnalisé"
 *   message="Message personnalisé"
 *   actionText="Action"
 *   onAction={handleAction}
 * />
 * 
 * // État vide compact
 * <EmptyStateLayout
 *   type="empty-cart"
 *   variant="compact"
 * />
 * ```
 */
export default function EmptyStateLayout({
  type = 'custom',
  icon,
  title,
  message,
  actionText,
  onAction,
  showAction = true,
  style,
  variant = 'default',
}: EmptyStateLayoutProps) {
  const { colors } = useTheme();

  // Configuration selon le type
  const config = type !== 'custom' ? EMPTY_STATE_CONFIGS[type] : {
    icon: undefined,
    title: undefined,
    message: undefined,
    actionText: undefined,
  };
  
  const finalIcon = icon || config.icon;
  const finalTitle = title || config.title || 'État vide';
  const finalMessage = message || config.message || '';
  const finalActionText = actionText || config.actionText;

  // Styles selon le variant
  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return {
          paddingVertical: SPACING.xl,
          paddingHorizontal: SPACING.md,
        };
      case 'minimal':
        return {
          paddingVertical: SPACING.lg,
          paddingHorizontal: SPACING.sm,
        };
      default:
        return {
          paddingVertical: SPACING.xxl * 2,
          paddingHorizontal: SPACING.lg,
        };
    }
  };

  return (
    <View style={[styles.container, getVariantStyles(), style]}>
      {/* Icône */}
      {finalIcon && (
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '10' }]}>
          {finalIcon}
        </View>
      )}

      {/* Titre */}
      <Heading 
        level={variant === 'minimal' ? 4 : 3}
        style={[styles.title, { color: colors.text }]}
      >
        {finalTitle}
      </Heading>

      {/* Message */}
      {finalMessage && (
        <Body style={[styles.message, { color: colors.textSecondary }]}>
          {finalMessage}
        </Body>
      )}

      {/* Bouton d'action */}
      {showAction && finalActionText && onAction && (
        <Button
          title={finalActionText}
          onPress={onAction}
          variant="outline"
          style={styles.actionButton}
        />
      )}
    </View>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  container: {
    ...COMMON_STYLES.center,
    flex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.xxl,
    ...COMMON_STYLES.center,
    marginBottom: SPACING.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  message: {
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.sizes.md * 1.4,
    marginBottom: SPACING.xl,
    maxWidth: 280,
  },
  actionButton: {
    minWidth: 160,
  },
});

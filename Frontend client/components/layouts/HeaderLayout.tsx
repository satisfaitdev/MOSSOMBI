/**
 * HeaderLayout - Template unifié pour les headers
 * Élimine la duplication de 23 patterns header répétés
 */

import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { X, ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants/colors';
import { COMMON_STYLES } from '@/constants/styles';
import { Body } from '@/components/atoms';

// ==========================================
// TYPES
// ==========================================

interface HeaderLayoutProps {
  /** Titre du header */
  title?: string;
  /** Afficher le bouton retour */
  showBackButton?: boolean;
  /** Callback bouton retour */
  onBack?: () => void;
  /** Afficher le bouton fermer (X) */
  showCloseButton?: boolean;
  /** Callback bouton fermer */
  onClose?: () => void;
  /** Contenu personnalisé à droite */
  rightContent?: React.ReactNode;
  /** Contenu personnalisé à gauche */
  leftContent?: React.ReactNode;
  /** Style personnalisé */
  style?: any;
  /** Variant du header */
  variant?: 'default' | 'modal' | 'page';
  /** Couleur de fond personnalisée */
  backgroundColor?: string;
  /** Afficher la bordure en bas */
  showBorder?: boolean;
}

// ==========================================
// HEADER LAYOUT COMPONENT
// ==========================================

/**
 * HeaderLayout - Template réutilisable pour tous les headers
 * 
 * Remplace 23 patterns header répétés dans le projet
 * 
 * @example
 * ```tsx
 * // Header de modal (pattern le plus fréquent)
 * <HeaderLayout
 *   title="Détails du produit"
 *   showCloseButton
 *   onClose={onClose}
 *   variant="modal"
 * />
 * 
 * // Header de page avec retour
 * <HeaderLayout
 *   title="Paramètres"
 *   showBackButton
 *   onBack={() => router.back()}
 *   variant="page"
 * />
 * 
 * // Header personnalisé
 * <HeaderLayout
 *   leftContent={<CustomLogo />}
 *   rightContent={<NotificationBell />}
 * />
 * ```
 */
export default function HeaderLayout({
  title,
  showBackButton = false,
  onBack,
  showCloseButton = false,
  onClose,
  rightContent,
  leftContent,
  style,
  variant = 'default',
  backgroundColor,
  showBorder = true,
}: HeaderLayoutProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Styles selon le variant
  const getVariantStyles = () => {
    switch (variant) {
      case 'modal':
        return {
          paddingTop: insets.top + SPACING.md,
          backgroundColor: backgroundColor || colors.card,
          borderBottomWidth: showBorder ? 1 : 0,
          borderBottomColor: colors.border,
        };
      case 'page':
        return {
          paddingTop: insets.top + SPACING.sm,
          backgroundColor: backgroundColor || colors.background,
          borderBottomWidth: showBorder ? 1 : 0,
          borderBottomColor: colors.border,
        };
      default:
        return {
          backgroundColor: backgroundColor || colors.card,
          borderBottomWidth: showBorder ? 1 : 0,
          borderBottomColor: colors.border,
        };
    }
  };

  return (
    <View style={[styles.container, getVariantStyles(), style]}>
      <View style={styles.content}>
        {/* Contenu gauche */}
        <View style={styles.leftSection}>
          {leftContent || (
            <>
              {showBackButton && (
                <Pressable
                  onPress={onBack}
                  style={({ pressed }) => [
                    styles.iconButton,
                    { opacity: pressed ? 0.7 : 1 }
                  ]}
                >
                  <ArrowLeft size={24} color={colors.text} />
                </Pressable>
              )}
            </>
          )}
        </View>

        {/* Titre centré */}
        {title && (
          <View style={styles.titleSection}>
            <Body style={[styles.title, { color: colors.text }]}>
              {title}
            </Body>
          </View>
        )}

        {/* Contenu droite */}
        <View style={styles.rightSection}>
          {rightContent || (
            <>
              {showCloseButton && (
                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [
                    styles.iconButton,
                    { opacity: pressed ? 0.7 : 1 }
                  ]}
                >
                  <X size={24} color={colors.text} />
                </Pressable>
              )}
            </>
          )}
        </View>
      </View>
    </View>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  content: {
    ...COMMON_STYLES.rowCenterBetween,
    minHeight: 44,
  },
  leftSection: {
    flex: 1,
    ...COMMON_STYLES.rowCenter,
    justifyContent: 'flex-start',
  },
  titleSection: {
    flex: 2,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    ...COMMON_STYLES.rowCenter,
    justifyContent: 'flex-end',
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    textAlign: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    ...COMMON_STYLES.center,
    borderRadius: BORDER_RADIUS.md,
  },
});

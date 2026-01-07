/**
 * Styles communs réutilisables - Mossombi
 * Élimine la duplication des styles répétés
 */

import { BORDER_RADIUS, SPACING, SHADOWS } from './colors';

// Styles de base les plus utilisés
export const COMMON_STYLES = {
  // Containers
  flex1: { flex: 1 },
  container: { flex: 1 },
  
  // Layouts (patterns répétés 50+ fois)
  row: { flexDirection: 'row' as const },
  rowCenter: { flexDirection: 'row' as const, alignItems: 'center' as const },
  rowCenterBetween: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
  rowCenterGap: (gap: number) => ({ flexDirection: 'row' as const, alignItems: 'center' as const, gap }),
  column: { flexDirection: 'column' as const },
  center: { alignItems: 'center' as const, justifyContent: 'center' as const },
  spaceBetween: { justifyContent: 'space-between' as const },
  alignCenter: { alignItems: 'center' as const },
  
  // Cards
  card: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  
  // Headers
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  
  // Modals (s'ouvrent en bas comme demandé)
  modalContainer: { 
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    paddingTop: SPACING.lg,
  },
  
  // Buttons
  button: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  
  // Icon buttons (notifications, etc.)
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
  },
  
  // Sections
  section: {
    marginBottom: SPACING.lg,
  },
  
  // Input containers
  inputContainer: {
    width: '100%',
  },
  
  // Empty states
  emptyState: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: SPACING.xxl * 2,
    paddingHorizontal: SPACING.lg,
  },
} as const;

// Styles spécifiques pour les modals (préserve le design existant)
export const MODAL_STYLES = {
  // Modal qui s'ouvre depuis le bas (comme demandé)
  slideFromBottom: {
    container: COMMON_STYLES.modalContainer,
    content: {
      ...COMMON_STYLES.modalContent,
      // Préserve l'animation depuis le bas
    },
  },
  
  // Header des modals avec bouton fermer
  header: {
    ...COMMON_STYLES.header,
    borderBottomWidth: 1,
  },
  
  // Actions en bas des modals
  actions: {
    padding: SPACING.lg,
    borderTopWidth: 1,
  },
} as const;

// Styles pour les cartes produits (préserve le design)
export const PRODUCT_STYLES = {
  card: {
    ...COMMON_STYLES.card,
    marginBottom: SPACING.md,
  },
  
  gridCard: {
    width: '47.5%',
    marginBottom: SPACING.md,
    ...COMMON_STYLES.card,
  },
  
  listCard: {
    ...COMMON_STYLES.card,
    ...COMMON_STYLES.row,
    alignItems: 'center',
  },
} as const;

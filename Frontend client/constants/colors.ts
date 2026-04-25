export const DSFR_COLORS = {
  blue: '#000091',
  blueHover: '#1212ff',
  background: '#F6F6F6',
  text: '#1E1E1E',
  border: '#E5E5E5',
};

export const Colors = {
  light: {
    primary: '#0891B2', // Bleu clair du dégradé comme couleur principale
    primaryDark: '#0369A1',
    secondary: '#00CED1', // Turquoise devient secondaire
    accent: '#FFB347',
    background: '#FFFFFF',
    surface: '#F8F9FA',
    surfaceVariant: '#F3F4F6',
    secondaryContainer: '#E0F2FE',
    outline: '#E5E7EB',
    outlineVariant: '#F3F4F6',
    card: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.1)',
    gradient: {
      start: '#00CED1',
      middle: '#FF6B9D',
      end: '#FFB347',
    },
    tint: '#0891B2',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#0891B2',
  },
  dark: {
    primary: '#0891B2', // Bleu clair du dégradé comme couleur principale
    primaryDark: '#0369A1',
    secondary: '#00CED1', // Turquoise devient secondaire
    accent: '#FFB347',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceVariant: '#334155',
    secondaryContainer: '#1E3A8A',
    outline: '#475569',
    outlineVariant: '#334155',
    card: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textTertiary: '#94A3B8',
    border: '#334155',
    borderLight: '#1E293B',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    overlay: 'rgba(0, 0, 0, 0.7)',
    shadow: 'rgba(0, 0, 0, 0.3)',
    gradient: {
      start: '#00CED1',
      middle: '#FF6B9D',
      end: '#FF7F50',
    },
    tint: '#0891B2',
    tabIconDefault: '#64748B',
    tabIconSelected: '#0891B2',
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const TYPOGRAPHY = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  // Ombre 3D pour le wallet
  wallet3D: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
};

export const ANIMATIONS = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    ease: 'ease' as const,
    easeIn: 'ease-in' as const,
    easeOut: 'ease-out' as const,
    easeInOut: 'ease-in-out' as const,
  },
  spring: {
    damping: 15,
    stiffness: 150,
  },
};

// Système de layout centralisé pour les pages
export const LAYOUT = {
  // Padding horizontal standard pour toutes les pages
  screenPadding: SPACING.sm, // 12px (réduit pour plus d'espace)

  // Padding vertical pour le contenu scrollable
  scrollContentPadding: {
    top: SPACING.md,
    bottom: SPACING.xl,
  },

  // Espacement entre les sections
  sectionSpacing: SPACING.lg,

  // Espacement entre les éléments d'une même section
  itemSpacing: SPACING.md,

  // Style prêt à l'emploi pour ScrollView
  scrollViewContent: {
    paddingHorizontal: SPACING.sm,  // 12px gauche/droite
    paddingTop: SPACING.lg,         // Espace en haut pour ne pas coller au header
    paddingBottom: SPACING.xl,
  },

  // Style prêt à l'emploi pour les sections
  section: {
    marginBottom: SPACING.lg,
  },
};

export default Colors;

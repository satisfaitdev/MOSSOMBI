/**
 * GRADIENTS - MOSSOMBI
 * Définition des gradients utilisés dans l'application
 */

// Gradient principal basé sur l'en-tête de la page profil
export const MOSSOMBI_GRADIENT = {
  colors: ['#00CED1', '#FF6B9D', '#FF7F50'],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
} as const;

// Autres gradients pour différents usages
export const GRADIENTS = {
  // Gradient principal du logo
  primary: MOSSOMBI_GRADIENT,
  
  // Gradient alternatif plus doux
  soft: {
    colors: ['#3B82F6', '#06B6D4', '#8B5CF6', '#F97316'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  
  // Gradient pour les succès
  success: {
    colors: ['#10B981', '#34D399'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  
  // Gradient pour les erreurs
  error: {
    colors: ['#EF4444', '#F87171'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
} as const;

/**
 * SYSTÈME DE SALUTATIONS DYNAMIQUES - MOSSOMBI
 * Salutations selon l'heure de la journée
 */

export interface Greeting {
  text: string;
  emoji: string;
}

/**
 * Obtenir la salutation selon l'heure actuelle
 */
export const getGreetingByTime = (): Greeting => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    // Matin (5h - 12h)
    return {
      text: 'Bonjour',
      emoji: '🌅'
    };
  } else if (hour >= 12 && hour < 17) {
    // Après-midi (12h - 17h)
    return {
      text: 'Bon après-midi',
      emoji: '☀️'
    };
  } else if (hour >= 17 && hour < 21) {
    // Soirée (17h - 21h)
    return {
      text: 'Bonsoir',
      emoji: '🌆'
    };
  } else {
    // Nuit (21h - 5h)
    return {
      text: 'Bonne nuit',
      emoji: '🌙'
    };
  }
};

/**
 * Obtenir la clé de traduction selon l'heure
 */
export const getGreetingKey = (): string => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return 'goodMorning';
  } else if (hour >= 12 && hour < 17) {
    return 'goodAfternoon';
  } else if (hour >= 17 && hour < 21) {
    return 'goodEvening';
  } else {
    return 'goodNight';
  }
};

/**
 * Obtenir l'emoji selon l'heure
 */
export const getGreetingEmoji = (): string => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return '🌅';
  } else if (hour >= 12 && hour < 17) {
    return '☀️';
  } else if (hour >= 17 && hour < 21) {
    return '🌆';
  } else {
    return '🌙';
  }
};

/**
 * Salutations avec traductions (version simplifiée)
 */
export const getGreetingByTimeWithLanguage = (language: 'fr' | 'en' = 'fr'): Greeting => {
  const hour = new Date().getHours();

  if (language === 'en') {
    if (hour >= 5 && hour < 12) {
      return { text: 'Good morning', emoji: '🌅' };
    } else if (hour >= 12 && hour < 17) {
      return { text: 'Good afternoon', emoji: '☀️' };
    } else if (hour >= 17 && hour < 21) {
      return { text: 'Good evening', emoji: '🌆' };
    } else {
      return { text: 'Good night', emoji: '🌙' };
    }
  }

  // Français par défaut
  return getGreetingByTime();
};

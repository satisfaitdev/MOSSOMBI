/**
 * Helper de navigation typé pour Mossombi
 * Élimine tous les 'as any' dans le code
 */

import { useRouter, Href } from 'expo-router';
import { AppRoute } from '@/types/navigation';
import { logger } from './logger';

/**
 * Hook personnalisé pour navigation typée
 * 
 * @example
 * const nav = useTypedNavigation();
 * nav.push('/wallet'); // ✅ Type-safe
 * nav.push('/invalid'); // ❌ Erreur TypeScript
 */
export function useTypedNavigation() {
  const router = useRouter();

  return {
    /**
     * Naviguer vers une route
     */
    push: (route: AppRoute) => {
      logger.debug(`Navigation: push -> ${route}`);
      router.push(route as Href);
    },

    /**
     * Remplacer la route actuelle
     */
    replace: (route: AppRoute) => {
      logger.debug(`Navigation: replace -> ${route}`);
      router.replace(route as Href);
    },

    /**
     * Retour en arrière
     */
    back: () => {
      logger.debug('Navigation: back');
      router.back();
    },

    /**
     * Vérifier si on peut revenir en arrière
     */
    canGoBack: () => router.canGoBack(),

    /**
     * Naviguer avec paramètres
     */
    pushWithParams: <T extends Record<string, string | number>>(
      route: AppRoute,
      params: T
    ) => {
      const queryString = new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      ).toString();
      const fullRoute = `${route}?${queryString}` as Href;
      logger.debug(`Navigation: pushWithParams -> ${fullRoute}`);
      router.push(fullRoute);
    },
  };
}

/**
 * Navigation impérative (hors composants React)
 */
export class NavigationService {
  private static router: ReturnType<typeof useRouter> | null = null;

  static setRouter(router: ReturnType<typeof useRouter>) {
    this.router = router;
  }

  static push(route: AppRoute) {
    if (!this.router) {
      logger.error('NavigationService: Router not initialized');
      return;
    }
    logger.debug(`NavigationService: push -> ${route}`);
    this.router.push(route as Href);
  }

  static back() {
    if (!this.router) {
      logger.error('NavigationService: Router not initialized');
      return;
    }
    logger.debug('NavigationService: back');
    this.router.back();
  }
}

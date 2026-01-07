/**
 * SERVICE DE TAUX DE CHANGE EN TEMPS RÉEL - MOSSOMBI
 * Récupération des vrais taux depuis des APIs gratuites
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Taux de fallback (actuels corrects) si l'API échoue
const FALLBACK_RATES: Record<string, number> = {
  'XAF': 1,
  'CDF': 3.7286,
  'USD': 0.001757,
  'EUR': 0.001514,
  'CAD': 0.00245,
};

const CACHE_KEY = 'exchange_rates_cache';
const CACHE_DURATION = 3600000; // 1 heure en millisecondes

interface CachedRates {
  rates: Record<string, number>;
  timestamp: number;
}

interface ExchangeRateResponse {
  success: boolean;
  rates: Record<string, number>;
  base: string;
  date: string;
}

/**
 * API gratuite ExchangeRate-API (pas de clé requise)
 * Limite: 1500 requêtes/mois gratuit
 */
const fetchFromExchangeRateAPI = async (): Promise<Record<string, number> | null> => {
  try {
    console.log('🌐 Récupération taux depuis ExchangeRate-API...');
    
    // Récupérer les taux avec XAF comme base
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/XAF', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data: ExchangeRateResponse = await response.json();
    
    if (data.success !== false && data.rates) {
      console.log('✅ Taux récupérés depuis ExchangeRate-API');
      return {
        'XAF': 1,
        'CDF': data.rates.CDF || FALLBACK_RATES.CDF,
        'USD': data.rates.USD || FALLBACK_RATES.USD,
        'EUR': data.rates.EUR || FALLBACK_RATES.EUR,
        'CAD': data.rates.CAD || FALLBACK_RATES.CAD,
      };
    }
    
    return null;
  } catch (error) {
    console.warn('❌ ExchangeRate-API échoué:', error);
    return null;
  }
};

/**
 * API gratuite Fixer.io (version gratuite)
 * Limite: 100 requêtes/mois gratuit
 */
const fetchFromFixerIO = async (): Promise<Record<string, number> | null> => {
  try {
    console.log('🌐 Récupération taux depuis Fixer.io...');
    
    // Note: Pour Fixer.io gratuit, on doit utiliser EUR comme base
    // puis calculer les taux XAF
    const response = await fetch('https://api.fixer.io/latest?access_key=YOUR_FREE_KEY&base=EUR&symbols=XAF,CDF,USD,CAD', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success && data.rates && data.rates.XAF) {
      // Convertir les taux avec XAF comme base
      const xafToEur = 1 / data.rates.XAF;
      
      console.log('✅ Taux récupérés depuis Fixer.io');
      return {
        'XAF': 1,
        'EUR': xafToEur,
        'USD': data.rates.USD ? (data.rates.USD / data.rates.XAF) : FALLBACK_RATES.USD,
        'CDF': data.rates.CDF ? (data.rates.CDF / data.rates.XAF) : FALLBACK_RATES.CDF,
        'CAD': data.rates.CAD ? (data.rates.CAD / data.rates.XAF) : FALLBACK_RATES.CAD,
      };
    }
    
    return null;
  } catch (error) {
    console.warn('❌ Fixer.io échoué:', error);
    return null;
  }
};

/**
 * API gratuite CurrencyAPI (alternative)
 */
const fetchFromCurrencyAPI = async (): Promise<Record<string, number> | null> => {
  try {
    console.log('🌐 Récupération taux depuis CurrencyAPI...');
    
    const response = await fetch('https://api.currencyapi.com/v3/latest?apikey=YOUR_FREE_KEY&base_currency=XAF&currencies=CDF,USD,EUR,CAD', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (data.data) {
      console.log('✅ Taux récupérés depuis CurrencyAPI');
      return {
        'XAF': 1,
        'CDF': data.data.CDF?.value || FALLBACK_RATES.CDF,
        'USD': data.data.USD?.value || FALLBACK_RATES.USD,
        'EUR': data.data.EUR?.value || FALLBACK_RATES.EUR,
        'CAD': data.data.CAD?.value || FALLBACK_RATES.CAD,
      };
    }
    
    return null;
  } catch (error) {
    console.warn('❌ CurrencyAPI échoué:', error);
    return null;
  }
};

/**
 * Récupérer les taux depuis le cache
 */
const getCachedRates = async (): Promise<Record<string, number> | null> => {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { rates, timestamp }: CachedRates = JSON.parse(cached);
    const now = Date.now();

    // Vérifier si le cache est encore valide (moins d'1 heure)
    if (now - timestamp < CACHE_DURATION) {
      console.log('📦 Utilisation des taux en cache');
      return rates;
    }

    console.log('⏰ Cache expiré, récupération de nouveaux taux');
    return null;
  } catch (error) {
    console.warn('❌ Erreur lecture cache:', error);
    return null;
  }
};

/**
 * Sauvegarder les taux dans le cache
 */
const cacheRates = async (rates: Record<string, number>): Promise<void> => {
  try {
    const cacheData: CachedRates = {
      rates,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    console.log('💾 Taux sauvegardés en cache');
  } catch (error) {
    console.warn('❌ Erreur sauvegarde cache:', error);
  }
};

/**
 * FONCTION PRINCIPALE - Récupérer les taux de change réels
 */
export const fetchRealExchangeRates = async (): Promise<Record<string, number>> => {
  console.log('💱 Récupération des taux de change réels...');

  // 1. Vérifier le cache d'abord
  const cachedRates = await getCachedRates();
  if (cachedRates) {
    return cachedRates;
  }

  // 2. Essayer les APIs dans l'ordre de préférence
  const apis = [
    fetchFromExchangeRateAPI,
    // fetchFromFixerIO,      // Décommenté quand vous avez une clé
    // fetchFromCurrencyAPI,  // Décommenté quand vous avez une clé
  ];

  for (const apiCall of apis) {
    const rates = await apiCall();
    if (rates) {
      // Sauvegarder en cache et retourner
      await cacheRates(rates);
      console.log('✅ Taux réels récupérés et mis en cache');
      return rates;
    }
  }

  // 3. Fallback sur les taux statiques si toutes les APIs échouent
  console.log('⚠️ Toutes les APIs ont échoué, utilisation des taux de fallback');
  return FALLBACK_RATES;
};

/**
 * Forcer la mise à jour des taux (ignorer le cache)
 */
export const refreshExchangeRates = async (): Promise<Record<string, number>> => {
  console.log('🔄 Actualisation forcée des taux de change...');
  
  // Supprimer le cache
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.warn('❌ Erreur suppression cache:', error);
  }

  // Récupérer de nouveaux taux
  return await fetchRealExchangeRates();
};

/**
 * Obtenir l'âge du cache en minutes
 */
export const getCacheAge = async (): Promise<number | null> => {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { timestamp }: CachedRates = JSON.parse(cached);
    const ageMs = Date.now() - timestamp;
    return Math.floor(ageMs / 60000); // Convertir en minutes
  } catch (error) {
    return null;
  }
};

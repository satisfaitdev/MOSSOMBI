/**
 * HOOK POUR TAUX DE CHANGE RÉELS - MOSSOMBI
 * Gestion automatique des taux de change en temps réel
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchRealExchangeRates, refreshExchangeRates, getCacheAge } from '@/services/exchangeRateService';

interface UseRealExchangeRatesReturn {
  rates: Record<string, number>;
  isLoading: boolean;
  isError: boolean;
  lastUpdated: Date | null;
  cacheAgeMinutes: number | null;
  refreshRates: () => Promise<void>;
  isUsingFallback: boolean;
}

export const useRealExchangeRates = () => {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [cacheAgeMinutes, setCacheAgeMinutes] = useState<number | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  // Charger les taux au démarrage
  const loadRates = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      
      const newRates = await fetchRealExchangeRates();
      setRates(newRates);
      setLastUpdated(new Date());
      
      // Vérifier l'âge du cache
      const age = await getCacheAge();
      setCacheAgeMinutes(age);
      
      // Détecter si on utilise les taux de fallback
      // (si les taux sont exactement ceux de fallback, probablement pas d'API)
      const fallbackRates = {
        'XAF': 1,
        'CDF': 3.7286,
        'USD': 0.001757,
        'EUR': 0.001514,
        'CAD': 0.00245,
      };
      
      const isFallback = Object.keys(fallbackRates).every(
        key => Math.abs(newRates[key] - fallbackRates[key]) < 0.000001
      );
      setIsUsingFallback(isFallback);
      
    } catch (error) {
      console.error('❌ Erreur chargement taux:', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Actualiser les taux (forcer)
  const refreshRates = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      
      const newRates = await refreshExchangeRates();
      setRates(newRates);
      setLastUpdated(new Date());
      setCacheAgeMinutes(0); // Cache tout frais
      
    } catch (error) {
      console.error('❌ Erreur actualisation taux:', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Charger les taux au montage du composant
  useEffect(() => {
    loadRates();
  }, [loadRates]);

  // Mettre à jour l'âge du cache toutes les minutes
  useEffect(() => {
    const interval = setInterval(async () => {
      const age = await getCacheAge();
      setCacheAgeMinutes(age);
    }, 60000); // Chaque minute

    return () => clearInterval(interval);
  }, []);

  return {
    rates,
    isLoading,
    isError,
    lastUpdated,
    cacheAgeMinutes,
    refreshRates,
    isUsingFallback,
  };
};

/**
 * CONTEXTE PRÉFÉRENCES UTILISATEUR - MOSSOMBI
 * Gestion des préférences utilisateur (devise, langue, etc.)
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrencyByCountry, getAutoConfigByCountry } from '@/utils/localization';
import { useAuth } from './AuthContext';

interface UserPreferences {
  preferredCurrency: string;
  autoConvertCurrency: boolean;
  language: string;
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  isLoading: boolean;
  updatePreferredCurrency: (currency: string) => Promise<void>;
  toggleAutoConvert: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
  getDisplayCurrency: () => string;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | null>(null);

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
}

interface UserPreferencesProviderProps {
  children: React.ReactNode;
}

const STORAGE_KEY = 'user_preferences';

// Détection automatique des préférences par défaut selon le pays
const getDefaultPreferences = (): UserPreferences => {
  try {
    const autoConfig = getAutoConfigByCountry();
    console.log('💰 Préférences automatiques détectées:', autoConfig);
    return {
      preferredCurrency: autoConfig.currency,
      autoConvertCurrency: true,
      language: autoConfig.language,
    };
  } catch (error) {
    console.error('❌ Erreur détection préférences automatiques:', error);
    return {
      preferredCurrency: 'XAF',
      autoConvertCurrency: true,
      language: 'fr',
    };
  }
};

export function UserPreferencesProvider({ children }: UserPreferencesProviderProps) {
  const [preferences, setPreferences] = useState<UserPreferences>(getDefaultPreferences());
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Charger les préférences au démarrage
  useEffect(() => {
    loadPreferences();
  }, []);

  // Mettre à jour la devise par défaut selon le pays de l'utilisateur
  useEffect(() => {
    if (user?.country_code && preferences.autoConvertCurrency) {
      const countryCurrency = getCurrencyByCountry(user.country_code);
      if (countryCurrency !== preferences.preferredCurrency) {
        updatePreferredCurrency(countryCurrency);
      }
    }
  }, [user?.country_code]);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedPreferences = JSON.parse(stored);
        const defaultPrefs = getDefaultPreferences();
        setPreferences({ ...defaultPrefs, ...parsedPreferences });
        console.log('📱 Préférences sauvegardées chargées:', parsedPreferences);
      } else {
        // Première utilisation : utiliser la détection automatique
        const autoPreferences = getDefaultPreferences();
        console.log('🌍 Première utilisation - Préférences automatiques:', autoPreferences);
        setPreferences(autoPreferences);
        await savePreferences(autoPreferences);
      }
    } catch (error) {
      console.error('Erreur chargement préférences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async (newPreferences: UserPreferences) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
    } catch (error) {
      console.error('Erreur sauvegarde préférences:', error);
    }
  };

  const updatePreferredCurrency = async (currency: string) => {
    const newPreferences = { ...preferences, preferredCurrency: currency };
    setPreferences(newPreferences);
    await savePreferences(newPreferences);
  };

  const toggleAutoConvert = async () => {
    const newPreferences = { ...preferences, autoConvertCurrency: !preferences.autoConvertCurrency };
    setPreferences(newPreferences);
    await savePreferences(newPreferences);
  };

  const resetToDefaults = async () => {
    const autoDefaults = getDefaultPreferences();
    console.log('🔄 Reset vers les préférences automatiques:', autoDefaults);
    
    setPreferences(autoDefaults);
    await savePreferences(autoDefaults);
  };

  const getDisplayCurrency = (): string => {
    if (preferences.autoConvertCurrency && user?.country_code) {
      return getCurrencyByCountry(user.country_code);
    }
    return preferences.preferredCurrency;
  };

  const value: UserPreferencesContextType = {
    preferences,
    isLoading,
    updatePreferredCurrency,
    toggleAutoConvert,
    resetToDefaults,
    getDisplayCurrency,
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

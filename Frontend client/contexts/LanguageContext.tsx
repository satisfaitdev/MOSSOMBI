/**
 * CONTEXTE DE LANGUE - MOSSOMBI
 * Gestion du changement de langue et des traductions
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Language, TranslationKey } from '@/locales';
import { getAutoConfigByCountryWithGeolocation } from '@/utils/localization';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: TranslationKey) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

interface LanguageProviderProps {
  children: React.ReactNode;
}

const STORAGE_KEY = 'app_language';

// Détection automatique de la langue par défaut selon le pays
const getDefaultLanguage = async (): Promise<Language> => {
  try {
    const autoConfig = await getAutoConfigByCountryWithGeolocation();
    console.log('🌍 Configuration automatique détectée:', autoConfig);
    return autoConfig.language;
  } catch (error) {
    console.error('❌ Erreur détection langue automatique:', error);
    return 'fr'; // Fallback sécurisé
  }
};

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setCurrentLanguage] = useState<Language>('fr');
  const [isLoading, setIsLoading] = useState(true);

  // Charger la langue sauvegardée au démarrage
  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedLanguage && (savedLanguage === 'fr' || savedLanguage === 'en')) {
        console.log('📱 Langue sauvegardée trouvée:', savedLanguage);
        setCurrentLanguage(savedLanguage as Language);
      } else {
        // Première utilisation : utiliser la détection automatique
        const autoLanguage = await getDefaultLanguage();
        console.log('🌍 Première utilisation - Langue automatique:', autoLanguage);
        setCurrentLanguage(autoLanguage);
        await AsyncStorage.setItem(STORAGE_KEY, autoLanguage);
      }
    } catch (error) {
      console.error('Erreur chargement langue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      setCurrentLanguage(lang);
      await AsyncStorage.setItem(STORAGE_KEY, lang);
    } catch (error) {
      console.error('Erreur sauvegarde langue:', error);
    }
  };

  // Fonction de traduction
  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

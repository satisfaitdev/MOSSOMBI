/**
 * UTILITAIRES DE LOCALISATION - MOSSOMBI
 * Gestion des devises, pays et formatage selon la localisation
 */

export interface CountryInfo {
  code: string;
  name: string;
  nameEn?: string;
  currency: string;
  flag: string;
  locale: string;
}

// Configuration des pays supportés
export const COUNTRIES: Record<string, CountryInfo> = {
  'CD': {
    code: 'CD',
    name: 'République Démocratique du Congo',
    currency: 'CDF',
    flag: '🇨🇩',
    locale: 'fr-CD'
  },
  'CG': {
    code: 'CG',
    name: 'République du Congo',
    currency: 'XAF',
    flag: '🇨🇬',
    locale: 'fr-CG'
  },
  'FR': {
    code: 'FR',
    name: 'France',
    nameEn: 'France',
    currency: 'EUR',
    flag: '🇫🇷',
    locale: 'fr-FR'
  },
  'BE': {
    code: 'BE',
    name: 'Belgique',
    nameEn: 'Belgium',
    currency: 'EUR',
    flag: '🇧🇪',
    locale: 'fr-BE'
  },
  'CA': {
    code: 'CA',
    name: 'Canada',
    currency: 'CAD',
    flag: '🇨🇦',
    locale: 'fr-CA'
  },
  'US': {
    code: 'US',
    name: 'États-Unis',
    nameEn: 'United States',
    currency: 'USD',
    flag: '🇺🇸',
    locale: 'en-US'
  },
  'GB': {
    code: 'GB',
    name: 'Royaume-Uni',
    nameEn: 'United Kingdom',
    currency: 'GBP',
    flag: '🇬🇧',
    locale: 'en-GB'
  },
  'DE': {
    code: 'DE',
    name: 'Allemagne',
    currency: 'EUR',
    flag: '🇩🇪',
    locale: 'de-DE'
  },
  'ES': {
    code: 'ES',
    name: 'Espagne',
    currency: 'EUR',
    flag: '🇪🇸',
    locale: 'es-ES'
  },
  'IT': {
    code: 'IT',
    name: 'Italie',
    currency: 'EUR',
    flag: '🇮🇹',
    locale: 'it-IT'
  },
  'CH': {
    code: 'CH',
    name: 'Suisse',
    currency: 'CHF',
    flag: '🇨🇭',
    locale: 'fr-CH'
  },
  'MA': {
    code: 'MA',
    name: 'Maroc',
    currency: 'MAD',
    flag: '🇲🇦',
    locale: 'ar-MA'
  },
  'SN': {
    code: 'SN',
    name: 'Sénégal',
    currency: 'XOF',
    flag: '🇸🇳',
    locale: 'fr-SN'
  },
  'CI': {
    code: 'CI',
    name: 'Côte d\'Ivoire',
    currency: 'XOF',
    flag: '🇨🇮',
    locale: 'fr-CI'
  },
  'CM': {
    code: 'CM',
    name: 'Cameroun',
    nameEn: 'Cameroon',
    currency: 'XAF',
    flag: '🇨🇲',
    locale: 'fr-CM'
  },
  'GA': {
    code: 'GA',
    name: 'Gabon',
    currency: 'XAF',
    flag: '🇬🇦',
    locale: 'fr-GA'
  }
};

/**
 * Obtenir les informations d'un pays par son code
 */
export const getCountryInfo = (countryCode: string): CountryInfo => {
  return COUNTRIES[countryCode] || COUNTRIES['CD']; // Par défaut RDC
};

/**
 * Obtenir la devise d'un pays
 */
export const getCurrencyByCountry = (countryCode: string): string => {
  return getCountryInfo(countryCode).currency;
};

/**
 * Obtenir le drapeau d'un pays
 */
export const getCountryFlag = (countryCode: string): string => {
  return getCountryInfo(countryCode).flag;
};

/**
 * Formater un montant selon le pays
 */
export const formatCurrency = (
  amount: number, 
  countryCode: string, 
  showSymbol: boolean = true
): string => {
  const country = getCountryInfo(countryCode);
  
  // Déterminer le nombre de décimales selon la devise
  const decimalPlaces = getDecimalPlaces(country.currency);
  const minimumFractionDigits = decimalPlaces;
  const maximumFractionDigits = decimalPlaces;
  
  try {
    const formatter = new Intl.NumberFormat(country.locale, {
      style: showSymbol ? 'currency' : 'decimal',
      currency: country.currency,
      minimumFractionDigits,
      maximumFractionDigits,
    });
    
    if (showSymbol) {
      return formatter.format(amount);
    } else {
      return `${formatter.format(amount)} ${country.currency}`;
    }
  } catch (error) {
    // Fallback si la locale n'est pas supportée
    const formattedAmount = decimalPlaces > 0
      ? amount.toFixed(decimalPlaces)
      : amount.toLocaleString();
    return `${formattedAmount} ${country.currency}`;
  }
};

/**
 * Obtenir la liste des pays supportés
 */
export const getSupportedCountries = (): CountryInfo[] => {
  return Object.values(COUNTRIES);
};

/**
 * Vérifier si un pays est supporté
 */
export const isCountrySupported = (countryCode: string): boolean => {
  return countryCode in COUNTRIES;
};

// =====================================================
// 💱 SYSTÈME DE CONVERSION DE DEVISES
// =====================================================

/**
 * Taux de change par rapport au XAF (Franc CFA)
 * Base : 1 XAF = X autre devise
 * Taux de fallback - Les vrais taux sont récupérés via useRealExchangeRates
 */
export let EXCHANGE_RATES: Record<string, number> = {
  'XAF': 1,        // Devise de base (Franc CFA)
  'CDF': 3.7286,   // Franc Congolais (RDC) - 700 XAF = 2,610.02 CDF
  'USD': 0.001757, // Dollar US - 700 XAF = 1.23 USD
  'EUR': 0.001514, // Euro - 700 XAF = 1.06 EUR
  'CAD': 0.00245,  // Dollar Canadien (estimation basée sur USD)
};

/**
 * Mettre à jour les taux de change (appelé par le hook)
 */
export const updateExchangeRates = (newRates: Record<string, number>) => {
  EXCHANGE_RATES = { ...newRates };
};

/**
 * Convertir un montant de XAF vers une autre devise
 */
export const convertFromXAF = (amountXAF: number, targetCurrency: string): number => {
  const rate = EXCHANGE_RATES[targetCurrency];
  if (!rate) {
    console.warn(`Taux de change non trouvé pour ${targetCurrency}, utilisation de XAF`);
    return amountXAF;
  }
  
  const convertedAmount = amountXAF * rate;
  
  // Arrondir selon le nombre de décimales approprié pour la devise
  const decimalPlaces = getDecimalPlaces(targetCurrency);
  if (decimalPlaces > 0) {
    const multiplier = Math.pow(10, decimalPlaces);
    return Math.round(convertedAmount * multiplier) / multiplier;
  }
  
  // Arrondir à l'entier pour les devises sans décimales
  return Math.round(convertedAmount);
};

/**
 * Convertir un montant vers XAF depuis une autre devise
 */
export const convertToXAF = (amount: number, sourceCurrency: string): number => {
  const rate = EXCHANGE_RATES[sourceCurrency];
  if (!rate) {
    console.warn(`Taux de change non trouvé pour ${sourceCurrency}, utilisation de XAF`);
    return amount;
  }
  return Math.round(amount / rate);
};

/**
 * Formater un montant avec conversion automatique
 */
export const formatCurrencyWithConversion = (
  amountXAF: number,
  targetCurrency: string,
  showSymbol: boolean = true
): string => {
  const convertedAmount = convertFromXAF(amountXAF, targetCurrency);
  
  // Trouver le pays correspondant à la devise
  const country = Object.values(COUNTRIES).find(c => c.currency === targetCurrency) || COUNTRIES['CG'];
  
  // Déterminer le nombre de décimales selon la devise
  const decimalPlaces = getDecimalPlaces(targetCurrency);
  const minimumFractionDigits = decimalPlaces;
  const maximumFractionDigits = decimalPlaces;
  
  try {
    const formatter = new Intl.NumberFormat(country.locale, {
      style: showSymbol ? 'currency' : 'decimal',
      currency: targetCurrency,
      minimumFractionDigits,
      maximumFractionDigits,
    });
    
    if (showSymbol) {
      return formatter.format(convertedAmount);
    } else {
      return `${formatter.format(convertedAmount)} ${targetCurrency}`;
    }
  } catch (error) {
    // Fallback si la locale n'est pas supportée
    const formattedAmount = decimalPlaces > 0
      ? convertedAmount.toFixed(decimalPlaces)
      : convertedAmount.toLocaleString();
    return `${formattedAmount} ${targetCurrency}`;
  }
};

/**
 * Obtenir la liste des devises supportées
 */
export const getSupportedCurrencies = (): Array<{code: string, name: string, flag: string}> => {
  const currencies = new Set<string>();
  Object.values(COUNTRIES).forEach(country => currencies.add(country.currency));
  
  return Array.from(currencies).map(currency => {
    const country = Object.values(COUNTRIES).find(c => c.currency === currency)!;
    return {
      code: currency,
      name: getCurrencyName(currency),
      flag: country.flag
    };
  });
};

/**
 * Obtenir le nom complet d'une devise
 */
export const getCurrencyName = (currencyCode: string): string => {
  const names: Record<string, string> = {
    'XAF': 'Franc CFA',
    'CDF': 'Franc Congolais',
    'EUR': 'Euro',
    'USD': 'Dollar US',
    'CAD': 'Dollar Canadien'
  };
  return names[currencyCode] || currencyCode;
};

/**
 * Déterminer si une devise doit afficher des décimales
 */
export const shouldShowDecimals = (currencyCode: string): boolean => {
  return ['EUR', 'USD', 'CAD'].includes(currencyCode);
};

/**
 * Obtenir le nombre de décimales à afficher pour une devise
 */
export const getDecimalPlaces = (currencyCode: string): number => {
  return shouldShowDecimals(currencyCode) ? 2 : 0;
};

/**
 * DÉTECTION AUTOMATIQUE PAR PAYS
 */

/**
 * Mapper les locales système vers nos codes pays
 */
const LOCALE_TO_COUNTRY: Record<string, string> = {
  'fr-CD': 'CD',
  'fr-CG': 'CG', 
  'fr-FR': 'FR',
  'fr-BE': 'BE',
  'fr-CA': 'CA',
  'fr-CH': 'CH',
  'fr-SN': 'SN',
  'fr-CI': 'CI',
  'fr-CM': 'CM',
  'fr-GA': 'GA',
  'en-US': 'US',
  'en-GB': 'GB',
  'de-DE': 'DE',
  'es-ES': 'ES',
  'it-IT': 'IT',
  'ar-MA': 'MA',
  // Fallbacks pour les langues principales
  'fr': 'CG', // Par défaut Congo pour le français
  'en': 'US', // Par défaut US pour l'anglais
  'de': 'DE',
  'es': 'ES',
  'it': 'IT',
  'ar': 'MA'
};

/**
 * Détecter le pays de l'utilisateur basé sur sa locale système
 */
export const detectUserCountry = (): string => {
  try {
    // Obtenir la locale système
    const systemLocale = Intl.DateTimeFormat().resolvedOptions().locale;
    console.log('🌍 Locale système détectée:', systemLocale);
    
    // Essayer de mapper directement
    if (LOCALE_TO_COUNTRY[systemLocale]) {
      console.log('✅ Pays détecté:', LOCALE_TO_COUNTRY[systemLocale]);
      return LOCALE_TO_COUNTRY[systemLocale];
    }
    
    // Essayer avec juste la langue (fr, en, etc.)
    const language = systemLocale.split('-')[0];
    if (LOCALE_TO_COUNTRY[language]) {
      console.log('✅ Pays détecté par langue:', LOCALE_TO_COUNTRY[language]);
      return LOCALE_TO_COUNTRY[language];
    }
    
    // Fallback par défaut
    console.log('⚠️ Pays non détecté, utilisation du défaut: CG');
    return 'CG';
    
  } catch (error) {
    console.error('❌ Erreur détection pays:', error);
    return 'CG'; // Fallback sécurisé
  }
};

/**
 * Obtenir la langue par défaut selon le pays
 */
export const getDefaultLanguageByCountry = (countryCode: string): 'fr' | 'en' => {
  const country = getCountryInfo(countryCode);
  const locale = country.locale;
  
  // Déterminer la langue principale
  if (locale.startsWith('en')) return 'en';
  if (locale.startsWith('fr')) return 'fr';
  
  // Fallback selon le pays
  const englishCountries = ['US', 'GB'];
  return englishCountries.includes(countryCode) ? 'en' : 'fr';
};

/**
 * Obtenir la devise par défaut selon le pays
 */
export const getDefaultCurrencyByCountry = (countryCode: string): string => {
  return getCurrencyByCountry(countryCode);
};

/**
 * Configuration automatique complète selon le pays
 */
export const getAutoConfigByCountry = (countryCode?: string) => {
  const detectedCountry = countryCode || detectUserCountry();
  const country = getCountryInfo(detectedCountry);
  const language = getDefaultLanguageByCountry(detectedCountry);
  
  // Utiliser le nom du pays dans la langue appropriée
  const countryName = language === 'en' ? 
    (country.nameEn || country.name) : 
    country.name;
  
  return {
    country: detectedCountry,
    countryName,
    language,
    currency: getDefaultCurrencyByCountry(detectedCountry),
    locale: country.locale,
    flag: country.flag
  };
};

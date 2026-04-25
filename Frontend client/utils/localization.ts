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
  return COUNTRIES[countryCode] || COUNTRIES['CG']; // Par défaut Congo
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
 * Mapper les codes pays géolocalisés vers nos codes pays
 */
const GEO_COUNTRY_TO_COUNTRY: Record<string, string> = {
  // Afrique Centrale
  'CD': 'CD', // RDC
  'CG': 'CG', // Congo-Brazzaville
  'CM': 'CM', // Cameroun
  'GA': 'GA', // Gabon
  'CF': 'CG', // Centrafrique -> Congo
  'TD': 'CG', // Tchad -> Congo
  'GQ': 'CG', // Guinée Équatoriale -> Congo
  
  // Afrique de l'Ouest
  'CI': 'CI', // Côte d'Ivoire
  'SN': 'SN', // Sénégal
  'ML': 'SN', // Mali -> Sénégal
  'BF': 'SN', // Burkina Faso -> Sénégal
  'NE': 'SN', // Niger -> Sénégal
  'BJ': 'SN', // Bénin -> Sénégal
  'TG': 'SN', // Togo -> Sénégal
  'SL': 'SN', // Sierra Leone -> Sénégal
  'LR': 'SN', // Libéria -> Sénégal
  'GN': 'SN', // Guinée -> Sénégal
  'GW': 'SN', // Guinée-Bissau -> Sénégal
  
  // Afrique du Nord
  'MA': 'MA', // Maroc
  'DZ': 'MA', // Algérie -> Maroc
  'TN': 'MA', // Tunisie -> Maroc
  'LY': 'MA', // Libye -> Maroc
  'EG': 'MA', // Égypte -> Maroc
  
  // Europe (fallback vers Congo)
  'FR': 'CG', // France -> Congo
  'BE': 'CG', // Belgique -> Congo
  'CH': 'CG', // Suisse -> Congo
  'DE': 'CG', // Allemagne -> Congo
  'ES': 'CG', // Espagne -> Congo
  'IT': 'CG', // Italie -> Congo
  'GB': 'CG', // UK -> Congo
  'NL': 'CG', // Pays-Bas -> Congo
  'PT': 'CG', // Portugal -> Congo
  
  // Amérique (fallback vers Congo)
  'US': 'CG', // USA -> Congo
  'CA': 'CG', // Canada -> Congo
  'BR': 'CG', // Brésil -> Congo
  'AR': 'CG', // Argentine -> Congo
  'MX': 'CG', // Mexique -> Congo
  
  // Asie (fallback vers Congo)
  'CN': 'CG', // Chine -> Congo
  'IN': 'CG', // Inde -> Congo
  'JP': 'CG', // Japon -> Congo
  'KR': 'CG', // Corée -> Congo
  'TH': 'CG', // Thaïlande -> Congo
  'SG': 'CG', // Singapour -> Congo
};

/**
 * Obtenir le pays par géolocalisation
 */
export const detectCountryByGeolocation = async (): Promise<string> => {
  return new Promise(async (resolve) => {
    try {
      // Vérifier si nous sommes sur mobile (Expo) ou web
      const isExpo = typeof window !== 'undefined' && window.expo;
      
      if (!isExpo) {
        // Web : utiliser l'API du navigateur
        console.log('🌐 Mode web détecté, utilisation de l\'API navigateur');
        if (!navigator.geolocation) {
          console.log('⚠️ Géolocalisation non supportée, utilisation de la locale');
          resolve(detectUserCountry());
          return;
        }
        
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              console.log('📍 Position détectée (navigateur):', { latitude, longitude });
              
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
                {
                  headers: {
                    'User-Agent': 'Mossombi-App/1.0'
                  }
                }
              );
              
              if (!response.ok) {
                throw new Error('Erreur API géolocalisation');
              }
              
              const data = await response.json();
              const countryCode = data.address?.country_code?.toUpperCase();
              
              if (countryCode && GEO_COUNTRY_TO_COUNTRY[countryCode]) {
                const mappedCountry = GEO_COUNTRY_TO_COUNTRY[countryCode];
                console.log(`✅ Pays détecté par géolocalisation (navigateur): ${countryCode} -> ${mappedCountry}`);
                resolve(mappedCountry);
              } else if (countryCode) {
                console.log(`⚠️ Pays ${countryCode} non mappé, utilisation du défaut: CG`);
                resolve('CG');
              } else {
                console.log('⚠️ Impossible de détecter le pays, utilisation de la locale');
                resolve(detectUserCountry());
              }
            } catch (error) {
              console.error('❌ Erreur géolocalisation (navigateur):', error);
              resolve(detectUserCountry());
            }
          },
          (error) => {
            console.error('❌ Erreur permission géolocalisation (navigateur):', error);
            resolve(detectUserCountry());
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          }
        );
        return;
      }

      // Mobile : utiliser Expo Location
      console.log('📱 Mode mobile détecté, tentative d\'utiliser Expo Location');
      
      try {
        // Importer Expo Location de manière synchrone
        const Location = require('expo-location').default;
        
        if (!Location) {
          console.log('⚠️ Expo Location non disponible, utilisation de la locale');
          resolve(detectUserCountry());
          return;
        }

        // Vérifier les permissions
        let { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          console.log('⚠️ Permission de géolocalisation refusée, utilisation de la locale');
          resolve(detectUserCountry());
          return;
        }

        // Obtenir la position actuelle
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const { latitude, longitude } = location.coords;
        console.log('📍 Position détectée (Expo):', { latitude, longitude });

        // Utiliser l'API Nominatim pour la géolocalisation inverse
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'Mossombi-App/1.0'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Erreur API géolocalisation');
        }

        const data = await response.json();
        const countryCode = data.address?.country_code?.toUpperCase();

        if (countryCode && GEO_COUNTRY_TO_COUNTRY[countryCode]) {
          const mappedCountry = GEO_COUNTRY_TO_COUNTRY[countryCode];
          console.log(`✅ Pays détecté par géolocalisation (Expo): ${countryCode} -> ${mappedCountry}`);
          resolve(mappedCountry);
        } else if (countryCode) {
          console.log(`⚠️ Pays ${countryCode} non mappé, utilisation du défaut: CG`);
          resolve('CG');
        } else {
          console.log('⚠️ Impossible de détecter le pays, utilisation de la locale');
          resolve(detectUserCountry());
        }

      } catch (expoError) {
        console.log('⚠️ Expo Location non disponible, utilisation de la locale');
        console.log('ℹ️ Détail Expo Location:', expoError instanceof Error ? expoError.message : String(expoError));
        resolve(detectUserCountry());
      }

    } catch (error) {
      console.error('❌ Erreur géolocalisation générale:', error);
      resolve(detectUserCountry());
    }
  });
};

/**
 * Détecter le pays avec géolocalisation en priorité
 */
export const detectUserCountryWithGeolocation = async (): Promise<string> => {
  try {
    // Essayer la géolocalisation d'abord
    const geoCountry = await detectCountryByGeolocation();
    return geoCountry;
  } catch (error) {
    console.log('⚠️ Échec géolocalisation, fallback sur locale');
    console.log('ℹ️ Détail géolocalisation:', error instanceof Error ? error.message : String(error));
    return detectUserCountry();
  }
};

/**
 * Mapper les locales système vers nos codes pays
 */
const LOCALE_TO_COUNTRY: Record<string, string> = {
  'fr-CD': 'CD',
  'fr-CG': 'CG', 
  'fr-FR': 'CG',  // Rediriger FR vers Congo
  'fr-BE': 'CG',  // Rediriger BE vers Congo
  'fr-CA': 'CG',  // Rediriger CA vers Congo
  'fr-CH': 'CG',  // Rediriger CH vers Congo
  'fr-SN': 'SN',
  'fr-CI': 'CI',
  'fr-CM': 'CM',
  'fr-GA': 'GA',
  'en-US': 'CG',  // Rediriger US vers Congo
  'en-GB': 'CG',  // Rediriger GB vers Congo
  'de-DE': 'CG',  // Rediriger DE vers Congo
  'es-ES': 'CG',  // Rediriger ES vers Congo
  'it-IT': 'CG',  // Rediriger IT vers Congo
  'ar-MA': 'MA',
  // Fallbacks pour les langues principales
  'fr': 'CG', // Par défaut Congo pour le français
  'en': 'CG', // Par défaut Congo pour l'anglais
  'de': 'CG',
  'es': 'CG',
  'it': 'CG',
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
 * Configuration automatique complète selon le pays (fallback pour compatibilité)
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

/**
 * Configuration automatique complète avec géolocalisation
 */
export const getAutoConfigByCountryWithGeolocation = async (countryCode?: string) => {
  if (countryCode) {
    // Si un pays est spécifié, l'utiliser directement
    const country = getCountryInfo(countryCode);
    const language = getDefaultLanguageByCountry(countryCode);
    const countryName = language === 'en' ? 
      (country.nameEn || country.name) : 
      country.name;
    
    return {
      country: countryCode,
      countryName,
      language,
      currency: getDefaultCurrencyByCountry(countryCode),
      locale: country.locale,
      flag: country.flag,
      detectionMethod: 'manual'
    };
  }
  
  try {
    // Essayer la géolocalisation d'abord
    const detectedCountry = await detectUserCountryWithGeolocation();
    const country = getCountryInfo(detectedCountry);
    const language = getDefaultLanguageByCountry(detectedCountry);
    
    const countryName = language === 'en' ? 
      (country.nameEn || country.name) : 
      country.name;
    
    return {
      country: detectedCountry,
      countryName,
      language,
      currency: getDefaultCurrencyByCountry(detectedCountry),
      locale: country.locale,
      flag: country.flag,
      detectionMethod: 'geolocation'
    };
  } catch (error) {
    console.error('❌ Échec détection, fallback sur locale:', error);
    
    // Fallback sur la détection par locale
    const detectedCountry = detectUserCountry();
    const country = getCountryInfo(detectedCountry);
    const language = getDefaultLanguageByCountry(detectedCountry);
    
    const countryName = language === 'en' ? 
      (country.nameEn || country.name) : 
      country.name;
    
    return {
      country: detectedCountry,
      countryName,
      language,
      currency: getDefaultCurrencyByCountry(detectedCountry),
      locale: country.locale,
      flag: country.flag,
      detectionMethod: 'locale'
    };
  }
};

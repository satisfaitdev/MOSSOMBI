/**
 * DONNÉES DE LOCALISATION CENTRALISÉES
 *
 * Base de données centralisée pour tous les pays, villes et districts
 * utilisés dans les pages de réservation (hôtel, vol, etc.).
 *
 * Évite la duplication de données entre les composants.
 */

export interface City {
  name: string;
  districts: string[];
}

export interface Country {
  name: string;
  flag: string;
  currency: string;
  cities: Record<string, City>;
}

export interface LocationData {
  [countryCode: string]: Country;
}

// Base de données centralisée des localisations
export const LOCATION_DATA: LocationData = {
  'CD': {
    name: 'RD Congo',
    flag: '🇨🇩',
    currency: 'CDF',
    cities: {
      'kinshasa': {
        name: 'Kinshasa',
        districts: ['Gombe', 'Kalamu', 'Lemba', 'Bandalungwa', 'Kintambo', 'Ngaliema', 'Mont-Ngafula', 'Selembao']
      },
      'lubumbashi': {
        name: 'Lubumbashi',
        districts: ['Kenya', 'Kampemba', 'Katuba', 'Annexe', 'Kamalondo', 'Rwashi']
      },
      'goma': {
        name: 'Goma',
        districts: ['Goma Centre', 'Himbi', 'Karisimbi', 'Mikeno', 'Nyiragongo']
      },
      'kisangani': {
        name: 'Kisangani',
        districts: ['Makiso', 'Mangobo', 'Tshopo', 'Lubunga', 'Kabondo']
      },
      'kananga': {
        name: 'Kananga',
        districts: ['Centre', 'Nord', 'Sud', 'Est', 'Ouest']
      },
      'matadi': {
        name: 'Matadi',
        districts: ['Centre', 'Mvuadu', 'Nzanza', 'Mpalabanda']
      }
    }
  },
  'FR': {
    name: 'France',
    flag: '🇫🇷',
    currency: 'EUR',
    cities: {
      'paris': {
        name: 'Paris',
        districts: ['1er arr.', '2e arr.', 'Marais', 'Montmartre', 'Saint-Germain', 'Champs-Élysées']
      },
      'lyon': {
        name: 'Lyon',
        districts: ['Vieux Lyon', 'Presqu\'île', 'Part-Dieu', 'Croix-Rousse', 'Confluence']
      },
      'marseille': {
        name: 'Marseille',
        districts: ['Vieux-Port', 'Canebière', 'Notre-Dame', 'Prado']
      }
    }
  },
  'BE': {
    name: 'Belgique',
    flag: '🇧🇪',
    currency: 'EUR',
    cities: {
      'bruxelles': {
        name: 'Bruxelles',
        districts: ['Centre', 'Ixelles', 'Uccle', 'Schaerbeek', 'Etterbeek', 'Saint-Gilles']
      },
      'anvers': {
        name: 'Anvers',
        districts: ['Centre historique', 'Zuid', 'Eilandje', 'Zurenborg']
      },
      'liege': {
        name: 'Liège',
        districts: ['Centre', 'Outremeuse', 'Sclessin', 'Rocourt']
      }
    }
  },
  'CA': {
    name: 'Canada',
    flag: '🇨🇦',
    currency: 'CAD',
    cities: {
      'montreal': {
        name: 'Montréal',
        districts: ['Vieux-Montréal', 'Plateau', 'Mile End', 'Westmount', 'Outremont']
      },
      'toronto': {
        name: 'Toronto',
        districts: ['Downtown', 'Yorkville', 'Distillery', 'Queen West', 'Kensington']
      },
      'vancouver': {
        name: 'Vancouver',
        districts: ['Downtown', 'Gastown', 'Yaletown', 'Kitsilano']
      }
    }
  }
};

// Utilitaires pour travailler avec les données de localisation
export const getCountries = () => Object.entries(LOCATION_DATA).map(([code, country]) => ({
  code,
  ...country
}));

export const getCountryByCode = (code: string): Country | undefined => LOCATION_DATA[code];

export const getCitiesByCountry = (countryCode: string): { code: string; name: string; districts: string[] }[] => {
  const country = LOCATION_DATA[countryCode];
  if (!country) return [];

  return Object.entries(country.cities).map(([code, city]) => ({
    code,
    name: city.name,
    districts: city.districts
  }));
};

export const getCityByCode = (countryCode: string, cityCode: string): City | undefined => {
  const country = LOCATION_DATA[countryCode];
  return country?.cities[cityCode];
};

export const getDistrictsByCity = (countryCode: string, cityCode: string): string[] => {
  const city = getCityByCode(countryCode, cityCode);
  return city?.districts || [];
};

// Liste des aéroports pour les vols
export const AIRPORTS = [
  { code: 'FIH', name: 'Aéroport International de N\'djili', city: 'Kinshasa', country: 'RDC' },
  { code: 'LBV', name: 'Aéroport International Léon-Mba', city: 'Libreville', country: 'Gabon' },
  { code: 'DLA', name: 'Aéroport de Douala', city: 'Douala', country: 'Cameroun' },
  { code: 'BZV', name: 'Aéroport Maya-Maya', city: 'Brazzaville', country: 'Congo' },
  { code: 'CDG', name: 'Aéroport Charles de Gaulle', city: 'Paris', country: 'France' },
  { code: 'BRU', name: 'Aéroport de Bruxelles', city: 'Bruxelles', country: 'Belgique' },
  { code: 'YUL', name: 'Aéroport de Montréal', city: 'Montréal', country: 'Canada' },
  { code: 'YYZ', name: 'Aéroport de Toronto', city: 'Toronto', country: 'Canada' },
  { code: 'YVR', name: 'Aéroport de Vancouver', city: 'Vancouver', country: 'Canada' },
] as const;

export const getAirportsByCountry = (countryName: string) =>
  AIRPORTS.filter(airport => airport.country === countryName);

export const getAirportByCode = (code: string) =>
  AIRPORTS.find(airport => airport.code === code);

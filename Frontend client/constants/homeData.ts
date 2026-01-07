/**
 * Données de la page d'accueil - Mossombi
 * Centralise les services et banners pour éviter le hardcoding
 */

import { Coins, Ticket, Sparkles, Hotel, ShoppingBag, Plane, Car, CreditCard } from 'lucide-react-native';

export interface HomeService {
  id: string;
  titleKey: string; // Clé de traduction au lieu du titre fixe
  iconComponent: any; // LucideIcon component
  route: string;
  color?: string; // Couleur de l'icône
}

export interface TrendingService extends HomeService {
  subtitleKey: string; // Clé de traduction pour le sous-titre
  color: string;
}

export interface HomeBanner {
  id: string;
  title: string;
  description: string;
  ctaText: string;
  imageUrl: any;
}

// Services principaux (8 services) avec couleurs du dégradé
export const getMainServices = (colors: any): HomeService[] => [
  { id: 'coins', titleKey: 'coinsMarket', iconComponent: Coins, route: '/coins', color: colors.gradient.start },
  { id: 'billetterie', titleKey: 'ticketing', iconComponent: Ticket, route: '/billetterie', color: colors.gradient.middle },
  { id: 'digital-services', titleKey: 'digitalServices', iconComponent: Sparkles, route: '/digital-services', color: colors.gradient.end },
  { id: 'public-services', titleKey: 'publicServices', iconComponent: Hotel, route: '/public-services', color: colors.gradient.start },
  { id: 'supermarket', titleKey: 'supermarket', iconComponent: ShoppingBag, route: '/supermarket', color: colors.gradient.middle },
  { id: 'bookings', titleKey: 'bookings', iconComponent: Plane, route: '/bookings', color: colors.gradient.end },
  { id: 'delivery', titleKey: 'deliveryRide', iconComponent: Car, route: '/delivery', color: colors.gradient.start },
  { id: 'banking', titleKey: 'bankingService', iconComponent: CreditCard, route: '/banking', color: colors.gradient.middle },
];

// Services en vogue (4 services)
export const getTrendingServices = (colors: any): TrendingService[] => [
  { 
    id: 'coins', 
    titleKey: 'coinsMarket', 
    subtitleKey: 'buyCoins', 
    iconComponent: Coins, 
    route: '/coins',
    color: colors.gradient.start 
  },
  { 
    id: 'billetterie', 
    titleKey: 'ticketing', 
    subtitleKey: 'eventsConcerts', 
    iconComponent: Ticket, 
    route: '/billetterie',
    color: colors.gradient.middle 
  },
  { 
    id: 'bookings', 
    titleKey: 'travel', 
    subtitleKey: 'flightsHotels', 
    iconComponent: Plane, 
    route: '/bookings',
    color: colors.gradient.end 
  },
  { 
    id: 'supermarket', 
    titleKey: 'supermarket', 
    subtitleKey: 'onlineShopping', 
    iconComponent: ShoppingBag, 
    route: '/supermarket',
    color: colors.gradient.start 
  },
];

// Banners promotionnels (3 banners)
export const homeBanners: HomeBanner[] = [
  { 
    id: '1', 
    title: '🎉 Promotion exclusive', 
    description: 'Profitez de 20% de réduction sur tous vos achats ce mois-ci !', 
    ctaText: 'Découvrir',
    imageUrl: require('@/assets/bannerAd1.png')
  },
  { 
    id: '2', 
    title: '✈️ Voyagez moins cher', 
    description: 'Réservez vos billets d\'avion avec 30% de réduction', 
    ctaText: 'Réserver',
    imageUrl: require('@/assets/bannerAd2.jpg')
  },
  { 
    id: '3', 
    title: '🎫 Événements à venir', 
    description: 'Découvrez les meilleurs concerts et spectacles', 
    ctaText: 'Voir plus',
    imageUrl: require('@/assets/bannerAd3.png')
  },
];

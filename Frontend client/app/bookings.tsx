import React from 'react';
import { useRouter } from 'expo-router';
import {
  Hotel,
  Car,
  Plane,
  Train,
  Bus,
  FileText,
  MapPin,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import CategoryCard from '@/components/molecules/CategoryCard';
import PageContainer from '@/components/layouts/PageContainer';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';

interface BookingService {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  iconColor: string;
  route: string;
}

export default function BookingsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const services: BookingService[] = [
    {
      id: 'hotel',
      name: 'Hébergement',
      description: 'Hôtels et locations',
      icon: <Hotel size={32} color={colors.primary} />,
      iconColor: colors.primary,
      route: '/bookings/hotel',
    },
    {
      id: 'car',
      name: 'Location Voiture',
      description: 'Louez une voiture',
      icon: <Car size={32} color={colors.secondary} />,
      iconColor: colors.secondary,
      route: '/bookings/car',
    },
    {
      id: 'flight',
      name: 'Vols',
      description: 'Billets d\'avion',
      icon: <Plane size={32} color={colors.accent} />,
      iconColor: colors.accent,
      route: '/bookings/flight',
    },
    {
      id: 'train',
      name: 'Train',
      description: 'Billets de train',
      icon: <Train size={32} color={colors.primary} />,
      iconColor: colors.primary,
      route: '/bookings/train',
    },
    {
      id: 'bus',
      name: 'Autobus',
      description: 'Voyages par route',
      icon: <Bus size={32} color={colors.secondary} />,
      iconColor: colors.secondary,
      route: '/bookings/bus',
    },
    {
      id: 'visa',
      name: 'Dossiers Visa',
      description: 'Assistance visa voyage',
      icon: <FileText size={32} color={colors.accent} />,
      iconColor: colors.accent,
      route: '/bookings/visa',
    },
    {
      id: 'guide',
      name: 'Guide Touristique',
      description: 'Guides locaux',
      icon: <MapPin size={32} color={colors.primary} />,
      iconColor: colors.primary,
      route: '/bookings/guide',
    },
  ];

  const handleServicePress = (route: string) => {
    router.push(route as any);
  };

  return (
    <PageContainer>
      {services.map((service) => (
        <CategoryCard
          key={service.id}
          name={service.name}
          description={service.description}
          icon={service.icon}
          iconColor={service.iconColor}
          onPress={() => handleServicePress(service.route)}
        />
      ))}
    </PageContainer>
  );
}

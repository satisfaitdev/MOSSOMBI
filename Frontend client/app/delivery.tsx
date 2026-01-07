import React from 'react';
import { useRouter } from 'expo-router';
import { Package, Car, Flame, Truck } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import CategoryCard from '@/components/molecules/CategoryCard';
import PageContainer from '@/components/layouts/PageContainer';

interface DeliveryService {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  iconColor: string;
  route: string;
}

export default function DeliveryScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const services: DeliveryService[] = [
    {
      id: 'package',
      name: 'Livraison Colis',
      description: 'Envoyez vos colis',
      icon: <Package size={32} color={colors.primary} />,
      iconColor: colors.primary,
      route: '/delivery/package',
    },
    {
      id: 'taxi',
      name: 'Réservation Taxi',
      description: 'Taxi dans la ville',
      icon: <Car size={32} color={colors.secondary} />,
      iconColor: colors.secondary,
      route: '/delivery/taxi',
    },
    {
      id: 'gas',
      name: 'Livraison Gaz',
      description: 'Bonbonne de gaz',
      icon: <Flame size={32} color={colors.accent} />,
      iconColor: colors.accent,
      route: '/delivery/gas',
    },
    {
      id: 'moving',
      name: 'Déménagement',
      description: 'Service de déménagement',
      icon: <Truck size={32} color={colors.primary} />,
      iconColor: colors.primary,
      route: '/delivery/moving',
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

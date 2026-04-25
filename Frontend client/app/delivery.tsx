import React from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Package, Car, Flame, Truck } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import CategoryCard from '@/components/molecules/CategoryCard';
import { CategoryPageLayout } from '@/components/templates';

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
      description: 'Envoyez vos colis en toute sécurité dans toute la ville.',
      icon: <Package size={32} color={colors.primary} />,
      iconColor: colors.primary,
      route: '/delivery/package',
    },
    {
      id: 'taxi',
      name: 'Réservation Taxi',
      description: 'Commandez un chauffeur professionnel pour vos déplacements.',
      icon: <Car size={32} color={colors.secondary} />,
      iconColor: colors.secondary,
      route: '/delivery/taxi',
    },
    {
      id: 'gas',
      name: 'Livraison Gaz',
      description: 'Commandez votre bonbonne de gaz sans vous déplacer.',
      icon: <Flame size={32} color={colors.accent} />,
      iconColor: colors.accent,
      route: '/delivery/gas',
    },
    {
      id: 'moving',
      name: 'Déménagement',
      description: 'Service complet pour votre déménagement en toute sérénité.',
      icon: <Truck size={32} color={colors.primary} />,
      iconColor: colors.primary,
      route: '/delivery/moving',
    },
  ];

  const handleServicePress = (route: string) => {
    router.push(route as any);
  };

  return (
    <CategoryPageLayout
      title="Livraison et Transport"
      backgroundIcons={
        <>
          <Package
            size={100}
            color="#FFFFFF"
            style={{ opacity: 0.65, position: 'absolute', top: insets.top + 20, left: 45 }}
          />
          <Car
            size={85}
            color="#FFFFFF"
            style={{
              opacity: 0.6,
              position: 'absolute',
              top: insets.top + 35,
              right: 40,
              transform: [{ rotate: '10deg' }],
            }}
          />
          <Truck
            size={70}
            color="#FFFFFF"
            style={{ opacity: 0.6, position: 'absolute', top: insets.top + 75, left: '46%' }}
          />
        </>
      }
    >
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
    </CategoryPageLayout>
  );
}

import React from 'react';
import { useRouter } from 'expo-router';
import {
  Zap,
  Droplet,
  Wifi,
  GraduationCap,
  Phone,
  Home,
  FileText,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import CategoryCard from '@/components/molecules/CategoryCard';
import { CategoryPageLayout } from '@/components/templates';

interface PublicService {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  iconColor: string;
  route: string;
}

export default function PublicServicesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const services: PublicService[] = [
    {
      id: 'electricity',
      name: 'Paiement Électricité',
      description: 'Payez vos factures SNEL',
      icon: <Zap size={32} color={colors.primary} />,
      iconColor: colors.primary,
      route: '/public-services/electricity',
    },
    {
      id: 'water',
      name: 'Paiement Eau',
      description: 'Payez vos factures REGIDESO',
      icon: <Droplet size={32} color={colors.secondary} />,
      iconColor: colors.secondary,
      route: '/public-services/water',
    },
    {
      id: 'internet',
      name: 'Paiement Internet',
      description: 'Rechargez votre connexion',
      icon: <Wifi size={32} color={colors.accent} />,
      iconColor: colors.accent,
      route: '/public-services/internet',
    },
    {
      id: 'school',
      name: 'Frais de Scolarité',
      description: 'Payez les frais scolaires',
      icon: <GraduationCap size={32} color={colors.primary} />,
      iconColor: colors.primary,
      route: '/public-services/school',
    },
    {
      id: 'phone',
      name: 'Recharge Téléphone',
      description: 'Crédit d\'appel et internet',
      icon: <Phone size={32} color={colors.secondary} />,
      iconColor: colors.secondary,
      route: '/public-services/phone',
    },
    {
      id: 'rent',
      name: 'Paiement Loyer',
      description: 'Payez votre loyer en ligne',
      icon: <Home size={32} color={colors.accent} />,
      iconColor: colors.accent,
      route: '/public-services/rent',
    },
    {
      id: 'documents',
      name: 'Documents Officiels',
      description: 'Demande de documents',
      icon: <FileText size={32} color={colors.primary} />,
      iconColor: colors.primary,
      route: '/public-services/documents',
    },
  ];

  const handleServicePress = (route: string) => {
    router.push(route as any);
  };

  return (
    <CategoryPageLayout
      title="Services Publics"
      backgroundIcons={
        <>
          <Zap
            size={100}
            color="#FFFFFF"
            style={{ opacity: 0.65, position: 'absolute', top: insets.top + 20, left: 45 }}
          />
          <FileText
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
          <Home
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

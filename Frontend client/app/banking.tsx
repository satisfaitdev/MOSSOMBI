import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { CreditCard, Send, Wallet, PiggyBank } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import CategoryCard from '@/components/molecules/CategoryCard';
import PageContainer from '@/components/layouts/PageContainer';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';

interface BankingService {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  iconColor: string;
  route: string;
}

export default function BankingScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const services: BankingService[] = [
    {
      id: 'transfer',
      name: 'Transfert',
      description: 'Envoyer de l\'argent',
      icon: <Send size={32} color={colors.primary} />,
      iconColor: colors.primary,
      route: '/banking/transfer',
    },
    {
      id: 'withdraw',
      name: 'Retrait',
      description: 'Retirer en agence',
      icon: <Wallet size={32} color={colors.secondary} />,
      iconColor: colors.secondary,
      route: '/banking/withdraw',
    },
    {
      id: 'virtual-card',
      name: 'Carte Virtuelle',
      description: 'Payer en ligne',
      icon: <CreditCard size={32} color={colors.accent} />,
      iconColor: colors.accent,
      route: '/banking/virtual-card',
    },
    {
      id: 'savings',
      name: 'Épargne',
      description: 'Mettez de côté',
      icon: <PiggyBank size={32} color={colors.primary} />,
      iconColor: colors.primary,
      route: '/banking/savings',
    },
  ];

  const handleServicePress = (route: string) => {
    router.push(route as any);
  };

  return (
    <PageContainer>
      <HeaderWithBackButton title="Banque" />
      <View
        style={{
          position: 'absolute',
          top: insets.top + 20,
          left: 45,
        }}
      >
        <CreditCard size={100} color="#FFFFFF" style={{ opacity: 0.65 }} />
      </View>
      <View
        style={{
          position: 'absolute',
          top: insets.top + 35,
          right: 40,
          transform: [{ rotate: '10deg' }],
        }}
      >
        <Wallet size={85} color="#FFFFFF" style={{ opacity: 0.6 }} />
      </View>
      <View
        style={{
          position: 'absolute',
          top: insets.top + 75,
          left: '46%',
        }}
      >
        <Send size={70} color="#FFFFFF" style={{ opacity: 0.6 }} />
      </View>
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

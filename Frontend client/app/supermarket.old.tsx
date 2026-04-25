import React from 'react';
import { useRouter } from 'expo-router';
import {
  Smartphone,
  Shirt,
  Home,
  Utensils,
  Laptop,
  Baby,
  Heart,
  ShoppingBag,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import CategoryCard from '@/components/molecules/CategoryCard';
import { CategoryPageLayout } from '@/components/templates';

interface ShopCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  iconColor: string;
  route: string;
  isNew?: boolean;
}

export default function SupermarketScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const categories: ShopCategory[] = [
    {
      id: 'electronics',
      name: 'Électroménager',
      description: 'Appareils pour la maison',
      icon: <Home size={32} color={colors.primary} />,
      iconColor: colors.primary,
      route: '/supermarket/electronics',
    },
    {
      id: 'phones',
      name: 'Téléphones & Accessoires',
      description: 'Smartphones et gadgets',
      icon: <Smartphone size={32} color={colors.secondary} />,
      iconColor: colors.secondary,
      route: '/supermarket/phones',
      isNew: true,
    },
    {
      id: 'clothing',
      name: 'Habillement',
      description: 'Vêtements et mode',
      icon: <Shirt size={32} color={colors.accent} />,
      iconColor: colors.accent,
      route: '/supermarket/clothing',
    },
    {
      id: 'computers',
      name: 'Ordinateurs',
      description: 'PC et accessoires',
      icon: <Laptop size={32} color={colors.primary} />,
      iconColor: colors.primary,
      route: '/supermarket/computers',
    },
    {
      id: 'food',
      name: 'Alimentation',
      description: 'Produits alimentaires',
      icon: <Utensils size={32} color={colors.secondary} />,
      iconColor: colors.secondary,
      route: '/supermarket/food',
    },
    {
      id: 'baby',
      name: 'Bébé & Enfants',
      description: 'Produits pour enfants',
      icon: <Baby size={32} color={colors.accent} />,
      iconColor: colors.accent,
      route: '/supermarket/baby',
    },
    {
      id: 'beauty',
      name: 'Beauté & Santé',
      description: 'Cosmétiques et soins',
      icon: <Heart size={32} color={colors.primary} />,
      iconColor: colors.primary,
      route: '/supermarket/beauty',
    },
  ];

  const handleCategoryPress = (route: string) => {
    router.push(route as any);
  };

  return (
    <CategoryPageLayout
      title="Supermarché"
      backgroundIcons={
        <>
          <ShoppingBag
            size={100}
            color="#FFFFFF"
            style={{ opacity: 0.65, position: 'absolute', top: insets.top + 20, left: 45 }}
          />
          <Shirt
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
          <Smartphone
            size={70}
            color="#FFFFFF"
            style={{ opacity: 0.6, position: 'absolute', top: insets.top + 75, left: '46%' }}
          />
        </>
      }
    >
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          name={category.name}
          description={category.description}
          icon={category.icon}
          iconColor={category.iconColor}
          isNew={category.isNew}
          onPress={() => handleCategoryPress(category.route)}
        />
      ))}
    </CategoryPageLayout>
  );
}

import React from 'react';
import { View, Dimensions } from 'react-native';
import { SPACING } from '@/constants/colors';
import { Heading } from '@/components/atoms';
import CoinServiceCard from '@/components/molecules/CoinServiceCard';

const { width } = Dimensions.get('window');

interface CoinService {
  id: string;
  name: string;
  coins: number;
  price: number;
  compareAtPrice?: number;
  category: string;
  currency: string;
  isExclusive?: boolean;
}

interface CoinServiceGridProps {
  services: CoinService[];
  showCategoryTitle?: boolean;
  categoryTitle?: string;
  onServicePress: (service: CoinService) => void;
}

export default function CoinServiceGrid({
  services,
  showCategoryTitle = false,
  categoryTitle,
  onServicePress,
}: CoinServiceGridProps) {
  if (services.length === 0) return null;

  return (
    <View style={{ marginBottom: SPACING.xl }}>
      {showCategoryTitle && categoryTitle && (
        <Heading level={3} style={{ marginBottom: SPACING.md }}>
          {categoryTitle}
        </Heading>
      )}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: SPACING.xs,
        }}
      >
        {services.map((service) => (
          <View
            key={service.id}
            style={{
              width: (width - SPACING.md * 2 - SPACING.xs * 2) / 3,
            }}
          >
            <CoinServiceCard
              coins={service.coins}
              price={service.price}
              compareAtPrice={service.compareAtPrice}
              onPress={() => onServicePress(service)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

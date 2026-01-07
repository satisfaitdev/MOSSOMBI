import React from 'react';
import { View, useWindowDimensions, Platform } from 'react-native';
import { SPACING } from '@/constants/colors';
import { COMMON_STYLES } from '@/constants/styles';

interface ServiceGridProps<T> {
  items: T[];
  renderItem: (item: T, itemWidth: number) => React.ReactNode;
  gap?: number;
  paddingHorizontal?: number;
  responsive?: boolean;
}

/**
 * ServiceGrid - Grille responsive pour services avec logique de colonnes
 * Organism réutilisable qui gère automatiquement le responsive
 * 
 * @example
 * <ServiceGrid
 *   items={services}
 *   renderItem={(service, itemWidth) => (
 *     <View style={{ width: itemWidth }}>
 *       <ServiceCard {...service} />
 *     </View>
 *   )}
 * />
 */
export default function ServiceGrid<T extends { id: string }>({
  items,
  renderItem,
  gap = 8,
  paddingHorizontal = SPACING.lg,
  responsive = true,
}: ServiceGridProps<T>) {
  const { width } = useWindowDimensions();

  if (items.length === 0) return null;

  // Logique responsive - Force 4 colonnes pour les services populaires
  const getNumColumns = () => {
    if (!responsive) return 4; // Par défaut 4 colonnes si pas responsive
    
    // Pour les services populaires, toujours 4 colonnes sur mobile
    if (Platform.OS === 'web') {
      return width >= 480 ? 4 : 4; // 4 colonnes même sur petit écran web
    }
    return 4; // Mobile toujours 4 colonnes
  };

  const numColumns = getNumColumns();
  // PageContainer utilise horizontalPadding = 16 par défaut
  const pageContainerPadding = 16;
  const totalPadding = paddingHorizontal > 0 ? (paddingHorizontal * 2) : (pageContainerPadding * 2);
  const availableWidth = width - totalPadding;
  const itemWidth = (availableWidth - (gap * (numColumns - 1))) / numColumns;

  return (
    <View style={[COMMON_STYLES.row, { flexWrap: 'wrap', gap }]}>
      {items.map((item) => renderItem(item, itemWidth))}
    </View>
  );
}

import React, { ReactNode } from 'react';
import { ScrollView, View, RefreshControl } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import Input from '@/components/Input';
import FilterChips from '@/components/molecules/FilterChips';
import { Heading, Body } from '@/components/atoms';
import { Ticket } from 'lucide-react-native';

interface ServicePageLayoutProps {
  title: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  exclusiveCarousel?: ReactNode;
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  emptyMessage?: string;
  showEmpty?: boolean;
}

/**
 * Layout réutilisable pour les pages de services (Coins, Billetterie, Services Digitaux)
 * 
 * @example
 * <ServicePageLayout
 *   title="Marché des coins"
 *   searchQuery={searchQuery}
 *   onSearchChange={setSearchQuery}
 *   categories={categories}
 *   selectedCategory={selectedCategory}
 *   onCategoryChange={setSelectedCategory}
 *   exclusiveCarousel={<ExclusiveCarousel ... />}
 * >
 *   <ServiceGrid items={filteredServices} renderItem={...} />
 * </ServicePageLayout>
 */
export default function ServicePageLayout({
  title,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Rechercher...',
  categories,
  selectedCategory,
  onCategoryChange,
  exclusiveCarousel,
  children,
  refreshing = false,
  onRefresh,
  emptyMessage = 'Aucun résultat trouvé',
  showEmpty = false,
}: ServicePageLayoutProps) {
  const { colors } = useTheme();

  return (
    <>
      <HeaderWithBackButton title={title} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
        contentContainerStyle={{ paddingBottom: SPACING.xl }}
      >
        {/* Carrousel d'offres exclusives */}
        {exclusiveCarousel}

        {/* Barre de recherche */}
        <View style={{ paddingHorizontal: SPACING.md, marginBottom: SPACING.md }}>
          <Input
            variant="search"
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder={searchPlaceholder}
          />
        </View>

        {/* Filtres par catégorie */}
        <FilterChips
          options={categories}
          selected={selectedCategory}
          onSelect={onCategoryChange}
        />

        {/* Contenu principal (grille/liste) */}
        <View style={{ paddingHorizontal: SPACING.md }}>
          {showEmpty ? (
            <View style={{ alignItems: 'center', paddingVertical: SPACING.xl * 2 }}>
              <Ticket size={48} color={colors.textTertiary} />
              <Body style={{ color: colors.textSecondary, marginTop: SPACING.md }}>
                {emptyMessage}
              </Body>
            </View>
          ) : (
            children
          )}
        </View>
      </ScrollView>
    </>
  );
}

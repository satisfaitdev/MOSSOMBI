import React, { ReactNode } from 'react';
import { ScrollView, View, RefreshControl, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';
import { Ticket, ChevronLeft, Search, Bell } from 'lucide-react-native';
import { Body } from '@/components/atoms';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import GradientBackground from '@/components/atoms/GradientBackground';
import FilterChips from '@/components/molecules/FilterChips';

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
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <GradientBackground style={{ flex: 1 }} opacity="10">
      <View style={{ height: insets.top }} />

      {/* Header Glassmorphic */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        gap: SPACING.md,
        zIndex: 10,
      }}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            {
              width: 36,
              height: 36,
              borderRadius: 20,
              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: pressed ? 0.9 : 1 }]
            }
          ]}
        >
          <ChevronLeft color={colors.text} size={22} />
        </Pressable>

        <View style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.8)',
          borderRadius: 20,
          paddingHorizontal: SPACING.md,
          height: 40,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        }}>
          <Search color={colors.textTertiary} size={18} />
          <TextInput
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={onSearchChange}
            style={{ flex: 1, marginLeft: SPACING.sm, color: colors.text, fontSize: 15 }}
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            {
              width: 36,
              height: 36,
              borderRadius: 20,
              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: pressed ? 0.9 : 1 }]
            }
          ]}
        >
          <Bell color={colors.text} size={20} />
          <View style={{
            position: 'absolute', top: 10, right: 10, width: 8, height: 8,
            borderRadius: 4, backgroundColor: colors.error
          }} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
        contentContainerStyle={{ paddingBottom: SPACING.xl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.lg, marginBottom: SPACING.sm }}>
          <AdaptiveText variant="title" weight="bold" style={{ fontSize: 24 }}>{title}</AdaptiveText>
        </View>

        {/* Carrousel d'offres exclusives */}
        {exclusiveCarousel}

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
    </GradientBackground>
  );
}

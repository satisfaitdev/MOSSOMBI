import React from 'react';
import { ScrollView, View, StyleSheet, ActivityIndicator } from 'react-native';
import { Body } from '@/components/atoms';
import { Center, Stack } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import { LAYOUT, SPACING } from '@/constants/colors';

// ==========================================
// TYPES
// ==========================================

interface SearchLayoutProps<T> {
  searchBar?: React.ReactNode;
  topFilters?: React.ReactNode;
  filters?: React.ReactNode;
  results: T[];
  renderItem: (item: T) => React.ReactNode;
  loading?: boolean;
  emptyState?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  onLoadMore?: () => void;
  customResults?: React.ReactNode;
}

// ==========================================
// SEARCH LAYOUT TEMPLATE
// ==========================================

/**
 * SearchLayout - Template universel pour pages de recherche
 * 
 * Remplace 10+ pages identiques (hotel, flight, train, bus, etc.)
 * 
 * @example
 * <SearchLayout
 *   searchBar={<SearchBar value={query} onChange={setQuery} />}
 *   filters={<FiltersSection />}
 *   results={filteredResults}
 *   renderItem={(item) => <ResultCard item={item} />}
 *   loading={isLoading}
 * />
 */
export default function SearchLayout<T>({
  searchBar,
  topFilters,
  filters,
  results,
  renderItem,
  loading = false,
  emptyState,
  header,
  footer,
  keyExtractor = (_, index) => index.toString(),
  customResults,
}: SearchLayoutProps<T>) {
  const { colors } = useTheme();

  // Empty state par défaut
  const defaultEmptyState = (
    <Center style={{ paddingVertical: SPACING.xxl * 2 }}>
      <Body variant="secondary">Aucun résultat trouvé</Body>
    </Center>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: 'transparent' }]}
      contentContainerStyle={LAYOUT.scrollViewContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header optionnel */}
      {header}

      {/* Search Bar */}
      {searchBar && (
        <View style={{ marginBottom: LAYOUT.sectionSpacing }}>
          {searchBar}
        </View>
      )}

      {/* Top Filters (ex: location selector) */}
      {topFilters && (
        <View style={{ marginBottom: LAYOUT.sectionSpacing }}>
          {topFilters}
        </View>
      )}

      {/* Filters Section */}
      {filters && (
        <View style={{ marginBottom: LAYOUT.sectionSpacing }}>
          {filters}
        </View>
      )}

      {/* Loading State */}
      {loading ? (
        <Center style={{ paddingVertical: SPACING.xxl }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </Center>
      ) : (
        <>
          {/* Results Count */}
          {(!customResults && results.length > 0) && (
            <Body
              variant="secondary"
              style={{ marginBottom: SPACING.md }}
            >
              {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
            </Body>
          )}

          {/* Results Area */}
          {customResults ? (
            customResults
          ) : results.length > 0 ? (
            <Stack spacing="md">
              {results.map((item, index) => (
                <View key={keyExtractor(item, index)}>
                  {renderItem(item)}
                </View>
              ))}
            </Stack>
          ) : (
            emptyState || defaultEmptyState
          )}
        </>
      )}

      {/* Footer optionnel */}
      {footer}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

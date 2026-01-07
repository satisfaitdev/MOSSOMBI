import React from 'react';
import { ScrollView, View, StyleSheet, RefreshControl } from 'react-native';
import { Heading } from '@/components/atoms';
import { Stack } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import { LAYOUT, SPACING } from '@/constants/colors';

// ==========================================
// TYPES
// ==========================================

interface ListLayoutProps<T> {
  title?: string;
  header?: React.ReactNode;
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  onRefresh?: () => void;
  refreshing?: boolean;
  footer?: React.ReactNode;
  spacing?: keyof typeof SPACING;
}

// ==========================================
// LIST LAYOUT TEMPLATE
// ==========================================

/**
 * ListLayout - Template pour listes simples
 * 
 * @example
 * <ListLayout
 *   title="Services"
 *   items={services}
 *   renderItem={(service) => <ServiceCard service={service} />}
 *   onRefresh={handleRefresh}
 * />
 */
export default function ListLayout<T>({
  title,
  header,
  items,
  renderItem,
  keyExtractor = (_, index) => index.toString(),
  onRefresh,
  refreshing = false,
  footer,
  spacing = 'md',
}: ListLayoutProps<T>) {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={LAYOUT.scrollViewContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        ) : undefined
      }
    >
      {/* Title */}
      {title && (
        <Heading level={2} style={{ marginBottom: SPACING.lg }}>
          {title}
        </Heading>
      )}

      {/* Header optionnel */}
      {header}

      {/* Items List */}
      <Stack spacing={spacing}>
        {items.map((item, index) => (
          <View key={keyExtractor(item, index)}>
            {renderItem(item, index)}
          </View>
        ))}
      </Stack>

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

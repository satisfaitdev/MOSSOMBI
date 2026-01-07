import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { LAYOUT } from '@/constants/colors';

// ==========================================
// TYPES
// ==========================================

interface DetailLayoutProps {
  header: React.ReactNode;
  content: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
}

// ==========================================
// DETAIL LAYOUT TEMPLATE
// ==========================================

/**
 * DetailLayout - Template pour pages de détail
 * 
 * @example
 * <DetailLayout
 *   header={<ProductHeader product={product} />}
 *   content={<ProductDetails product={product} />}
 *   actions={<AddToCartButton />}
 * />
 */
export default function DetailLayout({
  header,
  content,
  actions,
  footer,
}: DetailLayoutProps) {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={LAYOUT.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        {header}

        {/* Content */}
        {content}

        {/* Footer optionnel */}
        {footer}
      </ScrollView>

      {/* Actions fixes en bas */}
      {actions && (
        <View
          style={[
            styles.actionsContainer,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
            },
          ]}
        >
          {actions}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  actionsContainer: {
    padding: LAYOUT.screenPadding,
    borderTopWidth: 1,
  },
});

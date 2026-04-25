import React from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdaptiveCard } from '@/components/ui/AdaptiveCard';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import { AdaptiveButton } from '@/components/ui/AdaptiveButton';
import { useTheme } from '@/contexts/ThemeContext';

export default function DesignSystemDemo() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <AdaptiveText variant="display" style={styles.title}>
            Mossombi Design System
          </AdaptiveText>
          <AdaptiveText variant="body" color={colors.textSecondary} style={styles.subtitle}>
            {Platform.OS === 'ios' ? '🍎 Liquid Glass' : '🤖 Material 3 Expressive'}
          </AdaptiveText>
        </View>

        {/* Cards Section */}
        <View style={styles.section}>
          <AdaptiveText variant="headline" style={styles.sectionTitle}>
            Cards & Containers
          </AdaptiveText>
          
          <AdaptiveCard margin={16}>
            <AdaptiveText variant="title">Liquid Glass / Material 3</AdaptiveText>
            <AdaptiveText variant="body" color={colors.textSecondary}>
              Adaptive card that uses Liquid Glass on iOS and Material 3 on Android
            </AdaptiveText>
          </AdaptiveCard>

          <AdaptiveCard 
            margin={16}
            variant={Platform.OS === 'android' ? 'filled' : undefined}
            intensity={Platform.OS === 'ios' ? 80 : undefined}
          >
            <AdaptiveText variant="title">Filled Card</AdaptiveText>
            <AdaptiveText variant="body" color={colors.textSecondary}>
              Different variants for Material 3 on Android
            </AdaptiveText>
          </AdaptiveCard>

          <AdaptiveCard 
            margin={16}
            variant={Platform.OS === 'android' ? 'outlined' : undefined}
            intensity={Platform.OS === 'ios' ? 40 : undefined}
          >
            <AdaptiveText variant="title">Outlined Card</AdaptiveText>
            <AdaptiveText variant="body" color={colors.textSecondary}>
              Subtle glass effect or outlined Material 3
            </AdaptiveText>
          </AdaptiveCard>
        </View>

        {/* Buttons Section */}
        <View style={styles.section}>
          <AdaptiveText variant="headline" style={styles.sectionTitle}>
            Buttons
          </AdaptiveText>
          
          <View style={styles.buttonRow}>
            <AdaptiveButton variant="primary" style={styles.button}>
              Primary
            </AdaptiveButton>
            <AdaptiveButton variant="secondary" style={styles.button}>
              Secondary
            </AdaptiveButton>
          </View>

          <View style={styles.buttonRow}>
            <AdaptiveButton variant="tertiary" style={styles.button}>
              Tertiary
            </AdaptiveButton>
            <AdaptiveButton variant="surface" style={styles.button}>
              Surface
            </AdaptiveButton>
          </View>

          <View style={styles.buttonRow}>
            <AdaptiveButton variant="primary" size="sm" style={styles.button}>
              Small
            </AdaptiveButton>
            <AdaptiveButton variant="primary" size="lg" style={styles.button}>
              Large
            </AdaptiveButton>
          </View>
        </View>

        {/* Typography Section */}
        <View style={styles.section}>
          <AdaptiveText variant="headline" style={styles.sectionTitle}>
            Typography
          </AdaptiveText>
          
          <AdaptiveCard margin={16}>
            <AdaptiveText variant="display">Display Text</AdaptiveText>
            <AdaptiveText variant="headline">Headline Text</AdaptiveText>
            <AdaptiveText variant="title">Title Text</AdaptiveText>
            <AdaptiveText variant="body">Body Text - Regular paragraph text for content</AdaptiveText>
            <AdaptiveText variant="caption">Caption Text - Small secondary text</AdaptiveText>
          </AdaptiveCard>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <AdaptiveText variant="headline" style={styles.sectionTitle}>
            Platform Features
          </AdaptiveText>
          
          <AdaptiveCard margin={16}>
            <AdaptiveText variant="title">🍎 iOS Features</AdaptiveText>
            <AdaptiveText variant="body" color={colors.textSecondary}>
              • Liquid Glass blur effects
              • Smooth animations
              • Native iOS typography
              • Haptic feedback
              • Apple Intelligence ready
            </AdaptiveText>
          </AdaptiveCard>

          <AdaptiveCard margin={16}>
            <AdaptiveText variant="title">🤖 Android Features</AdaptiveText>
            <AdaptiveText variant="body" color={colors.textSecondary}>
              • Material 3 Expressive
              • Dynamic color theming
              • Ripple effects
              • Elevation shadows
              • Motion physics
            </AdaptiveText>
          </AdaptiveCard>
        </View>

        {/* AI Features Section */}
        <View style={styles.section}>
          <AdaptiveText variant="headline" style={styles.sectionTitle}>
            AI Integration
          </AdaptiveText>
          
          <AdaptiveCard margin={16}>
            <AdaptiveText variant="title">🧠 Apple Intelligence</AdaptiveText>
            <AdaptiveText variant="body" color={colors.textSecondary}>
              On-device LLM with @react-native-ai/apple
            </AdaptiveText>
            <AdaptiveButton variant="primary" size="sm" style={styles.aiButton}>
              Test AI Features
            </AdaptiveButton>
          </AdaptiveCard>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <AdaptiveText variant="caption" color={colors.textTertiary} style={styles.footerText}>
            Mossombi © 2025 - Premium Cross-Platform Experience
          </AdaptiveText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  aiButton: {
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    textAlign: 'center',
  },
});

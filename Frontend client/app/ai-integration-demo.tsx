import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdaptiveCard } from '@/components/ui/AdaptiveCard';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import { AdaptiveButton } from '@/components/ui/AdaptiveButton';
import { useTheme } from '@/contexts/ThemeContext';

export default function AIIntegrationDemo() {
  const { colors } = useTheme();
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const aiFeatures = [
    {
      id: 'smart-assistant',
      title: '🤖 Assistant Intelligent',
      description: 'Répondez aux questions des utilisateurs avec IA on-device',
      platform: 'ios',
      useCase: 'Support client, FAQ, aide contextuelle',
      implementation: 'Chatbot intégré avec Apple Intelligence',
      priority: 'high'
    },
    {
      id: 'transaction-insights',
      title: '📊 Analyse de Transactions',
      description: 'Analysez les habitudes de dépenses et donnez des recommandations',
      platform: 'both',
      useCase: 'Budget personnel, conseils financiers',
      implementation: 'IA on-device pour la analyse financière privée',
      priority: 'high'
    },
    {
      id: 'fraud-detection',
      title: '🔍 Détection de Fraude',
      description: 'Détectez les transactions suspectes en temps réel',
      platform: 'both',
      useCase: 'Sécurité, alertes de fraude',
      implementation: 'Machine learning on-device pour la sécurité',
      priority: 'critical'
    },
    {
      id: 'smart-categorization',
      title: '🏷️ Catégorisation Intelligente',
      description: 'Catégorisez automatiquement les dépenses par type',
      platform: 'both',
      useCase: 'Budget automatique, rapports financiers',
      implementation: 'NLP pour la classification des transactions',
      priority: 'medium'
    },
    {
      id: 'voice-assistant',
      title: '🎤 Assistant Vocal',
      description: 'Effectuez des transactions par commande vocale',
      platform: 'both',
      useCase: 'Accessibilité, mains libres',
      implementation: 'Speech-to-text + IA pour les commandes',
      priority: 'medium'
    },
    {
      id: 'personalized-offers',
      title: '🎯 Offres Personnalisées',
      description: 'Suggérez des offres basées sur les habitudes utilisateur',
      platform: 'both',
      useCase: 'Marketing, fidélisation',
      implementation: 'IA recommandation engine',
      priority: 'low'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return colors.error;
      case 'high': return colors.warning;
      case 'medium': return colors.info;
      case 'low': return colors.success;
      default: return colors.textSecondary;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'ios': return '🍎';
      case 'android': return '🤖';
      case 'both': return '🔄';
      default: return '📱';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <AdaptiveText variant="display" style={styles.title}>
            🧠 IA dans Mossombi
          </AdaptiveText>
          <AdaptiveText variant="body" color={colors.textSecondary} style={styles.subtitle}>
            Applications pratiques de l\'intelligence artificielle
          </AdaptiveText>
        </View>

        {/* Overview */}
        <AdaptiveCard margin={16}>
          <AdaptiveText variant="title" style={styles.cardTitle}>
            🎯 Stratégie IA Mossombi
          </AdaptiveText>
          <AdaptiveText variant="body" color={colors.textSecondary}>
            • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
          </AdaptiveText>
          <AdaptiveText variant="body" color={colors.textSecondary}>
            • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
          </AdaptiveText>
        </AdaptiveCard>

        {/* Features List */}
        <View style={styles.section}>
          <AdaptiveText variant="headline" style={styles.sectionTitle}>
            💡 Fonctionnalités IA Proposées
          </AdaptiveText>
          
          {aiFeatures.map((feature) => (
            <AdaptiveCard 
              key={feature.id} 
              margin={16}
              onPress={() => setSelectedFeature(selectedFeature === feature.id ? null : feature.id)}
            >
              <View style={styles.featureHeader}>
                <AdaptiveText variant="title" style={styles.featureTitle}>
                  {feature.title}
                </AdaptiveText>
                <View style={styles.featureMeta}>
                  <AdaptiveText variant="caption" style={styles.platformIcon}>
                    {getPlatformIcon(feature.platform)}
                  </AdaptiveText>
                  <AdaptiveText 
                    variant="caption" 
                    style={[styles.priority, { color: getPriorityColor(feature.priority) }]}
                  >
                    {feature.priority.toUpperCase()}
                  </AdaptiveText>
                </View>
              </View>
              
              <AdaptiveText variant="body" color={colors.textSecondary} style={styles.featureDescription}>
                {feature.description}
              </AdaptiveText>
              
              {selectedFeature === feature.id && (
                <View style={styles.featureDetails}>
                  <View style={styles.detailRow}>
                    <AdaptiveText variant="caption" style={styles.detailLabel}>
                      🎯 Cas d\'usage:
                    </AdaptiveText>
                    <AdaptiveText variant="body" color={colors.textSecondary}>
                      {feature.useCase}
                    </AdaptiveText>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <AdaptiveText variant="caption" style={styles.detailLabel}>
                      🔧 Implémentation:
                    </AdaptiveText>
                    <AdaptiveText variant="body" color={colors.textSecondary}>
                      {feature.implementation}
                    </AdaptiveText>
                  </View>
                  
                  <AdaptiveButton 
                    variant="surface" 
                    size="sm" 
                    style={styles.implementButton}
                  >
                    {feature.platform === 'ios' ? 'Démarrer iOS' : 'Démarrer Dév'}
                  </AdaptiveButton>
                </View>
              )}
            </AdaptiveCard>
          ))}
        </View>

        {/* Implementation Plan */}
        <View style={styles.section}>
          <AdaptiveText variant="headline" style={styles.sectionTitle}>
            📋 Plan d\'Implémentation
          </AdaptiveText>
          
          <AdaptiveCard margin={16}>
            <AdaptiveText variant="title" style={styles.cardTitle}>
              Phase 1: iOS (Apple Intelligence)
            </AdaptiveText>
            <AdaptiveText variant="body" color={colors.textSecondary}>
              • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
            </AdaptiveText>
            <AdaptiveButton variant="primary" size="sm" style={styles.phaseButton}>
              Démarrer Phase 1
            </AdaptiveButton>
          </AdaptiveCard>

          <AdaptiveCard margin={16}>
            <AdaptiveText variant="title" style={styles.cardTitle}>
              Phase 2: Android (Cloud AI)
            </AdaptiveText>
            <AdaptiveText variant="body" color={colors.textSecondary}>
              • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
            </AdaptiveText>
            <AdaptiveButton variant="secondary" size="sm" style={styles.phaseButton}>
              Planifier Phase 2
            </AdaptiveButton>
          </AdaptiveCard>
        </View>

        {/* Benefits */}
        <AdaptiveCard margin={16}>
          <AdaptiveText variant="title" style={styles.cardTitle}>
            🌟 Avantages pour Mossombi
          </AdaptiveText>
          <AdaptiveText variant="body" color={colors.textSecondary}>
            • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
          </AdaptiveText>
          <AdaptiveText variant="body" color={colors.textSecondary}>
            • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
          </AdaptiveText>
        </AdaptiveCard>

        {/* Footer */}
        <View style={styles.footer}>
          <AdaptiveText variant="caption" color={colors.textTertiary} style={styles.footerText}>
            Mossombi © 2025 - Powered by AI
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
  cardTitle: {
    marginBottom: 12,
  },
  featureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  featureTitle: {
    flex: 1,
    marginRight: 8,
  },
  featureMeta: {
    alignItems: 'flex-end',
  },
  platformIcon: {
    marginBottom: 4,
  },
  priority: {
    fontWeight: '600',
  },
  featureDescription: {
    marginBottom: 8,
  },
  featureDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    marginBottom: 4,
    fontWeight: '600',
  },
  implementButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  phaseButton: {
    marginTop: 12,
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

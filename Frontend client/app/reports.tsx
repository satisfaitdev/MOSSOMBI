import React, { useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { FileText, Download, Calendar, TrendingUp, DollarSign, ShoppingCart, Users, Filter } from 'lucide-react-native';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/colors';
import { Heading, Body, Caption, Badge } from '@/components/atoms';
import { Stack, Row } from '@/components/ui';
import { PageContainer, ContentCard, FilterChip } from '@/components/layouts';
import Button from '@/components/Button';
import GradientBackground from '@/components/atoms/GradientBackground';

export default function ReportsScreen() {
  const { colors } = useTheme();
  const [selectedType, setSelectedType] = useState<'all' | 'sales' | 'financial' | 'clients'>('all');

  const reportTypes = [
    { id: 'all', label: 'Tous', icon: <FileText size={20} color={colors.primary} /> },
    { id: 'sales', label: 'Ventes', icon: <ShoppingCart size={20} color={colors.primary} /> },
    { id: 'financial', label: 'Financier', icon: <DollarSign size={20} color={colors.primary} /> },
    { id: 'clients', label: 'Clients', icon: <Users size={20} color={colors.primary} /> },
  ];

  const quickReports = [
    { id: 'daily', title: 'Rapport journalier', description: 'Activités du jour', icon: <Calendar size={24} color={colors.primary} />, color: colors.primary },
    { id: 'weekly', title: 'Rapport hebdomadaire', description: 'Résumé de la semaine', icon: <TrendingUp size={24} color={colors.secondary} />, color: colors.secondary },
    { id: 'monthly', title: 'Rapport mensuel', description: 'Performance du mois', icon: <FileText size={24} color={colors.accent} />, color: colors.accent },
    { id: 'custom', title: 'Rapport personnalisé', description: 'Période personnalisée', icon: <Filter size={24} color={colors.warning} />, color: colors.warning },
  ];

  const recentReports = [
    { id: '1', title: 'Rapport des ventes - Janvier 2025', type: 'sales', date: '2025-01-31', size: '2.4 MB', status: 'ready' },
    { id: '2', title: 'Rapport financier - Décembre 2024', type: 'financial', date: '2024-12-31', size: '3.1 MB', status: 'ready' },
    { id: '3', title: 'Rapport clients - Q4 2024', type: 'clients', date: '2024-12-31', size: '1.8 MB', status: 'ready' },
    { id: '4', title: 'Rapport des ventes - Semaine 52', type: 'sales', date: '2024-12-29', size: '856 KB', status: 'ready' },
    { id: '5', title: 'Rapport personnalisé - 01-15 Jan', type: 'custom', date: '2025-01-15', size: '1.2 MB', status: 'processing' },
  ];

  const filteredReports = selectedType === 'all' 
    ? recentReports 
    : recentReports.filter(r => r.type === selectedType);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'sales': return 'Ventes';
      case 'financial': return 'Financier';
      case 'clients': return 'Clients';
      case 'custom': return 'Personnalisé';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sales': return colors.primary;
      case 'financial': return colors.success;
      case 'clients': return colors.accent;
      case 'custom': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  return (
    <GradientBackground style={{ flex: 1 }} opacity="10">
      <HeaderWithBackButton title="Rapports" />
      <PageContainer style={{ backgroundColor: 'transparent' }}>
          <Stack spacing="lg">
            {/* Générer un nouveau rapport */}
            <View>
              <Heading level={3} style={{ marginBottom: SPACING.md }}>Générer un rapport</Heading>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
                {quickReports.map((report) => (
                  <Pressable
                    key={report.id}
                    onPress={() => {
                      // Générer le rapport (à implémenter)
                    }}
                    style={({ pressed }) => ({
                      width: '48%',
                      backgroundColor: colors.card,
                      borderRadius: BORDER_RADIUS.lg,
                      padding: SPACING.md,
                      borderWidth: 1,
                      borderColor: colors.border,
                      opacity: pressed ? 0.7 : 1,
                      ...SHADOWS.sm,
                    })}
                  >
                    <View style={{ width: 48, height: 48, backgroundColor: report.color + '20', borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm }}>
                      {report.icon}
                    </View>
                    <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold, marginBottom: SPACING.xs / 2 }}>
                      {report.title}
                    </Body>
                    <Caption>{report.description}</Caption>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Filtres */}
            <View>
              <Heading level={3} style={{ marginBottom: SPACING.md }}>Rapports récents</Heading>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm, marginBottom: SPACING.md }}>
                {reportTypes.map((type) => (
                  <Pressable
                    key={type.id}
                    onPress={() => setSelectedType(type.id as any)}
                    style={{
                      backgroundColor: selectedType === type.id ? colors.primary : colors.card,
                      borderRadius: BORDER_RADIUS.full,
                      paddingHorizontal: SPACING.md,
                      paddingVertical: SPACING.xs,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: SPACING.xs,
                      borderWidth: 1,
                      borderColor: selectedType === type.id ? colors.primary : colors.border,
                    }}
                  >
                    {React.cloneElement(type.icon, { 
                      size: 16, 
                      color: selectedType === type.id ? '#FFFFFF' : colors.primary 
                    })}
                    <Body style={{ color: selectedType === type.id ? '#FFFFFF' : colors.text, fontSize: TYPOGRAPHY.sizes.xs, fontWeight: TYPOGRAPHY.weights.medium }}>
                      {type.label}
                    </Body>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Liste des rapports */}
              <Stack spacing="sm">
                {filteredReports.map((report) => (
                  <View
                    key={report.id}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: BORDER_RADIUS.lg,
                      padding: SPACING.md,
                      borderWidth: 1,
                      borderColor: colors.border,
                      ...SHADOWS.sm,
                    }}
                  >
                    <Row justify="space-between" align="flex-start">
                      <Row spacing="md" align="flex-start" style={{ flex: 1 }}>
                        <View style={{ width: 48, height: 48, backgroundColor: getTypeColor(report.type) + '20', borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center' }}>
                          <FileText size={24} color={getTypeColor(report.type)} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold, marginBottom: SPACING.xs / 2 }}>
                            {report.title}
                          </Body>
                          <Row spacing="xs" style={{ marginBottom: SPACING.xs }}>
                            <Badge size="sm" style={{ backgroundColor: getTypeColor(report.type) + '20' }}>
                              <Caption style={{ color: getTypeColor(report.type), fontWeight: TYPOGRAPHY.weights.bold }}>
                                {getTypeLabel(report.type)}
                              </Caption>
                            </Badge>
                            <Badge variant={report.status === 'ready' ? 'success' : 'warning'} size="sm">
                              {report.status === 'ready' ? 'Prêt' : 'En cours'}
                            </Badge>
                          </Row>
                          <Caption>
                            {new Date(report.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} • {report.size}
                          </Caption>
                        </View>
                      </Row>
                      {report.status === 'ready' && (
                        <Pressable
                          onPress={() => {
                            // Télécharger le rapport (à implémenter)
                          }}
                          style={({ pressed }) => ({
                            width: 40,
                            height: 40,
                            backgroundColor: colors.primary + '20',
                            borderRadius: BORDER_RADIUS.md,
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: pressed ? 0.7 : 1,
                          })}
                        >
                          <Download size={20} color={colors.primary} />
                        </Pressable>
                      )}
                    </Row>
                  </View>
                ))}
              </Stack>
            </View>

            {/* Informations */}
            <View style={{ backgroundColor: colors.primary + '10', borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: colors.primary + '30' }}>
              <Row spacing="sm" align="flex-start">
                <FileText size={20} color={colors.primary} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold, color: colors.primary, marginBottom: SPACING.xs }}>
                    Formats disponibles
                  </Body>
                  <Caption>
                    Les rapports sont disponibles en PDF et Excel. Vous pouvez les télécharger et les partager facilement.
                  </Caption>
                </View>
              </Row>
            </View>

            {/* Bouton d'action */}
            <Button
              title="Planifier un rapport automatique"
              onPress={() => {
                // Modal de planification (à implémenter)
              }}
              variant="outline"
              size="lg"
              fullWidth
              icon={<Calendar size={20} color={colors.primary} />}
            />
          </Stack>
      </PageContainer>
    </GradientBackground>
  );
}

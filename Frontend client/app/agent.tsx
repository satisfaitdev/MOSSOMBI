import React from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { Briefcase, TrendingUp, Users, DollarSign, Award, Target, Calendar, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/colors';
import { Heading, Body, Caption, Badge } from '@/components/atoms';
import { Stack, Row } from '@/components/ui';
import { PageContainer } from '@/components/layouts';

export default function AgentScreen() {
  const { colors } = useTheme();

  const stats = [
    { label: 'Ventes ce mois', value: '125', icon: <TrendingUp size={24} color={colors.primary} />, color: colors.primary },
    { label: 'Commissions', value: '45,000 CDF', icon: <DollarSign size={24} color={colors.success} />, color: colors.success },
    { label: 'Clients actifs', value: '87', icon: <Users size={24} color={colors.accent} />, color: colors.accent },
    { label: 'Niveau', value: 'Gold', icon: <Award size={24} color={colors.warning} />, color: colors.warning },
  ];

  const quickActions = [
    { id: 'new-sale', title: 'Nouvelle vente', icon: <DollarSign size={20} color={colors.primary} />, route: '/agent/new-sale' },
    { id: 'clients', title: 'Mes clients', icon: <Users size={20} color={colors.primary} />, route: '/agent/clients' },
    { id: 'commissions', title: 'Mes commissions', icon: <TrendingUp size={20} color={colors.primary} />, route: '/agent/commissions' },
    { id: 'objectives', title: 'Objectifs', icon: <Target size={20} color={colors.primary} />, route: '/agent/objectives' },
  ];

  const recentSales = [
    { id: '1', client: 'Client A', amount: 15000, service: 'Recharge', date: '2025-01-05 14:30', commission: 1500 },
    { id: '2', client: 'Client B', amount: 25000, service: 'Coins', date: '2025-01-05 10:15', commission: 2500 },
    { id: '3', client: 'Client C', amount: 8500, service: 'Billetterie', date: '2025-01-04 18:45', commission: 850 },
  ];

  return (
    <>
      <HeaderWithBackButton title="Espace Agent" />
      <PageContainer>
          <Stack spacing="lg">
            {/* En-tête avec gradient */}
            <LinearGradient
              colors={[colors.gradient.start, colors.gradient.middle, colors.gradient.end]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, ...SHADOWS.lg }}
            >
              <Row spacing="md" align="center">
                <View style={{ width: 60, height: 60, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: BORDER_RADIUS.full, alignItems: 'center', justifyContent: 'center' }}>
                  <Briefcase size={32} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Heading level={2} style={{ color: '#FFFFFF' }}>Agent Pro</Heading>
                  <Caption style={{ color: 'rgba(255,255,255,0.9)' }}>ID: AG-12345</Caption>
                  <Badge variant="success" size="sm" style={{ marginTop: SPACING.xs }}>Actif</Badge>
                </View>
              </Row>
            </LinearGradient>

            {/* Statistiques */}
            <View>
              <Heading level={3} style={{ marginBottom: SPACING.md }}>Statistiques</Heading>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
                {stats.map((stat, index) => (
                  <View
                    key={index}
                    style={{
                      width: '48%',
                      backgroundColor: colors.card,
                      borderRadius: BORDER_RADIUS.lg,
                      padding: SPACING.md,
                      borderWidth: 1,
                      borderColor: colors.border,
                      ...SHADOWS.sm,
                    }}
                  >
                    <View style={{ width: 40, height: 40, backgroundColor: stat.color + '20', borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm }}>
                      {stat.icon}
                    </View>
                    <Body style={{ fontSize: TYPOGRAPHY.sizes.xl, fontWeight: TYPOGRAPHY.weights.bold, color: stat.color }}>
                      {stat.value}
                    </Body>
                    <Caption>{stat.label}</Caption>
                  </View>
                ))}
              </View>
            </View>

            {/* Actions rapides */}
            <View>
              <Heading level={3} style={{ marginBottom: SPACING.md }}>Actions rapides</Heading>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
                {quickActions.map((action) => (
                  <Pressable
                    key={action.id}
                    onPress={() => {
                      // Navigation vers {action.route} (à implémenter)
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
                    <View style={{ width: 40, height: 40, backgroundColor: colors.primary + '20', borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm }}>
                      {action.icon}
                    </View>
                    <Caption style={{ fontWeight: TYPOGRAPHY.weights.semibold }}>{action.title}</Caption>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Ventes récentes */}
            <View>
              <Row justify="space-between" align="center" style={{ marginBottom: SPACING.md }}>
                <Heading level={3}>Ventes récentes</Heading>
                <Pressable onPress={() => {
                  // Voir toutes les ventes (à implémenter)
                }}>
                  <Caption style={{ color: colors.primary }}>Voir tout</Caption>
                </Pressable>
              </Row>
              <Stack spacing="sm">
                {recentSales.map((sale) => (
                  <Pressable key={sale.id} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                    <View style={{ backgroundColor: colors.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: colors.border, ...SHADOWS.sm }}>
                      <Row justify="space-between" align="center">
                        <View style={{ flex: 1 }}>
                          <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold }}>{sale.client}</Body>
                          <Caption>{sale.service} • {sale.date}</Caption>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Body style={{ fontWeight: TYPOGRAPHY.weights.bold, color: colors.primary }}>
                            {sale.amount.toLocaleString()} CDF
                          </Body>
                          <Caption style={{ color: colors.success }}>
                            +{sale.commission.toLocaleString()} CDF
                          </Caption>
                        </View>
                      </Row>
                    </View>
                  </Pressable>
                ))}
              </Stack>
            </View>

            {/* Objectifs du mois */}
            <View style={{ backgroundColor: colors.primary + '10', borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: colors.primary + '30' }}>
              <Row justify="space-between" align="center" style={{ marginBottom: SPACING.sm }}>
                <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold }}>Objectif du mois</Body>
                <Caption style={{ color: colors.primary }}>125 / 150 ventes</Caption>
              </Row>
              <View style={{ height: 8, backgroundColor: colors.surface, borderRadius: BORDER_RADIUS.full, overflow: 'hidden' }}>
                <View style={{ width: '83%', height: '100%', backgroundColor: colors.primary }} />
              </View>
              <Caption style={{ marginTop: SPACING.xs }}>Plus que 25 ventes pour atteindre votre objectif !</Caption>
            </View>
          </Stack>
      </PageContainer>
    </>
  );
}

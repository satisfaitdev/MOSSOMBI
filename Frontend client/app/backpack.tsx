import React, { useState } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { Backpack, Gift, Ticket, Trophy, Star, Clock, ChevronRight, FileText, Wifi, CreditCard, Plane, Bus, Hotel } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/colors';
import { Heading, Body, Caption, Badge } from '@/components/atoms';
import { Stack, Row } from '@/components/ui';
import { PageContainer, ContentCard, FilterChip } from '@/components/layouts';

export default function BackpackScreen() {
  const { colors } = useTheme();
  const [selectedTab, setSelectedTab] = useState<'all' | 'tickets' | 'vouchers' | 'subscriptions' | 'documents'>('all');

  const stats = [
    { label: 'Articles totaux', value: '32', icon: <Backpack size={24} color={colors.primary} />, color: colors.primary },
    { label: 'Billets', value: '10', icon: <Ticket size={24} color={colors.secondary} />, color: colors.secondary },
    { label: 'Abonnements', value: '6', icon: <Wifi size={24} color={colors.accent} />, color: colors.accent },
    { label: 'Documents', value: '8', icon: <FileText size={24} color={colors.warning} />, color: colors.warning },
  ];

  const items = [
    // Billets de voyage
    { id: '1', type: 'ticket', title: 'Billet Avion - Paris CDG', description: 'Vol AF 123 • Classe Éco', date: '2025-03-15', status: 'active', value: 850000, icon: <Plane size={20} color={colors.secondary} /> },
    { id: '2', type: 'ticket', title: 'Billet Bus - Kinshasa-Lubumbashi', description: 'Départ: 08h00 • Siège 12A', date: '2025-02-10', status: 'active', value: 35000, icon: <Bus size={20} color={colors.secondary} /> },
    { id: '3', type: 'ticket', title: 'Billet Concert - Fally Ipupa', description: 'VIP - Stade des Martyrs', date: '2025-02-15', status: 'active', value: 25000, icon: <Ticket size={20} color={colors.secondary} /> },
    
    // Réservations
    { id: '4', type: 'ticket', title: 'Réservation Hôtel - Grand Hôtel', description: 'Suite Premium - 3 nuits', date: '2025-03-14', status: 'active', value: 120000, icon: <Hotel size={20} color={colors.secondary} /> },
    
    // Abonnements
    { id: '5', type: 'subscription', title: 'Abonnement Internet - 100GB', description: 'Vodacom Fiber • Expire dans 25 jours', date: '2025-02-28', status: 'active', value: 0, icon: <Wifi size={20} color={colors.accent} /> },
    { id: '6', type: 'subscription', title: 'Abonnement Canal+', description: 'Pack Premium • Mensuel', date: '2025-02-20', status: 'active', value: 0, icon: <CreditCard size={20} color={colors.accent} /> },
    { id: '7', type: 'subscription', title: 'Abonnement Salle de Sport', description: 'Fitness Plus • 6 mois restants', date: '2025-07-30', status: 'active', value: 0, icon: <Trophy size={20} color={colors.accent} /> },
    
    // Documents & Dossiers
    { id: '8', type: 'document', title: 'Dossier Visa Schengen', description: 'En cours de traitement', date: '2025-03-01', status: 'pending', value: 0, icon: <FileText size={20} color={colors.warning} /> },
    { id: '9', type: 'document', title: 'Passeport - Copie certifiée', description: 'Valide jusqu\'en 2028', date: '2028-12-31', status: 'active', value: 0, icon: <FileText size={20} color={colors.warning} /> },
    { id: '10', type: 'document', title: 'Assurance Voyage', description: 'Couverture mondiale - 1 an', date: '2026-01-15', status: 'active', value: 0, icon: <FileText size={20} color={colors.warning} /> },
    
    // Bons et réductions
    { id: '11', type: 'voucher', title: 'Bon de réduction 20%', description: 'Valable sur tous les services', date: '2025-03-01', status: 'active', value: 0, icon: <Gift size={20} color={colors.primary} /> },
    { id: '12', type: 'voucher', title: 'Livraison gratuite', description: '3 livraisons offertes', date: '2025-02-28', status: 'active', value: 15000, icon: <Gift size={20} color={colors.primary} /> },
    
    // Utilisés/Expirés
    { id: '13', type: 'ticket', title: 'Billet Train - Matadi', description: 'Voyage effectué', date: '2025-01-05', status: 'used', value: 12000, icon: <Ticket size={20} color={colors.textTertiary} /> },
    { id: '14', type: 'subscription', title: 'Abonnement Netflix', description: 'Expiré', date: '2024-12-31', status: 'expired', value: 0, icon: <CreditCard size={20} color={colors.textTertiary} /> },
  ];

  const filteredItems = selectedTab === 'all' 
    ? items 
    : items.filter(item => {
        if (selectedTab === 'tickets') return item.type === 'ticket';
        if (selectedTab === 'vouchers') return item.type === 'voucher';
        if (selectedTab === 'subscriptions') return item.type === 'subscription';
        if (selectedTab === 'documents') return item.type === 'document';
        return true;
      });

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ticket': return 'Billet';
      case 'voucher': return 'Bon';
      case 'subscription': return 'Abonnement';
      case 'document': return 'Document';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ticket': return colors.secondary;
      case 'voucher': return colors.primary;
      case 'subscription': return colors.accent;
      case 'document': return colors.warning;
      default: return colors.primary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'used': return 'Utilisé';
      case 'pending': return 'En cours';
      case 'expired': return 'Expiré';
      default: return status;
    }
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'active': return 'success';
      case 'used': return 'default';
      case 'pending': return 'warning';
      case 'expired': return 'error';
      default: return 'default';
    }
  };

  return (
    <>
      <HeaderWithBackButton title="Sac à dos" />
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
                  <Backpack size={32} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Heading level={2} style={{ color: '#FFFFFF' }}>Mon Sac à dos</Heading>
                  <Caption style={{ color: 'rgba(255,255,255,0.9)' }}>
                    Vos billets, bons et récompenses
                  </Caption>
                </View>
              </Row>
            </LinearGradient>

            {/* Statistiques */}
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

            {/* Filtres */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm }}>
              {[
                { id: 'all', label: 'Tous', icon: <Backpack size={16} color={selectedTab === 'all' ? '#FFFFFF' : colors.primary} /> },
                { id: 'tickets', label: 'Billets', icon: <Ticket size={16} color={selectedTab === 'tickets' ? '#FFFFFF' : colors.primary} /> },
                { id: 'subscriptions', label: 'Abonnements', icon: <Wifi size={16} color={selectedTab === 'subscriptions' ? '#FFFFFF' : colors.primary} /> },
                { id: 'documents', label: 'Documents', icon: <FileText size={16} color={selectedTab === 'documents' ? '#FFFFFF' : colors.primary} /> },
                { id: 'vouchers', label: 'Bons', icon: <Gift size={16} color={selectedTab === 'vouchers' ? '#FFFFFF' : colors.primary} /> },
              ].map((tab) => (
                <FilterChip
                  key={tab.id}
                  label={tab.label}
                  selected={selectedTab === tab.id}
                  onPress={() => setSelectedTab(tab.id as any)}
                  icon={tab.icon}
                />
              ))}
            </ScrollView>

            {/* Liste des articles */}
            <View>
              <Heading level={3} style={{ marginBottom: SPACING.md }}>
                Articles ({filteredItems.length})
              </Heading>
              <Stack spacing="sm">
                {filteredItems.map((item) => (
                  <ContentCard key={item.id} onPress={() => {}}>
                      <Row spacing="md" align="flex-start">
                        <View style={{ width: 60, height: 60, backgroundColor: getTypeColor(item.type) + '20', borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center' }}>
                          {item.icon}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold, marginBottom: SPACING.xs / 2 }}>
                            {item.title}
                          </Body>
                          <Caption style={{ marginBottom: SPACING.xs }}>{item.description}</Caption>
                          <Row spacing="xs" style={{ marginBottom: SPACING.xs }}>
                            <Badge size="sm" style={{ backgroundColor: getTypeColor(item.type) + '20' }}>
                              <Caption style={{ color: getTypeColor(item.type), fontWeight: TYPOGRAPHY.weights.bold }}>
                                {getTypeLabel(item.type)}
                              </Caption>
                            </Badge>
                            <Badge variant={getStatusVariant(item.status)} size="sm">
                              {getStatusLabel(item.status)}
                            </Badge>
                          </Row>
                          <Row spacing="xs" align="center">
                            <Clock size={12} color={colors.textTertiary} />
                            <Caption style={{ color: colors.textTertiary }}>
                              {new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </Caption>
                          </Row>
                          {item.value > 0 && (
                            <Body style={{ marginTop: SPACING.xs, color: colors.primary, fontWeight: TYPOGRAPHY.weights.bold }}>
                              {item.value.toLocaleString()} CDF
                            </Body>
                          )}
                        </View>
                        <ChevronRight size={20} color={colors.textTertiary} />
                      </Row>
                  </ContentCard>
                ))}
              </Stack>
            </View>

            {/* Informations */}
            <View style={{ backgroundColor: colors.accent + '10', borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: colors.accent + '30' }}>
              <Row spacing="sm" align="flex-start">
                <Star size={20} color={colors.accent} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold, color: colors.accent, marginBottom: SPACING.xs }}>
                    Gagnez plus de récompenses
                  </Body>
                  <Caption>
                    Complétez des transactions pour débloquer des bons de réduction et des récompenses exclusives !
                  </Caption>
                </View>
              </Row>
            </View>
          </Stack>
      </PageContainer>
    </>
  );
}

import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Package, Clock, CheckCircle, XCircle, ShoppingBag, Plane, Zap, Truck, Ticket } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@/constants/colors';
import { Heading, Body, Caption, Badge } from '@/components/atoms';
import { Stack, Row } from '@/components/ui';
import { ContentCard, FilterChip } from '@/components/layouts';
import GradientBackground from '@/components/atoms/GradientBackground';

interface Order {
  id: string;
  type: string;
  category: 'shopping' | 'travel' | 'services' | 'delivery' | 'entertainment' | 'other';
  description: string;
  date: string;
  status: 'pending' | 'completed' | 'cancelled';
  amount: number;
}

const ORDERS: Order[] = [
  { id: '1', type: 'Réservation Hôtel', category: 'travel', description: 'Hôtel Pullman - 3 nuits', date: '2025-01-05', status: 'completed', amount: 150000 },
  { id: '2', type: 'Livraison Colis', category: 'delivery', description: 'Colis moyen - Gombe à Kalamu', date: '2025-01-04', status: 'pending', amount: 5000 },
  { id: '3', type: 'Achat Coins', category: 'shopping', description: 'Pack Premium - 1,500,000 coins', date: '2025-01-03', status: 'completed', amount: 149 },
  { id: '4', type: 'Billet Concert', category: 'entertainment', description: 'Concert Fally Ipupa - 2 billets', date: '2025-01-02', status: 'pending', amount: 100000 },
  { id: '5', type: 'Paiement Électricité', category: 'services', description: 'SNEL - Compteur 12345', date: '2025-01-01', status: 'completed', amount: 25000 },
  { id: '6', type: 'Billet Avion', category: 'travel', description: 'Kinshasa-Paris - 1 passager', date: '2025-01-06', status: 'pending', amount: 850000 },
  { id: '7', type: 'Supermarché', category: 'shopping', description: 'Carrefour - Courses mensuelles', date: '2025-01-03', status: 'completed', amount: 75000 },
  { id: '8', type: 'Recharge Internet', category: 'services', description: 'Vodacom - 50GB', date: '2025-01-02', status: 'pending', amount: 15000 },
];

export default function OrdersScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('pending');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'shopping' | 'travel' | 'services' | 'delivery' | 'entertainment'>('all');

  const filteredOrders = ORDERS.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || order.category === categoryFilter;
    return matchesStatus && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'shopping': return <ShoppingBag size={24} color={colors.primary} />;
      case 'travel': return <Plane size={24} color={colors.secondary} />;
      case 'services': return <Zap size={24} color={colors.accent} />;
      case 'delivery': return <Truck size={24} color={colors.warning} />;
      case 'entertainment': return <Ticket size={24} color={colors.error} />;
      default: return <Package size={24} color={colors.primary} />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'shopping': return 'Shopping';
      case 'travel': return 'Voyage';
      case 'services': return 'Services';
      case 'delivery': return 'Livraison';
      case 'entertainment': return 'Divertissement';
      default: return 'Autre';
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle size={20} color={colors.success} />;
    if (status === 'pending') return <Clock size={20} color={colors.warning} />;
    return <XCircle size={20} color={colors.error} />;
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' => {
    if (status === 'completed') return 'success';
    if (status === 'pending') return 'warning';
    return 'error';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'completed') return 'Terminé';
    if (status === 'pending') return 'En cours';
    return 'Annulé';
  };

  return (
    <GradientBackground style={{ flex: 1 }} opacity="10">
      <View style={{ height: insets.top }} />
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingTop: SPACING.lg }}>
        <Stack spacing="lg">
          <View><Heading level={1}>Mes Commandes</Heading><Caption>Suivez l&apos;état de vos transactions</Caption></View>

          {/* Filtres par statut */}
          <View>
            <Caption style={{ marginBottom: SPACING.sm, fontWeight: TYPOGRAPHY.weights.semibold }}>Statut</Caption>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm }}>
              {[
                { id: 'all', label: 'Tous' },
                { id: 'pending', label: 'En cours' },
                { id: 'completed', label: 'Terminés' },
                { id: 'cancelled', label: 'Annulés' },
              ].map((f) => (
                <FilterChip
                  key={f.id}
                  label={f.label}
                  selected={statusFilter === f.id}
                  onPress={() => setStatusFilter(f.id as any)}
                />
              ))}
            </ScrollView>
          </View>

          {/* Filtres par catégorie */}
          <View>
            <Caption style={{ marginBottom: SPACING.sm, fontWeight: TYPOGRAPHY.weights.semibold }}>Catégorie</Caption>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm }}>
              {[
                { id: 'all', label: 'Tous', icon: <Package size={16} color={categoryFilter === 'all' ? '#FFFFFF' : colors.primary} /> },
                { id: 'shopping', label: 'Shopping', icon: <ShoppingBag size={16} color={categoryFilter === 'shopping' ? '#FFFFFF' : colors.primary} /> },
                { id: 'travel', label: 'Voyage', icon: <Plane size={16} color={categoryFilter === 'travel' ? '#FFFFFF' : colors.primary} /> },
                { id: 'services', label: 'Services', icon: <Zap size={16} color={categoryFilter === 'services' ? '#FFFFFF' : colors.primary} /> },
                { id: 'delivery', label: 'Livraison', icon: <Truck size={16} color={categoryFilter === 'delivery' ? '#FFFFFF' : colors.primary} /> },
                { id: 'entertainment', label: 'Divertissement', icon: <Ticket size={16} color={categoryFilter === 'entertainment' ? '#FFFFFF' : colors.primary} /> },
              ].map((cat) => (
                <FilterChip
                  key={cat.id}
                  label={cat.label}
                  selected={categoryFilter === cat.id}
                  onPress={() => setCategoryFilter(cat.id as any)}
                  icon={cat.icon}
                />
              ))}
            </ScrollView>
          </View>

          {/* Liste des commandes */}
          <View>
            <Caption style={{ marginBottom: SPACING.md, color: colors.textSecondary }}>
              {filteredOrders.length} commande{filteredOrders.length > 1 ? 's' : ''}
            </Caption>
            <Stack spacing="md">
              {filteredOrders.map((order) => (
                <ContentCard key={order.id} onPress={() => {}}>
                  <Row spacing="md" align="flex-start">
                      <View style={{ width: 48, height: 48, backgroundColor: colors.surface, borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center' }}>
                        {getCategoryIcon(order.category)}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Row justify="space-between" align="center" style={{ marginBottom: SPACING.xs }}>
                          <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold }}>{order.type}</Body>
                          {getStatusIcon(order.status)}
                        </Row>
                        <Caption style={{ marginBottom: SPACING.xs }}>{order.description}</Caption>
                        <Row spacing="xs" style={{ marginBottom: SPACING.xs }}>
                          <Badge size="sm" style={{ backgroundColor: colors.secondary + '20' }}>
                            <Caption style={{ color: colors.secondary, fontWeight: TYPOGRAPHY.weights.bold }}>
                              {getCategoryLabel(order.category)}
                            </Caption>
                          </Badge>
                          <Badge variant={getStatusVariant(order.status)} size="sm">
                            {getStatusLabel(order.status)}
                          </Badge>
                        </Row>
                        <Caption style={{ color: colors.textTertiary }}>
                          {new Date(order.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </Caption>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Body style={{ fontWeight: TYPOGRAPHY.weights.bold, color: colors.primary }}>
                          {order.amount.toLocaleString()} {order.amount > 1000 ? 'CDF' : 'USD'}
                        </Body>
                      </View>
                    </Row>
                </ContentCard>
              ))}
            </Stack>
          </View>
        </Stack>
      </ScrollView>
    </GradientBackground>
  );
}

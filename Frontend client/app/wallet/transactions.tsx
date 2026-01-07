import React, { useState, useMemo } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { ArrowUpRight, ArrowDownLeft, Filter } from 'lucide-react-native';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/colors';
import { Heading, Body, Caption, Badge } from '@/components/atoms';
import { Stack, Row } from '@/components/ui';
import PageContainer from '@/components/layouts/PageContainer';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  category: 'purchase' | 'withdrawal' | 'deposit';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

const ALL_TRANSACTIONS: Transaction[] = [
  { id: '1', type: 'credit', category: 'deposit', amount: 50000, description: 'Recharge Mobile Money', date: '2025-01-04 14:30', status: 'completed' },
  { id: '2', type: 'debit', category: 'purchase', amount: 15000, description: 'Achat Coins', date: '2025-01-04 10:15', status: 'completed' },
  { id: '3', type: 'debit', category: 'purchase', amount: 8500, description: 'Billet Concert', date: '2025-01-03 18:45', status: 'completed' },
  { id: '4', type: 'credit', category: 'deposit', amount: 30000, description: 'Recharge Carte', date: '2025-01-03 09:20', status: 'completed' },
  { id: '5', type: 'debit', category: 'purchase', amount: 12000, description: 'Réservation Hôtel', date: '2025-01-02 16:30', status: 'completed' },
  { id: '6', type: 'debit', category: 'purchase', amount: 5000, description: 'Livraison Colis', date: '2025-01-02 11:15', status: 'pending' },
  { id: '7', type: 'credit', category: 'deposit', amount: 75000, description: 'Recharge Bancaire', date: '2025-01-01 14:00', status: 'completed' },
  { id: '8', type: 'debit', category: 'purchase', amount: 20000, description: 'Achat Électronique', date: '2024-12-31 19:45', status: 'completed' },
  { id: '9', type: 'debit', category: 'withdrawal', amount: 30000, description: 'Retrait Espèces', date: '2024-12-30 12:00', status: 'completed' },
  { id: '10', type: 'debit', category: 'withdrawal', amount: 20000, description: 'Retrait ATM', date: '2024-12-29 16:30', status: 'completed' },
];

const FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'purchase', label: 'Achats' },
  { id: 'withdrawal', label: 'Retraits' },
  { id: 'deposit', label: 'Dépôts' },
];

export default function TransactionsScreen() {
  const { colors } = useTheme();
  const [filter, setFilter] = useState<'all' | 'purchase' | 'withdrawal' | 'deposit'>('all');

  const transactions = useMemo(() => {
    if (filter === 'all') return ALL_TRANSACTIONS;
    return ALL_TRANSACTIONS.filter(t => t.category === filter);
  }, [filter]);

  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' => {
    if (status === 'completed') return 'success';
    if (status === 'pending') return 'warning';
    return 'error';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'completed') return 'Terminé';
    if (status === 'pending') return 'En cours';
    return 'Échoué';
  };

  return (
    <>
      <HeaderWithBackButton title="Historique" />
      <PageContainer scrollable={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: SPACING.md, gap: SPACING.sm }}>
          {FILTERS.map((f) => (
            <Pressable key={f.id} onPress={() => setFilter(f.id as any)} style={{ backgroundColor: filter === f.id ? colors.primary : colors.card, borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs }}>
              <Body style={{ color: filter === f.id ? '#FFFFFF' : colors.text, fontSize: TYPOGRAPHY.sizes.xs, fontWeight: TYPOGRAPHY.weights.medium }}>{f.label}</Body>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView contentContainerStyle={{ paddingBottom: SPACING.lg }}>
          <Stack spacing="md">
            {transactions.map((transaction) => (
              <Pressable key={transaction.id} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                <View style={{ backgroundColor: colors.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: colors.border, ...SHADOWS.sm }}>
                  <Row spacing="md" align="center">
                    <View style={{ width: 40, height: 40, backgroundColor: colors.surface, borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center' }}>
                      {transaction.type === 'credit' ? (
                        <ArrowDownLeft size={20} color={colors.success} />
                      ) : (
                        <ArrowUpRight size={20} color={colors.error} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Body style={{ fontWeight: TYPOGRAPHY.weights.medium }}>{transaction.description}</Body>
                      <Caption>{transaction.date}</Caption>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Body style={{ color: transaction.type === 'credit' ? colors.success : colors.error, fontWeight: TYPOGRAPHY.weights.semibold }}>
                        {transaction.type === 'credit' ? '+' : '-'}{transaction.amount.toLocaleString()} CDF
                      </Body>
                      <Badge variant={getStatusVariant(transaction.status)} size="sm">{getStatusLabel(transaction.status)}</Badge>
                    </View>
                  </Row>
                </View>
              </Pressable>
            ))}
          </Stack>
        </ScrollView>
      </PageContainer>
    </>
  );
}

import React from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { TrendingUp, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants/colors';
import { Heading, Body, Caption, Badge } from '@/components/atoms';
import { Row, Section, Stack } from '@/components/ui';
import PageContainer from '@/components/layouts/PageContainer';
import WalletCard from '@/components/WalletCard';
import { useWallet } from '@/hooks/useWallet';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

const RECENT_TRANSACTIONS: Transaction[] = [
  { id: '1', type: 'credit', amount: 50000, description: 'Recharge Mobile Money', date: '2025-01-04 14:30', status: 'completed' },
  { id: '2', type: 'debit', amount: 15000, description: 'Achat Coins', date: '2025-01-04 10:15', status: 'completed' },
  { id: '3', type: 'debit', amount: 8500, description: 'Billet Concert', date: '2025-01-03 18:45', status: 'completed' },
];

export default function WalletScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { wallet } = useWallet();

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
    <PageContainer>
        <WalletCard 
          balance={wallet.balance} 
          points={wallet.points} 
          isLoading={wallet.isLoading}
          onRecharge={() => router.push('/wallet/recharge')} 
          onWithdraw={() => router.push('/wallet/withdraw')} 
        />

        <Row spacing="md" style={{ marginTop: SPACING.xl }}>
          <Section variant="elevated" style={{ flex: 1 }}>
            <Stack spacing="xs" style={{ alignItems: 'center' }}>
              <TrendingUp size={24} color={colors.primary} />
              <Heading level={3}>+12.5%</Heading>
              <Caption>Ce mois</Caption>
            </Stack>
          </Section>
          <Section variant="elevated" style={{ flex: 1 }}>
            <Stack spacing="xs" style={{ alignItems: 'center' }}>
              <Clock size={24} color={colors.secondary} />
              <Heading level={3}>24</Heading>
              <Caption>Transactions</Caption>
            </Stack>
          </Section>
        </Row>

        <View style={{ marginTop: SPACING.xl }}>
          <Row justify="space-between" align="center" style={{ marginBottom: SPACING.md }}>
            <Heading level={3}>Transactions récentes</Heading>
            <Pressable onPress={() => router.push('/wallet/transactions')}>
              <Body style={{ color: colors.primary, fontWeight: TYPOGRAPHY.weights.medium }}>Voir tout</Body>
            </Pressable>
          </Row>

          <Stack spacing="md">
            {RECENT_TRANSACTIONS.map((transaction) => (
              <Section variant="elevated" key={transaction.id}>
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
              </Section>
            ))}
          </Stack>
        </View>
    </PageContainer>
  );
}

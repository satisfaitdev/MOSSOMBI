import React, { useState, useMemo, useEffect } from 'react';
import { ScrollView, View, Pressable, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, Plus, ArrowDownToLine, History, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/colors';
import { GRADIENTS } from '@/constants/gradients';
import { Heading, Body, Caption, Badge } from '@/components/atoms';
import { Section, Stack, Row } from '@/components/ui';
import { PageContainer } from '@/components/layouts';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrencyWithConversion } from '@/utils/localization';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { AuthHelpers } from '@/utils/authMiddleware';
import { usePrivacySettings } from '@/hooks/usePrivacySettings';


export default function WalletScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [showBalance, setShowBalance] = useState(true);
  const [filter, setFilter] = useState<'all' | 'purchase' | 'withdrawal' | 'deposit'>('all');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  // Connexion au backend pour les données du wallet et utilisateur
  const { wallet, transactions } = useWallet();
  const { user } = useAuth();
  const { getDisplayCurrency } = useUserPreferences();
  const { settings } = usePrivacySettings();

  // Vérifier l'authentification biométrique au chargement
  useEffect(() => {
    checkWalletAccess();
  }, [settings.biometricAuth]);

  const checkWalletAccess = async () => {
    try {
      setIsAuthenticating(true);

      // Si la biométrie est désactivée, accès direct
      if (!settings.biometricAuth) {
        setIsAuthenticated(true);
        return;
      }

      // Demander l'authentification biométrique
      const isAuthorized = await AuthHelpers.validateWalletAccess();
      setIsAuthenticated(isAuthorized);

      if (!isAuthorized) {
        console.log('❌ Accès portefeuille refusé - authentification échouée');
      }

    } catch (error) {
      console.error('❌ Erreur authentification portefeuille:', error);
      setIsAuthenticated(false);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions.list;
    return transactions.list.filter((t: any) => t.category === filter);
  }, [transactions.list, filter]);

  // Écran de chargement pendant l'authentification
  if (isAuthenticating) {
    return (
      <PageContainer>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, color: colors.text, marginBottom: 10 }}>
            🔐 Vérification de l'accès...
          </Text>
          <Text style={{ color: colors.textSecondary }}>
            Authentification en cours
          </Text>
        </View>
      </PageContainer>
    );
  }

  // Écran d'authentification si pas authentifié
  if (!isAuthenticated) {
    return (
      <PageContainer>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg }}>
          <Text style={{ fontSize: 24, color: colors.text, marginBottom: SPACING.md }}>
            🔒 Portefeuille Sécurisé
          </Text>
          <Text style={{ 
            textAlign: 'center', 
            color: colors.textSecondary, 
            marginBottom: SPACING.xl,
            lineHeight: 24
          }}>
            Votre portefeuille est protégé par l'authentification biométrique.{'\n'}
            Utilisez Face ID ou Touch ID pour accéder à vos fonds.
          </Text>
          
          <TouchableOpacity
            onPress={checkWalletAccess}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: SPACING.xl,
              paddingVertical: SPACING.md,
              borderRadius: BORDER_RADIUS.lg,
              ...SHADOWS.md
            }}
          >
            <Text style={{ 
              color: colors.background, 
              fontSize: 16, 
              fontWeight: 'bold' 
            }}>
              🔐 Authentifier avec Face ID
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginTop: SPACING.lg,
              padding: SPACING.sm
            }}
          >
            <Text style={{ color: colors.textSecondary }}>
              Retour
            </Text>
          </TouchableOpacity>
        </View>
      </PageContainer>
    );
  }

  // Contenu principal du portefeuille (authentifié)
  return (
    <PageContainer>
        <Stack spacing="lg">
          <LinearGradient colors={GRADIENTS.primary.colors} start={GRADIENTS.primary.start} end={GRADIENTS.primary.end} style={{ borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, ...SHADOWS.wallet3D }}>
            <Row justify="space-between" align="center">
              <View><Caption style={{ color: 'rgba(255,255,255,0.8)' }}>Solde disponible</Caption><Row spacing="sm" align="center" style={{ marginTop: SPACING.xs }}>
                <Heading level={1} style={{ color: '#FFFFFF' }}>{showBalance ? formatCurrencyWithConversion(wallet.balance, getDisplayCurrency(), false) : '••••••'}</Heading>
                <Pressable onPress={() => setShowBalance(!showBalance)} hitSlop={8}>{showBalance ? <Eye size={20} color="#FFFFFF" /> : <EyeOff size={20} color="#FFFFFF" />}</Pressable>
              </Row></View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: BORDER_RADIUS.md, padding: SPACING.sm }}><TrendingUp size={24} color="#FFFFFF" /></View>
            </Row>
            <Row spacing="xs" style={{ marginTop: SPACING.md }}><Caption style={{ color: 'rgba(255,255,255,0.8)' }}>Points:</Caption><Body style={{ color: '#FFFFFF', fontWeight: TYPOGRAPHY.weights.bold }}>{wallet.points}</Body></Row>
          </LinearGradient>

          <Row spacing="md">
            <Pressable onPress={() => router.push('/wallet/recharge' as any)} style={{ flex: 1, backgroundColor: colors.primary, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, alignItems: 'center', gap: SPACING.xs }}>
              <Plus size={24} color="#FFFFFF" />
              <Body style={{ color: '#FFFFFF', fontWeight: TYPOGRAPHY.weights.medium }}>Recharger</Body>
            </Pressable>
            <Pressable onPress={() => router.push('/wallet/withdraw' as any)} style={{ flex: 1, backgroundColor: colors.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, alignItems: 'center', gap: SPACING.xs, borderWidth: 1, borderColor: colors.border }}>
              <ArrowDownToLine size={24} color={colors.text} />
              <Body style={{ fontWeight: TYPOGRAPHY.weights.medium }}>Retirer</Body>
            </Pressable>
            <Pressable onPress={() => router.push('/wallet/transactions' as any)} style={{ flex: 1, backgroundColor: colors.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, alignItems: 'center', gap: SPACING.xs, borderWidth: 1, borderColor: colors.border }}>
              <History size={24} color={colors.text} />
              <Body style={{ fontWeight: TYPOGRAPHY.weights.medium }}>Historique</Body>
            </Pressable>
          </Row>

          <View><Heading level={3}>Transactions récentes</Heading></View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm }}>
            {['all', 'deposit', 'purchase', 'withdrawal'].map((f) => (
              <Badge key={f} variant={filter === f ? 'info' : 'default'} onPress={() => setFilter(f as any)}>
                {f === 'all' ? 'Tous' : f === 'deposit' ? 'Dépôts' : f === 'purchase' ? 'Achats' : 'Retraits'}
              </Badge>
            ))}
          </ScrollView>

          <Stack spacing="sm">
            {filteredTransactions.map((tx) => (
              <Section variant="elevated" key={tx.id}>
                <Row spacing="md" align="center">
                  <View style={{ width: 40, height: 40, backgroundColor: tx.type === 'credit' ? colors.success + '20' : colors.error + '20', borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center' }}>
                    {tx.type === 'credit' ? <ArrowDownRight size={20} color={colors.success} /> : <ArrowUpRight size={20} color={colors.error} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold }}>{tx.title}</Body>
                    <Caption style={{ marginTop: SPACING.xs }}>{new Date(tx.date).toLocaleDateString('fr-FR')}</Caption>
                  </View>
                  <Body style={{ fontWeight: TYPOGRAPHY.weights.bold, color: tx.type === 'credit' ? colors.success : colors.error }}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} CDF
                  </Body>
                </Row>
              </Section>
            ))}
          </Stack>
        </Stack>
    </PageContainer>
  );
}

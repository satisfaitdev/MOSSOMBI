import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import GradientBackground from '@/components/atoms/GradientBackground';
import LiquidGlassCard from '@/components/ui/LiquidGlassCard';
import Button from '@/components/Button';
import { apiService } from '@/services/api';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { convertToXAF, formatCurrencyWithConversion } from '@/utils/localization';

export default function AgencyOrdersScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { serviceId = 'store' } = useLocalSearchParams();
  const { getDisplayCurrency } = useUserPreferences();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const title = useMemo(() => {
    if (serviceId === 'courier') return 'Ventes clients';
    if (serviceId === 'travel') return 'Ventes billets';
    if (serviceId === 'carpool') return 'Ventes clients';
    if (serviceId === 'tickets') return 'Ventes tickets';
    return "Ventes de l'agence";
  }, [serviceId]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.getAgencySales({ service_id: String(serviceId), limit: 50, offset: 0 });
      if (!res.success) {
        Alert.alert('Ventes', res.error || 'Erreur');
        return;
      }
      setItems(Array.isArray(res.data?.items) ? res.data.items : []);
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const confirmSale = useCallback(async (sale: any) => {
    const id = String(sale?.id || '');
    if (!id) return;

    Alert.alert('Confirmer', 'Le client a confirmé la réception ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        style: 'default',
        onPress: async () => {
          setActionLoadingId(id);
          try {
            const res = await apiService.confirmAgencySale(id);
            if (!res.success) {
              Alert.alert('Ventes', res.error || 'Erreur');
              return;
            }
            await refresh();
          } finally {
            setActionLoadingId(null);
          }
        },
      },
    ]);
  }, [refresh]);

  return (
    <GradientBackground style={{ flex: 1 }} opacity="10">
      <View style={{ height: insets.top }} />

      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        gap: SPACING.md,
      }}>
        <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 20, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft color={colors.text} size={22} />
        </Pressable>
        <AdaptiveText variant="body" weight="bold" style={{ fontSize: 18, flex: 1 }}>{title}</AdaptiveText>
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.lg }}>
        {loading ? (
          <LiquidGlassCard padding={SPACING.md}>
            <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Chargement...</AdaptiveText>
          </LiquidGlassCard>
        ) : null}

        {!loading && items.length === 0 ? (
          <LiquidGlassCard padding={SPACING.md}>
            <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Aucune vente</AdaptiveText>
          </LiquidGlassCard>
        ) : null}

        <View style={{ gap: SPACING.md }}>
          {items.map((sale) => {
            const id = String(sale?.id || '');
            const amount = Number(sale?.amount || 0);
            const currency = String(sale?.currency || '');
            const createdAt = String(sale?.created_at || '');
            const meta = sale?.metadata && typeof sale.metadata === 'object' ? sale.metadata : {};
            const status = String(sale?.delivery_status || meta?.delivery_status || 'pending');
            const statusLabel = status === 'delivered' ? 'Vendue' : 'En attente';
            const statusColor = status === 'delivered' ? colors.success : colors.warning;
            const loadingRow = actionLoadingId === id;

            const displayCurrency = getDisplayCurrency();
            const amountXAF = currency === 'XAF' ? amount : convertToXAF(amount, currency);
            const formattedAmount = formatCurrencyWithConversion(amountXAF, displayCurrency, false);

            return (
              <LiquidGlassCard key={id} padding={SPACING.md}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, paddingRight: SPACING.md }}>
                    <AdaptiveText variant="body" weight="bold">{formattedAmount}</AdaptiveText>
                    <AdaptiveText variant="caption" style={{ color: colors.textSecondary, marginTop: 2 }}>{createdAt}</AdaptiveText>
                    {meta?.article_name ? (
                      <AdaptiveText variant="caption" style={{ color: colors.textSecondary, marginTop: 2 }}>{String(meta.article_name)}</AdaptiveText>
                    ) : null}
                  </View>
                  <View style={{ backgroundColor: statusColor + '15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 }}>
                    <AdaptiveText variant="caption" weight="bold" style={{ color: statusColor }}>{statusLabel}</AdaptiveText>
                  </View>
                </View>

                {status !== 'delivered' ? (
                  <View style={{ marginTop: SPACING.md }}>
                    <Button
                      title={loadingRow ? 'Confirmation...' : 'Confirmer réception'}
                      variant="gradient3d"
                      size="sm"
                      onPress={() => confirmSale(sale)}
                      loading={loadingRow}
                      fullWidth
                    />
                  </View>
                ) : null}
              </LiquidGlassCard>
            );
          })}
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

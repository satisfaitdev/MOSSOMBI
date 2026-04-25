import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, Search, ShoppingBag } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import GradientBackground from '@/components/atoms/GradientBackground';
import LiquidGlassCard from '@/components/ui/LiquidGlassCard';
import { apiService } from '@/services/api';

export default function AgentArticlesScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { agencyId } = useLocalSearchParams();

  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);

  const agency_id = useMemo(() => (agencyId ? String(agencyId) : ''), [agencyId]);

  const refresh = useCallback(async () => {
    if (!agency_id) return;
    setLoading(true);
    try {
      const res = await apiService.getStoreProducts({ q, agency_id, limit: 60, offset: 0 });
      if (!res.success) {
        Alert.alert('Articles', res.error || 'Erreur');
        return;
      }
      setItems(Array.isArray(res.data) ? res.data : []);
    } finally {
      setLoading(false);
    }
  }, [agency_id, q]);

  useEffect(() => {
    refresh();
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
        <AdaptiveText variant="body" weight="bold" style={{ fontSize: 18, flex: 1 }}>Articles</AdaptiveText>
        <Pressable onPress={() => router.push('/agent/add-article-enhanced')} style={{ width: 36, height: 36, borderRadius: 20, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' }}>
          <Plus color={colors.primary} size={20} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.lg }}>
        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          <View style={{ flex: 1, height: 50, borderRadius: 25, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, gap: 8, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
            <Search size={18} color={colors.textTertiary} />
            <TextInput
              placeholder="Rechercher un article..."
              placeholderTextColor={colors.textTertiary}
              value={q}
              onChangeText={setQ}
              style={{ flex: 1, color: colors.text, fontSize: 14 }}
            />
          </View>
        </View>

        {loading ? (
          <LiquidGlassCard padding={SPACING.md}>
            <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Chargement...</AdaptiveText>
          </LiquidGlassCard>
        ) : null}

        {!loading && items.length === 0 ? (
          <LiquidGlassCard padding={SPACING.md}>
            <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Aucun article</AdaptiveText>
          </LiquidGlassCard>
        ) : null}

        <View style={{ gap: SPACING.md }}>
          {items.map((it) => {
            const id = String(it?.id || '');
            const name = String(it?.name || '');
            const price = Number(it?.price || 0);
            return (
              <LiquidGlassCard key={id} padding={SPACING.md}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primary + '10', alignItems: 'center', justifyContent: 'center' }}>
                    <ShoppingBag size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AdaptiveText variant="body" weight="bold">{name}</AdaptiveText>
                    <AdaptiveText variant="caption" style={{ color: colors.textSecondary, marginTop: 2 }}>{price.toLocaleString()}</AdaptiveText>
                  </View>
                </View>
              </LiquidGlassCard>
            );
          })}
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

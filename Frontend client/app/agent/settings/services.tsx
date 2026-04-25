import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, RefreshCw, Plus, Trash2, CheckCircle2, Clock, AlertCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { apiService } from '@/services/api';
import { BORDER_RADIUS, SPACING } from '@/constants/colors';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import GradientBackground from '@/components/atoms/GradientBackground';
import LiquidGlassCard from '@/components/ui/LiquidGlassCard';
import Button from '@/components/Button';

const KNOWN_SERVICES = [
  { id: 'store', name: 'Supermarché' },
  { id: 'courier', name: 'Taxi / Coursier' },
  { id: 'travel', name: 'Voyages (Bus)' },
  { id: 'carpool', name: 'Voyage partagé' },
  { id: 'tickets', name: 'Billetterie' },
];

export default function AgentAgencyServicesScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [agencyServices, setAgencyServices] = useState<any[]>([]);
  const [serviceId, setServiceId] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.getMyAgency();
      if (res.success) {
        setAgencyServices(Array.isArray(res.data?.services) ? res.data.services : []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const requestedServiceIds = useMemo(() => {
    const items = Array.isArray(agencyServices) ? agencyServices : [];
    return new Set(items.map((s) => String(s?.service_id || '')).filter(Boolean));
  }, [agencyServices]);

  const canRequest = useMemo(() => {
    const v = String(serviceId || '').trim();
    if (!v) return false;
    if (requestedServiceIds.has(v)) return false;
    return true;
  }, [requestedServiceIds, serviceId]);

  const onRequest = useCallback(async () => {
    const v = String(serviceId || '').trim();
    if (!v) return;

    setRequesting(true);
    try {
      const res = await apiService.requestMyAgencyService({ service_id: v, payload_json: {} });
      if (!res.success) {
        Alert.alert('Erreur', String((res as any)?.error || 'Demande impossible'));
        return;
      }
      setServiceId('');
      await refresh();
    } finally {
      setRequesting(false);
    }
  }, [refresh, serviceId]);

  const onDelete = useCallback(async (row: any) => {
    const id = String(row?.id || '');
    const st = String(row?.status || 'pending');
    if (!id) return;

    if (st === 'approved') {
      Alert.alert('Action non autorisée', "Impossible de supprimer un service déjà approuvé.");
      return;
    }

    Alert.alert('Supprimer', 'Confirmer la suppression de cette demande ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(id);
          try {
            const res = await apiService.deleteMyAgencyServiceRequest(id);
            if (!res.success) {
              Alert.alert('Erreur', String((res as any)?.error || 'Suppression impossible'));
              return;
            }
            await refresh();
          } finally {
            setDeletingId(null);
          }
        }
      }
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
        zIndex: 10,
      }}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            {
              width: 36,
              height: 36,
              borderRadius: 20,
              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: pressed ? 0.9 : 1 }]
            }
          ]}
        >
          <ChevronLeft color={colors.text} size={22} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <AdaptiveText variant="body" weight="bold" style={{ fontSize: 18 }}>Services</AdaptiveText>
        </View>

        <Pressable
          onPress={refresh}
          style={({ pressed }) => [
            {
              width: 36,
              height: 36,
              borderRadius: 20,
              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: pressed ? 0.9 : 1 }]
            }
          ]}
        >
          <RefreshCw color={colors.text} size={18} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 120 }}>
        <View style={{ marginTop: SPACING.lg, gap: SPACING.lg }}>
          <LiquidGlassCard padding={SPACING.md}>
            <View style={{ gap: SPACING.md }}>
              <AdaptiveText variant="body" weight="bold">Demander un service</AdaptiveText>

              <View style={{ gap: 8 }}>
                <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>
                  Services disponibles (exemples)
                </AdaptiveText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {KNOWN_SERVICES.map((s) => {
                    const disabled = requestedServiceIds.has(s.id);
                    return (
                      <Pressable
                        key={s.id}
                        onPress={() => (disabled ? null : setServiceId(s.id))}
                        style={({ pressed }) => ({
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 999,
                          backgroundColor: disabled ? colors.border : colors.primary + '15',
                          opacity: pressed ? 0.7 : 1,
                          borderWidth: 1,
                          borderColor: disabled ? colors.border : colors.primary + '25',
                        })}
                      >
                        <AdaptiveText variant="caption" weight="bold" style={{ color: disabled ? colors.textSecondary : colors.primary }}>
                          {s.name}
                        </AdaptiveText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={{
                borderRadius: BORDER_RADIUS.lg,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}>
                <TextInput
                  value={serviceId}
                  onChangeText={setServiceId}
                  placeholder="service_id (ex: store, courier, travel...)"
                  placeholderTextColor={colors.textSecondary}
                  style={{ color: colors.text, fontSize: 14 }}
                />
              </View>

              <Button
                title={requesting ? 'Demande...' : 'Envoyer la demande'}
                onPress={onRequest}
                disabled={!canRequest || requesting || loading}
                icon={<Plus size={16} color="white" />}
              />

              {!canRequest && String(serviceId || '').trim() ? (
                <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>
                  Ce service est déjà demandé.
                </AdaptiveText>
              ) : null}
            </View>
          </LiquidGlassCard>

          <View style={{ gap: SPACING.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <AdaptiveText variant="body" weight="bold">Services demandés</AdaptiveText>
              <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>
                {agencyServices.length}
              </AdaptiveText>
            </View>

            {agencyServices.length === 0 ? (
              <LiquidGlassCard padding={SPACING.md}>
                <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>
                  Aucun service demandé.
                </AdaptiveText>
              </LiquidGlassCard>
            ) : (
              <View style={{ gap: SPACING.sm }}>
                {agencyServices.map((s) => {
                  const id = String(s?.id || '');
                  const st = String(s?.status || 'pending');
                  const isApproved = st === 'approved';
                  const isRejected = st === 'rejected';

                  const badgeColor = isApproved ? colors.success : isRejected ? colors.error : colors.warning;
                  const BadgeIcon = isApproved ? CheckCircle2 : isRejected ? AlertCircle : Clock;

                  const isDeleting = deletingId === id;

                  return (
                    <LiquidGlassCard key={id} padding={SPACING.md}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.md }}>
                        <View style={{ flex: 1 }}>
                          <AdaptiveText variant="body" weight="bold">
                            {String(s?.service_id || 'Service')}
                          </AdaptiveText>
                          {s?.admin_notes ? (
                            <AdaptiveText variant="caption" style={{ color: colors.textSecondary, marginTop: 2 }}>
                              {String(s.admin_notes)}
                            </AdaptiveText>
                          ) : null}
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: BORDER_RADIUS.lg,
                            backgroundColor: badgeColor + '15',
                            borderWidth: 1,
                            borderColor: badgeColor + '30',
                          }}>
                            <BadgeIcon size={14} color={badgeColor} />
                            <AdaptiveText variant="caption" weight="bold" style={{ color: badgeColor, fontSize: 11 }}>
                              {st.toUpperCase()}
                            </AdaptiveText>
                          </View>

                          <Pressable
                            onPress={() => onDelete(s)}
                            style={({ pressed }) => ({
                              width: 34,
                              height: 34,
                              borderRadius: 12,
                              backgroundColor: colors.error + '15',
                              borderWidth: 1,
                              borderColor: colors.error + '30',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: pressed ? 0.7 : 1,
                            })}
                          >
                            <Trash2 size={16} color={colors.error} style={{ opacity: isDeleting ? 0.4 : 1 }} />
                          </Pressable>
                        </View>
                      </View>
                    </LiquidGlassCard>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

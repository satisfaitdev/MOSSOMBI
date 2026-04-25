import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Settings, Plus, Users, RefreshCw, MapPin, CheckCircle2, Clock, AlertCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { apiService } from '@/services/api';
import { BORDER_RADIUS, SPACING } from '@/constants/colors';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import Button from '@/components/Button';
import GradientBackground from '@/components/atoms/GradientBackground';
import LiquidGlassCard from '@/components/ui/LiquidGlassCard';

type AgencyStatus = 'pending' | 'approved' | 'rejected' | string;

export default function AgencyHomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [agencyPayload, setAgencyPayload] = useState<any>(null);

  const agency = agencyPayload?.agency || null;
  const services = Array.isArray(agencyPayload?.services) ? agencyPayload.services : [];
  const documents = Array.isArray(agencyPayload?.documents) ? agencyPayload.documents : [];
  const agencyStatus: AgencyStatus = agency?.status || '';

  const hasAgency = useMemo(() => Boolean(agency?.id), [agency?.id]);

  async function refresh() {
    setLoading(true);
    try {
      const res = await apiService.getMyAgency();
      if (!res.success) {
        Alert.alert('Agence', res.error || 'Impossible de charger');
        setAgencyPayload(null);
        return;
      }
      setAgencyPayload(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!loading && hasAgency && agencyStatus === 'approved') {
      router.replace('/agent' as any);
    }
  }, [agencyStatus, hasAgency, loading, router]);

  const insets = useSafeAreaInsets();

  return (
    <GradientBackground style={{ flex: 1 }} opacity="10">
      <View style={{ height: insets.top }} />

      {/* Header Glassmorphic */}
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
          <AdaptiveText variant="body" weight="bold" style={{ fontSize: 18 }}>Agence</AdaptiveText>
        </View>

        <Pressable
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
          <Settings color={colors.text} size={20} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 120 }}
      >
        <View style={{ marginTop: SPACING.lg, gap: SPACING.xs, marginBottom: SPACING.xl }}>
          <AdaptiveText variant="title" weight="bold" style={{ fontSize: 28 }}>Mon agence</AdaptiveText>
          <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>
            {loading ? 'Chargement…' : hasAgency ? 'Suivi de votre agence' : "Développez votre activité avec Mossombi"}
          </AdaptiveText>
        </View>

        {loading && (
          <LiquidGlassCard>
            <View style={{ alignItems: 'center', paddingVertical: SPACING.xl, gap: SPACING.sm }}>
              <ActivityIndicator color={colors.primary} />
              <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>
                Chargement de vos informations...
              </AdaptiveText>
            </View>
          </LiquidGlassCard>
        )}

        {!loading && !hasAgency && (
          <View style={{ gap: SPACING.lg }}>
            <LiquidGlassCard>
              <View style={{ gap: SPACING.sm }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xs }}>
                  <Plus color={colors.primary} size={24} />
                </View>
                <AdaptiveText variant="body" weight="bold">Créer une agence</AdaptiveText>
                <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>
                  Devenez partenaire Mossombi, gérez vos propres agents et développez votre réseau.
                </AdaptiveText>
                <View style={{ marginTop: SPACING.md }}>
                  <Button title="Commencer l'application" variant="gradient3d" onPress={() => router.push('/agency/apply' as any)} fullWidth />
                </View>
              </View>
            </LiquidGlassCard>

            <LiquidGlassCard>
              <View style={{ gap: SPACING.sm }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.secondary + '20', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xs }}>
                  <Users color={colors.secondary} size={24} />
                </View>
                <AdaptiveText variant="body" weight="bold">Rejoindre une agence</AdaptiveText>
                <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>
                  Vous avez été invité par un agent ? Entrez son code pour rejoindre son équipe.
                </AdaptiveText>
                <View style={{ marginTop: SPACING.md }}>
                  <Button title="Rejoindre par code" variant="secondary" onPress={() => router.push('/agency/join' as any)} fullWidth />
                </View>
              </View>
            </LiquidGlassCard>

            <Button title="Actualiser" variant="ghost" onPress={refresh} fullWidth />
          </View>
        )}

        {!loading && hasAgency && (
          <View style={{ gap: SPACING.lg }}>
            <LiquidGlassCard>
              <View style={{ flexDirection: 'row', gap: SPACING.md, alignItems: 'center' }}>
                {agency?.logo_url ? (
                  <Image
                    source={{ uri: String(agency.logo_url) }}
                    style={{ width: 64, height: 64, borderRadius: BORDER_RADIUS.lg, backgroundColor: colors.surface }}
                  />
                ) : (
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: BORDER_RADIUS.lg,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AdaptiveText variant="caption" style={{ color: colors.textTertiary, fontWeight: 'bold' }}>
                      LOGO
                    </AdaptiveText>
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <AdaptiveText variant="body" weight="bold" style={{ fontSize: 18 }}>{String(agency?.name || 'Agence')}</AdaptiveText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <MapPin size={12} color={colors.textSecondary} />
                    <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>
                      {String(agency?.city || '—')} • {String(agency?.address || '—')}
                    </AdaptiveText>
                  </View>

                  <View style={{
                    marginTop: SPACING.sm,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                    alignSelf: 'flex-start',
                    backgroundColor: agencyStatus === 'approved' ? colors.success + '15' : colors.warning + '15'
                  }}>
                    {agencyStatus === 'approved' ? (
                      <CheckCircle2 size={12} color={colors.success} />
                    ) : agencyStatus === 'pending' ? (
                      <Clock size={12} color={colors.warning} />
                    ) : (
                      <AlertCircle size={12} color={colors.error} />
                    )}
                    <AdaptiveText variant="caption" weight="bold" style={{
                      color: agencyStatus === 'approved' ? colors.success : agencyStatus === 'rejected' ? colors.error : colors.warning,
                      fontSize: 11,
                      textTransform: 'uppercase'
                    }}>
                      {String(agencyStatus || '—')}
                    </AdaptiveText>
                  </View>
                </View>
              </View>
            </LiquidGlassCard>

            {agencyStatus === 'pending' && (
              <LiquidGlassCard style={{ borderLeftWidth: 4, borderLeftColor: colors.warning }}>
                <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                  <Clock size={20} color={colors.warning} />
                  <View style={{ flex: 1 }}>
                    <AdaptiveText variant="body" weight="bold" style={{ color: colors.warning }}>
                      Demande en cours d'examen
                    </AdaptiveText>
                    <AdaptiveText variant="caption" style={{ color: colors.textSecondary, marginTop: 4 }}>
                      Notre équipe analyse vos documents. Vous recevrez une notification dès que votre agence sera activée.
                    </AdaptiveText>
                  </View>
                </View>
              </LiquidGlassCard>
            )}

            {agencyStatus === 'rejected' && (
              <LiquidGlassCard style={{ borderLeftWidth: 4, borderLeftColor: colors.error }}>
                <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                  <AlertCircle size={20} color={colors.error} />
                  <View style={{ flex: 1 }}>
                    <AdaptiveText variant="body" weight="bold" style={{ color: colors.error }}>
                      Demande déclinée
                    </AdaptiveText>
                    <AdaptiveText variant="caption" style={{ color: colors.textSecondary, marginTop: 4 }}>
                      Malheureusement, votre demande n'a pu être acceptée. Vous pouvez soumettre une nouvelle demande ou rejoindre une agence existante.
                    </AdaptiveText>
                    <View style={{ marginTop: SPACING.md, gap: SPACING.sm }}>
                      <Button title="Nouvelle demande" variant="gradient3d" onPress={() => router.push('/agency/apply' as any)} fullWidth />
                      <Button title="Rejoindre une agence" variant="secondary" onPress={() => router.push('/agency/join' as any)} fullWidth />
                    </View>
                  </View>
                </View>
              </LiquidGlassCard>
            )}

            {services.length > 0 && (
              <View style={{ gap: SPACING.sm }}>
                <AdaptiveText variant="body" weight="bold" style={{ marginLeft: 4 }}>Services demandés</AdaptiveText>
                {services.map((s: any) => (
                  <LiquidGlassCard key={String(s?.id ?? s?.service_id ?? Math.random())} padding={SPACING.sm}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <AdaptiveText variant="body" weight="bold">{String(s?.service_id || 'Service')}</AdaptiveText>
                      <View style={{
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 6,
                        backgroundColor: s?.status === 'approved' ? colors.success + '20' : colors.warning + '20'
                      }}>
                        <AdaptiveText variant="caption" weight="bold" style={{
                          fontSize: 10,
                          color: s?.status === 'approved' ? colors.success : colors.warning
                        }}>
                          {String(s?.status || 'pending').toUpperCase()}
                        </AdaptiveText>
                      </View>
                    </View>
                  </LiquidGlassCard>
                ))}
              </View>
            )}

            {documents.length > 0 && (
              <View style={{ gap: SPACING.sm }}>
                <AdaptiveText variant="body" weight="bold" style={{ marginLeft: 4 }}>Justificatifs fournis</AdaptiveText>
                {documents.map((d: any) => {
                  const uri = d?.file_url ? String(d.file_url) : '';
                  const isImage = uri.startsWith('data:image') || uri.startsWith('http');
                  return (
                    <LiquidGlassCard key={String(d?.id ?? d?.doc_type ?? Math.random())} padding={SPACING.sm}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: isImage ? SPACING.sm : 0 }}>
                        <View>
                          <AdaptiveText variant="body" weight="bold">{String(d?.doc_type || 'Document')}</AdaptiveText>
                          <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>
                            {String(d?.service_id || 'Global')}
                          </AdaptiveText>
                        </View>
                        <AdaptiveText variant="caption" weight="bold" style={{ color: d?.status === 'approved' ? colors.success : colors.warning }}>
                          {String(d?.status || 'En attente').toUpperCase()}
                        </AdaptiveText>
                      </View>
                      {isImage && Boolean(uri) && (
                        <Image
                          source={{ uri }}
                          style={{
                            width: '100%',
                            height: 160,
                            borderRadius: BORDER_RADIUS.md,
                            backgroundColor: colors.surface,
                          }}
                          resizeMode="cover"
                        />
                      )}
                    </LiquidGlassCard>
                  );
                })}
              </View>
            )}

            <Button title="Actualiser les données" variant="ghost" onPress={refresh} fullWidth />
          </View>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

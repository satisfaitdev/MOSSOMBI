import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, DeviceEventEmitter, Image, Pressable, ScrollView, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Briefcase,
  TrendingUp,
  Users,
  DollarSign,
  Award,
  Target,
  ChevronLeft,
  Settings,
  ShoppingBag,
  Zap,
  Ticket,
  ChevronDown
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { apiService } from '@/services/api';
import { SPACING } from '@/constants/colors';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import Button from '@/components/Button';
import GradientBackground from '@/components/atoms/GradientBackground';
import LiquidGlassCard from '@/components/ui/LiquidGlassCard';
import ServiceSelector from '@/components/agent/ServiceSelector';
import { convertToXAF, formatCurrencyWithConversion } from '@/utils/localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { io } from 'socket.io-client';

export default function AgentScreen() {
  const { colors, isDark } = useTheme();
  const { getDisplayCurrency } = useUserPreferences();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [, setMembershipsLoading] = useState(false);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [agencyData, setAgencyData] = useState<any>(null);
  const [agencyServices, setAgencyServices] = useState<any[]>([]);
  const [agencyEnabledServiceIds, setAgencyEnabledServiceIds] = useState<string[]>([]);
  const [walletData, setWalletData] = useState<any>(null);
  const [, setRefreshing] = useState(false);

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [recentSales, setRecentSales] = useState<any[]>([]);

  const [activeServiceId, setActiveServiceId] = useState('store');
  const [showServiceSelector, setShowServiceSelector] = useState(false);

  const [isVisible, setIsVisible] = useState(false);
  const [courierMode, setCourierMode] = useState<'taxi' | 'courier'>('taxi');

  const [pendingRideOffer, setPendingRideOffer] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [rawVisible, rawMode] = await Promise.all([
          AsyncStorage.getItem('agent_courier_is_visible'),
          AsyncStorage.getItem('agent_courier_mode'),
        ]);

        if (!mounted) return;

        if (rawVisible === '1' || rawVisible === 'true') setIsVisible(true);
        if (rawVisible === '0' || rawVisible === 'false') setIsVisible(false);

        if (rawMode === 'taxi' || rawMode === 'courier') setCourierMode(rawMode);
      } catch {
        // ignore
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const getSocketBaseUrl = useCallback((): string => {
    const apiBaseUrl =
      Constants.expoConfig?.extra?.apiBaseUrl ||
      process.env.EXPO_PUBLIC_API_BASE_URL ||
      'http://192.168.1.73:3000/api/v1';
    return String(apiBaseUrl).replace(/\/api\/v\d+\/?$/, '');
  }, []);

  useEffect(() => {
    let mounted = true;
    let socket: any = null;

    (async () => {
      try {
        if (!mounted) return;
        if (activeServiceId !== 'courier') return;
        if (courierMode !== 'taxi') return;
        if (!isVisible) return;

        const token = await AsyncStorage.getItem('auth_token');
        if (!token) return;

        const socketBaseUrl = getSocketBaseUrl();
        socket = io(socketBaseUrl, {
          transports: ['websocket'],
          extraHeaders: { Authorization: `Bearer ${token}` },
        });

        socket.emit('subscribe', { service_id: 'taxi', city: '' });

        socket.on('taxi:ride:offer', (ride: any) => {
          const id = String(ride?.id || '');
          if (!id) return;
          setPendingRideOffer(ride);
        });
      } catch {
        // ignore
      }
    })();

    return () => {
      mounted = false;
      try {
        socket?.disconnect?.();
      } catch {
        // ignore
      }
    };
  }, [activeServiceId, courierMode, getSocketBaseUrl, isVisible]);

  useEffect(() => {
    const rideId = String(pendingRideOffer?.id || '');
    if (!rideId) return;

    Alert.alert(
      'Nouvelle course',
      `${String(pendingRideOffer?.pickup_address || 'Point de départ')} → ${String(pendingRideOffer?.dropoff_address || 'Destination')}`,
      [
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.declineTaxiRide(rideId);
            } finally {
              setPendingRideOffer(null);
            }
          },
        },
        {
          text: 'Accepter',
          onPress: async () => {
            try {
              await apiService.acceptTaxiRide(rideId);
            } finally {
              setPendingRideOffer(null);
            }
          },
        },
      ],
      { cancelable: false },
    );
  }, [pendingRideOffer?.id]);

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem('agent_courier_is_visible', isVisible ? '1' : '0');
      } catch {
        // ignore
      }
    })();

    try {
      DeviceEventEmitter.emit('agent_live_location_settings', { isVisible, courierMode });
    } catch {
      // ignore
    }
  }, [isVisible]);

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem('agent_courier_mode', courierMode);
      } catch {
        // ignore
      }
    })();

    try {
      DeviceEventEmitter.emit('agent_live_location_settings', { isVisible, courierMode });
    } catch {
      // ignore
    }
  }, [courierMode]);

  const pendingCount = useMemo(() => memberships.length, [memberships.length]);

  const services = [
    { id: 'store', name: 'Supermarché', icon: ShoppingBag },
    { id: 'courier', name: 'Taxi / Coursier', icon: Zap },
    { id: 'travel', name: 'Voyages (Bus)', icon: Ticket },
    { id: 'carpool', name: 'Voyage partagé', icon: Users },
    { id: 'tickets', name: 'Billetterie', icon: Ticket },
  ];

  const enabledServiceIds = useMemo(() => {
    const direct = Array.isArray(agencyEnabledServiceIds)
      ? agencyEnabledServiceIds.map((x) => String(x || '')).filter(Boolean)
      : [];

    if (direct.length) return Array.from(new Set(direct));

    const items = Array.isArray(agencyServices) ? agencyServices : [];
    const approved = new Set(
      items
        .filter((s) => String(s?.status || '') === 'approved')
        .map((s) => String(s?.service_id || ''))
        .filter(Boolean)
    );

    return Array.from(approved);
  }, [agencyEnabledServiceIds, agencyServices]);

  useEffect(() => {
    if (!enabledServiceIds.length) return;
    if (enabledServiceIds.includes(activeServiceId)) return;
    setActiveServiceId(enabledServiceIds[0]);
  }, [activeServiceId, enabledServiceIds]);

  const activeService = useMemo(() =>
    services.find(s => s.id === activeServiceId) || services[0]
    , [activeServiceId]);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    setMembershipsLoading(true);
    try {
      const [mRes, aRes, wRes, dashRes, salesRes] = await Promise.all([
        apiService.getPendingMemberships(),
        apiService.getMyAgency(),
        apiService.getWallet(),
        apiService.getAgencySalesDashboard({ service_id: activeServiceId, period: '7d' }),
        apiService.getAgencyRecentSales({ service_id: activeServiceId, limit: 5 }),
      ]);

      if (mRes.success) {
        setMemberships(Array.isArray(mRes.data?.items) ? mRes.data.items : []);
      }
      if (aRes.success) {
        setAgencyData(aRes.data?.agency || null);
        setAgencyServices(Array.isArray(aRes.data?.services) ? aRes.data.services : []);
        setAgencyEnabledServiceIds(Array.isArray(aRes.data?.enabled_service_ids) ? aRes.data.enabled_service_ids : []);
      }
      if (wRes.success) {
        setWalletData(wRes.data || null);
      }

      if (dashRes.success) {
        setDashboardData(dashRes.data || null);
      }

      if (salesRes.success) {
        setRecentSales(Array.isArray(salesRes.data) ? salesRes.data : []);
      }
    } finally {
      setMembershipsLoading(false);
      setRefreshing(false);
    }
  }, [activeServiceId]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  async function approve(m: any) {
    const id = String(m?.id || '');
    if (!id) return;
    setActionLoadingId(id);
    try {
      const res = await apiService.approveMembership(id);
      if (!res.success) {
        Alert.alert('Demandes', res.error || 'Erreur');
        return;
      }
      await refreshAll();
    } finally {
      setActionLoadingId(null);
    }
  }

  async function reject(m: any) {
    const id = String(m?.id || '');
    if (!id) return;
    Alert.alert('Rejeter', 'Rejeter cette demande ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Rejeter',
        style: 'destructive',
        onPress: async () => {
          setActionLoadingId(id);
          try {
            const res = await apiService.rejectMembership(id);
            if (!res.success) {
              Alert.alert('Demandes', res.error || 'Erreur');
              return;
            }
            await refreshAll();
          } finally {
            setActionLoadingId(null);
          }
        },
      },
    ]);
  }

  const stats = useMemo(() => {
    const salesCount = Number(dashboardData?.sales_count || 0);
    const salesAmount = Number(dashboardData?.sales_amount || 0);
    const commissionAmount = Number(dashboardData?.commission_amount || 0);

    const displayCurrency = getDisplayCurrency();
    const sourceCurrency = String(walletData?.wallet?.currency || 'XAF');

    const fmt = (amount: number) => {
      const amountXAF = sourceCurrency === 'XAF' ? amount : convertToXAF(amount, sourceCurrency);
      return formatCurrencyWithConversion(amountXAF, displayCurrency, false);
    };

    return [
      { label: 'Ventes', value: String(salesCount), icon: ShoppingBag, color: colors.primary },
      { label: 'Montant', value: fmt(salesAmount), icon: DollarSign, color: colors.success },
      { label: 'Commissions', value: fmt(commissionAmount), icon: TrendingUp, color: '#ec4899' },
    ];
  }, [colors.primary, colors.success, dashboardData, getDisplayCurrency, walletData?.wallet?.currency]);

  const formattedWalletBalance = useMemo(() => {
    const displayCurrency = getDisplayCurrency();
    const sourceCurrency = String(walletData?.wallet?.currency || 'XAF');
    const balance = Number(walletData?.wallet?.balance || 0);
    const balanceXAF = sourceCurrency === 'XAF' ? balance : convertToXAF(balance, sourceCurrency);
    return formatCurrencyWithConversion(balanceXAF, displayCurrency, false);
  }, [getDisplayCurrency, walletData?.wallet?.balance, walletData?.wallet?.currency]);

  const quickActions = useMemo(() => {
    const base = [
      { id: 'commissions', title: 'Commissions', icon: TrendingUp, color: colors.success, route: '/agent/commissions' },
      { id: 'objectives', title: 'Objectifs', icon: Target, color: '#8b5cf6', route: '/agent/objectives' },
    ];

    if (activeServiceId === 'store') {
      return [
        { id: 'articles', title: 'Articles', icon: ShoppingBag, color: colors.primary, route: '/agent/articles' },
        { id: 'agency-orders', title: "Ventes de l'agence", icon: Users, color: colors.secondary, route: '/agent/agency-orders' },
        ...base,
      ];
    }

    if (activeServiceId === 'courier') {
      return [
        { id: 'trips', title: 'Trajets', icon: Zap, color: colors.primary, route: '/agent/trips' },
        { id: 'agency-orders', title: 'Ventes clients', icon: Users, color: colors.secondary, route: '/agent/agency-orders' },
        ...base,
      ];
    }

    if (activeServiceId === 'travel') {
      return [
        { id: 'trajectories', title: 'Trajectoires', icon: Ticket, color: colors.primary, route: '/agent/trajectories' },
        { id: 'agency-orders', title: 'Ventes billets', icon: Users, color: colors.secondary, route: '/agent/agency-orders' },
        ...base,
      ];
    }

    if (activeServiceId === 'carpool') {
      return [
        { id: 'trips', title: 'Trajets', icon: Users, color: colors.primary, route: '/agent/trips' },
        { id: 'agency-orders', title: 'Ventes clients', icon: Users, color: colors.secondary, route: '/agent/agency-orders' },
        ...base,
      ];
    }

    if (activeServiceId === 'tickets') {
      return [
        { id: 'events', title: 'Mes événements', icon: Ticket, color: colors.primary, route: '/agent/events' },
        { id: 'agency-orders', title: 'Ventes tickets', icon: Users, color: colors.secondary, route: '/agent/agency-orders' },
        ...base,
      ];
    }

    return base;
  }, [activeServiceId, colors.primary, colors.secondary, colors.success]);

  useEffect(() => {
    try {
      DeviceEventEmitter.emit('agent_live_location_settings', { isVisible, courierMode });
    } catch {
      // ignore
    }
  }, [courierMode, isVisible]);

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
          <AdaptiveText variant="body" weight="bold" style={{ fontSize: 18 }}>Espace Agent</AdaptiveText>
        </View>

        <Pressable
          onPress={() => router.push('/agent/settings' as any)}
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

      <ServiceSelector
        services={services}
        activeServiceId={activeServiceId}
        enabledServiceIds={enabledServiceIds}
        onSelect={(id) => {
          if (enabledServiceIds.length && !enabledServiceIds.includes(id)) return;
          setActiveServiceId(id);
        }}
        visible={showServiceSelector}
        onClose={() => setShowServiceSelector(false)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 120 }}
      >
        {/* Profile Card Refined */}
        <View style={{ marginTop: SPACING.lg }}>
          <LiquidGlassCard style={{ padding: 0 }}>
            <View style={{ padding: SPACING.lg, flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
              {agencyData?.logo_url ? (
                <Image
                  source={{ uri: String(agencyData.logo_url) }}
                  style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: colors.primary + '10' }}
                />
              ) : (
                <View style={{
                  width: 54,
                  height: 54,
                  backgroundColor: colors.primary + '20',
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Briefcase size={28} color={colors.primary} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <AdaptiveText variant="body" weight="bold" style={{ fontSize: 18 }}>
                  {agencyData?.name || 'Mon Agence'}
                </AdaptiveText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
                  <AdaptiveText variant="caption" weight="bold" style={{ color: colors.success }}>
                    Solde: {formattedWalletBalance}
                  </AdaptiveText>
                </View>
                <Pressable
                  onPress={() => setShowServiceSelector(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}
                >
                  <View style={{ backgroundColor: colors.primary + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                    <AdaptiveText variant="caption" weight="bold" style={{ color: colors.primary, fontSize: 10 }}>{activeService.name.toUpperCase()}</AdaptiveText>
                  </View>
                  <ChevronDown size={14} color={colors.primary} />
                </Pressable>
              </View>

              {/* Level Badge replaced actualiser button */}
              <View style={{ alignItems: 'center' }}>
                <Award size={14} color={colors.warning} />
                <AdaptiveText variant="caption" weight="bold" style={{ color: colors.warning, fontSize: 10, marginTop: 2 }}>GOLD</AdaptiveText>
              </View>
            </View>
          </LiquidGlassCard>
        </View>

        {activeServiceId === 'courier' && (
          <View style={{ marginTop: SPACING.md }}>
            <LiquidGlassCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, paddingRight: SPACING.md }}>
                  <AdaptiveText variant="body" weight="bold">Me rendre visible</AdaptiveText>
                  <AdaptiveText variant="caption" style={{ color: colors.textSecondary, marginTop: 2 }}>
                    Partage ta position en temps réel pour recevoir des courses.
                  </AdaptiveText>

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: SPACING.sm }}>
                    <Pressable
                      onPress={() => setCourierMode('taxi')}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 10,
                        backgroundColor: courierMode === 'taxi' ? colors.primary + '20' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                        borderWidth: 1,
                        borderColor: courierMode === 'taxi' ? colors.primary + '60' : colors.border,
                      }}
                    >
                      <AdaptiveText variant="caption" weight="bold" style={{ color: courierMode === 'taxi' ? colors.primary : colors.textSecondary }}>
                        Taxi
                      </AdaptiveText>
                    </Pressable>

                    <Pressable
                      onPress={() => setCourierMode('courier')}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 10,
                        backgroundColor: courierMode === 'courier' ? colors.primary + '20' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                        borderWidth: 1,
                        borderColor: courierMode === 'courier' ? colors.primary + '60' : colors.border,
                      }}
                    >
                      <AdaptiveText variant="caption" weight="bold" style={{ color: courierMode === 'courier' ? colors.primary : colors.textSecondary }}>
                        Coursier
                      </AdaptiveText>
                    </Pressable>
                  </View>

                </View>
                <Switch
                  value={isVisible}
                  onValueChange={setIsVisible}
                  trackColor={{ false: colors.border, true: colors.primary + '80' }}
                  thumbColor={isVisible ? colors.primary : colors.surface}
                />
              </View>
            </LiquidGlassCard>
          </View>
        )}

        {pendingCount > 0 && (
          <View style={{ marginTop: SPACING.xl }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md }}>
              <AdaptiveText variant="body" weight="bold" style={{ fontSize: 18 }}>Demandes d’adhésion</AdaptiveText>
              <View style={{ backgroundColor: colors.error, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                <AdaptiveText variant="caption" weight="bold" style={{ color: '#fff', fontSize: 10 }}>{pendingCount}</AdaptiveText>
              </View>
            </View>

            <View style={{ gap: SPACING.md }}>
              {memberships.map((m) => {
                const id = String(m?.id || '');
                const loading = actionLoadingId === id;
                const u = m?.user || null;
                const displayName = u?.full_name ? String(u.full_name) : 'Nouvel Utilisateur';
                const avatarUrl = u?.avatar_url ? String(u.avatar_url) : '';

                return (
                  <LiquidGlassCard key={id}>
                    <View style={{ flexDirection: 'row', gap: SPACING.md }}>
                      {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={{ width: 50, height: 50, borderRadius: 16 }} />
                      ) : (
                        <View style={{
                          width: 50,
                          height: 50,
                          borderRadius: 16,
                          backgroundColor: colors.primary + '10',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Users size={24} color={colors.primary} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <AdaptiveText variant="body" weight="bold">{displayName}</AdaptiveText>
                        <AdaptiveText variant="caption" style={{ color: colors.textSecondary, marginTop: 2 }}>
                          {u?.user_id_display || 'ID Inconnu'}
                        </AdaptiveText>
                        <View style={{
                          marginTop: 6,
                          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 8,
                          alignSelf: 'flex-start'
                        }}>
                          <AdaptiveText variant="caption" style={{ fontSize: 11 }}>
                            Rôle: {String(m?.role_in_agency || 'sub_agent')}
                          </AdaptiveText>
                        </View>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg }}>
                      <View style={{ flex: 1 }}>
                        <Button
                          title="Accepter"
                          variant="gradient3d"
                          size="sm"
                          onPress={() => approve(m)}
                          loading={loading}
                          fullWidth
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Button
                          title="Refuser"
                          variant="secondary"
                          size="sm"
                          onPress={() => reject(m)}
                          disabled={loading}
                          fullWidth
                        />
                      </View>
                    </View>
                  </LiquidGlassCard>
                );
              })}
            </View>
          </View>
        )}

        {/* Stats Row Refined: Horizontal Row */}
        <View style={{ marginTop: SPACING.xl }}>
          <AdaptiveText variant="body" weight="bold" style={{ fontSize: 16, marginBottom: SPACING.sm }}>Performances {activeService.name}</AdaptiveText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -SPACING.lg }} contentContainerStyle={{ paddingHorizontal: SPACING.lg, gap: SPACING.sm }}>
            {stats.map((stat, idx) => (
              <LiquidGlassCard
                key={idx}
                style={{ width: 130, padding: SPACING.sm, height: 85, justifyContent: 'center' }}
                intensity={40}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: stat.color + '15', alignItems: 'center', justifyContent: 'center' }}>
                    <stat.icon size={16} color={stat.color} />
                  </View>
                  <AdaptiveText variant="body" weight="bold" style={{ fontSize: 14 }}>{stat.value}</AdaptiveText>
                </View>
                <AdaptiveText variant="caption" style={{ color: colors.textSecondary, marginTop: 4, fontSize: 10 }}>{stat.label}</AdaptiveText>
              </LiquidGlassCard>
            ))}
          </ScrollView>
        </View>

        {/* Quick Actions Reverted to Grid */}
        <View style={{ marginTop: SPACING.xl }}>
          <AdaptiveText variant="body" weight="bold" style={{ fontSize: 18, marginBottom: SPACING.md }}>Outils de gestion</AdaptiveText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md }}>
            {quickActions.map((action, idx) => (
              <Pressable
                key={idx}
                onPress={() => {
                  if (action.route) {
                    router.push({
                      pathname: action.route as any,
                      params: { serviceId: activeServiceId, agencyId: agencyData?.id }
                    });
                  }
                }}
                style={{ width: '47.5%' }}
              >
                <LiquidGlassCard padding={SPACING.md} style={{ height: 110 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: action.color + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <action.icon size={20} color={action.color} />
                  </View>
                  <AdaptiveText variant="caption" weight="bold" style={{ color: colors.text }}>{action.title}</AdaptiveText>
                </LiquidGlassCard>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Objectif du mois */}
        <View style={{ marginTop: SPACING.xl }}>
          <LiquidGlassCard style={{ borderLeftWidth: 4, borderLeftColor: colors.primary }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm }}>
              <AdaptiveText variant="body" weight="bold">Objectif {activeService.name}</AdaptiveText>
              <AdaptiveText variant="caption" weight="bold" style={{ color: colors.primary }}>125 / 150</AdaptiveText>
            </View>
            <View style={{ height: 10, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 5, overflow: 'hidden' }}>
              <View style={{ width: '83%', height: '100%', backgroundColor: colors.primary, borderRadius: 5 }} />
            </View>
            <AdaptiveText variant="caption" style={{ color: colors.textSecondary, marginTop: SPACING.sm }}>
              Plus que <AdaptiveText variant="caption" weight="bold" style={{ color: colors.primary }}>25 ventes globales</AdaptiveText> pour débloquer le palier Bonus d'équipe !
            </AdaptiveText>
          </LiquidGlassCard>
        </View>

        {/* Recent Activity */}
        <View style={{ marginTop: SPACING.xl }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md }}>
            <AdaptiveText variant="body" weight="bold" style={{ fontSize: 18 }}>Historique récent</AdaptiveText>
            <Pressable onPress={() => { }}>
              <AdaptiveText variant="caption" weight="bold" style={{ color: colors.primary }}>Voir tout</AdaptiveText>
            </Pressable>
          </View>

          <View style={{ gap: SPACING.sm }}>
            {recentSales.map((sale) => (
              <Pressable key={String(sale?.id || '')}>
                <LiquidGlassCard padding={SPACING.md}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <AdaptiveText variant="body" weight="bold">{String(sale?.client_name || sale?.client_phone || 'Client')}</AdaptiveText>
                      <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>
                        {String(sale?.service_id || activeServiceId)} • {sale?.created_at ? new Date(String(sale.created_at)).toLocaleString() : ''}
                      </AdaptiveText>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                      <AdaptiveText variant="body" weight="bold" style={{ color: colors.text }}>{Number(sale?.amount || 0).toLocaleString()} {String(sale?.currency || 'CDF')}</AdaptiveText>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <TrendingUp size={10} color={colors.success} />
                        <AdaptiveText variant="caption" weight="bold" style={{ color: colors.success }}>+{Number(sale?.commission_amount || 0).toLocaleString()}</AdaptiveText>
                      </View>
                    </View>
                  </View>
                </LiquidGlassCard>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

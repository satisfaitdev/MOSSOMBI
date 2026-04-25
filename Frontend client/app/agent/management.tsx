import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Users, UserPlus, Search, Filter, MoreVertical, MessageCircle, Phone } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import GradientBackground from '@/components/atoms/GradientBackground';
import LiquidGlassCard from '@/components/ui/LiquidGlassCard';
import { apiService } from '@/services/api';

export default function ManagementScreen() {
    const { colors, isDark } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [search, setSearch] = useState('');

    const [loading, setLoading] = useState(false);
    const [personnel, setPersonnel] = useState<any[]>([]);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiService.getMyAgencyStaff({ limit: 200 });
            if (res.success) {
                const items = Array.isArray(res.data?.items) ? res.data.items : [];
                setPersonnel(items);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const filteredPersonnel = useMemo(() => {
        const q = String(search || '').trim().toLowerCase();
        if (!q) return personnel;
        return (Array.isArray(personnel) ? personnel : []).filter((m) => {
            const name = String(m?.user?.full_name || '').toLowerCase();
            const phone = String(m?.user?.phone || '').toLowerCase();
            const role = String(m?.role_in_agency || '').toLowerCase();
            return name.includes(q) || phone.includes(q) || role.includes(q);
        });
    }, [personnel, search]);

    const roleLabel = useCallback((roleInAgency: string) => {
        const r = String(roleInAgency || '').toLowerCase();
        if (r === 'host') return 'Hôte';
        if (r === 'sub_agent' || r === 'subagent') return 'Sous-agent';
        if (r === 'agent') return 'Agent';
        return roleInAgency || 'Membre';
    }, []);

    const statusLabel = useCallback((m: any) => {
        const st = String(m?.status || '').toLowerCase();
        if (st === 'approved') return 'Actif';
        return 'Actif';
    }, []);

    const levelLabel = useCallback((salesCount: number) => {
        const n = Number(salesCount || 0);
        if (n >= 80) return 'Expert';
        if (n >= 30) return 'Sénior';
        if (n >= 10) return 'Junior';
        return 'Débutant';
    }, []);

    return (
        <GradientBackground style={{ flex: 1 }} opacity="10">
            <View style={{ height: insets.top }} />

            {/* Header */}
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
                <AdaptiveText variant="body" weight="bold" style={{ fontSize: 18, flex: 1 }}>Hôtes & Sous-agents</AdaptiveText>
                <Pressable onPress={() => router.push('/agent/management/add-host' as any)} style={{ width: 36, height: 36, borderRadius: 20, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' }}>
                    <UserPlus color={colors.primary} size={20} />
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.lg }}>
                {/* Search Bar */}
                <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                    <View style={{ flex: 1, height: 50, borderRadius: 25, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, gap: 8, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                        <Search size={18} color={colors.textTertiary} />
                        <TextInput
                            placeholder="Rechercher un membre..."
                            placeholderTextColor={colors.textTertiary}
                            value={search}
                            onChangeText={setSearch}
                            style={{ flex: 1, color: colors.text, fontSize: 14 }}
                        />
                    </View>
                    <Pressable style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                        <Filter size={20} color={colors.text} />
                    </Pressable>
                </View>

                {/* List */}
                <View style={{ gap: SPACING.md }}>
                    {loading ? (
                        <LiquidGlassCard padding={SPACING.md}>
                            <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Chargement...</AdaptiveText>
                        </LiquidGlassCard>
                    ) : null}

                    {!loading && filteredPersonnel.length === 0 ? (
                        <LiquidGlassCard padding={SPACING.md}>
                            <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Aucun membre</AdaptiveText>
                        </LiquidGlassCard>
                    ) : null}

                    {filteredPersonnel.map((item) => {
                        const id = String(item?.id || '');
                        const name = String(item?.user?.full_name || item?.user?.user_id_display || 'Utilisateur');
                        const role = roleLabel(String(item?.role_in_agency || ''));
                        const status = statusLabel(item);
                        const salesCount = Number(item?.stats?.sales_count || 0);
                        const level = levelLabel(salesCount);
                        const commissionAmount = Number(item?.stats?.commission_amount || 0);
                        const commissions = `${commissionAmount}`;

                        return (
                        <LiquidGlassCard key={id} padding={SPACING.md}>
                            <View style={{ flexDirection: 'row', gap: SPACING.md, alignItems: 'center' }}>
                                <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary + '10', alignItems: 'center', justifyContent: 'center' }}>
                                    <Users size={24} color={colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <AdaptiveText variant="body" weight="bold">{name}</AdaptiveText>
                                        <Pressable><MoreVertical size={18} color={colors.textTertiary} /></Pressable>
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                                        <View style={{ backgroundColor: colors.secondary + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                            <AdaptiveText variant="caption" weight="bold" style={{ fontSize: 9, color: colors.secondary }}>{role}</AdaptiveText>
                                        </View>
                                        <View style={{ backgroundColor: status === 'Actif' ? colors.success + '15' : 'rgba(128,128,128,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                            <AdaptiveText variant="caption" weight="bold" style={{ fontSize: 9, color: status === 'Actif' ? colors.success : colors.textTertiary }}>{status}</AdaptiveText>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', marginVertical: SPACING.md }} />

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View style={{ gap: 2 }}>
                                    <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Ventes totales</AdaptiveText>
                                    <AdaptiveText variant="body" weight="bold">{salesCount}</AdaptiveText>
                                </View>
                                <View style={{ gap: 2, alignItems: 'center' }}>
                                    <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Niveau</AdaptiveText>
                                    <AdaptiveText variant="body" weight="bold" style={{ color: colors.warning }}>{level}</AdaptiveText>
                                </View>
                                <View style={{ gap: 2, alignItems: 'flex-end' }}>
                                    <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Commissions</AdaptiveText>
                                    <AdaptiveText variant="body" weight="bold" style={{ color: colors.success }}>{commissions}</AdaptiveText>
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
                                <View style={{ flex: 1 }}>
                                    <Pressable style={{ height: 40, borderRadius: 10, backgroundColor: colors.primary + '15', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                        <MessageCircle size={16} color={colors.primary} />
                                        <AdaptiveText variant="caption" weight="bold" style={{ color: colors.primary }}>Message</AdaptiveText>
                                    </Pressable>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Pressable style={{ height: 40, borderRadius: 10, backgroundColor: colors.success + '15', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                        <Phone size={16} color={colors.success} />
                                        <AdaptiveText variant="caption" weight="bold" style={{ color: colors.success }}>Appeler</AdaptiveText>
                                    </Pressable>
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

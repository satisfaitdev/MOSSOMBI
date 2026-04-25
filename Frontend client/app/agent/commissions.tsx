import React, { useState } from 'react';
import { ScrollView, View, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, TrendingUp, DollarSign, ArrowDownLeft, Calendar, History, Wallet } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import Button from '@/components/Button';
import GradientBackground from '@/components/atoms/GradientBackground';
import LiquidGlassCard from '@/components/ui/LiquidGlassCard';

export default function CommissionsScreen() {
    const { colors, isDark } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(false);

    const stats = [
        { label: 'Total Commissions', value: '450,000 CDF', icon: TrendingUp, color: colors.primary },
        { label: 'Disponible retrait', value: '85,000 CDF', icon: Wallet, color: colors.success },
    ];

    const history = [
        { id: '1', title: 'Commission équipe (Alain)', amount: '+15,000', date: 'Aujourd\'hui, 10:00', type: 'incoming' },
        { id: '2', title: 'Retrait vers solde', amount: '-50,000', date: 'Hier, 15:30', type: 'withdrawal' },
        { id: '3', title: 'Commission équipe (Bibiche)', amount: '+12,500', date: 'Hier, 09:15', type: 'incoming' },
        { id: '4', title: 'Prime performance mensuelle', amount: '+100,000', date: '01 Mar 2026', type: 'incoming' },
    ];

    const handleWithdrawal = () => {
        Alert.alert('Retrait', 'Confirmer le transfert de 85,000 CDF vers votre solde principal ?', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Confirmer', onPress: () => {
                    setLoading(true);
                    setTimeout(() => {
                        setLoading(false);
                        Alert.alert('Succès', 'Le transfert a été effectué avec succès !');
                    }, 1500);
                }
            }
        ]);
    };

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
                <AdaptiveText variant="body" weight="bold" style={{ fontSize: 18 }}>Suivi des Commissions</AdaptiveText>
            </View>

            <ScrollView contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.xl }}>
                {/* Balances */}
                <View style={{ gap: SPACING.md }}>
                    {stats.map((stat, idx) => (
                        <LiquidGlassCard key={idx} padding={SPACING.lg}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
                                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: stat.color + '15', alignItems: 'center', justifyContent: 'center' }}>
                                    <stat.icon size={22} color={stat.color} />
                                </View>
                                <View>
                                    <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>{stat.label}</AdaptiveText>
                                    <AdaptiveText variant="body" weight="bold" style={{ fontSize: 20 }}>{stat.value}</AdaptiveText>
                                </View>
                            </View>
                        </LiquidGlassCard>
                    ))}
                </View>

                <Button
                    title="Retirer vers mon solde"
                    variant="gradient3d"
                    icon={<ArrowDownLeft size={20} color="#fff" />}
                    onPress={handleWithdrawal}
                    loading={loading}
                />

                {/* History */}
                <View style={{ gap: SPACING.md }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <AdaptiveText variant="body" weight="bold">Historique récent</AdaptiveText>
                        <History size={18} color={colors.textTertiary} />
                    </View>

                    {history.map((item) => (
                        <LiquidGlassCard key={item.id} padding={SPACING.md}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={{ flex: 1, gap: 4 }}>
                                    <AdaptiveText variant="body" weight="bold">{item.title}</AdaptiveText>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <Calendar size={12} color={colors.textTertiary} />
                                        <AdaptiveText variant="caption" style={{ color: colors.textTertiary }}>{item.date}</AdaptiveText>
                                    </View>
                                </View>
                                <AdaptiveText
                                    variant="body"
                                    weight="bold"
                                    style={{ color: item.type === 'incoming' ? colors.success : colors.error }}
                                >
                                    {item.amount} CDF
                                </AdaptiveText>
                            </View>
                        </LiquidGlassCard>
                    ))}
                </View>
            </ScrollView>
        </GradientBackground>
    );
}

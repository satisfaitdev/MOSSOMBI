import React, { useState } from 'react';
import { ScrollView, View, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Target, Award, Users, PlusCircle, TrendingUp, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import GradientBackground from '@/components/atoms/GradientBackground';
import LiquidGlassCard from '@/components/ui/LiquidGlassCard';

export default function ObjectivesScreen() {
    const { colors, isDark } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const objectives = [
        { id: '1', title: 'Ventes personnelles', current: 125, target: 150, color: colors.primary, icon: Target },
        { id: '2', title: 'Activité équipe (Hôtes)', current: 85, target: 100, color: colors.secondary, icon: Users },
        { id: '3', title: 'Nouvelles recrues', current: 3, target: 5, color: colors.success, icon: PlusCircle },
    ];

    const milestones = [
        { title: 'Agent Argent', requirement: '100 ventes', reward: '+5% Comms', reached: true },
        { title: 'Agent Or', requirement: '500 ventes', reward: '+10% Comms', reached: false },
        { title: 'Agent Platinium', requirement: '1000 ventes', reward: '+15% Comms', reached: false },
    ];

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
                <AdaptiveText variant="body" weight="bold" style={{ fontSize: 18, flex: 1 }}>Objectifs & Défis</AdaptiveText>
                <Pressable><TrendingUp color={colors.primary} size={20} /></Pressable>
            </View>

            <ScrollView contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.xl }}>
                {/* Active Objectives */}
                <View style={{ gap: SPACING.md }}>
                    <AdaptiveText variant="body" weight="bold">Objectifs mensuels</AdaptiveText>
                    {objectives.map((obj) => {
                        const progress = (obj.current / obj.target) * 100;
                        return (
                            <LiquidGlassCard key={obj.id} padding={SPACING.md}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <obj.icon size={18} color={obj.color} />
                                        <AdaptiveText variant="body" weight="bold">{obj.title}</AdaptiveText>
                                    </View>
                                    <AdaptiveText variant="caption" weight="bold" style={{ color: obj.color }}>{obj.current} / {obj.target}</AdaptiveText>
                                </View>

                                <View style={{ height: 8, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                                    <View style={{ width: `${progress}%`, height: '100%', backgroundColor: obj.color, borderRadius: 4 }} />
                                </View>

                                <AdaptiveText variant="caption" style={{ color: colors.textSecondary, marginTop: 8 }}>
                                    Plus que {obj.target - obj.current} pour atteindre le but !
                                </AdaptiveText>
                            </LiquidGlassCard>
                        );
                    })}
                </View>

                {/* Milestones / Carrier */}
                <View style={{ gap: SPACING.md }}>
                    <AdaptiveText variant="body" weight="bold">Paliers de carrière</AdaptiveText>
                    <View style={{ gap: SPACING.sm }}>
                        {milestones.map((milestone, idx) => (
                            <LiquidGlassCard key={idx} padding={SPACING.md} style={{ opacity: milestone.reached ? 1 : 0.6 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
                                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: milestone.reached ? colors.warning + '20' : 'rgba(128,128,128,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                                        {milestone.reached ? <CheckCircle2 size={24} color={colors.warning} /> : <Award size={24} color={colors.textTertiary} />}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <AdaptiveText variant="body" weight="bold" style={{ color: milestone.reached ? colors.text : colors.textSecondary }}>{milestone.title}</AdaptiveText>
                                        <AdaptiveText variant="caption" style={{ color: colors.textTertiary }}>{milestone.requirement} • <AdaptiveText variant="caption" weight="bold" style={{ color: colors.success }}>{milestone.reward}</AdaptiveText></AdaptiveText>
                                    </View>
                                </View>
                            </LiquidGlassCard>
                        ))}
                    </View>
                </View>

                <LiquidGlassCard style={{ backgroundColor: colors.primary + '10', borderStyle: 'dashed', borderWidth: 1, borderColor: colors.primary + '30', alignItems: 'center', padding: SPACING.xl }}>
                    <PlusCircle size={32} color={colors.primary} />
                    <AdaptiveText variant="body" weight="bold" style={{ marginTop: SPACING.md, textAlign: 'center' }}>Fixer un nouvel objectif pour vos hôtes</AdaptiveText>
                    <AdaptiveText variant="caption" style={{ color: colors.textSecondary, marginTop: 4, textAlign: 'center' }}>Motivez votre équipe avec des défis personnalisés.</AdaptiveText>
                </LiquidGlassCard>
            </ScrollView>
        </GradientBackground>
    );
}

import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Building2, Wrench, Shield } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { apiService } from '@/services/api';
import { BORDER_RADIUS, SPACING } from '@/constants/colors';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import GradientBackground from '@/components/atoms/GradientBackground';
import LiquidGlassCard from '@/components/ui/LiquidGlassCard';

export default function AgentSettingsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [permissions, setPermissions] = useState<any>(null);

  const refresh = useCallback(async () => {
    const res = await apiService.getMyAgency();
    if (res.success) setPermissions(res.data?.permissions || null);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const SettingLink = ({
    icon,
    title,
    description,
    onPress,
  }: {
    icon: React.ReactNode;
    title: string;
    description?: string;
    onPress: () => void;
  }) => (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <LiquidGlassCard padding={SPACING.md}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
          <View style={{
            width: 42,
            height: 42,
            borderRadius: BORDER_RADIUS.lg,
            backgroundColor: colors.primary + '15',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {icon}
          </View>

          <View style={{ flex: 1 }}>
            <AdaptiveText variant="body" weight="bold">{title}</AdaptiveText>
            {description ? (
              <AdaptiveText variant="caption" style={{ color: colors.textSecondary, marginTop: 2 }}>
                {description}
              </AdaptiveText>
            ) : null}
          </View>

          <ChevronRight size={18} color={colors.textSecondary} />
        </View>
      </LiquidGlassCard>
    </Pressable>
  );

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
          <AdaptiveText variant="body" weight="bold" style={{ fontSize: 18 }}>Paramètres Agent</AdaptiveText>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 120 }}
      >
        <View style={{ marginTop: SPACING.lg, gap: SPACING.md }}>
          <SettingLink
            icon={<Building2 size={20} color={colors.primary} />}
            title="Infos d'agence"
            description="Voir et modifier le nom, adresse, photo, etc."
            onPress={() => router.push('/agent/settings/info' as any)}
          />
          {permissions?.can_view_service_requests ? (
            <SettingLink
              icon={<Wrench size={20} color={colors.primary} />}
              title="Services"
              description="Gérer les services demandés et en demander de nouveaux"
              onPress={() => router.push('/agent/settings/services' as any)}
            />
          ) : null}
          <SettingLink
            icon={<Shield size={20} color={colors.primary} />}
            title="Paramètres avancés"
            description="Mode pro, transfert, suppression de l'agence"
            onPress={() => router.push('/agent/settings/advanced' as any)}
          />
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

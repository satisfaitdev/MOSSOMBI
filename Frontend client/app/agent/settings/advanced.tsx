import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Crown, Trash2, Share2, LogOut } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { apiService } from '@/services/api';
import { BORDER_RADIUS, SPACING } from '@/constants/colors';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import GradientBackground from '@/components/atoms/GradientBackground';
import LiquidGlassCard from '@/components/ui/LiquidGlassCard';

export default function AgentAgencyAdvancedScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [proMode, setProMode] = useState(false);
  const [permissions, setPermissions] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const res = await apiService.getMyAgency();
      if (res.success) setPermissions(res.data?.permissions || null);
    })();
  }, []);

  const onTogglePro = useCallback((value: boolean) => {
    setProMode(value);
    Alert.alert('Information', "Le mode pro est une option proposée. L'activation réelle nécessite une implémentation backend.");
  }, []);

  const onTransfer = useCallback(() => {
    Alert.alert('Transfert', "Le transfert d'agence nécessite une implémentation backend (choix du nouvel owner + validation).", [
      { text: 'OK' }
    ]);
  }, []);

  const onDeleteAgency = useCallback(() => {
    Alert.alert('Supprimer mon agence', 'Cette action est irréversible. Continuer ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => Alert.alert('Info', "Suppression non disponible tant que l'API n'est pas implémentée.") }
    ]);
  }, []);

  const onLeaveAgency = useCallback(() => {
    Alert.alert("Quitter l'agence", "Voulez-vous quitter l'agence ?", [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Quitter',
        style: 'destructive',
        onPress: async () => {
          const res = await apiService.leaveMyAgency();
          if (!res.success) {
            Alert.alert('Erreur', String((res as any)?.error || 'Opération impossible'));
            return;
          }
          Alert.alert('Succès', "Vous avez quitté l'agence");
          router.back();
        }
      }
    ]);
  }, [router]);

  const RowItem = ({
    icon,
    title,
    description,
    right,
    onPress,
  }: {
    icon: React.ReactNode;
    title: string;
    description?: string;
    right?: React.ReactNode;
    onPress?: () => void;
  }) => (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => ({ opacity: onPress && pressed ? 0.7 : 1 })}>
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

          {right}
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
          <AdaptiveText variant="body" weight="bold" style={{ fontSize: 18 }}>Paramètres avancés</AdaptiveText>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 120 }}>
        <View style={{ marginTop: SPACING.lg, gap: SPACING.md }}>
          <RowItem
            icon={<Crown size={20} color={colors.primary} />}
            title="Mode Pro"
            description="Débloquer des outils avancés pour gérer votre agence"
            right={(
              <Switch
                value={proMode}
                onValueChange={onTogglePro}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={proMode ? colors.primary : colors.surface}
              />
            )}
          />

          <RowItem
            icon={<Share2 size={20} color={colors.primary} />}
            title="Transférer mon agence"
            description="Changer le propriétaire de l'agence"
            onPress={onTransfer}
          />

          <RowItem
            icon={<Trash2 size={20} color={colors.error} />}
            title="Supprimer mon agence"
            description="Action irréversible"
            onPress={onDeleteAgency}
            right={<View style={{ width: 1 }} />}
          />

          {permissions?.can_leave_agency ? (
            <RowItem
              icon={<LogOut size={20} color={colors.error} />}
              title="Quitter l'agence"
              description="Retirer votre accès à cette agence"
              onPress={onLeaveAgency}
              right={<View style={{ width: 1 }} />}
            />
          ) : null}
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

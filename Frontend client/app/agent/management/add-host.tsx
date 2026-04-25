import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, UserPlus } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { apiService } from '@/services/api';
import { BORDER_RADIUS, SPACING } from '@/constants/colors';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import GradientBackground from '@/components/atoms/GradientBackground';
import LiquidGlassCard from '@/components/ui/LiquidGlassCard';
import Button from '@/components/Button';

export default function AddHostScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [userIdDisplay, setUserIdDisplay] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => String(userIdDisplay || '').trim().length >= 4, [userIdDisplay]);

  const onSubmit = useCallback(async () => {
    if (!canSubmit) return;

    setLoading(true);
    try {
      const res = await apiService.inviteAgencyMember({
        user_id_display: String(userIdDisplay || '').trim().toUpperCase(),
        role_in_agency: 'host',
      });

      if (!res.success) {
        Alert.alert('Erreur', String((res as any)?.error || 'Invitation impossible'));
        return;
      }

      Alert.alert('Succès', "Invitation envoyée");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [canSubmit, router, userIdDisplay]);

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
          <AdaptiveText variant="body" weight="bold" style={{ fontSize: 18 }}>Ajouter un hôte</AdaptiveText>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 120 }}>
        <View style={{ marginTop: SPACING.lg, gap: SPACING.md }}>
          <LiquidGlassCard padding={SPACING.md}>
            <View style={{ gap: SPACING.md }}>
              <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>
                Entrez l'identifiant du membre (ex: MSB-244403). Une invitation sera créée.
              </AdaptiveText>

              <View style={{
                borderRadius: BORDER_RADIUS.lg,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}>
                <TextInput
                  value={userIdDisplay}
                  onChangeText={setUserIdDisplay}
                  placeholder="MSB-XXXXXX"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="characters"
                  style={{ color: colors.text, fontSize: 14 }}
                />
              </View>

              <Button
                title={loading ? 'Envoi...' : 'Envoyer invitation'}
                onPress={onSubmit}
                disabled={!canSubmit || loading}
                icon={<UserPlus size={16} color="white" />}
              />
            </View>
          </LiquidGlassCard>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

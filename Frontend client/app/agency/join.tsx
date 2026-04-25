import React from 'react';
import { Alert, ScrollView, TextInput, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, UserPlus, Info } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { apiService } from '@/services/api';
import { SPACING } from '@/constants/colors';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import Button from '@/components/Button';
import GradientBackground from '@/components/atoms/GradientBackground';
import LiquidGlassCard from '@/components/ui/LiquidGlassCard';

export default function AgencyJoinScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [code, setCode] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  async function submit() {
    const cleaned = code.trim();
    if (!cleaned) {
      Alert.alert('Rejoindre une agence', 'Veuillez entrer un code.');
      return;
    }
    setSubmitting(true);
    try {
      const upper = cleaned.toUpperCase();
      if (!upper.startsWith('MSB-')) {
        Alert.alert('Rejoindre une agence', "Veuillez entrer l’identifiant de l’agent (ex: MSB-244403)."
        );
        return;
      }

      const res = await apiService.joinAgencyByUserDisplay({ user_id_display: upper });
      if (!res.success) {
        Alert.alert('Rejoindre une agence', res.error || 'Erreur');
        return;
      }
      Alert.alert('Rejoindre une agence', 'Demande envoyée. En attente de validation.', [
        { text: 'OK', onPress: () => router.replace('/agency' as any) },
      ]);
    } finally {
      setSubmitting(false);
    }
  }

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
          <AdaptiveText variant="body" weight="bold" style={{ fontSize: 18 }}>Rejoindre</AdaptiveText>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 120 }}
      >
        <View style={{ marginTop: SPACING.lg, gap: SPACING.xs, marginBottom: SPACING.xl }}>
          <AdaptiveText variant="title" weight="bold" style={{ fontSize: 24 }}>Rejoindre une agence</AdaptiveText>
          <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>
            Entrez l’identifiant public MSB de l’agent (ex: MSB-244403).
          </AdaptiveText>
        </View>

        <LiquidGlassCard>
          <View style={{ gap: SPACING.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: SPACING.xs }}>
              <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' }}>
                <UserPlus size={20} color={colors.primary} />
              </View>
              <AdaptiveText variant="body" weight="bold">Identifiant agent</AdaptiveText>
            </View>

            <TextInput
              placeholder="MSB-000000"
              placeholderTextColor={colors.textTertiary}
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              style={{
                height: 52,
                borderRadius: 14,
                paddingHorizontal: SPACING.md,
                borderWidth: 1.5,
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
                color: colors.text,
                fontSize: 16,
                fontWeight: 'bold',
                letterSpacing: 2
              }}
            />

            <Button
              title="Valider le code"
              variant="gradient3d"
              onPress={submit}
              loading={submitting}
              fullWidth
            />
          </View>
        </LiquidGlassCard>

        <View style={{ marginTop: SPACING.xl }}>
          <LiquidGlassCard style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Info size={18} color="#3b82f6" style={{ marginTop: 2 }} />
              <AdaptiveText variant="caption" style={{ flex: 1, color: isDark ? '#93c5fd' : '#1e40af' }}>
                Une fois le code validé, une demande sera envoyée à l'agent responsable. Vous serez notifié dès son acceptation.
              </AdaptiveText>
            </View>
          </LiquidGlassCard>
        </View>

        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            marginTop: SPACING.xl,
            paddingVertical: 12,
            opacity: pressed ? 0.6 : 1
          })}
        >
          <AdaptiveText variant="caption" weight="bold" style={{ textAlign: 'center', color: colors.textSecondary }}>ANNULER</AdaptiveText>
        </Pressable>
      </ScrollView>
    </GradientBackground>
  );
}

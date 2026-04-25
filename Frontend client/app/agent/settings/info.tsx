import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Save } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { apiService } from '@/services/api';
import { BORDER_RADIUS, SPACING } from '@/constants/colors';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import GradientBackground from '@/components/atoms/GradientBackground';
import LiquidGlassCard from '@/components/ui/LiquidGlassCard';
import Button from '@/components/Button';

export default function AgentAgencyInfoScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [agency, setAgency] = useState<any>(null);
  const [permissions, setPermissions] = useState<any>(null);

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.getMyAgency();
      if (!res.success) return;

      const a = res.data?.agency || null;
      setAgency(a);
      setPermissions(res.data?.permissions || null);
      setName(String(a?.name || ''));
      setCity(String(a?.city || ''));
      setAddress(String(a?.address || ''));
      setLogoUrl(String(a?.logo_url || ''));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const canSave = useMemo(() => {
    if (!agency?.id) return false;
    if (!permissions?.can_manage_agency) return false;
    if (!String(name || '').trim()) return false;
    return true;
  }, [agency?.id, name, permissions?.can_manage_agency]);

  const onSave = useCallback(async () => {
    if (!canSave) return;

    setSaving(true);
    try {
      const res = await apiService.updateMyAgency({
        name: String(name || '').trim(),
        city: String(city || ''),
        address: String(address || ''),
        logo_url: String(logoUrl || ''),
      });

      if (!res.success) {
        Alert.alert('Erreur', String((res as any)?.error || 'Mise à jour impossible'));
        return;
      }

      Alert.alert('Succès', "Informations d'agence mises à jour");
      await refresh();
    } finally {
      setSaving(false);
    }
  }, [address, canSave, city, logoUrl, name, refresh]);

  const Input = ({
    label,
    value,
    onChangeText,
    placeholder,
    multiline,
    editable,
  }: {
    label: string;
    value: string;
    onChangeText: (t: string) => void;
    placeholder?: string;
    multiline?: boolean;
    editable?: boolean;
  }) => (
    <View style={{ gap: 6 }}>
      <AdaptiveText variant="caption" weight="bold" style={{ color: colors.textSecondary }}>{label}</AdaptiveText>
      <View style={{
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
        paddingHorizontal: 12,
        paddingVertical: multiline ? 10 : 8,
      }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          multiline={multiline}
          editable={editable}
          style={{
            color: colors.text,
            fontSize: 14,
            minHeight: multiline ? 70 : undefined,
          }}
        />
      </View>
    </View>
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
          <AdaptiveText variant="body" weight="bold" style={{ fontSize: 18 }}>Infos d'agence</AdaptiveText>
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
          <Save color={colors.text} size={18} style={{ opacity: 0 }} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 120 }}>
        <View style={{ marginTop: SPACING.lg, gap: SPACING.md }}>
          <LiquidGlassCard padding={SPACING.md}>
            <View style={{ gap: SPACING.md }}>
              <Input label="Nom" value={name} onChangeText={setName} placeholder="Nom de l'agence" editable={Boolean(permissions?.can_manage_agency)} />
              <Input label="Ville" value={city} onChangeText={setCity} placeholder="Ville" editable={Boolean(permissions?.can_manage_agency)} />
              <Input label="Adresse" value={address} onChangeText={setAddress} placeholder="Adresse" multiline editable={Boolean(permissions?.can_manage_agency)} />
              <Input label="Photo (URL)" value={logoUrl} onChangeText={setLogoUrl} placeholder="https://..." editable={Boolean(permissions?.can_manage_agency)} />

              <Button
                title={saving ? 'Enregistrement...' : 'Enregistrer'}
                onPress={onSave}
                disabled={!canSave || saving || loading}
                icon={<Save size={16} color="white" />}
              />

              {!permissions?.can_manage_agency ? (
                <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>
                  Lecture seule: seuls les propriétaires peuvent modifier les informations de l'agence.
                </AdaptiveText>
              ) : null}
            </View>
          </LiquidGlassCard>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

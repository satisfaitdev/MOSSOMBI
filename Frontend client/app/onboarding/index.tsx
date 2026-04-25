import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, TextInput, View, Platform, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { SPACING } from '@/constants/colors';
import { PageContainer } from '@/components/layouts';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import GradientBackground from '@/components/atoms/GradientBackground';
import Stepper, { Step } from '@/components/molecules/Stepper';
import Button from '@/components/Button';
import { apiService } from '@/services/api';

const steps: Step[] = [
  { id: 0, title: 'Langue' },
  { id: 1, title: 'Profil' },
  { id: 2, title: 'Services' },
  { id: 3, title: 'Source' },
  { id: 4, title: 'Fin' },
];

type ServiceChoice = { id: string; label: string };

const serviceChoices: ServiceChoice[] = [
  { id: 'wallet', label: 'Wallet' },
  { id: 'coins', label: 'Coins' },
  { id: 'billetterie', label: 'Billetterie' },
  { id: 'digital-services', label: 'Services digitaux' },
  { id: 'public-services', label: 'Services publics' },
  { id: 'supermarket', label: 'Supermarché' },
  { id: 'bookings', label: 'Réservations' },
  { id: 'delivery', label: 'Livraison / Taxi' },
  { id: 'banking', label: 'Banking' },
];

const serviceAnimations: Record<string, any> = {
  wallet: require('@/assets/images/lotifile/wallet recharge.json'),
  coins: require('@/assets/images/lotifile/coins.json'),
  billetterie: require('@/assets/images/lotifile/tickets.json'),
  'digital-services': require('@/assets/images/lotifile/digital.json'),
  'public-services': require('@/assets/images/lotifile/public.json'),
  supermarket: require('@/assets/images/lotifile/supermarche.json'),
  bookings: require('@/assets/images/lotifile/Boking.json'),
  delivery: require('@/assets/images/lotifile/course&livraison.json'),
  banking: require('@/assets/images/lotifile/banking.json'),
};

const getServiceLottieSpeed = (serviceId?: string | null) => {
  if (!serviceId) return 1;
  if (
    serviceId === 'billetterie' ||
    serviceId === 'bookings' ||
    serviceId === 'supermarket' ||
    serviceId === 'digital-services' ||
    serviceId === 'public-services' ||
    serviceId === 'delivery'
  ) {
    return 0.6;
  }
  return 1;
};

type AcquisitionSource = { id: string; label: string };
const acquisitionSources: AcquisitionSource[] = [
  { id: 'tiktok', label: 'TikTok' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'google', label: 'Google / Recherche' },
  { id: 'friend', label: 'Ami / Famille' },
  { id: 'agent', label: 'Agent / Boutique' },
  { id: 'advertising', label: 'Publicité' },
  { id: 'other', label: 'Autre' },
];

export default function OnboardingScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { language, setLanguage } = useLanguage();
  const { data, setPreferredServices, setAcquisitionSource, setInviteCode, complete, skip } = useOnboarding();

  const [current, setCurrent] = useState(0);
  const [saving, setSaving] = useState(false);

  const [dobDate, setDobDate] = useState<Date | null>(null);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [dobSaved, setDobSaved] = useState(false);
  const [dobSaving, setDobSaving] = useState(false);
  const [dobError, setDobError] = useState<string | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarSaved, setAvatarSaved] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [acquisition, setAcquisition] = useState<string>(data.acquisition_source || '');
  const [invite, setInvite] = useState<string>(data.invite_code || '');

  const lastDobIsoRef = useRef<string | null>(null);

  useEffect(() => {
    const v = invite.trim();
    const t = setTimeout(() => {
      setInviteCode(v ? v : null);
    }, 650);
    return () => clearTimeout(t);
  }, [invite, setInviteCode]);

  useEffect(() => {
    setDobError(null);
    setDobSaved(false);
    if (!dobDate) return;

    const t = setTimeout(async () => {
      const yyyy = dobDate.getFullYear();
      const mm = dobDate.getMonth() + 1;
      const dd = dobDate.getDate();

      const iso = `${String(yyyy).padStart(4, '0')}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
      if (lastDobIsoRef.current === iso) {
        setDobSaved(true);
        return;
      }

      setDobSaving(true);
      try {
        const result = await apiService.updateUserProfile({ date_of_birth: iso } as any);
        if (!result.success) {
          setDobError(result.error || 'Erreur');
          return;
        }
        lastDobIsoRef.current = iso;
        setDobSaved(true);
      } finally {
        setDobSaving(false);
      }
    }, 350);

    return () => clearTimeout(t);
  }, [dobDate]);


  const selected = useMemo(() => new Set(data.preferred_services), [data.preferred_services]);

  const toggleService = async (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    await setPreferredServices(Array.from(next));
  };

  const nextStep = async () => {
    if (current === 1) {
      if (!dobSaved) {
        Alert.alert('Profil', 'Veuillez entrer une date valide (JJ/MM/AAAA) et attendre l\'enregistrement automatique.');
        return;
      }
      if (!avatarSaved) {
        Alert.alert('Photo', 'Veuillez ajouter une photo de profil ou choisir d\'ignorer.');
        return;
      }
    }

    if (current === 2) {
      if (data.preferred_services.length < 1) {
        Alert.alert('Préférences', 'Choisis au moins 1 service préféré.');
        return;
      }
    }

    if (current === 3) {
      if (!acquisition.trim()) {
        Alert.alert('Source', 'Merci de nous indiquer comment tu as connu Mossombi.');
        return;
      }
    }

    if (current >= steps.length - 1) {
      setSaving(true);
      await complete();
      setSaving(false);
      return;
    }

    setCurrent((s) => Math.min(s + 1, steps.length - 1));
  };

  return (
    <GradientBackground style={{ flex: 1 }} opacity="15">
      <View style={{ height: insets.top }} />
      <Stepper steps={steps} currentStep={current} showTitles showProgressBar />

      <PageContainer style={{ backgroundColor: 'transparent' }}>
        <ScrollView contentContainerStyle={{ paddingBottom: SPACING.xl }} showsVerticalScrollIndicator={false}>
          {current === 0 && (
            <LiquidGlassCard margin={0} padding={20} style={{ marginTop: SPACING.lg }} animated={false}>
              <AdaptiveText variant="title" weight="bold">Choisis ta langue</AdaptiveText>
              <AdaptiveText variant="body" style={{ marginTop: SPACING.xs, color: colors.textSecondary }}>
                Tu peux la changer plus tard dans les paramètres.
              </AdaptiveText>

              <View style={{ marginTop: SPACING.xl, gap: SPACING.md }}>
                {(['fr', 'en'] as const).map((lng) => {
                  const active = language === lng;
                  return (
                    <Pressable
                      key={lng}
                      onPress={() => setLanguage(lng)}
                      style={({ pressed }) => [
                        {
                          paddingVertical: 16,
                          paddingHorizontal: 16,
                          borderRadius: 16,
                          borderWidth: 1.5,
                          borderColor: active ? colors.primary : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                          backgroundColor: active ? `${colors.primary}15` : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)'),
                          transform: [{ scale: pressed ? 0.98 : 1 }]
                        }
                      ]}
                    >
                      <AdaptiveText variant="body" weight={active ? "bold" : "medium"} color={active ? colors.primary : colors.text}>
                        {lng === 'fr' ? '🇫🇷  Français' : '🇬🇧  English'}
                      </AdaptiveText>
                    </Pressable>
                  );
                })}
              </View>
            </LiquidGlassCard>
          )}

          {current === 1 && (
            <LiquidGlassCard margin={0} padding={20} style={{ marginTop: SPACING.lg }} animated={false}>
              <AdaptiveText variant="title" weight="bold">Profil</AdaptiveText>
              <AdaptiveText variant="body" style={{ marginTop: SPACING.xs, color: colors.textSecondary }}>
                Ajoute ta photo et ta date de naissance.
              </AdaptiveText>

              {!dobSaved ? (
                <View style={{ marginTop: SPACING.xl, gap: SPACING.sm }}>
                  <AdaptiveText color={colors.textSecondary}>Date de naissance</AdaptiveText>
                  <Pressable
                    onPress={() => setShowDobPicker(true)}
                    style={({ pressed }) => [
                      {
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
                        transform: [{ scale: pressed ? 0.99 : 1 }],
                      }
                    ]}
                  >
                    <AdaptiveText color={dobDate ? colors.text : colors.textSecondary}>
                      {dobDate ? dobDate.toLocaleDateString('fr-FR') : 'Sélectionner une date'}
                    </AdaptiveText>
                  </Pressable>

                  {showDobPicker && Platform.OS === 'android' && (
                    <DateTimePicker
                      value={dobDate || new Date(2000, 0, 1)}
                      mode="date"
                      maximumDate={new Date()}
                      minimumDate={new Date(1900, 0, 1)}
                      onChange={(event: DateTimePickerEvent, date?: Date) => {
                        if (event.type !== 'set') {
                          setShowDobPicker(false);
                          return;
                        }
                        setShowDobPicker(false);
                        if (!date) return;
                        setDobDate(date);
                      }}
                    />
                  )}

                  {showDobPicker && Platform.OS === 'ios' && (
                    <Modal transparent animationType="slide">
                      <Pressable
                        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}
                        onPress={() => setShowDobPicker(false)}
                      >
                        <Pressable
                          style={{ backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: insets.bottom || 20 }}
                          onPress={(e) => e.stopPropagation()}
                        >
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                            <Pressable onPress={() => setShowDobPicker(false)} style={{ padding: 8 }}>
                              <AdaptiveText color={colors.textSecondary}>Annuler</AdaptiveText>
                            </Pressable>
                            <Pressable onPress={() => setShowDobPicker(false)} style={{ padding: 8 }}>
                              <AdaptiveText weight="bold" color={colors.primary}>Confirmer</AdaptiveText>
                            </Pressable>
                          </View>
                          <DateTimePicker
                            value={dobDate || new Date(2000, 0, 1)}
                            mode="date"
                            display="spinner"
                            themeVariant={isDark ? "dark" : "light"}
                            maximumDate={new Date()}
                            minimumDate={new Date(1900, 0, 1)}
                            onChange={(event: DateTimePickerEvent, date?: Date) => {
                              if (date) setDobDate(date);
                            }}
                          />
                        </Pressable>
                      </Pressable>
                    </Modal>
                  )}

                  <AdaptiveText variant="caption" style={{ color: dobError ? colors.error : colors.textSecondary }}>
                    {dobSaving
                      ? 'Enregistrement...'
                      : dobSaved
                        ? 'Enregistré'
                        : dobError
                          ? `Erreur: ${dobError}`
                          : 'Auto-enregistrement après sélection'}
                  </AdaptiveText>
                </View>
              ) : (
                <View style={{ marginTop: SPACING.xl, alignItems: 'center', gap: SPACING.md }}>
                  <AdaptiveText variant="body" style={{ marginTop: SPACING.xs, color: colors.textSecondary, textAlign: 'center' }}>
                    Ajoute une photo pour personnaliser ton profil.
                  </AdaptiveText>

                  <View
                    style={{
                      width: 112,
                      height: 112,
                      borderRadius: 56,
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.6)',
                      overflow: 'hidden',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {avatarUri ? (
                      <Image source={{ uri: avatarUri }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <AdaptiveText color={colors.textSecondary}>Aucune</AdaptiveText>
                    )}
                  </View>

                  <Button
                    title="Choisir une photo"
                    variant="secondary"
                    onPress={async () => {
                      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                      if (!perm.granted) {
                        Alert.alert('Photo', 'Permission galerie refusée.');
                        return;
                      }
                      const picked = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ['images'],
                        allowsEditing: true,
                        aspect: [1, 1],
                        quality: 0.85,
                      });
                      if (picked.canceled) return;
                      const asset = picked.assets?.[0];
                      if (!asset?.uri) return;
                      setAvatarUri(asset.uri);
                      setAvatarSaved(false);
                      setAvatarError(null);
                      setAvatarUploading(true);
                      try {
                        const res = await apiService.uploadAvatar({ uri: asset.uri });
                        if (!res.success) {
                          setAvatarError(res.error || 'Upload échoué');
                          return;
                        }
                        setAvatarSaved(true);
                      } finally {
                        setAvatarUploading(false);
                      }
                    }}
                    fullWidth
                  />

                  <AdaptiveText variant="caption" style={{ color: avatarError ? colors.error : colors.textSecondary }}>
                    {avatarUploading
                      ? 'Upload...'
                      : avatarSaved
                        ? 'Enregistré'
                        : avatarError
                          ? `Erreur: ${avatarError}`
                          : 'Auto-upload après sélection'}
                  </AdaptiveText>

                  <Button
                    title="Ignorer la photo"
                    variant="ghost"
                    onPress={() => {
                      setAvatarSaved(true);
                    }}
                    fullWidth
                  />
                </View>
              )}
            </LiquidGlassCard>
          )}

          {current === 2 && (
            <LiquidGlassCard margin={0} padding={20} style={{ marginTop: SPACING.lg }} animated={false}>
              <AdaptiveText variant="title" weight="bold">Tes services préférés</AdaptiveText>
              <AdaptiveText variant="body" style={{ marginTop: SPACING.xs, color: colors.textSecondary }}>
                Sélectionne les services que tu utilises le plus.
              </AdaptiveText>

              <View style={{ marginTop: SPACING.xl, flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
                {serviceChoices.map((s) => {
                  const active = selected.has(s.id);
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => toggleService(s.id)}
                      style={({ pressed }) => [
                        {
                          width: '48%',
                          minHeight: 124,
                          paddingVertical: 12,
                          paddingHorizontal: 8,
                          borderRadius: 20,
                          borderWidth: 1.5,
                          borderColor: active ? colors.primary : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'),
                          backgroundColor: active ? `${colors.primary}1A` : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)'),
                          transform: [{ scale: pressed ? 0.96 : 1 }],
                          overflow: 'hidden',
                        }
                      ]}
                    >
                      <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                        <View style={{ width: 64, height: 64, marginBottom: SPACING.sm, opacity: active ? 1 : 0.7 }}>
                          <LottieView
                            source={serviceAnimations[s.id]}
                            autoPlay={active}
                            loop={false}
                            speed={getServiceLottieSpeed(s.id)}
                            style={{ flex: 1, transform: [{ scale: 1.2 }] }}
                          />
                        </View>
                        <AdaptiveText variant="caption" weight={active ? 'bold' : 'medium'} color={active ? colors.primary : colors.text} style={{ textAlign: 'center' }}>
                          {s.label}
                        </AdaptiveText>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </LiquidGlassCard>
          )}

          {current === 3 && (
            <LiquidGlassCard margin={0} padding={20} style={{ marginTop: SPACING.lg }} animated={false}>
              {!acquisition ? (
                <>
                  <AdaptiveText variant="title" weight="bold">Où as-tu entendu parler de Mossombi ?</AdaptiveText>
                  <AdaptiveText variant="body" style={{ marginTop: SPACING.xs, color: colors.textSecondary }}>
                    Cela nous aide à améliorer l'application.
                  </AdaptiveText>

                  <View style={{ marginTop: SPACING.xl, gap: SPACING.sm }}>
                    {acquisitionSources.map((s) => {
                      const active = acquisition === s.id;
                      return (
                        <Pressable
                          key={s.id}
                          onPress={() => {
                            setAcquisition(s.id);
                            setAcquisitionSource(s.id);
                          }}
                          style={({ pressed }) => [
                            {
                              paddingVertical: 14,
                              paddingHorizontal: 16,
                              borderRadius: 16,
                              borderWidth: 1.5,
                              borderColor: active ? colors.primary : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                              backgroundColor: active ? `${colors.primary}15` : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)'),
                              transform: [{ scale: pressed ? 0.99 : 1 }],
                            }
                          ]}
                        >
                          <AdaptiveText weight={active ? 'bold' : 'medium'} color={active ? colors.primary : colors.text}>
                            {s.label}
                          </AdaptiveText>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              ) : (
                <>
                  <AdaptiveText variant="title" weight="bold">Code d'invitation</AdaptiveText>
                  <AdaptiveText variant="body" style={{ marginTop: SPACING.xs, color: colors.textSecondary }}>
                    Si quelqu'un t'a invité, entre le code ici.
                  </AdaptiveText>

                  <View style={{ marginTop: SPACING.xl, gap: SPACING.sm }}>
                    <TextInput
                      value={invite}
                      onChangeText={setInvite}
                      placeholder="Ex: ABC123"
                      placeholderTextColor={isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.35)'}
                      autoCapitalize="characters"
                      style={{
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                        color: colors.text,
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
                      }}
                    />

                    <Button
                      title="Je n'ai pas de code"
                      variant="ghost"
                      onPress={async () => {
                        setInvite('');
                        await setInviteCode(null);
                      }}
                      fullWidth
                    />

                    <Button
                      title="Changer la source"
                      variant="ghost"
                      onPress={async () => {
                        setAcquisition('');
                        await setAcquisitionSource(null);
                      }}
                      fullWidth
                    />
                  </View>
                </>
              )}
            </LiquidGlassCard>
          )}

          {current === 4 && (
            <LiquidGlassCard margin={0} padding={20} style={{ marginTop: SPACING.lg }} animated={false}>
              <View style={{ alignItems: 'center', marginBottom: SPACING.xl }}>
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: `${colors.success}1A`, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md }}>
                  <AdaptiveText weight="bold" style={{ fontSize: 40, lineHeight: 44, color: colors.success }}>
                    ✓
                  </AdaptiveText>
                </View>
                <AdaptiveText variant="title" weight="bold">Tout est prêt !</AdaptiveText>
                <AdaptiveText variant="body" style={{ marginTop: SPACING.xs, color: colors.textSecondary, textAlign: 'center' }}>
                  Ton expérience Mossombi a été paramétrée avec succès.
                </AdaptiveText>
              </View>

              <View style={{
                padding: SPACING.lg,
                borderRadius: 20,
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)',
                gap: SPACING.sm
              }}>
                <AdaptiveText weight="bold" style={{ marginBottom: SPACING.xs }}>Résumé de ton profil</AdaptiveText>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <AdaptiveText color={colors.textSecondary}>Langue</AdaptiveText>
                  <AdaptiveText weight="semibold">{language === 'fr' ? 'Français' : 'English'}</AdaptiveText>
                </View>

                {dobDate && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <AdaptiveText color={colors.textSecondary}>Date de naissance</AdaptiveText>
                    <AdaptiveText weight="semibold">{dobDate.toLocaleDateString('fr-FR')}</AdaptiveText>
                  </View>
                )}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <AdaptiveText color={colors.textSecondary}>Services choisis</AdaptiveText>
                  <AdaptiveText weight="semibold" color={colors.primary}>{data.preferred_services.length}</AdaptiveText>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <AdaptiveText color={colors.textSecondary}>Source</AdaptiveText>
                  <AdaptiveText weight="semibold" style={{ textTransform: 'capitalize' }}>
                    {acquisitionSources.find(a => a.id === data.acquisition_source)?.label || '-'}
                  </AdaptiveText>
                </View>

                {data.invite_code && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <AdaptiveText color={colors.textSecondary}>Parrainage</AdaptiveText>
                    <AdaptiveText weight="semibold" color={colors.success}>Actif</AdaptiveText>
                  </View>
                )}
              </View>
            </LiquidGlassCard>
          )}

          <View style={{ marginTop: SPACING.xxl, gap: SPACING.md }}>
            <Button
              title={current === steps.length - 1 ? "Commencer l'expérience" : "Continuer"}
              variant={current === steps.length - 1 ? "gradient3d" : "gradient"}
              size="lg"
              onPress={nextStep}
              loading={saving}
              fullWidth
              withAnimation
            />

            {current < steps.length - 1 && current !== 1 && (
              <Button
                title="Ignorer pour l'instant"
                variant="ghost"
                onPress={async () => {
                  setSaving(true);
                  await skip();
                  setSaving(false);
                }}
                fullWidth
              />
            )}
          </View>
        </ScrollView>
      </PageContainer>
    </GradientBackground>
  );
}

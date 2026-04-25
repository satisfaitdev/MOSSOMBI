import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { ChevronLeft, Camera, CheckCircle2, Circle, Info } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { apiService } from '@/services/api';
import { SPACING } from '@/constants/colors';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import Button from '@/components/Button';
import GradientBackground from '@/components/atoms/GradientBackground';
import LiquidGlassCard from '@/components/ui/LiquidGlassCard';

type ServiceId = 'store' | 'courier' | 'travel' | 'carpool' | 'tickets';

const AVAILABLE_SERVICES: Array<{ id: ServiceId; label: string }> = [
  { id: 'store', label: 'Supermarché (Boutique)' },
  { id: 'courier', label: 'Taxi / Coursier' },
  { id: 'travel', label: 'Voyages (Bus)' },
  { id: 'carpool', label: 'Voyage partagé' },
  { id: 'tickets', label: 'Billetterie / Événements' },
];

async function uriToDataUrl(uri: string, mimeType: string) {
  const b64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
  return `data:${mimeType};base64,${b64}`;
}

const MAX_DATA_URL_LEN = 1950000;

function assetToDataUrl(asset: ImagePicker.ImagePickerAsset) {
  const mime = asset.mimeType || 'image/jpeg';
  const b64 = (asset as any)?.base64 ? String((asset as any).base64) : '';
  if (!b64) return '';
  return `data:${mime};base64,${b64}`;
}

async function compressImageToDataUrl(uri: string) {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 512 } }],
    { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );

  const b64 = result.base64 ? String(result.base64) : '';
  if (!b64) return '';
  return `data:image/jpeg;base64,${b64}`;
}

export default function AgencyApplyScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');

  const [selected, setSelected] = useState<Set<ServiceId>>(new Set());

  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string>('');

  const [courierHasTaxi, setCourierHasTaxi] = useState(false);
  const [courierHasMoto, setCourierHasMoto] = useState(false);
  const [storeLinks, setStoreLinks] = useState('');
  const [ticketsLinks, setTicketsLinks] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [blocked, setBlocked] = useState(false);

  const [docIdCard, setDocIdCard] = useState('');
  const [docDriverLicense, setDocDriverLicense] = useState('');
  const [docTaxiProof, setDocTaxiProof] = useState('');
  const [docMotoProof, setDocMotoProof] = useState('');
  const [docArtistProof, setDocArtistProof] = useState('');
  const [docStoreProof, setDocStoreProof] = useState('');
  const [docTravelProof, setDocTravelProof] = useState('');
  const [docCarpoolProof, setDocCarpoolProof] = useState('');

  const ensureGalleryPermission = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Justificatif', 'Permission galerie refusée.');
      return false;
    }
    return true;
  }, []);

  const pickDoc = useCallback(async (setter: (v: string) => void) => {
    const ok = await ensureGalleryPermission();
    if (!ok) return;
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
      base64: true,
    });
    if (picked.canceled) return;
    const asset = picked.assets?.[0];
    if (!asset?.uri) return;
    try {
      const dataUrl = assetToDataUrl(asset) || (await uriToDataUrl(asset.uri, asset.mimeType || 'image/jpeg'));
      setter(dataUrl);
    } catch {
      Alert.alert('Justificatif', 'Impossible de préparer le justificatif.');
    }
  }, [ensureGalleryPermission]);

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (selected.size === 0) return false;

    if (selected.has('courier')) {
      if (!docIdCard) return false;
      if (!docDriverLicense) return false;
      if (!courierHasTaxi && !courierHasMoto) return false;
      if (courierHasTaxi && !docTaxiProof) return false;
      if (courierHasMoto && !docMotoProof) return false;
    }

    if (selected.has('tickets')) {
      if (!docArtistProof) return false;
    }

    if (selected.has('store')) {
      const linksOk = Boolean(storeLinks.trim());
      const proofOk = Boolean(docStoreProof);
      if (!linksOk && !proofOk) return false;
    }

    if (selected.has('travel')) {
      if (!docTravelProof) return false;
    }

    if (selected.has('carpool')) {
      if (!docCarpoolProof) return false;
    }

    return true;
  }, [
    courierHasMoto,
    courierHasTaxi,
    docArtistProof,
    docCarpoolProof,
    docDriverLicense,
    docIdCard,
    docMotoProof,
    docStoreProof,
    docTaxiProof,
    docTravelProof,
    name,
    selected,
    storeLinks,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function checkExisting() {
      try {
        setCheckingExisting(true);
        const res = await apiService.getMyAgency();
        const existingAgency = (res as any)?.data?.agency;
        const status = existingAgency?.status ? String(existingAgency.status) : '';
        const shouldBlockApply = Boolean(existingAgency?.id) && (status === 'pending' || status === 'approved');
        if (!cancelled && res?.success && shouldBlockApply) {
          setBlocked(true);
          router.replace('/agency' as any);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setCheckingExisting(false);
      }
    }

    checkExisting();
    return () => {
      cancelled = true;
    };
  }, [router]);

  function toggleService(id: ServiceId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function pickLogo() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Logo', 'Permission galerie refusée.');
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
      base64: true,
    });

    if (picked.canceled) return;
    const asset = picked.assets?.[0];
    if (!asset?.uri) return;

    setLogoUri(asset.uri);

    try {
      const compressed = await compressImageToDataUrl(asset.uri);
      const dataUrl = compressed || assetToDataUrl(asset) || (await uriToDataUrl(asset.uri, asset.mimeType || 'image/jpeg'));

      if (dataUrl.length > MAX_DATA_URL_LEN) {
        setLogoDataUrl('');
        Alert.alert('Logo', 'Le fichier est trop lourd. Choisissez une image plus légère.');
        return;
      }
      setLogoDataUrl(dataUrl);
    } catch {
      Alert.alert('Logo', 'Impossible de préparer le logo.');
    }
  }

  async function submit() {
    if (!canSubmit) {
      Alert.alert('Agence', 'Veuillez remplir les champs requis.');
      return;
    }

    setSubmitting(true);
    try {
      const services = Array.from(selected).map((service_id) => {
        if (service_id === 'store') {
          return {
            service_id,
            payload_json: {
              shop_links: storeLinks
                .split(/\r?\n/)
                .map((s) => s.trim())
                .filter(Boolean)
                .slice(0, 10),
            },
          };
        }

        if (service_id === 'tickets') {
          return {
            service_id,
            payload_json: {
              social_links: ticketsLinks
                .split(/\r?\n/)
                .map((s) => s.trim())
                .filter(Boolean)
                .slice(0, 10),
            },
          };
        }

        if (service_id === 'courier') {
          return {
            service_id,
            payload_json: {
              has_taxi: Boolean(courierHasTaxi),
              has_moto: Boolean(courierHasMoto),
            },
          };
        }

        return { service_id, payload_json: {} };
      });

      const documents: Array<{ service_id?: string; doc_type: string; file_url: string }> = [];

      if (selected.has('courier')) {
        if (docIdCard) {
          documents.push({ service_id: 'courier', doc_type: 'id_card', file_url: docIdCard });
        }
        if (docDriverLicense) {
          documents.push({ service_id: 'courier', doc_type: 'driver_license', file_url: docDriverLicense });
        }
        if (courierHasTaxi && docTaxiProof) {
          documents.push({ service_id: 'courier', doc_type: 'taxi_proof', file_url: docTaxiProof });
        }
        if (courierHasMoto && docMotoProof) {
          documents.push({ service_id: 'courier', doc_type: 'moto_proof', file_url: docMotoProof });
        }
      }

      if (selected.has('tickets') && docArtistProof) {
        documents.push({ service_id: 'tickets', doc_type: 'artist_promoter_proof', file_url: docArtistProof });
      }

      if (selected.has('store') && docStoreProof) {
        documents.push({ service_id: 'store', doc_type: 'store_proof', file_url: docStoreProof });
      }

      if (selected.has('travel') && docTravelProof) {
        documents.push({ service_id: 'travel', doc_type: 'travel_bus_proof', file_url: docTravelProof });
      }

      if (selected.has('carpool') && docCarpoolProof) {
        documents.push({ service_id: 'carpool', doc_type: 'carpool_car_proof', file_url: docCarpoolProof });
      }

      const res = await apiService.applyAgency({
        name: name.trim(),
        city: city.trim(),
        address: address.trim(),
        logo_url: logoDataUrl,
        services,
        documents,
      });

      if (!res.success) {
        Alert.alert('Agence', res.error || 'Demande échouée');
        return;
      }

      Alert.alert('Agence', 'Demande envoyée. Elle est maintenant en cours de validation.', [
        { text: 'Voir le statut', onPress: () => router.replace('/agency' as any) },
      ]);
    } finally {
      setSubmitting(false);
    }
  }

  if (blocked) {
    return null;
  }

  if (checkingExisting) {
    return (
      <GradientBackground style={{ flex: 1 }} opacity="10">
        <View style={{ height: insets.top }} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md }}>
          <ActivityIndicator color={colors.primary} />
          <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>
            Vérification de votre compte...
          </AdaptiveText>
        </View>
      </GradientBackground>
    );
  }

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
          <AdaptiveText variant="body" weight="bold" style={{ fontSize: 18 }}>Devenir Agent</AdaptiveText>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 120 }}>
        <View style={{ marginTop: SPACING.lg, gap: SPACING.xs, marginBottom: SPACING.xl }}>
          <AdaptiveText variant="title" weight="bold" style={{ fontSize: 24 }}>Créer une agence</AdaptiveText>
          <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>
            Remplissez les informations pour soumettre votre demande d'activation.
          </AdaptiveText>
        </View>

        <LiquidGlassCard>
          <AdaptiveText variant="body" weight="bold" style={{ marginBottom: SPACING.md }}>Informations générales</AdaptiveText>
          <View style={{ gap: SPACING.md }}>
            <View>
              <AdaptiveText variant="caption" style={{ color: colors.textSecondary, marginBottom: 4, marginLeft: 4 }}>Nom de l agence</AdaptiveText>
              <TextInput
                placeholder="Ex: Mossombi Express"
                placeholderTextColor={colors.textTertiary}
                value={name}
                onChangeText={setName}
                style={{
                  height: 48,
                  borderRadius: 14,
                  paddingHorizontal: SPACING.md,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
                  color: colors.text,
                }}
              />
            </View>
            <View>
              <AdaptiveText variant="caption" style={{ color: colors.textSecondary, marginBottom: 4, marginLeft: 4 }}>Ville</AdaptiveText>
              <TextInput
                placeholder="Ex: Kinshasa"
                placeholderTextColor={colors.textTertiary}
                value={city}
                onChangeText={setCity}
                style={{
                  height: 48,
                  borderRadius: 14,
                  paddingHorizontal: SPACING.md,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
                  color: colors.text,
                }}
              />
            </View>
            <View>
              <AdaptiveText variant="caption" style={{ color: colors.textSecondary, marginBottom: 4, marginLeft: 4 }}>Adresse</AdaptiveText>
              <TextInput
                placeholder="Ex: Boulevard du 30 Juin, n°12"
                placeholderTextColor={colors.textTertiary}
                value={address}
                onChangeText={setAddress}
                style={{
                  height: 48,
                  borderRadius: 14,
                  paddingHorizontal: SPACING.md,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
                  color: colors.text,
                }}
              />
            </View>
          </View>
        </LiquidGlassCard>

        <View style={{ marginTop: SPACING.xl }}>
          <AdaptiveText variant="body" weight="bold" style={{ marginLeft: 4, marginBottom: SPACING.md }}>Identité visuelle</AdaptiveText>
          <LiquidGlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.lg }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
              }}>
                {logoUri ? (
                  <Image source={{ uri: logoUri }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <Camera size={24} color={colors.textTertiary} />
                )}
              </View>
              <View style={{ flex: 1, gap: 8 }}>
                <Button title="Choisir un logo" variant="secondary" onPress={pickLogo} />
                <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>
                  Format PNG ou JPG. Carré recommandé.
                </AdaptiveText>
              </View>
            </View>
          </LiquidGlassCard>
        </View>

        <View style={{ marginTop: SPACING.xl }}>
          <AdaptiveText variant="body" weight="bold" style={{ marginLeft: 4, marginBottom: SPACING.xs }}>Services proposés</AdaptiveText>
          <AdaptiveText variant="caption" style={{ color: colors.textSecondary, marginBottom: SPACING.md, marginLeft: 4 }}>
            Choisissez les services que vous souhaitez opérer.
          </AdaptiveText>

          <View style={{ gap: SPACING.sm }}>
            {AVAILABLE_SERVICES.map((s) => {
              const active = selected.has(s.id);
              return (
                <Pressable
                  key={s.id}
                  onPress={() => toggleService(s.id)}
                  style={({ pressed }) => ({
                    padding: 16,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: active ? colors.primary : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
                    backgroundColor: active ? colors.primary + '10' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)'),
                    opacity: pressed ? 0.8 : 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12
                  })}
                >
                  {active ? (
                    <CheckCircle2 size={22} color={colors.primary} />
                  ) : (
                    <Circle size={22} color={colors.textTertiary} />
                  )}
                  <AdaptiveText variant="body" weight={active ? 'bold' : 'medium'} style={{ flex: 1, color: active ? colors.primary : colors.text }}>
                    {s.label}
                  </AdaptiveText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {selected.has('courier') && (
          <View style={{ marginTop: SPACING.xl }}>
            <AdaptiveText variant="body" weight="bold" style={{ marginLeft: 4, marginBottom: SPACING.md }}>Justificatifs Taxi / Coursier</AdaptiveText>
            <LiquidGlassCard style={{ borderLeftWidth: 4, borderLeftColor: colors.primary }}>
              <View style={{ gap: SPACING.md }}>
                <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                  <Pressable
                    onPress={() => setCourierHasTaxi((v) => !v)}
                    style={({ pressed }) => ({
                      flex: 1,
                      padding: 12,
                      borderRadius: 14,
                      borderWidth: 1.5,
                      borderColor: courierHasTaxi ? colors.primary : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
                      backgroundColor: courierHasTaxi ? colors.primary + '10' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)'),
                      opacity: pressed ? 0.8 : 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                    })}
                  >
                    {courierHasTaxi ? <CheckCircle2 size={20} color={colors.primary} /> : <Circle size={20} color={colors.textTertiary} />}
                    <AdaptiveText variant="caption" weight={courierHasTaxi ? 'bold' : 'medium'} style={{ color: courierHasTaxi ? colors.primary : colors.text }}>
                      J'ai un Taxi
                    </AdaptiveText>
                  </Pressable>

                  <Pressable
                    onPress={() => setCourierHasMoto((v) => !v)}
                    style={({ pressed }) => ({
                      flex: 1,
                      padding: 12,
                      borderRadius: 14,
                      borderWidth: 1.5,
                      borderColor: courierHasMoto ? colors.primary : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
                      backgroundColor: courierHasMoto ? colors.primary + '10' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)'),
                      opacity: pressed ? 0.8 : 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                    })}
                  >
                    {courierHasMoto ? <CheckCircle2 size={20} color={colors.primary} /> : <Circle size={20} color={colors.textTertiary} />}
                    <AdaptiveText variant="caption" weight={courierHasMoto ? 'bold' : 'medium'} style={{ color: courierHasMoto ? colors.primary : colors.text }}>
                      J'ai une Moto
                    </AdaptiveText>
                  </Pressable>
                </View>

                <View>
                  <AdaptiveText variant="caption" style={{ color: colors.textSecondary, marginBottom: 8 }}>Carte d'identité (obligatoire)</AdaptiveText>
                  <Pressable
                    onPress={() => pickDoc(setDocIdCard)}
                    style={({ pressed }) => ({
                      height: 120,
                      width: '100%',
                      borderRadius: 14,
                      borderWidth: 2,
                      borderStyle: 'dashed',
                      borderColor: docIdCard ? colors.success : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                      backgroundColor: docIdCard ? colors.success + '10' : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    {docIdCard ? (
                      <>
                        <CheckCircle2 size={32} color={colors.success} />
                        <AdaptiveText variant="caption" weight="bold" style={{ color: colors.success }}>Document chargé</AdaptiveText>
                      </>
                    ) : (
                      <>
                        <Camera size={32} color={colors.textTertiary} />
                        <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Cliquez pour ajouter une photo</AdaptiveText>
                      </>
                    )}
                  </Pressable>
                </View>

                <View>
                  <AdaptiveText variant="caption" style={{ color: colors.textSecondary, marginBottom: 8 }}>Permis (obligatoire)</AdaptiveText>
                  <Pressable
                    onPress={() => pickDoc(setDocDriverLicense)}
                    style={({ pressed }) => ({
                      height: 120,
                      width: '100%',
                      borderRadius: 14,
                      borderWidth: 2,
                      borderStyle: 'dashed',
                      borderColor: docDriverLicense ? colors.success : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                      backgroundColor: docDriverLicense ? colors.success + '10' : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    {docDriverLicense ? (
                      <>
                        <CheckCircle2 size={32} color={colors.success} />
                        <AdaptiveText variant="caption" weight="bold" style={{ color: colors.success }}>Document chargé</AdaptiveText>
                      </>
                    ) : (
                      <>
                        <Camera size={32} color={colors.textTertiary} />
                        <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Cliquez pour ajouter une photo</AdaptiveText>
                      </>
                    )}
                  </Pressable>
                </View>

                {courierHasTaxi ? (
                  <View>
                    <AdaptiveText variant="caption" style={{ color: colors.textSecondary, marginBottom: 8 }}>Justificatif Taxi (carte grise / photo véhicule)</AdaptiveText>
                    <Pressable
                      onPress={() => pickDoc(setDocTaxiProof)}
                      style={({ pressed }) => ({
                        height: 120,
                        width: '100%',
                        borderRadius: 14,
                        borderWidth: 2,
                        borderStyle: 'dashed',
                        borderColor: docTaxiProof ? colors.success : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                        backgroundColor: docTaxiProof ? colors.success + '10' : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      {docTaxiProof ? (
                        <>
                          <CheckCircle2 size={32} color={colors.success} />
                          <AdaptiveText variant="caption" weight="bold" style={{ color: colors.success }}>Document chargé</AdaptiveText>
                        </>
                      ) : (
                        <>
                          <Camera size={32} color={colors.textTertiary} />
                          <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Cliquez pour ajouter une photo</AdaptiveText>
                        </>
                      )}
                    </Pressable>
                  </View>
                ) : null}

                {courierHasMoto ? (
                  <View>
                    <AdaptiveText variant="caption" style={{ color: colors.textSecondary, marginBottom: 8 }}>Justificatif Moto (carte grise / photo moto)</AdaptiveText>
                    <Pressable
                      onPress={() => pickDoc(setDocMotoProof)}
                      style={({ pressed }) => ({
                        height: 120,
                        width: '100%',
                        borderRadius: 14,
                        borderWidth: 2,
                        borderStyle: 'dashed',
                        borderColor: docMotoProof ? colors.success : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                        backgroundColor: docMotoProof ? colors.success + '10' : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      {docMotoProof ? (
                        <>
                          <CheckCircle2 size={32} color={colors.success} />
                          <AdaptiveText variant="caption" weight="bold" style={{ color: colors.success }}>Document chargé</AdaptiveText>
                        </>
                      ) : (
                        <>
                          <Camera size={32} color={colors.textTertiary} />
                          <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Cliquez pour ajouter une photo</AdaptiveText>
                        </>
                      )}
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </LiquidGlassCard>
          </View>
        )}

        {selected.has('tickets') && (
          <View style={{ marginTop: SPACING.xl }}>
            <AdaptiveText variant="body" weight="bold" style={{ marginLeft: 4, marginBottom: SPACING.md }}>Justificatifs Billetterie / Événements</AdaptiveText>
            <LiquidGlassCard style={{ borderLeftWidth: 4, borderLeftColor: colors.primary }}>
              <View style={{ gap: SPACING.md }}>
                <View>
                  <AdaptiveText variant="caption" style={{ color: colors.textSecondary, marginBottom: 4 }}>Liens (Instagram, Facebook, TikTok, YouTube... 1 par ligne)</AdaptiveText>
                  <TextInput
                    placeholder="https://instagram.com/...\nhttps://facebook.com/..."
                    placeholderTextColor={colors.textTertiary}
                    value={ticketsLinks}
                    onChangeText={setTicketsLinks}
                    multiline
                    style={{
                      minHeight: 90,
                      borderRadius: 14,
                      paddingHorizontal: SPACING.md,
                      paddingVertical: 12,
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                      backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
                      color: colors.text,
                    }}
                  />
                </View>

                <View>
                  <AdaptiveText variant="caption" style={{ color: colors.textSecondary, marginBottom: 8 }}>Preuve artiste / promoteur culturel (obligatoire)</AdaptiveText>
                  <Pressable
                    onPress={() => pickDoc(setDocArtistProof)}
                    style={({ pressed }) => ({
                      height: 120,
                      width: '100%',
                      borderRadius: 14,
                      borderWidth: 2,
                      borderStyle: 'dashed',
                      borderColor: docArtistProof ? colors.success : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                      backgroundColor: docArtistProof ? colors.success + '10' : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    {docArtistProof ? (
                      <>
                        <CheckCircle2 size={32} color={colors.success} />
                        <AdaptiveText variant="caption" weight="bold" style={{ color: colors.success }}>Document chargé</AdaptiveText>
                      </>
                    ) : (
                      <>
                        <Camera size={32} color={colors.textTertiary} />
                        <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Cliquez pour ajouter une photo</AdaptiveText>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            </LiquidGlassCard>
          </View>
        )}

        {selected.has('store') && (
          <View style={{ marginTop: SPACING.xl }}>
            <AdaptiveText variant="body" weight="bold" style={{ marginLeft: 4, marginBottom: SPACING.md }}>Justificatifs Boutique</AdaptiveText>
            <LiquidGlassCard style={{ borderLeftWidth: 4, borderLeftColor: colors.primary }}>
              <View style={{ gap: SPACING.md }}>
                <View>
                  <AdaptiveText variant="caption" style={{ color: colors.textSecondary, marginBottom: 4 }}>Liens boutique / réseaux sociaux (1 par ligne)</AdaptiveText>
                  <TextInput
                    placeholder="https://facebook.com/...\nhttps://instagram.com/...\nhttps://wa.me/..."
                    placeholderTextColor={colors.textTertiary}
                    value={storeLinks}
                    onChangeText={setStoreLinks}
                    multiline
                    style={{
                      minHeight: 90,
                      borderRadius: 14,
                      paddingHorizontal: SPACING.md,
                      paddingVertical: 12,
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                      backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
                      color: colors.text,
                    }}
                  />
                </View>

                <View>
                  <AdaptiveText variant="caption" style={{ color: colors.textSecondary, marginBottom: 8 }}>Preuve boutique (optionnel si liens fournis)</AdaptiveText>
                  <Pressable
                    onPress={() => pickDoc(setDocStoreProof)}
                    style={({ pressed }) => ({
                      height: 120,
                      width: '100%',
                      borderRadius: 14,
                      borderWidth: 2,
                      borderStyle: 'dashed',
                      borderColor: docStoreProof ? colors.success : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                      backgroundColor: docStoreProof ? colors.success + '10' : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    {docStoreProof ? (
                      <>
                        <CheckCircle2 size={32} color={colors.success} />
                        <AdaptiveText variant="caption" weight="bold" style={{ color: colors.success }}>Document chargé</AdaptiveText>
                      </>
                    ) : (
                      <>
                        <Camera size={32} color={colors.textTertiary} />
                        <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Cliquez pour ajouter une photo</AdaptiveText>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            </LiquidGlassCard>
          </View>
        )}

        {selected.has('travel') && (
          <View style={{ marginTop: SPACING.xl }}>
            <AdaptiveText variant="body" weight="bold" style={{ marginLeft: 4, marginBottom: SPACING.md }}>Justificatifs Voyages (Bus)</AdaptiveText>
            <LiquidGlassCard style={{ borderLeftWidth: 4, borderLeftColor: colors.primary }}>
              <View style={{ gap: SPACING.md }}>
                <View>
                  <AdaptiveText variant="caption" style={{ color: colors.textSecondary, marginBottom: 8 }}>Preuve bus / autorisation / photo véhicule (obligatoire)</AdaptiveText>
                  <Pressable
                    onPress={() => pickDoc(setDocTravelProof)}
                    style={({ pressed }) => ({
                      height: 120,
                      width: '100%',
                      borderRadius: 14,
                      borderWidth: 2,
                      borderStyle: 'dashed',
                      borderColor: docTravelProof ? colors.success : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                      backgroundColor: docTravelProof ? colors.success + '10' : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    {docTravelProof ? (
                      <>
                        <CheckCircle2 size={32} color={colors.success} />
                        <AdaptiveText variant="caption" weight="bold" style={{ color: colors.success }}>Document chargé</AdaptiveText>
                      </>
                    ) : (
                      <>
                        <Camera size={32} color={colors.textTertiary} />
                        <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Cliquez pour ajouter une photo</AdaptiveText>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            </LiquidGlassCard>
          </View>
        )}

        {selected.has('carpool') && (
          <View style={{ marginTop: SPACING.xl }}>
            <AdaptiveText variant="body" weight="bold" style={{ marginLeft: 4, marginBottom: SPACING.md }}>Justificatifs Voyage partagé</AdaptiveText>
            <LiquidGlassCard style={{ borderLeftWidth: 4, borderLeftColor: colors.primary }}>
              <View style={{ gap: SPACING.md }}>
                <View>
                  <AdaptiveText variant="caption" style={{ color: colors.textSecondary, marginBottom: 8 }}>Preuve véhicule / photo / carte grise (obligatoire)</AdaptiveText>
                  <Pressable
                    onPress={() => pickDoc(setDocCarpoolProof)}
                    style={({ pressed }) => ({
                      height: 120,
                      width: '100%',
                      borderRadius: 14,
                      borderWidth: 2,
                      borderStyle: 'dashed',
                      borderColor: docCarpoolProof ? colors.success : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                      backgroundColor: docCarpoolProof ? colors.success + '10' : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    {docCarpoolProof ? (
                      <>
                        <CheckCircle2 size={32} color={colors.success} />
                        <AdaptiveText variant="caption" weight="bold" style={{ color: colors.success }}>Document chargé</AdaptiveText>
                      </>
                    ) : (
                      <>
                        <Camera size={32} color={colors.textTertiary} />
                        <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Cliquez pour ajouter une photo</AdaptiveText>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            </LiquidGlassCard>
          </View>
        )}

        <View style={{ marginTop: SPACING.xl * 2 }}>
          <LiquidGlassCard style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Info size={18} color="#3b82f6" style={{ marginTop: 2 }} />
              <AdaptiveText variant="caption" style={{ flex: 1, color: isDark ? '#93c5fd' : '#1e40af' }}>
                Votre demande sera traitée sous 24h à 48h. Assurez-vous que les informations sont exactes pour éviter un refus.
              </AdaptiveText>
            </View>
          </LiquidGlassCard>

          <View style={{ marginTop: SPACING.lg }}>
            <Button
              title="Envoyer ma demande"
              variant="gradient3d"
              onPress={submit}
              disabled={!canSubmit || submitting}
              loading={submitting}
              fullWidth
            />
            <Pressable onPress={() => router.back()} style={{ marginTop: SPACING.md, paddingVertical: 8 }}>
              <AdaptiveText variant="caption" weight="bold" style={{ textAlign: 'center', color: colors.textSecondary }}>ANNULER</AdaptiveText>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

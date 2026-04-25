import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, View, Pressable, TextInput, Alert, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, MapPin, Package } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import Button from '@/components/Button';
import GradientBackground from '@/components/atoms/GradientBackground';
import LiquidGlassCard from '@/components/ui/LiquidGlassCard';
import { apiService, ApiResponse } from '@/services/api';

export default function NewSaleScreen() {
    const { colors, isDark } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // On récupère le service actif via les paramètres ou le state global (simulation ici par param)
    const { serviceId = 'store' } = useLocalSearchParams();

    const [form, setForm] = useState({
        name: '',
        price: '',
        description: '',
        inStock: true,
        country: 'RD Congo',
        deliveryTime: '24-48h',
        // Ticket fields
        venue: '',
        quantity: '',
        ticketType: 'standard',
        // Recharge fields
        phoneNumber: '',
        operator: 'Airtel',
    });

    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            let res: ApiResponse;
            if (serviceId === 'marketplace' || serviceId === 'store') {
                if (!form.name || !form.price) throw new Error('Veuillez remplir les champs obligatoires.');
                res = await apiService.createArticle({
                    name: form.name,
                    description: form.description,
                    price: parseFloat(form.price),
                    in_stock: form.inStock,
                    country: form.country,
                    delivery_time: form.deliveryTime
                });
            } else if (serviceId === 'billetterie' || serviceId === 'tickets') {
                if (!form.name || !form.price || !form.quantity) throw new Error('Veuillez remplir les champs obligatoires.');
                res = await apiService.createTicket({
                    event_name: form.name,
                    venue: form.venue,
                    price: parseFloat(form.price),
                    quantity_total: parseInt(form.quantity),
                    ticket_type: form.ticketType
                });
            } else {
                // Recharge (simulation car non implémenté au backend agent spécifique)
                await new Promise(r => setTimeout(r, 1000));
                res = { success: true };
            }

            if (res.success) {
                Alert.alert('Succès', 'Opération réussie !', [{ text: 'OK', onPress: () => router.back() }]);
            } else {
                Alert.alert('Erreur', res.error || 'Une erreur est survenue');
            }
        } catch (err: any) {
            Alert.alert('Erreur', err.message);
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        borderRadius: 12,
        padding: SPACING.md,
        color: colors.text,
        fontSize: 16,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    };

    const renderFormContent = () => {
        if (serviceId === 'marketplace' || serviceId === 'store') {
            return (
                <>
                    <LiquidGlassCard>
                        <AdaptiveText variant="body" weight="bold" style={{ marginBottom: SPACING.md }}>Détails du produit</AdaptiveText>
                        <View style={{ gap: SPACING.lg }}>
                            <View style={{ gap: 8 }}>
                                <AdaptiveText variant="caption" weight="bold" style={{ color: colors.textSecondary }}>NOM DU PRODUIT *</AdaptiveText>
                                <TextInput style={inputStyle} placeholder="Ex: iPhone 15 Pro Max" placeholderTextColor={colors.textTertiary} value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
                            </View>
                            <View style={{ gap: 8 }}>
                                <AdaptiveText variant="caption" weight="bold" style={{ color: colors.textSecondary }}>PRIX *</AdaptiveText>
                                <TextInput style={inputStyle} placeholder="Ex: 15000" keyboardType="numeric" placeholderTextColor={colors.textTertiary} value={form.price} onChangeText={(t) => setForm({ ...form, price: t })} />
                            </View>
                            <View style={{ gap: 8 }}>
                                <AdaptiveText variant="caption" weight="bold" style={{ color: colors.textSecondary }}>DESCRIPTION</AdaptiveText>
                                <TextInput style={[inputStyle, { height: 100, textAlignVertical: 'top' }]} placeholder="Description..." multiline placeholderTextColor={colors.textTertiary} value={form.description} onChangeText={(t) => setForm({ ...form, description: t })} />
                            </View>
                        </View>
                    </LiquidGlassCard>

                    <LiquidGlassCard>
                        <AdaptiveText variant="body" weight="bold" style={{ marginBottom: SPACING.md }}>Logistique</AdaptiveText>
                        <View style={{ gap: SPACING.lg }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Package size={20} color={colors.primary} /><AdaptiveText variant="body">En stock</AdaptiveText></View>
                                <Switch value={form.inStock} onValueChange={(v) => setForm({ ...form, inStock: v })} trackColor={{ false: '#767577', true: colors.primary }} />
                            </View>
                            <View style={{ gap: 8 }}>
                                <AdaptiveText variant="caption" weight="bold" style={{ color: colors.textSecondary }}>PAYS</AdaptiveText>
                                <View style={[inputStyle, { flexDirection: 'row', justifyContent: 'space-between' }]}><AdaptiveText variant="body">{form.country}</AdaptiveText><MapPin size={18} color={colors.primary} /></View>
                            </View>
                        </View>
                    </LiquidGlassCard>
                </>
            );
        }

        if (serviceId === 'billetterie' || serviceId === 'tickets') {
            return (
                <LiquidGlassCard>
                    <AdaptiveText variant="body" weight="bold" style={{ marginBottom: SPACING.md }}>Détails de l'événement</AdaptiveText>
                    <View style={{ gap: SPACING.lg }}>
                        <View style={{ gap: 8 }}>
                            <AdaptiveText variant="caption" weight="bold" style={{ color: colors.textSecondary }}>NOM DE L'ÉVÉNEMENT *</AdaptiveText>
                            <TextInput style={inputStyle} placeholder="Ex: Concert Fally Ipupa" placeholderTextColor={colors.textTertiary} value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
                        </View>
                        <View style={{ gap: 8 }}>
                            <AdaptiveText variant="caption" weight="bold" style={{ color: colors.textSecondary }}>LIEU / VENUE</AdaptiveText>
                            <TextInput style={inputStyle} placeholder="Ex: Stade des Martyrs" placeholderTextColor={colors.textTertiary} value={form.venue} onChangeText={(t) => setForm({ ...form, venue: t })} />
                        </View>
                        <View style={{ flexDirection: 'row', gap: SPACING.md }}>
                            <View style={{ flex: 1, gap: 8 }}>
                                <AdaptiveText variant="caption" weight="bold" style={{ color: colors.textSecondary }}>PRIX *</AdaptiveText>
                                <TextInput style={inputStyle} placeholder="0" keyboardType="numeric" placeholderTextColor={colors.textTertiary} value={form.price} onChangeText={(t) => setForm({ ...form, price: t })} />
                            </View>
                            <View style={{ flex: 1, gap: 8 }}>
                                <AdaptiveText variant="caption" weight="bold" style={{ color: colors.textSecondary }}>QUANTITÉ *</AdaptiveText>
                                <TextInput style={inputStyle} placeholder="0" keyboardType="numeric" placeholderTextColor={colors.textTertiary} value={form.quantity} onChangeText={(t) => setForm({ ...form, quantity: t })} />
                            </View>
                        </View>
                    </View>
                </LiquidGlassCard>
            );
        }

        return (
            <LiquidGlassCard>
                <AdaptiveText variant="body" weight="bold" style={{ marginBottom: SPACING.md }}>Recharge Unités / Data</AdaptiveText>
                <View style={{ gap: SPACING.lg }}>
                    <View style={{ gap: 8 }}>
                        <AdaptiveText variant="caption" weight="bold" style={{ color: colors.textSecondary }}>NUMÉRO DE TÉLÉPHONE *</AdaptiveText>
                        <TextInput style={inputStyle} placeholder="08..." keyboardType="phone-pad" placeholderTextColor={colors.textTertiary} value={form.phoneNumber} onChangeText={(t) => setForm({ ...form, phoneNumber: t })} />
                    </View>
                    <View style={{ gap: 8 }}>
                        <AdaptiveText variant="caption" weight="bold" style={{ color: colors.textSecondary }}>MONTANT *</AdaptiveText>
                        <TextInput style={inputStyle} placeholder="0" keyboardType="numeric" placeholderTextColor={colors.textTertiary} value={form.price} onChangeText={(t) => setForm({ ...form, price: t })} />
                    </View>
                </View>
            </LiquidGlassCard>
        );
    };

    const title = serviceId === 'marketplace' || serviceId === 'store' ? 'Nouvel article' : serviceId === 'recharge' ? 'Nouvelle recharge' : 'Nouvel événement';

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
                <AdaptiveText variant="body" weight="bold" style={{ fontSize: 18 }}>{title}</AdaptiveText>
            </View>

            <ScrollView contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.xl }}>
                {renderFormContent()}
                <Button
                    title={serviceId === 'recharge' ? 'Confirmer la recharge' : 'Publier'}
                    variant="gradient3d"
                    onPress={handleSubmit}
                    loading={loading}
                />
            </ScrollView>
        </GradientBackground>
    );
}

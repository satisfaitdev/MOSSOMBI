import React, { useState, useEffect } from 'react';
import { Modal, View, Image, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { X, Minus, Plus, Star, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import Button from '@/components/Button';
import { Product } from './ProductCard';

interface ProductDetailModalProps {
    product: Product | null;
    visible: boolean;
    onClose: () => void;
    onAddToCart: (product: Product, quantity: number) => void;
}

export default function ProductDetailModal({ product, visible, onClose, onAddToCart }: ProductDetailModalProps) {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const { height } = useWindowDimensions();

    const [quantity, setQuantity] = useState(1);
    const [addedTemp, setAddedTemp] = useState(false);

    useEffect(() => {
        if (visible) {
            setQuantity(1);
            setAddedTemp(false);
        }
    }, [visible]);

    if (!product) return null;

    const handleAdd = () => {
        onAddToCart(product, quantity);
        setAddedTemp(true);
        setTimeout(() => {
            setAddedTemp(false);
            onClose();
        }, 1200);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }}>
                <Pressable style={{ flex: 1 }} onPress={onClose} />

                <View style={{
                    backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                    borderTopLeftRadius: 32,
                    borderTopRightRadius: 32,
                    height: height * 0.85,
                    overflow: 'hidden',
                    paddingBottom: insets.bottom,
                }}>
                    {/* Header Bar */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', paddingVertical: SPACING.md }}>
                        <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }} />
                    </View>

                    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                        {/* Product Image */}
                        <View style={{ width: '100%', height: 320, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', alignItems: 'center', justifyContent: 'center' }}>
                            <Image source={product.image} style={{ width: '80%', height: '80%', resizeMode: 'contain' }} />

                            <Pressable
                                onPress={onClose}
                                style={{ position: 'absolute', top: SPACING.sm, right: SPACING.lg, width: 36, height: 36, borderRadius: 18, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <X size={20} color={colors.text} />
                            </Pressable>
                        </View>

                        {/* Info Section */}
                        <View style={{ padding: SPACING.lg, gap: SPACING.sm }}>
                            <AdaptiveText variant="caption" color={colors.primary} weight="bold">
                                ÉLECTRONIQUE // Dummy
                            </AdaptiveText>

                            <AdaptiveText variant="title" weight="bold" style={{ lineHeight: 28 }}>
                                {product.title}
                            </AdaptiveText>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: 4 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <Star key={i} size={14} fill={i <= Math.round(product.rating) ? colors.warning : 'transparent'} color={colors.warning} />
                                    ))}
                                </View>
                                <AdaptiveText variant="body" weight="medium">{product.rating.toFixed(1)}</AdaptiveText>
                                <AdaptiveText variant="caption" color={colors.textTertiary}>({product.reviews} avis)</AdaptiveText>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm, marginTop: SPACING.md }}>
                                <AdaptiveText variant="title" weight="bold" color={colors.primary}>
                                    {product.price.toLocaleString('fr-FR')} F
                                </AdaptiveText>
                                {/* Dummy Old Price */}
                                <AdaptiveText variant="body" color={colors.textTertiary} style={{ textDecorationLine: 'line-through', marginBottom: 2 }}>
                                    {Math.round(product.price * 1.2).toLocaleString('fr-FR')} FCFA
                                </AdaptiveText>
                                <View style={{ backgroundColor: colors.error, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginBottom: 2 }}>
                                    <AdaptiveText variant="caption" color="#FFFFFF" weight="bold">-20%</AdaptiveText>
                                </View>
                            </View>

                            <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', marginVertical: SPACING.md }} />

                            {/* Quantity Selector */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <AdaptiveText variant="body" weight="medium">Quantité</AdaptiveText>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
                                    <Pressable
                                        onPress={() => setQuantity(Math.max(1, quantity - 1))}
                                        style={({ pressed }) => [
                                            {
                                                width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
                                                backgroundColor: quantity > 1 ? `${colors.primary}20` : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                                                transform: [{ scale: pressed ? 0.9 : 1 }]
                                            }
                                        ]}
                                    >
                                        <Minus size={20} color={quantity > 1 ? colors.primary : colors.textTertiary} />
                                    </Pressable>

                                    <AdaptiveText variant="headline" weight="bold" style={{ width: 24, textAlign: 'center' }}>{quantity}</AdaptiveText>

                                    <Pressable
                                        onPress={() => setQuantity(Math.min(10, quantity + 1))}
                                        style={({ pressed }) => [
                                            {
                                                width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
                                                backgroundColor: `${colors.primary}20`,
                                                transform: [{ scale: pressed ? 0.9 : 1 }]
                                            }
                                        ]}
                                    >
                                        <Plus size={20} color={colors.primary} />
                                    </Pressable>
                                </View>
                            </View>

                            <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', marginVertical: SPACING.md }} />

                            {/* Specs Dummy */}
                            <View style={{ gap: SPACING.sm, marginBottom: SPACING.xl }}>
                                <AdaptiveText variant="headline" weight="bold">Détails</AdaptiveText>
                                {[['Disponibilité', 'En stock'], ['Livraison', '2-5 jours ouvrés'], ['Garantie', '12 mois']].map(([key, value]) => (
                                    <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                                        <AdaptiveText variant="body" color={colors.textSecondary}>{key}</AdaptiveText>
                                        <AdaptiveText variant="body" weight="medium">{value}</AdaptiveText>
                                    </View>
                                ))}
                            </View>

                        </View>
                    </ScrollView>

                    {/* Bottom Action Bar */}
                    <BlurView
                        tint={isDark ? 'dark' : 'light'}
                        intensity={80}
                        style={{
                            paddingHorizontal: SPACING.lg,
                            paddingTop: SPACING.md,
                            paddingBottom: SPACING.sm + insets.bottom,
                            flexDirection: 'row',
                            alignItems: 'center',
                            borderTopWidth: 1,
                            borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                            gap: SPACING.lg,
                        }}
                    >
                        <View style={{ flex: 1 }}>
                            <AdaptiveText variant="caption" color={colors.textSecondary}>Total</AdaptiveText>
                            <AdaptiveText variant="headline" weight="bold" color={colors.primary}>
                                {(product.price * quantity).toLocaleString('fr-FR')} F
                            </AdaptiveText>
                        </View>

                        <View style={{ flex: 2 }}>
                            <Button
                                title={addedTemp ? "Ajouté!" : "Ajouter au panier"}
                                onPress={handleAdd}
                                variant={addedTemp ? "success" : "gradient3d"}
                                icon={addedTemp ? <Check color="#FFFFFF" size={20} /> : <Plus color="#FFFFFF" size={20} />}
                                fullWidth
                                style={{ height: 48 }}
                            />
                        </View>
                    </BlurView>

                </View>
            </View>
        </Modal>
    );
}

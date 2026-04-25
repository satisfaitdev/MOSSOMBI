import React from 'react';
import { Modal, View, Image, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, Minus, Plus } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '@/constants/colors';
import { COMMON_STYLES } from '@/constants/styles';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import HeaderLayout from '@/components/layouts/HeaderLayout';
import EmptyStateLayout from '@/components/layouts/EmptyStateLayout';
import Button from '@/components/Button';
import { Product } from './ProductCard';

export interface CartItemType {
    product: Product;
    quantity: number;
}

interface SupermarketCartModalProps {
    visible: boolean;
    onClose: () => void;
    cartItems: CartItemType[];
    onUpdateQuantity: (productId: string, delta: number) => void;
    onClearCart: () => void;
    onCheckout: () => void;
}

export default function SupermarketCartModal({
    visible,
    onClose,
    cartItems,
    onUpdateQuantity,
    onClearCart,
    onCheckout,
}: SupermarketCartModalProps) {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();

    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                <HeaderLayout
                    title="Mon Panier"
                    showCloseButton
                    onClose={onClose}
                    variant="modal"
                    rightContent={
                        cartCount > 0 ? (
                            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                                <AdaptiveText variant="caption" weight="bold" color="#FFF">{cartCount}</AdaptiveText>
                            </View>
                        ) : undefined
                    }
                />

                {cartItems.length === 0 ? (
                    <EmptyStateLayout
                        type="empty-cart"
                        onAction={onClose}
                        actionText="Découvrir les produits"
                        style={{ flex: 1 }}
                    />
                ) : (
                    <>
                        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: SPACING.lg }}>
                            {cartItems.map((item) => (
                                <View key={item.product.id} style={[styles.cartItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                                    <View style={[styles.cartItemImage, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]}>
                                        <Image source={item.product.image} style={{ width: '80%', height: '80%', resizeMode: 'contain' }} />
                                    </View>
                                    <View style={styles.cartItemInfo}>
                                        <AdaptiveText variant="body" weight="bold" numberOfLines={2}>
                                            {item.product.title}
                                        </AdaptiveText>
                                        <AdaptiveText variant="body" weight="bold" color={colors.primary} style={{ marginTop: 4 }}>
                                            {item.product.price.toLocaleString('fr-FR')} FCFA
                                        </AdaptiveText>
                                    </View>
                                    <View style={styles.cartItemActions}>
                                        <Pressable
                                            onPress={() => onUpdateQuantity(item.product.id, -1)}
                                            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Minus size={16} color={colors.text} />
                                        </Pressable>
                                        <AdaptiveText variant="body" weight="bold" style={{ minWidth: 24, textAlign: 'center' }}>
                                            {item.quantity}
                                        </AdaptiveText>
                                        <Pressable
                                            onPress={() => onUpdateQuantity(item.product.id, 1)}
                                            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Plus size={16} color="#FFFFFF" />
                                        </Pressable>
                                    </View>
                                </View>
                            ))}

                            <Pressable onPress={onClearCart} style={{ alignSelf: 'center', marginTop: SPACING.lg }}>
                                <AdaptiveText variant="body" color={colors.error} weight="medium">Vider le panier</AdaptiveText>
                            </Pressable>
                        </ScrollView>

                        <View style={[styles.footer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF', borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', paddingBottom: insets.bottom + SPACING.sm }]}>
                            <View style={styles.totalRow}>
                                <AdaptiveText variant="body" color={colors.textSecondary}>Total de la commande</AdaptiveText>
                                <AdaptiveText variant="headline" weight="bold" color={colors.primary}>
                                    {cartTotal.toLocaleString('fr-FR')} FCFA
                                </AdaptiveText>
                            </View>
                            <Button
                                title="Commander maintenant"
                                variant="gradient3d"
                                icon={<CheckCircle2 color="#FFFFFF" size={20} />}
                                onPress={() => {
                                    onClose();
                                    onCheckout();
                                }}
                                fullWidth
                                style={{ height: 54 }}
                            />
                        </View>
                    </>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: COMMON_STYLES.modalContainer,
    cartItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        marginBottom: SPACING.md
    },
    cartItemImage: {
        width: 64,
        height: 64,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BORDER_RADIUS.md
    },
    cartItemInfo: {
        flex: 1,
        marginLeft: SPACING.md,
        marginRight: SPACING.sm,
    },
    cartItemActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm
    },
    footer: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
        borderTopWidth: 1,
    },
    totalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.lg
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
});

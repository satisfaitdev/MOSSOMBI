import React, { useState } from 'react';
import { View, ScrollView, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';
import { GRADIENTS } from '@/constants/gradients';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import GradientBackground from '@/components/atoms/GradientBackground';
import BannerCarousel from '@/components/organisms/BannerCarousel';
import CategoryPill from '@/components/supermarket/CategoryPill';
import ProductCard, { Product } from '@/components/supermarket/ProductCard';
import ProductDetailModal from '@/components/supermarket/ProductDetailModal';
import SupermarketCartModal, { CartItemType } from '@/components/supermarket/SupermarketCartModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, ChevronLeft, Search, ShoppingCart, SlidersHorizontal } from 'lucide-react-native';

const CATEGORIES = [
    { id: 'all', label: 'Tout voir' },
    { id: 'electronics', label: 'Électronique' },
    { id: 'phones', label: 'Téléphones & Accessoires' },
    { id: 'clothing', label: 'Habillement' },
    { id: 'computers', label: 'Ordinateurs' },
    { id: 'food', label: 'Alimentation' },
    { id: 'kids', label: 'Bébé & Enfants' },
    { id: 'beauty', label: 'Beauté & Santé' },
];

// Dummy data for visual development
const SUPERMARKET_BANNERS = [
    {
        id: 'sm1',
        title: '🛍️ Jours Flash',
        description: 'Jusqu\'à -50% sur l\'électronique et les smartphones.',
        ctaText: 'Acheter maintenant',
        imageUrl: require('@/assets/images/icon.png'), // Need correct image, placeholder for now
    },
    {
        id: 'sm2',
        title: '👗 Nouvelle Collection',
        description: 'Découvrez les dernières tendances mode.',
        ctaText: 'Découvrir',
        imageUrl: require('@/assets/images/icon.png'),
    }
];

const DUMMY_PRODUCTS: Product[] = [
    { id: 'p1', title: 'iPhone 15 Pro Max 256Go Titane', price: 950000, rating: 4.8, reviews: 124, image: require('@/assets/images/icon.png') },
    { id: 'p2', title: 'MacBook Pro M3 14 pouces', price: 1250000, rating: 4.9, reviews: 56, image: require('@/assets/images/icon.png') },
    { id: 'p3', title: 'Sneakers Nike Air Max Plus', price: 85000, rating: 4.5, reviews: 310, image: require('@/assets/images/icon.png') },
    { id: 'p4', title: 'Montre Connectée Apple Watch Ultra 2', price: 580000, rating: 4.7, reviews: 89, image: require('@/assets/images/icon.png') },
    { id: 'p5', title: 'Écouteurs AirPods Pro 2', price: 180000, rating: 4.8, reviews: 412, image: require('@/assets/images/icon.png') },
    { id: 'p6', title: 'Sac à Main de Luxe Cuir Véritable', price: 45000, rating: 4.3, reviews: 25, image: require('@/assets/images/icon.png') },
];

export default function SupermarketScreen() {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    // Cart State
    const [cartItems, setCartItems] = useState<CartItemType[]>([]);
    const [isCartVisible, setIsCartVisible] = useState(false);

    // Product Detail State
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isDetailVisible, setIsDetailVisible] = useState(false);

    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const handleAddToCart = (product: Product, quantity: number = 1) => {
        setCartItems(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
            }
            return [...prev, { product, quantity }];
        });
    };

    const handleUpdateQuantity = (productId: string, delta: number) => {
        setCartItems(prev => prev.map(item => {
            if (item.product.id === productId) {
                const newQuantity = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQuantity };
            }
            return item;
        }));
    };

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

            <View style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.8)',
                borderRadius: 20,
                paddingHorizontal: SPACING.md,
                height: 40,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            }}>
                <Search size={16} color={colors.textTertiary} />
                <TextInput
                    placeholder="Rechercher des articles..."
                    placeholderTextColor={colors.textTertiary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onFocus={() => setIsSearchFocused(true)}
                    style={{ flex: 1, marginLeft: SPACING.sm, color: colors.text, fontSize: 15 }}
                />
                {isSearchFocused && (
                    <Pressable onPress={() => setIsSearchFocused(false)} style={{ padding: 4 }}>
                        <AdaptiveText variant="caption" color={colors.primary} weight="bold">Fermer</AdaptiveText>
                    </Pressable>
                )}
            </View>

                        <Pressable
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
                            <Bell color={colors.text} size={20} />
                            <View style={{
                                position: 'absolute', top: 10, right: 10, width: 8, height: 8,
                                borderRadius: 4, backgroundColor: colors.error
                            }} />
                        </Pressable>
                    </View>
                    {isSearchFocused ? (
                        <View style={{ flex: 1, paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl }}>
                            <AdaptiveText variant="title" weight="bold" style={{ marginBottom: SPACING.md }}>Recherches récentes</AdaptiveText>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xl }}>
                                {['iPhone 15', 'Ordinateur HP', 'Chaussures sport', 'Lait entier'].map((term, i) => (
                                    <View key={i} style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}>
                                        <AdaptiveText variant="body">{term}</AdaptiveText>
                                    </View>
                                ))}
                            </View>
                            <AdaptiveText variant="title" weight="bold" style={{ marginBottom: SPACING.md }}>Produits populaires🔥</AdaptiveText>
                            <View style={{ gap: SPACING.md }}>
                                {['MacBook Pro M3', 'AirPods Pro 2', 'Montre connectée'].map((term, i) => (
                                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                                        <Search size={16} color={colors.textTertiary} />
                                        <AdaptiveText variant="body">{term}</AdaptiveText>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ) : (
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                            {/* Promotional Carousel */}
                            <View style={{ marginTop: SPACING.sm, paddingHorizontal: SPACING.lg }}>
                                <View style={{ borderRadius: 20, overflow: 'hidden' }}>
                                    <BannerCarousel banners={SUPERMARKET_BANNERS} />
                                </View>
                            </View>

                            {/* Categories Horizontal List */}
                            <View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, marginTop: SPACING.lg, marginBottom: SPACING.md }}>
                                    <AdaptiveText variant="title" weight="bold">Catégories</AdaptiveText>
                                    <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <AdaptiveText variant="caption" color={colors.primary} weight="bold">Filtres</AdaptiveText>
                                        <SlidersHorizontal size={14} color={colors.primary} />
                                    </Pressable>
                                </View>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ paddingHorizontal: SPACING.lg }}
                                >
                                    {CATEGORIES.map((cat) => (
                                        <CategoryPill
                                            key={cat.id}
                                            id={cat.id}
                                            label={cat.label}
                                            active={activeCategory === cat.id}
                                            onPress={setActiveCategory}
                                        />
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Flash Deals (Horizontal Scroll) */}
                            <View style={{ marginTop: SPACING.xl }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, marginBottom: SPACING.md }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <AdaptiveText variant="title" weight="bold">⚡ Ventes Flash</AdaptiveText>
                                        <View style={{ backgroundColor: `${colors.error}1A`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                                            <AdaptiveText variant="caption" weight="bold" color={colors.error}>24:00:00</AdaptiveText>
                                        </View>
                                    </View>
                                    <AdaptiveText variant="caption" color={colors.primary} weight="bold">Voir tout</AdaptiveText>
                                </View>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ paddingLeft: SPACING.lg, paddingRight: SPACING.xs }}
                                >
                                    {DUMMY_PRODUCTS.slice(0, 4).map((item) => (
                                        <View key={item.id} style={{ marginRight: SPACING.md }}>
                                            <ProductCard
                                                product={item}
                                                layout="horizontal"
                                                onProductPress={(p) => { setSelectedProduct(p); setIsDetailVisible(true); }}
                                                onAddPress={(p) => handleAddToCart(p, 1)}
                                            />
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Just for You Grid */}
                            <View style={{ marginTop: SPACING.xl, paddingHorizontal: SPACING.lg }}>
                                <AdaptiveText variant="title" weight="bold" style={{ marginBottom: SPACING.md }}>Pour vous</AdaptiveText>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <View style={{ gap: SPACING.md }}>
                                        {DUMMY_PRODUCTS.filter((_, i) => i % 2 === 0).map((item, index) => (
                                            <ProductCard
                                                key={item.id}
                                                product={item}
                                                layout="grid"
                                                isLarge={index % 2 === 0}
                                                onProductPress={(p) => { setSelectedProduct(p); setIsDetailVisible(true); }}
                                                onAddPress={(p) => handleAddToCart(p, 1)}
                                            />
                                        ))}
                                    </View>
                                    <View style={{ gap: SPACING.md }}>
                                        {DUMMY_PRODUCTS.filter((_, i) => i % 2 !== 0).map((item, index) => (
                                            <ProductCard
                                                key={item.id}
                                                product={item}
                                                layout="grid"
                                                isLarge={index % 2 !== 0}
                                                onProductPress={(p) => { setSelectedProduct(p); setIsDetailVisible(true); }}
                                                onAddPress={(p) => handleAddToCart(p, 1)}
                                            />
                                        ))}
                                    </View>                        </View>
                            </View>

                        </ScrollView>
                    )}

                    {/* Floating Action Cart Button */}
                    {!isSearchFocused && (
                        <View style={{
                            position: 'absolute',
                            bottom: insets.bottom + SPACING.lg,
                            alignSelf: 'center',
                            shadowColor: colors.primary,
                            shadowOffset: { width: 0, height: 10 },
                            shadowOpacity: 0.3,
                            shadowRadius: 15,
                            elevation: 10,
                        }}>
                            <Pressable
                                onPress={() => setIsCartVisible(true)}
                                style={({ pressed }) => [
                                    {
                                        flexDirection: 'row',
                                        alignItems: 'center', backgroundColor: colors.primary,
                                        paddingHorizontal: 18,
                                        paddingVertical: 12,
                                        borderRadius: 30,
                                        gap: SPACING.md,
                                        transform: [{ scale: pressed ? 0.95 : 1 }],
                                    }
                                ]}
                            >
                                <ShoppingCart size={20} color="#FFFFFF" />
                                <AdaptiveText weight="bold" color="#FFFFFF" style={{ fontSize: 14 }}>
                                    Mon Panier
                                </AdaptiveText>

                                {cartCount > 0 && (
                                    <View style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                                        <AdaptiveText variant="caption" weight="bold" color={colors.primary}>{cartCount}</AdaptiveText>
                                    </View>
                                )}
                            </Pressable>
                        </View>
                    )}

                    <ProductDetailModal
                        product={selectedProduct}
                        visible={isDetailVisible}
                        onClose={() => setIsDetailVisible(false)}
                        onAddToCart={handleAddToCart}
                    />

                    <SupermarketCartModal
                        visible={isCartVisible}
                        onClose={() => setIsCartVisible(false)}
                        cartItems={cartItems}
                        onUpdateQuantity={handleUpdateQuantity}
                        onClearCart={() => setCartItems([])}
                        onCheckout={() => {
                            setIsCartVisible(false);
                            setCartItems([]);
                            // TODO: Navigate to checkout
                        }}
                    />

    </GradientBackground>
    );
}

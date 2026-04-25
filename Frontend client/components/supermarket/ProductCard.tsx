import React from 'react';
import { View, Image, Pressable, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Star } from 'lucide-react-native';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';
import { GRADIENTS } from '@/constants/gradients';

export interface Product {
    id: string;
    title: string;
    price: number;
    image: any;
    rating: number;
    reviews: number;
}

interface ProductCardProps {
    product: Product;
    onProductPress: (p: Product) => void;
    onAddPress: (p: Product) => void;
    layout?: 'grid' | 'horizontal';
    isLarge?: boolean;
}

export default function ProductCard({ product, onProductPress, onAddPress, layout = 'grid', isLarge = false }: ProductCardProps) {
    const { colors, isDark } = useTheme();
    const { width } = useWindowDimensions();

    const isGrid = layout === 'grid';
    // Compute width for grid (2 columns with gap)
    const cardWidth = isGrid ? (width - SPACING.lg * 2 - SPACING.md) / 2 : 160;

    return (
        <Pressable
            onPress={() => onProductPress(product)}
            style={({ pressed }) => [
                {
                    width: cardWidth,
                    borderRadius: 18,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                    marginRight: isGrid ? 0 : SPACING.md,
                    marginBottom: isGrid ? SPACING.md : 0,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                }
            ]}
        >
            {/* Product Image */}
            <View style={{ height: isLarge ? 220 : cardWidth, width: '100%', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                <Image
                    source={product.image}
                    style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                />
                {/* Rating overlay */}
                <BlurView
                    tint={isDark ? 'dark' : 'light'}
                    intensity={45}
                    style={{
                        position: 'absolute',
                        bottom: SPACING.sm,
                        left: SPACING.sm,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 2
                    }}
                >
                    <Star size={12} fill={colors.warning} color={colors.warning} />
                    <AdaptiveText variant="caption" weight="bold">{product.rating.toFixed(1)}</AdaptiveText>
                </BlurView>
            </View>

            {/* Product Info */}
            <View style={{ padding: SPACING.sm, gap: SPACING.xs }}>
                <AdaptiveText variant="caption" weight="medium" numberOfLines={2} style={{ lineHeight: 18 }}>
                    {product.title}
                </AdaptiveText>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.xs }}>
                    <AdaptiveText variant="body" weight="bold" color={colors.primary}>
                        {product.price.toLocaleString('fr-FR')} FCFA
                    </AdaptiveText>

                    <Pressable
                        onPress={(e) => {
                            e.stopPropagation();
                            onAddPress(product);
                        }}
                        style={({ pressed }) => [
                            {
                                transform: [{ scale: pressed ? 0.9 : 1 }],
                                shadowColor: colors.primary,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 6,
                                elevation: 4,
                                borderRadius: 14,
                            }
                        ]}
                    >
                        <LinearGradient
                            colors={GRADIENTS.primary.colors as any}
                            start={GRADIENTS.primary.start}
                            end={GRADIENTS.primary.end}
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: 14,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Plus size={16} color="#FFFFFF" strokeWidth={3} />
                        </LinearGradient>
                    </Pressable>
                </View>
            </View>
        </Pressable >
    );
}

import React, { useState, useMemo } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { ShoppingCart, Grid, List } from 'lucide-react-native';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '@/constants/colors';
import { Heading, Body, Caption, Badge } from '@/components/atoms';
import { Section, Stack, Row } from '@/components/ui';
import { SearchBar, RatingDisplay, PriceDisplay, EmptyState } from '@/components/molecules';
import { SearchLayout } from '@/components/templates';
import { SuccessModal } from '@/components/organisms/modals';
import Button from '@/components/Button';

import { ClothingProduct } from '@/types/product';

const PRODUCTS: ClothingProduct[] = [
  { id: '1', name: 'Costume Complet', category: 'Homme', size: 'L', color: 'Noir', price: 95000, compareAtPrice: 120000, rating: 4.7, inStock: true },
  { id: '2', name: 'Robe de Soirée', category: 'Femme', size: 'M', color: 'Rouge', price: 85000, rating: 4.8, inStock: true },
  { id: '3', name: 'Ensemble Sport', category: 'Enfant', size: '10 ans', color: 'Bleu', price: 35000, rating: 4.5, inStock: true },
  { id: '4', name: 'Chemise Premium', category: 'Homme', size: 'M', color: 'Blanc', price: 45000, compareAtPrice: 55000, rating: 4.6, inStock: true },
  { id: '5', name: 'Pantalon Femme', category: 'Femme', size: '38', color: 'Beige', price: 38000, rating: 4.4, inStock: true },
];

export default function ClothingCompleteScreen() {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [priceRange, setPriceRange] = useState<'all' | 'low' | 'mid' | 'high'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [cart, setCart] = useState<{[key: string]: number}>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const categories = ['all', 'Homme', 'Femme', 'Enfant'];
  const filteredProducts = useMemo(() => {
    let filtered = PRODUCTS;
    if (searchQuery) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (category !== 'all') filtered = filtered.filter(p => p.category === category);
    if (priceRange === 'low') filtered = filtered.filter(p => p.price < 40000);
    else if (priceRange === 'mid') filtered = filtered.filter(p => p.price >= 40000 && p.price < 70000);
    else if (priceRange === 'high') filtered = filtered.filter(p => p.price >= 70000);
    return filtered;
  }, [searchQuery, category, priceRange]);

  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => sum + (PRODUCTS.find(p => p.id === id)?.price || 0) * qty, 0);
  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  return (
    <>
      <HeaderWithBackButton title="Collection Complète" rightButton={<Pressable style={{ position: 'relative' }}><ShoppingCart size={24} color={colors.text} />{cartCount > 0 && <View style={{ position: 'absolute', top: -8, right: -8, backgroundColor: colors.error, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}><Caption style={{ color: '#FFFFFF', fontSize: 10 }}>{cartCount}</Caption></View>}</Pressable>} />
      <SearchLayout searchBar={<SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Rechercher un article..." />} topFilters={<Row spacing="sm" justify="space-between"><ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}><Row spacing="sm">{categories.map((cat) => <Pressable key={cat} onPress={() => setCategory(cat)} style={{ paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.lg, backgroundColor: category === cat ? colors.primary : colors.surface }}><Body style={{ color: category === cat ? '#FFFFFF' : colors.text }}>{cat === 'all' ? 'Tous' : cat}</Body></Pressable>)}</Row></ScrollView><Pressable onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} style={{ padding: SPACING.sm, backgroundColor: colors.surface, borderRadius: BORDER_RADIUS.md }}>{viewMode === 'grid' ? <List size={20} color={colors.text} /> : <Grid size={20} color={colors.text} />}</Pressable></Row>} filters={<Row spacing="sm">{[{ id: 'all', label: 'Tous' }, { id: 'low', label: '<40K' }, { id: 'mid', label: '40-70K' }, { id: 'high', label: '>70K' }].map((range) => <Pressable key={range.id} onPress={() => setPriceRange(range.id as any)} style={{ flex: 1, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md, backgroundColor: priceRange === range.id ? colors.primary : colors.card, alignItems: 'center' }}><Caption style={{ color: priceRange === range.id ? '#FFFFFF' : colors.text }}>{range.label}</Caption></Pressable>)}</Row>} results={[]} renderItem={() => null} customResults={<View style={{ flexDirection: viewMode === 'grid' ? 'row' : 'column', flexWrap: 'wrap', gap: SPACING.md }}>{filteredProducts.map((product) => <Section variant="elevated" key={product.id} style={viewMode === 'grid' ? { width: '48%' } : { width: '100%' }}><Stack spacing="sm"><Heading level={viewMode === 'grid' ? 4 : 3} numberOfLines={2}>{product.name}</Heading><Row spacing="xs"><Badge variant="info" size="sm">{product.size}</Badge><Badge variant="default" size="sm">{product.color}</Badge></Row><RatingDisplay rating={product.rating} size={12} /><PriceDisplay price={product.price} compareAtPrice={product.compareAtPrice} currency="CDF" showDiscount /><Button title="Ajouter" onPress={() => { setCart(prev => ({ ...prev, [product.id]: (prev[product.id] || 0) + 1 })); setShowSuccessModal(true); }} variant="primary" size="sm" /></Stack></Section>)}</View>} emptyState={<EmptyState title="Aucun article" />} />
      {cartTotal > 0 && <View style={{ position: 'absolute', bottom: 20, left: SPACING.lg, right: SPACING.lg, backgroundColor: colors.card, padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}><Row justify="space-between" align="center"><View><Body variant="secondary">Total</Body><Heading level={3}>{cartTotal.toLocaleString()} CDF</Heading></View><Button title="Commander" variant="gradient" size="md" /></Row></View>}
      <SuccessModal visible={showSuccessModal} onClose={() => setShowSuccessModal(false)} title="Ajouté !" message="Article ajouté au panier" animation="checkmark" autoClose />
    </>
  );
}

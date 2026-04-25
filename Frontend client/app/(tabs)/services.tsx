import React, { useState, useMemo } from 'react';
import { ScrollView, View, TextInput, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Coins, Ticket, Hotel, Plane, ShoppingBag, CreditCard, Sparkles, Package, Flame, Zap, Smartphone, Wifi } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@/constants/colors';
import { Heading, Body, Caption } from '@/components/atoms';
import { Stack } from '@/components/ui';
import { PageContainer } from '@/components/layouts';
import ServiceCard from '@/components/ServiceCard';
import GradientBackground from '@/components/atoms/GradientBackground';

const { width } = Dimensions.get('window');
const numColumns = 4;
const gap = SPACING.md;
const paddingHorizontal = SPACING.lg;
const itemWidth = (width - paddingHorizontal * 2 - gap * (numColumns - 1)) / numColumns;

interface Service {
  id: string;
  title: string;
  icon: React.ReactNode;
  badge?: string;
  category: string;
}

export default function ServicesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');

  const allServices: Service[] = [
    { id: 'coins', title: 'Coins', icon: <Coins size={32} color={colors.primary} />, badge: 'EXCLUSIF', category: 'Divertissement' },
    { id: 'billetterie', title: 'Billetterie', icon: <Ticket size={32} color={colors.secondary} />, category: 'Divertissement' },
    { id: 'bookings', title: 'Bookings', icon: <Plane size={32} color={colors.accent} />, category: 'Voyage' },
    { id: 'hotel', title: 'Hôtels', icon: <Hotel size={32} color={colors.primary} />, category: 'Voyage' },
    { id: 'supermarket', title: 'Supermarché', icon: <ShoppingBag size={32} color={colors.secondary} />, category: 'Shopping' },
    { id: 'delivery', title: 'Livraison', icon: <Package size={48} color={colors.accent} />, category: 'Livraison' },
    { id: 'banking', title: 'Bancaire', icon: <CreditCard size={32} color={colors.primary} />, category: 'Finance' },
    { id: 'electricity', title: 'Électricité', icon: <Zap size={32} color={colors.secondary} />, category: 'Services Public' },
    { id: 'water', title: 'Eau', icon: <Flame size={32} color={colors.accent} />, category: 'Services Public' },
    { id: 'phone', title: 'Téléphone', icon: <Smartphone size={32} color={colors.primary} />, category: 'Services Public' },
    { id: 'internet', title: 'Internet', icon: <Wifi size={32} color={colors.secondary} />, category: 'Services Public' },
    { id: 'digital', title: 'Digital', icon: <Sparkles size={32} color={colors.accent} />, category: 'Services Digital' },
  ];

  const categories = ['Tous', ...new Set(allServices.map(s => s.category))];

  const filteredServices = useMemo(() => {
    let filtered = allServices;
    if (selectedCategory !== 'Tous') {
      filtered = filtered.filter(s => s.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => s.title.toLowerCase().includes(query) || s.category.toLowerCase().includes(query));
    }
    return filtered;
  }, [searchQuery, selectedCategory]);

  return (
    <GradientBackground style={{ flex: 1 }} opacity="10">
      <PageContainer style={{ backgroundColor: 'transparent' }}>
          <Stack spacing="lg">
            <View><Heading level={1}>Services</Heading><Caption>Découvrez tous nos services</Caption></View>

          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: SPACING.md }}>
            <Search size={20} color={colors.textTertiary} />
            <TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Rechercher un service..." placeholderTextColor={colors.textTertiary} style={{ flex: 1, paddingVertical: SPACING.md, paddingHorizontal: SPACING.sm, color: colors.text, fontSize: TYPOGRAPHY.sizes.md }} />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm }}>
            {categories.map((cat) => (
              <Pressable key={cat} onPress={() => setSelectedCategory(cat)} style={{ backgroundColor: selectedCategory === cat ? colors.primary : colors.surface, borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderWidth: 1, borderColor: selectedCategory === cat ? colors.primary : colors.border }}>
                <Body style={{ color: selectedCategory === cat ? '#FFFFFF' : colors.text, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.medium }}>{cat}</Body>
              </Pressable>
            ))}
          </ScrollView>

          <View><Body style={{ fontWeight: TYPOGRAPHY.weights.medium }}>{filteredServices.length} service{filteredServices.length > 1 ? 's' : ''}</Body></View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
            {filteredServices.map((service) => (
              <View key={service.id} style={{ width: itemWidth }}>
                <ServiceCard title={service.title} icon={service.icon} onPress={() => router.push(`/${service.id}` as any)} badge={service.badge} />
              </View>
            ))}
          </View>
          </Stack>
      </PageContainer>
    </GradientBackground>
  );
}

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Camera, Package, MapPin, Package as PackageIcon, CreditCard, Truck, Upload, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import GradientBackground from '@/components/atoms/GradientBackground';
import LiquidGlassCard from '@/components/ui/LiquidGlassCard';
import Button from '@/components/Button';
import { ServiceSelector } from '@/components/ui/ServiceSelector';
import { MultiServiceSelector } from '@/components/ui/MultiServiceSelector';
import { apiService } from '@/services/api';

// Types pour le formulaire
interface UniversalProductForm {
  // Informations de base
  name: string;
  description: string;
  price: string;
  currency: string;
  
  // Type de vente
  sale_type: 'in_stock' | 'on_order';
  
  // État du produit
  condition: 'new' | 'used'; // NOUVEAU
  
  // Stock (si in_stock)
  in_stock: boolean;
  quantity: string;
  low_stock_threshold: string;
  stock_locations: string[];
  
  // Commande (si on_order)
  order_countries: string[];
  
  // Catégorie
  main_category: string;
  sub_category: string;
  brand: string;
  
  // Démographie
  gender: string;
  age_group: string;
  
  // Couleurs disponibles
  available_colors: string[];
  
  // Livraison
  delivery_time: string;
  delivery_cost: string;
  
  // Médias
  images: string[];
  video_url: string;
  
  // Attributs dynamiques selon catégorie
  attributes: Record<string, any>;
}

const CATEGORIES = [
  { id: 'phones', name: 'Téléphones', icon: '📱' },
  { id: 'computers', name: 'Ordinateurs', icon: '💻' },
  { id: 'clothing', name: 'Vêtements', icon: '👔' },
  { id: 'shoes', name: 'Chaussures', icon: '👟' },
  { id: 'electronics', name: 'Électronique', icon: '📺' },
  { id: 'accessories', name: 'Accessoires', icon: '⌚' },
  { id: 'home', name: 'Maison', icon: '🏠' },
  { id: 'beauty', name: 'Beauté', icon: '💄' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
  { id: 'books', name: 'Livres', icon: '📚' },
];

const CURRENCIES = ['XAF', 'CDF', 'EUR', 'USD', 'GBP'];
const GENDERS = [
  { value: 'men', label: 'Homme' },
  { value: 'women', label: 'Femme' },
  { value: 'unisex', label: 'Unisex' },
  { value: 'kids', label: 'Enfants' },
  { value: 'boys', label: 'Garçons' },
  { value: 'girls', label: 'Filles' }
];
const AGE_GROUPS = [
  { value: 'baby', label: 'Bébé (0-2 ans)' },
  { value: 'toddler', label: 'Tout-petit (2-4 ans)' },
  { value: 'kids', label: 'Enfant (5-12 ans)' },
  { value: 'teen', label: 'Adolescent (13-17 ans)' },
  { value: 'adult', label: 'Adulte (18+ ans)' },
  { value: 'senior', label: 'Senior (60+ ans)' }
];

const COLOR_OPTIONS = [
  'Noir', 'Blanc', 'Rouge', 'Bleu', 'Vert', 'Jaune', 'Orange', 'Violet', 
  'Rose', 'Gris', 'Marron', 'Beige', 'Or', 'Argent', 'Turquoise', 'Marine'
];

const CONGO_CITIES = [
  'Kinshasa', 'Lubumbashi', 'Mbuji-Mayi', 'Kananga', 'Kisangani',
  'Likasi', 'Kolwezi', 'Tshikapa', 'Matadi', 'Boma', 'Bandundu',
  'Goma', 'Bukavu', 'Kikwit', 'Mbandaka', 'Mongala',
  'Kasongo-Lunda', 'Kasangulu', 'Lisala', 'Butembo', 'Beni',
  'Uvira', 'Kalemie', 'Mwene-Ditu', 'Tshilenge', 'Kasongo'
].filter((city, index, arr) => arr.indexOf(city) === index);

const AFRICAN_COUNTRIES = [
  'RD Congo', 'Cameroun', 'Nigeria', 'Ghana', 'Côte d\'Ivoire',
  'Sénégal', 'Kenya', 'Ouganda', 'Tanzanie', 'Afrique du Sud',
  'Éthiopie', 'Zambie', 'Malawi', 'Botswana', 'Namibie',
  'Angola', 'Gabon', 'Guinée Équatoriale', 'Congo-Brazzaville',
  'Tchad', 'Congo-Kinshasa', 'Burkina Faso', 'Mali', 'Niger',
  'Bénin', 'Togo', 'Sierra Leone', 'Libéria', 'Guinée',
  'Mauritanie', 'Soudan', 'Égypte', 'Libye', 'Tunisie',
  'Algérie', 'Maroc', 'Maurice', 'Madagascar', 'Somalie',
  'Djibouti', 'Érythrée', 'Seychelles', 'Comores', 'Mayotte',
  'Réunion', 'Cap-Vert'
];

export default function AddArticleEnhancedScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  
  // États pour les médias
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  
  // Récupérer la devise par défaut selon le pays
  const getDefaultCurrency = useCallback(() => {
    // Logique pour déterminer la devise selon le pays
    // Pour la RD Congo: XAF, CDF
    // Pour d'autres pays: EUR, USD, etc.
    return 'XAF'; // Par défaut, peut être amélioré avec la détection de pays
  }, []);
  
  // Formulaire
  const [formData, setFormData] = useState<UniversalProductForm>({
    name: '',
    description: '',
    price: '',
    currency: getDefaultCurrency(),
    
    // Type de vente
    sale_type: 'in_stock',
    
    // État du produit
    condition: 'new', // NOUVEAU
    
    // Stock
    in_stock: true,
    quantity: '1',
    low_stock_threshold: '5',
    stock_locations: ['Kinshasa'],
    
    // Commande
    order_countries: ['RD Congo'],
    
    // Catégorie
    main_category: '',
    sub_category: '',
    brand: '',
    
    // Démographie
    gender: 'unisex',
    age_group: 'adult',
    
    // Couleurs disponibles
    available_colors: [],
    
    // Livraison
    delivery_time: '24-48h',
    delivery_cost: '0',
    
    // Médias
    images: [],
    video_url: '',
    
    attributes: {}
  });

  // Validation
  const canSubmit = useMemo(() => {
    return (
      formData.name.trim().length >= 2 &&
      formData.price && parseFloat(formData.price) >= 0 &&
      formData.main_category &&
      (formData.sale_type === 'on_order' || formData.sale_type === 'in_stock')
    );
  }, [formData]);

  // Mettre à jour le formulaire
  const updateField = useCallback((field: keyof UniversalProductForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Mettre à jour les attributs selon la catégorie
  const updateAttribute = useCallback((key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      attributes: { ...prev.attributes, [key]: value }
    }));
  }, []);

  // Gestion des couleurs
  const toggleColor = useCallback((color: string) => {
    setFormData(prev => ({
      ...prev,
      available_colors: prev.available_colors.includes(color)
        ? prev.available_colors.filter(c => c !== color)
        : [...prev.available_colors, color]
    }));
  }, []);

  // Gestion des villes de stock
  const toggleStockLocation = useCallback((city: string) => {
    setFormData(prev => ({
      ...prev,
      stock_locations: prev.stock_locations.includes(city)
        ? prev.stock_locations.filter(c => c !== city)
        : [...prev.stock_locations, city]
    }));
  }, []);

  // Gestion des pays de commande
  const toggleOrderCountry = useCallback((country: string) => {
    setFormData(prev => ({
      ...prev,
      order_countries: prev.order_countries.includes(country)
        ? prev.order_countries.filter(c => c !== country)
        : [...prev.order_countries, country]
    }));
  }, []);

  // Fonctions pour les médias
  const handleAddImages = useCallback(async () => {
    try {
      // Demander les permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Veuillez autoriser l\'accès à la galerie pour ajouter des photos');
        return;
      }

      // Ouvrir la galerie
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5 - images.length, // Utiliser selectionLimit au lieu de maxSelections
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets
          .filter(asset => asset.uri)
          .map(asset => asset.uri!);
        
        setImages(prev => [...prev, ...newImages].slice(0, 5)); // Maximum 5 photos
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Erreur', 'Impossible d\'accéder à la galerie');
    }
  }, [images]);

  const handleAddVideo = useCallback(async () => {
    try {
      // Demander les permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Veuillez autoriser l\'accès à la galerie pour ajouter une vidéo');
        return;
      }

      // Ouvrir la galerie pour vidéos
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setVideoUrl(result.assets[0].uri!);
        Alert.alert('Vidéo ajoutée', 'La vidéo de démonstration a été ajoutée avec succès');
      }
    } catch (error) {
      console.error('Video picker error:', error);
      Alert.alert('Erreur', 'Impossible d\'accéder à la vidéo');
    }
  }, []);

  const removeImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Soumettre le formulaire
  const onSubmit = useCallback(async () => {
    if (!canSubmit) return;

    setLoading(true);
    try {
      // Construire le payload universel
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        currency: formData.currency,
        
        // État du produit
        condition: formData.condition,
        
        stock_management: {
          in_stock: formData.sale_type === 'in_stock',
          quantity: parseInt(formData.quantity) || 1,
          low_stock_threshold: parseInt(formData.low_stock_threshold) || 5,
          track_quantity: true
        },
        
        availability: {
          countries: formData.sale_type === 'in_stock' ? ['RD Congo'] : formData.order_countries,
          cities: formData.sale_type === 'in_stock' ? formData.stock_locations : [],
          delivery_zones: []
        },
        
        delivery: {
          delivery_time: formData.delivery_time,
          delivery_cost: parseFloat(formData.delivery_cost) || 0,
          delivery_methods: ['standard', 'pickup']
        },
        
        payment: {
          accepted_methods: ['mobile_money', 'cash'],
          installments_available: false
        },
        
        media: {
          images: images.map((url, index) => ({
            url,
            alt: formData.name,
            order: index
          })),
          video: videoUrl ? {
            url: videoUrl,
            duration: 30
          } : undefined
        },
        
        category: {
          main_category: formData.main_category,
          sub_category: formData.sub_category || undefined,
          brand: formData.brand || undefined
        },
        
        demographics: {
          gender: formData.gender,
          age_group: formData.age_group
        },
        
        attributes: {
          ...formData.attributes,
          color_options: formData.available_colors
        },
        
        marketing: {
          tags: [formData.main_category, formData.brand, ...formData.available_colors].filter(Boolean),
          featured: false
        }
      };

      // Utiliser la nouvelle API enhanced
      const res = await apiService.createArticleEnhanced(payload);

      if (!res.success) {
        Alert.alert('Erreur', res.error || 'Impossible de créer l\'article');
        return;
      }

      Alert.alert('Succès', 'Article créé avec succès!');
      router.back();
    } catch (error) {
      console.error('Create article error:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, [formData, canSubmit, router]);

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
        <Pressable onPress={() => router.back()} style={{ 
          width: 36, height: 36, borderRadius: 20, 
          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', 
          alignItems: 'center', justifyContent: 'center' 
        }}>
          <ChevronLeft color={colors.text} size={22} />
        </Pressable>
        <AdaptiveText variant="body" weight="bold" style={{ fontSize: 18, flex: 1 }}>
          Ajouter un article
        </AdaptiveText>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ 
        paddingHorizontal: SPACING.lg, 
        paddingBottom: 120,
        gap: SPACING.lg 
      }} style={{ position: 'relative', zIndex: 1 }}>

        {/* Étape 1: Informations de base */}
        <LiquidGlassCard padding={SPACING.lg}>
          <AdaptiveText variant="caption" weight="bold" style={{ color: colors.primary, marginBottom: SPACING.md }}>
            📦 Informations de base
          </AdaptiveText>

          <View style={{ gap: SPACING.md }}>
            <View>
              <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Nom du produit *</AdaptiveText>
              <TextInput
                placeholder="ex: iPhone 15 Pro, Samsung Galaxy S24"
                value={formData.name}
                onChangeText={(text) => updateField('name', text)}
                placeholderTextColor={colors.textSecondary}
                style={{ 
                  color: colors.text, 
                  marginTop: 4,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: formData.name ? colors.primary : colors.border,
                  backgroundColor: formData.name ? (colors.primary + '5') : 'transparent',
                  paddingHorizontal: 12,
                  paddingVertical: 8
                }}
              />
            </View>

            <View>
              <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Description</AdaptiveText>
              <TextInput
                placeholder="Décrivez votre produit en détail (caractéristiques, avantages, utilisation...)"
                value={formData.description}
                onChangeText={(text) => updateField('description', text)}
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                style={{ 
                  color: colors.text, 
                  marginTop: 4,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: formData.description ? colors.primary : colors.border,
                  backgroundColor: formData.description ? (colors.primary + '5') : 'transparent',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  height: 80
                }}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: SPACING.md }}>
              <View style={{ flex: 1 }}>
                <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Prix *</AdaptiveText>
                <TextInput
                  placeholder="ex: 150000"
                  value={formData.price}
                  onChangeText={(text) => updateField('price', text)}
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  style={{ 
                    color: colors.text, 
                    marginTop: 4,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: formData.price ? colors.primary : colors.border,
                    backgroundColor: formData.price ? (colors.primary + '5') : 'transparent',
                    paddingHorizontal: 12,
                    paddingVertical: 8
                  }}
                />
              </View>
              
              <View style={{ width: 100 }}>
                <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Devise</AdaptiveText>
                <ServiceSelector
                  options={CURRENCIES.map(curr => ({ value: curr, label: curr }))}
                  selectedValue={formData.currency}
                  onValueChange={(value) => updateField('currency', value)}
                />
              </View>
            </View>
          </View>
        </LiquidGlassCard>

        {/* Étape 2: Type de vente et état */}
        <LiquidGlassCard padding={SPACING.lg}>
          <AdaptiveText variant="caption" weight="bold" style={{ color: colors.primary, marginBottom: SPACING.md }}>
            🛍️ Type de vente et état
          </AdaptiveText>

          <View style={{ gap: SPACING.md }}>
            {/* État du produit */}
            <View>
              <AdaptiveText variant="caption" style={{ color: colors.textSecondary, marginBottom: SPACING.sm }}>
                État du produit
              </AdaptiveText>
              <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                <Pressable
                  onPress={() => updateField('condition', 'new')}
                  style={{
                    flex: 1,
                    padding: SPACING.md,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: formData.condition === 'new' ? colors.primary : colors.border,
                    backgroundColor: formData.condition === 'new' ? (colors.primary + '20') : 'transparent'
                  }}
                >
                  <View style={{ alignItems: 'center', gap: SPACING.sm }}>
                    <AdaptiveText variant="caption" style={{ 
                      color: formData.condition === 'new' ? colors.primary : colors.text,
                      fontWeight: formData.condition === 'new' ? '600' : '400'
                    }}>
                      🆕 Neuf
                    </AdaptiveText>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => updateField('condition', 'used')}
                  style={{
                    flex: 1,
                    padding: SPACING.md,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: formData.condition === 'used' ? colors.primary : colors.border,
                    backgroundColor: formData.condition === 'used' ? (colors.primary + '20') : 'transparent'
                  }}
                >
                  <View style={{ alignItems: 'center', gap: SPACING.sm }}>
                    <AdaptiveText variant="caption" style={{ 
                      color: formData.condition === 'used' ? colors.primary : colors.text,
                      fontWeight: formData.condition === 'used' ? '600' : '400'
                    }}>
                      📦 Occasion
                    </AdaptiveText>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Type de vente */}
            <View style={{ flexDirection: 'row', gap: SPACING.md }}>
              <Pressable
                onPress={() => updateField('sale_type', 'in_stock')}
                style={{
                  flex: 1,
                  padding: SPACING.md,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: formData.sale_type === 'in_stock' ? colors.primary : colors.border,
                  backgroundColor: formData.sale_type === 'in_stock' ? (colors.primary + '20') : 'transparent'
                }}
              >
                <View style={{ alignItems: 'center', gap: SPACING.sm }}>
                  <PackageIcon size={24} color={formData.sale_type === 'in_stock' ? colors.primary : colors.textSecondary} />
                  <AdaptiveText variant="caption" style={{ 
                    color: formData.sale_type === 'in_stock' ? colors.primary : colors.text,
                    fontWeight: formData.sale_type === 'in_stock' ? '600' : '400'
                  }}>
                    En stock
                  </AdaptiveText>
                </View>
              </Pressable>

              <Pressable
                onPress={() => updateField('sale_type', 'on_order')}
                style={{
                  flex: 1,
                  padding: SPACING.md,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: formData.sale_type === 'on_order' ? colors.primary : colors.border,
                  backgroundColor: formData.sale_type === 'on_order' ? (colors.primary + '20') : 'transparent'
                }}
              >
                <View style={{ alignItems: 'center', gap: SPACING.sm }}>
                  <CreditCard size={24} color={formData.sale_type === 'on_order' ? colors.primary : colors.textSecondary} />
                  <AdaptiveText variant="caption" style={{ 
                    color: formData.sale_type === 'on_order' ? colors.primary : colors.text,
                    fontWeight: formData.sale_type === 'on_order' ? '600' : '400'
                  }}>
                    Sur commande
                  </AdaptiveText>
                </View>
              </Pressable>
            </View>

            {formData.sale_type === 'in_stock' && (
              <View style={{ gap: SPACING.sm, backgroundColor: colors.primary + '10', padding: SPACING.md, borderRadius: 8 }}>
                <AdaptiveText variant="caption" style={{ color: colors.primary }}>
                  📍 Villes de disponibilité
                </AdaptiveText>
                <MultiServiceSelector
                  options={CONGO_CITIES}
                  selectedValues={formData.stock_locations}
                  onValuesChange={(values: string[]) => updateField('stock_locations', values)}
                  placeholder="Sélectionner les villes..."
                />
              </View>
            )}

            {formData.sale_type === 'on_order' && (
              <View style={{ gap: SPACING.sm, backgroundColor: colors.primary + '10', padding: SPACING.md, borderRadius: 8 }}>
                <AdaptiveText variant="caption" style={{ color: colors.primary }}>
                  🌍 Pays de livraison
                </AdaptiveText>
                <MultiServiceSelector
                  options={AFRICAN_COUNTRIES}
                  selectedValues={formData.order_countries}
                  onValuesChange={(values: string[]) => updateField('order_countries', values)}
                  placeholder="Sélectionner les pays..."
                />
              </View>
            )}
          </View>
        </LiquidGlassCard>

        {/* Étape 3: Catégorie */}
        <LiquidGlassCard padding={SPACING.lg}>
          <AdaptiveText variant="caption" weight="bold" style={{ color: colors.primary, marginBottom: SPACING.md }}>
            🏷️ Catégorie
          </AdaptiveText>

          <View style={{ gap: SPACING.md }}>
            <View>
              <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Catégorie principale *</AdaptiveText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                  {CATEGORIES.map(cat => (
                    <Pressable
                      key={cat.id}
                      onPress={() => updateField('main_category', cat.id)}
                      style={{
                        paddingHorizontal: SPACING.md,
                        paddingVertical: SPACING.sm,
                        borderRadius: 20,
                        backgroundColor: formData.main_category === cat.id ? colors.primary : colors.primary + '20',
                        borderWidth: 1,
                        borderColor: formData.main_category === cat.id ? colors.primary : colors.border
                      }}
                    >
                      <AdaptiveText variant="caption" style={{ 
                        color: formData.main_category === cat.id ? 'white' : colors.primary 
                      }}>
                        {cat.icon} {cat.name}
                      </AdaptiveText>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View>
              <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Marque</AdaptiveText>
              <TextInput
                placeholder="ex: Apple, Samsung, Nike..."
                value={formData.brand}
                onChangeText={(text) => updateField('brand', text)}
                style={{ 
                  color: colors.text, 
                  marginTop: 4,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 12,
                  paddingVertical: 8
                }}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: SPACING.md }}>
              <View style={{ flex: 1 }}>
                <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Genre</AdaptiveText>
                <ServiceSelector
                  options={GENDERS}
                  selectedValue={formData.gender}
                  onValueChange={(value) => updateField('gender', value)}
                  placeholder="Sélectionner..."
                />
              </View>
              
              <View style={{ flex: 1 }}>
                <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Âge</AdaptiveText>
                <ServiceSelector
                  options={AGE_GROUPS}
                  selectedValue={formData.age_group}
                  onValueChange={(value) => updateField('age_group', value)}
                  placeholder="Sélectionner..."
                />
              </View>
            </View>
          </View>
        </LiquidGlassCard>

        {/* Étape 4: Couleurs disponibles */}
        <LiquidGlassCard padding={SPACING.lg}>
          <AdaptiveText variant="caption" weight="bold" style={{ color: colors.primary, marginBottom: SPACING.md }}>
            🎨 Couleurs disponibles
          </AdaptiveText>

          <MultiServiceSelector
              options={COLOR_OPTIONS}
              selectedValues={formData.available_colors}
              onValuesChange={(values: string[]) => updateField('available_colors', values)}
              placeholder="Sélectionner les couleurs..."
            />
        </LiquidGlassCard>

        {/* Étape 5: Médias */}
        <LiquidGlassCard padding={SPACING.lg}>
          <AdaptiveText variant="caption" weight="bold" style={{ color: colors.primary, marginBottom: SPACING.md }}>
            📸 Médias
          </AdaptiveText>

          <View style={{ gap: SPACING.md }}>
            {/* Section des photos */}
            <View>
              <AdaptiveText variant="caption" style={{ color: colors.textSecondary, marginBottom: SPACING.sm }}>
                Photos du produit ({images.length}/5)
              </AdaptiveText>
              
              <Pressable 
                onPress={handleAddImages}
                style={{
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: colors.border,
                  borderStyle: 'dashed',
                  padding: SPACING.lg,
                  alignItems: 'center',
                  gap: SPACING.sm,
                  backgroundColor: images.length > 0 ? (colors.primary + '10') : 'transparent'
                }}
              >
                <Camera size={32} color={images.length > 0 ? colors.primary : colors.textSecondary} />
                <AdaptiveText variant="caption" style={{ color: images.length > 0 ? colors.primary : colors.textSecondary }}>
                  {images.length > 0 ? `${images.length} photo(s) ajoutée(s)` : 'Ajouter des photos'}
                </AdaptiveText>
              </Pressable>

              {/* Affichage des photos ajoutées */}
              {images.length > 0 && (
                <View style={{ marginTop: SPACING.md, gap: SPACING.sm }}>
                  {images.map((imageUrl, index) => (
                    <View key={index} style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: SPACING.sm,
                      padding: SPACING.sm,
                      backgroundColor: colors.surface,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.border
                    }}>
                      <AdaptiveText variant="caption" style={{ flex: 1, color: colors.text }}>
                        📷 {imageUrl.length > 30 ? imageUrl.substring(0, 30) + '...' : imageUrl}
                      </AdaptiveText>
                      <Pressable onPress={() => removeImage(index)}>
                        <X size={16} color={colors.textSecondary} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Section de la vidéo */}
            <View>
              <AdaptiveText variant="caption" style={{ color: colors.textSecondary, marginBottom: SPACING.sm }}>
                Vidéo de démonstration (optionnel)
              </AdaptiveText>
              <TextInput
                placeholder="URL de la vidéo YouTube ou hébergée (10-60 secondes)"
                value={videoUrl}
                onChangeText={setVideoUrl}
                style={{ 
                  color: colors.text, 
                  marginTop: 4,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: videoUrl ? colors.primary : colors.border,
                  backgroundColor: videoUrl ? (colors.primary + '5') : 'transparent',
                  paddingHorizontal: 12,
                  paddingVertical: 8
                }}
              />
              {videoUrl && (
                <AdaptiveText variant="caption" style={{ color: colors.primary, marginTop: SPACING.xs }}>
                  ✓ Vidéo configurée
                </AdaptiveText>
              )}
            </View>
          </View>
        </LiquidGlassCard>

        {/* Bouton de soumission */}
        <Button
          title={loading ? "Création..." : "Créer l'article"}
          onPress={onSubmit}
          disabled={!canSubmit || loading}
          loading={loading}
          style={{ marginTop: SPACING.lg }}
        />

      </ScrollView>
    </GradientBackground>
  );
}

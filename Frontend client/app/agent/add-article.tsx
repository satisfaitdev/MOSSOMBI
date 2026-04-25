import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Camera, Image as ImageIcon, Package, Tag, DollarSign, Globe, Truck, CreditCard, Video, Star, ChevronDown, MapPin, Package as PackageIcon } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import GradientBackground from '@/components/atoms/GradientBackground';
import LiquidGlassCard from '@/components/ui/LiquidGlassCard';
import Button from '@/components/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { apiService } from '@/services/api';

// Types pour le formulaire
interface UniversalProductForm {
  // Informations de base
  name: string;
  description: string;
  price: string;
  currency: string;
  
  // Type de vente
  sale_type: 'in_stock' | 'on_order'; // NOUVEAU
  
  // Stock (si in_stock)
  in_stock: boolean;
  quantity: string;
  low_stock_threshold: string;
  stock_locations: string[]; // NOUVEAU: villes où disponible
  
  // Commande (si on_order)
  order_countries: string[]; // NOUVEAU: pays de livraison
  
  // Catégorie
  main_category: string;
  sub_category: string;
  brand: string;
  
  // Démographie
  gender: string;
  age_group: string;
  
  // Couleurs disponibles
  available_colors: string[]; // NOUVEAU: liste de couleurs
  
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

// NOUVEAUX: Options pour les dropdowns
const COLOR_OPTIONS = [
  'Noir', 'Blanc', 'Rouge', 'Bleu', 'Vert', 'Jaune', 'Orange', 'Violet', 
  'Rose', 'Gris', 'Marron', 'Beige', 'Or', 'Argent', 'Turquoise', 'Marine'
];

const CONGO_CITIES = [
  'Kinshasa', 'Lubumbashi', 'Mbuji-Mayi', 'Kananga', 'Kisangani',
  'Likasi', 'Kolwezi', 'Tshikapa', 'Matadi', 'Boma', 'Bandundu'
];

const AFRICAN_COUNTRIES = [
  'RD Congo', 'Congo-Brazzaville', 'Cameroun', 'Gabon', 'Guinée Équatoriale',
  'Centrafrique', 'Tchad', 'Angola', 'Zambie', 'Burundi', 'Rwanda',
  'Ouganda', 'Kenya', 'Tanzanie', 'Nigeria', 'Ghana', 'Côte d\'Ivoire'
];

export default function AddArticleScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // Multi-step form
  
  // Formulaire
  const [formData, setFormData] = useState<UniversalProductForm>({
    name: '',
    description: '',
    price: '',
    currency: 'XAF',
    
    // NOUVEAU: Type de vente
    sale_type: 'in_stock',
    
    // Stock
    in_stock: true,
    quantity: '1',
    low_stock_threshold: '5',
    stock_locations: ['Kinshasa'], // NOUVEAU
    
    // Commande
    order_countries: ['RD Congo'], // NOUVEAU
    
    // Catégorie
    main_category: '',
    sub_category: '',
    brand: '',
    
    // Démographie
    gender: 'unisex',
    age_group: 'adult',
    
    // NOUVEAU: Couleurs disponibles
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
      formData.main_category
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

  // NOUVEAU: Gestion des couleurs
  const toggleColor = useCallback((color: string) => {
    setFormData(prev => ({
      ...prev,
      available_colors: prev.available_colors.includes(color)
        ? prev.available_colors.filter(c => c !== color)
        : [...prev.available_colors, color]
    }));
  }, []);

  // NOUVEAU: Gestion des villes de stock
  const toggleStockLocation = useCallback((city: string) => {
    setFormData(prev => ({
      ...prev,
      stock_locations: prev.stock_locations.includes(city)
        ? prev.stock_locations.filter(c => c !== city)
        : [...prev.stock_locations, city]
    }));
  }, []);

  // NOUVEAU: Gestion des pays de commande
  const toggleOrderCountry = useCallback((country: string) => {
    setFormData(prev => ({
      ...prev,
      order_countries: prev.order_countries.includes(country)
        ? prev.order_countries.filter(c => c !== country)
        : [...prev.order_countries, country]
    }));
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
        
        stock_management: {
          in_stock: formData.in_stock,
          quantity: parseInt(formData.quantity) || 1,
          low_stock_threshold: parseInt(formData.low_stock_threshold) || 5,
          track_quantity: true
        },
        
        availability: {
          countries: ['RD Congo'],
          cities: [],
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
          images: formData.images.map((url, index) => ({
            url,
            alt: formData.name,
            order: index
          })),
          video: formData.video_url ? {
            url: formData.video_url,
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
        
        attributes: formData.attributes,
        
        marketing: {
          tags: [formData.main_category, formData.brand].filter(Boolean),
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

  // Rendu des attributs selon la catégorie
  const renderCategoryAttributes = () => {
    switch (formData.main_category) {
      case 'phones':
        return (
          <View style={{ gap: SPACING.md }}>
            <AdaptiveText variant="caption" weight="bold" style={{ color: colors.primary }}>Spécifications téléphone</AdaptiveText>
            
            <LiquidGlassCard padding={SPACING.md}>
              <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Taille écran</AdaptiveText>
              <TextInput
                placeholder="ex: 6.7 pouces"
                value={formData.attributes.screen_size || ''}
                onChangeText={(text) => updateAttribute('screen_size', text)}
                style={{ color: colors.text, marginTop: 4 }}
              />
            </LiquidGlassCard>

            <LiquidGlassCard padding={SPACING.md}>
              <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Stockage</AdaptiveText>
              <TextInput
                placeholder="ex: 256GB"
                value={formData.attributes.storage || ''}
                onChangeText={(text) => updateAttribute('storage', text)}
                style={{ color: colors.text, marginTop: 4 }}
              />
            </LiquidGlassCard>

            <LiquidGlassCard padding={SPACING.md}>
              <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>RAM</AdaptiveText>
              <TextInput
                placeholder="ex: 8GB"
                value={formData.attributes.ram || ''}
                onChangeText={(text) => updateAttribute('ram', text)}
                style={{ color: colors.text, marginTop: 4 }}
              />
            </LiquidGlassCard>

            <LiquidGlassCard padding={SPACING.md}>
              <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Couleurs disponibles</AdaptiveText>
              <TextInput
                placeholder="ex: Noir, Blanc, Bleu"
                value={formData.attributes.color_options?.join(', ') || ''}
                onChangeText={(text) => updateAttribute('color_options', text.split(',').map(s => s.trim()))}
                style={{ color: colors.text, marginTop: 4 }}
              />
            </LiquidGlassCard>
          </View>
        );

      case 'clothing':
        return (
          <View style={{ gap: SPACING.md }}>
            <AdaptiveText variant="caption" weight="bold" style={{ color: colors.primary }}>Spécifications vêtements</AdaptiveText>
            
            <LiquidGlassCard padding={SPACING.md}>
              <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Tailles</AdaptiveText>
              <TextInput
                placeholder="ex: S, M, L, XL"
                value={formData.attributes.sizes?.join(', ') || ''}
                onChangeText={(text) => updateAttribute('sizes', text.split(',').map(s => s.trim()))}
                style={{ color: colors.text, marginTop: 4 }}
              />
            </LiquidGlassCard>

            <LiquidGlassCard padding={SPACING.md}>
              <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Couleurs</AdaptiveText>
              <TextInput
                placeholder="ex: Rouge, Bleu, Noir"
                value={formData.attributes.colors?.join(', ') || ''}
                onChangeText={(text) => updateAttribute('colors', text.split(',').map(s => s.trim()))}
                style={{ color: colors.text, marginTop: 4 }}
              />
            </LiquidGlassCard>

            <LiquidGlassCard padding={SPACING.md}>
              <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Matériau</AdaptiveText>
              <TextInput
                placeholder="ex: Coton, Polyester"
                value={formData.attributes.material || ''}
                onChangeText={(text) => updateAttribute('material', text)}
                style={{ color: colors.text, marginTop: 4 }}
              />
            </LiquidGlassCard>
          </View>
        );

      default:
        return (
          <View style={{ gap: SPACING.md }}>
            <AdaptiveText variant="caption" weight="bold" style={{ color: colors.primary }}>Spécifications générales</AdaptiveText>
            
            <LiquidGlassCard padding={SPACING.md}>
              <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Modèle</AdaptiveText>
              <TextInput
                placeholder="Modèle du produit"
                value={formData.attributes.model || ''}
                onChangeText={(text) => updateAttribute('model', text)}
                style={{ color: colors.text, marginTop: 4 }}
              />
            </LiquidGlassCard>

            <LiquidGlassCard padding={SPACING.md}>
              <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Dimensions</AdaptiveText>
              <TextInput
                placeholder="ex: 20x10x5 cm"
                value={formData.attributes.dimensions || ''}
                onChangeText={(text) => updateAttribute('dimensions', text)}
                style={{ color: colors.text, marginTop: 4 }}
              />
            </LiquidGlassCard>

            <LiquidGlassCard padding={SPACING.md}>
              <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Poids</AdaptiveText>
              <TextInput
                placeholder="ex: 500g"
                value={formData.attributes.weight || ''}
                onChangeText={(text) => updateAttribute('weight', text)}
                style={{ color: colors.text, marginTop: 4 }}
              />
            </LiquidGlassCard>
          </View>
        );
    }
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
      }}>

        {/* Étape 1: Informations de base */}
        <LiquidGlassCard padding={SPACING.lg}>
          <AdaptiveText variant="caption" weight="bold" style={{ color: colors.primary, marginBottom: SPACING.md }}>
            📦 Informations de base
          </AdaptiveText>

          <View style={{ gap: SPACING.md }}>
            <View>
              <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Nom du produit *</AdaptiveText>
              <TextInput
                placeholder="Nom du produit"
                value={formData.name}
                onChangeText={(text) => updateField('name', text)}
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

            <View>
              <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Description</AdaptiveText>
              <TextInput
                placeholder="Description détaillée..."
                value={formData.description}
                onChangeText={(text) => updateField('description', text)}
                multiline
                numberOfLines={3}
                style={{ 
                  color: colors.text, 
                  marginTop: 4,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
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
                  placeholder="0"
                  value={formData.price}
                  onChangeText={(text) => updateField('price', text)}
                  keyboardType="numeric"
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
              
              <View style={{ width: 100 }}>
                <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Devise</AdaptiveText>
                <TextInput
                  value={formData.currency}
                  onChangeText={(text) => updateField('currency', text)}
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
            </View>
          </View>
        </LiquidGlassCard>

        {/* Étape 2: Catégorie */}
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
                <TextInput
                  value={formData.gender}
                  onChangeText={(text) => updateField('gender', text)}
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
              
              <View style={{ flex: 1 }}>
                <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Âge</AdaptiveText>
                <TextInput
                  value={formData.age_group}
                  onChangeText={(text) => updateField('age_group', text)}
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
            </View>
          </View>
        </LiquidGlassCard>

        {/* Étape 3: Attributs spécifiques */}
        {formData.main_category && (
          <LiquidGlassCard padding={SPACING.lg}>
            {renderCategoryAttributes()}
          </LiquidGlassCard>
        )}

        {/* Étape 4: Médias */}
        <LiquidGlassCard padding={SPACING.lg}>
          <AdaptiveText variant="caption" weight="bold" style={{ color: colors.primary, marginBottom: SPACING.md }}>
            📸 Médias
          </AdaptiveText>

          <View style={{ gap: SPACING.md }}>
            <Pressable style={{
              borderRadius: 12,
              borderWidth: 2,
              borderColor: colors.border,
              borderStyle: 'dashed',
              padding: SPACING.lg,
              alignItems: 'center',
              gap: SPACING.sm
            }}>
              <Camera size={32} color={colors.textSecondary} />
              <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>
                Ajouter des photos
              </AdaptiveText>
            </Pressable>

            <View>
              <AdaptiveText variant="caption" style={{ color: colors.textSecondary }}>Vidéo (optionnel)</AdaptiveText>
              <TextInput
                placeholder="URL de la vidéo (10-60s)"
                value={formData.video_url}
                onChangeText={(text) => updateField('video_url', text)}
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

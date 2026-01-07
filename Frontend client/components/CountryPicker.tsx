/**
 * SÉLECTEUR DE PAYS - MOSSOMBI
 * Composant pour sélectionner le pays avec drapeau et code
 */

import React, { useState } from 'react';
import { View, Text, Pressable, Modal, FlatList, TextInput } from 'react-native';
import { ChevronDown, Search } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@/constants/colors';

export interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

interface CountryPickerProps {
  selectedCountry: Country;
  onCountrySelect: (country: Country) => void;
  disabled?: boolean;
}

// Liste des pays supportés avec noms multilingues
const COUNTRIES_DATA = [
  { code: 'CG', nameFr: 'Congo', nameEn: 'Congo', dialCode: '+242', flag: '🇨🇬' },
  { code: 'CD', nameFr: 'RD Congo', nameEn: 'DR Congo', dialCode: '+243', flag: '🇨🇩' },
  { code: 'CM', nameFr: 'Cameroun', nameEn: 'Cameroon', dialCode: '+237', flag: '🇨🇲' },
  { code: 'GA', nameFr: 'Gabon', nameEn: 'Gabon', dialCode: '+241', flag: '🇬🇦' },
  { code: 'CF', nameFr: 'Centrafrique', nameEn: 'Central African Republic', dialCode: '+236', flag: '🇨🇫' },
  { code: 'TD', nameFr: 'Tchad', nameEn: 'Chad', dialCode: '+235', flag: '🇹🇩' },
  { code: 'GQ', nameFr: 'Guinée équatoriale', nameEn: 'Equatorial Guinea', dialCode: '+240', flag: '🇬🇶' },
  { code: 'ST', nameFr: 'São Tomé', nameEn: 'São Tomé', dialCode: '+239', flag: '🇸🇹' },
  { code: 'FR', nameFr: 'France', nameEn: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'BE', nameFr: 'Belgique', nameEn: 'Belgium', dialCode: '+32', flag: '🇧🇪' },
  { code: 'CA', nameFr: 'Canada', nameEn: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'US', nameFr: 'États-Unis', nameEn: 'United States', dialCode: '+1', flag: '🇺🇸' },
];

// Fonction pour obtenir la liste des pays avec la langue appropriée
const getCountriesWithLanguage = (language: string): Country[] => {
  return COUNTRIES_DATA.map(country => ({
    code: country.code,
    name: language === 'en' ? country.nameEn : country.nameFr,
    dialCode: country.dialCode,
    flag: country.flag
  }));
};

// Export pour compatibilité (utilise le français par défaut)
const COUNTRIES: Country[] = getCountriesWithLanguage('fr');

export { COUNTRIES, getCountriesWithLanguage };

export default function CountryPicker({ selectedCountry, onCountrySelect, disabled = false }: CountryPickerProps) {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Obtenir la liste des pays dans la langue actuelle
  const countriesInCurrentLanguage = getCountriesWithLanguage(language);

  const filteredCountries = countriesInCurrentLanguage.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.dialCode.includes(searchQuery)
  );

  const handleCountrySelect = (country: Country) => {
    onCountrySelect(country);
    setModalVisible(false);
    setSearchQuery('');
  };

  return (
    <>
      {/* Bouton sélecteur */}
      <Pressable
        onPress={() => !disabled && setModalVisible(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: SPACING.xs,
          paddingVertical: 4,
          opacity: disabled ? 0.6 : 1,
        }}
        disabled={disabled}
      >
        <Text style={{ fontSize: 12, marginRight: 2 }}>
          {selectedCountry.flag}
        </Text>
        <Text style={{ 
          color: colors.text, 
          fontWeight: TYPOGRAPHY.weights.medium,
          marginRight: 2,
          fontSize: 11
        }}>
          {selectedCountry.dialCode}
        </Text>
        <ChevronDown size={12} color={colors.textSecondary} />
      </Pressable>

      {/* Modal de sélection */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ 
          flex: 1, 
          backgroundColor: colors.background,
          paddingTop: SPACING.xl 
        }}>
          {/* Header */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            paddingHorizontal: SPACING.lg,
            paddingBottom: SPACING.lg,
            borderBottomWidth: 1,
            borderBottomColor: colors.border
          }}>
            <Text style={{ 
              fontSize: TYPOGRAPHY.sizes.lg, 
              fontWeight: TYPOGRAPHY.weights.semibold,
              color: colors.text 
            }}>
              {t('selectCountry' as any)}
            </Text>
            <Pressable onPress={() => setModalVisible(false)}>
              <Text style={{ color: colors.primary }}>{t('close' as any)}</Text>
            </Pressable>
          </View>

          {/* Barre de recherche */}
          <View style={{ 
            paddingHorizontal: SPACING.lg, 
            paddingVertical: SPACING.md 
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surface,
              borderRadius: BORDER_RADIUS.md,
              paddingHorizontal: SPACING.md,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
              <Search size={20} color={colors.textSecondary} />
              <TextInput
                style={{
                  flex: 1,
                  paddingVertical: SPACING.sm,
                  paddingHorizontal: SPACING.sm,
                  color: colors.text,
                  fontSize: TYPOGRAPHY.sizes.md,
                }}
                placeholder={t('searchCountry' as any)}
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Liste des pays */}
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleCountrySelect(item)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: SPACING.lg,
                  paddingVertical: SPACING.md,
                  backgroundColor: selectedCountry.code === item.code ? colors.primaryLight : 'transparent',
                }}
              >
                <Text style={{ fontSize: 24, marginRight: SPACING.md }}>
                  {item.flag}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ 
                    color: colors.text,
                    fontWeight: selectedCountry.code === item.code ? TYPOGRAPHY.weights.semibold : TYPOGRAPHY.weights.regular
                  }}>
                    {item.name}
                  </Text>
                  <Text style={{ 
                    color: colors.textSecondary,
                    fontSize: TYPOGRAPHY.sizes.sm
                  }}>
                    {item.dialCode}
                  </Text>
                </View>
                {selectedCountry.code === item.code && (
                  <View style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Text style={{ color: 'white', fontSize: 12 }}>✓</Text>
                  </View>
                )}
              </Pressable>
            )}
            ItemSeparatorComponent={() => (
              <View style={{ 
                height: 1, 
                backgroundColor: colors.border, 
                marginLeft: SPACING.lg + 32 + SPACING.md 
              }} />
            )}
          />
        </View>
      </Modal>
    </>
  );
}

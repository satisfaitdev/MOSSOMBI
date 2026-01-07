/**
 * INPUT TÉLÉPHONE INTELLIGENT - MOSSOMBI
 * Composant avec détection automatique du pays et formatage
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Text, Pressable, Modal, FlatList, ActivityIndicator, Platform } from 'react-native';
import { Check, ChevronDown, X, Loader, Phone, CheckCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@/constants/colors';
import { getCountryInfo } from '@/utils/localization';
import CountryPicker, { COUNTRIES, Country } from './CountryPicker';
import { useAuth } from '@/contexts/AuthContext';

interface PhoneInputProps {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  onCountryChange?: (country: Country) => void;
  onPhoneValidation?: (isValid: boolean, exists: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  countrySelectable?: boolean; // Nouvelle prop pour permettre/interdire la sélection
  mode?: 'register' | 'login'; // Mode pour adapter les messages
}

// Fonction pour détecter le pays automatiquement (version simplifiée)
const detectCountry = (): Country => {
  try {
    // Détection simple basée sur la locale uniquement pour éviter les erreurs
    let locale = '';
    
    if (Platform.OS === 'ios') {
      try {
        locale = require('react-native').NativeModules.SettingsManager?.settings?.AppleLocale || '';
      } catch (e) {
        console.log('iOS locale detection failed');
      }
    } else {
      try {
        locale = require('react-native').NativeModules.I18nManager?.localeIdentifier || '';
      } catch (e) {
        console.log('Android locale detection failed');
      }
    }
    
    // Mapping simple basé sur la locale
    if (locale.toLowerCase().includes('fr')) {
      return COUNTRIES.find(c => c.code === 'FR') || COUNTRIES[0]; // France
    }
    if (locale.toLowerCase().includes('be')) {
      return COUNTRIES.find(c => c.code === 'BE') || COUNTRIES[0]; // Belgique
    }
    if (locale.toLowerCase().includes('ca')) {
      return COUNTRIES.find(c => c.code === 'CA') || COUNTRIES[0]; // Canada
    }
    
  } catch (error) {
    console.log('Erreur détection pays:', error);
  }
  
  // Par défaut : Congo (pays principal de l'app)
  return COUNTRIES.find(c => c.code === 'CG') || COUNTRIES[0];
};

// Fonction pour formater le numéro selon le pays
const formatPhoneNumber = (number: string, country: Country): string => {
  // Supprimer tous les caractères non numériques
  const cleaned = number.replace(/\D/g, '');
  
  switch (country.code) {
    case 'CG': // Congo
    case 'CD': // RD Congo
      // Format: 066 944 205
      if (cleaned.length <= 3) return cleaned;
      if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)}`;
    
    case 'CM': // Cameroun
      // Format: 6 9442 0500
      if (cleaned.length <= 1) return cleaned;
      if (cleaned.length <= 5) return `${cleaned.slice(0, 1)} ${cleaned.slice(1)}`;
      return `${cleaned.slice(0, 1)} ${cleaned.slice(1, 5)} ${cleaned.slice(5, 9)}`;
    
    case 'FR': // France
      // Format: 06 69 44 20 05
      if (cleaned.length <= 2) return cleaned;
      if (cleaned.length <= 4) return `${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
      if (cleaned.length <= 6) return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4)}`;
      if (cleaned.length <= 8) return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6)}`;
      return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
    
    default:
      // Format générique avec espaces tous les 3 chiffres
      return cleaned.replace(/(\d{3})(?=\d)/g, '$1 ');
  }
};

// Fonction pour obtenir le numéro complet international
const getFullPhoneNumber = (localNumber: string, country: Country): string => {
  const cleaned = localNumber.replace(/\D/g, '');
  return `${country.dialCode}${cleaned}`;
};

// Fonction pour obtenir l'exemple de numéro selon le pays
const getPhoneExample = (country: Country): string => {
  switch (country.code) {
    case 'CG': // Congo
      return '06 694 XX XX';
    case 'CD': // RD Congo
      return '081 234 XX XX';
    case 'CM': // Cameroun
      return '6 9442 XXXX';
    case 'GA': // Gabon
      return '06 12 34 XX';
    case 'CF': // Centrafrique
      return '70 12 34 XX';
    case 'TD': // Tchad
      return '66 12 34 XX';
    case 'GQ': // Guinée équatoriale
      return '222 123 XXX';
    case 'ST': // São Tomé
      return '991 23XX';
    case 'FR': // France
      return '06 12 34 56 XX';
    case 'BE': // Belgique
      return '0470 12 34 XX';
    case 'CA': // Canada
    case 'US': // États-Unis
      return '(555) 123-XXXX';
    default:
      return 'XX XXX XXXX';
  }
};

export default function PhoneInput({ 
  label = "Numéro de téléphone", 
  value, 
  onChangeText, 
  onCountryChange,
  onPhoneValidation,
  placeholder = "Entrez votre numéro",
  disabled = false,
  error,
  countrySelectable = true,
  mode = 'register'
}: PhoneInputProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { checkPhoneExists } = useAuth();
  const [selectedCountry, setSelectedCountry] = useState<Country>(() => detectCountry()); // Initialisation directe
  const [localNumber, setLocalNumber] = useState('');
  const [phoneStatus, setPhoneStatus] = useState<'idle' | 'checking' | 'available' | 'exists'>('idle');

  // Notifier le changement de pays initial
  useEffect(() => {
    onCountryChange?.(selectedCountry);
  }, []);

  // Initialiser avec la valeur existante
  useEffect(() => {
    if (value && !localNumber) {
      // Si la valeur commence par un code pays, l'extraire
      const country = COUNTRIES.find(c => value.startsWith(c.dialCode));
      if (country) {
        setSelectedCountry(country);
        const local = value.replace(country.dialCode, '');
        setLocalNumber(formatPhoneNumber(local, country));
      } else {
        setLocalNumber(formatPhoneNumber(value, selectedCountry));
      }
    }
  }, [value]);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    onCountryChange?.(country);
    
    // Reformater le numéro avec le nouveau pays
    const formatted = formatPhoneNumber(localNumber.replace(/\D/g, ''), country);
    setLocalNumber(formatted);
    
    // Mettre à jour la valeur complète
    const fullNumber = getFullPhoneNumber(formatted, country);
    onChangeText(fullNumber);
  };

  // Vérifier le numéro avec debounce
  useEffect(() => {
    if (!localNumber || localNumber.length < 8) {
      setPhoneStatus('idle');
      onPhoneValidation?.(false, false);
      return;
    }

    const fullNumber = getFullPhoneNumber(localNumber, selectedCountry);
    
    // Debounce de 1 seconde
    const timeoutId = setTimeout(async () => {
      setPhoneStatus('checking');
      
      try {
        const result = await checkPhoneExists(fullNumber);
        
        if (result.success) {
          // Un compte existe vraiment seulement s'il est vérifié
          const accountReallyExists = result.exists && result.data?.is_verified;
          
          if (accountReallyExists) {
            setPhoneStatus('exists');
            onPhoneValidation?.(true, true);
          } else {
            setPhoneStatus('available');
            onPhoneValidation?.(true, false);
          }
        } else {
          setPhoneStatus('idle');
          onPhoneValidation?.(false, false);
        }
      } catch (error) {
        console.log('Erreur vérification numéro:', error);
        setPhoneStatus('idle');
        onPhoneValidation?.(false, false);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [localNumber, selectedCountry]);

  const handleNumberChange = (text: string) => {
    // Formater le numéro selon le pays sélectionné
    const formatted = formatPhoneNumber(text, selectedCountry);
    setLocalNumber(formatted);
    
    // Retourner le numéro complet international
    const fullNumber = getFullPhoneNumber(formatted, selectedCountry);
    onChangeText(fullNumber);
  };

  return (
    <View style={{ marginBottom: SPACING.md }}>
      {label && (
        <Text style={{ 
          color: colors.text, 
          marginBottom: SPACING.xs,
          fontWeight: TYPOGRAPHY.weights.medium,
          fontSize: TYPOGRAPHY.sizes.sm
        }}>
          {label}
        </Text>
      )}
      
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: error ? colors.error : colors.border,
        paddingHorizontal: SPACING.md,
        minHeight: 56, // Hauteur fixe pour éviter le redimensionnement
      }}>
        {/* Icône téléphone */}
        <Phone size={20} color={colors.textSecondary} style={{ marginRight: SPACING.sm }} />
        
        {/* Sélecteur de pays - Version compacte ou complète */}
        {countrySelectable ? (
          <CountryPicker
            selectedCountry={selectedCountry}
            onCountrySelect={handleCountrySelect}
            disabled={disabled}
          />
        ) : (
          // Version compacte non-modifiable - TRÈS RÉDUITE
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: SPACING.xs,
            paddingVertical: 2,
          }}>
            <Text style={{ fontSize: 12, marginRight: 2 }}>
              {selectedCountry.flag}
            </Text>
            <Text style={{ 
              color: colors.textSecondary, 
              fontWeight: TYPOGRAPHY.weights.medium,
              fontSize: 11
            }}>
              {selectedCountry.dialCode}
            </Text>
          </View>
        )}
        
        {/* Séparateur - Plus petit */}
        <View style={{
          width: 1,
          height: 20,
          backgroundColor: colors.border,
          marginHorizontal: SPACING.xs,
        }} />
        
        {/* Input du numéro */}
        <TextInput
          style={{
            flex: 1,
            paddingVertical: SPACING.md,
            color: colors.text,
            fontSize: TYPOGRAPHY.sizes.md,
          }}
          value={localNumber}
          onChangeText={handleNumberChange}
          placeholder={getPhoneExample(selectedCountry)}
          placeholderTextColor={colors.textSecondary}
          keyboardType="phone-pad"
          editable={!disabled}
          maxLength={selectedCountry.code === 'FR' ? 14 : 11} // Ajuster selon le pays
        />
        
        {/* Indicateur de statut - Adapté selon le mode */}
        {localNumber.length >= 8 && phoneStatus !== 'checking' && (
          <View style={{ marginLeft: SPACING.sm }}>
            {phoneStatus === 'available' && (
              <CheckCircle 
                size={14} 
                color={mode === 'register' ? (colors.success || '#10B981') : colors.error} 
              />
            )}
            {phoneStatus === 'exists' && (
              <CheckCircle 
                size={14} 
                color={mode === 'register' ? colors.error : (colors.success || '#10B981')} 
              />
            )}
          </View>
        )}
      </View>
      
      {error && (
        <Text style={{ 
          color: colors.error, 
          marginTop: SPACING.xs,
          fontSize: TYPOGRAPHY.sizes.sm
        }}>
          {error}
        </Text>
      )}
      
      {/* Messages d'état selon le statut et le mode */}
      {phoneStatus === 'exists' && (
        <Text style={{ 
          color: mode === 'register' ? colors.error : (colors.success || '#10B981'), 
          marginTop: 4,
          fontSize: TYPOGRAPHY.sizes.xs,
          fontWeight: TYPOGRAPHY.weights.medium
        }}>
          {mode === 'register' 
            ? t('phoneExistsRegister' as any)
            : t('phoneExistsLogin' as any)
          }
        </Text>
      )}
      
      {phoneStatus === 'available' && (
        <Text style={{ 
          color: mode === 'register' ? (colors.success || '#10B981') : colors.error, 
          marginTop: 4,
          fontSize: TYPOGRAPHY.sizes.xs,
          fontWeight: TYPOGRAPHY.weights.medium
        }}>
          {mode === 'register' 
            ? t('phoneAvailableRegister' as any)
            : t('phoneAvailableLogin' as any)
          }
        </Text>
      )}
      
      
      {/* Indication du numéro complet (seulement si pas de message d'état) */}
      {localNumber && phoneStatus === 'idle' && (
        <Text style={{ 
          color: colors.textSecondary, 
          marginTop: SPACING.xs,
          fontStyle: 'italic',
          fontSize: TYPOGRAPHY.sizes.sm
        }}>
          {t('fullPhoneNumber' as any)} {getFullPhoneNumber(localNumber, selectedCountry)}
        </Text>
      )}
    </View>
  );
}

export { getFullPhoneNumber, formatPhoneNumber };

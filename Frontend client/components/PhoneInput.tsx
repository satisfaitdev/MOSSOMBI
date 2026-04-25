/**
 * INPUT TÉLÉPHONE INTELLIGENT - MOSSOMBI
 * Composant avec détection automatique du pays et formatage
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, TextInput, Platform } from 'react-native';
import { Phone, CheckCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@/constants/colors';
import CountryPicker, { COUNTRIES, Country } from './CountryPicker';
import { useAuth } from '@/contexts/AuthContext';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import { GlassContainer } from '@/components/ui/GlassContainer';

interface PhoneInputProps {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  onCountryChange?: (country: Country) => void;
  onPhoneValidation?: (isValid: boolean, exists: boolean, isVerified?: boolean | null) => void;
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
  disabled = false,
  error,
  countrySelectable = true,
  mode = 'register'
}: PhoneInputProps) {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { checkPhoneExists } = useAuth();
  const [selectedCountry, setSelectedCountry] = useState<Country>(() => detectCountry()); // Initialisation directe
  const [localNumber, setLocalNumber] = useState('');
  const [phoneStatus, setPhoneStatus] = useState<'idle' | 'checking' | 'available' | 'exists'>('idle');
  const [isFocused, setIsFocused] = useState(false);
  const checkCacheRef = useRef<
    Map<string, { success: boolean; exists: boolean; isVerified: boolean | null }>
  >(new Map());
  const inFlightRef = useRef<Set<string>>(new Set());
  const lastCheckedRef = useRef<string | null>(null);
  const rateLimitUntilRef = useRef<number>(0);

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
    if (!localNumber || localNumber.length < 9) {
      setPhoneStatus('idle');
      onPhoneValidation?.(false, false, null);
      return;
    }

    const fullNumber = getFullPhoneNumber(localNumber, selectedCountry);
    
    // Debounce de 1 seconde
    const timeoutId = setTimeout(async () => {
      const now = Date.now();
      if (now < rateLimitUntilRef.current) {
        return;
      }

      const cached = checkCacheRef.current.get(fullNumber);
      if (cached) {
        if (cached.success) {
          if (cached.exists) {
            const shouldBlockAsExists = mode === 'register' ? (cached.isVerified !== false) : true;
            setPhoneStatus(shouldBlockAsExists ? 'exists' : 'available');
            onPhoneValidation?.(true, true, cached.isVerified);
          } else {
            setPhoneStatus('available');
            onPhoneValidation?.(true, false, null);
          }
        } else {
          setPhoneStatus('idle');
          onPhoneValidation?.(false, false, null);
        }
        return;
      }

      if (inFlightRef.current.has(fullNumber)) {
        return;
      }

      if (lastCheckedRef.current === fullNumber && phoneStatus !== 'idle') {
        return;
      }

      setPhoneStatus('checking');
      inFlightRef.current.add(fullNumber);
      lastCheckedRef.current = fullNumber;
      
      try {
        const result = await checkPhoneExists(fullNumber);

        console.log('📞 PhoneInput check-phone result:', {
          fullNumber,
          success: result?.success,
          exists: result?.exists,
          data: result?.data,
        });
        
        if (result.success) {
          const accountReallyExists = !!result.exists;
          const isVerified = (result.data as any)?.is_verified ?? null;

          checkCacheRef.current.set(fullNumber, {
            success: true,
            exists: accountReallyExists,
            isVerified,
          });
          
          if (accountReallyExists) {
            // En mode register: on bloque uniquement si le compte existe ET est actif.
            // Si le compte existe mais n'est pas vérifié, on laisse continuer vers la vérification OTP.
            // Important: si is_verified est NULL/undefined (données legacy), on considère le compte comme déjà vérifié.
            const shouldBlockAsExists = mode === 'register' ? (isVerified !== false) : true;
            setPhoneStatus(shouldBlockAsExists ? 'exists' : 'available');
            onPhoneValidation?.(true, true, isVerified);
          } else {
            setPhoneStatus('available');
            onPhoneValidation?.(true, false, null);
          }
        } else {
          const err = (result as any)?.error ? String((result as any).error) : '';
          if (err.toLowerCase().includes('trop de requêtes') || err.toLowerCase().includes('rate_limit')) {
            rateLimitUntilRef.current = Date.now() + 15000;
          }
          checkCacheRef.current.set(fullNumber, { success: false, exists: false, isVerified: null });
          setPhoneStatus('idle');
          onPhoneValidation?.(false, false, null);
        }
      } catch (error) {
        console.log('Erreur vérification numéro:', error);
        checkCacheRef.current.set(fullNumber, { success: false, exists: false, isVerified: null });
        setPhoneStatus('idle');
        onPhoneValidation?.(false, false, null);
      } finally {
        inFlightRef.current.delete(fullNumber);
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
    <View style={{ marginBottom: SPACING.sm }}>
      {label && (
        <AdaptiveText
          variant="body"
          weight="medium"
          color={colors.text}
          style={{
            marginBottom: SPACING.xs,
            fontSize: TYPOGRAPHY.sizes.sm,
          }}
        >
          {label}
        </AdaptiveText>
      )}
      
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.surface,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: Platform.OS === 'ios' ? 1 : (isFocused ? 2 : 1),
        borderColor: error ? colors.error : isFocused ? `${colors.primary}66` : colors.border,
        paddingHorizontal: 0,
        minHeight: 48,
      }}>
        {Platform.OS === 'ios' ? (
          <GlassContainer
            blur={isDark ? 75 : 60}
            tint={isDark ? 'dark' : 'light'}
            opacity={isDark ? 0.04 : 0.08}
            borderRadius={BORDER_RADIUS.lg}
            style={{
              flex: 1,
              paddingHorizontal: SPACING.md,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 48 }}>
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
                  <AdaptiveText
                    variant="caption"
                    weight="regular"
                    style={{ fontSize: 12, marginRight: 2 }}
                  >
                    {selectedCountry.flag}
                  </AdaptiveText>
                  <AdaptiveText
                    variant="caption"
                    weight="medium"
                    color={colors.textSecondary}
                    style={{ fontSize: 11 }}
                  >
                    {selectedCountry.dialCode}
                  </AdaptiveText>
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
                  paddingVertical: SPACING.xs,
                  color: colors.text,
                  fontSize: TYPOGRAPHY.sizes.sm,
                }}
                value={localNumber}
                onChangeText={handleNumberChange}
                placeholder={getPhoneExample(selectedCountry)}
                placeholderTextColor={colors.textTertiary || colors.textSecondary}
                keyboardType="phone-pad"
                editable={!disabled}
                maxLength={selectedCountry.code === 'FR' ? 14 : 11} // Ajuster selon le pays
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
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
          </GlassContainer>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingHorizontal: SPACING.md }}>
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
                <AdaptiveText
                  variant="caption"
                  weight="regular"
                  style={{ fontSize: 12, marginRight: 2 }}
                >
                  {selectedCountry.flag}
                </AdaptiveText>
                <AdaptiveText
                  variant="caption"
                  weight="medium"
                  color={colors.textSecondary}
                  style={{ fontSize: 11 }}
                >
                  {selectedCountry.dialCode}
                </AdaptiveText>
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
              placeholderTextColor={colors.textTertiary || colors.textSecondary}
              keyboardType="phone-pad"
              editable={!disabled}
              maxLength={selectedCountry.code === 'FR' ? 14 : 11} // Ajuster selon le pays
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
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
        )}
      </View>
      
      {error && (
        <AdaptiveText
          variant="caption"
          weight="regular"
          color={colors.error}
          style={{
            marginTop: SPACING.xs,
            fontSize: TYPOGRAPHY.sizes.sm,
          }}
        >
          {error}
        </AdaptiveText>
      )}
      
      {/* Messages d'état selon le statut et le mode */}
      {phoneStatus === 'exists' && (
        <AdaptiveText
          variant="caption"
          weight="medium"
          color={mode === 'register' ? colors.error : (colors.success || '#10B981')}
          style={{
            marginTop: 4,
            fontSize: TYPOGRAPHY.sizes.xs,
          }}
        >
          {mode === 'register' 
            ? t('phoneExistsRegister' as any)
            : t('phoneExistsLogin' as any)
          }
        </AdaptiveText>
      )}
      
      {phoneStatus === 'available' && (
        <AdaptiveText
          variant="caption"
          weight="medium"
          color={mode === 'register' ? (colors.success || '#10B981') : colors.error}
          style={{
            marginTop: 4,
            fontSize: TYPOGRAPHY.sizes.xs,
          }}
        >
          {mode === 'register' 
            ? t('phoneAvailableRegister' as any)
            : t('phoneAvailableLogin' as any)
          }
        </AdaptiveText>
      )}
      
      
      {/* Indication du numéro complet (seulement si pas de message d'état) */}
      {localNumber && phoneStatus === 'idle' && (
        <AdaptiveText
          variant="caption"
          weight="regular"
          color={colors.textSecondary}
          style={{
            marginTop: SPACING.xs,
            fontStyle: 'italic',
            fontSize: TYPOGRAPHY.sizes.sm,
          }}
        >
          {t('fullPhoneNumber' as any)} {getFullPhoneNumber(localNumber, selectedCountry)}
        </AdaptiveText>
      )}
    </View>
  );
}

export { getFullPhoneNumber, formatPhoneNumber };

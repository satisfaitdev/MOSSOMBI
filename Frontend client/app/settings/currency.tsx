/**
 * PAGE PARAMÈTRES DE DEVISE - MOSSOMBI
 * Gestion des préférences de devise et conversion
 */

import React, { useState } from 'react';
import { View, ScrollView, Switch, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, DollarSign, RefreshCw, Info } from 'lucide-react-native';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import Button from '@/components/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRealExchangeRates } from '@/hooks/useRealExchangeRates';
import { updateExchangeRates } from '@/utils/localization';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/colors';
import { Heading, Body, Caption } from '@/components/atoms';
import { Stack, Row } from '@/components/ui';
import { PageContainer } from '@/components/layouts';
import { 
  getSupportedCurrencies, 
  getCurrencyName, 
  formatCurrencyWithConversion,
  convertFromXAF,
  EXCHANGE_RATES 
} from '@/utils/localization';

export default function CurrencySettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { 
    preferences, 
    updatePreferredCurrency, 
    toggleAutoConvert, 
    resetToDefaults,
    getDisplayCurrency 
  } = useUserPreferences();
  
  // Hook pour les taux de change réels
  const { 
    rates, 
    isLoading: ratesLoading, 
    isError: ratesError, 
    lastUpdated, 
    cacheAgeMinutes, 
    refreshRates, 
    isUsingFallback 
  } = useRealExchangeRates();

  const [isUpdating, setIsUpdating] = useState(false);
  const supportedCurrencies = getSupportedCurrencies();
  const currentDisplayCurrency = getDisplayCurrency();

  // Exemple de conversion pour affichage
  const exampleAmount = 1000; // 1,000 XAF pour mieux voir les décimales

  const handleCurrencySelect = async (currencyCode: string) => {
    if (currencyCode === preferences.preferredCurrency) return;
    
    setIsUpdating(true);
    try {
      await updatePreferredCurrency(currencyCode);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour la devise');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAutoConvertToggle = async () => {
    try {
      await toggleAutoConvert();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier ce paramètre');
    }
  };

  const handleResetDefaults = () => {
    Alert.alert(
      'Réinitialiser les paramètres',
      'Voulez-vous restaurer les paramètres de devise par défaut ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Réinitialiser', 
          style: 'destructive',
          onPress: resetToDefaults 
        }
      ]
    );
  };

  // Composant pour les éléments de paramètres
  const SettingCard = ({ children }: { children: React.ReactNode }) => (
    <View style={{
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.lg,
      ...SHADOWS.sm
    }}>
      {children}
    </View>
  );

  // Composant pour les éléments de devise
  const CurrencyItem = ({ currency, isSelected, onPress }: {
    currency: { code: string; name: string; flag: string };
    isSelected: boolean;
    onPress: () => void;
  }) => {
    const convertedAmount = convertFromXAF(exampleAmount, currency.code);
    
    return (
      <Pressable
        onPress={onPress}
        disabled={isUpdating}
        style={({ pressed }) => ({
          backgroundColor: isSelected ? colors.primary : colors.surface,
          borderRadius: BORDER_RADIUS.lg,
          padding: SPACING.lg,
          marginBottom: SPACING.sm,
          borderWidth: 1,
          borderColor: isSelected ? colors.primary : colors.border,
          opacity: pressed ? 0.8 : (isUpdating ? 0.6 : 1),
          ...SHADOWS.sm
        })}
      >
        <Row align="center" spacing="md">
          <View style={{
            width: 40,
            height: 40,
            borderRadius: BORDER_RADIUS.md,
            backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : colors.background,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Body style={{ fontSize: 20 }}>{currency.flag}</Body>
          </View>
          
          <View style={{ flex: 1 }}>
            <Body style={{ 
              fontWeight: TYPOGRAPHY.weights.medium,
              color: isSelected ? '#FFFFFF' : colors.text
            }}>
              {currency.name} ({currency.code})
            </Body>
            <Caption style={{
              color: isSelected ? 'rgba(255,255,255,0.8)' : colors.textSecondary
            }}>
              Exemple : {convertedAmount.toLocaleString()} {currency.code}
            </Caption>
            <Caption style={{ 
              fontSize: 10, 
              color: isSelected ? 'rgba(255,255,255,0.6)' : colors.textSecondary
            }}>
              Taux : 1 XAF = {EXCHANGE_RATES[currency.code]} {currency.code}
            </Caption>
          </View>

          {isSelected && (
            <Check size={20} color="#FFFFFF" />
          )}
        </Row>
      </Pressable>
    );
  };

  return (
    <>
      <HeaderWithBackButton title="Devise & Conversion" />
      <PageContainer>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Stack spacing="lg">
            {/* Conversion automatique */}
            <SettingCard>
              <Row justify="space-between" align="center">
                <View style={{ flex: 1 }}>
                  <Row align="center" spacing="sm">
                    <RefreshCw size={20} color={colors.primary} />
                    <Heading level={4}>Conversion automatique</Heading>
                  </Row>
                  <Caption style={{ marginTop: SPACING.xs }}>
                    Utiliser automatiquement la devise de votre pays
                  </Caption>
                </View>
                <Switch
                  value={preferences.autoConvertCurrency}
                  onValueChange={handleAutoConvertToggle}
                  trackColor={{ false: colors.border, true: colors.primary + '80' }}
                  thumbColor={preferences.autoConvertCurrency ? colors.primary : colors.surface}
                />
              </Row>
            </SettingCard>

            {/* Devise actuelle */}
            <SettingCard>
              <Row align="center" spacing="sm" style={{ marginBottom: SPACING.md }}>
                <DollarSign size={20} color={colors.primary} />
                <Heading level={4}>Devise d'affichage</Heading>
              </Row>
              
              <View style={{
                backgroundColor: colors.primary + '20',
                borderRadius: BORDER_RADIUS.md,
                padding: SPACING.md,
                marginBottom: SPACING.md,
              }}>
                <Body style={{ fontWeight: TYPOGRAPHY.weights.medium }}>
                  Devise actuelle : {getCurrencyName(currentDisplayCurrency)}
                </Body>
                <Caption>
                  Exemple : {formatCurrencyWithConversion(exampleAmount, currentDisplayCurrency, false)}
                </Caption>
              </View>

              {!preferences.autoConvertCurrency && (
                <Caption style={{ color: colors.textSecondary }}>
                  Sélectionnez votre devise préférée ci-dessous
                </Caption>
              )}
            </SettingCard>

            {/* Liste des devises */}
            {!preferences.autoConvertCurrency && (
              <SettingCard>
                <View style={{ marginBottom: SPACING.md }}>
                  <Heading level={4}>Devises disponibles</Heading>
                  <Caption>Choisissez votre devise préférée</Caption>
                </View>

                <Stack spacing="xs">
                  {supportedCurrencies.map((currency) => (
                    <CurrencyItem
                      key={currency.code}
                      currency={currency}
                      isSelected={currency.code === preferences.preferredCurrency}
                      onPress={() => handleCurrencySelect(currency.code)}
                    />
                  ))}
                </Stack>
              </SettingCard>
            )}

            {/* Informations sur les taux réels */}
            <View style={{
              backgroundColor: isUsingFallback ? colors.warning + '20' : colors.success + '20',
              borderRadius: BORDER_RADIUS.lg,
              padding: SPACING.lg,
              ...SHADOWS.sm
            }}>
              <Row align="center" spacing="sm" style={{ marginBottom: SPACING.sm }}>
                <RefreshCw size={20} color={isUsingFallback ? colors.warning : colors.success} />
                <Heading level={4}>Taux de change</Heading>
                {ratesLoading && (
                  <View style={{ marginLeft: SPACING.xs }}>
                    <Caption>🔄</Caption>
                  </View>
                )}
              </Row>
              
              <Caption style={{ lineHeight: 18, marginBottom: SPACING.sm }}>
                {isUsingFallback 
                  ? '⚠️ Taux de fallback utilisés (API indisponible)'
                  : '✅ Taux réels récupérés depuis l\'API'
                }
              </Caption>
              
              {lastUpdated && (
                <Caption style={{ color: colors.textSecondary, marginBottom: SPACING.sm }}>
                  Dernière mise à jour: {lastUpdated.toLocaleTimeString('fr-FR')}
                  {cacheAgeMinutes !== null && ` (il y a ${cacheAgeMinutes} min)`}
                </Caption>
              )}
              
              <Row spacing="sm" style={{ marginTop: SPACING.sm }}>
                <Pressable
                  onPress={refreshRates}
                  disabled={ratesLoading}
                  style={({ pressed }) => ({
                    backgroundColor: colors.primary + (pressed ? '40' : '20'),
                    borderRadius: BORDER_RADIUS.md,
                    paddingHorizontal: SPACING.sm,
                    paddingVertical: SPACING.xs,
                    opacity: ratesLoading ? 0.6 : 1,
                  })}
                >
                  <Caption style={{ color: colors.primary, fontWeight: TYPOGRAPHY.weights.medium }}>
                    {ratesLoading ? '🔄 Actualisation...' : '🔄 Actualiser'}
                  </Caption>
                </Pressable>
              </Row>
            </View>

            {/* Informations sur la conversion */}
            <View style={{
              backgroundColor: colors.accent + '20',
              borderRadius: BORDER_RADIUS.lg,
              padding: SPACING.lg,
              ...SHADOWS.sm
            }}>
              <Row align="center" spacing="sm" style={{ marginBottom: SPACING.sm }}>
                <Info size={20} color={colors.accent} />
                <Heading level={4}>À propos des conversions</Heading>
              </Row>
              <Caption style={{ lineHeight: 18 }}>
                • Tous les soldes sont stockés en XAF (Franc CFA) dans la base de données{'\n'}
                • Les conversions utilisent des taux de change réels{'\n'}
                • Les taux sont mis à jour automatiquement (cache 1h){'\n'}
                • La conversion automatique utilise la devise de votre pays
              </Caption>
            </View>

            {/* Bouton de réinitialisation */}
            <Button
              title="Réinitialiser aux paramètres par défaut"
              onPress={handleResetDefaults}
              variant="outline"
              fullWidth
            />
          </Stack>
        </ScrollView>
      </PageContainer>
    </>
  );
}

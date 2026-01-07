import React from 'react';
import { View, Pressable } from 'react-native';
import { Globe, Check } from 'lucide-react-native';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/colors';
import { Heading, Body, Caption } from '@/components/atoms';
import { Stack, Row } from '@/components/ui';
import { PageContainer } from '@/components/layouts';
import { useSuccessModal } from '@/hooks';
import { SuccessModal } from '@/components/organisms/modals';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export default function LanguageScreen() {
  const { colors } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const successModal = useSuccessModal({ autoClose: true });

  const languages: Language[] = [
    { code: 'fr', name: 'Français', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
    { code: 'ln', name: 'Lingala', nativeName: 'Lingála', flag: '🇨🇩' },
    { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇨🇩' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  ];

  const handleSelectLanguage = async (code: string) => {
    if (code === 'fr' || code === 'en') {
      await setLanguage(code);
      const selectedLang = languages.find(l => l.code === code);
      successModal.show({
        title: t('success'),
        message: `${t('language')} ${selectedLang?.name}`,
        animation: 'checkmark',
      });
    } else {
      // Pour les autres langues pas encore implémentées
      successModal.show({
        title: 'Bientôt disponible',
        message: 'Cette langue sera bientôt disponible',
        animation: 'checkmark',
      });
    }
  };

  return (
    <>
      <HeaderWithBackButton title="Langue" />
      <PageContainer>
        <Stack spacing="lg">
          {/* En-tête */}
          <View style={{ backgroundColor: colors.primary + '10', borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: colors.primary + '30' }}>
            <Row spacing="sm" align="flex-start">
              <Globe size={20} color={colors.primary} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold, color: colors.primary, marginBottom: SPACING.xs }}>
                  Choisissez votre langue
                </Body>
                <Caption>
                  L&apos;application sera traduite dans la langue sélectionnée.
                </Caption>
              </View>
            </Row>
          </View>

          {/* Liste des langues */}
          <View>
            <Heading level={3} style={{ marginBottom: SPACING.md }}>Langues disponibles</Heading>
            <Stack spacing="sm">
              {languages.map((lang) => {
                const isSelected = language === lang.code;
                
                return (
                  <Pressable
                    key={lang.code}
                    onPress={() => handleSelectLanguage(lang.code)}
                    style={({ pressed }) => ({
                      backgroundColor: isSelected ? colors.primary + '10' : colors.card,
                      borderRadius: BORDER_RADIUS.lg,
                      padding: SPACING.md,
                      borderWidth: isSelected ? 2 : 1,
                      borderColor: isSelected ? colors.primary : colors.border,
                      opacity: pressed ? 0.7 : 1,
                      ...SHADOWS.sm,
                    })}
                  >
                    <Row justify="space-between" align="center">
                      <Row spacing="md" align="center" style={{ flex: 1 }}>
                        <View style={{ width: 48, height: 48, backgroundColor: colors.surface, borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center' }}>
                          <Body style={{ fontSize: TYPOGRAPHY.sizes.xxl }}>
                            {lang.flag}
                          </Body>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold, color: isSelected ? colors.primary : colors.text }}>
                            {lang.name}
                          </Body>
                          <Caption>{lang.nativeName}</Caption>
                        </View>
                      </Row>
                      {isSelected && (
                        <View style={{ width: 24, height: 24, backgroundColor: colors.primary, borderRadius: BORDER_RADIUS.full, alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={16} color="#FFFFFF" />
                        </View>
                      )}
                    </Row>
                  </Pressable>
                );
              })}
            </Stack>
          </View>

          {/* Informations supplémentaires */}
          <View style={{ backgroundColor: colors.accent + '10', borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: colors.accent + '30' }}>
            <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold, color: colors.accent, marginBottom: SPACING.xs }}>
              Traduction automatique
            </Body>
            <Caption>
              Certaines sections peuvent ne pas être entièrement traduites. Nous travaillons constamment à améliorer la traduction.
            </Caption>
          </View>

          {/* Demander une langue */}
          <Pressable
            style={({ pressed }) => ({
              backgroundColor: colors.card,
              borderRadius: BORDER_RADIUS.lg,
              padding: SPACING.md,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              opacity: pressed ? 0.7 : 1,
              ...SHADOWS.sm,
            })}
          >
            <Body style={{ color: colors.primary, fontWeight: TYPOGRAPHY.weights.semibold }}>
              Demander une nouvelle langue
            </Body>
          </Pressable>
        </Stack>
      </PageContainer>

      <SuccessModal {...successModal.props} />
    </>
  );
}

import React from 'react';
import { View, Pressable, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, Globe, Lock, Eye, Smartphone, DollarSign } from 'lucide-react-native';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePrivacySettings } from '@/hooks/usePrivacySettings';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/colors';
import { Heading, Body, Caption } from '@/components/atoms';
import { Stack, Row } from '@/components/ui';
import PageContainer from '@/components/layouts/PageContainer';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const { settings, updateSetting } = usePrivacySettings();

  const SettingItem = ({ icon, title, description, value, onValueChange }: any) => (
    <View style={{ backgroundColor: colors.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: colors.border, ...SHADOWS.sm }}>
      <Row justify="space-between" align="center">
        <Row spacing="md" align="center" style={{ flex: 1 }}>
          <View style={{ width: 40, height: 40, backgroundColor: colors.primary + '20', borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </View>
          <View style={{ flex: 1 }}>
            <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold }}>{title}</Body>
            {description && <Caption style={{ marginTop: SPACING.xs / 2 }}>{description}</Caption>}
          </View>
        </Row>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.border, true: colors.primary + '80' }}
          thumbColor={value ? colors.primary : colors.surface}
        />
      </Row>
    </View>
  );

  const SettingButton = ({ icon, title, description, onPress }: any) => (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <View style={{ backgroundColor: colors.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: colors.border, ...SHADOWS.sm }}>
        <Row spacing="md" align="center">
          <View style={{ width: 40, height: 40, backgroundColor: colors.primary + '20', borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </View>
          <View style={{ flex: 1 }}>
            <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold }}>{title}</Body>
            {description && <Caption style={{ marginTop: SPACING.xs / 2 }}>{description}</Caption>}
          </View>
        </Row>
      </View>
    </Pressable>
  );

  return (
    <>
      <HeaderWithBackButton title={t('settings')} />
      <PageContainer>
          <Stack spacing="xl">
            {/* Notifications */}
            <View>
              <Heading level={3} style={{ marginBottom: SPACING.md }}>{t('notifications')}</Heading>
              <Stack spacing="sm">
                <SettingItem
                  icon={<Bell size={20} color={colors.primary} />}
                  title={t('pushNotifications' as any)}
                  description={t('pushNotificationsDesc' as any)}
                  value={settings.pushNotifications}
                  onValueChange={(value: boolean) => updateSetting('pushNotifications', value)}
                />
                <SettingItem
                  icon={<Bell size={20} color={colors.primary} />}
                  title={t('emailNotifications' as any)}
                  description={t('emailNotificationsDesc' as any)}
                  value={settings.emailNotifications}
                  onValueChange={(value: boolean) => updateSetting('emailNotifications', value)}
                />
                <SettingItem
                  icon={<Smartphone size={20} color={colors.primary} />}
                  title={t('smsNotifications' as any)}
                  description={t('smsNotificationsDesc' as any)}
                  value={settings.smsNotifications}
                  onValueChange={(value: boolean) => updateSetting('smsNotifications', value)}
                />
              </Stack>
            </View>

            {/* Note: Section Son et vibration supprimée - gérée par le système du téléphone */}

            {/* Sécurité */}
            <View>
              <Heading level={3} style={{ marginBottom: SPACING.md }}>{t('securitySettings' as any)}</Heading>
              <Stack spacing="sm">
                <SettingItem
                  icon={<Lock size={20} color={colors.primary} />}
                  title={t('biometricAuth' as any)}
                  description={t('biometricAuthDesc' as any)}
                  value={settings.biometricAuth}
                  onValueChange={(value: boolean) => updateSetting('biometricAuth', value)}
                />
                <SettingButton
                  icon={<Eye size={20} color={colors.primary} />}
                  title={t('privacySetting' as any)}
                  description={t('privacyDesc' as any)}
                  onPress={() => router.push('/privacy' as any)}
                />
              </Stack>
            </View>

            {/* Préférences */}
            <View>
              <Heading level={3} style={{ marginBottom: SPACING.md }}>{t('preferences')}</Heading>
              <Stack spacing="sm">
                <SettingButton
                  icon={<DollarSign size={20} color={colors.primary} />}
                  title={t('currencyConversion')}
                  description={t('manageCurrencyPrefs')}
                  onPress={() => router.push('/settings/currency' as any)}
                />
                <SettingButton
                  icon={<Globe size={20} color={colors.primary} />}
                  title={t('language' as any)}
                  description={t('changeLanguage' as any)}
                  onPress={() => router.push('/language' as any)}
                />
              </Stack>
            </View>

            {/* Section Tests supprimée - Pages de test accessibles directement en développement */}
          </Stack>
      </PageContainer>
    </>
  );
}

import React from 'react';
import { View, Linking } from 'react-native';
import { MessageCircle, Phone, Mail, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/colors';
import { Heading, Body, Caption } from '@/components/atoms';
import { Stack, Row } from '@/components/ui';
import { PageContainer, ContentCard } from '@/components/layouts';
import AuthPageLayout from '@/components/layouts/AuthPageLayout';

export default function AuthHelpScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const ContactOption = ({ icon, title, description, onPress }: any) => (
    <ContentCard onPress={onPress}>
      <Row justify="space-between" align="center">
        <Row spacing="md" align="center" style={{ flex: 1 }}>
          <View style={{ width: 48, height: 48, backgroundColor: colors.primary + '20', borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </View>
          <View style={{ flex: 1 }}>
            <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold }}>{title}</Body>
            <Caption style={{ marginTop: SPACING.xs / 2 }}>{description}</Caption>
          </View>
        </Row>
        <ChevronRight size={20} color={colors.textTertiary} />
      </Row>
    </ContentCard>
  );

  const quickSolutions = [
    {
      problem: t('accountDeleted' as any),
      solution: t('accountDeletedSolution' as any),
    },
    {
      problem: t('noOtpReceived' as any),
      solution: t('noOtpSolution' as any),
    },
    {
      problem: t('forgotPasswordHelp' as any),
      solution: t('forgotPasswordSolution' as any),
    },
    {
      problem: t('connectionProblem' as any),
      solution: t('connectionSolution' as any),
    },
  ];

  return (
    <AuthPageLayout title={t('helpSupport' as any)}>
      <PageContainer style={{ backgroundColor: 'transparent' }}>
          <Stack spacing="xl">
            {/* Contact rapide */}
            <View>
              <Heading level={3} style={{ marginBottom: SPACING.md }}>{t('contactQuickly' as any)}</Heading>
              <Stack spacing="sm">
                <ContactOption
                  icon={<Phone size={24} color={colors.primary} />}
                  title={t('telephone' as any)}
                  description="+242 06 694 42 00"
                  onPress={() => Linking.openURL('tel:+242066944200')}
                />
                <ContactOption
                  icon={<Mail size={24} color={colors.primary} />}
                  title={t('email' as any)}
                  description="support@mossombi.com"
                  onPress={() => Linking.openURL('mailto:support@mossombi.com?subject=Support Mossombi - Problème de connexion&body=Bonjour,%0A%0AJe rencontre un problème de connexion :%0A%0A[Décrivez votre problème ici]%0A%0ACordialement')}
                />
                <ContactOption
                  icon={<MessageCircle size={24} color={colors.primary} />}
                  title={t('whatsapp' as any)}
                  description={t('directMessage' as any)}
                  onPress={() => Linking.openURL('https://wa.me/242066944200?text=Bonjour, j\'ai besoin d\'aide avec mon compte Mossombi')}
                />
              </Stack>
            </View>

            {/* Solutions rapides */}
            <View>
              <Heading level={3} style={{ marginBottom: SPACING.md }}>{t('quickSolutions' as any)}</Heading>
              <Stack spacing="sm">
                {quickSolutions.map((item, index) => (
                  <View key={index} style={{ 
                    backgroundColor: colors.card, 
                    borderRadius: BORDER_RADIUS.lg, 
                    padding: SPACING.md, 
                    borderWidth: 1, 
                    borderColor: colors.border,
                    ...SHADOWS.sm 
                  }}>
                    <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold, marginBottom: SPACING.xs }}>
                      {item.problem}
                    </Body>
                    <Caption style={{ color: colors.textSecondary }}>
                      {item.solution}
                    </Caption>
                  </View>
                ))}
              </Stack>
            </View>

            {/* Informations supplémentaires */}
            <View style={{ 
              backgroundColor: colors.primary + '10', 
              borderRadius: BORDER_RADIUS.lg, 
              padding: SPACING.md, 
              borderWidth: 1, 
              borderColor: colors.primary + '30' 
            }}>
              <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold, marginBottom: SPACING.xs }}>
                {t('support24h' as any)}
              </Body>
              <Caption>
                {t('supportDescription' as any)}
              </Caption>
            </View>
          </Stack>
      </PageContainer>
    </AuthPageLayout>
  );
}

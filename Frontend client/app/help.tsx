import React from 'react';
import { View, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { MessageCircle, Phone, Mail, FileText, ChevronRight, Send } from 'lucide-react-native';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/colors';
import { Heading, Body, Caption } from '@/components/atoms';
import { Stack, Row } from '@/components/ui';
import { PageContainer, ContentCard } from '@/components/layouts';
import { useSuccessModal } from '@/hooks';
import { useFormState, useToggleState } from '@/hooks/useCommonState';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { SuccessModal } from '@/components/organisms/modals';
import GradientBackground from '@/components/atoms/GradientBackground';

export default function HelpScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  
  // Migration Phase 3 : Utilise useFormState unifié
  const form = useFormState({ message: '' });
  const successModal = useSuccessModal({ autoClose: true });

  const handleSendMessage = async () => {
    if (form.values.message.trim()) {
      try {
        // Simuler l'envoi du message (en production, envoyer à l'API)
        console.log('📧 Message de support envoyé:', form.values.message);
        
        // En production, vous pourriez envoyer à votre API de support :
        // await apiService.sendSupportMessage(form.values.message);
        
        successModal.show({
          title: 'Message envoyé ! ✅',
          message: 'Notre équipe vous répondra par email sous 24h. Vous pouvez aussi nous appeler au +242 06 694 42 00 pour une réponse immédiate.',
          animation: 'checkmark',
        });
        form.reset();
      } catch (error) {
        console.error('Erreur envoi message support:', error);
        // Fallback : ouvrir l'email
        const emailBody = encodeURIComponent(`Bonjour,\n\n${form.values.message}\n\nCordialement`);
        const emailUrl = `mailto:support@mossombi.com?subject=Support Mossombi - Demande d'aide&body=${emailBody}`;
        await Linking.openURL(emailUrl);
      }
    }
  };

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

  const FAQItem = ({ question, answer }: any) => {
    const expanded = useToggleState(false);
    
    return (
      <Pressable onPress={expanded.toggle}>
        <View style={{ backgroundColor: colors.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: colors.border, ...SHADOWS.sm }}>
          <Row justify="space-between" align="center">
            <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold, flex: 1 }}>{question}</Body>
            <ChevronRight 
              size={20} 
              color={colors.textTertiary} 
              style={{ transform: [{ rotate: expanded.value ? '90deg' : '0deg' }] }}
            />
          </Row>
          {expanded.value && (
            <Caption style={{ marginTop: SPACING.sm, color: colors.textSecondary }}>
              {answer}
            </Caption>
          )}
        </View>
      </Pressable>
    );
  };

  const faqs = [
    {
      question: '🔒 Mon compte a été supprimé, que faire ?',
      answer: 'Si votre compte a été supprimé par erreur, contactez-nous immédiatement au +242 06 694 42 00 ou par email à support@mossombi.com avec vos informations (nom, numéro de téléphone). Nous pourrons récupérer votre compte dans les 30 jours suivant la suppression.',
    },
    {
      question: 'Comment recharger mon portefeuille ?',
      answer: 'Allez dans l\'onglet Wallet, cliquez sur "Recharger" et choisissez votre méthode de paiement préférée (Mobile Money, Carte bancaire, etc.).',
    },
    {
      question: 'Je ne reçois pas mon code OTP WhatsApp',
      answer: 'Vérifiez que votre numéro WhatsApp est correct et que vous avez une connexion internet. Le code arrive généralement en quelques secondes. Si le problème persiste, contactez-nous.',
    },
    {
      question: 'Comment acheter des coins ?',
      answer: 'Rendez-vous dans la section "Marché des coins", sélectionnez le pack qui vous convient et suivez les instructions de paiement.',
    },
    {
      question: 'Mes transactions sont-elles sécurisées ?',
      answer: 'Oui, toutes les transactions sont cryptées et sécurisées. Nous utilisons les dernières technologies de sécurité pour protéger vos données.',
    },
    {
      question: 'Comment contacter le support ?',
      answer: 'Vous pouvez nous contacter par chat, téléphone (+242 06 694 42 00), email (support@mossombi.com) ou via le formulaire ci-dessous. Notre équipe est disponible 24/7.',
    },
    {
      question: 'Quels sont les frais de transaction ?',
      answer: 'Les frais varient selon le type de service. Consultez la page de chaque service pour voir les frais applicables.',
    },
  ];

  return (
    <GradientBackground style={{ flex: 1 }} opacity="10">
      <HeaderWithBackButton title="Aide & Support" />
      <PageContainer style={{ backgroundColor: 'transparent' }}>
        <Stack spacing="xl">
            {/* Contact rapide */}
            <View>
              <Heading level={3} style={{ marginBottom: SPACING.md }}>Contactez-nous</Heading>
              <Stack spacing="sm">
                <ContactOption
                  icon={<MessageCircle size={24} color={colors.primary} />}
                  title="Chat en direct"
                  description="Réponse immédiate"
                  onPress={() => router.push('/chat' as any)}
                />
                <ContactOption
                  icon={<Phone size={24} color={colors.primary} />}
                  title="Téléphone"
                  description="+242 06 694 42 00"
                  onPress={() => Linking.openURL('tel:+242066944200')}
                />
                <ContactOption
                  icon={<Mail size={24} color={colors.primary} />}
                  title="Email"
                  description="support@mossombi.com"
                  onPress={() => Linking.openURL('mailto:support@mossombi.com?subject=Support Mossombi - Demande d\'aide&body=Bonjour,%0A%0AJe vous contacte concernant :%0A%0A[Décrivez votre problème ici]%0A%0ACordialement')}
                />
                <ContactOption
                  icon={<FileText size={24} color={colors.primary} />}
                  title="Centre d'aide"
                  description="Documentation et guides"
                  onPress={() => router.push('/help-center' as any)}
                />
              </Stack>
            </View>

            {/* FAQ */}
            <View>
              <Heading level={3} style={{ marginBottom: SPACING.md }}>Questions fréquentes</Heading>
              <Stack spacing="sm">
                {faqs.map((faq, index) => (
                  <FAQItem key={index} question={faq.question} answer={faq.answer} />
                ))}
              </Stack>
            </View>

            {/* Formulaire de contact */}
            <View>
              <Heading level={3} style={{ marginBottom: SPACING.md }}>Envoyez-nous un message</Heading>
              <Stack spacing="md">
                <Input
                  label="Votre message"
                  value={form.values.message}
                  onChangeText={(text) => form.setValue('message', text)}
                  placeholder="Décrivez votre problème ou question..."
                  multiline
                  numberOfLines={5}
                  variant="textarea"
                />
                <Button
                  title="Envoyer"
                  onPress={handleSendMessage}
                  variant="gradient"
                  size="lg"
                  fullWidth
                  icon={<Send size={20} color="#FFFFFF" />}
                  disabled={!form.values.message.trim()}
                />
              </Stack>
            </View>

            {/* Informations supplémentaires */}
            <View style={{ backgroundColor: colors.primary + '10', borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: colors.primary + '30' }}>
              <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold, marginBottom: SPACING.xs }}>
                Horaires du support
              </Body>
              <Caption>
                Notre équipe est disponible 24h/24 et 7j/7 pour répondre à toutes vos questions.
              </Caption>
            </View>
        </Stack>
      </PageContainer>

      <SuccessModal {...successModal.props} />
    </GradientBackground>
  );
}

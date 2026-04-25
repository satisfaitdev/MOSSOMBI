import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CreditCard, Eye, EyeOff, Copy, Lock, Calendar, DollarSign } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/colors';
import { Heading, Body, Caption } from '@/components/atoms';
import { Section, Stack, Row } from '@/components/ui';
import { PageContainer } from '@/components/layouts';
import { useSuccessModal } from '@/hooks';
import { SuccessModal } from '@/components/organisms/modals';
import Button from '@/components/Button';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import GradientBackground from '@/components/atoms/GradientBackground';

export default function VirtualCardScreen() {
  const { colors } = useTheme();
  const [showDetails, setShowDetails] = useState(false);
  const successModal = useSuccessModal({ autoClose: true });
  const cardNumber = '**** **** **** 4892';
  const cvv = '***';
  const expiryDate = '12/26';

  const handleCreate = () => {
    successModal.show({
      title: 'Rechargement réussi !',
      message: 'Votre carte a été rechargée',
      animation: 'checkmark',
    });
  };

  return (
    <GradientBackground style={{ flex: 1 }} opacity="10">
      <HeaderWithBackButton title="Carte virtuelle" />
      <PageContainer style={{ backgroundColor: 'transparent' }}>
        <Stack spacing="lg">
          <View>
            <Heading level={2}>Ma carte virtuelle</Heading>
            <Body variant="secondary">Payez en ligne en toute sécurité</Body>
          </View>

          <View style={{ backgroundColor: colors.primary, borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl, minHeight: 200 }}>
            <Stack spacing="lg">
              <Row justify="space-between" align="flex-start">
                <CreditCard size={40} color="#FFFFFF" />
                <Caption style={{ color: '#FFFFFF' }}>Mossombi Card</Caption>
              </Row>
              <View>
                <Caption style={{ color: '#FFFFFF', opacity: 0.8 }}>Numéro de carte</Caption>
                <Heading level={3} style={{ color: '#FFFFFF' }}>{showDetails ? '4532 1234 5678 4892' : cardNumber}</Heading>
              </View>
              <Row justify="space-between">
                <View>
                  <Caption style={{ color: '#FFFFFF', opacity: 0.8 }}>Expire</Caption>
                  <Body style={{ color: '#FFFFFF' }}>{expiryDate}</Body>
                </View>
                <View>
                  <Caption style={{ color: '#FFFFFF', opacity: 0.8 }}>CVV</Caption>
                  <Body style={{ color: '#FFFFFF' }}>{showDetails ? '123' : cvv}</Body>
                </View>
              </Row>
            </Stack>
          </View>

          <Button title={showDetails ? "Masquer" : "Voir les détails"} onPress={() => setShowDetails(!showDetails)} variant="outline" size="md" fullWidth icon={showDetails ? <EyeOff size={20} /> : <Eye size={20} />} />

          <Section variant="elevated">
            <Stack spacing="sm">
              <Heading level={4}>Fonctionnalités</Heading>
              <Body>• Paiements en ligne sécurisés</Body>
              <Body>• Valable dans le monde entier</Body>
              <Body>• Contrôle total de vos dépenses</Body>
              <Body>• Bloquer/Débloquer instantanément</Body>
            </Stack>
          </Section>

          <Stack spacing="sm">
            <Button title="Recharger la carte" onPress={handleCreate} variant="gradient" size="lg" fullWidth />
            <Button title="Bloquer temporairement" variant="danger" size="md" fullWidth />
          </Stack>
        </Stack>
      </PageContainer>
      <SuccessModal {...successModal.props} />
    </GradientBackground>
  );
}

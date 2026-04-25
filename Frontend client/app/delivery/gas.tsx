import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { MapPin, Phone, Fuel, User } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, TYPOGRAPHY } from '@/constants/colors';
import { Heading, Body, Caption } from '@/components/atoms';
import { Section, Stack, Row } from '@/components/ui';
import { Stepper } from '@/components/molecules';
import PageContainer from '@/components/layouts/PageContainer';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import { useSuccessModal } from '@/hooks';
import { SuccessModal } from '@/components/organisms/modals';
import Button from '@/components/Button';
import Input from '@/components/Input';
import GradientBackground from '@/components/atoms/GradientBackground';

const GAS_SIZES = [
  { id: '6kg', name: 'Bouteille 6kg', price: 12000 },
  { id: '12kg', name: 'Bouteille 12kg', price: 23000 },
  { id: '25kg', name: 'Bouteille 25kg', price: 45000 },
  { id: '50kg', name: 'Bouteille 50kg', price: 85000 },
];

const steps = [
  { id: 0, title: 'Choix bouteille' },
  { id: 1, title: 'Adresse' },
  { id: 2, title: 'Contact' },
  { id: 3, title: 'Récapitulatif' },
];

export default function GasScreen() {
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [gasSize, setGasSize] = useState('');
  const [address, setAddress] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const successModal = useSuccessModal({ autoClose: true, navigateBack: true });

  const canProceed = () => {
    if (currentStep === 0) return gasSize !== '';
    if (currentStep === 1) return address !== '';
    if (currentStep === 2) return contactName !== '' && contactPhone !== '';
    return true;
  };

  const handleNext = () => currentStep < 3 && setCurrentStep(currentStep + 1);
  const handlePrevious = () => currentStep > 0 && setCurrentStep(currentStep - 1);

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      handleConfirm();
    }, 1500);
  };

  const handleConfirm = () => {
    successModal.show({
      title: 'Commande confirmée !',
      message: 'Votre bouteille de gaz est en route',
      animation: 'confetti',
    });
  };

  const selected = GAS_SIZES.find(g => g.id === gasSize);

  return (
    <GradientBackground style={{ flex: 1 }} opacity="10">
      <HeaderWithBackButton title="Livraison de gaz" />
      <PageContainer scrollable={false} style={{ backgroundColor: 'transparent' }}>
        <View style={{ flex: 1, paddingBottom: 100 }}>
          <Stack spacing="lg">
            <Stepper steps={steps} currentStep={currentStep} showProgressBar />

            {currentStep === 0 && (
              <Stack spacing="md">
                <Heading level={3}>Choisissez votre bouteille</Heading>
                {GAS_SIZES.map((g) => (
                  <Pressable key={g.id} onPress={() => setGasSize(g.id)}>
                    <Section variant={gasSize === g.id ? 'elevated' : 'outlined'} style={{ borderColor: gasSize === g.id ? colors.primary : colors.border, borderWidth: 2 }}>
                      <Row justify="space-between" align="center">
                        <Row spacing="sm" align="center">
                          <Fuel size={20} color={colors.textSecondary} />
                          <Body style={{ fontSize: TYPOGRAPHY.sizes.md }}>{g.name}</Body>
                        </Row>
                        <Body style={{ fontWeight: TYPOGRAPHY.weights.bold, color: colors.primary }}>{g.price.toLocaleString()} CDF</Body>
                      </Row>
                    </Section>
                  </Pressable>
                ))}
              </Stack>
            )}

            {currentStep === 1 && (
              <Stack spacing="md">
                <Heading level={3}>Adresse de livraison</Heading>
                <Input label="Adresse complète" placeholder="Ex: Avenue de la Paix, Gombe" value={address} onChangeText={setAddress} icon={<MapPin size={20} color={colors.textSecondary} />} multiline />
              </Stack>
            )}

            {currentStep === 2 && (
              <Stack spacing="md">
                <Heading level={3}>Contact sur place</Heading>
                <Input label="Nom complet" placeholder="Nom du contact" value={contactName} onChangeText={setContactName} icon={<User size={20} color={colors.textSecondary} />} />
                <Input label="Téléphone" placeholder="+243 XXX XXX XXX" value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" icon={<Phone size={20} color={colors.textSecondary} />} />
              </Stack>
            )}

            {currentStep === 3 && (
              <Stack spacing="md">
                <Heading level={3}>Récapitulatif</Heading>
                <Section variant="outlined">
                  <Stack spacing="sm">
                    <Row justify="space-between"><Caption>Bouteille:</Caption><Body>{selected?.name}</Body></Row>
                    <Row justify="space-between"><Caption>Adresse:</Caption><Body numberOfLines={2}>{address}</Body></Row>
                    <Row justify="space-between"><Caption>Contact:</Caption><Body>{contactName}</Body></Row>
                    <Row justify="space-between"><Caption>Téléphone:</Caption><Body>{contactPhone}</Body></Row>
                    <Row justify="space-between"><Heading level={4}>Total:</Heading><Heading level={4}>{selected?.price.toLocaleString()} CDF</Heading></Row>
                  </Stack>
                </Section>
                <Caption>Livraison estimée: 2-4h</Caption>
              </Stack>
            )}
          </Stack>
        </View>

        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.card, padding: SPACING.lg, borderTopWidth: 1, borderTopColor: colors.border }}>
          <Row spacing="md">
            {currentStep > 0 && <Button title="Retour" onPress={handlePrevious} variant="outline" style={{ flex: 1 }} />}
            {currentStep < 3 ? (
              <Button title="Suivant" onPress={handleNext} variant="primary" disabled={!canProceed()} style={{ flex: 1 }} />
            ) : (
              <Button title="Confirmer" onPress={handleSubmit} variant="success" loading={loading} style={{ flex: 1 }} />
            )}
          </Row>
        </View>
      </PageContainer>
      <SuccessModal {...successModal.props} />
    </GradientBackground>
  );
}

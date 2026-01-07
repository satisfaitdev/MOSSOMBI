import React, { useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { MapPin, Phone, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
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

const PACKAGE_TYPES = [
  { id: 'small', name: 'Petit Colis', subtitle: '< 5kg', price: 2000, icon: '📦' },
  { id: 'medium', name: 'Colis Moyen', subtitle: '5-15kg', price: 5000, icon: '📦' },
  { id: 'large', name: 'Grand Colis', subtitle: '15-30kg', price: 10000, icon: '📦' },
  { id: 'xlarge', name: 'Très Grand', subtitle: '> 30kg', price: 15000, icon: '📦' },
];

const steps = [
  { id: 0, title: 'Type de colis' },
  { id: 1, title: 'Expéditeur' },
  { id: 2, title: 'Récupération' },
  { id: 3, title: 'Destinataire' },
  { id: 4, title: 'Livraison' },
  { id: 5, title: 'Récapitulatif' },
];

export default function PackageScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [packageType, setPackageType] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderAddress, setSenderAddress] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const successModal = useSuccessModal({ autoClose: true, navigateBack: true });

  const canProceed = () => {
    if (currentStep === 0) return packageType !== '';
    if (currentStep === 1) return senderName && senderPhone;
    if (currentStep === 2) return senderAddress !== '';
    if (currentStep === 3) return recipientName && recipientPhone;
    if (currentStep === 4) return recipientAddress !== '';
    return true;
  };

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      successModal.show({
        title: 'Livraison programmée !',
        message: 'Votre colis sera livré sous peu',
        animation: 'checkmark',
      });
    }, 2000);
  };

  const selectedPackage = PACKAGE_TYPES.find(p => p.id === packageType);

  return (
    <>
      <HeaderWithBackButton title="Livraison de colis" />
      <PageContainer scrollable={false}>
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <Stack spacing="lg">
            <Stepper steps={steps} currentStep={currentStep} showProgressBar />

            {currentStep === 0 && (
              <Stack spacing="md">
                <Heading level={3}>Type de colis 📦</Heading>
                {PACKAGE_TYPES.map((type) => (
                  <Pressable key={type.id} onPress={() => setPackageType(type.id)}>
                    <Section variant={packageType === type.id ? 'elevated' : 'outlined'} style={{ borderColor: packageType === type.id ? colors.primary : colors.border, borderWidth: 2 }}>
                      <Row justify="space-between" align="center">
                        <View><Body style={{ fontSize: TYPOGRAPHY.sizes.lg }}>{type.icon} {type.name}</Body><Caption>{type.subtitle}</Caption></View>
                        <Body style={{ fontWeight: TYPOGRAPHY.weights.bold, color: colors.primary }}>{type.price.toLocaleString()} CDF</Body>
                      </Row>
                    </Section>
                  </Pressable>
                ))}
              </Stack>
            )}

            {currentStep === 1 && (
              <Stack spacing="md">
                <Heading level={3}>Expéditeur 👤</Heading>
                <Input label="Nom complet" placeholder="Votre nom" value={senderName} onChangeText={setSenderName} icon={<User size={20} color={colors.textSecondary} />} />
                <Input label="Téléphone" placeholder="+243 XXX XXX XXX" value={senderPhone} onChangeText={setSenderPhone} keyboardType="phone-pad" icon={<Phone size={20} color={colors.textSecondary} />} />
              </Stack>
            )}

            {currentStep === 2 && (
              <Stack spacing="md">
                <Heading level={3}>Adresse de récupération 📍</Heading>
                <Input label="Adresse complète" placeholder="Ex: Avenue de la Paix, Gombe" value={senderAddress} onChangeText={setSenderAddress} icon={<MapPin size={20} color={colors.textSecondary} />} multiline />
              </Stack>
            )}

            {currentStep === 3 && (
              <Stack spacing="md">
                <Heading level={3}>Destinataire 👤</Heading>
                <Input label="Nom complet" placeholder="Nom du destinataire" value={recipientName} onChangeText={setRecipientName} icon={<User size={20} color={colors.textSecondary} />} />
                <Input label="Téléphone" placeholder="+243 XXX XXX XXX" value={recipientPhone} onChangeText={setRecipientPhone} keyboardType="phone-pad" icon={<Phone size={20} color={colors.textSecondary} />} />
              </Stack>
            )}

            {currentStep === 4 && (
              <Stack spacing="md">
                <Heading level={3}>Adresse de livraison 🚚</Heading>
                <Input label="Adresse complète" placeholder="Ex: Boulevard Lumumba, Kalamu" value={recipientAddress} onChangeText={setRecipientAddress} icon={<MapPin size={20} color={colors.textSecondary} />} multiline />
              </Stack>
            )}

            {currentStep === 5 && (
              <Stack spacing="md">
                <Heading level={3}>Récapitulatif ✓</Heading>
                <Section variant="outlined">
                  <Stack spacing="sm">
                    <Row justify="space-between"><Caption>Type:</Caption><Body>{selectedPackage?.name}</Body></Row>
                    <Row justify="space-between"><Caption>Expéditeur:</Caption><Body>{senderName}</Body></Row>
                    <Row justify="space-between"><Caption>Tél expéditeur:</Caption><Body>{senderPhone}</Body></Row>
                    <Row justify="space-between"><Caption>Récupération:</Caption><Body numberOfLines={2}>{senderAddress}</Body></Row>
                    <Row justify="space-between"><Caption>Destinataire:</Caption><Body>{recipientName}</Body></Row>
                    <Row justify="space-between"><Caption>Tél destinataire:</Caption><Body>{recipientPhone}</Body></Row>
                    <Row justify="space-between"><Caption>Livraison:</Caption><Body numberOfLines={2}>{recipientAddress}</Body></Row>
                    <Row justify="space-between"><Heading level={4}>Total:</Heading><Heading level={4}>{selectedPackage?.price.toLocaleString()} CDF</Heading></Row>
                  </Stack>
                </Section>
                <Caption>Livraison sous 24-48h</Caption>
              </Stack>
            )}
          </Stack>
        </ScrollView>

        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.card, padding: SPACING.lg, borderTopWidth: 1, borderTopColor: colors.border }}>
          <Row spacing="md">
            {currentStep > 0 && <Button title="Retour" onPress={handlePrevious} variant="outline" style={{ flex: 1 }} />}
            {currentStep < 5 ? (
              <Button title="Suivant" onPress={handleNext} variant="primary" disabled={!canProceed()} style={{ flex: 1 }} />
            ) : (
              <Button title="Confirmer" onPress={handleSubmit} variant="success" loading={loading} style={{ flex: 1 }} />
            )}
          </Row>
        </View>
      </PageContainer>
      <SuccessModal {...successModal.props} />
    </>
  );
}

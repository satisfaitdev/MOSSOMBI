import React, { useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { MapPin, Phone, Home, User } from 'lucide-react-native';
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

const TRUCK_SIZES = [
  { id: 'small', name: 'Petit camion', subtitle: 'Studio / 1 pièce', priceBase: 50000, icon: '🚚' },
  { id: 'medium', name: 'Camion moyen', subtitle: '2-3 pièces', priceBase: 90000, icon: '🚚' },
  { id: 'large', name: 'Grand camion', subtitle: '4+ pièces', priceBase: 140000, icon: '🚚' },
];

const ADDONS = [
  { id: 'packing', name: 'Emballage', price: 20000 },
  { id: 'furniture', name: 'Montage meubles', price: 30000 },
  { id: 'fragile', name: 'Soins objets fragiles', price: 15000 },
];

const steps = [
  { id: 0, title: 'Camion' },
  { id: 1, title: 'Départ' },
  { id: 2, title: 'Arrivée' },
  { id: 3, title: 'Options' },
  { id: 4, title: 'Contact' },
  { id: 5, title: 'Récapitulatif' },
];

export default function MovingScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [truckSize, setTruckSize] = useState('');
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const successModal = useSuccessModal({ autoClose: true, navigateBack: true });

  const toggleAddon = (id: string) => {
    setSelectedAddons(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const canProceed = () => {
    if (currentStep === 0) return truckSize !== '';
    if (currentStep === 1) return fromAddress !== '';
    if (currentStep === 2) return toAddress !== '';
    if (currentStep === 4) return contactName !== '' && contactPhone !== '';
    return true;
  };

  const handleNext = () => currentStep < 5 && setCurrentStep(currentStep + 1);
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
      title: 'Déménagement réservé !',
      message: 'Notre équipe vous contactera sous peu',
      animation: 'confetti',
    });
  };

  const selectedTruck = TRUCK_SIZES.find(t => t.id === truckSize);
  const addonsTotal = selectedAddons.reduce((sum, id) => sum + (ADDONS.find(a => a.id === id)?.price || 0), 0);
  const estimatedTotal = (selectedTruck?.priceBase || 0) + addonsTotal;

  return (
    <>
      <HeaderWithBackButton title="Déménagement" />
      <PageContainer>
        <Stack spacing="lg">
          <Stepper steps={steps} currentStep={currentStep} showProgressBar />

          {currentStep === 0 && (
            <Stack spacing="md">
              <Heading level={3}>Taille du camion</Heading>
              {TRUCK_SIZES.map((t) => (
                <Pressable key={t.id} onPress={() => setTruckSize(t.id)}>
                  <Section variant={truckSize === t.id ? 'elevated' : 'outlined'} style={{ borderColor: truckSize === t.id ? colors.primary : colors.border, borderWidth: 2 }}>
                    <Row justify="space-between" align="center">
                      <View><Body style={{ fontSize: TYPOGRAPHY.sizes.lg }}>{t.icon} {t.name}</Body><Caption>{t.subtitle}</Caption></View>
                      <Body style={{ fontWeight: TYPOGRAPHY.weights.bold, color: colors.primary }}>{t.priceBase.toLocaleString()} CDF</Body>
                    </Row>
                  </Section>
                </Pressable>
              ))}
            </Stack>
          )}

          {currentStep === 1 && (
            <Stack spacing="md">
              <Heading level={3}>Adresse de départ</Heading>
              <Input label="Adresse" placeholder="Ex: Avenue de la Paix, Gombe" value={fromAddress} onChangeText={setFromAddress} icon={<Home size={20} color={colors.textSecondary} />} multiline />
            </Stack>
          )}

          {currentStep === 2 && (
            <Stack spacing="md">
              <Heading level={3}>Adresse d&apos;arrivée</Heading>
              <Input label="Adresse" placeholder="Ex: Boulevard Lumumba, Kalamu" value={toAddress} onChangeText={setToAddress} icon={<MapPin size={20} color={colors.textSecondary} />} multiline />
            </Stack>
          )}

          {currentStep === 3 && (
            <Stack spacing="md">
              <Heading level={3}>Options</Heading>
              {ADDONS.map((a) => (
                <Pressable key={a.id} onPress={() => toggleAddon(a.id)}>
                  <Section variant={selectedAddons.includes(a.id) ? 'elevated' : 'outlined'} style={{ borderColor: selectedAddons.includes(a.id) ? colors.primary : colors.border, borderWidth: 2 }}>
                    <Row justify="space-between" align="center">
                      <Body>{a.name}</Body>
                      <Body style={{ fontWeight: TYPOGRAPHY.weights.bold, color: colors.primary }}>+{a.price.toLocaleString()} CDF</Body>
                    </Row>
                  </Section>
                </Pressable>
              ))}
            </Stack>
          )}

          {currentStep === 4 && (
            <Stack spacing="md">
              <Heading level={3}>Contact</Heading>
              <Input label="Nom complet" placeholder="Votre nom" value={contactName} onChangeText={setContactName} icon={<User size={20} color={colors.textSecondary} />} />
              <Input label="Téléphone" placeholder="+243 XXX XXX XXX" value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" icon={<Phone size={20} color={colors.textSecondary} />} />
            </Stack>
          )}

          {currentStep === 5 && (
            <Stack spacing="md">
              <Heading level={3}>Récapitulatif ✓</Heading>
              <Section variant="outlined">
                <Stack spacing="sm">
                  <Row justify="space-between"><Caption>Camion:</Caption><Body>{selectedTruck?.name}</Body></Row>
                  <Row justify="space-between"><Caption>Départ:</Caption><Body numberOfLines={2}>{fromAddress}</Body></Row>
                  <Row justify="space-between"><Caption>Arrivée:</Caption><Body numberOfLines={2}>{toAddress}</Body></Row>
                  <Row justify="space-between"><Caption>Options:</Caption><Body>{selectedAddons.map(id => ADDONS.find(a => a.id === id)?.name).join(', ') || 'Aucune'}</Body></Row>
                  <Row justify="space-between"><Caption>Contact:</Caption><Body>{contactName} · {contactPhone}</Body></Row>
                  <Row justify="space-between"><Heading level={4}>Total estimé:</Heading><Heading level={4}>{estimatedTotal.toLocaleString()} CDF</Heading></Row>
                </Stack>
              </Section>
              <Caption>Le prix final dépendra de la distance et du temps</Caption>
            </Stack>
          )}
        </Stack>
      </PageContainer>

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

      <SuccessModal {...successModal.props} />
    </>
  );
}

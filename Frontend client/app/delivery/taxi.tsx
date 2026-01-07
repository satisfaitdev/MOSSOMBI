import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Car, MapPin, Clock } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, TYPOGRAPHY } from '@/constants/colors';
import { Heading, Body, Caption } from '@/components/atoms';
import { Section, Stack, Row } from '@/components/ui';
import { Stepper } from '@/components/molecules';
import PageContainer from '@/components/layouts/PageContainer';
import { useSuccessModal } from '@/hooks';
import { SuccessModal } from '@/components/organisms/modals';
import Button from '@/components/Button';
import Input from '@/components/Input';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';

const CAR_TYPES = [
  { id: 'economy', name: '🚗 Économique', subtitle: '4 places', pricePerKm: 500 },
  { id: 'comfort', name: '🚙 Confort', subtitle: '4 places', pricePerKm: 700 },
  { id: 'van', name: '🚐 Van', subtitle: '7 places', pricePerKm: 1000 },
  { id: 'premium', name: '🚕 Premium', subtitle: '4 places', pricePerKm: 1500 },
];

const DEPARTURE_TIMES = [
  { id: 'now', label: 'Maintenant' },
  { id: '30min', label: 'Dans 30 min' },
  { id: '1h', label: 'Dans 1h' },
  { id: '2h', label: 'Dans 2h' },
];

const steps = [
  { id: 0, title: 'Véhicule' },
  { id: 1, title: 'Départ' },
  { id: 2, title: 'Destination' },
  { id: 3, title: 'Passager' },
  { id: 4, title: 'Heure' },
  { id: 5, title: 'Récapitulatif' },
];

export default function TaxiScreen() {
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [carType, setCarType] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [loading, setLoading] = useState(false);
  const successModal = useSuccessModal({ autoClose: true, navigateBack: true });

  const canProceed = () => {
    if (currentStep === 0) return carType !== '';
    if (currentStep === 1) return pickupAddress !== '';
    if (currentStep === 2) return destinationAddress !== '';
    if (currentStep === 3) return passengerName && passengerPhone;
    if (currentStep === 4) return departureTime !== '';
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
        title: 'Taxi réservé !',
        message: 'Votre chauffeur arrive bientôt',
        animation: 'confetti',
      });
    }, 2000);
  };

  const selectedCar = CAR_TYPES.find(c => c.id === carType);
  const estimatedDistance = 10; // km
  const estimatedPrice = selectedCar ? selectedCar.pricePerKm * estimatedDistance : 0;

  return (
    <>
      <HeaderWithBackButton title="Réservation Taxi" />
      <PageContainer>
        <Stack spacing="lg">
          <Stepper steps={steps} currentStep={currentStep} showProgressBar />

          {currentStep === 0 && (
            <Stack spacing="md">
              <Heading level={3}>Type de véhicule 🚗</Heading>
              {CAR_TYPES.map((car) => (
                <Pressable key={car.id} onPress={() => setCarType(car.id)}>
                  <Section variant={carType === car.id ? 'elevated' : 'outlined'} style={{ borderColor: carType === car.id ? colors.primary : colors.border, borderWidth: 2 }}>
                    <Row justify="space-between" align="center">
                      <View><Body style={{ fontSize: TYPOGRAPHY.sizes.lg }}>{car.name}</Body><Caption>{car.subtitle}</Caption></View>
                      <Body style={{ fontWeight: TYPOGRAPHY.weights.bold, color: colors.primary }}>{car.pricePerKm} CDF/km</Body>
                    </Row>
                  </Section>
                </Pressable>
              ))}
            </Stack>
          )}

          {currentStep === 1 && (
            <Stack spacing="md">
              <Heading level={3}>Point de départ 📍</Heading>
              <Input label="Adresse de départ" placeholder="Ex: Avenue de la Paix, Gombe" value={pickupAddress} onChangeText={setPickupAddress} icon={<MapPin size={20} color={colors.textSecondary} />} multiline />
            </Stack>
          )}

          {currentStep === 2 && (
            <Stack spacing="md">
              <Heading level={3}>Destination 🎯</Heading>
              <Input label="Adresse d'arrivée" placeholder="Ex: Boulevard Lumumba, Kalamu" value={destinationAddress} onChangeText={setDestinationAddress} icon={<MapPin size={20} color={colors.textSecondary} />} multiline />
            </Stack>
          )}

          {currentStep === 3 && (
            <Stack spacing="md">
              <Heading level={3}>Informations passager 👤</Heading>
              <Input label="Nom complet" placeholder="Votre nom" value={passengerName} onChangeText={setPassengerName} icon={<Car size={20} color={colors.textSecondary} />} />
              <Input label="Téléphone" placeholder="+243 XXX XXX XXX" value={passengerPhone} onChangeText={setPassengerPhone} keyboardType="phone-pad" icon={<Clock size={20} color={colors.textSecondary} />} />
            </Stack>
          )}

          {currentStep === 4 && (
            <Stack spacing="md">
              <Heading level={3}>Heure de départ 🕐</Heading>
              {DEPARTURE_TIMES.map((time) => (
                <Pressable key={time.id} onPress={() => setDepartureTime(time.id)}>
                  <Section variant={departureTime === time.id ? 'elevated' : 'outlined'} style={{ borderColor: departureTime === time.id ? colors.primary : colors.border, borderWidth: 2 }}>
                    <Row spacing="md" align="center">
                      <Clock size={20} color={departureTime === time.id ? colors.primary : colors.textSecondary} />
                      <Body style={{ fontWeight: departureTime === time.id ? TYPOGRAPHY.weights.semibold : TYPOGRAPHY.weights.regular }}>{time.label}</Body>
                    </Row>
                  </Section>
                </Pressable>
              ))}
            </Stack>
          )}

          {currentStep === 5 && (
            <Stack spacing="md">
              <Heading level={3}>Récapitulatif ✓</Heading>
              <Section variant="outlined">
                <Stack spacing="sm">
                  <Row justify="space-between"><Caption>Véhicule:</Caption><Body>{selectedCar?.name}</Body></Row>
                  <Row justify="space-between"><Caption>Départ:</Caption><Body numberOfLines={2}>{pickupAddress}</Body></Row>
                  <Row justify="space-between"><Caption>Destination:</Caption><Body numberOfLines={2}>{destinationAddress}</Body></Row>
                  <Row justify="space-between"><Caption>Passager:</Caption><Body>{passengerName}</Body></Row>
                  <Row justify="space-between"><Caption>Téléphone:</Caption><Body>{passengerPhone}</Body></Row>
                  <Row justify="space-between"><Caption>Heure:</Caption><Body>{DEPARTURE_TIMES.find(t => t.id === departureTime)?.label}</Body></Row>
                  <Row justify="space-between"><Caption>Distance estimée:</Caption><Body>{estimatedDistance} km</Body></Row>
                  <Row justify="space-between"><Heading level={4}>Prix estimé:</Heading><Heading level={4}>{estimatedPrice.toLocaleString()} CDF</Heading></Row>
                </Stack>
              </Section>
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

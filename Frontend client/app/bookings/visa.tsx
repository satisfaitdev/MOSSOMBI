import React, { useState } from 'react';
import { View } from 'react-native';
import { FileText, Calendar } from 'lucide-react-native';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import { Heading, Body } from '@/components/atoms';
import { Stack } from '@/components/ui';
import { PageContainer } from '@/components/layouts';
import { useSuccessModal } from '@/hooks';
import { SuccessModal } from '@/components/organisms/modals';
import { BookingModal, BookingResultCard } from '@/components/organisms';
import GradientBackground from '@/components/atoms/GradientBackground';

interface VisaType {
  id: string;
  name: string;
  duration: string;
  processingTime: string;
  price: number;
  compareAtPrice?: number;
  description: string;
  requirements: string[];
}

const VISA_TYPES: VisaType[] = [
  { id: '1', name: 'Visa Touristique', duration: '30 jours', processingTime: '5-7 jours', price: 150000, compareAtPrice: 180000, description: 'Pour séjours touristiques courts', requirements: ['Passeport valide', 'Photo d\'identité', 'Billet retour', 'Réservation hôtel'] },
  { id: '2', name: 'Visa Affaires', duration: '90 jours', processingTime: '7-10 jours', price: 250000, description: 'Pour voyages d\'affaires', requirements: ['Passeport valide', 'Photo d\'identité', 'Lettre d\'invitation', 'Justificatif société'] },
  { id: '3', name: 'Visa Transit', duration: '7 jours', processingTime: '3-5 jours', price: 80000, description: 'Pour transit uniquement', requirements: ['Passeport valide', 'Photo d\'identité', 'Billet continuation'] },
];

export default function VisaApplicationScreen() {
  const [selectedVisa, setSelectedVisa] = useState<VisaType | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const successModal = useSuccessModal({ autoClose: true, navigateBack: true });

  const handleSubmit = () => {
    successModal.show({
      title: 'Demande envoyée !',
      message: 'Nous traiterons votre demande de visa sous 48h',
      animation: 'checkmark',
    });
  };

  const handleApply = (visa: VisaType) => {
    setSelectedVisa(visa);
    setShowApplicationModal(true);
  };

  return (
    <GradientBackground style={{ flex: 1 }} opacity="10">
      <HeaderWithBackButton title="Demande de Visa" />
      <PageContainer style={{ backgroundColor: 'transparent' }}>
        <Stack spacing="lg">
          <View>
            <Heading level={2}>Types de visa disponibles</Heading>
            <Body variant="secondary">Sélectionnez le type de visa adapté à votre voyage</Body>
          </View>

          {VISA_TYPES.map((visa) => (
            <BookingResultCard
              key={visa.id}
              title={visa.name}
              subtitle={`${visa.description} • ${visa.duration}`}
              rating={4.5}
              reviewCount={visa.requirements.length}
              price={visa.price}
              currency="CDF"
              compareAtPrice={visa.compareAtPrice}
              badges={[visa.duration, visa.processingTime]}
              features={[
                { icon: Calendar, label: visa.processingTime },
                { icon: FileText, label: `${visa.requirements.length} documents` }
              ]}
              availability={{
                status: 'available',
                text: 'Disponible'
              }}
              onPress={() => console.log('Visa selected:', visa.name)}
              onBook={() => handleApply(visa)}
            />
          ))}
        </Stack>

        <BookingModal
          visible={showApplicationModal}
          onClose={() => setShowApplicationModal(false)}
          onConfirm={handleSubmit}
          title="Demande de visa"
          serviceName={selectedVisa?.name || ''}
          serviceDetails={`${selectedVisa?.duration} • ${selectedVisa?.processingTime}`}
          totalPrice={selectedVisa?.price || 0}
          currency="CDF"
          fields={[
            { key: 'name', label: 'Nom complet', placeholder: 'Nom et prénom', required: true },
            { key: 'email', label: 'Email', placeholder: 'votre@email.com', required: true, keyboardType: 'email-address' },
            { key: 'phone', label: 'Téléphone', placeholder: '+243...', required: true, variant: 'phone' },
            { key: 'passport', label: 'Numéro de passeport', placeholder: 'AB1234567', required: true },
            { key: 'nationality', label: 'Nationalité', placeholder: 'Votre nationalité', required: true }
          ]}
          submitLabel="Soumettre la demande"
        />
      </PageContainer>

      <SuccessModal {...successModal.props} />
    </GradientBackground>
  );
}

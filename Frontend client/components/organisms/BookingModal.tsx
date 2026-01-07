/**
 * MODAL DE RÉSERVATION RÉUTILISABLE
 *
 * Composant générique pour les modals de réservation dans les pages bookings.
 * Évite la duplication de code entre hotel, flight, car, bus, train.
 *
 * @example
 * ```tsx
 * <BookingModal
 *   visible={showModal}
 *   onClose={() => setShowModal(false)}
 *   onConfirm={handleConfirm}
 *   title="Réservation Hôtel"
 *   serviceName="Hôtel Memling"
 *   serviceDetails="2 nuits • 3 invités"
 *   totalPrice={180000}
 *   currency="CDF"
 *   fields={[
 *     { key: 'name', label: 'Nom complet', placeholder: 'Votre nom', required: true },
 *     { key: 'email', label: 'Email', placeholder: 'votre@email.com', required: true, keyboardType: 'email-address' },
 *     { key: 'phone', label: 'Téléphone', placeholder: '+243...', required: true, variant: 'phone' }
 *   ]}
 * />
 * ```
 */

import React from 'react';
import { FormModal } from '@/components/organisms/modals';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack, Row, Section } from '@/components/ui';
import { Heading, Body } from '@/components/atoms';
import Input from '@/components/Input';

interface BookingField {
  key: string;
  label: string;
  placeholder: string;
  required?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
  variant?: 'default' | 'phone' | 'textarea';
  multiline?: boolean;
}

interface BookingModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  serviceName: string;
  serviceDetails?: string;
  totalPrice: number;
  currency: string;
  fields: BookingField[];
  submitLabel?: string;
  size?: 'md' | 'lg';
}

export default function BookingModal({
  visible,
  onClose,
  onConfirm,
  title,
  serviceName,
  serviceDetails,
  totalPrice,
  currency,
  fields,
  submitLabel = 'Confirmer la réservation',
  size = 'lg',
}: BookingModalProps) {
  const { colors } = useTheme();

  return (
    <FormModal
      visible={visible}
      onClose={onClose}
      onSubmit={onConfirm}
      title={title}
      submitLabel={submitLabel}
      size={size}
    >
      <Stack spacing="md">
        {/* Service Info */}
        <Stack spacing="xs">
          <Heading level={3}>{serviceName}</Heading>
          {serviceDetails && (
            <Body variant="secondary">{serviceDetails}</Body>
          )}
        </Stack>

        {/* Dynamic Fields */}
        {fields.map((field) => (
          <Input
            key={field.key}
            label={field.label}
            placeholder={field.placeholder}
            keyboardType={field.keyboardType || 'default'}
            variant={field.variant || 'default'}
            multiline={field.multiline}
            required={field.required}
          />
        ))}

        {/* Price Summary */}
        <Section variant="outlined">
          <Stack spacing="sm">
            <Row justify="space-between">
              <Body variant="secondary">Total:</Body>
              <Heading level={4}>
                {totalPrice.toLocaleString()} {currency}
              </Heading>
            </Row>
          </Stack>
        </Section>
      </Stack>
    </FormModal>
  );
}

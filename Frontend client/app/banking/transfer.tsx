import React, { useState } from 'react';
import { View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';
import { Heading, Body } from '@/components/atoms';
import { Section, Stack, Row } from '@/components/ui';
import { SuccessModal, ConfirmModal } from '@/components/organisms/modals';
import Button from '@/components/Button';
import Input from '@/components/Input';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import { PageContainer } from '@/components/layouts';
import { useSuccessModal } from '@/hooks';

export default function TransferScreen() {
  const { colors } = useTheme();
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const successModal = useSuccessModal({ autoClose: true });

  const handleTransfer = () => {
    if (!accountNumber || !amount) return;
    setShowConfirm(true);
  };

  const confirmTransfer = () => {
    setLoading(true);
    setShowConfirm(false);
    setTimeout(() => {
      setLoading(false);
      successModal.show({
        title: 'Transfert réussi !',
        message: `${amount} CDF transférés avec succès`,
        animation: 'checkmark',
      });
      setAccountNumber('');
      setAmount('');
      setDescription('');
    }, 1500);
  };

  return (
    <>
      <HeaderWithBackButton title="Transfert d'argent" />
      <PageContainer>
        <Section>
          <Stack spacing="lg">
            <View>
              <Heading level={2}>Envoyer de l&apos;argent</Heading>
              <Body variant="secondary">Transférez vers un compte bancaire</Body>
            </View>

            <Input
              label="Numéro de compte"
              placeholder="Entrez le numéro de compte"
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="numeric"
              required
            />

            <Input
              label="Montant (CDF)"
              placeholder="0"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              variant="number"
              required
            />

            <Input
              label="Description (optionnel)"
              placeholder="Raison du transfert"
              value={description}
              onChangeText={setDescription}
              variant="textarea"
              multiline
            />

            <Section variant="outlined">
              <Stack spacing="sm">
                <Row justify="space-between">
                  <Body variant="secondary">Frais de transfert:</Body>
                  <Body>500 CDF</Body>
                </Row>
                <Row justify="space-between">
                  <Heading level={4}>Total à payer:</Heading>
                  <Heading level={4}>{(parseInt(amount) || 0) + 500} CDF</Heading>
                </Row>
              </Stack>
            </Section>

            <Button
              title="Transférer"
              onPress={handleTransfer}
              variant="gradient"
              size="lg"
              fullWidth
              disabled={!accountNumber || !amount}
            />
          </Stack>
        </Section>

        <ConfirmModal
          visible={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={confirmTransfer}
          title="Confirmer le transfert"
          message={`Transférer ${amount} CDF vers ${accountNumber} ?`}
          type="warning"
          loading={loading}
        />
      </PageContainer>
      <SuccessModal {...successModal.props} />
    </>
  );
}

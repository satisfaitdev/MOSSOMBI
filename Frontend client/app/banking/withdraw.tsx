import React, { useState } from 'react';
import { View } from 'react-native';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import { useTheme } from '@/contexts/ThemeContext';
import { Heading, Body, Badge } from '@/components/atoms';
import { Section, Stack, Row } from '@/components/ui';
import { ConfirmModal , SuccessModal } from '@/components/organisms/modals';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { PageContainer } from '@/components/layouts';
import { useSuccessModal } from '@/hooks';

export default function WithdrawScreen() {
  const { colors } = useTheme();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'atm' | 'agent' | ''>('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('');
  const successModal = useSuccessModal({ autoClose: false });

  const handleWithdraw = () => {
    if (!amount || !method) return;
    setLoading(true);
    setShowConfirm(false);
    setTimeout(() => {
      setLoading(false);
      setCode(Math.random().toString(36).substring(2, 8).toUpperCase());
      successModal.show({
        title: 'Code généré !',
        message: `Votre code de retrait: ${code}\nValable 24h`,
        animation: 'checkmark',
      });
      setAmount('');
      setMethod('');
    }, 1500);
  };

  return (
    <>
      <HeaderWithBackButton title="Retrait d'argent" />
      <PageContainer>
        <Section>
          <Stack spacing="lg">
            <View>
              <Heading level={2}>Retirer de l&apos;argent</Heading>
              <Body variant="secondary">Retirez via GAB ou agent</Body>
            </View>

            <Input label="Montant (CDF)" placeholder="0" value={amount} onChangeText={setAmount} keyboardType="numeric" variant="number" required />

            <View>
              <Body style={{ marginBottom: 8 }}>Méthode de retrait</Body>
              <Stack spacing="sm">
                <Button title="GAB / Distributeur" onPress={() => setMethod('atm')} variant={method === 'atm' ? 'primary' : 'outline'} fullWidth />
                <Button title="Agent Mossombi" onPress={() => setMethod('agent')} variant={method === 'agent' ? 'primary' : 'outline'} fullWidth />
              </Stack>
            </View>

            <Section variant="outlined">
              <Stack spacing="sm">
                <Row justify="space-between"><Body variant="secondary">Frais:</Body><Body>{method === 'atm' ? '300' : '500'} CDF</Body></Row>
                <Row justify="space-between"><Heading level={4}>Total:</Heading><Heading level={4}>{(parseInt(amount) || 0) + (method === 'atm' ? 300 : method === 'agent' ? 500 : 0)} CDF</Heading></Row>
              </Stack>
            </Section>

            <Button title="Générer le code" onPress={() => setShowConfirm(true)} variant="gradient" size="lg" fullWidth disabled={!amount || !method} loading={loading} />
          </Stack>
        </Section>
      </PageContainer>

      <ConfirmModal visible={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handleWithdraw} title="Confirmer le retrait" message={`Retirer ${amount} CDF ?`} type="warning" />
      <SuccessModal {...successModal.props} />
    </>
  );
}

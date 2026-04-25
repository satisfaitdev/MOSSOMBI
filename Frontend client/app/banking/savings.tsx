import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PiggyBank, TrendingUp } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/colors';
import { Heading, Body, Caption } from '@/components/atoms';
import { Section, Stack, Row } from '@/components/ui';
import { PageContainer } from '@/components/layouts';
import { useSuccessModal } from '@/hooks';
import { SuccessModal } from '@/components/organisms/modals';
import Button from '@/components/Button';
import Input from '@/components/Input';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import GradientBackground from '@/components/atoms/GradientBackground';

export default function SavingsScreen() {
  const { colors } = useTheme();
  const [amount, setAmount] = useState('');
  const [savingsPlan, setSavingsPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const successModal = useSuccessModal({ autoClose: true });
  const currentSavings = 50000;

  const plans = [
    { id: 'daily', name: 'Épargne Quotidienne', rate: 5, description: '5% par an' },
    { id: 'monthly', name: 'Épargne Mensuelle', rate: 7, description: '7% par an' },
    { id: 'yearly', name: 'Épargne Annuelle', rate: 10, description: '10% par an' },
  ];

  const handleDeposit = () => {
    if (!amount || !savingsPlan) return;
    const depositAmount = parseInt(amount);
    if (depositAmount < 5000) return;
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      successModal.show({
        title: 'Dépôt réussi !',
        message: `${amount} CDF ajoutés à votre épargne`,
        animation: 'confetti',
      });
      setAmount('');
      setSavingsPlan('');
    }, 2000);
  };

  return (
    <GradientBackground style={{ flex: 1 }} opacity="10">
      <HeaderWithBackButton title="Épargne" />
      <PageContainer style={{ backgroundColor: 'transparent' }}>
        <Stack spacing="lg">
          <LinearGradient colors={[colors.gradient.start, colors.gradient.middle, colors.gradient.end]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, ...SHADOWS.lg }}>
            <Row spacing="md" align="center">
              <View style={{ width: 56, height: 56, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: BORDER_RADIUS.full, alignItems: 'center', justifyContent: 'center' }}>
                <PiggyBank size={28} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Caption style={{ color: 'rgba(255,255,255,0.8)' }}>Épargne actuelle</Caption>
                <Heading level={2} style={{ color: '#FFFFFF', marginTop: SPACING.xs }}>{currentSavings.toLocaleString()} CDF</Heading>
              </View>
            </Row>
          </LinearGradient>

          <View><Heading level={3}>Choisir un plan</Heading></View>
          <Stack spacing="md">
            {plans.map((plan) => (
              <Pressable key={plan.id} onPress={() => setSavingsPlan(plan.id)}>
                <Section variant={savingsPlan === plan.id ? 'elevated' : 'outlined'} style={{ borderColor: savingsPlan === plan.id ? colors.primary : colors.border, borderWidth: 2 }}>
                  <Row justify="space-between" align="center">
                    <View style={{ flex: 1 }}>
                      <Body style={{ fontWeight: TYPOGRAPHY.weights.semibold }}>{plan.name}</Body>
                      <Caption style={{ marginTop: SPACING.xs }}>{plan.description}</Caption>
                    </View>
                    <View style={{ backgroundColor: colors.success + '20', borderRadius: BORDER_RADIUS.md, padding: SPACING.sm }}>
                      <TrendingUp size={20} color={colors.success} />
                    </View>
                  </Row>
                </Section>
              </Pressable>
            ))}
          </Stack>

          <View><Heading level={3}>Montant à épargner</Heading></View>
          <Input label="Montant (CDF)" placeholder="Minimum 5,000 CDF" value={amount} onChangeText={setAmount} keyboardType="numeric" helperText="Montant minimum: 5,000 CDF" />

          <Button title="Déposer" onPress={handleDeposit} variant="gradient" loading={loading} disabled={!amount || !savingsPlan || parseInt(amount) < 5000} fullWidth />
        </Stack>
      </PageContainer>
      <SuccessModal {...successModal.props} />
    </GradientBackground>
  );
}

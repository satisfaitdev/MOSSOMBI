import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Phone } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { PublicServiceFormLayout } from '@/components/templates';
import { SelectionGrid } from '@/components/molecules';
import { usePublicServiceForm } from '@/hooks/usePublicServiceForm';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/constants/colors';
import { TELECOM_OPERATORS } from '@/constants/telecom';

export default function PhoneScreen() {
  const { colors } = useTheme();
  const [operator, setOperator] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');

  const form = usePublicServiceForm();

  const handleSubmit = () => {
    form.handleSubmit(
      { operator, phoneNumber, amount },
      () => {
        setOperator('');
        setPhoneNumber('');
        setAmount('');
      }
    );
  };

  return (
    <PublicServiceFormLayout
      title="Recharge Téléphone"
      icon={<Phone size={64} color={colors.secondary} />}
      iconColor={colors.secondary}
      loading={form.loading}
      successModalVisible={form.successModalVisible}
      successAnim={form.successAnim}
      checkAnim={form.checkAnim}
      onSubmit={handleSubmit}
      submitButtonText="Confirmer la recharge"
      successMessage="Votre recharge téléphonique a été effectuée avec succès"
    >
      {/* Opérateur */}
      <View style={{ marginBottom: SPACING.lg }}>
        <Text style={[styles.label, { color: colors.text, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.medium, marginBottom: SPACING.xs }]}>
          Opérateur
        </Text>
        <SelectionGrid
          options={TELECOM_OPERATORS}
          selected={operator}
          onSelect={setOperator}
          columns={2}
          accentColor={colors.secondary}
        />
      </View>

      {/* Numéro de téléphone */}
      <View style={{ marginBottom: SPACING.lg }}>
        <Text style={[styles.label, { color: colors.text, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.medium, marginBottom: SPACING.xs }]}>
          Numéro de téléphone
        </Text>
        <TextInput
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="Ex: +243 812345678"
          keyboardType="phone-pad"
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: colors.border }]}
        />
      </View>

      {/* Montant */}
      <View style={{ marginBottom: SPACING.lg }}>
        <Text style={[styles.label, { color: colors.text, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.medium, marginBottom: SPACING.xs }]}>
          Montant (FCFA)
        </Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="Ex: 5000"
          keyboardType="numeric"
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: colors.border }]}
        />
      </View>
    </PublicServiceFormLayout>
  );
}

const styles = StyleSheet.create({
  label: {},
  input: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, fontSize: TYPOGRAPHY.sizes.md },
});

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Wifi } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { PublicServiceFormLayout } from '@/components/templates';
import { SelectionGrid } from '@/components/molecules';
import { usePublicServiceForm } from '@/hooks/usePublicServiceForm';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/constants/colors';
import { INTERNET_PROVIDERS } from '@/constants/telecom';

export default function InternetScreen() {
  const { colors } = useTheme();
  const [provider, setProvider] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');

  const form = usePublicServiceForm();

  const handleSubmit = () => {
    form.handleSubmit(
      { provider, accountNumber, amount },
      () => {
        setProvider('');
        setAccountNumber('');
        setAmount('');
      }
    );
  };

  return (
    <PublicServiceFormLayout
      title="Paiement Internet"
      icon={<Wifi size={64} color={colors.accent} />}
      iconColor={colors.accent}
      loading={form.loading}
      successModalVisible={form.successModalVisible}
      successAnim={form.successAnim}
      checkAnim={form.checkAnim}
      onSubmit={handleSubmit}
      submitButtonText="Confirmer le paiement"
      successMessage="Votre paiement internet a été effectué avec succès"
    >
      {/* Fournisseur */}
      <View style={{ marginBottom: SPACING.lg }}>
        <Text style={[styles.label, { color: colors.text, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.medium, marginBottom: SPACING.xs }]}>
          Fournisseur
        </Text>
        <SelectionGrid
          options={INTERNET_PROVIDERS}
          selected={provider}
          onSelect={setProvider}
          columns={2}
          accentColor={colors.accent}
        />
      </View>

      {/* Numéro de compte */}
      <View style={{ marginBottom: SPACING.lg }}>
        <Text style={[styles.label, { color: colors.text, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.medium, marginBottom: SPACING.xs }]}>
          Numéro de compte
        </Text>
        <TextInput
          value={accountNumber}
          onChangeText={setAccountNumber}
          placeholder="Ex: 0812345678"
          keyboardType="numeric"
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
          placeholder="Ex: 25000"
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

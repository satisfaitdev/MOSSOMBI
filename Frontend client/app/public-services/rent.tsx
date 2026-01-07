import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Home } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { PublicServiceFormLayout } from '@/components/templates';
import { SelectionGrid } from '@/components/molecules';
import { usePublicServiceForm } from '@/hooks/usePublicServiceForm';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/constants/colors';

export default function RentScreen() {
  const { colors } = useTheme();
  const [period, setPeriod] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [landlordName, setLandlordName] = useState('');
  const [landlordPhone, setLandlordPhone] = useState('');
  const [amount, setAmount] = useState('');

  const form = usePublicServiceForm();

  const periods = [
    { id: 'jan', name: 'Janvier 2025' },
    { id: 'feb', name: 'Février 2025' },
    { id: 'mar', name: 'Mars 2025' },
    { id: 'apr', name: 'Avril 2025' },
  ];

  const handleSubmit = () => {
    form.handleSubmit(
      { period, propertyAddress, landlordName, amount },
      () => {
        setPeriod('');
        setPropertyAddress('');
        setLandlordName('');
        setLandlordPhone('');
        setAmount('');
      }
    );
  };

  return (
    <PublicServiceFormLayout
      title="Paiement Loyer"
      icon={<Home size={64} color={colors.accent} />}
      iconColor={colors.accent}
      loading={form.loading}
      successModalVisible={form.successModalVisible}
      successAnim={form.successAnim}
      checkAnim={form.checkAnim}
      onSubmit={handleSubmit}
      submitButtonText="Confirmer le paiement"
      successMessage="Votre paiement de loyer a été effectué avec succès"
    >
      {/* Période */}
      <View style={{ marginBottom: SPACING.lg }}>
        <Text style={[styles.label, { color: colors.text, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.medium, marginBottom: SPACING.xs }]}>
          Période
        </Text>
        <SelectionGrid
          options={periods}
          selected={period}
          onSelect={setPeriod}
          columns={2}
          accentColor={colors.accent}
        />
      </View>

      {/* Adresse du bien */}
      <View style={{ marginBottom: SPACING.lg }}>
        <Text style={[styles.label, { color: colors.text, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.medium, marginBottom: SPACING.xs }]}>
          Adresse du bien
        </Text>
        <TextInput
          value={propertyAddress}
          onChangeText={setPropertyAddress}
          placeholder="Ex: 12 Av. de la Paix, Gombe"
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: colors.border }]}
        />
      </View>

      {/* Nom du propriétaire */}
      <View style={{ marginBottom: SPACING.lg }}>
        <Text style={[styles.label, { color: colors.text, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.medium, marginBottom: SPACING.xs }]}>
          Nom du propriétaire
        </Text>
        <TextInput
          value={landlordName}
          onChangeText={setLandlordName}
          placeholder="Ex: Jean Mutombo"
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: colors.border }]}
        />
      </View>

      {/* Téléphone du propriétaire (optionnel) */}
      <View style={{ marginBottom: SPACING.lg }}>
        <Text style={[styles.label, { color: colors.text, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.medium, marginBottom: SPACING.xs }]}>
          Téléphone du propriétaire (optionnel)
        </Text>
        <TextInput
          value={landlordPhone}
          onChangeText={setLandlordPhone}
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
          placeholder="Ex: 500000"
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

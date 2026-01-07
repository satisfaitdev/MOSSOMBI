import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { GraduationCap } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { PublicServiceFormLayout } from '@/components/templates';
import { usePublicServiceForm } from '@/hooks/usePublicServiceForm';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/constants/colors';

export default function SchoolScreen() {
  const { colors } = useTheme();
  const [schoolName, setSchoolName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');

  const form = usePublicServiceForm();

  const handleSubmit = () => {
    form.handleSubmit(
      { schoolName, studentName, studentId, amount },
      () => {
        setSchoolName('');
        setStudentName('');
        setStudentId('');
        setAmount('');
      }
    );
  };

  return (
    <PublicServiceFormLayout
      title="Frais de Scolarité"
      icon={<GraduationCap size={64} color={colors.primary} />}
      iconColor={colors.primary}
      loading={form.loading}
      successModalVisible={form.successModalVisible}
      successAnim={form.successAnim}
      checkAnim={form.checkAnim}
      onSubmit={handleSubmit}
      submitButtonText="Confirmer le paiement"
      successMessage="Votre paiement des frais scolaires a été effectué avec succès"
    >
      {/* Nom de l&apos;établissement */}
      <View style={{ marginBottom: SPACING.lg }}>
        <Text style={[styles.label, { color: colors.text, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.medium, marginBottom: SPACING.xs }]}>
          Nom de l&apos;établissement
        </Text>
        <TextInput
          value={schoolName}
          onChangeText={setSchoolName}
          placeholder="Ex: Lycée de la Victoire"
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: colors.border }]}
        />
      </View>

      {/* Nom de l&apos;élève */}
      <View style={{ marginBottom: SPACING.lg }}>
        <Text style={[styles.label, { color: colors.text, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.medium, marginBottom: SPACING.xs }]}>
          Nom de l&apos;élève
        </Text>
        <TextInput
          value={studentName}
          onChangeText={setStudentName}
          placeholder="Ex: Jean Kabongo"
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: colors.border }]}
        />
      </View>

      {/* Numéro d&apos;élève */}
      <View style={{ marginBottom: SPACING.lg }}>
        <Text style={[styles.label, { color: colors.text, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.medium, marginBottom: SPACING.xs }]}>
          Numéro d&apos;élève
        </Text>
        <TextInput
          value={studentId}
          onChangeText={setStudentId}
          placeholder="Ex: 2024001234"
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
          placeholder="Ex: 150000"
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

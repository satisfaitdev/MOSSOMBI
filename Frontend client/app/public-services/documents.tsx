import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { FileText } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { PublicServiceFormLayout } from '@/components/templates';
import { SelectionGrid } from '@/components/molecules';
import { usePublicServiceForm } from '@/hooks/usePublicServiceForm';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/constants/colors';
import { PageContainer } from '@/components/layouts';
import { useSuccessModal } from '@/hooks';
import { SuccessModal } from '@/components/organisms/modals';

export default function DocumentsScreen() {
  const { colors } = useTheme();
  const [documentType, setDocumentType] = useState('');
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [reason, setReason] = useState('');
  const successModal = useSuccessModal({ autoClose: true });

  const form = usePublicServiceForm();

  const documentTypes = [
    { id: 'passport', name: 'Passeport', subtitle: '150000 FCFA' },
    { id: 'id_card', name: "Carte d'identité", subtitle: '50000 FCFA' },
    { id: 'birth_certificate', name: 'Acte de naissance', subtitle: '20000 FCFA' },
    { id: 'marriage_certificate', name: 'Acte de mariage', subtitle: '30000 FCFA' },
  ];

  const handleSubmit = () => {
    form.handleSubmit(
      { documentType, fullName, idNumber, reason },
      () => {
        setDocumentType('');
        setFullName('');
        setIdNumber('');
        setReason('');
      }
    );
  };

  const handleRequestDocument = (docName: string) => {
    successModal.show({
      title: 'Demande envoyée !',
      message: `Votre demande de ${docName} a été envoyée`,
      animation: 'checkmark',
    });
  };

  return (
    <PageContainer>
      <PublicServiceFormLayout
        title="Documents Officiels"
        icon={<FileText size={64} color={colors.primary} />}
        iconColor={colors.primary}
        loading={form.loading}
        successModalVisible={form.successModalVisible}
        successAnim={form.successAnim}
        checkAnim={form.checkAnim}
        onSubmit={handleSubmit}
        submitButtonText="Soumettre la demande"
        successMessage="Votre demande de document a été soumise avec succès"
      >
        {/* Type de document */}
        <View style={{ marginBottom: SPACING.lg }}>
          <Text style={[styles.label, { color: colors.text, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.medium, marginBottom: SPACING.xs }]}>
            Type de document
          </Text>
          <SelectionGrid
            options={documentTypes}
            selected={documentType}
            onSelect={setDocumentType}
            columns={2}
            accentColor={colors.primary}
          />
        </View>

        {/* Nom complet */}
        <View style={{ marginBottom: SPACING.lg }}>
          <Text style={[styles.label, { color: colors.text, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.medium, marginBottom: SPACING.xs }]}>
            Nom complet
          </Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Ex: Jean Kabongo Mutombo"
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: colors.border }]}
          />
        </View>

      {/* Numéro d&apos;identification */}
      <View style={{ marginBottom: SPACING.lg }}>
        <Text style={[styles.label, { color: colors.text, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.medium, marginBottom: SPACING.xs }]}>
          Numéro d&apos;identification
        </Text>
        <TextInput
          value={idNumber}
          onChangeText={setIdNumber}
          placeholder="Ex: 1234567890"
          keyboardType="numeric"
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: colors.border }]}
        />
      </View>

        {/* Motif de la demande */}
        <View style={{ marginBottom: SPACING.lg }}>
          <Text style={[styles.label, { color: colors.text, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.medium, marginBottom: SPACING.xs }]}>
            Motif de la demande
          </Text>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Ex: Voyage à l'étranger"
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            style={[styles.input, styles.textarea, { backgroundColor: colors.surface, color: colors.text, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: colors.border }]}
          />
        </View>
      </PublicServiceFormLayout>

      <SuccessModal {...successModal.props} />
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  label: {},
  input: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, fontSize: TYPOGRAPHY.sizes.md },
  textarea: { minHeight: 80, textAlignVertical: 'top' as 'top' },
});

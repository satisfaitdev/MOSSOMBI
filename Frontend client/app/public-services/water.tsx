import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Droplet, Scan } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { PublicServiceFormLayout } from '@/components/templates';
import { usePublicServiceForm } from '@/hooks/usePublicServiceForm';
import QRScanner from '@/components/QRScanner';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/constants/colors';

export default function WaterScreen() {
  const { colors } = useTheme();
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);

  const form = usePublicServiceForm();

  const handleScanQR = () => {
    setShowQRScanner(true);
  };

  const handleQRScanned = (data: string) => {
    setAccountNumber(data);
    setShowQRScanner(false);
  };

  const handleSubmit = () => {
    form.handleSubmit(
      { accountNumber, amount },
      () => {
        setAccountNumber('');
        setAmount('');
      }
    );
  };

  return (
    <>
      <PublicServiceFormLayout
        title="Paiement Eau"
        icon={<Droplet size={64} color={colors.secondary} />}
        iconColor={colors.secondary}
        loading={form.loading}
        successModalVisible={form.successModalVisible}
        successAnim={form.successAnim}
        checkAnim={form.checkAnim}
        onSubmit={handleSubmit}
        submitButtonText="Confirmer le paiement"
        successMessage="Votre paiement d'eau a été effectué avec succès"
      >
        {/* Numéro d&apos;abonné avec QR Scanner */}
        <View style={{ marginBottom: SPACING.lg }}>
          <Text style={[styles.label, { color: colors.text, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.medium, marginBottom: SPACING.xs }]}>
            Numéro d&apos;abonné
          </Text>
          <View style={styles.inputWithButton}>
            <TextInput
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="Ex: 123456789"
              keyboardType="numeric"
              placeholderTextColor={colors.textTertiary}
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: colors.border, flex: 1 }]}
            />
            <Pressable onPress={handleScanQR} style={({ pressed }) => [styles.scanButton, { backgroundColor: colors.secondary, borderRadius: BORDER_RADIUS.md, opacity: pressed ? 0.8 : 1 }]}>
              <Scan size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {/* Montant */}
        <View style={{ marginBottom: SPACING.lg }}>
          <Text style={[styles.label, { color: colors.text, fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.medium, marginBottom: SPACING.xs }]}>
            Montant (CDF)
          </Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="Ex: 30000"
            keyboardType="numeric"
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: colors.border }]}
          />
        </View>
      </PublicServiceFormLayout>

      <QRScanner visible={showQRScanner} onScan={handleQRScanned} onClose={() => setShowQRScanner(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  label: {},
  inputWithButton: { flexDirection: 'row', gap: SPACING.sm },
  input: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, fontSize: TYPOGRAPHY.sizes.md },
  scanButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
});

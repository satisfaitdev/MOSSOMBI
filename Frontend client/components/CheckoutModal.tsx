import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, TextInput, Alert } from 'react-native';
import { ShoppingCart, CreditCard, Wallet, Calendar, Truck, MapPin, Clock, Navigation, Edit3 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/constants/colors';
import { CheckoutModalProps } from '@/types/modal';
import HeaderLayout from '@/components/layouts/HeaderLayout';
import ButtonGroupLayout from '@/components/layouts/ButtonGroupLayout';
import Button from '@/components/Button';

export default function CheckoutModal({
  visible,
  onClose,
  cart,
  products,
  onConfirm,
}: CheckoutModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [paymentMethod, setPaymentMethod] = useState<'full' | 'installment'>('full');
  const [deliveryOption, setDeliveryOption] = useState('standard');
  const [addressMode, setAddressMode] = useState<'auto' | 'manual'>('auto');
  const [manualAddress, setManualAddress] = useState({
    street: '',
    city: 'Kinshasa',
    commune: '',
    details: '',
  });
  const [autoAddress, setAutoAddress] = useState('Kinshasa, Gombe, Avenue de la Paix, N°123');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const cartItems = Object.keys(cart).map(productId => {
    const product = products.find(p => p.id === productId);
    return product ? { ...product, quantity: cart[productId] } : null;
  }).filter(Boolean);

  const subtotal = cartItems.reduce((sum, item) => sum + (item!.price * item!.quantity), 0);
  const deliveryFee = deliveryOption === 'express' ? 5000 : 0;
  const total = subtotal + deliveryFee;
  const installmentAmount = Math.ceil(total / 3);

  const handleGetLocation = async () => {
    setIsLoadingLocation(true);
    try {
      // Simulation de géolocalisation
      setTimeout(() => {
        setAutoAddress('Kinshasa, Gombe, Avenue de la Paix, N°123');
        Alert.alert('Succès', 'Localisation détectée avec succès');
        setIsLoadingLocation(false);
      }, 1500);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de détecter votre position');
      setIsLoadingLocation(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <HeaderLayout
          title="Confirmation de commande"
          showCloseButton
          onClose={onClose}
          variant="modal"
        // paddingBottom="xs" is not in HeaderLayoutProps based on my reading, style prop can handle it if needed, or stick to variant defaults
        />

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: SPACING.lg }}>
          {/* Order Summary */}
          <View style={[styles.section, { backgroundColor: colors.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md }]}>
            <View style={styles.sectionHeader}>
              <ShoppingCart size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Résumé de la commande
              </Text>
            </View>

            {cartItems.map((item) => (
              <View key={item!.id} style={styles.orderItem}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                    {item!.name}
                  </Text>
                  <Text style={[styles.itemQuantity, { color: colors.textSecondary }]}>
                    Quantité: {item!.quantity}
                  </Text>
                </View>
                <Text style={[styles.itemPrice, { color: colors.primary }]}>
                  {(item!.price * item!.quantity).toLocaleString()} FCFA
                </Text>
              </View>
            ))}

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Sous-total</Text>
              <Text style={[styles.totalValue, { color: colors.text }]}>
                {subtotal.toLocaleString()} FCFA
              </Text>
            </View>

            {deliveryFee > 0 && (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Livraison</Text>
                <Text style={[styles.totalValue, { color: colors.text }]}>
                  {deliveryFee.toLocaleString()} FCFA
                </Text>
              </View>
            )}

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.text, fontSize: TYPOGRAPHY.sizes.lg, fontWeight: TYPOGRAPHY.weights.bold }]}>Total</Text>
              <Text style={[styles.totalValue, { color: colors.primary, fontSize: TYPOGRAPHY.sizes.xl, fontWeight: TYPOGRAPHY.weights.bold }]}>
                {total.toLocaleString()} FCFA
              </Text>
            </View>
          </View>

          {/* Payment Method */}
          <View style={[styles.section, { backgroundColor: colors.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginTop: SPACING.lg }]}>
            <View style={styles.sectionHeader}>
              <CreditCard size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Mode de paiement
              </Text>
            </View>

            <Pressable
              onPress={() => setPaymentMethod('full')}
              style={[
                styles.paymentOption,
                {
                  backgroundColor: paymentMethod === 'full' ? colors.primary + '20' : colors.surface,
                  borderColor: paymentMethod === 'full' ? colors.primary : colors.border,
                }
              ]}
            >
              <View style={styles.paymentOptionContent}>
                <Wallet size={24} color={paymentMethod === 'full' ? colors.primary : colors.textSecondary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.paymentTitle, { color: colors.text }]}>
                    Paiement intégral
                  </Text>
                  <Text style={[styles.paymentDesc, { color: colors.textSecondary }]}>
                    Payez {total.toLocaleString()} FCFA maintenant
                  </Text>
                </View>
                <View style={[styles.radio, { borderColor: paymentMethod === 'full' ? colors.primary : colors.border }]}>
                  {paymentMethod === 'full' && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                </View>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setPaymentMethod('installment')}
              style={[
                styles.paymentOption,
                {
                  backgroundColor: paymentMethod === 'installment' ? colors.primary + '20' : colors.surface,
                  borderColor: paymentMethod === 'installment' ? colors.primary : colors.border,
                  marginTop: SPACING.sm,
                }
              ]}
            >
              <View style={styles.paymentOptionContent}>
                <Calendar size={24} color={paymentMethod === 'installment' ? colors.primary : colors.textSecondary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.paymentTitle, { color: colors.text }]}>
                    Paiement en 3 fois
                  </Text>
                  <Text style={[styles.paymentDesc, { color: colors.textSecondary }]}>
                    3 × {installmentAmount.toLocaleString()} FCFA/mois
                  </Text>
                </View>
                <View style={[styles.radio, { borderColor: paymentMethod === 'installment' ? colors.primary : colors.border }]}>
                  {paymentMethod === 'installment' && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                </View>
              </View>
            </Pressable>
          </View>

          {/* Delivery Options */}
          <View style={[styles.section, { backgroundColor: colors.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginTop: SPACING.lg }]}>
            <View style={styles.sectionHeader}>
              <Truck size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Options de livraison
              </Text>
            </View>

            <Pressable
              onPress={() => setDeliveryOption('standard')}
              style={[
                styles.deliveryOption,
                {
                  backgroundColor: deliveryOption === 'standard' ? colors.success + '20' : colors.surface,
                  borderColor: deliveryOption === 'standard' ? colors.success : colors.border,
                }
              ]}
            >
              <View style={styles.deliveryContent}>
                <Clock size={20} color={deliveryOption === 'standard' ? colors.success : colors.textSecondary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.deliveryTitle, { color: colors.text }]}>
                    Livraison standard
                  </Text>
                  <Text style={[styles.deliveryDesc, { color: colors.textSecondary }]}>
                    24-48 heures • Gratuit
                  </Text>
                </View>
                <View style={[styles.radio, { borderColor: deliveryOption === 'standard' ? colors.success : colors.border }]}>
                  {deliveryOption === 'standard' && <View style={[styles.radioInner, { backgroundColor: colors.success }]} />}
                </View>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setDeliveryOption('express')}
              style={[
                styles.deliveryOption,
                {
                  backgroundColor: deliveryOption === 'express' ? colors.warning + '20' : colors.surface,
                  borderColor: deliveryOption === 'express' ? colors.warning : colors.border,
                  marginTop: SPACING.sm,
                }
              ]}
            >
              <View style={styles.deliveryContent}>
                <Truck size={20} color={deliveryOption === 'express' ? colors.warning : colors.textSecondary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.deliveryTitle, { color: colors.text }]}>
                    Livraison express
                  </Text>
                  <Text style={[styles.deliveryDesc, { color: colors.textSecondary }]}>
                    12-24 heures • 5,000 FCFA
                  </Text>
                </View>
                <View style={[styles.radio, { borderColor: deliveryOption === 'express' ? colors.warning : colors.border }]}>
                  {deliveryOption === 'express' && <View style={[styles.radioInner, { backgroundColor: colors.warning }]} />}
                </View>
              </View>
            </Pressable>
          </View>

          {/* Delivery Address */}
          <View style={[styles.section, { backgroundColor: colors.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginTop: SPACING.lg }]}>
            <View style={styles.sectionHeader}>
              <MapPin size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Adresse de livraison
              </Text>
            </View>

            {/* Address Mode Toggle */}
            <View style={styles.addressModeToggle}>
              <Pressable
                onPress={() => setAddressMode('auto')}
                style={[
                  styles.addressModeButton,
                  {
                    backgroundColor: addressMode === 'auto' ? colors.primary : colors.surface,
                    flex: 1,
                  }
                ]}
              >
                <Navigation size={18} color={addressMode === 'auto' ? '#FFFFFF' : colors.textSecondary} />
                <Text style={[styles.addressModeText, { color: addressMode === 'auto' ? '#FFFFFF' : colors.text }]}>
                  Automatique
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setAddressMode('manual')}
                style={[
                  styles.addressModeButton,
                  {
                    backgroundColor: addressMode === 'manual' ? colors.primary : colors.surface,
                    flex: 1,
                  }
                ]}
              >
                <Edit3 size={18} color={addressMode === 'manual' ? '#FFFFFF' : colors.textSecondary} />
                <Text style={[styles.addressModeText, { color: addressMode === 'manual' ? '#FFFFFF' : colors.text }]}>
                  Manuelle
                </Text>
              </Pressable>
            </View>

            {/* Auto Address */}
            {addressMode === 'auto' ? (
              <View style={styles.autoAddressContainer}>
                <View style={[styles.addressDisplay, { backgroundColor: colors.surface }]}>
                  <MapPin size={16} color={colors.primary} />
                  <Text style={[styles.addressText, { color: colors.text }]}>
                    {autoAddress}
                  </Text>
                </View>
                <Button
                  title={isLoadingLocation ? "Détection..." : "Détecter ma position"}
                  onPress={handleGetLocation}
                  variant="outline"
                  size="sm"
                  icon={<Navigation size={18} color={colors.primary} />}
                  fullWidth
                  disabled={isLoadingLocation}
                />
              </View>
            ) : (
              /* Manual Address */
              <View style={styles.manualAddressContainer}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    Rue / Avenue *
                  </Text>
                  <TextInput
                    value={manualAddress.street}
                    onChangeText={(text) => setManualAddress(prev => ({ ...prev, street: text }))}
                    placeholder="Ex: Avenue de la Paix, N°123"
                    placeholderTextColor={colors.textTertiary}
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                      Commune *
                    </Text>
                    <TextInput
                      value={manualAddress.commune}
                      onChangeText={(text) => setManualAddress(prev => ({ ...prev, commune: text }))}
                      placeholder="Ex: Gombe"
                      placeholderTextColor={colors.textTertiary}
                      style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                      Ville *
                    </Text>
                    <TextInput
                      value={manualAddress.city}
                      onChangeText={(text) => setManualAddress(prev => ({ ...prev, city: text }))}
                      placeholder="Kinshasa"
                      placeholderTextColor={colors.textTertiary}
                      style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    Détails supplémentaires
                  </Text>
                  <TextInput
                    value={manualAddress.details}
                    onChangeText={(text) => setManualAddress(prev => ({ ...prev, details: text }))}
                    placeholder="Ex: Bâtiment A, 2ème étage, porte gauche"
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    numberOfLines={3}
                    style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text }]}
                  />
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        <ButtonGroupLayout
          actions={[
            {
              title: "Annuler",
              onPress: onClose,
              variant: "outline"
            },
            {
              title: "Confirmer",
              onPress: () => onConfirm(paymentMethod, deliveryOption),
              variant: "gradient", // Assuming 'gradient' is supported by underlying Button or mapped to primary
              // icon: <ShoppingCart size={18} color="#FFFFFF" /> // passed via props if button supports it
            }
          ]}
          variant="footer"
          equalWidth
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { marginBottom: SPACING.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  sectionTitle: { fontSize: TYPOGRAPHY.sizes.lg, fontWeight: TYPOGRAPHY.weights.bold },
  orderItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACING.sm },
  itemName: { fontSize: TYPOGRAPHY.sizes.md, fontWeight: TYPOGRAPHY.weights.medium },
  itemQuantity: { fontSize: TYPOGRAPHY.sizes.sm },
  itemPrice: { fontSize: TYPOGRAPHY.sizes.md, fontWeight: TYPOGRAPHY.weights.bold },
  divider: { height: 1, marginVertical: SPACING.sm },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.xs },
  totalLabel: { fontSize: TYPOGRAPHY.sizes.md },
  totalValue: { fontSize: TYPOGRAPHY.sizes.md },
  paymentOption: {
    padding: SPACING.md,
    borderWidth: 2,
    borderRadius: BORDER_RADIUS.md,
  },
  paymentOptionContent: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  paymentTitle: { fontSize: TYPOGRAPHY.sizes.md, fontWeight: TYPOGRAPHY.weights.semibold },
  paymentDesc: { fontSize: TYPOGRAPHY.sizes.sm },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  deliveryOption: {
    padding: SPACING.md,
    borderWidth: 2,
    borderRadius: BORDER_RADIUS.md,
  },
  deliveryContent: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  deliveryTitle: { fontSize: TYPOGRAPHY.sizes.md, fontWeight: TYPOGRAPHY.weights.semibold },
  deliveryDesc: { fontSize: TYPOGRAPHY.sizes.sm },
  addressModeToggle: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  addressModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  addressModeText: { fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.medium },
  autoAddressContainer: { gap: SPACING.sm },
  addressDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md
  },
  addressText: { fontSize: TYPOGRAPHY.sizes.md, flex: 1 },
  manualAddressContainer: { gap: SPACING.md },
  inputGroup: { gap: SPACING.xs },
  inputLabel: { fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.medium },
  input: {
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.md
  },
  inputRow: { flexDirection: 'row', gap: SPACING.sm },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top'
  },
});

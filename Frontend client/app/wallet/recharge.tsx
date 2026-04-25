/**
 * Page de recharge du portefeuille
 * Flux multi-étapes : Montant → Méthode → Numéro → Confirmation
 */

import React, { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { View, Pressable, Modal, Text, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@/constants/colors';
import { formatCurrencyWithConversion, convertToXAF } from '@/utils/localization';
import { COMMON_STYLES } from '@/constants/styles';
import { Heading, Body, Caption } from '@/components/atoms';
import { Stack as VStack, Row } from '@/components/ui';
import { PageContainer } from '@/components/layouts';
import Button from '@/components/Button';
import Input from '@/components/Input';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import { X, Plus, Edit3, Wallet, ArrowDown } from 'lucide-react-native';
import { PAYMENT_METHODS, OPERATORS } from './constants';
import { PaymentMethodId, OperatorId } from './types';
import PaymentMethodCard from './components/PaymentMethodCard';
import PhoneNumberCard from './components/PhoneNumberCard';
import OperatorCard from './components/OperatorCard';
import SuccessModal from '@/components/organisms/modals/SuccessModal';
import { useSuccessModal } from '@/hooks/useSuccessModal';
import GradientBackground from '@/components/atoms/GradientBackground';

type RechargeStep = 'amount' | 'method' | 'phone' | 'confirmation';

interface RechargeState {
  step: RechargeStep;
  amount: string;
  selectedMethod: PaymentMethodId | '';
  selectedOperator: OperatorId | '';
  phoneNumbers: Array<{ id: string; number: string; operator: string }>;
  selectedPhoneId: string;
  showMethodModal: boolean;
  showOperatorModal: boolean;
  showAddPhoneModal: boolean;
  isEditingAmount: boolean; // Pour savoir si on modifie le montant
}

export default function RechargeScreen() {
  const { colors } = useTheme();
  const { getDisplayCurrency } = useUserPreferences();
  const router = useRouter();
  const [state, setState] = useState<RechargeState>({
    step: 'amount',
    amount: '',
    selectedMethod: '',
    selectedOperator: '',
    phoneNumbers: [
      { id: '1', number: '066944200', operator: 'airtel' },
    ],
    selectedPhoneId: '',
    showMethodModal: false,
    showOperatorModal: false,
    showAddPhoneModal: false,
    isEditingAmount: false,
  });
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [newPhoneOperator, setNewPhoneOperator] = useState('');
  
  // Hook pour le modal de succès
  const successModal = useSuccessModal({
    autoClose: true, // Fermeture automatique après 3s
    onClose: () => {
      router.dismiss();
      setTimeout(() => {
        router.push({
          pathname: '/',
          params: { walletRechargeSuccess: Date.now().toString() },
        } as any);
      }, 100);
    },
  });

  // Gestionnaires d'événements

  const handleMethodSelect = useCallback((methodId: PaymentMethodId) => {
    if (methodId === 'mobile-money') {
      // Pour mobile money, afficher le modal d'opérateur sur la même page
      setState(prev => ({ 
        ...prev, 
        selectedMethod: methodId, 
        selectedOperator: '', // Reset operator when method changes
        showMethodModal: false,
        showOperatorModal: true,
      }));
    } else {
      // Pour les autres méthodes, aller directement à la confirmation
      setState(prev => ({ 
        ...prev, 
        selectedMethod: methodId, 
        selectedOperator: '',
        showMethodModal: false,
        showOperatorModal: false,
        step: 'confirmation'
      }));
    }
  }, []);

  const handleOperatorSelect = useCallback((operatorId: OperatorId) => {
    setState(prev => ({ 
      ...prev, 
      selectedOperator: operatorId,
      showOperatorModal: false,
      step: 'phone'
    }));
  }, []);

  const handlePhoneSelect = useCallback((phoneId: string) => {
    setState(prev => ({ ...prev, selectedPhoneId: phoneId, step: 'confirmation' }));
  }, []);

  const handleAddPhone = useCallback(() => {
    if (newPhoneNumber && newPhoneOperator) {
      const newPhone = {
        id: Date.now().toString(),
        number: newPhoneNumber,
        operator: newPhoneOperator,
      };
      setState(prev => ({
        ...prev,
        phoneNumbers: [...prev.phoneNumbers, newPhone],
        selectedPhoneId: newPhone.id,
        showAddPhoneModal: false,
        step: 'phone', // Retour à la page de sélection du numéro
      }));
      setNewPhoneNumber('');
      setNewPhoneOperator('');
    }
  }, [newPhoneNumber, newPhoneOperator]);

  const handleRecharge = useCallback(() => {
    // Logique de recharge ici
    console.log('Recharge:', state);
    
    // Afficher le modal de succès
    const displayAmount = `${state.amount} ${getDisplayCurrency()}`;
    const xafAmount = getDisplayCurrency() !== 'XAF' 
      ? ` (${formatCurrencyWithConversion(convertToXAF(parseFloat(state.amount) || 0, getDisplayCurrency()), 'XAF', false)})`
      : '';
    
    successModal.show({
      title: 'Recharge réussie !',
      message: `Votre portefeuille a été rechargé de ${displayAmount}${xafAmount} avec succès.`,
      animation: 'confetti',
    });
  }, [state, successModal]);

  const handleTestRecharge = useCallback(() => {
    const amount = state.amount && parseFloat(state.amount) > 0 ? state.amount : '1000';
    const displayAmount = `${amount} ${getDisplayCurrency()}`;
    const xafAmount = getDisplayCurrency() !== 'XAF'
      ? ` (${formatCurrencyWithConversion(convertToXAF(parseFloat(amount) || 0, getDisplayCurrency()), 'XAF', false)})`
      : '';

    successModal.show({
      title: 'Recharge réussie !',
      message: `Votre portefeuille a été rechargé de ${displayAmount}${xafAmount} avec succès.`,
      animation: 'confetti',
    });
  }, [state.amount, successModal, getDisplayCurrency]);

  const handleEditNumber = useCallback(() => {
    setState(prev => ({ ...prev, step: 'phone' }));
  }, []);

  const handleEditAmount = useCallback(() => {
    setState(prev => ({ ...prev, step: 'amount', isEditingAmount: true }));
  }, []);

  const canProceed = useCallback(() => {
    if (state.step === 'amount') return state.amount && parseInt(state.amount) > 0;
    if (state.step === 'method') return state.selectedMethod;
    if (state.step === 'phone') return state.selectedPhoneId;
    return true;
  }, [state]);

  // Rendu des différentes étapes
  const renderAmountStep = () => (
    <VStack spacing="lg" style={{ flex: 1, paddingTop: SPACING.xl }}>
      <VStack spacing="md" align="center">
        <Caption>Entrer le montant à recharger</Caption>
        
        {/* Champ de saisie du montant */}
        <Pressable 
          onPress={() => {}} 
          style={{ width: '100%', alignItems: 'center' }}
        >
          <TextInput
            value={state.amount}
            onChangeText={(value) => setState(prev => ({ ...prev, amount: value }))}
            placeholder="0"
            keyboardType="numeric"
            style={{
              fontSize: 48,
              color: colors.text,
              textAlign: 'center',
              fontWeight: TYPOGRAPHY.weights.bold,
              minWidth: 200,
              borderBottomWidth: 2,
              borderBottomColor: colors.border,
              paddingVertical: SPACING.sm,
            }}
            placeholderTextColor={colors.textTertiary}
          />
          <Text style={{ 
            fontSize: 48, 
            color: colors.text, 
            fontWeight: TYPOGRAPHY.weights.bold,
            marginLeft: SPACING.xs 
          }}>
            {getDisplayCurrency()}
          </Text>
        </Pressable>
        
        {/* Indicateur de conversion */}
        {state.amount && getDisplayCurrency() !== 'XAF' && (
          <View style={{ alignItems: 'center', marginTop: SPACING.sm }}>
            <Caption style={{ color: colors.textSecondary }}>
              ≈ {formatCurrencyWithConversion(convertToXAF(parseFloat(state.amount) || 0, getDisplayCurrency()), 'XAF', false)} (stocké en XAF)
            </Caption>
          </View>
        )}
        
        <Pressable style={[COMMON_STYLES.rowCenter, { backgroundColor: colors.surface, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm }]}>
          <Text style={{ color: colors.textSecondary, marginRight: SPACING.xs }}>💳</Text>
          <Text style={{ color: colors.textSecondary }}>Sélectionner Juste</Text>
        </Pressable>
      </VStack>

      <View style={{ marginTop: 'auto', paddingBottom: SPACING.lg }}>
        <Button
          title={state.isEditingAmount ? "Enregistrer le montant" : "Choisir la méthode de recharge"}
          onPress={() => {
            if (state.isEditingAmount) {
              // Si on modifie le montant, retourner directement à la confirmation
              setState(prev => ({ ...prev, step: 'confirmation', isEditingAmount: false }));
            } else {
              // Sinon, continuer le flux normal
              setState(prev => ({ ...prev, showMethodModal: true }));
            }
          }}
          variant="gradient"
          size="lg"
          fullWidth
          disabled={!canProceed()}
        />
      </View>
    </VStack>
  );


  const renderPhoneStep = () => (
    <VStack spacing="lg">
      <Pressable
        onPress={() => setState(prev => ({ ...prev, showAddPhoneModal: true }))}
        style={[
          COMMON_STYLES.rowCenter,
          {
            backgroundColor: colors.surface,
            borderRadius: BORDER_RADIUS.lg,
            padding: SPACING.lg,
            borderWidth: 1,
            borderColor: colors.border,
          }
        ]}
      >
        <View style={[
          COMMON_STYLES.center,
          {
            width: 40,
            height: 40,
            backgroundColor: colors.success + '20',
            borderRadius: BORDER_RADIUS.md,
            marginRight: SPACING.md
          }
        ]}>
          <Plus size={20} color={colors.success} />
        </View>
        <Body>Ajouter un nouveau numéro {state.selectedMethod === 'mobile-money' ? 'Airtel Money' : ''}</Body>
      </Pressable>

      {state.phoneNumbers.length > 0 && (
        <VStack spacing="md">
          <Caption>Mes numéros de téléphone</Caption>
          {state.phoneNumbers.map((phone) => (
            <PhoneNumberCard
              key={phone.id}
              id={phone.id}
              number={phone.number}
              operator={phone.operator}
              selected={state.selectedPhoneId === phone.id}
              onPress={() => handlePhoneSelect(phone.id)}
            />
          ))}
        </VStack>
      )}
    </VStack>
  );

  const renderConfirmationStep = () => {
    const selectedPhone = state.phoneNumbers.find(p => p.id === state.selectedPhoneId);
    return (
      <VStack spacing="lg">
        {/* Récapitulatif */}
        <VStack spacing="xs">
          {/* Section Numéro */}
          <View style={[
            COMMON_STYLES.rowCenter,
            {
              backgroundColor: colors.error + '10',
              borderRadius: BORDER_RADIUS.lg,
              padding: SPACING.lg,
              marginBottom: 0,
            }
          ]}>
            <View style={[
              COMMON_STYLES.center,
              {
                width: 40,
                height: 40,
                backgroundColor: colors.error + '20',
                borderRadius: BORDER_RADIUS.md,
                marginRight: SPACING.md
              }
            ]}>
              <Text>📱</Text>
            </View>
            <VStack style={{ flex: 1 }}>
              <Body style={{ fontWeight: TYPOGRAPHY.weights.medium }}>{selectedPhone?.operator || 'airtel'}</Body>
              <Caption>{selectedPhone?.number || '066944200'}</Caption>
            </VStack>
            <Pressable onPress={handleEditNumber}>
              <Edit3 size={16} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Flèche vers le bas (plus petite) */}
          <View style={{ alignItems: 'center', margin: 0, padding: 0 }}>
            <ArrowDown size={16} color="#FF6B9D" style={{ margin: 0, padding: 0 }} />
          </View>

          {/* Section Wallet */}
          <View style={[
            COMMON_STYLES.rowCenter,
            {
              backgroundColor: colors.success + '10',
              borderRadius: BORDER_RADIUS.lg,
              padding: SPACING.lg,
              marginTop: 0,
            }
          ]}>
            <View style={[
              COMMON_STYLES.center,
              {
                width: 40,
                height: 40,
                backgroundColor: colors.success + '20',
                borderRadius: BORDER_RADIUS.md,
                marginRight: SPACING.md
              }
            ]}>
              <Wallet size={20} color={colors.success} />
            </View>
            <VStack style={{ flex: 1 }}>
              <Body style={{ fontWeight: TYPOGRAPHY.weights.medium }}>Portefeuille Juste</Body>
              <Caption>Solde actuel: {formatCurrencyWithConversion(0, getDisplayCurrency(), false)}</Caption>
            </VStack>
            <Pressable onPress={handleEditAmount}>
              <Edit3 size={16} color={colors.textSecondary} />
            </Pressable>
          </View>
        </VStack>

        {/* Espacement de 5px */}
        <View style={{ height: 0, backgroundColor: 'transparent' }} />

        {/* Section Montant séparée */}
        <View style={[
          COMMON_STYLES.rowCenter,
          {
            backgroundColor: colors.primary + '10',
            borderRadius: BORDER_RADIUS.lg,
            padding: SPACING.lg,
          }
        ]}>
          <View style={[
            COMMON_STYLES.center,
            {
              width: 40,
              height: 40,
              backgroundColor: colors.primary + '20',
              borderRadius: BORDER_RADIUS.md,
              marginRight: SPACING.md
            }
          ]}>
            <Text>💰</Text>
          </View>
          <VStack style={{ flex: 1 }}>
            <Body style={{ fontWeight: TYPOGRAPHY.weights.medium, color: colors.primary }}>
              {state.amount} {getDisplayCurrency()}
            </Body>
            <Caption>
              Votre compte Juste ({selectedPhone?.number || '066944200'}) sera débité de {' '}
              {getDisplayCurrency() !== 'XAF' 
                ? `${formatCurrencyWithConversion(convertToXAF(parseFloat(state.amount) || 0, getDisplayCurrency()), 'XAF', false)}`
                : `${state.amount} XAF`
              }
            </Caption>
          </VStack>
          <Pressable onPress={handleEditAmount}>
            <Edit3 size={16} color={colors.textSecondary} />
          </Pressable>
        </View>

        <Button
          title={`Recharger • ${state.amount} ${getDisplayCurrency()}`}
          onPress={handleRecharge}
          variant="gradient"
          size="lg"
          fullWidth
        />

        <Button
          title="Tester recharge réussie"
          onPress={handleTestRecharge}
          variant="outline"
          size="md"
          fullWidth
          style={{ marginTop: SPACING.md }}
        />
      </VStack>
    );
  };

  const getHeaderTitle = () => {
    switch (state.step) {
      case 'amount': return 'Entrer le montant à recharger';
      case 'method': return 'Méthode de recharge';
      case 'phone': return `Recharger par ${state.selectedOperator === 'airtel' ? 'Airtel' : 'MTN'} Money`;
      case 'confirmation': return 'Recharge';
      default: return 'Recharge';
    }
  };

  const handleBackPress = () => {
    switch (state.step) {
      case 'confirmation':
        // Depuis confirmation, retourner à la sélection de numéro
        setState(prev => ({ ...prev, step: 'phone' }));
        break;
      case 'phone':
        // Depuis sélection de numéro, retourner au montant
        setState(prev => ({ ...prev, step: 'amount', isEditingAmount: false }));
        break;
      case 'amount':
        // Depuis montant, comportement par défaut (sortir de la page)
        // Laisser le comportement par défaut du HeaderWithBackButton
        break;
      default:
        break;
    }
  };

  return (
    <GradientBackground style={{ flex: 1 }} opacity="10">
      <HeaderWithBackButton 
        title={getHeaderTitle()} 
        onBack={state.step !== 'amount' ? handleBackPress : undefined}
      />
      <PageContainer style={{ backgroundColor: 'transparent' }}>
        {state.step === 'amount' && renderAmountStep()}
        {state.step === 'phone' && renderPhoneStep()}
        {state.step === 'confirmation' && renderConfirmationStep()}
      </PageContainer>

      {/* Modal de sélection des méthodes */}
      <Modal
        visible={state.showMethodModal}
        transparent
        animationType="slide"
        onRequestClose={() => setState(prev => ({ ...prev, showMethodModal: false }))}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: BORDER_RADIUS.xl,
            borderTopRightRadius: BORDER_RADIUS.xl,
            paddingHorizontal: SPACING.md, // Même approche que notifications
            paddingVertical: SPACING.lg,
            maxHeight: '50%'
          }}>
            <Row justify="space-between" align="center" style={{ marginBottom: SPACING.lg }}>
              <Heading level={3} style={{ flex: 1, marginRight: SPACING.md }}>Choisir la méthode de recharge</Heading>
              <Pressable 
                onPress={() => setState(prev => ({ ...prev, showMethodModal: false }))}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: BORDER_RADIUS.full,
                  backgroundColor: colors.border,
                  borderWidth: 1,
                  borderColor: colors.textTertiary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: colors.shadow,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <X size={18} color={colors.textSecondary} />
              </Pressable>
            </Row>
            
            <Row spacing="sm" style={{ flexWrap: 'wrap' }}>
              {PAYMENT_METHODS.map((method) => (
                <PaymentMethodCard
                  key={method.id}
                  method={method}
                  selected={state.selectedMethod === method.id}
                  onPress={() => handleMethodSelect(method.id)}
                />
              ))}
            </Row>
          </View>
        </View>
      </Modal>

      {/* Modal de sélection d'opérateur */}
      <Modal
        visible={state.showOperatorModal}
        transparent
        animationType="slide"
        onRequestClose={() => setState(prev => ({ ...prev, showOperatorModal: false }))}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: BORDER_RADIUS.xl,
            borderTopRightRadius: BORDER_RADIUS.xl,
            paddingHorizontal: SPACING.md, // Même approche que notifications
            paddingVertical: SPACING.lg,
            maxHeight: '50%'
          }}>
            <Row justify="space-between" align="center" style={{ marginBottom: SPACING.lg }}>
              <Heading level={3}>Sélectionner l'opérateur</Heading>
              <Pressable 
                onPress={() => setState(prev => ({ ...prev, showOperatorModal: false }))}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: BORDER_RADIUS.full,
                  backgroundColor: colors.border,
                  borderWidth: 1,
                  borderColor: colors.textTertiary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: SPACING.sm,
                  shadowColor: colors.shadow,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <X size={18} color={colors.textSecondary} />
              </Pressable>
            </Row>
            
            <Row spacing="sm" style={{ flexWrap: 'wrap' }}>
              {state.selectedMethod && OPERATORS[state.selectedMethod as PaymentMethodId].map((operator) => (
                <OperatorCard
                  key={operator.id}
                  operator={operator}
                  selected={state.selectedOperator === operator.id}
                  onPress={() => handleOperatorSelect(operator.id)}
                />
              ))}
            </Row>
          </View>
        </View>
      </Modal>

      {/* Modal d'ajout de numéro */}
      <Modal
        visible={state.showAddPhoneModal}
        transparent
        animationType="slide"
        onRequestClose={() => setState(prev => ({ ...prev, showAddPhoneModal: false }))}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: BORDER_RADIUS.xl,
              borderTopRightRadius: BORDER_RADIUS.xl,
              paddingHorizontal: SPACING.md, // Même approche que notifications
              paddingVertical: SPACING.lg,
              paddingBottom: Platform.OS === 'ios' ? SPACING.lg : SPACING.xl,
              maxHeight: '80%'
            }}>
              <View style={{ marginBottom: SPACING.md }}>
                <Heading level={3} style={{ textAlign: 'center', paddingRight: 40 }}>Ajouter un nouveau numéro mobile</Heading>
                <Pressable 
                  onPress={() => setState(prev => ({ ...prev, showAddPhoneModal: false }))}
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: '#EF4444',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                    zIndex: 1000,
                  }}
                >
                  <X size={16} color="#FFFFFF" />
                </Pressable>
              </View>
              
              <VStack spacing="md">
                <Input
                  label="Numéro de téléphone"
                  placeholder="+242 066944200"
                  value={newPhoneNumber}
                  onChangeText={setNewPhoneNumber}
                  keyboardType="phone-pad"
                  variant="phone"
                  autoFocus={state.showAddPhoneModal}
                  gradientBorder={true}
                />
                
                <Input
                  label="Opérateur"
                  placeholder="juste"
                  value={newPhoneOperator}
                  onChangeText={setNewPhoneOperator}
                  gradientBorder={true}
                />
                
                <Button
                  title="Ajouter"
                  onPress={handleAddPhone}
                  variant="gradient"
                  size="lg"
                  fullWidth
                  disabled={!newPhoneNumber || !newPhoneOperator}
                />
              </VStack>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de succès standardisé */}
      <SuccessModal {...successModal.props} />
    </GradientBackground>
  );
}

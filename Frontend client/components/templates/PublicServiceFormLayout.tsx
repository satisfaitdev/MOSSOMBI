import React from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Animated,
  StyleSheet,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import Button from '@/components/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/constants/colors';

interface PublicServiceFormLayoutProps {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  children: React.ReactNode;
  loading: boolean;
  successModalVisible: boolean;
  successAnim: Animated.Value;
  checkAnim: Animated.Value;
  onSubmit: () => void;
  submitButtonText?: string;
  successMessage?: string;
}

/**
 * Template de formulaire pour les services publics
 * Utilisé pour: électricité, eau, internet, école, téléphone, loyer, documents
 */
export default function PublicServiceFormLayout({
  title,
  icon,
  iconColor,
  children,
  loading,
  successModalVisible,
  successAnim,
  checkAnim,
  onSubmit,
  submitButtonText = 'Confirmer le paiement',
  successMessage = 'Paiement effectué avec succès !',
}: PublicServiceFormLayoutProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <>
      <HeaderWithBackButton title={title} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
            {/* Icon */}
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: iconColor + '15',
                  borderRadius: BORDER_RADIUS.xl,
                },
              ]}
            >
              {icon}
            </View>

            {/* Form */}
            <View style={styles.form}>{children}</View>

            {/* Submit Button */}
            <Button
              title={submitButtonText}
              variant="gradient"
              size="lg"
              onPress={onSubmit}
              loading={loading}
              fullWidth
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      {/* Success Modal */}
      <Modal
        visible={successModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.successModal,
              {
                backgroundColor: colors.card,
                borderRadius: BORDER_RADIUS.xl,
                transform: [{ scale: successAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.successIconContainer}
            >
              <Animated.View
                style={{
                  opacity: checkAnim,
                  transform: [{ scale: checkAnim }],
                }}
              >
                <Check size={48} color="#FFFFFF" strokeWidth={3} />
              </Animated.View>
            </LinearGradient>

            <Text
              style={[
                styles.successTitle,
                {
                  color: colors.text,
                  fontSize: TYPOGRAPHY.sizes.xl,
                  fontWeight: TYPOGRAPHY.weights.bold,
                },
              ]}
            >
              Succès !
            </Text>

            <Text
              style={[
                styles.successMessage,
                {
                  color: colors.textSecondary,
                  fontSize: TYPOGRAPHY.sizes.sm,
                },
              ]}
            >
              {successMessage}
            </Text>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  iconContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: SPACING.xl,
  },
  form: {
    marginBottom: SPACING.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  successModal: {
    width: '100%',
    maxWidth: 320,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  successTitle: {
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  successMessage: {
    textAlign: 'center',
  },
});

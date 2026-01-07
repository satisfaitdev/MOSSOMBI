import React, { useEffect } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { CheckCircle, PartyPopper, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import BaseModal from './BaseModal';
import { Heading, Body } from '@/components/atoms';
import { Center, Stack } from '@/components/ui';
import Button from '@/components/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';

// ==========================================
// TYPES
// ==========================================

type AnimationType = 'checkmark' | 'confetti' | 'sparkles';

interface SuccessModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  animation?: AnimationType;
  buttonText?: string;
  buttonLabel?: string; // alias backward-compat
  autoClose?: boolean;
  autoCloseDuration?: number;
}

// ==========================================
// SUCCESS MODAL COMPONENT
// ==========================================

/**
 * SuccessModal - Modal de succès avec animations
 * 
 * @example Confirmation d'achat
 * <SuccessModal
 *   visible={showSuccess}
 *   onClose={() => setShowSuccess(false)}
 *   title="Commande confirmée !"
 *   message="Votre commande a été enregistrée avec succès. Vous recevrez un email de confirmation."
 *   animation="confetti"
 *   autoClose
 * />
 * 
 * @example Réservation réussie
 * <SuccessModal
 *   visible={show}
 *   onClose={onClose}
 *   title="Réservation confirmée"
 *   message="Votre réservation a été enregistrée."
 *   animation="checkmark"
 * />
 */
export default function SuccessModal({
  visible,
  onClose,
  title,
  message,
  animation = 'checkmark',
  buttonText = 'Parfait !',
  buttonLabel,
  autoClose = false,
  autoCloseDuration = 3000,
}: SuccessModalProps) {
  const { colors } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  // Animation d'entrée
  useEffect(() => {
    if (visible) {
      // Reset
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);

      // Animate
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-close
      if (autoClose) {
        const timer = setTimeout(() => {
          onClose();
        }, autoCloseDuration);
        return () => clearTimeout(timer);
      }
    }
  }, [visible, autoClose, autoCloseDuration]);

  // Rotation interpolation
  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Icône selon l'animation
  const getAnimationIcon = () => {
    const iconSize = 80;
    
    switch (animation) {
      case 'confetti':
        return <PartyPopper size={iconSize} color={colors.success} />;
      case 'sparkles':
        return <Sparkles size={iconSize} color={colors.warning} />;
      case 'checkmark':
      default:
        return <CheckCircle size={iconSize} color={colors.success} />;
    }
  };

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      size="sm"
      variant="bottom-sheet"
      showCloseButton={false}
    >
      <Center>
        <Stack spacing="lg" align="center">
          {/* Icône animée */}
          <Animated.View
            style={{
              transform: [
                { scale: scaleAnim },
                { rotate: animation === 'sparkles' ? rotation : '0deg' },
              ],
            }}
          >
            <LinearGradient
              colors={[colors.success + '20', colors.success + '10', 'transparent']}
              style={styles.iconContainer}
            >
              {getAnimationIcon()}
            </LinearGradient>
          </Animated.View>

          {/* Titre */}
          <Heading level={2} align="center">
            {title}
          </Heading>

          {/* Message */}
          <Body align="center" variant="secondary">
            {message}
          </Body>

          {/* Bouton */}
          {!autoClose && (
            <Button
              title={buttonLabel ?? buttonText}
              onPress={onClose}
              variant="success"
              size="lg"
              fullWidth
            />
          )}
        </Stack>
      </Center>
    </BaseModal>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

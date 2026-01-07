import React from 'react';
import { Modal, View, Pressable, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heading } from '@/components/atoms';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SPACING } from '@/constants/colors';

// ==========================================
// TYPES
// ==========================================

type ModalSize = 'sm' | 'md' | 'lg' | 'full';
type ModalVariant = 'default' | 'bottom-sheet' | 'center';

interface BaseModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: ModalSize;
  variant?: ModalVariant;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  footer?: React.ReactNode;
}

// ==========================================
// BASE MODAL COMPONENT
// ==========================================

/**
 * BaseModal - Modal universel réutilisable dans toute l'app
 * 
 * Remplace 30+ modaux custom pour uniformiser l'expérience
 * 
 * @example
 * <BaseModal
 *   visible={showModal}
 *   onClose={() => setShowModal(false)}
 *   title="Titre du modal"
 *   size="md"
 * >
 *   <Body>Contenu du modal</Body>
 * </BaseModal>
 * 
 * @example Bottom Sheet
 * <BaseModal
 *   visible={show}
 *   onClose={onClose}
 *   variant="bottom-sheet"
 *   title="Sélectionner"
 * >
 *   {content}
 * </BaseModal>
 */
export default function BaseModal({
  visible,
  onClose,
  title,
  children,
  size = 'md',
  variant = 'bottom-sheet',
  showCloseButton = true,
  closeOnBackdrop = true,
  footer,
}: BaseModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Dimensions selon la taille
  const getSizeStyles = () => {
    const { width, height } = Dimensions.get('window');
    
    switch (size) {
      case 'sm':
        return {
          width: Math.min(width * 0.8, 400),
          maxHeight: height * 0.5,
        };
      case 'md':
        return {
          width: Math.min(width * 0.9, 500),
          maxHeight: height * 0.7,
        };
      case 'lg':
        return {
          width: Math.min(width * 0.95, 700),
          maxHeight: height * 0.85,
        };
      case 'full':
        return {
          width: width,
          height: height,
        };
      default:
        return {
          width: Math.min(width * 0.9, 500),
          maxHeight: height * 0.7,
        };
    }
  };

  // Styles selon le variant
  const getVariantStyles = () => {
    const { width, height } = Dimensions.get('window');
    switch (variant) {
      case 'bottom-sheet':
        return {
          justifyContent: 'flex-end' as const,
          modalStyle: {
            width,
            height: height * 0.7, // Réduit de 85% à 70%
            borderTopLeftRadius: BORDER_RADIUS.xxl,
            borderTopRightRadius: BORDER_RADIUS.xxl,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          },
        };
      case 'center':
        return {
          justifyContent: 'center' as const,
          modalStyle: {
            ...getSizeStyles(),
            borderRadius: BORDER_RADIUS.xl,
          },
        };
      case 'default':
      default:
        return {
          justifyContent: 'center' as const,
          modalStyle: {
            ...getSizeStyles(),
            borderRadius: BORDER_RADIUS.xl,
          },
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <Modal
      visible={visible}
      transparent
      animationType={variant === 'bottom-sheet' ? 'slide' : 'fade'}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={[
          styles.backdrop,
          { justifyContent: variantStyles.justifyContent },
        ]}
        onPress={closeOnBackdrop ? onClose : undefined}
      >
        <Pressable
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.card,
              paddingTop: SPACING.md,
            },
            variantStyles.modalStyle,
          ]}
          onPress={(e) => e.stopPropagation()} // Empêche la fermeture en cliquant sur le contenu
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <View
              style={[
                styles.header,
                {
                  borderBottomColor: colors.border,
                  paddingHorizontal: SPACING.lg,
                  paddingBottom: SPACING.md,
                },
              ]}
            >
              {title && (
                <Heading level={3} style={{ flex: 1 }}>
                  {title}
                </Heading>
              )}
              
              {showCloseButton && (
                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [
                    styles.closeButton,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <X size={24} color={colors.text} />
                </Pressable>
              )}
            </View>
          )}

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={{
              padding: SPACING.lg,
              paddingBottom: footer ? SPACING.md : SPACING.lg,
            }}
            showsVerticalScrollIndicator={true}
          >
            {children}
          </ScrollView>

          {/* Footer */}
          {footer && (
            <View
              style={[
                styles.footer,
                {
                  borderTopColor: colors.border,
                  padding: SPACING.lg,
                  paddingBottom: insets.bottom + SPACING.lg,
                },
              ]}
            >
              {footer}
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
  },
  modalContainer: {
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  footer: {
    borderTopWidth: 1,
  },
});

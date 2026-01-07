import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react-native';
import BaseModal from './BaseModal';
import { Body } from '@/components/atoms';
import { Row } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';
import { ButtonGroupLayout } from '@/components/layouts';
import { ConfirmModalSpecificProps } from '@/types/modal';

// ==========================================
// TYPES UNIFIÉS (Migration Phase 3)
// ==========================================

interface ConfirmModalProps extends ConfirmModalSpecificProps {
  loading?: boolean;
}

// ==========================================
// CONFIRM MODAL COMPONENT
// ==========================================

/**
 * ConfirmModal - Modal de confirmation avec types visuels
 * 
 * @example Confirmation de suppression
 * <ConfirmModal
 *   visible={showConfirm}
 *   onClose={() => setShowConfirm(false)}
 *   onConfirm={handleDelete}
 *   title="Confirmer la suppression"
 *   message="Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible."
 *   type="danger"
 *   confirmText="Supprimer"
 *   cancelText="Annuler"
 * />
 * 
 * @example Confirmation simple
 * <ConfirmModal
 *   visible={show}
 *   onClose={onClose}
 *   onConfirm={onConfirm}
 *   title="Continuer ?"
 *   message="Voulez-vous continuer cette action ?"
 *   type="info"
 * />
 */
export default function ConfirmModal({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  loading = false,
}: ConfirmModalProps) {
  const { colors } = useTheme();

  // Icône et couleur selon le type
  const getTypeConfig = () => {
    switch (type) {
      case 'warning':
        return {
          icon: <AlertTriangle size={48} color={colors.warning} />,
          confirmVariant: 'primary' as const,
        };
      case 'danger':
        return {
          icon: <AlertCircle size={48} color={colors.error} />,
          confirmVariant: 'primary' as const,
        };
      case 'success':
        return {
          icon: <CheckCircle size={48} color={colors.success} />,
          confirmVariant: 'primary' as const,
        };
      case 'info':
      default:
        return {
          icon: <Info size={48} color={colors.info} />,
          confirmVariant: 'primary' as const,
        };
    }
  };

  const config = getTypeConfig();

  const handleConfirm = () => {
    onConfirm();
    if (!loading) {
      onClose();
    }
  };

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      title={title}
      size="sm"
      variant="bottom-sheet"
      closeOnBackdrop={!loading}
      footer={
        <ButtonGroupLayout
          actions={[
            {
              title: cancelText,
              onPress: onClose,
              variant: 'outline',
              disabled: loading,
            },
            {
              title: confirmText,
              onPress: handleConfirm,
              variant: config.confirmVariant,
              loading: loading,
            }
          ]}
          direction="horizontal"
          spacing="sm"
          variant="inline"
        />
      }
    >
      {/* Icône et Message */}
      <Row spacing="md" align="flex-start" style={{ marginBottom: SPACING.md }}>
        {config.icon}
        <Body style={{ flex: 1 }}>
          {message}
        </Body>
      </Row>
    </BaseModal>
  );
}

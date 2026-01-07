import React from 'react';
import BaseModal from './BaseModal';
import { ButtonGroupLayout } from '@/components/layouts';
import { FormModalProps as BaseFormModalProps } from '@/types/modal';

// ==========================================
// TYPES UNIFIÉS (Migration Phase 3)
// ==========================================

interface FormModalProps extends BaseFormModalProps {
  children: React.ReactNode;
  submitText?: string;
  submitLabel?: string; // alias backward-compat
  cancelText?: string;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'full';
  variant?: 'default' | 'bottom-sheet' | 'center';
}

// ==========================================
// FORM MODAL COMPONENT
// ==========================================

/**
 * FormModal - Modal avec formulaire et actions
 * 
 * @example Formulaire de contact
 * <FormModal
 *   visible={showForm}
 *   onClose={() => setShowForm(false)}
 *   onSubmit={handleSubmit}
 *   title="Nous contacter"
 *   submitText="Envoyer"
 *   loading={isSubmitting}
 * >
 *   <Stack spacing="md">
 *     <Input label="Nom" value={name} onChangeText={setName} required />
 *     <Input label="Email" value={email} onChangeText={setEmail} required />
 *     <Input 
 *       variant="textarea" 
 *       label="Message" 
 *       value={message} 
 *       onChangeText={setMessage}
 *       required 
 *     />
 *   </Stack>
 * </FormModal>
 * 
 * @example Formulaire de réservation
 * <FormModal
 *   visible={show}
 *   onClose={onClose}
 *   onSubmit={handleBook}
 *   title="Informations de réservation"
 *   variant="bottom-sheet"
 *   size="lg"
 * >
 *   {formContent}
 * </FormModal>
 */
export default function FormModal({
  visible,
  onClose,
  onSubmit,
  title,
  children,
  submitText = 'Valider',
  submitLabel,
  cancelText = 'Annuler',
  loading = false,
  size = 'md',
  variant = 'bottom-sheet',
}: FormModalProps) {
  const handleSubmit = () => {
    onSubmit();
  };

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      title={title}
      size={size}
      variant={variant}
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
              title: submitLabel ?? submitText,
              onPress: handleSubmit,
              variant: 'primary',
              loading: loading,
            }
          ]}
          direction="horizontal"
          spacing="sm"
          variant="inline"
        />
      }
    >
      {children}
    </BaseModal>
  );
}

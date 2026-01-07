import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';

interface UseSuccessModalOptions {
  /** Fermer automatiquement après 2s */
  autoClose?: boolean;
  /** Naviguer en arrière après fermeture */
  navigateBack?: boolean;
  /** Callback personnalisé après fermeture */
  onClose?: () => void;
}

interface SuccessModalState {
  visible: boolean;
  title: string;
  message: string;
  animation?: 'checkmark' | 'confetti' | 'sparkles';
  buttonText?: string;
}

/**
 * Hook standardisé pour gérer les modales de succès
 * Assure une cohérence dans toute l'application
 * 
 * @example
 * const successModal = useSuccessModal({ autoClose: true });
 * 
 * // Afficher la modale
 * successModal.show({
 *   title: 'Succès !',
 *   message: 'Opération réussie',
 *   animation: 'confetti'
 * });
 * 
 * // Dans le JSX
 * <SuccessModal {...successModal.props} />
 */
export function useSuccessModal(options: UseSuccessModalOptions = {}) {
  const router = useRouter();
  const [state, setState] = useState<SuccessModalState>({
    visible: false,
    title: '',
    message: '',
    animation: 'checkmark',
    buttonText: undefined,
  });

  const show = useCallback((config: Omit<SuccessModalState, 'visible'>) => {
    setState({
      visible: true,
      ...config,
    });
  }, []);

  const hide = useCallback(() => {
    setState(prev => ({ ...prev, visible: false }));
    
    // Exécuter les callbacks après fermeture
    if (options.onClose) {
      options.onClose();
    }
    
    if (options.navigateBack) {
      router.back();
    }
  }, [options, router]);

  return {
    show,
    hide,
    props: {
      visible: state.visible,
      title: state.title,
      message: state.message,
      animation: state.animation,
      buttonText: state.buttonText,
      autoClose: options.autoClose,
      onClose: hide,
    },
  };
}

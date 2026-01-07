/**
 * Types unifiés pour les modals - Mossombi
 * Élimine la duplication des interfaces Modal*Props
 */

// Interface de base pour tous les modals (pattern répété 8 fois)
export interface BaseModalProps {
  visible: boolean;
  onClose: () => void;
}

// Modal avec confirmation (pattern répété 4 fois)
export interface ConfirmModalProps extends BaseModalProps {
  onConfirm: () => void;
}

// Modal avec titre (pattern répété 6 fois)
export interface TitledModalProps extends BaseModalProps {
  title: string;
}

// Modal avec titre et confirmation
export interface TitledConfirmModalProps extends TitledModalProps {
  onConfirm: () => void;
}

// Types spécifiques pour les différents modals
export type ModalSize = 'sm' | 'md' | 'lg' | 'full';
export type ModalVariant = 'default' | 'bottom-sheet' | 'center';
export type ConfirmType = 'warning' | 'danger' | 'info' | 'success';
export type AnimationType = 'checkmark' | 'confetti' | 'sparkles';

// Interfaces spécialisées (héritent des bases)
export interface ProductDetailModalProps extends BaseModalProps {
  product: any | null;
  onAddToCart: (productId: string) => void;
  productIcon: React.ReactNode;
  quantity?: number;
}

export interface CartModalProps extends BaseModalProps {
  cart: { [key: string]: number };
  products: any[];
  onAddToCart: (productId: string) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  productIcon: React.ReactNode;
}

export interface CheckoutModalProps extends BaseModalProps {
  cart: { [key: string]: number };
  products: any[];
  onConfirm: (paymentMethod: 'full' | 'installment', deliveryOption: string) => void;
}

export interface BookingModalProps extends ConfirmModalProps {
  // Hérite de visible, onClose, onConfirm
}

export interface ModalHeaderProps extends BaseModalProps {
  title: string;
  animateOnMount?: boolean;
}

export interface FormModalProps extends TitledConfirmModalProps {
  onSubmit: () => void;
}

export interface SuccessModalProps extends TitledModalProps {
  message: string;
  animation?: AnimationType;
  duration?: number;
}

export interface ConfirmModalSpecificProps extends TitledConfirmModalProps {
  message: string;
  type?: ConfirmType;
  confirmText?: string;
  cancelText?: string;
}

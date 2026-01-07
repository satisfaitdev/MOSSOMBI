import { useState } from 'react';

interface PurchaseItem {
  id: string;
  name: string;
  price: number;
}

/**
 * Hook personnalisé pour gérer le flux d'achat (modal + succès)
 * 
 * @example
 * const {
 *   showModal,
 *   showSuccess,
 *   selectedItem,
 *   handlePurchase,
 *   handleSubmit,
 *   closeModal,
 *   closeSuccess
 * } = usePurchaseFlow<CoinService>({
 *   onPurchase: (item) => console.log('Purchased:', item)
 * });
 */
export function usePurchaseFlow<T extends PurchaseItem>(options?: {
  onPurchase?: (item: T) => void;
  successDelay?: number;
}) {
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  const handlePurchase = (item: T) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!selectedItem) return;

    // Log de l'achat
    console.log('Achat:', {
      item: selectedItem,
      price: selectedItem.price,
      date: new Date().toISOString(),
    });

    // Callback personnalisé
    if (options?.onPurchase) {
      options.onPurchase(selectedItem);
    }

    // Fermer le modal d'achat
    setShowModal(false);

    // Ouvrir le modal de succès après un délai
    setTimeout(() => {
      setShowSuccess(true);
    }, options?.successDelay || 300);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  const closeSuccess = () => {
    setShowSuccess(false);
  };

  return {
    showModal,
    showSuccess,
    selectedItem,
    handlePurchase,
    handleSubmit,
    closeModal,
    closeSuccess,
  };
}

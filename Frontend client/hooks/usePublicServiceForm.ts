import { useState } from 'react';
import { Animated } from 'react-native';

interface UsePublicServiceFormProps {
  onSuccess?: () => void;
  successDuration?: number;
}

/**
 * Hook partagé pour les formulaires de services publics
 * Gère: loading, modal de succès, animations, reset
 */
export function usePublicServiceForm({
  onSuccess,
  successDuration = 2500,
}: UsePublicServiceFormProps = {}) {
  const [loading, setLoading] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successAnim] = useState(new Animated.Value(0));
  const [checkAnim] = useState(new Animated.Value(0));

  const handleSubmit = (
    formData: Record<string, string>,
    resetForm: () => void
  ) => {
    // Validation
    const emptyFields = Object.entries(formData).filter(
      ([key, value]) => !value && key !== 'optional'
    );

    if (emptyFields.length > 0) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);

    // Simuler l'envoi
    setTimeout(() => {
      setLoading(false);
      setSuccessModalVisible(true);

      // Animation de succès
      Animated.sequence([
        Animated.spring(successAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(checkAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Fermer et reset
      setTimeout(() => {
        setSuccessModalVisible(false);
        resetForm();
        successAnim.setValue(0);
        checkAnim.setValue(0);
        onSuccess?.();
      }, successDuration);
    }, 2000);
  };

  return {
    loading,
    successModalVisible,
    successAnim,
    checkAnim,
    handleSubmit,
  };
}

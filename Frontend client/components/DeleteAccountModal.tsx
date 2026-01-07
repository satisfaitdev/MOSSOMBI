import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';
import { Body } from '@/components/atoms';
import { Stack, Row } from '@/components/ui';
import Button from '@/components/Button';
import Input from '@/components/Input';
import BaseModal from '@/components/organisms/modals/BaseModal';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  visible,
  onClose,
  onConfirm,
}) => {
  const { colors } = useTheme();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleConfirm = async () => {
    if (!password.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre mot de passe');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(password);
      setPassword('');
      onClose();
    } catch (error) {
      Alert.alert(
        'Erreur',
        error instanceof Error ? error.message : 'Erreur lors de la suppression du compte'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setShowPassword(false);
    onClose();
  };

  const footer = (
    <Row spacing="md">
      <Button
        title="Annuler"
        variant="outline"
        onPress={handleClose}
        disabled={isLoading}
        style={{ flex: 1 }}
      />

      <Button
        title="Supprimer"
        variant="danger"
        onPress={handleConfirm}
        disabled={isLoading || !password.trim()}
        loading={isLoading}
        style={{ flex: 1 }}
      />
    </Row>
  );

  return (
    <BaseModal
      visible={visible}
      onClose={handleClose}
      title="Supprimer le compte"
      variant="bottom-sheet"
      size="sm"
      footer={footer}
    >
      <Stack spacing="lg">
        {/* Icône d'avertissement */}
        <View style={{ alignItems: 'center', marginBottom: SPACING.md }}>
          <AlertTriangle size={48} color={colors.error} />
        </View>

        {/* Message d'avertissement */}
        <Body style={{ 
          textAlign: 'center', 
          color: colors.error,
          lineHeight: 22,
          fontSize: 16
        }}>
          ⚠️ Cette action est irréversible. Toutes vos données seront définitivement supprimées.
        </Body>

        {/* Label */}
        <Body style={{ color: colors.text, fontWeight: '500', marginTop: SPACING.md }}>
          Confirmez en saisissant votre mot de passe :
        </Body>

        {/* Champ de mot de passe */}
        <View style={{ position: 'relative' }}>
          <Input
            placeholder="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            editable={!isLoading}
          />
          <Button
            variant="ghost"
            size="sm"
            title={showPassword ? "👁️" : "👁️‍🗨️"}
            onPress={() => setShowPassword(!showPassword)}
            disabled={isLoading}
            style={{
              position: 'absolute',
              right: 8,
              top: 8,
              width: 40,
              height: 40,
            }}
          />
        </View>
      </Stack>
    </BaseModal>
  );
};

export default DeleteAccountModal;

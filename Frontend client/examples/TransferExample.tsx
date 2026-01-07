/**
 * EXEMPLE D'INTÉGRATION - TRANSFERT D'ARGENT
 * Montre comment utiliser l'authentification biométrique
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { AuthHelpers } from '@/utils/authMiddleware';

export default function TransferExample() {
  const [isLoading, setIsLoading] = useState(false);

  const handleTransfer = async () => {
    try {
      setIsLoading(true);

      // 1. Authentification biométrique AVANT la transaction
      const isAuthorized = await AuthHelpers.validateTransaction(
        50000,    // Montant
        'XAF',    // Devise
        'Marie'   // Destinataire
      );

      if (!isAuthorized) {
        Alert.alert('Transfert annulé', 'Authentification requise');
        return;
      }

      // 2. Effectuer la transaction (API call)
      console.log('💸 Transfert autorisé et en cours...');
      
      // Simuler l'appel API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert('✅ Succès', 'Transfert effectué avec succès');

    } catch (error) {
      Alert.alert('❌ Erreur', 'Échec du transfert');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>
        Transfert d'Argent
      </Text>
      
      <TouchableOpacity
        onPress={handleTransfer}
        disabled={isLoading}
        style={{
          backgroundColor: isLoading ? '#ccc' : '#007AFF',
          padding: 15,
          borderRadius: 8,
          alignItems: 'center'
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          {isLoading ? 'Transfert en cours...' : 'Envoyer 50 000 XAF à Marie'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

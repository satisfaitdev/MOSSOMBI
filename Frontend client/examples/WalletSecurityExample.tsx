/**
 * EXEMPLE - SÉCURISATION DU PORTEFEUILLE
 * Authentification biométrique pour accéder au portefeuille
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthHelpers } from '@/utils/authMiddleware';
import { usePrivacySettings } from '@/hooks/usePrivacySettings';

export default function SecureWalletAccess() {
  const router = useRouter();
  const { settings } = usePrivacySettings();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Vérifier l'authentification au chargement
    checkWalletAccess();
  }, []);

  const checkWalletAccess = async () => {
    try {
      setIsLoading(true);

      // Si la biométrie est désactivée, accès direct
      if (!settings.biometricAuth) {
        setIsAuthenticated(true);
        return;
      }

      // Demander l'authentification biométrique
      const isAuthorized = await AuthHelpers.validateWalletAccess();
      
      if (isAuthorized) {
        setIsAuthenticated(true);
      } else {
        // Retour à l'écran précédent si authentification échouée
        router.back();
      }

    } catch (error) {
      console.error('❌ Erreur authentification portefeuille:', error);
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setIsAuthenticated(false);
    checkWalletAccess();
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>🔐 Authentification en cours...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 24, marginBottom: 20 }}>🔒 Accès Sécurisé</Text>
        <Text style={{ textAlign: 'center', marginBottom: 30 }}>
          Votre portefeuille est protégé par l'authentification biométrique
        </Text>
        
        <TouchableOpacity
          onPress={handleRetry}
          style={{
            backgroundColor: '#007AFF',
            paddingHorizontal: 30,
            paddingVertical: 15,
            borderRadius: 25
          }}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
            Authentifier avec Face ID
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Contenu du portefeuille (authentifié)
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>💰 Portefeuille Mossombi</Text>
      
      <View style={{ backgroundColor: '#f0f0f0', padding: 20, borderRadius: 10, marginBottom: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Solde Principal</Text>
        <Text style={{ fontSize: 32, color: '#007AFF' }}>125 000 XAF</Text>
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: '#34C759',
          padding: 15,
          borderRadius: 8,
          marginBottom: 10
        }}
        onPress={async () => {
          // Exemple : Envoi d'argent avec authentification
          const authorized = await AuthHelpers.validateTransaction(50000, 'XAF', 'Marie');
          if (authorized) {
            Alert.alert('✅ Succès', 'Transfert autorisé');
          }
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          💸 Envoyer de l'Argent
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          backgroundColor: '#FF9500',
          padding: 15,
          borderRadius: 8
        }}
        onPress={async () => {
          // Exemple : Retrait avec authentification
          const authorized = await AuthHelpers.validateWithdrawal(25000, 'XAF');
          if (authorized) {
            Alert.alert('✅ Succès', 'Retrait autorisé');
          }
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          🏧 Retirer de l'Argent
        </Text>
      </TouchableOpacity>
    </View>
  );
}

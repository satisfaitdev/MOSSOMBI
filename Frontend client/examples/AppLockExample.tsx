/**
 * EXEMPLE D'INTÉGRATION - VERROUILLAGE D'APP
 * Authentification au démarrage et après inactivité
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, AppState } from 'react-native';
import { AuthHelpers } from '@/utils/authMiddleware';

export default function AppLockExample() {
  const [isLocked, setIsLocked] = useState(false);
  const [lastActiveTime, setLastActiveTime] = useState(Date.now());

  // Timeout d'inactivité (5 minutes)
  const INACTIVITY_TIMEOUT = 5 * 60 * 1000;

  useEffect(() => {
    // Vérifier au démarrage
    checkAppAccess();

    // Écouter les changements d'état de l'app
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // App redevient active
        const timeSinceLastActive = Date.now() - lastActiveTime;
        if (timeSinceLastActive > INACTIVITY_TIMEOUT) {
          setIsLocked(true);
        }
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App passe en arrière-plan
        setLastActiveTime(Date.now());
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [lastActiveTime]);

  const checkAppAccess = async () => {
    const isAuthorized = await AuthHelpers.validateAppAccess();
    setIsLocked(!isAuthorized);
  };

  const handleUnlock = async () => {
    const isAuthorized = await AuthHelpers.validateAppAccess();
    if (isAuthorized) {
      setIsLocked(false);
      setLastActiveTime(Date.now());
    }
  };

  if (isLocked) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#000',
        padding: 20
      }}>
        <Text style={{ 
          color: 'white', 
          fontSize: 24, 
          textAlign: 'center',
          marginBottom: 30
        }}>
          🔒 Mossombi Verrouillé
        </Text>
        
        <TouchableOpacity
          onPress={handleUnlock}
          style={{
            backgroundColor: '#007AFF',
            paddingHorizontal: 30,
            paddingVertical: 15,
            borderRadius: 25
          }}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
            Déverrouiller avec Face ID
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // App déverrouillée - afficher le contenu normal
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 18 }}>
        ✅ Application déverrouillée
      </Text>
      <Text style={{ marginTop: 10, color: '#666' }}>
        L'app se verrouillera automatiquement après 5 minutes d'inactivité
      </Text>
    </View>
  );
}

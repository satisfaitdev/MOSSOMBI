#!/usr/bin/env node
/**
 * 🧪 SCRIPT DE TEST - REFRESH TOKEN
 * Test pour vérifier que le système de refresh token fonctionne correctement
 */

const API_BASE_URL = 'http://192.168.152.240:3000/api/v1';

// Simuler AsyncStorage pour Node.js
const mockStorage = new Map();
const AsyncStorage = {
  getItem: async (key) => mockStorage.get(key) || null,
  setItem: async (key, value) => mockStorage.set(key, value),
  removeItem: async (key) => mockStorage.delete(key),
};

class TokenTester {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.refreshPromise = null;
  }

  async testConcurrentRefresh() {
    console.log('🧪 Test de refresh token concurrent...\n');

    // Simuler des tokens expirés
    await AsyncStorage.setItem('auth_token', 'expired_token_123');
    await AsyncStorage.setItem('refresh_token', 'valid_refresh_token_456');

    // Simuler plusieurs appels simultanés
    const promises = [
      this.simulateApiCall('/notifications/send/email'),
      this.simulateApiCall('/notifications/send/sms'),
      this.simulateApiCall('/notifications/send/whatsapp'),
    ];

    try {
      const results = await Promise.all(promises);
      console.log('✅ Tous les appels terminés:', results.length);
    } catch (error) {
      console.error('❌ Erreur lors des appels:', error.message);
    }
  }

  async simulateApiCall(endpoint) {
    console.log(`📡 Appel API: ${endpoint}`);
    
    // Simuler une erreur 401
    const mockResponse = {
      ok: false,
      status: 401,
      json: async () => ({ error: 'Token invalide ou expiré' })
    };

    // Simuler le refresh
    if (mockResponse.status === 401) {
      console.log('🔄 Token expiré, tentative de refresh...');
      const newToken = await this.refreshToken();
      
      if (newToken) {
        console.log(`✅ ${endpoint} - Nouveau token obtenu`);
        return { success: true, endpoint };
      } else {
        console.log(`❌ ${endpoint} - Refresh échoué`);
        return { success: false, endpoint };
      }
    }
  }

  async refreshToken() {
    // Si un refresh est déjà en cours, attendre le résultat
    if (this.refreshPromise) {
      console.log('🔄 Refresh token déjà en cours, attente...');
      return this.refreshPromise;
    }

    // Créer une nouvelle promesse de refresh
    this.refreshPromise = this.performRefresh();
    
    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      // Nettoyer la promesse une fois terminée
      this.refreshPromise = null;
    }
  }

  async performRefresh() {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (!refreshToken) return null;

      console.log('🔄 Exécution du refresh token...');
      
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Simuler une réponse réussie
      const newToken = `new_token_${Date.now()}`;
      await AsyncStorage.setItem('auth_token', newToken);
      
      console.log('✅ Token refresh réussi');
      return newToken;
    } catch (error) {
      console.error('Erreur refresh token:', error);
      return null;
    }
  }
}

// Exécuter le test
async function runTest() {
  const tester = new TokenTester();
  await tester.testConcurrentRefresh();
  
  console.log('\n🎯 Test terminé !');
  console.log('📋 Vérifiez que les logs montrent un seul refresh pour plusieurs appels.');
}

runTest().catch(console.error);

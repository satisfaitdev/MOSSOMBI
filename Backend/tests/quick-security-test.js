/**
 * TEST RAPIDE DE SÉCURITÉ - EXÉCUTION MANUELLE
 * Tests simples pour vérifier immédiatement la sécurité
 */

import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/v1';

console.log('🔥 TESTS DE SÉCURITÉ MOSSOMBI - DÉMARRAGE\n');

// Test 1: Force Brute OTP
async function testBruteForce() {
  console.log('🔥 TEST 1: Force Brute OTP');
  
  try {
    // Créer un compte test
    await axios.post(`${API_BASE}/auth/register`, {
      phone: '+242066999001',
      full_name: 'Test Security',
      password: 'TestSecurity123!',
      country_code: 'CG'
    });

    // Tenter 6 codes OTP incorrects
    for (let i = 0; i < 6; i++) {
      try {
        await axios.post(`${API_BASE}/auth/verify-otp`, {
          phone: '+242066999001',
          otp_code: '000000'
        });
      } catch (error) {
        console.log(`   Tentative ${i + 1}: ${error.response?.status} - ${error.response?.data?.error}`);
        
        if (error.response?.data?.code === 'ACCOUNT_BLOCKED') {
          console.log('   ✅ COMPTE BLOQUÉ - Sécurité OK');
          break;
        }
      }
    }
  } catch (error) {
    console.log('   ❌ Erreur:', error.message);
  }
}

// Test 2: Rate Limiting
async function testRateLimit() {
  console.log('\n🚫 TEST 2: Rate Limiting');
  
  let blocked = false;
  
  for (let i = 0; i < 25; i++) {
    try {
      await axios.get(`${API_BASE}/auth/check-phone?phone=%2B242066${String(i).padStart(6, '0')}`);
      console.log(`   Requête ${i + 1}: OK`);
    } catch (error) {
      if (error.response?.status === 429) {
        console.log(`   Requête ${i + 1}: ✅ BLOQUÉE (Rate Limit)`);
        blocked = true;
        break;
      }
    }
  }
  
  if (!blocked) {
    console.log('   ❌ Rate Limiting non déclenché');
  }
}

// Test 3: Mots de passe faibles
async function testWeakPasswords() {
  console.log('\n🔐 TEST 3: Mots de Passe Faibles');
  
  const weakPasswords = ['123456', 'password', 'Test123'];
  
  for (const [index, password] of weakPasswords.entries()) {
    try {
      await axios.post(`${API_BASE}/auth/register`, {
        phone: `+242066888${String(index).padStart(3, '0')}`,
        full_name: 'Test Weak',
        password,
        country_code: 'CG'
      });
      console.log(`   "${password}": ❌ ACCEPTÉ (Vulnérabilité)`);
    } catch (error) {
      console.log(`   "${password}": ✅ REJETÉ`);
    }
  }
}

// Exécuter tous les tests
async function runTests() {
  await testBruteForce();
  await testRateLimit();
  await testWeakPasswords();
  
  console.log('\n🎯 TESTS TERMINÉS');
  console.log('📊 Vérifiez les logs du serveur pour l\'audit complet');
}

runTests().catch(console.error);

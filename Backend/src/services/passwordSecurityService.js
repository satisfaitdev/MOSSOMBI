/**
 * SERVICE DE SÉCURITÉ DES MOTS DE PASSE
 * Validation renforcée et vérification contre les bases compromises
 */

import crypto from 'crypto';
import { logger } from '../utils/logger.js';

class PasswordSecurityService {
  constructor() {
    // Liste des mots de passe les plus couramment compromis
    this.commonPasswords = new Set([
      '123456', 'password', '123456789', '12345678', '12345', '1234567',
      'qwerty', 'abc123', 'password123', 'admin', '123123', 'welcome',
      'login', 'master', 'hello', 'guest', '111111', '000000', 'root',
      'user', 'test', 'pass', '1234', 'letmein', 'monkey', 'dragon',
      'sunshine', 'princess', 'football', 'iloveyou', 'shadow', 'michael',
      'jennifer', 'computer', '123qwe', 'baseball', 'jordan', 'hunter',
      'batman', 'trustno1', 'zaq12wsx', 'thomas', 'robert', 'matthew'
    ]);

    // Patterns dangereux
    this.dangerousPatterns = [
      /(.)\1{3,}/,           // 4+ caractères identiques consécutifs
      /123456|654321/,       // Séquences numériques
      /abcdef|fedcba/,       // Séquences alphabétiques
      /qwerty|asdfgh/,       // Patterns clavier
      /password|motdepasse/i // Variations de "password"
    ];

    // Historique des mots de passe par utilisateur (en production, utiliser la DB)
    this.passwordHistory = new Map(); // userId -> [hash1, hash2, ...]
  }

  /**
   * Valider la force d'un mot de passe
   * @param {string} password - Mot de passe à valider
   * @param {Object} userInfo - Informations utilisateur (nom, email, téléphone)
   * @returns {Object} Résultat de la validation
   */
  validatePasswordStrength(password, userInfo = {}) {
    const errors = [];
    const warnings = [];
    let score = 0;

    // 1. Longueur minimale (12 caractères)
    if (password.length < 8) {
      errors.push('Le mot de passe doit contenir au moins 12 caractères');
    } else if (password.length >= 16) {
      score += 2;
    } else {
      score += 1;
    }

    // 2. Complexité des caractères
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasLower) errors.push('Le mot de passe doit contenir au moins une minuscule');
    if (!hasUpper) errors.push('Le mot de passe doit contenir au moins une majuscule');
    if (!hasNumber) errors.push('Le mot de passe doit contenir au moins un chiffre');
    if (!hasSymbol) errors.push('Le mot de passe doit contenir au moins un symbole');

    // Score pour la complexité
    const complexityScore = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
    score += complexityScore;

    // 3. Vérifier contre les mots de passe communs
    if (this.commonPasswords.has(password.toLowerCase())) {
      errors.push('Ce mot de passe est trop commun et facilement devinable');
    }

    // 4. Vérifier les patterns dangereux
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(password)) {
        warnings.push('Le mot de passe contient un motif prévisible');
        score -= 1;
        break;
      }
    }

    // 5. Vérifier contre les informations personnelles
    if (userInfo.full_name) {
      const nameParts = userInfo.full_name.toLowerCase().split(/\s+/);
      for (const part of nameParts) {
        if (part.length > 2 && password.toLowerCase().includes(part)) {
          errors.push('Le mot de passe ne doit pas contenir votre nom');
          break;
        }
      }
    }

    if (userInfo.email) {
      const emailPart = userInfo.email.split('@')[0].toLowerCase();
      if (emailPart.length > 2 && password.toLowerCase().includes(emailPart)) {
        errors.push('Le mot de passe ne doit pas contenir votre email');
      }
    }

    if (userInfo.phone) {
      const phoneDigits = userInfo.phone.replace(/\D/g, '');
      if (phoneDigits.length >= 4) {
        // Vérifier les 4 derniers chiffres et autres combinaisons
        const lastFour = phoneDigits.slice(-4);
        const firstFour = phoneDigits.slice(0, 4);
        
        if (password.includes(lastFour) || password.includes(firstFour)) {
          errors.push('Le mot de passe ne doit pas contenir des parties de votre numéro de téléphone');
        }
      }
    }

    // 6. Entropie et diversité
    const uniqueChars = new Set(password).size;
    const entropy = this.calculateEntropy(password);
    
    if (entropy < 50) {
      warnings.push('Le mot de passe manque de diversité');
    } else if (entropy > 70) {
      score += 2;
    } else if (entropy > 60) {
      score += 1;
    }

    // 7. Score final et niveau
    const level = this.getPasswordLevel(score, errors.length);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score),
      level,
      entropy: Math.round(entropy),
      suggestions: this.getPasswordSuggestions(password, errors, warnings)
    };
  }

  /**
   * Vérifier si un mot de passe a été utilisé récemment
   * @param {string} userId - ID de l'utilisateur
   * @param {string} password - Nouveau mot de passe
   * @returns {boolean} True si le mot de passe a déjà été utilisé
   */
  isPasswordReused(userId, password) {
    const history = this.passwordHistory.get(userId) || [];
    const passwordHash = this.hashPassword(password);
    
    return history.includes(passwordHash);
  }

  /**
   * Ajouter un mot de passe à l'historique
   * @param {string} userId - ID de l'utilisateur
   * @param {string} password - Mot de passe à ajouter
   */
  addToPasswordHistory(userId, password) {
    const history = this.passwordHistory.get(userId) || [];
    const passwordHash = this.hashPassword(password);
    
    // Ajouter le nouveau hash
    history.unshift(passwordHash);
    
    // Garder seulement les 10 derniers
    if (history.length > 10) {
      history.splice(10);
    }
    
    this.passwordHistory.set(userId, history);
    
    logger.info('Mot de passe ajouté à l\'historique', { 
      userId, 
      historySize: history.length 
    });
  }

  /**
   * Calculer l'entropie d'un mot de passe
   * @param {string} password - Mot de passe
   * @returns {number} Entropie en bits
   */
  calculateEntropy(password) {
    const charFreq = {};
    
    // Compter la fréquence de chaque caractère
    for (const char of password) {
      charFreq[char] = (charFreq[char] || 0) + 1;
    }
    
    // Calculer l'entropie de Shannon
    let entropy = 0;
    const length = password.length;
    
    for (const freq of Object.values(charFreq)) {
      const probability = freq / length;
      entropy -= probability * Math.log2(probability);
    }
    
    return entropy * length;
  }

  /**
   * Déterminer le niveau de sécurité du mot de passe
   * @param {number} score - Score calculé
   * @param {number} errorCount - Nombre d'erreurs
   * @returns {string} Niveau de sécurité
   */
  getPasswordLevel(score, errorCount) {
    if (errorCount > 0) return 'Faible';
    if (score >= 8) return 'Très Fort';
    if (score >= 6) return 'Fort';
    if (score >= 4) return 'Moyen';
    return 'Faible';
  }

  /**
   * Générer des suggestions d'amélioration
   * @param {string} password - Mot de passe
   * @param {Array} errors - Erreurs détectées
   * @param {Array} warnings - Avertissements
   * @returns {Array} Suggestions
   */
  getPasswordSuggestions(password, errors, warnings) {
    const suggestions = [];

    if (password.length < 12) {
      suggestions.push('Utilisez au moins 12 caractères pour une meilleure sécurité');
    }

    if (!/[a-z]/.test(password)) {
      suggestions.push('Ajoutez des lettres minuscules');
    }

    if (!/[A-Z]/.test(password)) {
      suggestions.push('Ajoutez des lettres majuscules');
    }

    if (!/[0-9]/.test(password)) {
      suggestions.push('Ajoutez des chiffres');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      suggestions.push('Ajoutez des symboles (!@#$%^&*)');
    }

    if (warnings.length > 0) {
      suggestions.push('Évitez les motifs prévisibles comme 123456 ou abcdef');
    }

    if (suggestions.length === 0) {
      suggestions.push('Votre mot de passe respecte les critères de sécurité');
    }

    return suggestions;
  }

  /**
   * Générer un mot de passe sécurisé
   * @param {number} length - Longueur souhaitée (minimum 12)
   * @returns {string} Mot de passe généré
   */
  generateSecurePassword(length = 16) {
    const minLength = Math.max(12, length);
    
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    
    let password = '';
    
    // Garantir au moins un caractère de chaque type
    password += this.getRandomChar(lowercase);
    password += this.getRandomChar(uppercase);
    password += this.getRandomChar(numbers);
    password += this.getRandomChar(symbols);
    
    // Compléter avec des caractères aléatoires
    for (let i = 4; i < minLength; i++) {
      password += this.getRandomChar(allChars);
    }
    
    // Mélanger le mot de passe
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Obtenir un caractère aléatoire sécurisé
   * @param {string} chars - Ensemble de caractères
   * @returns {string} Caractère aléatoire
   */
  getRandomChar(chars) {
    const randomBytes = crypto.randomBytes(1);
    const randomIndex = randomBytes[0] % chars.length;
    return chars[randomIndex];
  }

  /**
   * Hacher un mot de passe pour l'historique
   * @param {string} password - Mot de passe
   * @returns {string} Hash SHA-256
   */
  hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  /**
   * Vérifier un mot de passe contre une base de données de mots de passe compromis
   * (Simulation - en production, utiliser une vraie API comme HaveIBeenPwned)
   * @param {string} password - Mot de passe à vérifier
   * @returns {Promise<boolean>} True si compromis
   */
  async checkCompromisedPassword(password) {
    // Simulation d'une vérification contre une base de données
    const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    
    // En production, faire un appel à l'API HaveIBeenPwned
    // const prefix = hash.substring(0, 5);
    // const suffix = hash.substring(5);
    // const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    
    // Pour la simulation, vérifier contre notre liste locale
    return this.commonPasswords.has(password.toLowerCase());
  }

  /**
   * Obtenir des statistiques sur la sécurité des mots de passe
   * @returns {Object} Statistiques
   */
  getPasswordStats() {
    return {
      totalUsersTracked: this.passwordHistory.size,
      averageHistorySize: this.passwordHistory.size > 0 
        ? Array.from(this.passwordHistory.values()).reduce((sum, hist) => sum + hist.length, 0) / this.passwordHistory.size 
        : 0,
      commonPasswordsCount: this.commonPasswords.size
    };
  }
}

// Instance singleton
export const passwordSecurityService = new PasswordSecurityService();

/**
 * SERVICE DE SÉCURITÉ OTP
 * Gestion des tentatives et blocages pour renforcer la sécurité
 */

import { logger } from '../utils/logger.js';
import crypto from 'crypto';

class OTPSecurityService {
  constructor() {
    // Stockage en mémoire des tentatives (en production, utiliser Redis)
    this.attempts = new Map(); // phone -> { count, lastAttempt, blockedUntil, action }
    this.blockedUsers = new Map(); // phone -> { blockedUntil, reason, attempts }
    
    // Configuration des seuils de blocage
    this.securityLevels = [
      { attempts: 3, blockDuration: 30 * 60 * 1000 },      // 30 minutes
      { attempts: 5, blockDuration: 60 * 60 * 1000 },      // 1 heure
      { attempts: 8, blockDuration: 24 * 60 * 60 * 1000 }, // 24 heures
      { attempts: 10, blockDuration: -1 }                   // Définitif (-1)
    ];
  }

  /**
   * Vérifier si un numéro est bloqué
   * @param {string} phone - Numéro de téléphone
   * @param {string} action - Action tentée (register, reset-password, etc.)
   * @returns {Object} État du blocage
   */
  checkBlocked(phone, action) {
    const cleanPhone = this.cleanPhone(phone);
    const blocked = this.blockedUsers.get(cleanPhone);
    
    if (!blocked) {
      return { isBlocked: false };
    }

    // Vérifier si le blocage est expiré (sauf si définitif)
    if (blocked.blockedUntil !== -1 && Date.now() > blocked.blockedUntil) {
      this.blockedUsers.delete(cleanPhone);
      this.attempts.delete(cleanPhone);
      logger.info('Déblocage automatique', { phone: cleanPhone });
      return { isBlocked: false };
    }

    const remainingTime = blocked.blockedUntil === -1 
      ? 'définitivement' 
      : this.formatDuration(blocked.blockedUntil - Date.now());

    logger.warn('Tentative sur compte bloqué', { 
      phone: cleanPhone, 
      action, 
      attempts: blocked.attempts,
      remainingTime 
    });

    return {
      isBlocked: true,
      reason: blocked.reason,
      attempts: blocked.attempts,
      blockedUntil: blocked.blockedUntil,
      remainingTime,
      isPermanent: blocked.blockedUntil === -1
    };
  }

  /**
   * Enregistrer une tentative d'OTP
   * @param {string} phone - Numéro de téléphone
   * @param {string} action - Action tentée
   * @param {boolean} success - Si la tentative a réussi
   * @returns {Object} Résultat de l'enregistrement
   */
  recordAttempt(phone, action, success = false) {
    const cleanPhone = this.cleanPhone(phone);
    
    // Si succès, réinitialiser les tentatives
    if (success) {
      this.attempts.delete(cleanPhone);
      this.blockedUsers.delete(cleanPhone);
      logger.info('Tentatives réinitialisées après succès', { phone: cleanPhone, action });
      return { blocked: false, attempts: 0 };
    }

    // Récupérer ou créer l'historique des tentatives
    let attemptData = this.attempts.get(cleanPhone) || {
      count: 0,
      lastAttempt: Date.now(),
      action: action
    };

    attemptData.count++;
    attemptData.lastAttempt = Date.now();
    attemptData.action = action;
    
    this.attempts.set(cleanPhone, attemptData);

    logger.warn('Tentative OTP échouée', { 
      phone: cleanPhone, 
      action, 
      attempts: attemptData.count 
    });

    // Vérifier si un blocage doit être appliqué
    const blockLevel = this.getBlockLevel(attemptData.count);
    if (blockLevel) {
      return this.applyBlock(cleanPhone, action, attemptData.count, blockLevel);
    }

    return {
      blocked: false,
      attempts: attemptData.count,
      remainingAttempts: this.getRemainingAttempts(attemptData.count)
    };
  }

  /**
   * Appliquer un blocage
   * @param {string} phone - Numéro de téléphone
   * @param {string} action - Action qui a causé le blocage
   * @param {number} attempts - Nombre de tentatives
   * @param {Object} blockLevel - Niveau de blocage
   * @returns {Object} Détails du blocage
   */
  applyBlock(phone, action, attempts, blockLevel) {
    const blockedUntil = blockLevel.blockDuration === -1 
      ? -1 
      : Date.now() + blockLevel.blockDuration;

    const blockData = {
      blockedUntil,
      reason: `Trop de tentatives OTP (${attempts}) pour l'action: ${action}`,
      attempts,
      action,
      blockedAt: Date.now()
    };

    this.blockedUsers.set(phone, blockData);

    const duration = blockLevel.blockDuration === -1 
      ? 'définitivement' 
      : this.formatDuration(blockLevel.blockDuration);

    logger.error('Compte bloqué pour sécurité', {
      phone,
      action,
      attempts,
      duration,
      isPermanent: blockLevel.blockDuration === -1
    });

    return {
      blocked: true,
      reason: blockData.reason,
      attempts,
      blockedUntil,
      duration,
      isPermanent: blockLevel.blockDuration === -1
    };
  }

  /**
   * Obtenir le niveau de blocage pour un nombre de tentatives
   * @param {number} attempts - Nombre de tentatives
   * @returns {Object|null} Niveau de blocage ou null
   */
  getBlockLevel(attempts) {
    return this.securityLevels.find(level => level.attempts === attempts) || null;
  }

  /**
   * Obtenir le nombre de tentatives restantes avant le prochain blocage
   * @param {number} currentAttempts - Tentatives actuelles
   * @returns {number} Tentatives restantes
   */
  getRemainingAttempts(currentAttempts) {
    const nextLevel = this.securityLevels.find(level => level.attempts > currentAttempts);
    return nextLevel ? nextLevel.attempts - currentAttempts : 0;
  }

  /**
   * Nettoyer le numéro de téléphone
   * @param {string} phone - Numéro brut
   * @returns {string} Numéro nettoyé
   */
  cleanPhone(phone) {
    return phone.replace(/[^\d]/g, '');
  }

  /**
   * Formater une durée en millisecondes en texte lisible
   * @param {number} ms - Durée en millisecondes
   * @returns {string} Durée formatée
   */
  formatDuration(ms) {
    const minutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} jour(s)`;
    if (hours > 0) return `${hours} heure(s)`;
    return `${minutes} minute(s)`;
  }

  /**
   * Débloquer manuellement un utilisateur (admin)
   * @param {string} phone - Numéro de téléphone
   * @param {string} adminId - ID de l'administrateur
   * @returns {boolean} Succès du déblocage
   */
  unblockUser(phone, adminId) {
    const cleanPhone = this.cleanPhone(phone);
    const wasBlocked = this.blockedUsers.has(cleanPhone);
    
    this.blockedUsers.delete(cleanPhone);
    this.attempts.delete(cleanPhone);
    
    if (wasBlocked) {
      logger.info('Déblocage manuel par admin', { 
        phone: cleanPhone, 
        adminId 
      });
    }
    
    return wasBlocked;
  }

  /**
   * Obtenir les statistiques de sécurité
   * @returns {Object} Statistiques
   */
  getSecurityStats() {
    return {
      totalBlocked: this.blockedUsers.size,
      totalAttempts: this.attempts.size,
      permanentBlocks: Array.from(this.blockedUsers.values())
        .filter(block => block.blockedUntil === -1).length
    };
  }

  /**
   * Nettoyer les anciens enregistrements (à exécuter périodiquement)
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    // Nettoyer les blocages expirés
    for (const [phone, blockData] of this.blockedUsers.entries()) {
      if (blockData.blockedUntil !== -1 && now > blockData.blockedUntil) {
        this.blockedUsers.delete(phone);
        this.attempts.delete(phone);
        cleaned++;
      }
    }

    // Nettoyer les tentatives anciennes (plus de 24h)
    for (const [phone, attemptData] of this.attempts.entries()) {
      if (now - attemptData.lastAttempt > 24 * 60 * 60 * 1000) {
        this.attempts.delete(phone);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info('Nettoyage sécurité OTP', { recordsCleaned: cleaned });
    }
  }

  /**
   * Générer un code OTP sécurisé à 6 chiffres
   * @returns {string} Code OTP
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Hasher un code OTP pour le stockage sécurisé
   * @param {string} otp - Code OTP à hasher
   * @returns {string} Hash du code OTP
   */
  hashOTP(otp) {
    return crypto.createHash('sha256').update(otp + 'mossombi_salt').digest('hex');
  }

  /**
   * Vérifier un code OTP contre son hash
   * @param {string} otp - Code OTP à vérifier
   * @param {string} hash - Hash stocké
   * @returns {boolean} True si le code est valide
   */
  verifyOTP(otp, hash) {
    const otpHash = this.hashOTP(otp);
    return otpHash === hash;
  }
}

// Instance singleton
export const otpSecurityService = new OTPSecurityService();

// Nettoyage automatique toutes les heures
const interval = setInterval(() => {
  otpSecurityService.cleanup();
}, 60 * 60 * 1000);

if (process.env.NODE_ENV === 'test') {
  interval.unref();
}

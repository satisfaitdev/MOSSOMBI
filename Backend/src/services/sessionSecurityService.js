/**
 * SERVICE DE SÉCURITÉ DES SESSIONS
 * Détection et gestion des sessions multiples et suspectes
 */

import SessionCore from './session/sessionCore.js';
import SessionManager from './session/sessionManager.js';
import SessionSecurity from './session/sessionSecurity.js';
import { logger } from '../utils/logger.js';

class SessionSecurityService {
  constructor() {
    // Initialiser les composants
    this.core = new SessionCore();
    this.manager = new SessionManager(this.core);
    this.security = new SessionSecurity(this.core);
    
    this.initialized = true;
  }

  /**
   * Initialiser le service
   */
  async initialize() {
    try {
      // Le service est déjà initialisé dans le constructeur
      logger.info('Service de sécurité des sessions initialisé');
    } catch (error) {
      logger.error('Erreur initialisation service sécurité sessions:', error);
      throw error;
    }
  }

  /**
   * Créer une nouvelle session
   */
  createSession(userId, deviceInfo, locationInfo = {}) {
    if (!this.initialized) {
      logger.warn('Service sécurité sessions non initialisé');
      return null;
    }

    return this.manager.createSession(userId, deviceInfo, locationInfo);
  }

  /**
   * Analyser une tentative de connexion pour la sécurité
   */
  analyzeLoginAttempt(userId, deviceInfo, locationInfo, loginResult) {
    if (!this.initialized) {
      return {
        riskScore: 0,
        alerts: [],
        isBlocked: false,
        recommendations: []
      };
    }

    return this.security.analyzeLoginAttempt(userId, deviceInfo, locationInfo, loginResult);
  }

  /**
   * Mettre à jour l'activité d'une session
   */
  updateSessionActivity(sessionId) {
    if (!this.initialized) return null;
    return this.manager.updateSessionActivity(sessionId);
  }

  /**
   * Fermer une session
   */
  closeSession(sessionId) {
    if (!this.initialized) return null;
    return this.manager.closeSession(sessionId);
  }

  /**
   * Fermer toutes les sessions d'un utilisateur
   */
  closeAllUserSessions(userId) {
    if (!this.initialized) return 0;
    return this.manager.closeAllUserSessions(userId);
  }

  /**
   * Obtenir les sessions actives d'un utilisateur
   */
  getUserSessions(userId) {
    if (!this.initialized) return [];
    return this.core.getUserSessions(userId);
  }

  /**
   * Obtenir les appareils connus d'un utilisateur
   */
  getUserDevices(userId) {
    if (!this.initialized) return [];
    return this.core.getUserDevices(userId);
  }

  /**
   * Obtenir les sessions suspectes
   */
  getSuspiciousSessions() {
    if (!this.initialized) return [];
    return this.security.getSuspiciousSessions();
  }

  /**
   * Obtenir les sessions par appareil
   */
  getSessionsByDevice(fingerprint) {
    if (!this.initialized) return [];
    return this.manager.getSessionsByDevice(fingerprint);
  }

  /**
   * Vérifier si une IP est bloquée
   */
  isIPBlocked(ip) {
    if (!this.initialized) return false;
    return this.security.isIPBlocked(ip);
  }

  /**
   * Obtenir les statistiques générales
   */
  getStats() {
    if (!this.initialized) return {};
    
    return {
      core: this.core.getStats(),
      security: this.security.getSecurityStats(),
      manager: {
        totalSessions: this.core.getStats().totalSessions,
        suspiciousSessions: this.getSuspiciousSessions().length
      }
    };
  }

  /**
   * Obtenir la configuration
   */
  getConfig() {
    if (!this.initialized) return {};
    return {
      core: this.core.getConfig(),
      security: this.security.securityConfig
    };
  }

  /**
   * Mettre à jour la configuration
   */
  updateConfig(newConfig) {
    if (!this.initialized) return;
    
    if (newConfig.core) {
      this.core.updateConfig(newConfig.core);
    }
    
    if (newConfig.security) {
      this.security.securityConfig = { ...this.security.securityConfig, ...newConfig.security };
    }
    
    logger.info('Configuration du service de sécurité des sessions mise à jour');
  }

  /**
   * Nettoyer les anciennes données
   */
  cleanup() {
    if (!this.initialized) return;
    
    this.core.cleanup();
    this.security.cleanup();
    
    logger.info('Nettoyage du service de sécurité des sessions terminé');
  }

  /**
   * Vérifier si une session est valide
   */
  isSessionValid(sessionId) {
    if (!this.initialized) return false;
    
    const session = this.getUserSessions(sessionId);
    return session && session.isActive && 
           (Date.now() - session.lastActivity) < this.core.config.sessionTimeout;
  }

  /**
   * Obtenir les sessions expirées
   */
  getExpiredSessions() {
    if (!this.initialized) return [];
    
    const now = Date.now();
    const expiredSessions = [];
    
    for (const sessions of this.core.activeSessions.values()) {
      const expired = sessions.filter(session => 
        !session.isActive || 
        (now - session.lastActivity) >= this.core.config.sessionTimeout
      );
      expiredSessions.push(...expired);
    }
    
    return expiredSessions;
  }

  /**
   * Obtenir les sessions à risque
   */
  getAtRiskSessions() {
    if (!this.initialized) return [];
    
    const atRiskSessions = [];
    
    for (const sessions of this.core.activeSessions.values()) {
      const atRisk = sessions.filter(session => 
        session.isSuspicious || session.riskScore >= 30
      );
      atRiskSessions.push(...atRisk);
    }
    
    return atRiskSessions.sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * Calculer le score de risque d'un utilisateur
   */
  getUserRiskScore(userId) {
    if (!this.initialized) return 0;
    
    const sessions = this.getUserSessions(userId);
    if (sessions.length === 0) return 0;
    
    const riskScores = sessions.map(session => session.riskScore || 0);
    const averageRisk = riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length;
    
    // Ajouter le score de sécurité basé sur les tentatives de connexion
    const failedLogins = this.security.getRecentFailedLogins(userId);
    const rapidLogins = this.security.getRecentRapidLogins(userId);
    const deviceRotations = this.security.getRecentDeviceRotations(userId);
    
    const securityScore = (failedLogins * 10) + (rapidLogins * 6) + (deviceRotations * 5);
    
    return Math.round((averageRisk * 0.7) + (securityScore * 0.3));
  }

  /**
   * Obtenir le résumé de sécurité d'un utilisateur
   */
  getUserSecuritySummary(userId) {
    if (!this.initialized) return null;
    
    const sessions = this.getUserSessions(userId);
    const devices = this.getUserDevices(userId);
    const riskScore = this.getUserRiskScore(userId);
    const suspiciousSessions = sessions.filter(s => s.isSuspicious);
    
    return {
      userId,
      sessionCount: sessions.length,
      deviceCount: devices.length,
      riskScore,
      suspiciousSessions: suspiciousSessions.length,
      hasHighRisk: riskScore >= 50,
      hasMediumRisk: riskScore >= 25,
      lastActivity: sessions.length > 0 ? Math.max(...sessions.map(s => s.lastActivity)) : null,
      trustedDevices: devices.filter(d => d.isTrusted).length,
      alerts: suspiciousSessions.flatMap(s => s.alerts || [])
    };
  }
}

// Singleton
const sessionSecurityService = new SessionSecurityService();

export { sessionSecurityService };
export default sessionSecurityService;

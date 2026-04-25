/**
 * SERVICE DE SÉCURITÉ DES SESSIONS
 * Détection et gestion des sessions multiples et suspectes
 */

import crypto from 'crypto';
import { logger } from '../utils/logger.js';

class SessionSecurityService {
  constructor() {
    // Stockage des sessions actives
    this.activeSessions = new Map(); // userId -> [session1, session2, ...]
    
    // Stockage des appareils connus
    this.knownDevices = new Map(); // userId -> [device1, device2, ...]
    
    // Configuration
    this.config = {
      maxSessionsPerUser: 3,        // Maximum 3 sessions simultanées
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 heures
      deviceTrustDuration: 30 * 24 * 60 * 60 * 1000, // 30 jours
      suspiciousLoginThreshold: 5,   // 5 connexions suspectes = alerte
      geoLocationRadius: 100        // 100km de différence = suspect
    };

    // Nettoyage automatique toutes les heures
    const interval = setInterval(() => this.cleanup(), 60 * 60 * 1000);
    if (process.env.NODE_ENV === 'test') {
      interval.unref();
    }
  }

  /**
   * Créer une nouvelle session
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} deviceInfo - Informations de l'appareil
   * @param {Object} locationInfo - Informations de géolocalisation
   * @returns {Object} Informations de la session
   */
  createSession(userId, deviceInfo, locationInfo = {}) {
    const sessionId = this.generateSessionId();
    const now = Date.now();
    
    const session = {
      sessionId,
      userId,
      createdAt: now,
      lastActivity: now,
      deviceInfo: {
        userAgent: deviceInfo.userAgent || 'Unknown',
        ip: deviceInfo.ip || 'Unknown',
        platform: this.extractPlatform(deviceInfo.userAgent),
        browser: this.extractBrowser(deviceInfo.userAgent),
        fingerprint: this.generateDeviceFingerprint(deviceInfo)
      },
      locationInfo: {
        country: locationInfo.country || 'Unknown',
        city: locationInfo.city || 'Unknown',
        coordinates: locationInfo.coordinates || null,
        timezone: locationInfo.timezone || null
      },
      isActive: true,
      isSuspicious: false,
      riskScore: 0
    };

    // Analyser la session pour détecter les anomalies
    const analysis = this.analyzeSession(userId, session);
    session.isSuspicious = analysis.isSuspicious;
    session.riskScore = analysis.riskScore;
    session.alerts = analysis.alerts;

    // Ajouter à la liste des sessions actives
    const userSessions = this.activeSessions.get(userId) || [];
    userSessions.push(session);

    // Limiter le nombre de sessions
    if (userSessions.length > this.config.maxSessionsPerUser) {
      const oldestSession = userSessions.shift();
      logger.warn('Session fermée automatiquement (limite atteinte)', {
        userId,
        closedSessionId: oldestSession.sessionId,
        totalSessions: userSessions.length
      });
    }

    this.activeSessions.set(userId, userSessions);

    // Enregistrer l'appareil si nouveau et non suspect
    if (!analysis.isSuspicious) {
      this.registerDevice(userId, session.deviceInfo);
    }

    logger.info('Nouvelle session créée', {
      userId,
      sessionId,
      platform: session.deviceInfo.platform,
      browser: session.deviceInfo.browser,
      isSuspicious: session.isSuspicious,
      riskScore: session.riskScore
    });

    return {
      sessionId,
      isSuspicious: session.isSuspicious,
      riskScore: session.riskScore,
      alerts: session.alerts,
      activeSessions: userSessions.length
    };
  }

  /**
   * Analyser une session pour détecter les anomalies
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} session - Informations de la session
   * @returns {Object} Résultat de l'analyse
   */
  analyzeSession(userId, session) {
    const alerts = [];
    let riskScore = 0;
    let isSuspicious = false;

    // 1. Vérifier si l'appareil est connu
    const isKnownDevice = this.isDeviceKnown(userId, session.deviceInfo);
    if (!isKnownDevice) {
      alerts.push('Nouvel appareil détecté');
      riskScore += 3;
    }

    // 2. Vérifier les sessions simultanées
    const currentSessions = this.activeSessions.get(userId) || [];
    if (currentSessions.length >= this.config.maxSessionsPerUser) {
      alerts.push('Nombre maximum de sessions atteint');
      riskScore += 2;
    }

    // 3. Analyser la géolocalisation
    const locationAnalysis = this.analyzeLocation(userId, session.locationInfo);
    if (locationAnalysis.isSuspicious) {
      alerts.push(...locationAnalysis.alerts);
      riskScore += locationAnalysis.riskScore;
    }

    // 4. Analyser les patterns temporels
    const timeAnalysis = this.analyzeTimePattern(userId, session);
    if (timeAnalysis.isSuspicious) {
      alerts.push(...timeAnalysis.alerts);
      riskScore += timeAnalysis.riskScore;
    }

    // 5. Vérifier l'historique des connexions suspectes
    const suspiciousHistory = this.getSuspiciousLoginCount(userId);
    if (suspiciousHistory >= this.config.suspiciousLoginThreshold) {
      alerts.push('Historique de connexions suspectes');
      riskScore += 4;
      isSuspicious = true;
    }

    // Déterminer si la session est suspecte
    if (riskScore >= 5) {
      isSuspicious = true;
    }

    return {
      isSuspicious,
      riskScore,
      alerts
    };
  }

  /**
   * Analyser la géolocalisation
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} locationInfo - Informations de localisation
   * @returns {Object} Résultat de l'analyse
   */
  analyzeLocation(userId, locationInfo) {
    const alerts = [];
    let riskScore = 0;
    let isSuspicious = false;

    const recentSessions = this.getRecentSessions(userId, 24 * 60 * 60 * 1000); // 24h
    
    if (recentSessions.length > 0) {
      const lastLocation = recentSessions[recentSessions.length - 1].locationInfo;
      
      // Vérifier le changement de pays
      if (lastLocation.country && locationInfo.country && 
          lastLocation.country !== locationInfo.country) {
        alerts.push(`Connexion depuis un nouveau pays: ${locationInfo.country}`);
        riskScore += 3;
      }

      // Vérifier la distance géographique (si coordonnées disponibles)
      if (lastLocation.coordinates && locationInfo.coordinates) {
        const distance = this.calculateDistance(
          lastLocation.coordinates,
          locationInfo.coordinates
        );
        
        if (distance > this.config.geoLocationRadius) {
          alerts.push(`Connexion à ${Math.round(distance)}km de la dernière localisation`);
          riskScore += 2;
        }
      }

      // Vérifier les connexions simultanées depuis différents pays
      const activeCountries = new Set(
        recentSessions
          .filter(s => s.isActive)
          .map(s => s.locationInfo.country)
          .filter(Boolean)
      );
      
      if (activeCountries.size > 1) {
        alerts.push('Sessions actives depuis plusieurs pays');
        riskScore += 4;
        isSuspicious = true;
      }
    }

    return { isSuspicious, riskScore, alerts };
  }

  /**
   * Analyser les patterns temporels
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} session - Session actuelle
   * @returns {Object} Résultat de l'analyse
   */
  analyzeTimePattern(userId, session) {
    const alerts = [];
    let riskScore = 0;
    let isSuspicious = false;

    const recentSessions = this.getRecentSessions(userId, 60 * 60 * 1000); // 1h

    // Vérifier les connexions trop rapprochées
    if (recentSessions.length > 5) {
      alerts.push('Connexions très fréquentes détectées');
      riskScore += 2;
    }

    // Vérifier les connexions à des heures inhabituelles
    const hour = new Date(session.createdAt).getHours();
    if (hour >= 2 && hour <= 5) { // 2h-5h du matin
      alerts.push('Connexion à une heure inhabituelle');
      riskScore += 1;
    }

    return { isSuspicious, riskScore, alerts };
  }

  /**
   * Mettre à jour l'activité d'une session
   * @param {string} sessionId - ID de la session
   * @param {string} userId - ID de l'utilisateur
   */
  updateSessionActivity(sessionId, userId) {
    const userSessions = this.activeSessions.get(userId) || [];
    const session = userSessions.find(s => s.sessionId === sessionId);
    
    if (session) {
      session.lastActivity = Date.now();
    }
  }

  /**
   * Fermer une session
   * @param {string} sessionId - ID de la session
   * @param {string} userId - ID de l'utilisateur
   * @param {string} reason - Raison de la fermeture
   */
  closeSession(sessionId, userId, reason = 'user_logout') {
    const userSessions = this.activeSessions.get(userId) || [];
    const sessionIndex = userSessions.findIndex(s => s.sessionId === sessionId);
    
    if (sessionIndex !== -1) {
      const session = userSessions[sessionIndex];
      session.isActive = false;
      session.closedAt = Date.now();
      session.closeReason = reason;
      
      userSessions.splice(sessionIndex, 1);
      this.activeSessions.set(userId, userSessions);
      
      logger.info('Session fermée', {
        userId,
        sessionId,
        reason,
        duration: session.closedAt - session.createdAt
      });
    }
  }

  /**
   * Fermer toutes les sessions d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} reason - Raison de la fermeture
   */
  closeAllUserSessions(userId, reason = 'security_action') {
    const userSessions = this.activeSessions.get(userId) || [];
    const sessionCount = userSessions.length;
    
    userSessions.forEach(session => {
      session.isActive = false;
      session.closedAt = Date.now();
      session.closeReason = reason;
    });
    
    this.activeSessions.delete(userId);
    
    logger.warn('Toutes les sessions fermées', {
      userId,
      sessionCount,
      reason
    });
    
    return sessionCount;
  }

  /**
   * Obtenir les sessions actives d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Array} Liste des sessions actives
   */
  getUserActiveSessions(userId) {
    const sessions = this.activeSessions.get(userId) || [];
    return sessions.map(session => ({
      sessionId: session.sessionId,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      platform: session.deviceInfo.platform,
      browser: session.deviceInfo.browser,
      location: `${session.locationInfo.city}, ${session.locationInfo.country}`,
      isSuspicious: session.isSuspicious,
      riskScore: session.riskScore
    }));
  }

  /**
   * Vérifier si un appareil est connu
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} deviceInfo - Informations de l'appareil
   * @returns {boolean} True si l'appareil est connu
   */
  isDeviceKnown(userId, deviceInfo) {
    const knownDevices = this.knownDevices.get(userId) || [];
    const deviceFingerprint = deviceInfo.fingerprint;
    
    return knownDevices.some(device => 
      device.fingerprint === deviceFingerprint &&
      Date.now() - device.lastSeen < this.config.deviceTrustDuration
    );
  }

  /**
   * Enregistrer un nouvel appareil
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} deviceInfo - Informations de l'appareil
   */
  registerDevice(userId, deviceInfo) {
    const knownDevices = this.knownDevices.get(userId) || [];
    
    const device = {
      fingerprint: deviceInfo.fingerprint,
      platform: deviceInfo.platform,
      browser: deviceInfo.browser,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      trustLevel: 'new'
    };
    
    knownDevices.push(device);
    
    // Garder seulement les 10 appareils les plus récents
    if (knownDevices.length > 10) {
      knownDevices.sort((a, b) => b.lastSeen - a.lastSeen);
      knownDevices.splice(10);
    }
    
    this.knownDevices.set(userId, knownDevices);
    
    logger.info('Nouvel appareil enregistré', {
      userId,
      platform: device.platform,
      browser: device.browser
    });
  }

  /**
   * Générer un ID de session unique
   * @returns {string} ID de session
   */
  generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Générer une empreinte d'appareil
   * @param {Object} deviceInfo - Informations de l'appareil
   * @returns {string} Empreinte de l'appareil
   */
  generateDeviceFingerprint(deviceInfo) {
    const data = [
      deviceInfo.userAgent || '',
      deviceInfo.platform || '',
      deviceInfo.language || '',
      deviceInfo.timezone || '',
      deviceInfo.screenResolution || ''
    ].join('|');
    
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Extraire la plateforme depuis le User-Agent
   * @param {string} userAgent - User-Agent
   * @returns {string} Plateforme détectée
   */
  extractPlatform(userAgent = '') {
    if (/iPhone|iPad|iPod/.test(userAgent)) return 'iOS';
    if (/Android/.test(userAgent)) return 'Android';
    if (/Windows/.test(userAgent)) return 'Windows';
    if (/Macintosh|Mac OS/.test(userAgent)) return 'macOS';
    if (/Linux/.test(userAgent)) return 'Linux';
    return 'Unknown';
  }

  /**
   * Extraire le navigateur depuis le User-Agent
   * @param {string} userAgent - User-Agent
   * @returns {string} Navigateur détecté
   */
  extractBrowser(userAgent = '') {
    if (/Chrome/.test(userAgent)) return 'Chrome';
    if (/Firefox/.test(userAgent)) return 'Firefox';
    if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) return 'Safari';
    if (/Edge/.test(userAgent)) return 'Edge';
    if (/Opera/.test(userAgent)) return 'Opera';
    return 'Unknown';
  }

  /**
   * Obtenir les sessions récentes d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {number} timeWindow - Fenêtre de temps en ms
   * @returns {Array} Sessions récentes
   */
  getRecentSessions(userId, timeWindow) {
    const allSessions = this.activeSessions.get(userId) || [];
    const cutoff = Date.now() - timeWindow;
    
    return allSessions.filter(session => session.createdAt > cutoff);
  }

  /**
   * Obtenir le nombre de connexions suspectes
   * @param {string} userId - ID de l'utilisateur
   * @returns {number} Nombre de connexions suspectes
   */
  getSuspiciousLoginCount(userId) {
    const recentSessions = this.getRecentSessions(userId, 7 * 24 * 60 * 60 * 1000); // 7 jours
    return recentSessions.filter(session => session.isSuspicious).length;
  }

  /**
   * Calculer la distance entre deux coordonnées
   * @param {Object} coord1 - Première coordonnée {lat, lng}
   * @param {Object} coord2 - Deuxième coordonnée {lat, lng}
   * @returns {number} Distance en kilomètres
   */
  calculateDistance(coord1, coord2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRadians(coord2.lat - coord1.lat);
    const dLon = this.toRadians(coord2.lng - coord1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(coord1.lat)) * Math.cos(this.toRadians(coord2.lat)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convertir en radians
   * @param {number} degrees - Degrés
   * @returns {number} Radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Obtenir les statistiques de sécurité
   * @returns {Object} Statistiques
   */
  getSecurityStats() {
    let totalSessions = 0;
    let suspiciousSessions = 0;
    let totalDevices = 0;
    
    for (const sessions of this.activeSessions.values()) {
      totalSessions += sessions.length;
      suspiciousSessions += sessions.filter(s => s.isSuspicious).length;
    }
    
    for (const devices of this.knownDevices.values()) {
      totalDevices += devices.length;
    }
    
    return {
      totalActiveSessions: totalSessions,
      suspiciousSessions,
      totalUsers: this.activeSessions.size,
      totalKnownDevices: totalDevices,
      averageSessionsPerUser: this.activeSessions.size > 0 ? totalSessions / this.activeSessions.size : 0
    };
  }

  /**
   * Nettoyer les sessions expirées
   */
  cleanup() {
    const now = Date.now();
    let cleanedSessions = 0;
    let cleanedDevices = 0;
    
    // Nettoyer les sessions expirées
    for (const [userId, sessions] of this.activeSessions.entries()) {
      const activeSessions = sessions.filter(session => 
        now - session.lastActivity < this.config.sessionTimeout
      );
      
      cleanedSessions += sessions.length - activeSessions.length;
      
      if (activeSessions.length === 0) {
        this.activeSessions.delete(userId);
      } else {
        this.activeSessions.set(userId, activeSessions);
      }
    }
    
    // Nettoyer les appareils anciens
    for (const [userId, devices] of this.knownDevices.entries()) {
      const validDevices = devices.filter(device => 
        now - device.lastSeen < this.config.deviceTrustDuration
      );
      
      cleanedDevices += devices.length - validDevices.length;
      
      if (validDevices.length === 0) {
        this.knownDevices.delete(userId);
      } else {
        this.knownDevices.set(userId, validDevices);
      }
    }
    
    if (cleanedSessions > 0 || cleanedDevices > 0) {
      logger.info('Nettoyage sécurité sessions', {
        cleanedSessions,
        cleanedDevices
      });
    }
  }
}

// Instance singleton
export const sessionSecurityService = new SessionSecurityService();

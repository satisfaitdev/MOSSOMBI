/**
 * GESTIONNAIRE DE SESSIONS
 * Création, validation et gestion des sessions utilisateur
 */

import SessionCore from './sessionCore.js';
import { logger } from '../../utils/logger.js';

class SessionManager {
  constructor(core) {
    this.core = core;
  }

  /**
   * Créer une nouvelle session
   */
  createSession(userId, deviceInfo, locationInfo = {}) {
    const sessionId = this.core.generateSessionId();
    const now = Date.now();
    
    const session = {
      sessionId,
      userId,
      createdAt: now,
      lastActivity: now,
      deviceInfo: {
        userAgent: deviceInfo.userAgent || 'Unknown',
        ip: deviceInfo.ip || 'Unknown',
        platform: this.core.extractPlatform(deviceInfo.userAgent),
        browser: this.core.extractBrowser(deviceInfo.userAgent),
        fingerprint: this.core.generateDeviceFingerprint(deviceInfo)
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
    const userSessions = this.core.getUserSessions(userId);
    userSessions.push(session);

    // Limiter le nombre de sessions
    if (userSessions.length > this.core.config.maxSessionsPerUser) {
      const oldestSession = userSessions.shift();
      logger.warn('Session fermée automatiquement (limite atteinte)', {
        userId,
        closedSessionId: oldestSession.sessionId,
        totalSessions: userSessions.length
      });
    }

    this.core.activeSessions.set(userId, userSessions);

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

    return session;
  }

  /**
   * Analyser une session pour détecter les anomalies
   */
  analyzeSession(userId, session) {
    const alerts = [];
    let riskScore = 0;
    let isSuspicious = false;

    // 1. Vérifier le nombre de sessions actives
    const userSessions = this.core.getUserSessions(userId);
    if (userSessions.length >= this.core.config.maxSessionsPerUser) {
      alerts.push({
        type: 'MULTIPLE_SESSIONS',
        severity: 'MEDIUM',
        message: `Utilisateur a ${userSessions.length} sessions actives`
      });
      riskScore += 20;
    }

    // 2. Vérifier les appareils connus
    const knownDevices = this.core.getUserDevices(userId);
    const deviceFingerprint = session.deviceInfo.fingerprint;
    const isKnownDevice = knownDevices.some(device => 
      device.fingerprint === deviceFingerprint && device.isTrusted
    );

    if (!isKnownDevice) {
      alerts.push({
        type: 'NEW_DEVICE',
        severity: 'LOW',
        message: 'Connexion depuis un nouvel appareil'
      });
      riskScore += 10;
    }

    // 3. Vérifier la géolocalisation
    if (session.locationInfo.coordinates) {
      const recentSessions = userSessions
        .filter(s => s.locationInfo.coordinates)
        .slice(-3); // 3 dernières sessions avec géolocalisation

      for (const recentSession of recentSessions) {
        const distance = this.core.calculateDistance(
          session.locationInfo.coordinates,
          recentSession.locationInfo.coordinates
        );

        if (distance < this.core.config.geoLocationRadius) {
          // Même zone géographique - normal
          continue;
        } else if (distance < 1000) {
          // Différence significative mais plausible
          alerts.push({
            type: 'LOCATION_CHANGE',
            severity: 'MEDIUM',
            message: `Connexion depuis une localisation différente (${Math.round(distance)}km)`
          });
          riskScore += 15;
        } else {
          // Différence très importante - suspect
          alerts.push({
            type: 'SUSPICIOUS_LOCATION',
            severity: 'HIGH',
            message: `Connexion depuis une localisation très éloignée (${Math.round(distance)}km)`
          });
          riskScore += 30;
          isSuspicious = true;
        }
      }
    }

    // 4. Vérifier les heures de connexion
    const hour = new Date(session.createdAt).getHours();
    if (hour < 6 || hour > 22) {
      alerts.push({
        type: 'UNUSUAL_TIME',
        severity: 'LOW',
        message: `Connexion à une heure inhabituelle (${hour}h)`
      });
      riskScore += 5;
    }

    // 5. Vérifier le User-Agent
    const userAgent = session.deviceInfo.userAgent;
    if (userAgent.includes('bot') || userAgent.includes('crawler') || userAgent.includes('spider')) {
      alerts.push({
        type: 'SUSPICIOUS_USER_AGENT',
        severity: 'HIGH',
        message: 'User-Agent suspect détecté'
      });
      riskScore += 40;
      isSuspicious = true;
    }

    // 6. Vérifier l'adresse IP
    const ip = session.deviceInfo.ip;
    if (ip === '127.0.0.1' || ip === '::1') {
      // Localhost - normal en développement
      if (process.env.NODE_ENV === 'production') {
        alerts.push({
          type: 'LOCALHOST_IN_PRODUCTION',
          severity: 'HIGH',
          message: 'Connexion localhost en production'
        });
        riskScore += 25;
        isSuspicious = true;
      }
    }

    // Déterminer si la session est suspecte
    isSuspicious = isSuspicious || riskScore >= 50 || alerts.some(alert => alert.severity === 'HIGH');

    return {
      isSuspicious,
      riskScore,
      alerts
    };
  }

  /**
   * Enregistrer un appareil comme connu
   */
  registerDevice(userId, deviceInfo) {
    const knownDevices = this.core.getUserDevices(userId);
    const fingerprint = deviceInfo.fingerprint;
    
    const existingDevice = knownDevices.find(device => device.fingerprint === fingerprint);
    
    if (existingDevice) {
      // Mettre à jour l'appareil existant
      existingDevice.lastSeen = Date.now();
      existingDevice.usageCount += 1;
      existingDevice.isTrusted = existingDevice.usageCount >= 3;
    } else {
      // Ajouter le nouvel appareil
      knownDevices.push({
        fingerprint,
        userAgent: deviceInfo.userAgent,
        platform: deviceInfo.platform,
        browser: deviceInfo.browser,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        usageCount: 1,
        isTrusted: false
      });
    }

    this.core.knownDevices.set(userId, knownDevices);
  }

  /**
   * Mettre à jour l'activité d'une session
   */
  updateSessionActivity(sessionId) {
    for (const [userId, sessions] of this.core.activeSessions.entries()) {
      const session = sessions.find(s => s.sessionId === sessionId);
      if (session) {
        session.lastActivity = Date.now();
        session.isActive = true;
        return session;
      }
    }
    return null;
  }

  /**
   * Fermer une session
   */
  closeSession(sessionId) {
    for (const [userId, sessions] of this.core.activeSessions.entries()) {
      const index = sessions.findIndex(s => s.sessionId === sessionId);
      if (index !== -1) {
        const closedSession = sessions.splice(index, 1)[0];
        closedSession.isActive = false;
        closedSession.closedAt = Date.now();
        
        if (sessions.length === 0) {
          this.core.activeSessions.delete(userId);
        } else {
          this.core.activeSessions.set(userId, sessions);
        }

        logger.info('Session fermée', {
          userId,
          sessionId,
          duration: Date.now() - closedSession.createdAt
        });

        return closedSession;
      }
    }
    return null;
  }

  /**
   * Fermer toutes les sessions d'un utilisateur
   */
  closeAllUserSessions(userId) {
    const sessions = this.core.getUserSessions(userId);
    const closedCount = sessions.length;
    
    sessions.forEach(session => {
      session.isActive = false;
      session.closedAt = Date.now();
    });

    this.core.activeSessions.delete(userId);

    logger.info('Toutes les sessions utilisateur fermées', {
      userId,
      closedCount
    });

    return closedCount;
  }

  /**
   * Obtenir les sessions suspectes
   */
  getSuspiciousSessions() {
    const suspiciousSessions = [];
    
    for (const sessions of this.core.activeSessions.values()) {
      suspiciousSessions.push(...sessions.filter(s => s.isSuspicious));
    }

    return suspiciousSessions.sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * Obtenir les sessions par appareil
   */
  getSessionsByDevice(fingerprint) {
    const deviceSessions = [];
    
    for (const sessions of this.core.activeSessions.values()) {
      deviceSessions.push(...sessions.filter(s => 
        s.deviceInfo.fingerprint === fingerprint
      ));
    }

    return deviceSessions;
  }
}

export default SessionManager;

/**
 * CŒUR DU SERVICE DE SÉCURITÉ DES SESSIONS
 * Configuration et fonctionnalités de base
 */

import crypto from 'crypto';
import { logger } from '../../utils/logger.js';

class SessionCore {
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
   * Générer un ID de session unique
   */
  generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Générer une empreinte d'appareil
   */
  generateDeviceFingerprint(deviceInfo) {
    const data = [
      deviceInfo.userAgent || '',
      deviceInfo.ip || '',
      deviceInfo.platform || '',
      deviceInfo.browser || ''
    ].join('|');
    
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Extraire la plateforme depuis le User-Agent
   */
  extractPlatform(userAgent) {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Macintosh')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
    if (userAgent.includes('WinPhone')) return 'Windows Phone';
    
    return 'Unknown';
  }

  /**
   * Extraire le navigateur depuis le User-Agent
   */
  extractBrowser(userAgent) {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    
    return 'Unknown';
  }

  /**
   * Calculer la distance entre deux coordonnées géographiques
   */
  calculateDistance(coord1, coord2) {
    if (!coord1 || !coord2) return Infinity;
    
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRadians(coord2.lat - coord1.lat);
    const dLon = this.toRadians(coord2.lon - coord1.lon);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(coord1.lat)) * Math.cos(this.toRadians(coord2.lat)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Convertir degrés en radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Nettoyer les sessions expirées
   */
  cleanup() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [userId, sessions] of this.activeSessions.entries()) {
      const activeSessions = sessions.filter(session => {
        const isActive = session.isActive && 
                          (now - session.lastActivity) < this.config.sessionTimeout;
        if (!isActive) cleanedCount++;
        return isActive;
      });

      if (activeSessions.length === 0) {
        this.activeSessions.delete(userId);
      } else {
        this.activeSessions.set(userId, activeSessions);
      }
    }

    // Nettoyer les appareils anciens
    for (const [userId, devices] of this.knownDevices.entries()) {
      const trustedDevices = devices.filter(device => {
        const isTrusted = device.isTrusted && 
                          (now - device.firstSeen) < this.config.deviceTrustDuration;
        if (!isTrusted) cleanedCount++;
        return isTrusted;
      });

      if (trustedDevices.length === 0) {
        this.knownDevices.delete(userId);
      } else {
        this.knownDevices.set(userId, trustedDevices);
      }
    }

    if (cleanedCount > 0) {
      logger.info('Nettoyage des sessions terminé', { cleanedCount });
    }
  }

  /**
   * Obtenir les sessions actives d'un utilisateur
   */
  getUserSessions(userId) {
    return this.activeSessions.get(userId) || [];
  }

  /**
   * Obtenir les appareils connus d'un utilisateur
   */
  getUserDevices(userId) {
    return this.knownDevices.get(userId) || [];
  }

  /**
   * Obtenir la configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Mettre à jour la configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    logger.info('Configuration de sécurité des sessions mise à jour', newConfig);
  }

  /**
   * Obtenir les statistiques
   */
  getStats() {
    const totalSessions = Array.from(this.activeSessions.values())
      .reduce((sum, sessions) => sum + sessions.length, 0);
    
    const totalDevices = Array.from(this.knownDevices.values())
      .reduce((sum, devices) => sum + devices.length, 0);

    const suspiciousSessions = Array.from(this.activeSessions.values())
      .flat()
      .filter(session => session.isSuspicious).length;

    return {
      totalSessions,
      totalDevices,
      suspiciousSessions,
      activeUsers: this.activeSessions.size,
      config: this.config
    };
  }
}

export default SessionCore;

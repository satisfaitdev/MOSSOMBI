/**
 * SÉCURITÉ AVANCÉE DES SESSIONS
 * Détection d'anomalies et monitoring de sécurité
 */

import SessionCore from './sessionCore.js';
import { logger } from '../../utils/logger.js';

class SessionSecurity {
  constructor(core) {
    this.core = core;
    
    // Configuration de sécurité avancée
    this.securityConfig = {
      rapidLoginThreshold: 5,        // Connexions rapides en 5 minutes
      rapidLoginWindow: 5 * 60 * 1000, // 5 minutes
      maxFailedLogins: 3,           // Échecs avant blocage
      failedLoginWindow: 15 * 60 * 1000, // 15 minutes
      suspiciousCountries: ['CN', 'RU', 'KP', 'IR'], // Pays à risque
      vpnProviders: ['NordVPN', 'ExpressVPN', 'CyberGhost'], // Fournisseurs VPN connus
      concurrentLocationThreshold: 2, // Connexions depuis lieux différents simultanément
      deviceRotationThreshold: 5,      // Changements d'appareils fréquents
      deviceRotationWindow: 24 * 60 * 60 * 1000 // 24 heures
    };

    // Suivi des patterns suspects
    this.failedLoginAttempts = new Map(); // userId -> [{timestamp, ip, device}]
    this.rapidLogins = new Map(); // userId -> [timestamp, ...]
    this.deviceRotations = new Map(); // userId -> [{timestamp, fingerprint}, ...]
    this.concurrentLocations = new Map(); // userId -> Set<location>
    this.blockedIPs = new Set(); // IPs bloquées temporairement
  }

  /**
   * Analyser une tentative de connexion pour la sécurité
   */
  analyzeLoginAttempt(userId, deviceInfo, locationInfo, loginResult) {
    const analysis = {
      riskScore: 0,
      alerts: [],
      isBlocked: false,
      recommendations: []
    };

    const now = Date.now();
    const ip = deviceInfo.ip || 'unknown';

    // 1. Vérifier les tentatives échouées
    if (!loginResult.success) {
      this.recordFailedLogin(userId, ip, deviceInfo);
      const failedCount = this.getRecentFailedLogins(userId);
      
      if (failedCount >= this.securityConfig.maxFailedLogins) {
        analysis.isBlocked = true;
        analysis.riskScore += 50;
        analysis.alerts.push({
          type: 'BRUTE_FORCE_DETECTED',
          severity: 'HIGH',
          message: `Multiples tentatives de connexion échouées (${failedCount})`,
          action: 'BLOCK_IP_TEMPORARILY'
        });
        this.blockIP(ip, 30 * 60 * 1000); // 30 minutes
      } else {
        analysis.riskScore += failedCount * 10;
        analysis.alerts.push({
          type: 'FAILED_LOGIN',
          severity: 'MEDIUM',
          message: `Échec de connexion (${failedCount}/${this.securityConfig.maxFailedLogins})`
        });
      }
    }

    // 2. Vérifier les connexions rapides
    if (loginResult.success) {
      const rapidCount = this.getRecentRapidLogins(userId);
      if (rapidCount >= this.securityConfig.rapidLoginThreshold) {
        analysis.riskScore += 30;
        analysis.alerts.push({
          type: 'RAPID_LOGINS',
          severity: 'HIGH',
          message: `Connexions rapides détectées (${rapidCount} en 5 minutes)`
        });
        analysis.recommendations.push('ENABLE_2FA');
      }
      this.recordRapidLogin(userId);
    }

    // 3. Vérifier la rotation d'appareils
    if (loginResult.success) {
      const deviceRotations = this.getRecentDeviceRotations(userId);
      if (deviceRotations >= this.securityConfig.deviceRotationThreshold) {
        analysis.riskScore += 25;
        analysis.alerts.push({
          type: 'DEVICE_ROTATION',
          severity: 'MEDIUM',
          message: `Changements d'appareils fréquents (${deviceRotations} en 24h)`
        });
        analysis.recommendations.push('VERIFY_DEVICE');
      }
      this.recordDeviceRotation(userId, deviceInfo.fingerprint);
    }

    // 4. Vérifier les localisations concurrentes
    if (loginResult.success && locationInfo.coordinates) {
      const locationKey = `${locationInfo.coordinates.lat.toFixed(2)},${locationInfo.coordinates.lon.toFixed(2)}`;
      const userLocations = this.concurrentLocations.get(userId) || new Set();
      
      if (userLocations.size >= this.securityConfig.concurrentLocationThreshold) {
        analysis.riskScore += 20;
        analysis.alerts.push({
          type: 'CONCURRENT_LOCATIONS',
          severity: 'MEDIUM',
          message: `Connexions depuis ${userLocations.size} localisations différentes simultanément`
        });
      }
      
      userLocations.add(locationKey);
      this.concurrentLocations.set(userId, userLocations);
      
      // Nettoyer après une heure
      setTimeout(() => {
        const currentLocations = this.concurrentLocations.get(userId);
        if (currentLocations) {
          currentLocations.delete(locationKey);
          if (currentLocations.size === 0) {
            this.concurrentLocations.delete(userId);
          }
        }
      }, 60 * 60 * 1000);
    }

    // 5. Vérifier les pays à risque
    if (loginResult.success && locationInfo.country) {
      if (this.securityConfig.suspiciousCountries.includes(locationInfo.country)) {
        analysis.riskScore += 35;
        analysis.alerts.push({
          type: 'SUSPICIOUS_COUNTRY',
          severity: 'HIGH',
          message: `Connexion depuis un pays à risque: ${locationInfo.country}`
        });
        analysis.recommendations.push('ENHANCED_VERIFICATION');
      }
    }

    // 6. Vérifier les VPN
    if (loginResult.success && deviceInfo.userAgent) {
      const userAgent = deviceInfo.userAgent.toLowerCase();
      const isVPN = this.securityConfig.vpnProviders.some(vpn => 
        userAgent.includes(vpn.toLowerCase())
      );
      
      if (isVPN) {
        analysis.riskScore += 15;
        analysis.alerts.push({
          type: 'VPN_DETECTED',
          severity: 'MEDIUM',
          message: 'Connexion via VPN détectée'
        });
      }
    }

    // 7. Vérifier si l'IP est bloquée
    if (this.blockedIPs.has(ip)) {
      analysis.isBlocked = true;
      analysis.riskScore += 100;
      analysis.alerts.push({
        type: 'IP_BLOCKED',
        severity: 'CRITICAL',
        message: 'Adresse IP bloquée pour raisons de sécurité'
      });
    }

    // 8. Calculer le score de risque final
    if (analysis.riskScore >= 80) {
      analysis.isBlocked = true;
      analysis.alerts.push({
        type: 'HIGH_RISK_SCORE',
        severity: 'CRITICAL',
        message: `Score de risque élevé: ${analysis.riskScore}/100`,
        action: 'REQUIRE_ADDITIONAL_VERIFICATION'
      });
    }

    // 9. Générer des recommandations basées sur le score
    if (analysis.riskScore >= 40 && !analysis.recommendations.includes('ENABLE_2FA')) {
      analysis.recommendations.push('ENABLE_2FA');
    }
    
    if (analysis.riskScore >= 60 && !analysis.recommendations.includes('ENHANCED_VERIFICATION')) {
      analysis.recommendations.push('ENHANCED_VERIFICATION');
    }

    return analysis;
  }

  /**
   * Enregistrer une tentative de connexion échouée
   */
  recordFailedLogin(userId, ip, deviceInfo) {
    const attempts = this.failedLoginAttempts.get(userId) || [];
    attempts.push({
      timestamp: Date.now(),
      ip,
      fingerprint: deviceInfo.fingerprint,
      userAgent: deviceInfo.userAgent
    });
    this.failedLoginAttempts.set(userId, attempts);

    // Nettoyer après la fenêtre de temps
    setTimeout(() => {
      const currentAttempts = this.failedLoginAttempts.get(userId) || [];
      const recentAttempts = currentAttempts.filter(
        attempt => Date.now() - attempt.timestamp < this.securityConfig.failedLoginWindow
      );
      
      if (recentAttempts.length === 0) {
        this.failedLoginAttempts.delete(userId);
      } else {
        this.failedLoginAttempts.set(userId, recentAttempts);
      }
    }, this.securityConfig.failedLoginWindow);
  }

  /**
   * Obtenir le nombre de tentatives échouées récentes
   */
  getRecentFailedLogins(userId) {
    const attempts = this.failedLoginAttempts.get(userId) || [];
    return attempts.filter(
      attempt => Date.now() - attempt.timestamp < this.securityConfig.failedLoginWindow
    ).length;
  }

  /**
   * Enregistrer une connexion rapide
   */
  recordRapidLogin(userId) {
    const logins = this.rapidLogins.get(userId) || [];
    logins.push(Date.now());
    this.rapidLogins.set(userId, logins);

    // Nettoyer après la fenêtre de temps
    setTimeout(() => {
      const currentLogins = this.rapidLogins.get(userId) || [];
      const recentLogins = currentLogins.filter(
        timestamp => Date.now() - timestamp < this.securityConfig.rapidLoginWindow
      );
      
      if (recentLogins.length === 0) {
        this.rapidLogins.delete(userId);
      } else {
        this.rapidLogins.set(userId, recentLogins);
      }
    }, this.securityConfig.rapidLoginWindow);
  }

  /**
   * Obtenir le nombre de connexions rapides récentes
   */
  getRecentRapidLogins(userId) {
    const logins = this.rapidLogins.get(userId) || [];
    return logins.filter(
      timestamp => Date.now() - timestamp < this.securityConfig.rapidLoginWindow
    ).length;
  }

  /**
   * Enregistrer une rotation d'appareil
   */
  recordDeviceRotation(userId, fingerprint) {
    const rotations = this.deviceRotations.get(userId) || [];
    rotations.push({
      timestamp: Date.now(),
      fingerprint
    });
    this.deviceRotations.set(userId, rotations);

    // Nettoyer après la fenêtre de temps
    setTimeout(() => {
      const currentRotations = this.deviceRotations.get(userId) || [];
      const recentRotations = currentRotations.filter(
        rotation => Date.now() - rotation.timestamp < this.securityConfig.deviceRotationWindow
      );
      
      if (recentRotations.length === 0) {
        this.deviceRotations.delete(userId);
      } else {
        this.deviceRotations.set(userId, recentRotations);
      }
    }, this.securityConfig.deviceRotationWindow);
  }

  /**
   * Obtenir le nombre de rotations d'appareils récentes
   */
  getRecentDeviceRotations(userId) {
    const rotations = this.deviceRotations.get(userId) || [];
    return rotations.filter(
      rotation => Date.now() - rotation.timestamp < this.securityConfig.deviceRotationWindow
    ).length;
  }

  /**
   * Bloquer une adresse IP temporairement
   */
  blockIP(ip, duration) {
    this.blockedIPs.add(ip);
    
    setTimeout(() => {
      this.blockedIPs.delete(ip);
      logger.info('IP débloquée', { ip });
    }, duration);
    
    logger.warn('IP bloquée temporairement', { ip, duration: duration / 1000 / 60 + ' minutes' });
  }

  /**
   * Vérifier si une IP est bloquée
   */
  isIPBlocked(ip) {
    return this.blockedIPs.has(ip);
  }

  /**
   * Obtenir les statistiques de sécurité
   */
  getSecurityStats() {
    return {
      blockedIPs: this.blockedIPs.size,
      failedLoginAttempts: Array.from(this.failedLoginAttempts.values())
        .reduce((sum, attempts) => sum + attempts.length, 0),
      rapidLogins: Array.from(this.rapidLogins.values())
        .reduce((sum, logins) => sum + logins.length, 0),
      deviceRotations: Array.from(this.deviceRotations.values())
        .reduce((sum, rotations) => sum + rotations.length, 0),
      concurrentLocations: Array.from(this.concurrentLocations.values())
        .reduce((sum, locations) => sum + locations.size, 0),
      config: this.securityConfig
    };
  }

  /**
   * Nettoyer les anciennes données de sécurité
   */
  cleanup() {
    const now = Date.now();
    
    // Nettoyer les tentatives échouées expirées
    for (const [userId, attempts] of this.failedLoginAttempts.entries()) {
      const recentAttempts = attempts.filter(
        attempt => now - attempt.timestamp < this.securityConfig.failedLoginWindow
      );
      
      if (recentAttempts.length === 0) {
        this.failedLoginAttempts.delete(userId);
      } else {
        this.failedLoginAttempts.set(userId, recentAttempts);
      }
    }

    // Nettoyer les connexions rapides expirées
    for (const [userId, logins] of this.rapidLogins.entries()) {
      const recentLogins = logins.filter(
        timestamp => now - timestamp < this.securityConfig.rapidLoginWindow
      );
      
      if (recentLogins.length === 0) {
        this.rapidLogins.delete(userId);
      } else {
        this.rapidLogins.set(userId, recentLogins);
      }
    }

    // Nettoyer les rotations d'appareils expirées
    for (const [userId, rotations] of this.deviceRotations.entries()) {
      const recentRotations = rotations.filter(
        rotation => now - rotation.timestamp < this.securityConfig.deviceRotationWindow
      );
      
      if (recentRotations.length === 0) {
        this.deviceRotations.delete(userId);
      } else {
        this.deviceRotations.set(userId, recentRotations);
      }
    }

    // Nettoyer les localisations concurrentes expirées
    for (const [userId, locations] of this.concurrentLocations.entries()) {
      if (locations.size === 0) {
        this.concurrentLocations.delete(userId);
      }
    }

    logger.info('Nettoyage des données de sécurité terminé');
  }
}

export default SessionSecurity;

/**
 * SERVICE DE RATE LIMITING AVANCÉ
 * Protection contre les attaques par déni de service et abus
 */

import { logger } from '../utils/logger.js';

class RateLimitService {
  constructor() {
    // Stockage des tentatives par IP
    this.ipAttempts = new Map(); // ip -> { count, firstAttempt, lastAttempt, blocked }
    
    // Stockage des tentatives par utilisateur
    this.userAttempts = new Map(); // userId -> { count, firstAttempt, lastAttempt, blocked }
    
    // Stockage des IP bloquées
    this.blockedIPs = new Map(); // ip -> { blockedUntil, reason, attempts }
    
    // Configuration des limites
    this.limits = {
      // Limites par IP
      ip: {
        general: { requests: 100, window: 15 * 60 * 1000 }, // 100 req/15min
        auth: { requests: 20, window: 15 * 60 * 1000 },     // 20 auth/15min
        sensitive: { requests: 5, window: 5 * 60 * 1000 }   // 5 actions sensibles/5min
      },
      
      // Limites par utilisateur
      user: {
        general: { requests: 200, window: 60 * 60 * 1000 }, // 200 req/heure
        auth: { requests: 10, window: 15 * 60 * 1000 },     // 10 auth/15min
        financial: { requests: 20, window: 60 * 60 * 1000 } // 20 transactions/heure
      },
      
      // Seuils de blocage
      blocking: {
        ip: {
          suspicious: 3,    // 3 violations -> blocage 1h
          malicious: 5,     // 5 violations -> blocage 24h
          permanent: 10     // 10 violations -> blocage permanent
        },
        user: {
          warning: 2,       // 2 violations -> alerte
          temporary: 4,     // 4 violations -> blocage 30min
          extended: 8       // 8 violations -> blocage 24h
        }
      }
    };

    // Nettoyage automatique toutes les 10 minutes
    const interval = setInterval(() => this.cleanup(), 10 * 60 * 1000);
    if (process.env.NODE_ENV === 'test') {
      interval.unref();
    }
  }

  /**
   * Vérifier les limites pour une requête
   * @param {string} ip - Adresse IP
   * @param {string} userId - ID utilisateur (optionnel)
   * @param {string} action - Type d'action (general, auth, sensitive, financial)
   * @returns {Object} Résultat de la vérification
   */
  checkLimits(ip, userId = null, action = 'general') {
    const now = Date.now();
    
    // Vérifier si l'IP est bloquée
    const ipBlockCheck = this.checkIPBlock(ip);
    if (ipBlockCheck.blocked) {
      return ipBlockCheck;
    }

    // Vérifier les limites IP
    const ipCheck = this.checkIPLimit(ip, action, now);
    if (!ipCheck.allowed) {
      return ipCheck;
    }

    // Vérifier les limites utilisateur si connecté
    if (userId) {
      const userCheck = this.checkUserLimit(userId, action, now);
      if (!userCheck.allowed) {
        return userCheck;
      }
    }

    return {
      allowed: true,
      remaining: {
        ip: ipCheck.remaining,
        user: userId ? this.getUserRemaining(userId, action) : null
      }
    };
  }

  /**
   * Enregistrer une requête
   * @param {string} ip - Adresse IP
   * @param {string} userId - ID utilisateur
   * @param {string} action - Type d'action
   * @param {boolean} success - Si la requête a réussi
   */
  recordRequest(ip, userId = null, action = 'general', success = true) {
    const now = Date.now();

    // Enregistrer pour l'IP
    this.recordIPRequest(ip, action, now, success);

    // Enregistrer pour l'utilisateur
    if (userId) {
      this.recordUserRequest(userId, action, now, success);
    }

    // Vérifier si des blocages sont nécessaires
    this.checkForBlocking(ip, userId, success);
  }

  /**
   * Vérifier si une IP est bloquée
   */
  checkIPBlock(ip) {
    const blocked = this.blockedIPs.get(ip);
    
    if (!blocked) {
      return { blocked: false };
    }

    // Vérifier si le blocage est expiré
    if (blocked.blockedUntil !== -1 && Date.now() > blocked.blockedUntil) {
      this.blockedIPs.delete(ip);
      logger.info('Déblocage automatique IP', { ip });
      return { blocked: false };
    }

    const remainingTime = blocked.blockedUntil === -1 
      ? 'permanent' 
      : this.formatDuration(blocked.blockedUntil - Date.now());

    return {
      blocked: true,
      reason: blocked.reason,
      remainingTime,
      isPermanent: blocked.blockedUntil === -1
    };
  }

  /**
   * Vérifier les limites IP
   */
  checkIPLimit(ip, action, now) {
    const limit = this.limits.ip[action] || this.limits.ip.general;
    const attempts = this.ipAttempts.get(ip) || { count: 0, firstAttempt: now };

    // Nettoyer si la fenêtre est expirée
    if (now - attempts.firstAttempt > limit.window) {
      attempts.count = 0;
      attempts.firstAttempt = now;
    }

    const remaining = Math.max(0, limit.requests - attempts.count);
    
    if (attempts.count >= limit.requests) {
      logger.warn('Limite IP dépassée', { 
        ip, 
        action, 
        attempts: attempts.count, 
        limit: limit.requests 
      });

      return {
        allowed: false,
        reason: 'IP_RATE_LIMIT',
        retryAfter: Math.ceil((attempts.firstAttempt + limit.window - now) / 1000),
        remaining: 0
      };
    }

    return { allowed: true, remaining };
  }

  /**
   * Vérifier les limites utilisateur
   */
  checkUserLimit(userId, action, now) {
    const limit = this.limits.user[action] || this.limits.user.general;
    const attempts = this.userAttempts.get(userId) || { count: 0, firstAttempt: now };

    // Nettoyer si la fenêtre est expirée
    if (now - attempts.firstAttempt > limit.window) {
      attempts.count = 0;
      attempts.firstAttempt = now;
    }

    const remaining = Math.max(0, limit.requests - attempts.count);

    if (attempts.count >= limit.requests) {
      logger.warn('Limite utilisateur dépassée', { 
        userId, 
        action, 
        attempts: attempts.count, 
        limit: limit.requests 
      });

      return {
        allowed: false,
        reason: 'USER_RATE_LIMIT',
        retryAfter: Math.ceil((attempts.firstAttempt + limit.window - now) / 1000),
        remaining: 0
      };
    }

    return { allowed: true, remaining };
  }

  /**
   * Enregistrer une requête IP
   */
  recordIPRequest(ip, action, now, success) {
    const key = `${ip}:${action}`;
    const attempts = this.ipAttempts.get(key) || { 
      count: 0, 
      firstAttempt: now, 
      violations: 0 
    };

    const limit = this.limits.ip[action] || this.limits.ip.general;

    // Réinitialiser si nouvelle fenêtre
    if (now - attempts.firstAttempt > limit.window) {
      attempts.count = 0;
      attempts.firstAttempt = now;
    }

    attempts.count++;
    attempts.lastAttempt = now;

    // Compter les violations (échecs)
    if (!success) {
      attempts.violations = (attempts.violations || 0) + 1;
    }

    this.ipAttempts.set(key, attempts);
  }

  /**
   * Enregistrer une requête utilisateur
   */
  recordUserRequest(userId, action, now, success) {
    const key = `${userId}:${action}`;
    const attempts = this.userAttempts.get(key) || { 
      count: 0, 
      firstAttempt: now, 
      violations: 0 
    };

    const limit = this.limits.user[action] || this.limits.user.general;

    // Réinitialiser si nouvelle fenêtre
    if (now - attempts.firstAttempt > limit.window) {
      attempts.count = 0;
      attempts.firstAttempt = now;
    }

    attempts.count++;
    attempts.lastAttempt = now;

    // Compter les violations
    if (!success) {
      attempts.violations = (attempts.violations || 0) + 1;
    }

    this.userAttempts.set(key, attempts);
  }

  /**
   * Vérifier si des blocages sont nécessaires
   */
  checkForBlocking(ip, userId, success) {
    if (success) return; // Pas de blocage si succès

    // Vérifier blocage IP
    const ipViolations = this.getIPViolations(ip);
    if (ipViolations >= this.limits.blocking.ip.permanent) {
      this.blockIP(ip, -1, 'Activité malveillante détectée (permanent)');
    } else if (ipViolations >= this.limits.blocking.ip.malicious) {
      this.blockIP(ip, 24 * 60 * 60 * 1000, 'Activité malveillante détectée (24h)');
    } else if (ipViolations >= this.limits.blocking.ip.suspicious) {
      this.blockIP(ip, 60 * 60 * 1000, 'Activité suspecte détectée (1h)');
    }

    // Vérifier blocage utilisateur
    if (userId) {
      const userViolations = this.getUserViolations(userId);
      if (userViolations >= this.limits.blocking.user.extended) {
        logger.warn('Utilisateur bloqué 24h', { userId, violations: userViolations });
      } else if (userViolations >= this.limits.blocking.user.temporary) {
        logger.warn('Utilisateur bloqué 30min', { userId, violations: userViolations });
      } else if (userViolations >= this.limits.blocking.user.warning) {
        logger.warn('Alerte utilisateur', { userId, violations: userViolations });
      }
    }
  }

  /**
   * Bloquer une IP
   */
  blockIP(ip, duration, reason) {
    const blockedUntil = duration === -1 ? -1 : Date.now() + duration;
    
    this.blockedIPs.set(ip, {
      blockedUntil,
      reason,
      blockedAt: Date.now(),
      attempts: this.getIPViolations(ip)
    });

    logger.error('IP bloquée', { 
      ip, 
      reason, 
      duration: duration === -1 ? 'permanent' : this.formatDuration(duration) 
    });
  }

  /**
   * Obtenir le nombre de violations IP
   */
  getIPViolations(ip) {
    let totalViolations = 0;
    for (const [key, data] of this.ipAttempts.entries()) {
      if (key.startsWith(ip + ':')) {
        totalViolations += data.violations || 0;
      }
    }
    return totalViolations;
  }

  /**
   * Obtenir le nombre de violations utilisateur
   */
  getUserViolations(userId) {
    let totalViolations = 0;
    for (const [key, data] of this.userAttempts.entries()) {
      if (key.startsWith(userId + ':')) {
        totalViolations += data.violations || 0;
      }
    }
    return totalViolations;
  }

  /**
   * Obtenir les requêtes restantes pour un utilisateur
   */
  getUserRemaining(userId, action) {
    const limit = this.limits.user[action] || this.limits.user.general;
    const key = `${userId}:${action}`;
    const attempts = this.userAttempts.get(key);
    
    if (!attempts) return limit.requests;
    
    return Math.max(0, limit.requests - attempts.count);
  }

  /**
   * Débloquer une IP (admin)
   */
  unblockIP(ip, adminId) {
    const wasBlocked = this.blockedIPs.has(ip);
    this.blockedIPs.delete(ip);
    
    // Nettoyer les tentatives
    for (const key of this.ipAttempts.keys()) {
      if (key.startsWith(ip + ':')) {
        this.ipAttempts.delete(key);
      }
    }

    if (wasBlocked) {
      logger.info('IP débloquée par admin', { ip, adminId });
    }

    return wasBlocked;
  }

  /**
   * Obtenir les statistiques
   */
  getStats() {
    return {
      blockedIPs: this.blockedIPs.size,
      activeIPTracking: this.ipAttempts.size,
      activeUserTracking: this.userAttempts.size,
      permanentBlocks: Array.from(this.blockedIPs.values())
        .filter(block => block.blockedUntil === -1).length
    };
  }

  /**
   * Nettoyer les anciennes données
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    // Nettoyer les blocages IP expirés
    for (const [ip, blockData] of this.blockedIPs.entries()) {
      if (blockData.blockedUntil !== -1 && now > blockData.blockedUntil) {
        this.blockedIPs.delete(ip);
        cleaned++;
      }
    }

    // Nettoyer les tentatives anciennes (2 heures)
    const maxAge = 2 * 60 * 60 * 1000;
    
    for (const [key, data] of this.ipAttempts.entries()) {
      if (now - data.lastAttempt > maxAge) {
        this.ipAttempts.delete(key);
        cleaned++;
      }
    }

    for (const [key, data] of this.userAttempts.entries()) {
      if (now - data.lastAttempt > maxAge) {
        this.userAttempts.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info('Nettoyage rate limiting', { recordsCleaned: cleaned });
    }
  }

  /**
   * Formater une durée
   */
  formatDuration(ms) {
    const minutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} jour(s)`;
    if (hours > 0) return `${hours} heure(s)`;
    return `${minutes} minute(s)`;
  }
}

// Instance singleton
export const rateLimitService = new RateLimitService();

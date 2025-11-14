/**
 * SERVICE DE RATE LIMITING AVEC REDIS
 * Version production avec Redis pour la scalabilité
 */

import { redisManager } from '../config/redis.js';
import { logger } from '../utils/logger.js';

class RedisRateLimitService {
  constructor() {
    this.config = {
      // Limites par IP
      ip: {
        general: { requests: 100, window: 15 * 60 }, // 100 req/15min
        auth: { requests: 20, window: 15 * 60 },     // 20 auth/15min
        sensitive: { requests: 5, window: 5 * 60 }   // 5 actions sensibles/5min
      },
      
      // Limites par utilisateur
      user: {
        general: { requests: 200, window: 60 * 60 }, // 200 req/heure
        auth: { requests: 10, window: 15 * 60 },     // 10 auth/15min
        financial: { requests: 20, window: 60 * 60 } // 20 transactions/heure
      },
      
      // Seuils de blocage
      blocking: {
        ip: {
          suspicious: 3,    // 3 violations -> blocage 1h
          malicious: 5,     // 5 violations -> blocage 24h
          permanent: 10     // 10 violations -> blocage permanent
        }
      }
    };
  }

  /**
   * Vérifier les limites pour une requête
   */
  async checkLimits(ip, userId = null, action = 'general') {
    try {
      // Vérifier si l'IP est bloquée
      const ipBlockCheck = await this.checkIPBlock(ip);
      if (ipBlockCheck.blocked) {
        return ipBlockCheck;
      }

      // Vérifier les limites IP
      const ipCheck = await this.checkIPLimit(ip, action);
      if (!ipCheck.allowed) {
        return ipCheck;
      }

      // Vérifier les limites utilisateur si connecté
      if (userId) {
        const userCheck = await this.checkUserLimit(userId, action);
        if (!userCheck.allowed) {
          return userCheck;
        }
      }

      return {
        allowed: true,
        remaining: {
          ip: ipCheck.remaining,
          user: userId ? await this.getUserRemaining(userId, action) : null
        }
      };
    } catch (error) {
      logger.error('Erreur vérification limites Redis:', { error: error.message });
      // En cas d'erreur Redis, permettre la requête mais logger
      return { allowed: true, fallback: true };
    }
  }

  /**
   * Vérifier si une IP est bloquée
   */
  async checkIPBlock(ip) {
    const blockKey = `block:ip:${ip}`;
    const blockData = await redisManager.get(blockKey);
    
    if (!blockData) {
      return { blocked: false };
    }

    const remainingTime = blockData.blockedUntil === -1 
      ? 'permanent' 
      : Math.max(0, blockData.blockedUntil - Date.now());

    if (blockData.blockedUntil !== -1 && remainingTime <= 0) {
      await redisManager.del(blockKey);
      return { blocked: false };
    }

    return {
      blocked: true,
      reason: blockData.reason,
      remainingTime: this.formatDuration(remainingTime),
      isPermanent: blockData.blockedUntil === -1
    };
  }

  /**
   * Vérifier les limites IP
   */
  async checkIPLimit(ip, action) {
    const limit = this.config.ip[action] || this.config.ip.general;
    const key = `rate:ip:${ip}:${action}`;
    
    const current = await redisManager.incr(key, limit.window);
    const remaining = Math.max(0, limit.requests - current);
    
    if (current > limit.requests) {
      const ttl = await redisManager.ttl(key);
      
      logger.warn('Limite IP dépassée', { 
        ip, 
        action, 
        attempts: current, 
        limit: limit.requests 
      });

      return {
        allowed: false,
        reason: 'IP_RATE_LIMIT',
        retryAfter: ttl,
        remaining: 0
      };
    }

    return { allowed: true, remaining };
  }

  /**
   * Vérifier les limites utilisateur
   */
  async checkUserLimit(userId, action) {
    const limit = this.config.user[action] || this.config.user.general;
    const key = `rate:user:${userId}:${action}`;
    
    const current = await redisManager.incr(key, limit.window);
    const remaining = Math.max(0, limit.requests - current);

    if (current > limit.requests) {
      const ttl = await redisManager.ttl(key);
      
      logger.warn('Limite utilisateur dépassée', { 
        userId, 
        action, 
        attempts: current, 
        limit: limit.requests 
      });

      return {
        allowed: false,
        reason: 'USER_RATE_LIMIT',
        retryAfter: ttl,
        remaining: 0
      };
    }

    return { allowed: true, remaining };
  }

  /**
   * Enregistrer une requête
   */
  async recordRequest(ip, userId = null, action = 'general', success = true) {
    try {
      // Les compteurs sont déjà mis à jour par checkLimits
      
      // Enregistrer les violations pour le blocage
      if (!success) {
        await this.recordViolation(ip, userId, action);
      }
    } catch (error) {
      logger.error('Erreur enregistrement requête Redis:', { error: error.message });
    }
  }

  /**
   * Enregistrer une violation
   */
  async recordViolation(ip, userId, action) {
    const violationKey = `violations:ip:${ip}`;
    const violations = await redisManager.incr(violationKey, 24 * 60 * 60); // 24h
    
    // Vérifier si un blocage est nécessaire
    if (violations >= this.config.blocking.ip.permanent) {
      await this.blockIP(ip, -1, 'Activité malveillante détectée (permanent)');
    } else if (violations >= this.config.blocking.ip.malicious) {
      await this.blockIP(ip, 24 * 60 * 60 * 1000, 'Activité malveillante détectée (24h)');
    } else if (violations >= this.config.blocking.ip.suspicious) {
      await this.blockIP(ip, 60 * 60 * 1000, 'Activité suspecte détectée (1h)');
    }
  }

  /**
   * Bloquer une IP
   */
  async blockIP(ip, duration, reason) {
    const blockKey = `block:ip:${ip}`;
    const blockedUntil = duration === -1 ? -1 : Date.now() + duration;
    
    const blockData = {
      blockedUntil,
      reason,
      blockedAt: Date.now(),
      ip
    };
    
    const ttl = duration === -1 ? 365 * 24 * 60 * 60 : Math.ceil(duration / 1000); // 1 an si permanent
    await redisManager.set(blockKey, blockData, ttl);

    logger.error('IP bloquée', { 
      ip, 
      reason, 
      duration: duration === -1 ? 'permanent' : this.formatDuration(duration) 
    });
  }

  /**
   * Débloquer une IP (admin)
   */
  async unblockIP(ip, adminId) {
    const blockKey = `block:ip:${ip}`;
    const violationKey = `violations:ip:${ip}`;
    
    const wasBlocked = await redisManager.exists(blockKey);
    
    await redisManager.del(blockKey);
    await redisManager.del(violationKey);
    
    // Nettoyer tous les compteurs de rate limiting pour cette IP
    const keys = await redisManager.keys(`rate:ip:${ip}:*`);
    for (const key of keys) {
      await redisManager.del(key.replace('mossombi:', ''));
    }

    if (wasBlocked) {
      logger.info('IP débloquée par admin', { ip, adminId });
    }

    return wasBlocked;
  }

  /**
   * Obtenir les requêtes restantes pour un utilisateur
   */
  async getUserRemaining(userId, action) {
    const limit = this.config.user[action] || this.config.user.general;
    const key = `rate:user:${userId}:${action}`;
    
    const current = await redisManager.get(key) || 0;
    return Math.max(0, limit.requests - current);
  }

  /**
   * Obtenir les statistiques
   */
  async getStats() {
    try {
      const blockedIPs = await redisManager.keys('block:ip:*');
      const rateKeys = await redisManager.keys('rate:*');
      const violationKeys = await redisManager.keys('violations:*');
      
      return {
        blockedIPs: blockedIPs.length,
        activeRateLimiting: rateKeys.length,
        totalViolations: violationKeys.length,
        redisConnected: redisManager.isConnected
      };
    } catch (error) {
      logger.error('Erreur stats Redis rate limiting:', { error: error.message });
      return {
        blockedIPs: 0,
        activeRateLimiting: 0,
        totalViolations: 0,
        redisConnected: false,
        error: error.message
      };
    }
  }

  /**
   * Formater une durée
   */
  formatDuration(ms) {
    if (ms === 'permanent') return 'permanent';
    
    const minutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} jour(s)`;
    if (hours > 0) return `${hours} heure(s)`;
    return `${minutes} minute(s)`;
  }

  /**
   * Nettoyer les données expirées (optionnel avec Redis)
   */
  async cleanup() {
    // Redis gère automatiquement l'expiration, mais on peut nettoyer manuellement
    try {
      const expiredKeys = [];
      const blockKeys = await redisManager.keys('block:ip:*');
      
      for (const key of blockKeys) {
        const ttl = await redisManager.ttl(key.replace('mossombi:', ''));
        if (ttl === -2) { // Clé expirée
          expiredKeys.push(key);
        }
      }
      
      if (expiredKeys.length > 0) {
        logger.info('Nettoyage Redis rate limiting', { expiredKeys: expiredKeys.length });
      }
    } catch (error) {
      logger.error('Erreur nettoyage Redis:', { error: error.message });
    }
  }
}

// Instance singleton
export const redisRateLimitService = new RedisRateLimitService();

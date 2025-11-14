/**
 * MIDDLEWARE DE RATE LIMITING
 * Application des limites de taux pour différents types d'actions
 */

import { rateLimitService } from '../services/rateLimitService.js';
import { redisRateLimitService } from '../services/redisRateLimitService.js';
import { redisManager } from '../config/redis.js';
import { monitoringService } from '../services/monitoringService.js';
import { alertService } from '../services/alertService.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware de rate limiting général
 * @param {string} action - Type d'action (general, auth, sensitive, financial)
 */
export const rateLimit = (action = 'general') => {
  return async (req, res, next) => {
    try {
      const ip = req.ip || req.connection.remoteAddress;
      const userId = req.user?.id || null;

      // Utiliser Redis si disponible, sinon fallback sur le service mémoire
      const rateLimitSvc = redisManager.isConnected ? redisRateLimitService : rateLimitService;
      
      // Vérifier les limites
      const check = await rateLimitSvc.checkLimits(ip, userId, action);

      if (!check.allowed) {
        // Enregistrer la tentative bloquée
        await rateLimitSvc.recordRequest(ip, userId, action, false);

        // Enregistrer dans le monitoring
        monitoringService.recordSecurityEvent('rate_limit_violation', {
          ip,
          userId,
          action,
          reason: check.reason
        });

        // Envoyer une alerte si c'est critique
        if (check.reason === 'IP_RATE_LIMIT' && action === 'auth') {
          await alertService.alertRateLimitExceeded(ip, req.originalUrl, 'Multiple attempts');
        }

        logger.warn('Requête bloquée par rate limiting', {
          ip,
          userId,
          action,
          reason: check.reason,
          userAgent: req.get('User-Agent')
        });

        return res.status(429).json({
          success: false,
          error: 'Trop de tentatives. Veuillez patienter avant de réessayer.',
          code: check.reason,
          data: {
            retryAfter: check.retryAfter,
            remainingTime: check.remainingTime,
            isPermanent: check.isPermanent
          }
        });
      }

      // Ajouter les informations de rate limiting à la requête
      req.rateLimit = {
        remaining: check.remaining,
        action,
        ip,
        userId
      };

      // Intercepter la réponse pour enregistrer le résultat
      const originalSend = res.send;
      res.send = function(data) {
        try {
          let success = false;
          
          if (typeof data === 'string') {
            try {
              const parsedData = JSON.parse(data);
              success = parsedData.success === true && res.statusCode < 400;
            } catch (e) {
              success = res.statusCode < 400;
            }
          } else if (typeof data === 'object') {
            success = data.success === true && res.statusCode < 400;
          } else {
            success = res.statusCode < 400;
          }

          // Enregistrer la requête
          rateLimitService.recordRequest(ip, userId, action, success);

          // Ajouter les headers de rate limiting
          if (check.remaining) {
            if (check.remaining.ip !== undefined) {
              res.set('X-RateLimit-Remaining-IP', check.remaining.ip.toString());
            }
            if (check.remaining.user !== undefined && check.remaining.user !== null) {
              res.set('X-RateLimit-Remaining-User', check.remaining.user.toString());
            }
          }

        } catch (error) {
          logger.error('Erreur enregistrement rate limit', { error: error.message });
        }

        originalSend.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Erreur middleware rate limiting', { error: error.message });
      next(error);
    }
  };
};

/**
 * Middleware spécialisé pour l'authentification
 */
export const authRateLimit = rateLimit('auth');

/**
 * Middleware spécialisé pour les actions sensibles
 */
export const sensitiveRateLimit = rateLimit('sensitive');

/**
 * Middleware spécialisé pour les transactions financières
 */
export const financialRateLimit = rateLimit('financial');

/**
 * Middleware pour les endpoints publics (plus permissif)
 */
export const publicRateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  
  // Limite simple pour les endpoints publics (200 req/15min)
  const check = rateLimitService.checkLimits(ip, null, 'general');
  
  if (!check.allowed) {
    logger.warn('Endpoint public bloqué', { ip, userAgent: req.get('User-Agent') });
    
    return res.status(429).json({
      success: false,
      error: 'Trop de requêtes. Veuillez patienter.',
      code: 'PUBLIC_RATE_LIMIT',
      data: {
        retryAfter: check.retryAfter
      }
    });
  }

  next();
};

/**
 * Middleware de protection contre les attaques par force brute
 */
export const bruteForceProtection = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map(); // ip -> { count, firstAttempt, blocked }

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Nettoyer les anciennes tentatives
    for (const [storedIp, data] of attempts.entries()) {
      if (now - data.firstAttempt > windowMs) {
        attempts.delete(storedIp);
      }
    }

    const ipData = attempts.get(ip) || { count: 0, firstAttempt: now, blocked: false };
    
    // Vérifier si l'IP est bloquée
    if (ipData.blocked && (now - ipData.firstAttempt) < windowMs) {
      logger.warn('IP bloquée par protection brute force', { ip });
      
      return res.status(429).json({
        success: false,
        error: 'Trop de tentatives échouées. Accès temporairement bloqué.',
        code: 'BRUTE_FORCE_PROTECTION',
        data: {
          retryAfter: Math.ceil((ipData.firstAttempt + windowMs - now) / 1000)
        }
      });
    }

    // Intercepter la réponse pour compter les échecs
    const originalSend = res.send;
    res.send = function(data) {
      try {
        let isFailure = false;
        
        // Détecter les échecs d'authentification
        if (res.statusCode >= 400) {
          isFailure = true;
        } else if (typeof data === 'string') {
          try {
            const parsedData = JSON.parse(data);
            isFailure = parsedData.success === false;
          } catch (e) {
            // Ignorer les erreurs de parsing
          }
        } else if (typeof data === 'object') {
          isFailure = data.success === false;
        }

        if (isFailure) {
          ipData.count++;
          
          if (ipData.count >= maxAttempts) {
            ipData.blocked = true;
            logger.warn('IP bloquée pour tentatives multiples', { 
              ip, 
              attempts: ipData.count,
              maxAttempts 
            });
          }
          
          attempts.set(ip, ipData);
        } else {
          // Succès - réinitialiser le compteur
          attempts.delete(ip);
        }
      } catch (error) {
        logger.error('Erreur protection brute force', { error: error.message });
      }

      originalSend.call(this, data);
    };

    next();
  };
};

/**
 * MIDDLEWARE DE SÉCURITÉ
 * Gestion centralisée des erreurs de sécurité et blocages
 */

import { otpSecurityService } from '../services/otpSecurityService.js';
import { logger } from '../utils/logger.js';
import { ValidationError } from './errorHandler.js';

/**
 * Middleware pour vérifier les blocages de sécurité
 * @param {string} action - Action à vérifier (register, verify-otp, etc.)
 */
export const checkSecurityBlock = (action) => {
  return (req, res, next) => {
    try {
      // Extraire le numéro de téléphone selon l'endpoint
      let phone = null;
      
      if (req.body.phone) {
        phone = req.body.phone;
      } else if (req.query.phone) {
        phone = req.query.phone;
      } else if (req.params.phone) {
        phone = req.params.phone;
      }

      if (!phone) {
        return next(); // Pas de numéro, continuer
      }

      // Vérifier le blocage
      const securityCheck = otpSecurityService.checkBlocked(phone, action);
      
      if (securityCheck.isBlocked) {
        const message = securityCheck.isPermanent 
          ? 'Votre numéro a été bloqué définitivement pour des raisons de sécurité'
          : `Trop de tentatives. Réessayez dans ${securityCheck.remainingTime}`;
        
        logger.warn('Tentative bloquée par sécurité', {
          phone: phone.replace(/[^\d]/g, ''),
          action,
          attempts: securityCheck.attempts,
          isPermanent: securityCheck.isPermanent,
          ip: req.ip
        });

        return res.status(429).json({
          success: false,
          error: message,
          code: 'ACCOUNT_BLOCKED',
          data: {
            attempts: securityCheck.attempts,
            blockedUntil: securityCheck.blockedUntil,
            isPermanent: securityCheck.isPermanent,
            remainingTime: securityCheck.remainingTime
          }
        });
      }

      // Ajouter les infos de sécurité à la requête
      req.securityInfo = {
        phone,
        action,
        checkPassed: true
      };

      next();
    } catch (error) {
      logger.error('Erreur middleware sécurité', { error: error.message, action });
      next(error);
    }
  };
};

/**
 * Middleware pour enregistrer les tentatives après traitement
 */
export const recordSecurityAttempt = (req, res, next) => {
  // Intercepter la réponse pour enregistrer le résultat
  const originalSend = res.send;
  
  res.send = function(data) {
    try {
      if (req.securityInfo) {
        const { phone, action } = req.securityInfo;
        
        // Déterminer si c'est un succès ou un échec
        let success = false;
        
        if (typeof data === 'string') {
          try {
            const parsedData = JSON.parse(data);
            success = parsedData.success === true;
          } catch (e) {
            // Si ce n'est pas du JSON, considérer comme échec
            success = false;
          }
        } else if (typeof data === 'object') {
          success = data.success === true;
        }

        // Enregistrer la tentative
        if (!success && res.statusCode >= 400) {
          otpSecurityService.recordAttempt(phone, action, false);
        } else if (success && res.statusCode < 400) {
          otpSecurityService.recordAttempt(phone, action, true);
        }
      }
    } catch (error) {
      logger.error('Erreur enregistrement tentative sécurité', { error: error.message });
    }
    
    // Appeler la méthode originale
    originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware de nettoyage périodique (à utiliser avec un cron job)
 */
export const cleanupSecurityData = () => {
  return (req, res, next) => {
    // Nettoyer les données de sécurité anciennes
    otpSecurityService.cleanup();
    next();
  };
};

/**
 * Middleware pour limiter les tentatives par IP
 */
export const rateLimitByIP = (maxAttempts = 50, windowMs = 15 * 60 * 1000) => {
  const ipAttempts = new Map();

  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    
    // Nettoyer les anciennes tentatives
    for (const [storedIp, data] of ipAttempts.entries()) {
      if (now - data.firstAttempt > windowMs) {
        ipAttempts.delete(storedIp);
      }
    }

    // Vérifier les tentatives de cette IP
    const ipData = ipAttempts.get(ip) || { count: 0, firstAttempt: now };
    
    if (ipData.count >= maxAttempts) {
      logger.warn('IP bloquée pour trop de tentatives', { 
        ip, 
        attempts: ipData.count,
        windowMs 
      });
      
      return res.status(429).json({
        success: false,
        error: 'Trop de tentatives depuis cette adresse IP. Réessayez plus tard.',
        code: 'IP_RATE_LIMIT',
        data: {
          retryAfter: Math.ceil((ipData.firstAttempt + windowMs - now) / 1000)
        }
      });
    }

    // Incrémenter le compteur
    ipData.count++;
    ipAttempts.set(ip, ipData);

    next();
  };
};

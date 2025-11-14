/**
 * MIDDLEWARE D'AUDIT AUTOMATIQUE
 * Capture automatique de tous les événements pour l'audit
 */

import { auditLogService } from '../services/auditLogService.js';
import { monitoringService } from '../services/monitoringService.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware principal d'audit
 */
export const auditMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Capturer les informations de la requête
  const requestInfo = {
    method: req.method,
    endpoint: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || null,
    sessionId: req.sessionId || null,
    requestSize: req.get('Content-Length') || 0,
    timestamp: new Date().toISOString()
  };

  // Intercepter la réponse
  const originalSend = res.send;
  const originalJson = res.json;
  
  let responseData = null;
  let responseSent = false;

  res.send = function(data) {
    if (!responseSent) {
      responseData = data;
      responseSent = true;
      logRequest();
    }
    return originalSend.call(this, data);
  };

  res.json = function(data) {
    if (!responseSent) {
      responseData = data;
      responseSent = true;
      logRequest();
    }
    return originalJson.call(this, data);
  };

  // Fonction pour logger la requête complète
  const logRequest = async () => {
    try {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Déterminer la catégorie et la sévérité
      const { category, severity, action } = categorizeRequest(req, res);
      
      // Extraire les données sensibles si nécessaire
      const sensitiveData = extractSensitiveData(req, res);
      
      // Déterminer si c'est suspect
      const isSuspicious = isSuspiciousRequest(req, res, responseTime);
      
      // Calculer le score de risque
      const riskScore = calculateRiskScore(req, res, responseTime);

      // Créer l'événement d'audit
      const auditEventData = {
        category,
        action,
        severity,
        description: `${req.method} ${req.originalUrl}`,
        userId: requestInfo.userId,
        sessionId: requestInfo.sessionId,
        userAgent: requestInfo.userAgent,
        ip: requestInfo.ip,
        endpoint: requestInfo.endpoint,
        method: requestInfo.method,
        statusCode: res.statusCode,
        responseTime,
        requestSize: parseInt(requestInfo.requestSize) || 0,
        responseSize: getResponseSize(responseData),
        success: res.statusCode < 400,
        errorCode: res.statusCode >= 400 ? res.statusCode : null,
        errorMessage: res.statusCode >= 400 ? getErrorMessage(responseData) : null,
        isSuspicious,
        riskScore,
        securityFlags: getSecurityFlags(req, res),
        sensitiveData,
        businessData: getBusinessData(req, res)
      };

      // Logger dans les fichiers ET la base de données (service unifié)
      await auditLogService.logEvent(auditEventData);

      // Enregistrer les métriques de monitoring
      monitoringService.recordRequest(
        auditEventData.success,
        responseTime,
        res.statusCode === 429
      );

      if (isSuspicious || riskScore > 5) {
        monitoringService.recordSecurityEvent('suspicious_activity', {
          ip: requestInfo.ip,
          endpoint: requestInfo.endpoint,
          riskScore
        });
      }

    } catch (error) {
      logger.error('Erreur middleware audit', { error: error.message });
    }
  };

  // Gérer les erreurs non capturées
  res.on('finish', () => {
    if (!responseSent) {
      logRequest();
    }
  });

  next();
};

/**
 * Middleware spécialisé pour l'authentification
 */
export const authAuditMiddleware = (action) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Logger l'événement d'authentification
      const success = res.statusCode < 400;
      const userId = req.body?.phone || req.body?.email || req.body?.identifier;
      
      auditLogService.logAuthentication(userId, action, success, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionId,
        statusCode: res.statusCode,
        endpoint: req.originalUrl
      });
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

/**
 * Middleware pour les actions sensibles
 */
export const sensitiveActionAudit = (actionType, resourceType) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      const success = res.statusCode < 400;
      
      auditLogService.logEvent({
        category: auditLogService.eventCategories.SECURITY,
        action: `sensitive_${actionType}`,
        severity: auditLogService.severityLevels.HIGH,
        description: `Action sensible: ${actionType} sur ${resourceType}`,
        userId: req.user?.id,
        resourceType,
        resourceId: req.params?.id,
        success,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl,
        statusCode: res.statusCode
      });
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

/**
 * Middleware pour les transactions financières
 */
export const financialAuditMiddleware = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    if (res.statusCode < 400) {
      // Extraire les informations de transaction
      const amount = req.body?.amount || 0;
      const transactionType = req.body?.type || 'unknown';
      
      auditLogService.logFinancialTransaction(
        req.user?.id,
        transactionType,
        amount,
        {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.originalUrl,
          transactionId: extractTransactionId(data)
        }
      );
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Catégoriser une requête
 */
function categorizeRequest(req, res) {
  const path = req.originalUrl.toLowerCase();
  const method = req.method.toUpperCase();
  
  // Authentification
  if (path.includes('/auth/')) {
    return {
      category: auditLogService.eventCategories.AUTHENTICATION,
      severity: res.statusCode >= 400 ? 
        auditLogService.severityLevels.MEDIUM : 
        auditLogService.severityLevels.LOW,
      action: `auth_${path.split('/').pop()}`
    };
  }
  
  // Actions administratives
  if (path.includes('/admin/')) {
    return {
      category: auditLogService.eventCategories.ADMIN,
      severity: auditLogService.severityLevels.HIGH,
      action: `admin_${method.toLowerCase()}`
    };
  }
  
  // Transactions financières
  if (path.includes('/payment') || path.includes('/transaction')) {
    return {
      category: auditLogService.eventCategories.FINANCIAL,
      severity: auditLogService.severityLevels.MEDIUM,
      action: `financial_${method.toLowerCase()}`
    };
  }
  
  // Modifications de données
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return {
      category: auditLogService.eventCategories.DATA_MODIFICATION,
      severity: method === 'DELETE' ? 
        auditLogService.severityLevels.MEDIUM : 
        auditLogService.severityLevels.LOW,
      action: `data_${method.toLowerCase()}`
    };
  }
  
  // Accès aux données
  return {
    category: auditLogService.eventCategories.DATA_ACCESS,
    severity: auditLogService.severityLevels.LOW,
    action: `data_${method.toLowerCase()}`
  };
}

/**
 * Extraire les données sensibles
 */
function extractSensitiveData(req, res) {
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'pin', 'otp'];
  const sensitiveData = {};
  
  // Vérifier le body de la requête
  if (req.body) {
    for (const [key, value] of Object.entries(req.body)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sensitiveData[key] = '[REDACTED]';
      }
    }
  }
  
  return Object.keys(sensitiveData).length > 0 ? sensitiveData : null;
}

/**
 * Déterminer si une requête est suspecte
 */
function isSuspiciousRequest(req, res, responseTime) {
  // Requête très lente
  if (responseTime > 10000) return true;
  
  // Erreurs d'authentification répétées
  if (req.originalUrl.includes('/auth/') && res.statusCode === 401) return true;
  
  // Accès à des ressources sensibles
  if (req.originalUrl.includes('/admin/') && res.statusCode === 403) return true;
  
  // Tentatives d'injection
  const suspiciousPatterns = [
    /select.*from/i,
    /union.*select/i,
    /<script/i,
    /javascript:/i,
    /eval\(/i
  ];
  
  const queryString = JSON.stringify(req.query) + JSON.stringify(req.body);
  return suspiciousPatterns.some(pattern => pattern.test(queryString));
}

/**
 * Calculer le score de risque
 */
function calculateRiskScore(req, res, responseTime) {
  let score = 0;
  
  // Score basé sur le code de statut
  if (res.statusCode >= 500) score += 3;
  else if (res.statusCode >= 400) score += 2;
  else if (res.statusCode >= 300) score += 1;
  
  // Score basé sur le temps de réponse
  if (responseTime > 5000) score += 2;
  else if (responseTime > 2000) score += 1;
  
  // Score basé sur l'endpoint
  if (req.originalUrl.includes('/admin/')) score += 2;
  if (req.originalUrl.includes('/auth/')) score += 1;
  
  // Score basé sur la méthode
  if (['DELETE', 'PUT'].includes(req.method)) score += 1;
  
  return Math.min(score, 10); // Maximum 10
}

/**
 * Obtenir les flags de sécurité
 */
function getSecurityFlags(req, res) {
  const flags = [];
  
  if (res.statusCode === 401) flags.push('UNAUTHORIZED');
  if (res.statusCode === 403) flags.push('FORBIDDEN');
  if (res.statusCode >= 500) flags.push('SERVER_ERROR');
  if (req.originalUrl.includes('/admin/')) flags.push('ADMIN_ACCESS');
  if (!req.user && req.originalUrl.includes('/api/')) flags.push('UNAUTHENTICATED_API');
  
  return flags;
}

/**
 * Obtenir les données métier
 */
function getBusinessData(req, res) {
  const businessData = {};
  
  // Ajouter des informations spécifiques selon l'endpoint
  if (req.originalUrl.includes('/users/')) {
    businessData.userOperation = true;
  }
  
  if (req.originalUrl.includes('/payment')) {
    businessData.paymentOperation = true;
    businessData.amount = req.body?.amount;
  }
  
  if (req.params) {
    businessData.resourceIds = req.params;
  }
  
  return businessData;
}

/**
 * Obtenir la taille de la réponse
 */
function getResponseSize(responseData) {
  if (!responseData) return 0;
  
  try {
    return Buffer.byteLength(
      typeof responseData === 'string' ? responseData : JSON.stringify(responseData),
      'utf8'
    );
  } catch (error) {
    return 0;
  }
}

/**
 * Extraire le message d'erreur
 */
function getErrorMessage(responseData) {
  if (!responseData) return null;
  
  try {
    const data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
    return data.error || data.message || null;
  } catch (error) {
    return null;
  }
}

/**
 * Extraire l'ID de transaction
 */
function extractTransactionId(responseData) {
  try {
    const data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
    return data.transactionId || data.id || null;
  } catch (error) {
    return null;
  }
}

/**
 * ROUTES DE MONITORING ET STATISTIQUES
 * Endpoints pour surveiller la santé et les performances du système
 */

import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { monitoringService } from '../services/monitoringService.js';
import { databaseAuditService } from '../services/databaseAuditService.js';
import { redisManager } from '../config/redis.js';
import { rateLimitService } from '../services/rateLimitService.js';
import { redisRateLimitService } from '../services/redisRateLimitService.js';
import { alertService } from '../services/alertService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/v1/monitoring/health
 * Santé détaillée du système
 */
router.get('/health', asyncHandler(async (req, res) => {
  const healthReport = monitoringService.getHealthReport();
  const redisStats = await redisManager.getStats();
  
  res.json({
    success: true,
    data: {
      ...healthReport,
      services: {
        redis: {
          connected: redisManager.isConnected,
          stats: redisStats
        },
        database: {
          connected: true, // Supabase toujours connecté
          audit_tables: true
        },
        monitoring: {
          active: true,
          uptime: process.uptime()
        }
      }
    }
  });
}));

/**
 * GET /api/v1/monitoring/metrics
 * Métriques en temps réel
 */
router.get('/metrics', authenticateToken, asyncHandler(async (req, res) => {
  // Vérifier que l'utilisateur est admin
  if (req.user.user_level !== 'Admin') {
    return res.status(403).json({
      success: false,
      error: 'Accès refusé. Droits administrateur requis.'
    });
  }

  const currentMetrics = monitoringService.getCurrentMetrics();
  const performanceStats = monitoringService.getPerformanceStats();
  const securityReport = monitoringService.getSecurityReport();
  
  res.json({
    success: true,
    data: {
      current: currentMetrics,
      performance: performanceStats,
      security: securityReport,
      timestamp: Date.now()
    }
  });
}));

/**
 * GET /api/v1/monitoring/audit-stats
 * Statistiques d'audit avancées
 */
router.get('/audit-stats', authenticateToken, asyncHandler(async (req, res) => {
  // Vérifier que l'utilisateur est admin
  if (req.user.user_level !== 'Admin') {
    return res.status(403).json({
      success: false,
      error: 'Accès refusé. Droits administrateur requis.'
    });
  }

  const { period = '24h' } = req.query;
  
  const auditStats = await databaseAuditService.getAuditStatistics(period);
  const performanceMetrics = await databaseAuditService.getAuditPerformanceMetrics();
  
  res.json({
    success: true,
    data: {
      statistics: auditStats,
      performance: performanceMetrics,
      period
    }
  });
}));

/**
 * GET /api/v1/monitoring/rate-limit-stats
 * Statistiques de rate limiting
 */
router.get('/rate-limit-stats', authenticateToken, asyncHandler(async (req, res) => {
  // Vérifier que l'utilisateur est admin
  if (req.user.user_level !== 'Admin') {
    return res.status(403).json({
      success: false,
      error: 'Accès refusé. Droits administrateur requis.'
    });
  }

  const rateLimitSvc = redisManager.isConnected ? redisRateLimitService : rateLimitService;
  const stats = await rateLimitSvc.getStats();
  
  res.json({
    success: true,
    data: {
      ...stats,
      service: redisManager.isConnected ? 'redis' : 'memory',
      redis_connected: redisManager.isConnected
    }
  });
}));

/**
 * GET /api/v1/monitoring/alerts-stats
 * Statistiques des alertes
 */
router.get('/alerts-stats', authenticateToken, asyncHandler(async (req, res) => {
  // Vérifier que l'utilisateur est admin
  if (req.user.user_level !== 'Admin') {
    return res.status(403).json({
      success: false,
      error: 'Accès refusé. Droits administrateur requis.'
    });
  }

  const alertStats = alertService.getAlertStats();
  
  res.json({
    success: true,
    data: alertStats
  });
}));

/**
 * POST /api/v1/monitoring/test-alerts
 * Tester le système d'alertes
 */
router.post('/test-alerts', authenticateToken, asyncHandler(async (req, res) => {
  // Vérifier que l'utilisateur est admin
  if (req.user.user_level !== 'Admin') {
    return res.status(403).json({
      success: false,
      error: 'Accès refusé. Droits administrateur requis.'
    });
  }

  try {
    await alertService.testAlerts();
    
    res.json({
      success: true,
      message: 'Test d\'alertes envoyé avec succès'
    });
  } catch (error) {
    logger.error('Erreur test alertes:', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors du test des alertes',
      details: error.message
    });
  }
}));

/**
 * GET /api/v1/monitoring/system-info
 * Informations système détaillées
 */
router.get('/system-info', authenticateToken, asyncHandler(async (req, res) => {
  // Vérifier que l'utilisateur est admin
  if (req.user.user_level !== 'Admin') {
    return res.status(403).json({
      success: false,
      error: 'Accès refusé. Droits administrateur requis.'
    });
  }

  const systemInfo = {
    node: {
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    },
    environment: {
      node_env: process.env.NODE_ENV,
      port: process.env.PORT,
      redis_configured: !!process.env.REDIS_HOST,
      email_alerts: process.env.EMAIL_ALERTS_ENABLED === 'true',
      sms_alerts: process.env.SMS_ALERTS_ENABLED === 'true',
      webhook_alerts: process.env.WEBHOOK_ALERTS_ENABLED === 'true'
    },
    services: {
      redis: {
        connected: redisManager.isConnected,
        host: process.env.REDIS_HOST || 'not configured'
      },
      database: {
        provider: 'Supabase',
        connected: true
      },
      monitoring: {
        active: true,
        start_time: new Date().toISOString()
      }
    }
  };

  res.json({
    success: true,
    data: systemInfo
  });
}));

/**
 * GET /api/v1/monitoring/metrics-history
 * Historique des métriques
 */
router.get('/metrics-history', authenticateToken, asyncHandler(async (req, res) => {
  // Vérifier que l'utilisateur est admin
  if (req.user.user_level !== 'Admin') {
    return res.status(403).json({
      success: false,
      error: 'Accès refusé. Droits administrateur requis.'
    });
  }

  const { hours = 1 } = req.query;
  const history = monitoringService.getMetricsHistory(parseInt(hours));
  
  res.json({
    success: true,
    data: {
      history,
      period: `${hours} hour(s)`,
      total_points: history.length
    }
  });
}));

/**
 * POST /api/v1/monitoring/reset-metrics
 * Reset des métriques (pour les tests)
 */
router.post('/reset-metrics', authenticateToken, asyncHandler(async (req, res) => {
  // Vérifier que l'utilisateur est admin
  if (req.user.user_level !== 'Admin') {
    return res.status(403).json({
      success: false,
      error: 'Accès refusé. Droits administrateur requis.'
    });
  }

  monitoringService.resetMetrics();
  
  logger.info('Métriques réinitialisées par admin', { adminId: req.user.id });
  
  res.json({
    success: true,
    message: 'Métriques réinitialisées avec succès'
  });
}));

/**
 * GET /api/v1/monitoring/search-audit
 * Recherche dans les logs d'audit
 */
router.get('/search-audit', authenticateToken, asyncHandler(async (req, res) => {
  // Vérifier que l'utilisateur est admin
  if (req.user.user_level !== 'Admin') {
    return res.status(403).json({
      success: false,
      error: 'Accès refusé. Droits administrateur requis.'
    });
  }

  const {
    category,
    severity,
    userId,
    ipAddress,
    action,
    suspicious,
    startDate,
    endDate,
    limit = 50,
    offset = 0
  } = req.query;

  const searchCriteria = {
    category,
    severity,
    userId,
    ipAddress,
    action,
    suspicious: suspicious === 'true',
    startDate,
    endDate,
    limit: parseInt(limit),
    offset: parseInt(offset)
  };

  // Supprimer les critères vides
  Object.keys(searchCriteria).forEach(key => {
    if (searchCriteria[key] === undefined || searchCriteria[key] === '') {
      delete searchCriteria[key];
    }
  });

  const results = await databaseAuditService.searchAuditLogs(searchCriteria);
  
  res.json({
    success: true,
    data: results
  });
}));

export default router;

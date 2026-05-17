/**
 * ROUTES DE MONITORING ET STATISTIQUES
 * Endpoints pour surveiller la santé et les performances du système
 */

import express from 'express';
import crypto from 'crypto';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { monitoringService } from '../services/monitoringService.js';
import { databaseAuditService } from '../services/databaseAuditService.js';
import { redisManager } from '../config/redis.js';
import { rateLimitService } from '../services/rateLimitService.js';
import { redisRateLimitService } from '../services/redisRateLimitService.js';
import { alertService } from '../services/alertService.js';
import { logger } from '../utils/logger.js';
import { dbAdmin } from '../config/db.js';
import { appDataSource } from '../db/dataSource.js';

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
          connected: true,
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
        provider: 'PostgreSQL',
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

/**
 * GET /api/v1/monitoring/logistics-settings
 * Récupérer la matrice logistique complète
 */
router.get('/logistics-settings', asyncHandler(async (req, res) => {
  const { data: setting, error } = await dbAdmin
    .from('app_settings')
    .select('*')
    .eq('key', 'logistics_rates')
    .single();

  // Si pas encore de réglages, on peut renvoyer une structure par défaut
  res.json({
    success: true,
    data: setting?.value || {}
  });
}));

/**
 * POST /api/v1/monitoring/logistics-settings
 * Mettre à jour la matrice logistique (Admin uniquement)
 */
router.post('/logistics-settings', authenticateToken, asyncHandler(async (req, res) => {
  // Vérification stricte du rôle admin (insensible à la casse)
  const userRole = (req.user?.role || '').toLowerCase();
  const isSuperAdmin = Boolean(req.user?.is_super_admin);
  
  if (userRole !== 'admin' && userRole !== 'super_admin' && !isSuperAdmin) {
    logger.warn('Accès refusé aux réglages logistiques', { userId: req.user.id, role: req.user.role });
    return res.status(403).json({
      success: false,
      error: 'Accès refusé. Droits administrateur requis.'
    });
  }

  const { data, error } = await dbAdmin
    .from('app_settings')
    .upsert({
      key: 'logistics_rates',
      value: req.body,
      description: 'Matrice des tarifs de livraison par pays et mode (Avion/KG, Bateau/CBM, Local/Course)',
      updated_at: new Date().toISOString()
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  // Synchronisation avec la table logistics_zones (pour le geofencing PostGIS)
  try {
    const matrix = req.body;
    const zonesToSync = [];

    Object.entries(matrix).forEach(([country, countryData]) => {
      const local = countryData.Local;
      if (local && local.cities) {
        Object.entries(local.cities).forEach(([cityName, cityData]) => {
          const cityZones = cityData.zones;
          if (cityZones) {
            Object.entries(cityZones).forEach(([zoneName, zoneData]) => {
              const zd = zoneData;
              if (zd.boundary && Array.isArray(zd.boundary) && zd.boundary.length >= 3) {
                zonesToSync.push({
                  name: zoneName,
                  city: cityName,
                  boundary: zd.boundary,
                  base_fee: zd.fee || 0,
                  multiplier: zd.multiplier || 1
                });
              }
            });
          }
        });
      }
    });

    if (zonesToSync.length > 0) {
      // Pour rester simple, on vide et on recrée les zones liées au geofencing
      // Dans une version plus complexe, on ferait un upsert intelligent par nom/ville
      await appDataSource.query('DELETE FROM public.logistics_zones');

      for (const zone of zonesToSync) {
        const coords = zone.boundary.map((p) => `${p[0]} ${p[1]}`).join(', ');
        const first = zone.boundary[0];
        const last = zone.boundary[zone.boundary.length - 1];
        const closedCoords = (first[0] === last[0] && first[1] === last[1]) ? coords : `${coords}, ${first[0]} ${first[1]}`;
        const wkt = `POLYGON((${closedCoords}))`;
        
        await appDataSource.query(`
          INSERT INTO public.logistics_zones (id, name, city, boundary, base_fee, multiplier)
          VALUES ($1, $2, $3, ST_GeomFromText($4, 4326), $5, $6)
        `, [crypto.randomUUID(), zone.name, zone.city, wkt, zone.base_fee, zone.multiplier]);
      }
      logger.info(`Synchronisation de ${zonesToSync.length} zones de geofencing terminée.`);
    }
  } catch (syncErr) {
    logger.error('Erreur lors de la synchronisation des zones logistiques:', syncErr);
    // On ne bloque pas la réponse principale si la synchro échoue, mais on log l'erreur
  }

  res.json({
    success: true,
    message: 'Réglages logistiques mis à jour',
    data: data.value
  });
}));

export default router;

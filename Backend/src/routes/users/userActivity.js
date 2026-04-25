/**
 * ROUTES ACTIVITÉ UTILISATEUR
 * Historique, statistiques, et monitoring de l'activité
 */

import express from 'express';
import Joi from 'joi';
import { dbAdmin } from '../../config/db.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../middleware/errorHandler.js';
import { authenticateToken, logUserAction } from '../../middleware/auth.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

// =====================================================
// 📋 SCHÉMAS DE VALIDATION
// =====================================================

const activityQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  type: Joi.string()
    .valid('login', 'logout', 'profile_update', 'password_change', '2fa_enabled', '2fa_disabled', 'document_upload', 'document_delete')
    .optional(),
  start_date: Joi.date().optional(),
  end_date: Joi.date().optional()
});

const statsQuerySchema = Joi.object({
  period: Joi.string()
    .valid('24h', '7d', '30d', '90d')
    .default('30d')
});

// =====================================================
// 📊 ROUTES ACTIVITÉ UTILISATEUR
// =====================================================

/**
 * GET /api/v1/users/activity
 * Obtenir l'historique d'activité de l'utilisateur
 */
router.get('/activity', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = activityQuerySchema.validate(req.query);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { page, limit, type, start_date, end_date } = value;
  const offset = (page - 1) * limit;

  try {
    // Construire la requête
    let query = dbAdmin
      .from('user_activity')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    // Appliquer les filtres
    if (type) {
      query = query.eq('type', type);
    }

    if (start_date) {
      query = query.gte('created_at', start_date.toISOString());
    }

    if (end_date) {
      query = query.lte('created_at', end_date.toISOString());
    }

    // Appliquer la pagination
    query = query.range(offset, offset + limit - 1);

    const { data: activities, error: fetchError } = await query;

    if (fetchError) {
      logger.error('Erreur récupération activité utilisateur:', { 
        userId: req.user.id, 
        error: fetchError 
      });
      throw new ValidationError('Erreur lors de la récupération de l\'activité');
    }

    // Obtenir le nombre total pour la pagination
    const { count: totalCount } = await dbAdmin
      .from('user_activity')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .then(({ count }) => ({ count }));

    res.json({
      success: true,
      message: 'Activité utilisateur récupérée',
      data: {
        activities: activities || [],
        pagination: {
          page,
          limit,
          total: totalCount || 0,
          pages: Math.ceil((totalCount || 0) / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Erreur activité utilisateur:', { 
      userId: req.user.id, 
      error 
    });
    throw new ValidationError('Erreur lors de la récupération de l\'activité');
  }
}));

/**
 * GET /api/v1/users/activity/stats
 * Obtenir les statistiques d'activité de l'utilisateur
 */
router.get('/activity/stats', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = statsQuerySchema.validate(req.query);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { period } = value;

  // Calculer la date de début
  const now = new Date();
  let startDate;
  
  switch (period) {
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  try {
    // Obtenir les statistiques générales
    const { data: activities, error: fetchError } = await dbAdmin
      .from('user_activity')
      .select('type, created_at, metadata')
      .eq('user_id', req.user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (fetchError) {
      logger.error('Erreur récupération statistiques activité:', { 
        userId: req.user.id, 
        error: fetchError 
      });
      throw new ValidationError('Erreur lors de la récupération des statistiques');
    }

    // Calculer les statistiques
    const stats = {
      total_activities: activities?.length || 0,
      activities_by_type: {},
      daily_activity: {},
      most_active_day: null,
      last_activity: activities?.[0]?.created_at || null,
      period_start: startDate.toISOString(),
      period_end: now.toISOString()
    };

    // Regrouper par type
    activities?.forEach(activity => {
      const type = activity.type;
      stats.activities_by_type[type] = (stats.activities_by_type[type] || 0) + 1;
    });

    // Regrouper par jour
    activities?.forEach(activity => {
      const day = new Date(activity.created_at).toISOString().split('T')[0];
      stats.daily_activity[day] = (stats.daily_activity[day] || 0) + 1;
    });

    // Trouver le jour le plus actif
    if (Object.keys(stats.daily_activity).length > 0) {
      const maxDay = Object.entries(stats.daily_activity)
        .reduce((max, [day, count]) => count > max.count ? { day, count } : max, { day: '', count: 0 });
      stats.most_active_day = maxDay.day;
    }

    // Ajouter des métriques spécifiques
    stats.login_count = stats.activities_by_type.login || 0;
    stats.profile_updates = stats.activities_by_type.profile_update || 0;
    stats.security_changes = (stats.activities_by_type.password_change || 0) + 
                          (stats.activities_by_type['2fa_enabled'] || 0) + 
                          (stats.activities_by_type['2fa_disabled'] || 0);
    stats.document_operations = (stats.activities_by_type.document_upload || 0) + 
                              (stats.activities_by_type.document_delete || 0);

    res.json({
      success: true,
      message: 'Statistiques d\'activité récupérées',
      data: stats
    });
  } catch (error) {
    logger.error('Erreur statistiques activité:', { 
      userId: req.user.id, 
      error 
    });
    throw new ValidationError('Erreur lors de la récupération des statistiques');
  }
}));

/**
 * GET /api/v1/users/sessions
 * Obtenir les sessions actives de l'utilisateur
 */
router.get('/sessions', authenticateToken, asyncHandler(async (req, res) => {
  try {
    // Récupérer les sessions depuis la base de données
    const { data: sessions, error: fetchError } = await dbAdmin
      .from('user_sessions')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (fetchError) {
      logger.error('Erreur récupération sessions utilisateur:', { 
        userId: req.user.id, 
        error: fetchError 
      });
      throw new ValidationError('Erreur lors de la récupération des sessions');
    }

    // Formater les sessions
    const formattedSessions = sessions?.map(session => ({
      id: session.id,
      device_info: session.device_info,
      location_info: session.location_info,
      created_at: session.created_at,
      last_activity: session.last_activity,
      is_current: session.id === req.sessionId,
      risk_score: session.risk_score || 0,
      is_suspicious: session.is_suspicious || false
    })) || [];

    res.json({
      success: true,
      message: 'Sessions utilisateur récupérées',
      data: {
        sessions: formattedSessions,
        total: formattedSessions.length
      }
    });
  } catch (error) {
    logger.error('Erreur sessions utilisateur:', { 
      userId: req.user.id, 
      error 
    });
    throw new ValidationError('Erreur lors de la récupération des sessions');
  }
}));

/**
 * DELETE /api/v1/users/sessions/:sessionId
 * Révoquer une session spécifique
 */
router.delete('/sessions/:sessionId', authenticateToken, asyncHandler(async (req, res) => {
  const sessionId = req.params.sessionId;

  // Valider l'UUID
  if (!sessionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
    throw new ValidationError('ID de session invalide');
  }

  try {
    // Vérifier que la session appartient à l'utilisateur
    const { data: session, error: fetchError } = await dbAdmin
      .from('user_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !session) {
      throw new NotFoundError('Session non trouvée');
    }

    // Révoquer la session
    const { error: revokeError } = await dbAdmin
      .from('user_sessions')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
        revoked_reason: 'user_request'
      })
      .eq('id', sessionId);

    if (revokeError) {
      logger.error('Erreur révocation session:', { 
        userId: req.user.id, 
        sessionId,
        error: revokeError 
      });
      throw new ValidationError('Erreur lors de la révocation de la session');
    }

    logger.info('Session utilisateur révoquée', { 
      userId: req.user.id,
      sessionId
    });

    res.json({
      success: true,
      message: 'Session révoquée avec succès'
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }
    logger.error('Erreur révocation session:', { 
      userId: req.user.id, 
      sessionId,
      error 
    });
    throw new ValidationError('Erreur lors de la révocation de la session');
  }
}));

/**
 * DELETE /api/v1/users/sessions
 * Révoquer toutes les sessions sauf celle actuelle
 */
router.delete('/sessions', authenticateToken, asyncHandler(async (req, res) => {
  try {
    // Révoquer toutes les sessions sauf celle actuelle
    const { error: revokeError } = await dbAdmin
      .from('user_sessions')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
        revoked_reason: 'user_request_all'
      })
      .eq('user_id', req.user.id)
      .neq('id', req.sessionId);

    if (revokeError) {
      logger.error('Erreur révocation sessions:', { 
        userId: req.user.id, 
        error: revokeError 
      });
      throw new ValidationError('Erreur lors de la révocation des sessions');
    }

    logger.info('Toutes les sessions utilisateur révoquées', { 
      userId: req.user.id
    });

    res.json({
      success: true,
      message: 'Toutes les sessions ont été révoquées avec succès'
    });
  } catch (error) {
    logger.error('Erreur révocation sessions:', { 
      userId: req.user.id, 
      error 
    });
    throw new ValidationError('Erreur lors de la révocation des sessions');
  }
}));

/**
 * GET /api/v1/users/security-log
 * Obtenir le journal de sécurité de l'utilisateur
 */
router.get('/security-log', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = activityQuerySchema.validate(req.query);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { page, limit, type, start_date, end_date } = value;
  const offset = (page - 1) * limit;

  try {
    // Construire la requête pour les événements de sécurité
    let query = dbAdmin
      .from('security_events')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    // Appliquer les filtres
    if (type) {
      query = query.eq('event_type', type);
    }

    if (start_date) {
      query = query.gte('created_at', start_date.toISOString());
    }

    if (end_date) {
      query = query.lte('created_at', end_date.toISOString());
    }

    // Appliquer la pagination
    query = query.range(offset, offset + limit - 1);

    const { data: events, error: fetchError } = await query;

    if (fetchError) {
      logger.error('Erreur récupération journal sécurité:', { 
        userId: req.user.id, 
        error: fetchError 
      });
      throw new ValidationError('Erreur lors de la récupération du journal de sécurité');
    }

    // Obtenir le nombre total pour la pagination
    const { count: totalCount } = await dbAdmin
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .then(({ count }) => ({ count }));

    res.json({
      success: true,
      message: 'Journal de sécurité récupéré',
      data: {
        events: events || [],
        pagination: {
          page,
          limit,
          total: totalCount || 0,
          pages: Math.ceil((totalCount || 0) / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Erreur journal sécurité:', { 
      userId: req.user.id, 
      error 
    });
    throw new ValidationError('Erreur lors de la récupération du journal de sécurité');
  }
}));

export default router;

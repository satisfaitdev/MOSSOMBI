/**
 * ROUTES GESTION DES SESSIONS
 * Gestion des sessions utilisateur actives
 */

import express from 'express';
import Joi from 'joi';
import { dbAdmin } from '../config/db.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import { authenticateToken, logUserAction } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// =====================================================
// 📋 SCHÉMAS DE VALIDATION
// =====================================================

const createSessionSchema = Joi.object({
  device_type: Joi.string()
    .valid('mobile', 'tablet', 'desktop', 'web')
    .required()
    .messages({
      'any.only': 'Type d\'appareil invalide',
      'any.required': 'Le type d\'appareil est requis'
    }),
  device_name: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Le nom de l\'appareil ne peut pas dépasser 100 caractères'
    }),
  os_name: Joi.string()
    .max(50)
    .optional()
    .messages({
      'string.max': 'Le nom de l\'OS ne peut pas dépasser 50 caractères'
    }),
  os_version: Joi.string()
    .max(20)
    .optional()
    .messages({
      'string.max': 'La version de l\'OS ne peut pas dépasser 20 caractères'
    }),
  app_version: Joi.string()
    .max(20)
    .optional()
    .messages({
      'string.max': 'La version de l\'app ne peut pas dépasser 20 caractères'
    })
});

// =====================================================
// 🔧 FONCTIONS UTILITAIRES
// =====================================================

// Générer un token de session unique
const generateSessionToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Extraire les informations de géolocalisation depuis l'IP
const getLocationFromIP = (ip) => {
  // TODO: Intégrer un service de géolocalisation IP
  // Pour l'instant, on retourne des valeurs par défaut
  return {
    country: 'CD',
    city: 'Kinshasa'
  };
};

// Nettoyer les sessions expirées
const cleanExpiredSessions = async (userId) => {
  const { error } = await dbAdmin
    .from('user_sessions')
    .delete()
    .eq('user_id', userId)
    .lt('expires_at', new Date().toISOString());

  if (error) {
    logger.error('Erreur nettoyage sessions expirées', { userId, error });
  }
};

// =====================================================
// 📱 ROUTES SESSIONS
// =====================================================

/**
 * GET /api/v1/sessions
 * Récupérer toutes les sessions actives de l'utilisateur
 */
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  // Nettoyer les sessions expirées d'abord
  await cleanExpiredSessions(req.user.id);

  // Récupérer les sessions actives
  const { data: sessions, error } = await dbAdmin
    .from('user_sessions')
    .select(`
      id,
      device_type,
      device_name,
      os_name,
      os_version,
      app_version,
      location_country,
      location_city,
      is_active,
      last_activity_at,
      expires_at,
      created_at
    `)
    .eq('user_id', req.user.id)
    .eq('is_active', true)
    .order('last_activity_at', { ascending: false });

  if (error) {
    logger.error('Erreur récupération sessions', { userId: req.user.id, error });
    throw new ValidationError('Erreur lors de la récupération des sessions');
  }

  // Enrichir les données des sessions
  const enrichedSessions = sessions?.map(session => ({
    ...session,
    is_current: false, // TODO: Détecter la session courante
    days_since_last_activity: Math.floor(
      (new Date() - new Date(session.last_activity_at)) / (1000 * 60 * 60 * 24)
    )
  })) || [];

  res.json({
    success: true,
    data: {
      sessions: enrichedSessions,
      total_count: enrichedSessions.length,
      active_count: enrichedSessions.filter(s => s.is_active).length
    }
  });
}));

/**
 * POST /api/v1/sessions
 * Créer une nouvelle session
 */
router.post('/', authenticateToken, logUserAction('session_create'), asyncHandler(async (req, res) => {
  // Validation des données
  const { error, value } = createSessionSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { device_type, device_name, os_name, os_version, app_version } = value;

  // Extraire les informations de la requête
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');
  const location = getLocationFromIP(ip);

  // Générer un token de session unique
  let sessionToken;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    sessionToken = generateSessionToken();
    const { data: existingSession } = await dbAdmin
      .from('user_sessions')
      .select('id')
      .eq('session_token', sessionToken)
      .single();

    if (!existingSession) break;
    attempts++;
  } while (attempts < maxAttempts);

  if (attempts >= maxAttempts) {
    throw new ValidationError('Impossible de générer un token de session unique');
  }

  // Créer la session
  const { data: newSession, error: insertError } = await dbAdmin
    .from('user_sessions')
    .insert({
      user_id: req.user.id,
      session_token: sessionToken,
      device_type,
      device_name,
      os_name,
      os_version,
      app_version,
      ip_address: ip,
      user_agent: userAgent,
      location_country: location.country,
      location_city: location.city,
      is_active: true,
      last_activity_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 jours
    })
    .select()
    .single();

  if (insertError) {
    logger.error('Erreur création session', { userId: req.user.id, error: insertError });
    throw new ValidationError('Erreur lors de la création de la session');
  }

  // Nettoyer les anciennes sessions (garder max 10 sessions par utilisateur)
  const { data: allSessions } = await dbAdmin
    .from('user_sessions')
    .select('id, created_at')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (allSessions && allSessions.length > 10) {
    const sessionsToDelete = allSessions.slice(10).map(s => s.id);
    await dbAdmin
      .from('user_sessions')
      .delete()
      .in('id', sessionsToDelete);
  }

  res.status(201).json({
    success: true,
    message: 'Session créée avec succès',
    data: {
      session: {
        id: newSession.id,
        session_token: newSession.session_token,
        device_type: newSession.device_type,
        device_name: newSession.device_name,
        expires_at: newSession.expires_at,
        created_at: newSession.created_at
      }
    }
  });
}));

/**
 * PUT /api/v1/sessions/:id/activity
 * Mettre à jour l'activité d'une session
 */
router.put('/:id/activity', authenticateToken, asyncHandler(async (req, res) => {
  const sessionId = req.params.id;

  // Valider l'UUID
  if (!sessionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
    throw new ValidationError('ID de session invalide');
  }

  // Vérifier que la session appartient à l'utilisateur
  const { data: existingSession } = await dbAdmin
    .from('user_sessions')
    .select('id, is_active')
    .eq('id', sessionId)
    .eq('user_id', req.user.id)
    .single();

  if (!existingSession) {
    throw new NotFoundError('Session non trouvée');
  }

  if (!existingSession.is_active) {
    throw new ValidationError('Session inactive');
  }

  // Mettre à jour l'activité
  const { data: updatedSession, error: updateError } = await dbAdmin
    .from('user_sessions')
    .update({
      last_activity_at: new Date().toISOString(),
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent')
    })
    .eq('id', sessionId)
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (updateError) {
    logger.error('Erreur mise à jour activité session', { 
      userId: req.user.id, 
      sessionId,
      error: updateError 
    });
    throw new ValidationError('Erreur lors de la mise à jour de la session');
  }

  res.json({
    success: true,
    message: 'Activité de session mise à jour',
    data: {
      session: updatedSession
    }
  });
}));

/**
 * DELETE /api/v1/sessions/:id
 * Terminer une session spécifique
 */
router.delete('/:id', authenticateToken, logUserAction('session_terminate'), asyncHandler(async (req, res) => {
  const sessionId = req.params.id;

  // Valider l'UUID
  if (!sessionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
    throw new ValidationError('ID de session invalide');
  }

  // Vérifier que la session appartient à l'utilisateur
  const { data: existingSession } = await dbAdmin
    .from('user_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', req.user.id)
    .single();

  if (!existingSession) {
    throw new NotFoundError('Session non trouvée');
  }

  // Désactiver la session
  const { error: updateError } = await dbAdmin
    .from('user_sessions')
    .update({
      is_active: false,
      terminated_at: new Date().toISOString()
    })
    .eq('id', sessionId)
    .eq('user_id', req.user.id);

  if (updateError) {
    logger.error('Erreur terminaison session', { 
      userId: req.user.id, 
      sessionId,
      error: updateError 
    });
    throw new ValidationError('Erreur lors de la terminaison de la session');
  }

  res.json({
    success: true,
    message: 'Session terminée avec succès'
  });
}));

/**
 * DELETE /api/v1/sessions/all
 * Terminer toutes les autres sessions (sauf la courante)
 */
router.delete('/all', authenticateToken, logUserAction('sessions_terminate_all'), asyncHandler(async (req, res) => {
  // Désactiver toutes les sessions de l'utilisateur
  const { data: terminatedSessions, error: updateError } = await dbAdmin
    .from('user_sessions')
    .update({
      is_active: false,
      terminated_at: new Date().toISOString()
    })
    .eq('user_id', req.user.id)
    .eq('is_active', true)
    .select();

  if (updateError) {
    logger.error('Erreur terminaison toutes sessions', { 
      userId: req.user.id, 
      error: updateError 
    });
    throw new ValidationError('Erreur lors de la terminaison des sessions');
  }

  res.json({
    success: true,
    message: `${terminatedSessions?.length || 0} session(s) terminée(s) avec succès`,
    data: {
      terminated_count: terminatedSessions?.length || 0
    }
  });
}));

/**
 * GET /api/v1/sessions/stats
 * Récupérer les statistiques des sessions
 */
router.get('/stats', authenticateToken, asyncHandler(async (req, res) => {
  // Nettoyer les sessions expirées d'abord
  await cleanExpiredSessions(req.user.id);

  // Récupérer toutes les sessions de l'utilisateur
  const { data: sessions, error } = await dbAdmin
    .from('user_sessions')
    .select('device_type, os_name, location_country, is_active, created_at, last_activity_at')
    .eq('user_id', req.user.id);

  if (error) {
    logger.error('Erreur récupération stats sessions', { userId: req.user.id, error });
    throw new ValidationError('Erreur lors de la récupération des statistiques');
  }

  const totalSessions = sessions?.length || 0;
  const activeSessions = sessions?.filter(s => s.is_active).length || 0;

  // Grouper par type d'appareil
  const byDeviceType = sessions?.reduce((acc, session) => {
    const type = session.device_type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {}) || {};

  // Grouper par OS
  const byOS = sessions?.reduce((acc, session) => {
    const os = session.os_name || 'unknown';
    acc[os] = (acc[os] || 0) + 1;
    return acc;
  }, {}) || {};

  // Grouper par pays
  const byCountry = sessions?.reduce((acc, session) => {
    const country = session.location_country || 'unknown';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {}) || {};

  // Sessions récentes (dernières 7 jours)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentSessions = sessions?.filter(s => 
    new Date(s.last_activity_at) > sevenDaysAgo
  ).length || 0;

  res.json({
    success: true,
    data: {
      total_sessions: totalSessions,
      active_sessions: activeSessions,
      recent_sessions: recentSessions,
      by_device_type: byDeviceType,
      by_os: byOS,
      by_country: byCountry
    }
  });
}));

export default router;

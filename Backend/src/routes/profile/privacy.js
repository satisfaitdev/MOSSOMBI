/**
 * ROUTES CONFIDENTIALITÉ PROFIL
 * Gestion de la confidentialité et des données personnelles
 */

import express from 'express';
import Joi from 'joi';
import { dbAdmin } from '../../config/db.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';
import { asyncHandler, ValidationError, AuthenticationError } from '../../middleware/errorHandler.js';
import { logger } from '../../utils/logger.js';
import SecurityService from '../../services/securityService.js';

const router = express.Router();

// =====================================================
// 📋 SCHÉMAS DE VALIDATION
// =====================================================

const privacySettingsSchema = Joi.object({
  profile_visibility: Joi.string().valid('public', 'friends', 'private').default('public'),
  show_online_status: Joi.boolean().default(true),
  show_last_seen: Joi.boolean().default(true),
  allow_friend_requests: Joi.boolean().default(true),
  allow_messages: Joi.string().valid('everyone', 'friends', 'none').default('everyone'),
  show_achievements: Joi.boolean().default(true),
  show_level: Joi.boolean().default(true),
  allow_data_collection: Joi.boolean().default(true),
  allow_personalized_ads: Joi.boolean().default(false)
});

const dataExportSchema = Joi.object({
  format: Joi.string().valid('json', 'csv').default('json'),
  include_sensitive: Joi.boolean().default(false)
});

const dataDeleteSchema = Joi.object({
  password: Joi.string().required(),
  confirmation: Joi.string().valid('DELETE_MY_DATA').required(),
  categories: Joi.array().items(
    Joi.string().valid('profile', 'activity', 'messages', 'payments', 'all')
  ).min(1).required()
});

// =====================================================
// 🔒 ROUTES CONFIDENTIALITÉ
// =====================================================

/**
 * GET /api/v1/profile/privacy
 * Récupérer les paramètres de confidentialité actuels
 */
router.get('/privacy', authenticateToken, asyncHandler(async (req, res) => {
  // Récupérer les paramètres de confidentialité
  const { data: user, error } = await dbAdmin
    .from('users')
    .select('metadata')
    .eq('id', req.user.id)
    .single();

  if (error) {
    logger.error('Erreur récupération confidentialité', { userId: req.user.id, error });
    throw new ValidationError('Erreur lors de la récupération des paramètres de confidentialité');
  }

  const metadata = user.metadata || {};
  const privacySettings = metadata.privacy || {
    profile_visibility: 'public',
    show_online_status: true,
    show_last_seen: true,
    allow_friend_requests: true,
    allow_messages: 'everyone',
    show_achievements: true,
    show_level: true,
    allow_data_collection: true,
    allow_personalized_ads: false
  };

  res.json({
    success: true,
    message: 'Paramètres de confidentialité récupérés',
    data: {
      privacy: privacySettings,
      data_summary: {
        profile_completeness: calculateProfileCompleteness(user),
        data_stored: [
          { type: 'Profil', count: 1, size: '~2KB' },
          { type: 'Sessions', count: 5, size: '~1KB' },
          { type: 'Backpack', count: 12, size: '~5KB' },
          { type: 'Niveau', count: 1, size: '~1KB' }
        ],
        last_updated: metadata.privacy_updated_at
      }
    }
  });
}));

/**
 * PUT /api/v1/profile/privacy
 * Mettre à jour les paramètres de confidentialité
 */
router.put('/privacy', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = privacySettingsSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  // Récupérer les métadonnées actuelles
  const { data: currentUser } = await dbAdmin
    .from('users')
    .select('metadata')
    .eq('id', req.user.id)
    .single();

  const currentMetadata = currentUser?.metadata || {};

  // Mettre à jour les métadonnées
  const { error: updateError } = await dbAdmin
    .from('users')
    .update({
      metadata: {
        ...currentMetadata,
        privacy: value,
        privacy_updated_at: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    })
    .eq('id', req.user.id);

  if (updateError) {
    logger.error('Erreur mise à jour confidentialité', { 
      userId: req.user.id, 
      error: updateError 
    });
    throw new ValidationError('Erreur lors de la mise à jour des paramètres de confidentialité');
  }

  logger.info('Paramètres de confidentialité mis à jour', { 
    userId: req.user.id,
    changes: Object.keys(value)
  });

  res.json({
    success: true,
    message: 'Paramètres de confidentialité mis à jour',
    data: {
      privacy: value,
      updated_at: new Date().toISOString()
    }
  });
}));

/**
 * GET /api/v1/profile/privacy/data-export
 * Préparer l'export des données utilisateur
 */
router.get('/privacy/data-export', authenticateToken, asyncHandler(async (req, res) => {
  // Récupérer toutes les données utilisateur
  const userData = await collectUserData(req.user.id);

  res.json({
    success: true,
    message: 'Données collectées pour export',
    data: {
      summary: {
        total_items: userData.total_items,
        export_size: userData.estimated_size,
        categories: Object.keys(userData.data)
      },
      preview: {
        profile: {
          fields: Object.keys(userData.data.profile || {}),
          sample: Object.keys(userData.data.profile || {}).slice(0, 3)
        },
        activity: {
          count: userData.data.activity?.length || 0,
          date_range: userData.data.activity?.length > 0 ? {
            from: userData.data.activity[0]?.created_at,
            to: userData.data.activity[userData.data.activity.length - 1]?.created_at
          } : null
        }
      },
      ready_for_export: true
    }
  });
}));

/**
 * POST /api/v1/profile/privacy/data-export
 * Exporter les données utilisateur
 */
router.post('/privacy/data-export', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = dataExportSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  // Collecter les données
  const userData = await collectUserData(req.user.id, value.include_sensitive);

  // Formater selon le format demandé
  let exportData;
  let contentType;
  let filename;

  if (value.format === 'csv') {
    exportData = formatDataAsCSV(userData.data);
    contentType = 'text/csv';
    filename = `mossombi_data_export_${new Date().toISOString().split('T')[0]}.csv`;
  } else {
    exportData = JSON.stringify(userData.data, null, 2);
    contentType = 'application/json';
    filename = `mossombi_data_export_${new Date().toISOString().split('T')[0]}.json`;
  }

  // Enregistrer l'export dans les logs
  logger.info('Export de données demandé', { 
    userId: req.user.id,
    format: value.format,
    include_sensitive: value.include_sensitive,
    data_size: exportData.length
  });

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(exportData);
}));

/**
 * POST /api/v1/profile/privacy/data-delete
 * Supprimer sélectivement les données utilisateur
 */
router.post('/privacy/data-delete', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = dataDeleteSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  // Vérifier le mot de passe
  const { data: currentUser } = await dbAdmin
    .from('users')
    .select('metadata')
    .eq('id', req.user.id)
    .single();

  const currentPasswordHash = currentUser?.metadata?.password_hash;
  const isPasswordValid = await SecurityService.verifyPassword(value.password, currentPasswordHash);
  
  if (!isPasswordValid) {
    throw new AuthenticationError('Mot de passe incorrect');
  }

  // Supprimer les données selon les catégories
  const deletionResults = await deleteUserDataCategories(req.user.id, value.categories);

  logger.warn('Suppression de données utilisateur', { 
    userId: req.user.id,
    categories: value.categories,
    results: deletionResults
  });

  res.json({
    success: true,
    message: 'Données supprimées avec succès',
    data: {
      deleted_categories: deletionResults,
      warning: 'Cette action est irréversible. Certaines données peuvent rester en backup pour des raisons légales.'
    }
  });
}));

/**
 * GET /api/v1/profile/privacy/audit-log
 * Récupérer le journal d'audit des accès aux données
 */
router.get('/privacy/audit-log', authenticateToken, asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  // Récupérer le journal d'audit
  const { data: auditLog, error } = await dbAdmin
    .from('privacy_audit_log')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error && error.code !== 'PGRST116') {
    logger.error('Erreur récupération audit log', { userId: req.user.id, error });
    throw new ValidationError('Erreur lors de la récupération du journal d\'audit');
  }

  res.json({
    success: true,
    message: 'Journal d\'audit récupéré',
    data: {
      entries: auditLog || [],
      total_count: auditLog?.length || 0,
      limit: limit,
      offset: offset
    }
  });
}));

// =====================================================
// 🔧 FONCTIONS UTILITAIRES
// =====================================================

const calculateProfileCompleteness = (user) => {
  const fields = [
    'username', 'display_name', 'bio', 'avatar_url', 
    'location', 'website', 'birth_date', 'gender'
  ];
  
  const completedFields = fields.filter(field => user[field]);
  return Math.round((completedFields.length / fields.length) * 100);
};

const collectUserData = async (userId, includeSensitive = false) => {
  const data = {};
  let totalItems = 0;

  // Profil
  const { data: profile } = await dbAdmin
    .from('users')
    .select('username, display_name, bio, avatar_url, location, website, birth_date, gender, created_at, updated_at')
    .eq('id', userId)
    .single();
  
  data.profile = profile;
  totalItems++;

  // Sessions
  const { data: sessions } = await dbAdmin
    .from('user_sessions')
    .select('device_type, device_name, os_name, location_country, location_city, created_at, last_activity_at')
    .eq('user_id', userId);
  
  data.sessions = sessions || [];
  totalItems += sessions?.length || 0;

  // Backpack
  const { data: backpack } = await dbAdmin
    .from('user_backpack')
    .select('name, category, rarity, obtained_at')
    .eq('user_id', userId);
  
  data.backpack = backpack || [];
  totalItems += backpack?.length || 0;

  // Niveau
  const { data: level } = await dbAdmin
    .from('user_levels')
    .select('level, experience_points, total_points, created_at')
    .eq('user_id', userId)
    .single();
  
  data.level = level;
  totalItems++;

  // Historique des points
  const { data: pointHistory } = await dbAdmin
    .from('point_history')
    .select('points, reason, category, created_at')
    .eq('user_id', userId)
    .limit(100);
  
  data.activity = pointHistory || [];
  totalItems += pointHistory?.length || 0;

  if (includeSensitive) {
    // Inclure les données sensibles si demandé
    data.metadata = (await dbAdmin
      .from('users')
      .select('metadata')
      .eq('id', userId)
      .single())?.data?.metadata || {};
  }

  return {
    data,
    total_items: totalItems,
    estimated_size: `${Math.round(JSON.stringify(data).length / 1024)}KB`
  };
};

const formatDataAsCSV = (data) => {
  // Implémentation simple de conversion CSV
  const csvLines = [];
  
  // En-tête
  csvLines.push('Category,Type,Data,Created At');
  
  // Profil
  if (data.profile) {
    Object.entries(data.profile).forEach(([key, value]) => {
      csvLines.push(`Profile,${key},"${value}",${data.profile.created_at}`);
    });
  }
  
  // Activité
  if (data.activity) {
    data.activity.forEach(item => {
      csvLines.push(`Activity,${item.category},"${item.reason} - ${item.points} points",${item.created_at}`);
    });
  }
  
  return csvLines.join('\n');
};

const deleteUserDataCategories = async (userId, categories) => {
  const results = {};

  for (const category of categories) {
    try {
      switch (category) {
        case 'profile':
          await dbAdmin
            .from('users')
            .update({
              username: null,
              display_name: null,
              bio: null,
              avatar_url: null,
              location: null,
              website: null,
              birth_date: null,
              gender: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
          results.profile = 'success';
          break;

        case 'activity':
          await dbAdmin
            .from('point_history')
            .delete()
            .eq('user_id', userId);
          results.activity = 'success';
          break;

        case 'messages':
          // TODO: Implémenter la suppression des messages
          results.messages = 'not_implemented';
          break;

        case 'payments':
          // TODO: Implémenter la suppression des paiements
          results.payments = 'not_implemented';
          break;

        case 'all':
          // Supprimer toutes les données sauf l'essentiel pour la conformité légale
          await deleteUserDataCategories(userId, ['profile', 'activity']);
          await dbAdmin
            .from('user_sessions')
            .delete()
            .eq('user_id', userId);
          await dbAdmin
            .from('user_backpack')
            .delete()
            .eq('user_id', userId);
          await dbAdmin
            .from('user_levels')
            .delete()
            .eq('user_id', userId);
          results.all = 'success';
          break;

        default:
          results[category] = 'invalid_category';
      }
    } catch (error) {
      results[category] = `error: ${error.message}`;
    }
  }

  return results;
};

export default router;

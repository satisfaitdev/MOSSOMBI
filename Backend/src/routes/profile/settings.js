/**
 * ROUTES PARAMÈTRES PROFIL
 * Gestion des préférences et paramètres utilisateur
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

const updateProfileSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).optional(),
  display_name: Joi.string().min(1).max(50).optional(),
  bio: Joi.string().max(500).optional(),
  avatar_url: Joi.string().uri().optional(),
  location: Joi.string().max(100).optional(),
  website: Joi.string().uri().optional(),
  birth_date: Joi.date().optional(),
  gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional()
});

const notificationSettingsSchema = Joi.object({
  email_notifications: Joi.boolean().default(true),
  push_notifications: Joi.boolean().default(true),
  sms_notifications: Joi.boolean().default(false),
  marketing_emails: Joi.boolean().default(false),
  security_alerts: Joi.boolean().default(true),
  product_updates: Joi.boolean().default(true),
  achievement_alerts: Joi.boolean().default(true),
  friend_requests: Joi.boolean().default(true)
});

const privacySettingsSchema = Joi.object({
  profile_visibility: Joi.string().valid('public', 'friends', 'private').default('public'),
  show_online_status: Joi.boolean().default(true),
  show_last_seen: Joi.boolean().default(true),
  allow_friend_requests: Joi.boolean().default(true),
  allow_messages: Joi.string().valid('everyone', 'friends', 'none').default('everyone'),
  show_achievements: Joi.boolean().default(true),
  show_level: Joi.boolean().default(true)
});

const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),
  confirm_password: Joi.string().valid(Joi.ref('new_password')).required()
});

// =====================================================
// ⚙️ ROUTES PARAMÈTRES
// =====================================================

/**
 * GET /api/v1/profile/settings
 * Récupérer tous les paramètres de l'utilisateur
 */
router.get('/settings', authenticateToken, asyncHandler(async (req, res) => {
  // Récupérer le profil complet
  const { data: user, error } = await dbAdmin
    .from('users')
    .select(`
      id,
      username,
      display_name,
      bio,
      avatar_url,
      location,
      website,
      birth_date,
      gender,
      metadata
    `)
    .eq('id', req.user.id)
    .single();

  if (error) {
    logger.error('Erreur récupération paramètres', { userId: req.user.id, error });
    throw new ValidationError('Erreur lors de la récupération des paramètres');
  }

  const metadata = user.metadata || {};

  res.json({
    success: true,
    message: 'Paramètres récupérés',
    data: {
      profile: {
        username: user.username,
        display_name: user.display_name,
        bio: user.bio,
        avatar_url: user.avatar_url,
        location: user.location,
        website: user.website,
        birth_date: user.birth_date,
        gender: user.gender
      },
      notifications: metadata.notifications || {
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
        marketing_emails: false,
        security_alerts: true,
        product_updates: true,
        achievement_alerts: true,
        friend_requests: true
      },
      privacy: metadata.privacy || {
        profile_visibility: 'public',
        show_online_status: true,
        show_last_seen: true,
        allow_friend_requests: true,
        allow_messages: 'everyone',
        show_achievements: true,
        show_level: true
      }
    }
  });
}));

/**
 * PUT /api/v1/profile/settings/profile
 * Mettre à jour les informations du profil
 */
router.put('/settings/profile', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = updateProfileSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  // Mettre à jour le profil
  const { error: updateError } = await dbAdmin
    .from('users')
    .update({
      ...value,
      updated_at: new Date().toISOString()
    })
    .eq('id', req.user.id);

  if (updateError) {
    logger.error('Erreur mise à jour profil', { 
      userId: req.user.id, 
      error: updateError 
    });
    throw new ValidationError('Erreur lors de la mise à jour du profil');
  }

  logger.info('Profil mis à jour', { 
    userId: req.user.id,
    changes: Object.keys(value)
  });

  res.json({
    success: true,
    message: 'Profil mis à jour',
    data: {
      updated_fields: Object.keys(value)
    }
  });
}));

/**
 * PUT /api/v1/profile/settings/notifications
 * Mettre à jour les préférences de notification
 */
router.put('/settings/notifications', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = notificationSettingsSchema.validate(req.body);
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
        notifications: value
      },
      updated_at: new Date().toISOString()
    })
    .eq('id', req.user.id);

  if (updateError) {
    logger.error('Erreur mise à jour notifications', { 
      userId: req.user.id, 
      error: updateError 
    });
    throw new ValidationError('Erreur lors de la mise à jour des notifications');
  }

  logger.info('Préférences de notification mises à jour', { 
    userId: req.user.id
  });

  res.json({
    success: true,
    message: 'Préférences de notification mises à jour',
    data: {
      notifications: value
    }
  });
}));

/**
 * PUT /api/v1/profile/settings/privacy
 * Mettre à jour les paramètres de confidentialité
 */
router.put('/settings/privacy', authenticateToken, asyncHandler(async (req, res) => {
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
        privacy: value
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
    userId: req.user.id
  });

  res.json({
    success: true,
    message: 'Paramètres de confidentialité mis à jour',
    data: {
      privacy: value
    }
  });
}));

/**
 * PUT /api/v1/profile/settings/password
 * Changer le mot de passe
 */
router.put('/settings/password', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = changePasswordSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  // Récupérer le mot de passe actuel
  const { data: currentUser } = await dbAdmin
    .from('users')
    .select('metadata')
    .eq('id', req.user.id)
    .single();

  const currentPasswordHash = currentUser?.metadata?.password_hash;

  if (!currentPasswordHash) {
    throw new ValidationError('Mot de passe actuel non trouvé');
  }

  // Vérifier le mot de passe actuel
  const isPasswordValid = await SecurityService.verifyPassword(value.current_password, currentPasswordHash);
  
  if (!isPasswordValid) {
    throw new AuthenticationError('Mot de passe actuel incorrect');
  }

  // Hasher le nouveau mot de passe
  const newPasswordHash = await SecurityService.hashPassword(value.new_password);

  // Récupérer les métadonnées actuelles
  const currentMetadata = currentUser?.metadata || {};

  // Mettre à jour le mot de passe
  const { error: updateError } = await dbAdmin
    .from('users')
    .update({
      metadata: {
        ...currentMetadata,
        password_hash: newPasswordHash,
        password_changed_at: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    })
    .eq('id', req.user.id);

  if (updateError) {
    logger.error('Erreur changement mot de passe', { 
      userId: req.user.id, 
      error: updateError 
    });
    throw new ValidationError('Erreur lors du changement de mot de passe');
  }

  logger.info('Mot de passe changé', { 
    userId: req.user.id
  });

  res.json({
    success: true,
    message: 'Mot de passe changé avec succès'
  });
}));

/**
 * DELETE /api/v1/profile/settings/account
 * Supprimer le compte utilisateur
 */
router.delete('/settings/account', authenticateToken, asyncHandler(async (req, res) => {
  const deleteAccountSchema = Joi.object({
    password: Joi.string().required(),
    confirmation: Joi.string().valid('DELETE').required()
  });

  const { error, value } = deleteAccountSchema.validate(req.body);
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

  // Supprimer les données associées
  const tablesToDelete = [
    'user_sessions',
    'user_backpack',
    'user_levels',
    'point_history'
  ];

  for (const table of tablesToDelete) {
    await dbAdmin
      .from(table)
      .delete()
      .eq('user_id', req.user.id);
  }

  // Supprimer l'utilisateur
  const { error: deleteError } = await dbAdmin
    .from('users')
    .delete()
    .eq('id', req.user.id);

  if (deleteError) {
    logger.error('Erreur suppression compte', { 
      userId: req.user.id, 
      error: deleteError 
    });
    throw new ValidationError('Erreur lors de la suppression du compte');
  }

  logger.warn('Compte utilisateur supprimé', { 
    userId: req.user.id
  });

  res.json({
    success: true,
    message: 'Compte supprimé avec succès'
  });
}));

export default router;

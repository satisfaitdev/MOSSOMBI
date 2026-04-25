/**
 * ROUTES SÉCURITÉ PROFIL
 * Gestion des paramètres de sécurité et 2FA
 */

import express from 'express';
import Joi from 'joi';
import { dbAdmin } from '../../config/db.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';
import { asyncHandler, ValidationError, AuthenticationError } from '../../middleware/errorHandler.js';
import { logger } from '../../utils/logger.js';
import SecurityService from '../../services/securityService.js';
import TwoFactorService from '../../services/twoFactorService.js';

const router = express.Router();

// =====================================================
// 📋 SCHÉMAS DE VALIDATION
// =====================================================

const securitySettingsSchema = Joi.object({
  two_factor_enabled: Joi.boolean().optional(),
  biometric_enabled: Joi.boolean().optional(),
  login_alerts_enabled: Joi.boolean().optional(),
  session_timeout: Joi.number().integer().min(5).max(1440).optional() // 5 min à 24h
});

const enable2FASchema = Joi.object({
  phone_number: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required(),
  backup_codes: Joi.array().items(Joi.string()).optional()
});

const disable2FASchema = Joi.object({
  current_password: Joi.string().required(),
  confirmation_code: Joi.string().length(6).optional()
});

const sendCodeSchema = Joi.object({
  method: Joi.string().valid('whatsapp').required(),
  phone_number: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required()
});

// =====================================================
// 🔐 ROUTES SÉCURITÉ
// =====================================================

/**
 * GET /api/v1/profile/security
 * Récupérer les paramètres de sécurité
 */
router.get('/security', authenticateToken, asyncHandler(async (req, res) => {
  const { data: user, error } = await dbAdmin
    .from('users')
    .select('metadata')
    .eq('id', req.user.id)
    .single();

  if (error) {
    logger.error('Erreur récupération paramètres sécurité', { 
      userId: req.user.id, 
      error 
    });
    throw new ValidationError('Erreur lors de la récupération des paramètres');
  }

  const securitySettings = user.metadata?.security_settings || {
    two_factor_enabled: false,
    biometric_enabled: false,
    login_alerts_enabled: true,
    session_timeout: 60
  };

  res.json({
    success: true,
    message: 'Paramètres de sécurité récupérés',
    data: {
      security_settings: securitySettings,
      last_password_change: user.metadata?.password_changed_at,
      active_sessions: 1 // TODO: Implémenter le comptage des sessions actives
    }
  });
}));

/**
 * PUT /api/v1/profile/security
 * Mettre à jour les paramètres de sécurité
 */
router.put('/security', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = securitySettingsSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  // Récupérer les paramètres actuels
  const { data: currentUser } = await dbAdmin
    .from('users')
    .select('metadata')
    .eq('id', req.user.id)
    .single();

  const currentSettings = currentUser?.metadata?.security_settings || {};
  const newSettings = { ...currentSettings, ...value };

  // Mettre à jour les paramètres
  const { error: updateError } = await dbAdmin
    .from('users')
    .update({
      metadata: {
        ...currentUser.metadata,
        security_settings: newSettings,
        security_updated_at: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    })
    .eq('id', req.user.id);

  if (updateError) {
    logger.error('Erreur mise à jour sécurité', { 
      userId: req.user.id, 
      error: updateError 
    });
    throw new ValidationError('Erreur lors de la mise à jour des paramètres');
  }

  logger.info('Paramètres de sécurité mis à jour', { 
    userId: req.user.id,
    changes: value
  });

  res.json({
    success: true,
    message: 'Paramètres de sécurité mis à jour',
    data: {
      security_settings: newSettings
    }
  });
}));

/**
 * POST /api/v1/profile/security/2fa/enable
 * Activer l'authentification à deux facteurs
 */
router.post('/security/2fa/enable', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = enable2FASchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  // Récupérer les paramètres actuels
  const { data: currentUser } = await dbAdmin
    .from('users')
    .select('metadata')
    .eq('id', req.user.id)
    .single();

  const currentSettings = currentUser?.metadata?.security_settings || {};
  
  // Activer 2FA
  const newSettings = {
    ...currentSettings,
    two_factor_enabled: true,
    two_factor_phone: value.phone_number,
    two_factor_enabled_at: new Date().toISOString(),
    backup_codes: value.backup_codes || []
  };

  const { error: updateError } = await dbAdmin
    .from('users')
    .update({
      metadata: {
        ...currentUser.metadata,
        security_settings: newSettings
      }
    })
    .eq('id', req.user.id);

  if (updateError) {
    throw new ValidationError('Erreur lors de l\'activation de 2FA');
  }

  logger.info('2FA activé', { userId: req.user.id });

  res.json({
    success: true,
    message: 'Authentification à deux facteurs activée',
    data: { two_factor_enabled: true }
  });
}));

/**
 * POST /api/v1/profile/security/2fa/disable
 * Désactiver l'authentification à deux facteurs
 */
router.post('/security/2fa/disable', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = disable2FASchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  // Vérifier le mot de passe actuel
  const currentPasswordHash = req.user.metadata?.password_hash;
  const isPasswordValid = await SecurityService.verifyPassword(value.current_password, currentPasswordHash);
  
  if (!isPasswordValid) {
    throw new AuthenticationError('Mot de passe incorrect');
  }

  // Récupérer et mettre à jour les paramètres
  const { data: currentUser } = await dbAdmin
    .from('users')
    .select('metadata')
    .eq('id', req.user.id)
    .single();

  const currentSettings = currentUser?.metadata?.security_settings || {};
  
  const newSettings = {
    ...currentSettings,
    two_factor_enabled: false,
    two_factor_phone: null,
    two_factor_disabled_at: new Date().toISOString(),
    backup_codes: []
  };

  const { error: updateError } = await dbAdmin
    .from('users')
    .update({
      metadata: {
        ...currentUser.metadata,
        security_settings: newSettings
      }
    })
    .eq('id', req.user.id);

  if (updateError) {
    throw new ValidationError('Erreur lors de la désactivation de 2FA');
  }

  logger.info('2FA désactivé', { userId: req.user.id });

  res.json({
    success: true,
    message: 'Authentification à deux facteurs désactivée',
    data: { two_factor_enabled: false }
  });
}));

/**
 * POST /api/v1/profile/security/2fa/send-code
 * Envoyer un code 2FA par WhatsApp
 */
router.post('/security/2fa/send-code', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = sendCodeSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  // Générer et stocker le code
  const code = TwoFactorService.generateCode();
  const stored = await TwoFactorService.storeCode(req.user.id, code, value.method);
  
  if (!stored) {
    throw new ValidationError('Erreur lors de la génération du code');
  }

  // Envoyer le code par WhatsApp
  const sendResult = await TwoFactorService.sendWhatsApp(value.phone_number, code);

  if (!sendResult.success) {
    throw new ValidationError(sendResult.error);
  }

  logger.info('Code 2FA envoyé', { 
    userId: req.user.id, 
    method: value.method,
    phoneNumber: value.phone_number.replace(/\d(?=\d{4})/g, '*')
  });

  res.json({
    success: true,
    message: 'Code envoyé par WhatsApp',
    data: {
      method: value.method,
      expires_in: 300 // 5 minutes
    }
  });
}));

export default router;

/**
 * ROUTES SÉCURITÉ UTILISATEUR
 * Gestion du mot de passe, 2FA, et sécurité du compte
 */

import express from 'express';
import Joi from 'joi';
import bcrypt from 'bcryptjs';
import { dbAdmin } from '../../config/db.js';
import { asyncHandler, ValidationError, NotFoundError, ConflictError } from '../../middleware/errorHandler.js';
import { authenticateToken, requireVerification, logUserAction } from '../../middleware/auth.js';
import { logger } from '../../utils/logger.js';
import SecurityService from '../../services/securityService.js';
import TwoFactorService from '../../services/twoFactorService.js';
import { refreshTokenService } from '../../services/refreshTokenService.js';

const router = express.Router();

// =====================================================
// 📋 SCHÉMAS DE VALIDATION
// =====================================================

const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]/)
    .required(),
  confirm_password: Joi.string()
    .valid(Joi.ref('new_password'))
    .required()
});

const enable2FASchema = Joi.object({
  password: Joi.string().required(),
  method: Joi.string()
    .valid('email', 'sms', 'app')
    .required()
});

const verify2FASchema = Joi.object({
  code: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
});

// =====================================================
// 🔐 ROUTES SÉCURITÉ UTILISATEUR
// =====================================================

/**
 * POST /api/v1/users/change-password
 * Changer le mot de passe de l'utilisateur
 */
router.post('/change-password', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = changePasswordSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { current_password, new_password } = value;

  // Récupérer l'utilisateur actuel
  const { data: user, error: fetchError } = await dbAdmin
    .from('users')
    .select('id, password_hash, metadata')
    .eq('id', req.user.id)
    .single();

  if (fetchError || !user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  // Vérifier le mot de passe actuel
  const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password_hash);
  if (!isCurrentPasswordValid) {
    throw new ValidationError('Mot de passe actuel incorrect');
  }

  // Vérifier que le nouveau mot de passe est différent
  const isNewPasswordDifferent = await bcrypt.compare(new_password, user.password_hash);
  if (isNewPasswordDifferent) {
    throw new ValidationError('Le nouveau mot de passe doit être différent de l\'ancien');
  }

  // Hasher le nouveau mot de passe
  const saltRounds = 12;
  const newPasswordHash = await bcrypt.hash(new_password, saltRounds);

  // Mettre à jour le mot de passe
  const { error: updateError } = await dbAdmin
    .from('users')
    .update({
      password_hash: newPasswordHash,
      updated_at: new Date().toISOString(),
      metadata: {
        ...user.metadata,
        password_changed_at: new Date().toISOString(),
        password_history: [
          ...(user.metadata?.password_history || []),
          {
            hashed_password: user.password_hash,
            changed_at: new Date().toISOString()
          }
        ].slice(-5) // Garder les 5 derniers mots de passe
      }
    })
    .eq('id', req.user.id);

  if (updateError) {
    logger.error('Erreur changement mot de passe:', { 
      userId: req.user.id, 
      error: updateError 
    });
    throw new ValidationError('Erreur lors du changement de mot de passe');
  }

  // Révoquer tous les refresh tokens sauf celui actuel
  await refreshTokenService.revokeAllUserTokens(req.user.id, req.tokenId);

  logger.info('Mot de passe utilisateur changé', { 
    userId: req.user.id
  });

  res.json({
    success: true,
    message: 'Mot de passe changé avec succès'
  });
}));

/**
 * POST /api/v1/users/enable-2fa
 * Activer l'authentification à deux facteurs
 */
router.post('/enable-2fa', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = enable2FASchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { password, method } = value;

  logger.info('Demande activation 2FA', {
    userId: req.user.id,
    method,
  });

  // Récupérer l'utilisateur
  const { data: user, error: fetchError } = await dbAdmin
    .from('users')
    .select('id, password_hash, email, phone, metadata')
    .eq('id', req.user.id)
    .single();

  if (fetchError || !user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  // Vérifier le mot de passe
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new ValidationError('Mot de passe incorrect');
  }

  // Vérifier si la méthode est disponible
  if (method === 'sms' && !user.phone) {
    throw new ValidationError('Numéro de téléphone requis pour la 2FA par SMS');
  }

  if (method === 'email' && !user.email) {
    throw new ValidationError('Email requis pour la 2FA par email');
  }

  try {
    // Générer le secret 2FA
    const twoFactorService = new TwoFactorService();
    const secret = twoFactorService.generateSecret();
    const qrCode = method === 'app' ? twoFactorService.generateQRCode(secret, user.email) : null;

    // Envoyer le code de vérification
    const verificationCode = twoFactorService.generateVerificationCode();

    logger.info('Envoi code vérification 2FA (non loggé)', {
      userId: req.user.id,
      method,
      maskedPhone: user.phone ? user.phone.replace(/\d(?=\d{4})/g, '*') : null,
      hasEmail: Boolean(user.email),
    });

    await twoFactorService.sendVerificationCode(method, user, verificationCode);

    // Sauvegarder temporairement les données 2FA
    await dbAdmin
      .from('users')
      .update({
        metadata: {
          ...user.metadata,
          two_factor: {
            enabled: false,
            method: method,
            secret: secret,
            temp_code: verificationCode,
            temp_code_expires: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
            setup_step: 'verification_sent'
          }
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id);

    logger.info('Configuration 2FA initiée', { 
      userId: req.user.id,
      method
    });

    res.json({
      success: true,
      message: 'Configuration 2FA initiée',
      data: {
        method: method,
        qr_code: qrCode,
        next_step: 'verify_code'
      }
    });
  } catch (error) {
    logger.error('Erreur activation 2FA:', { 
      userId: req.user.id, 
      method,
      error 
    });
    throw new ValidationError('Erreur lors de l\'activation de la 2FA');
  }
}));

/**
 * POST /api/v1/users/verify-2fa
 * Vérifier le code 2FA et finaliser l'activation
 */
router.post('/verify-2fa', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = verify2FASchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { code } = value;

  logger.info('Vérification 2FA demandée', {
    userId: req.user.id,
    codeLength: String(code || '').length,
  });

  // Récupérer l'utilisateur
  const { data: user, error: fetchError } = await dbAdmin
    .from('users')
    .select('id, metadata')
    .eq('id', req.user.id)
    .single();

  if (fetchError || !user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  const twoFactorData = user.metadata?.two_factor;
  if (!twoFactorData || twoFactorData.setup_step !== 'verification_sent') {
    throw new ValidationError('Configuration 2FA non trouvée ou invalide');
  }

  // Vérifier si le code a expiré
  if (new Date() > new Date(twoFactorData.temp_code_expires)) {
    throw new ValidationError('Code de vérification expiré');
  }

  // Vérifier le code
  const twoFactorService = new TwoFactorService();
  const isValid = twoFactorService.verifyCode(code, twoFactorData.temp_code);

  if (!isValid) {
    logger.warn('Vérification 2FA échouée', {
      userId: req.user.id,
      reason: 'invalid_code',
    });
    throw new ValidationError('Code de vérification incorrect');
  }

  logger.info('Vérification 2FA réussie', {
    userId: req.user.id,
    method: twoFactorData.method,
  });

  try {
    // Activer la 2FA
    await dbAdmin
      .from('users')
      .update({
        metadata: {
          ...user.metadata,
          two_factor: {
            enabled: true,
            method: twoFactorData.method,
            secret: twoFactorData.secret,
            backup_codes: twoFactorService.generateBackupCodes(),
            activated_at: new Date().toISOString(),
            last_used: new Date().toISOString()
          }
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id);

    logger.info('2FA activée avec succès', { 
      userId: req.user.id,
      method: twoFactorData.method
    });

    res.json({
      success: true,
      message: '2FA activée avec succès',
      data: {
        method: twoFactorData.method,
        backup_codes: twoFactorService.generateBackupCodes()
      }
    });
  } catch (error) {
    logger.error('Erreur finalisation 2FA:', { 
      userId: req.user.id, 
      error 
    });
    throw new ValidationError('Erreur lors de la finalisation de la 2FA');
  }
}));

/**
 * POST /api/v1/users/disable-2fa
 * Désactiver l'authentification à deux facteurs
 */
router.post('/disable-2fa', authenticateToken, asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    throw new ValidationError('Mot de passe requis');
  }

  // Récupérer l'utilisateur
  const { data: user, error: fetchError } = await dbAdmin
    .from('users')
    .select('id, password_hash, metadata')
    .eq('id', req.user.id)
    .single();

  if (fetchError || !user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  // Vérifier le mot de passe
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new ValidationError('Mot de passe incorrect');
  }

  // Vérifier si la 2FA est activée
  if (!user.metadata?.two_factor?.enabled) {
    throw new ValidationError('2FA n\'est pas activée');
  }

  try {
    // Désactiver la 2FA
    await dbAdmin
      .from('users')
      .update({
        metadata: {
          ...user.metadata,
          two_factor: {
            enabled: false,
            disabled_at: new Date().toISOString(),
            previous_method: user.metadata.two_factor.method
          }
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id);

    logger.info('2FA désactivée', { 
      userId: req.user.id
    });

    res.json({
      success: true,
      message: '2FA désactivée avec succès'
    });
  } catch (error) {
    logger.error('Erreur désactivation 2FA:', { 
      userId: req.user.id, 
      error 
    });
    throw new ValidationError('Erreur lors de la désactivation de la 2FA');
  }
}));

/**
 * GET /api/v1/users/2fa-status
 * Obtenir le statut de la 2FA
 */
router.get('/2fa-status', authenticateToken, asyncHandler(async (req, res) => {
  const { data: user, error: fetchError } = await dbAdmin
    .from('users')
    .select('id, metadata')
    .eq('id', req.user.id)
    .single();

  if (fetchError || !user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  const twoFactorData = user.metadata?.two_factor || {};

  res.json({
    success: true,
    message: 'Statut 2FA récupéré',
    data: {
      enabled: twoFactorData.enabled || false,
      method: twoFactorData.method || null,
      activated_at: twoFactorData.activated_at || null,
      last_used: twoFactorData.last_used || null,
      setup_step: twoFactorData.setup_step || null
    }
  });
}));

/**
 * POST /api/v1/users/regenerate-backup-codes
 * Régénérer les codes de secours 2FA
 */
router.post('/regenerate-backup-codes', authenticateToken, asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    throw new ValidationError('Mot de passe requis');
  }

  // Récupérer l'utilisateur
  const { data: user, error: fetchError } = await dbAdmin
    .from('users')
    .select('id, password_hash, metadata')
    .eq('id', req.user.id)
    .single();

  if (fetchError || !user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  // Vérifier le mot de passe
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new ValidationError('Mot de passe incorrect');
  }

  // Vérifier si la 2FA est activée
  if (!user.metadata?.two_factor?.enabled) {
    throw new ValidationError('2FA n\'est pas activée');
  }

  try {
    // Générer de nouveaux codes de secours
    const twoFactorService = new TwoFactorService();
    const backupCodes = twoFactorService.generateBackupCodes();

    await dbAdmin
      .from('users')
      .update({
        metadata: {
          ...user.metadata,
          two_factor: {
            ...user.metadata.two_factor,
            backup_codes: backupCodes,
            backup_codes_regenerated: new Date().toISOString()
          }
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id);

    logger.info('Codes de secours 2FA régénérés', { 
      userId: req.user.id
    });

    res.json({
      success: true,
      message: 'Codes de secours régénérés',
      data: {
        backup_codes: backupCodes
      }
    });
  } catch (error) {
    logger.error('Erreur régénération codes secours:', { 
      userId: req.user.id, 
      error 
    });
    throw new ValidationError('Erreur lors de la régénération des codes de secours');
  }
}));

export default router;

/**
 * ROUTES 2FA (AUTHENTICATOR)
 * Gestion de l'authentification à deux facteurs avec Authenticator
 */

import express from 'express';
import Joi from 'joi';
import { dbAdmin } from '../../config/db.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';
import { asyncHandler, ValidationError } from '../../middleware/errorHandler.js';
import { logger } from '../../utils/logger.js';
import TwoFactorService from '../../services/twoFactorService.js';

const router = express.Router();

// =====================================================
// 📋 SCHÉMAS DE VALIDATION
// =====================================================

const verifyCodeSchema = Joi.object({
  code: Joi.string().length(6).pattern(/^\d{6}$/).required(),
  method: Joi.string().valid('authenticator', 'whatsapp').required(),
  temp_secret: Joi.string().optional() // Nécessaire pour Authenticator
});

const setup2FASchema = Joi.object({
  phone_number: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required(),
  method: Joi.string().valid('sms', 'whatsapp').required(),
  verification_code: Joi.string().length(6).pattern(/^\d{6}$/).required()
});

// Fonctions utilitaires pour les sessions
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

const ensureCurrentSession = async (req) => {
  const currentUserAgent = req.headers['user-agent'] || '';
  const rawIP = req.ip || req.connection.remoteAddress || 'IP inconnue';
  const currentIP = cleanIP(rawIP);
  
  // Vérifier si la session actuelle existe dans la base
  const { data: existingSession } = await dbAdmin
    .from('user_sessions')
    .select('id')
    .eq('user_id', req.user.id)
    .eq('ip_address', currentIP)
    .eq('user_agent', currentUserAgent)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (!existingSession) {
    // Créer la session actuelle si elle n'existe pas
    const { error: insertError } = await dbAdmin
      .from('user_sessions')
      .insert({
        user_id: req.user.id,
        ip_address: currentIP,
        user_agent: currentUserAgent,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
      });

    if (insertError) {
      logger.error('Erreur création session actuelle', { 
        userId: req.user.id, 
        error: insertError 
      });
    }
  }
};

// Helper pour nettoyer les adresses IP
const cleanIP = (ip) => {
  if (!ip) return 'IP inconnue';
  // Si c'est une IPv6 mappée IPv4, extraire seulement la partie IPv4
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }
  return ip;
};

// =====================================================
// 🔐 ROUTES 2FA AUTHENTICATOR
// =====================================================

/**
 * POST /api/v1/profile/security/2fa/generate-qr
 * Générer un QR code pour Authenticator
 */
router.post('/security/2fa/generate-qr', authenticateToken, asyncHandler(async (req, res) => {
  // Récupérer l'email de l'utilisateur
  const { data: user } = await dbAdmin
    .from('users')
    .select('email, phone')
    .eq('id', req.user.id)
    .single();

  if (!user) {
    throw new ValidationError('Utilisateur non trouvé');
  }

  // Générer le secret TOTP
  const userIdentifier = user.email || user.phone || `user_${req.user.id}`;
  const totpData = TwoFactorService.generateTOTPSecret(userIdentifier);
  
  // Générer le QR code
  const qrCodeDataURL = await TwoFactorService.generateQRCode(totpData.otpauth_url);

  // Stocker temporairement le secret (sera sauvé définitivement lors de la vérification)
  const tempSecret = totpData.secret;

  logger.info('QR Code Authenticator généré', { 
    userId: req.user.id,
    userIdentifier: userIdentifier.replace(/(.{3}).*(.{3})/, '$1***$2')
  });

  res.json({
    success: true,
    message: 'QR Code généré avec succès',
    data: {
      qr_code: qrCodeDataURL,
      manual_entry_key: totpData.manual_entry_key,
      temp_secret: tempSecret // Nécessaire pour la vérification
    }
  });
}));

/**
 * POST /api/v1/profile/security/2fa/verify-code
 * Vérifier un code 2FA (Authenticator ou WhatsApp)
 */
router.post('/security/2fa/verify-code', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = verifyCodeSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  logger.info('Vérification code 2FA demandée', {
    userId: req.user.id,
    method: value.method,
    codeLength: String(value.code || '').length,
    hasTempSecret: Boolean(value.temp_secret),
  });

  // Vérifier le code (avec secret TOTP si Authenticator)
  const verification = await TwoFactorService.verifyCode(
    req.user.id, 
    value.code, 
    value.method, 
    value.temp_secret
  );
  
  if (!verification.success) {
    logger.warn('Vérification code 2FA échouée', {
      userId: req.user.id,
      method: value.method,
      error: verification.error,
    });
    throw new ValidationError(verification.error);
  }

  logger.info('Code 2FA vérifié avec succès', { 
    userId: req.user.id, 
    method: value.method
  });

  // Si c'est un setup d'Authenticator, persister le secret TOTP sur l'utilisateur
  if (value.method === 'authenticator' && value.temp_secret) {
    const { error: updateError } = await dbAdmin
      .from('users')
      .update({
        totp_secret: value.temp_secret,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id);

    if (updateError) {
      logger.error('Erreur lors de la persistance du secret TOTP', { userId: req.user.id, error: updateError });
      throw new ValidationError('Erreur lors de l\'activation de l\'Authenticator');
    }

    logger.info('Secret TOTP stocké pour Authenticator', {
      userId: req.user.id
    });
  }

  res.json({
    success: true,
    message: 'Code vérifié avec succès',
    data: {
      verified: true,
      method: value.method
    }
  });
}));

/**
 * POST /api/v1/profile/security/2fa/setup
 * Configuration complète du 2FA avec vérification
 */
router.post('/security/2fa/setup', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = setup2FASchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  // Vérifier le code d'abord
  const verification = await TwoFactorService.verifyCode(req.user.id, value.verification_code, value.method);
  
  if (!verification.success) {
    throw new ValidationError('Code de vérification invalide');
  }

  // Générer des codes de récupération
  const backupCodes = TwoFactorService.generateBackupCodes();

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
    two_factor_method: value.method,
    two_factor_phone: value.phone_number,
    two_factor_enabled_at: new Date().toISOString(),
    backup_codes: backupCodes
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

  logger.info('2FA configuré avec succès', { 
    userId: req.user.id, 
    method: value.method,
    phoneNumber: value.phone_number.replace(/\d(?=\d{4})/g, '*')
  });

  res.json({
    success: true,
    message: 'Authentification à deux facteurs configurée avec succès',
    data: { 
      two_factor_enabled: true,
      method: value.method,
      backup_codes: backupCodes
    }
  });
}));

export default router;

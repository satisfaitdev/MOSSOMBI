/**
 * ROUTES D'AUTHENTIFICATION
 * Gestion de l'inscription, connexion, et authentification
 */

import express from 'express';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { supabaseAdmin, supabaseClient } from '../config/supabase.js';
import { asyncHandler, ValidationError, AuthenticationError, ConflictError } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { logger } from '../utils/logger.js';
import { whatsappService } from '../services/whatsappService.js';
import SecurityService from '../services/securityService.js';
import TwoFactorService from '../services/twoFactorService.js';
import { otpSecurityService } from '../services/otpSecurityService.js';
import { authRateLimit, sensitiveRateLimit, bruteForceProtection } from '../middleware/rateLimitMiddleware.js';
import { passwordSecurityService } from '../services/passwordSecurityService.js';
import { auditLogService } from '../services/auditLogService.js';
import { authAuditMiddleware, sensitiveActionAudit } from '../middleware/auditMiddleware.js';

const router = express.Router();

// Stockage temporaire des codes OTP en mémoire (pour les tests)
const otpStorage = new Map();

// =====================================================
// 📋 SCHÉMAS DE VALIDATION
// =====================================================

const registerSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[0-9+\-\s()]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Format de téléphone invalide',
      'any.required': 'Le numéro de téléphone est requis'
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Le mot de passe doit contenir au moins 6 caractères',
      'any.required': 'Le mot de passe est requis'
    }),
  full_name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Le nom doit contenir au moins 2 caractères',
      'string.max': 'Le nom ne peut pas dépasser 100 caractères',
      'any.required': 'Le nom complet est requis'
    }),
  email: Joi.string()
    .email()
    .optional()
    .allow('')
    .messages({
      'string.email': 'Format d\'email invalide'
    }),
  country_code: Joi.string()
    .length(2)
    .default('CG')
    .messages({
      'string.length': 'Le code pays doit contenir 2 caractères'
    })
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Format d\'email invalide',
      'any.required': 'L\'email est requis'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Le mot de passe est requis'
    })
});

const forgotPasswordSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Format de téléphone invalide',
      'any.required': 'Le numéro de téléphone est requis'
    })
});

const verifyOtpSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Format de téléphone invalide',
      'any.required': 'Le numéro de téléphone est requis'
    }),
  otp_code: Joi.string()
    .length(6)
    .required()
    .messages({
      'string.length': 'Le code OTP doit contenir 6 chiffres',
      'any.required': 'Le code OTP est requis'
    })
});

const resetPasswordSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required(),
  otp_code: Joi.string()
    .length(6)
    .required()
    .messages({
      'string.length': 'Le code OTP doit contenir 6 chiffres',
      'any.required': 'Le code OTP est requis'
    }),
  new_password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Le nouveau mot de passe doit contenir au moins 6 caractères',
      'any.required': 'Le nouveau mot de passe est requis'
    })
});

// =====================================================
// 🔐 FONCTIONS UTILITAIRES
// =====================================================

// Générer un ID utilisateur unique
const generateUserDisplayId = async () => {
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    const id = 'MSB-' + Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    
    const { data } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('user_id_display', id)
      .single();

    if (!data) {
      return id;
    }
    
    attempts++;
  }
  
  throw new Error('Impossible de générer un ID utilisateur unique');
};

// Créer une notification de bienvenue
const createWelcomeNotification = async (userId) => {
  await supabaseAdmin
    .from('notifications')
    .insert({
      user_id: userId,
      type: 'welcome',
      title: 'Bienvenue sur Mossombi ! 🎉',
      message: 'Votre compte a été créé avec succès. Explorez nos services et commencez à gagner des points !',
      data: {
        welcome_bonus: 100,
        first_login: true
      }
    });
};

// Logger une action utilisateur
const logAction = async (userId, action, data = {}) => {
  try {
    logger.info(`Action utilisateur: ${action}`, {
      userId,
      action,
      data,
      timestamp: new Date().toISOString()
    });
    
    // Optionnel : Enregistrer dans une table d'audit si elle existe
    // await supabaseAdmin
    //   .from('user_actions')
    //   .insert({
    //     user_id: userId,
    //     action,
    //     data,
    //     created_at: new Date().toISOString()
    //   });
  } catch (error) {
    logger.error('Erreur lors du logging d\'action', { userId, action, error: error.message });
  }
};

// =====================================================
// 📱 ROUTES D'AUTHENTIFICATION
// =====================================================

/**
 * GET /api/v1/auth/check-phone
 * Vérifier si un numéro de téléphone existe déjà (pour inscription par étapes)
 */
router.get('/check-phone', asyncHandler(async (req, res) => {
  const { phone } = req.query;

  if (!phone) {
    throw new ValidationError('Le numéro de téléphone est requis');
  }

  // Nettoyer le numéro de téléphone
  const cleanPhone = phone.replace(/^\+/, '');
  const formattedPhone = `+${cleanPhone}`;

  logger.info('Vérification existence numéro', { phone: formattedPhone });

  // Vérifier si le numéro existe déjà ET est vérifié
  const { data: existingUser, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('id, phone, is_verified')
    .eq('phone', formattedPhone)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    // PGRST116 = no rows returned (normal si utilisateur n'existe pas)
    logger.error('Erreur lors de la vérification du numéro', { 
      phone: formattedPhone, 
      error: fetchError 
    });
    throw new ValidationError('Erreur lors de la vérification du numéro');
  }

  // Un compte existe s'il y a un utilisateur (vérifié ou non)
  // Mais on indique s'il est disponible pour réinscription via is_verified
  const exists = !!existingUser;
  
  logger.info('Résultat vérification numéro', { 
    phone: formattedPhone, 
    exists,
    isVerified: existingUser?.is_verified || false
  });

  res.json({
    success: true,
    data: {
      exists,
      phone: formattedPhone,
      is_verified: existingUser?.is_verified || false,
      message: exists 
        ? 'Ce numéro de téléphone est déjà utilisé' 
        : 'Numéro de téléphone disponible'
    }
  });
}));

/**
 * POST /api/v1/auth/send-otp
 * Envoyer un code OTP pour vérification (sans créer le compte)
 */
router.post('/send-otp', asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    throw new ValidationError('Le numéro de téléphone est requis');
  }

  // Nettoyer le numéro de téléphone
  const cleanPhone = phone.replace(/^\+/, '');
  const formattedPhone = `+${cleanPhone}`;

  logger.info('Envoi OTP pour vérification', { phone: formattedPhone });

  // Générer un code OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Stocker temporairement l'OTP (en mémoire pour les tests)
  otpStorage.set(formattedPhone, {
    code: otpCode,
    expires: Date.now() + (10 * 60 * 1000), // 10 minutes
    attempts: 0
  });

  // Envoyer le code OTP par WhatsApp
  const whatsappResult = await whatsappService.sendOTP(formattedPhone, otpCode, 'Utilisateur');
  
  logger.info('OTP généré et envoyé', { 
    phone: formattedPhone,
    otpCode,
    whatsappSent: whatsappResult.success
  });

  res.json({
    success: true,
    message: 'Code de vérification envoyé par WhatsApp.',
    data: {
      phone: formattedPhone,
      otp_code: otpCode, // Pour les tests (à supprimer en production)
      expires_in: 600,
      verification: {
        method: 'whatsapp',
        message_sent: whatsappResult.success,
        simulation_mode: whatsappResult.simulation || false
      }
    }
  });
}));


/**
 * POST /api/v1/auth/register
 * Inscription d'un nouvel utilisateur
 */
router.post('/register', authRateLimit, bruteForceProtection(3, 15 * 60 * 1000), authAuditMiddleware('register'), asyncHandler(async (req, res) => {
  // Validation des données
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { phone, password, full_name, email, country_code } = value;

  // 🔐 VALIDATION RENFORCÉE DU MOT DE PASSE
  const passwordValidation = passwordSecurityService.validatePasswordStrength(password, {
    full_name,
    email,
    phone
  });

  if (!passwordValidation.isValid) {
    throw new ValidationError('Mot de passe non conforme aux critères de sécurité', {
      code: 'WEAK_PASSWORD',
      errors: passwordValidation.errors,
      warnings: passwordValidation.warnings,
      suggestions: passwordValidation.suggestions,
      level: passwordValidation.level,
      score: passwordValidation.score
    });
  }

  // Vérifier si le mot de passe est compromis
  const isCompromised = await passwordSecurityService.checkCompromisedPassword(password);
  if (isCompromised) {
    throw new ValidationError('Ce mot de passe a été compromis dans des fuites de données. Veuillez en choisir un autre.', {
      code: 'COMPROMISED_PASSWORD'
    });
  }

  // Nettoyer le numéro de téléphone
  const cleanPhone = phone.replace(/^\+/, '');

  // 🔒 VÉRIFICATION SÉCURITÉ OTP
  const securityCheck = otpSecurityService.checkBlocked(`+${cleanPhone}`, 'register');
  if (securityCheck.isBlocked) {
    const message = securityCheck.isPermanent 
      ? 'Votre numéro a été bloqué définitivement pour des raisons de sécurité'
      : `Trop de tentatives. Réessayez dans ${securityCheck.remainingTime}`;
    
    throw new ValidationError(message, {
      code: 'ACCOUNT_BLOCKED',
      attempts: securityCheck.attempts,
      blockedUntil: securityCheck.blockedUntil,
      isPermanent: securityCheck.isPermanent
    });
  }

  // Vérifier si le numéro de téléphone existe déjà ET est vérifié
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id, is_verified')
    .eq('phone', `+${cleanPhone}`)
    .single();

  if (existingUser && existingUser.is_verified) {
    throw new ConflictError('Ce numéro de téléphone est déjà utilisé');
  }

  // Si un utilisateur non vérifié existe, le supprimer pour permettre la réinscription
  if (existingUser && !existingUser.is_verified) {
    logger.info('Suppression compte non vérifié existant', { 
      userId: existingUser.id,
      phone: `+${cleanPhone}`
    });
    
    await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', existingUser.id);
  }

  // Si un email est fourni, vérifier qu'il n'existe pas déjà
  if (email && email.trim()) {
    const { data: existingEmailUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingEmailUser) {
      throw new ConflictError('Cette adresse email est déjà utilisée');
    }
  }

  logger.info('Tentative de création utilisateur', { 
    phone: `+${cleanPhone}`,
    email: email || 'non fourni',
    full_name
  });

  // Générer un code OTP pour WhatsApp
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Générer un ID d'affichage unique
  const userDisplayId = await generateUserDisplayId();

  // Générer un UUID pour l'utilisateur
  const userId = crypto.randomUUID();

  try {
    // Créer l'utilisateur directement dans notre table (sans auth.users)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        phone: `+${cleanPhone}`,
        full_name,
        email: email && email.trim() ? email : null, // Email optionnel
        user_id_display: userDisplayId,
        country_code,
        points: 100,
        is_verified: false,
        password_hash: await SecurityService.hashPassword(password), // Correction: stocker dans la colonne directe
        metadata: {
          registration_date: new Date().toISOString(),
          otp_code: otpCode,
          otp_expires: SecurityService.getExpirationDate(10).toISOString()
        }
      })
      .select()
      .single();

    if (userError) {
      logger.error('Erreur création utilisateur - DÉTAILS COMPLETS', { 
        error: userError,
        error_message: userError.message,
        error_details: userError.details,
        error_hint: userError.hint,
        error_code: userError.code,
        email,
        phone: `+${cleanPhone}`,
        userId
      });
      throw new ValidationError(`Erreur lors de la création du profil: ${userError.message}`);
    }

    // Envoyer le code OTP par WhatsApp
    const whatsappResult = await whatsappService.sendOTP(`+${cleanPhone}`, otpCode, full_name);
    
    logger.info('Utilisateur créé, OTP envoyé par WhatsApp', { 
      userId: userData.id,
      email,
      phone: cleanPhone,
      otpCode,
      whatsapp_success: whatsappResult.success
    });

    // Créer la notification de bienvenue (sera visible après vérification)
    await createWelcomeNotification(userData.id);

    // Logger l'action
    logAction(userData.id, 'user_registered', {
      email,
      phone: cleanPhone,
      country_code,
      registration_method: 'email_whatsapp_otp'
    });

    // Réponse de succès
    res.status(201).json({
      success: true,
      message: 'Compte créé ! Code de vérification envoyé par WhatsApp.',
      data: {
        user: {
          id: userData.id,
          email: userData.email,
          phone: userData.phone,
          full_name: userData.full_name,
          user_id_display: userData.user_id_display,
          is_verified: false
        },
        otp_code: otpCode, // Pour les tests
        verification: {
          method: 'whatsapp',
          expires_in: 600,
          message_sent: whatsappResult.success,
          simulation_mode: whatsappResult.simulation || false
        }
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la création du profil', { 
      email,
      error: error.message 
    });
    throw error;
  }
}));

/**
 * POST /api/v1/auth/verify-otp
 * Vérifier le code OTP et activer le compte
 */
router.post('/verify-otp', authRateLimit, bruteForceProtection(5, 15 * 60 * 1000), authAuditMiddleware('verify_otp'), asyncHandler(async (req, res) => {
  // Validation des données
  const { error, value } = verifyOtpSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { phone, otp_code } = value;
  const cleanPhone = phone.replace(/^\+/, '');

  // 🔒 VÉRIFICATION SÉCURITÉ OTP
  const securityCheck = otpSecurityService.checkBlocked(`+${cleanPhone}`, 'verify-otp');
  if (securityCheck.isBlocked) {
    const message = securityCheck.isPermanent 
      ? 'Votre numéro a été bloqué définitivement pour des raisons de sécurité'
      : `Trop de tentatives. Réessayez dans ${securityCheck.remainingTime}`;
    
    throw new ValidationError(message, {
      code: 'ACCOUNT_BLOCKED',
      attempts: securityCheck.attempts,
      blockedUntil: securityCheck.blockedUntil,
      isPermanent: securityCheck.isPermanent
    });
  }

  // Récupérer l'utilisateur existant depuis la base de données
  const { data: existingUser, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('phone', `+${cleanPhone}`)
    .eq('is_verified', false)
    .single();

  if (fetchError || !existingUser) {
    logger.error('Utilisateur non trouvé pour vérification OTP', { 
      phone: cleanPhone, 
      error: fetchError 
    });
    throw new AuthenticationError('Numéro de téléphone non trouvé ou code expiré');
  }

  // Récupérer l'OTP depuis les metadata
  const storedOtpCode = existingUser.metadata?.otp_code;
  const otpExpires = existingUser.metadata?.otp_expires;

  if (!storedOtpCode) {
    throw new AuthenticationError('Code de vérification non trouvé');
  }

  // Vérifier le code OTP
  if (storedOtpCode !== otp_code) {
    // 🔒 ENREGISTRER TENTATIVE ÉCHOUÉE
    const attemptResult = otpSecurityService.recordAttempt(`+${cleanPhone}`, 'verify-otp', false);
    
    let errorMessage = 'Code de vérification invalide';
    if (attemptResult.blocked) {
      errorMessage = attemptResult.isPermanent 
        ? 'Trop de tentatives. Votre numéro a été bloqué définitivement.'
        : `Trop de tentatives. Compte bloqué pendant ${attemptResult.duration}`;
    } else if (attemptResult.remainingAttempts > 0) {
      errorMessage += `. ${attemptResult.remainingAttempts} tentative(s) restante(s) avant blocage.`;
    }
    
    throw new AuthenticationError(errorMessage, {
      code: attemptResult.blocked ? 'ACCOUNT_BLOCKED' : 'INVALID_OTP',
      attempts: attemptResult.attempts,
      remainingAttempts: attemptResult.remainingAttempts,
      blocked: attemptResult.blocked
    });
  }

  // Vérifier l'expiration
  if (otpExpires && new Date() > new Date(otpExpires)) {
    // 🔒 ENREGISTRER TENTATIVE ÉCHOUÉE (OTP expiré)
    otpSecurityService.recordAttempt(`+${cleanPhone}`, 'verify-otp', false);
    throw new AuthenticationError('Code de vérification expiré');
  }

  try {
    // Mettre à jour l'utilisateur pour le marquer comme vérifié
    const { data: verifiedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        is_verified: true,
        phone_verified_at: new Date().toISOString(),
        metadata: {
          ...existingUser.metadata,
          verified_at: new Date().toISOString(),
          otp_code: null, // Supprimer le code OTP
          otp_expires: null
        }
      })
      .eq('id', existingUser.id)
      .select()
      .single();

    if (updateError) {
      logger.error('Erreur mise à jour utilisateur après vérification', { 
        error: updateError, 
        userId: existingUser.id 
      });
      throw new ValidationError('Erreur lors de la vérification');
    }

    // 🔒 ENREGISTRER SUCCÈS - RÉINITIALISER TENTATIVES
    otpSecurityService.recordAttempt(`+${cleanPhone}`, 'verify-otp', true);

    // Créer la notification de bienvenue
    await createWelcomeNotification(verifiedUser.id);

    // Envoyer message de bienvenue WhatsApp
    await whatsappService.sendWelcomeMessage(`+${cleanPhone}`, verifiedUser.full_name);

    // Logger l'action
    logAction(verifiedUser.id, 'phone_verified', { phone: cleanPhone });

    res.json({
      success: true,
      message: 'Compte vérifié avec succès ! Bienvenue sur Mossombi !',
      data: {
        user: {
          id: verifiedUser.id,
          phone: verifiedUser.phone,
          email: verifiedUser.email,
          full_name: verifiedUser.full_name,
          user_id_display: verifiedUser.user_id_display,
          user_level: verifiedUser.user_level,
          points: verifiedUser.points,
          is_verified: true,
          phone_verified_at: verifiedUser.phone_verified_at,
          created_at: verifiedUser.created_at
        },
        welcome_message_sent: true
      }
    });

  } catch (error) {
    // En cas d'erreur, garder les données OTP pour un nouvel essai
    logger.error('Erreur lors de la vérification OTP', { error: error.message, phone: cleanPhone });
    throw error;
  }
}));

/**
 * POST /api/v1/auth/login
 * Connexion flexible avec email, téléphone ou user_id_display
 */
router.post('/login', authRateLimit, bruteForceProtection(5, 15 * 60 * 1000), asyncHandler(async (req, res) => {
  // Validation des données - accepter identifier (email, phone ou user_id_display)
  const flexibleLoginSchema = Joi.object({
    identifier: Joi.string()
      .required()
      .messages({
        'any.required': 'Email, téléphone ou ID utilisateur requis'
      }),
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.min': 'Le mot de passe doit contenir au moins 6 caractères',
        'any.required': 'Le mot de passe est requis'
      })
  });

  const { error, value } = flexibleLoginSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { identifier, password } = value;

  logger.info('Tentative de connexion flexible', { identifier });

  // Déterminer le type d'identifiant et chercher l'utilisateur
  let user = null;
  let searchType = '';

  // 1. Essayer par email
  if (identifier.includes('@')) {
    searchType = 'email';
    const { data } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', identifier)
      .single();
    user = data;
  }
  
  // 2. Essayer par user_id_display (format MSB-XXXXXX)
  if (!user && identifier.startsWith('MSB-')) {
    searchType = 'user_id_display';
    const { data } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('user_id_display', identifier)
      .single();
    user = data;
  }
  
  // 3. Essayer par téléphone (avec ou sans +)
  if (!user) {
    searchType = 'phone';
    const cleanPhone = identifier.startsWith('+') ? identifier : `+${identifier}`;
    const { data } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('phone', cleanPhone)
      .single();
    user = data;
  }

  if (!user) {
    logger.warn('Tentative de connexion avec identifiant inexistant', { identifier, searchType });
    throw new AuthenticationError('Identifiant ou mot de passe incorrect');
  }

  // Vérifier que l'utilisateur est vérifié
  if (!user.is_verified) {
    throw new AuthenticationError('Compte non vérifié. Veuillez vérifier votre numéro WhatsApp.');
  }

  // Vérifier que le compte n'est pas supprimé/désactivé
  if (!user.is_active) {
    throw new AuthenticationError('Ce compte a été supprimé ou désactivé. Contactez le support si vous pensez qu\'il s\'agit d\'une erreur.');
  }

  // Vérifier le mot de passe avec bcrypt
  const storedPasswordHash = user.password_hash;
  
  if (!storedPasswordHash) {
    logger.warn('Pas de mot de passe hashé trouvé', { 
      identifier,
      searchType,
      userId: user.id
    });
    throw new AuthenticationError('Identifiant ou mot de passe incorrect');
  }

  const isPasswordValid = await SecurityService.verifyPassword(password, storedPasswordHash);
  
  logger.info('Vérification mot de passe sécurisée', { 
    identifier,
    searchType,
    userId: user.id,
    hasStoredPassword: !!storedPasswordHash,
    isValid: isPasswordValid
  });

  if (!isPasswordValid) {
    logger.warn('Tentative de connexion avec mot de passe incorrect', { 
      identifier,
      searchType,
      userId: user.id
    });
    throw new AuthenticationError('Identifiant ou mot de passe incorrect');
  }

  // Vérifier si la 2FA/MFA est activée (stockée dans metadata.security_settings)
  const securitySettings = user.metadata?.security_settings || {};
  const has2FA = securitySettings.two_factor_enabled || securitySettings.authenticator_enabled;
  
  if (has2FA) {
    // Générer un challenge_id pour lier la session 2FA
    const challengeId = crypto.randomUUID();
    
    // Stocker temporairement les infos de connexion (Redis ou cache)
    // Pour simplifier, on utilise une approche avec timestamp
    const challengeData = {
      userId: user.id,
      identifier,
      searchType,
      timestamp: Date.now(),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      whatsapp_send_count: 0,
    };
    
    // Dans un vrai système, on stockerait ça dans Redis avec expiration
    // Ici on va utiliser une variable globale temporaire (à améliorer en production)
    global.twoFactorChallenges = global.twoFactorChallenges || {};
    global.twoFactorChallenges[challengeId] = challengeData;
    
    // Nettoyer les anciens challenges (plus de 5 minutes)
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    Object.keys(global.twoFactorChallenges).forEach(id => {
      if (global.twoFactorChallenges[id].timestamp < fiveMinutesAgo) {
        delete global.twoFactorChallenges[id];
      }
    });
    
    // Déterminer les méthodes 2FA disponibles
    const availableMethods = [];
    if (securitySettings.authenticator_enabled) {
      availableMethods.push('authenticator');
    }
    if (securitySettings.two_factor_enabled) {
      availableMethods.push('whatsapp');
      
      // Si WhatsApp est la seule méthode active, envoyer automatiquement le code
      // Sinon (Authenticator aussi actif), l'envoi se fera sur demande depuis le frontend
      if (!securitySettings.authenticator_enabled) {
        try {
          const code = TwoFactorService.generateCode();
          const stored = await TwoFactorService.storeCode(user.id, code, 'whatsapp');

          if (!stored) {
            logger.error('Erreur stockage code WhatsApp pour 2FA login', { userId: user.id });
          } else {
            const sendResult = await whatsappService.sendOTP(user.phone, code, user.full_name || '');
            // Incrémenter le compteur d'envois pour ce challenge
            global.twoFactorChallenges[challengeId].whatsapp_send_count =
              (global.twoFactorChallenges[challengeId].whatsapp_send_count || 0) + 1;
            logger.info('Code WhatsApp envoyé pour 2FA login', {
              userId: user.id,
              phone: user.phone,
              simulation: sendResult.simulation || false,
              status: sendResult.status || 'sent'
            });
          }
        } catch (error) {
          logger.error('Erreur envoi code WhatsApp pour 2FA login', { userId: user.id, error: error.message });
        }
      } else {
        logger.info('2FA WhatsApp disponible mais code non envoyé automatiquement (Authenticator aussi activé)', {
          userId: user.id,
          phone: user.phone
        });
      }
    }
    
    logger.info('2FA requis pour la connexion', { 
      userId: user.id, 
      challengeId, 
      availableMethods 
    });
    
    return res.json({
      success: true,
      requires_2fa: true,
      challenge_id: challengeId,
      methods: availableMethods,
      message: 'Authentification à deux facteurs requise'
    });
  }

  // Générer des tokens JWT sécurisés
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    phone: user.phone,
    userIdDisplay: user.user_id_display
  };

  const accessToken = SecurityService.generateAccessToken(tokenPayload);
  const refreshToken = SecurityService.generateRefreshToken({ userId: user.id });

  // Mettre à jour la dernière connexion
  await supabaseAdmin
    .from('users')
    .update({
      last_login_at: new Date().toISOString(),
      metadata: {
        ...user.metadata,
        last_login_ip: req.ip,
        last_login_user_agent: req.get('User-Agent'),
        last_login_method: searchType
      }
    })
    .eq('id', user.id);

  // Logger la connexion réussie
  logger.info('Connexion flexible réussie', { 
    userId: user.id,
    identifier,
    searchType,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  res.json({
    success: true,
    message: 'Connexion réussie ! Bienvenue sur Mossombi !',
    data: {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        full_name: user.full_name,
        user_id_display: user.user_id_display,
        user_level: user.user_level,
        points: user.points,
        is_verified: user.is_verified,
        avatar_url: user.avatar_url,
        date_of_birth: user.date_of_birth,
        address: user.address,
        country_code: user.country_code,
        created_at: user.created_at,
        last_login_at: new Date().toISOString()
      },
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 86400, // 24h en secondes
      login_method: searchType
    }
  });
}));

/**
 * POST /api/v1/auth/login/2fa-send-code
 * Envoyer un code 2FA WhatsApp pour un challenge existant
 */
router.post('/login/2fa-send-code', asyncHandler(async (req, res) => {
  const sendCodeSchema = Joi.object({
    challenge_id: Joi.string()
      .required()
      .messages({
        'any.required': 'ID de challenge requis'
      }),
    method: Joi.string()
      .valid('whatsapp')
      .required()
      .messages({
        'any.required': 'Méthode 2FA requise',
        'any.only': 'Méthode 2FA invalide'
      })
  });

  const { error, value } = sendCodeSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { challenge_id, method } = value;

  logger.info("Demande d'envoi de code 2FA (login)", { challenge_id, method });

  // Récupérer le challenge en mémoire
  global.twoFactorChallenges = global.twoFactorChallenges || {};
  const challengeData = global.twoFactorChallenges[challenge_id];

  if (!challengeData) {
    throw new AuthenticationError('Challenge 2FA invalide ou expiré');
  }

  // Vérifier l'expiration du challenge (5 minutes)
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
  if (challengeData.timestamp < fiveMinutesAgo) {
    delete global.twoFactorChallenges[challenge_id];
    throw new AuthenticationError('Challenge 2FA expiré');
  }

  // Récupérer l'utilisateur associé au challenge
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', challengeData.userId)
    .single();

  if (userError || !user) {
    delete global.twoFactorChallenges[challenge_id];
    logger.error('Utilisateur non trouvé pour envoi code 2FA login', { challenge_id, error: userError });
    throw new AuthenticationError('Utilisateur non trouvé');
  }

  const securitySettings = user.metadata?.security_settings || {};

  if (!securitySettings.two_factor_enabled) {
    throw new AuthenticationError('WhatsApp 2FA non activé pour cet utilisateur');
  }

  // Limiter le nombre d'envois de code WhatsApp par challenge
  const MAX_WHATSAPP_SENDS = 3;
  const currentSendCount = challengeData.whatsapp_send_count || 0;
  if (currentSendCount >= MAX_WHATSAPP_SENDS) {
    throw new ValidationError('Nombre maximum de renvois de code atteint pour cette tentative de connexion. Veuillez réessayer plus tard.');
  }

  try {
    const code = TwoFactorService.generateCode();
    const stored = await TwoFactorService.storeCode(user.id, code, 'whatsapp');

    if (!stored) {
      logger.error('Erreur stockage code WhatsApp pour 2FA login (on-demand)', { userId: user.id });
      throw new ValidationError('Erreur lors de la génération du code');
    }

    const sendResult = await whatsappService.sendOTP(user.phone, code, user.full_name || '');

    // Incrémenter le compteur d'envois pour ce challenge
    challengeData.whatsapp_send_count = (challengeData.whatsapp_send_count || 0) + 1;
    global.twoFactorChallenges[challenge_id] = challengeData;

    logger.info('Code WhatsApp envoyé pour 2FA login (on-demand)', {
      userId: user.id,
      phone: user.phone,
      simulation: sendResult.simulation || false,
      status: sendResult.status || 'sent',
      sendCount: challengeData.whatsapp_send_count,
    });

    return res.json({
      success: true,
      message: 'Code envoyé par WhatsApp',
      data: {
        method: 'whatsapp',
        expires_in: 300,
        simulation: sendResult.simulation || false
      }
    });
  } catch (err) {
    logger.error('Erreur envoi code WhatsApp pour 2FA login (on-demand)', {
      userId: user.id,
      error: err.message
    });
    throw new ValidationError("Erreur lors de l'envoi du code WhatsApp");
  }
}));

/**
 * POST /api/v1/auth/login/2fa-verify
 * Vérification du code 2FA pour finaliser la connexion
 */
router.post('/login/2fa-verify', bruteForceProtection(5, 15 * 60 * 1000), asyncHandler(async (req, res) => {
  // Validation des données d'entrée
  const twoFactorVerifySchema = Joi.object({
    challenge_id: Joi.string()
      .required()
      .messages({
        'any.required': 'ID de challenge requis'
      }),
    method: Joi.string()
      .valid('authenticator', 'whatsapp')
      .required()
      .messages({
        'any.required': 'Méthode 2FA requise',
        'any.only': 'Méthode 2FA invalide'
      }),
    code: Joi.string()
      .length(6)
      .pattern(/^\d{6}$/)
      .required()
      .messages({
        'string.length': 'Le code doit contenir exactement 6 chiffres',
        'string.pattern.base': 'Le code doit contenir uniquement des chiffres',
        'any.required': 'Code de vérification requis'
      })
  });

  const { error, value } = twoFactorVerifySchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { challenge_id, method, code } = value;

  logger.info('Tentative de vérification 2FA (login)', { challenge_id, method });

  // Récupérer le challenge en mémoire
  global.twoFactorChallenges = global.twoFactorChallenges || {};
  const challengeData = global.twoFactorChallenges[challenge_id];

  if (!challengeData) {
    throw new AuthenticationError('Challenge 2FA invalide ou expiré');
  }

  // Vérifier l'expiration du challenge (5 minutes)
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
  if (challengeData.timestamp < fiveMinutesAgo) {
    delete global.twoFactorChallenges[challenge_id];
    throw new AuthenticationError('Challenge 2FA expiré');
  }

  // Récupérer l'utilisateur associé au challenge
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', challengeData.userId)
    .single();

  if (userError || !user) {
    delete global.twoFactorChallenges[challenge_id];
    logger.error('Utilisateur non trouvé pour vérification 2FA login', { challenge_id, error: userError });
    throw new AuthenticationError('Utilisateur non trouvé');
  }

  const securitySettings = user.metadata?.security_settings || {};

  let isCodeValid = false;

  if (method === 'authenticator') {
    if (!securitySettings.authenticator_enabled) {
      throw new AuthenticationError('Authenticator non activé pour cet utilisateur');
    }

    if (!user.totp_secret) {
      logger.error('totp_secret manquant pour utilisateur', { userId: user.id });
      throw new AuthenticationError('Configuration Authenticator invalide');
    }

    try {
      const verification = await TwoFactorService.verifyCode(
        user.id,
        code,
        'authenticator',
        user.totp_secret
      );
      isCodeValid = verification.success;
      if (!verification.success) {
        logger.warn('Code 2FA Authenticator invalide (login)', { userId: user.id, challenge_id });
      }
    } catch (e) {
      logger.error('Erreur lors de la vérification TOTP (login)', { userId: user.id, error: e.message });
      isCodeValid = false;
    }
  } else if (method === 'whatsapp') {
    if (!securitySettings.two_factor_enabled) {
      throw new AuthenticationError('WhatsApp 2FA non activé pour cet utilisateur');
    }

    try {
      const verification = await TwoFactorService.verifyCode(
        user.id,
        code,
        'whatsapp'
      );
      isCodeValid = verification.success;
      if (!verification.success) {
        logger.warn('Code 2FA WhatsApp invalide (login)', { userId: user.id, challenge_id });
      }
    } catch (e) {
      logger.error('Erreur lors de la vérification WhatsApp 2FA (login)', { userId: user.id, error: e.message });
      isCodeValid = false;
    }
  }

  if (!isCodeValid) {
    throw new AuthenticationError('Code de vérification invalide');
  }

  // Code correct, on peut supprimer le challenge
  delete global.twoFactorChallenges[challenge_id];

  // Générer des tokens JWT sécurisés (même structure que /auth/login)
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    phone: user.phone,
    userIdDisplay: user.user_id_display
  };

  const accessToken = SecurityService.generateAccessToken(tokenPayload);
  const refreshToken = SecurityService.generateRefreshToken({ userId: user.id });

  // Mettre à jour la dernière connexion en utilisant les infos du challenge
  await supabaseAdmin
    .from('users')
    .update({
      last_login_at: new Date().toISOString(),
      metadata: {
        ...user.metadata,
        last_login_ip: challengeData.ip,
        last_login_user_agent: challengeData.userAgent,
        last_login_method: challengeData.searchType || '2fa'
      }
    })
    .eq('id', user.id);

  logger.info('Connexion 2FA réussie', {
    userId: user.id,
    method,
    challengeId: challenge_id
  });

  const nowIso = new Date().toISOString();

  res.json({
    success: true,
    message: 'Connexion réussie avec authentification à deux facteurs',
    data: {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        full_name: user.full_name,
        user_id_display: user.user_id_display,
        user_level: user.user_level,
        points: user.points,
        is_verified: user.is_verified,
        avatar_url: user.avatar_url,
        date_of_birth: user.date_of_birth,
        address: user.address,
        country_code: user.country_code,
        created_at: user.created_at,
        last_login_at: nowIso
      },
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 86400,
      login_method: challengeData.searchType || '2fa'
    }
  });
}));

/**
 * POST /api/v1/auth/logout
 * Déconnexion utilisateur
 */
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  const { data, error } = await supabaseAdmin.auth.admin.signOut(req.user.id);

  if (error) {
    logger.error('Erreur lors de la déconnexion', { userId: req.user.id, error });
  }

  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
}));

/**
 * POST /api/v1/auth/refresh
 * Rafraîchir le token d'accès avec le refresh token
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  console.log('🔄 Auth Refresh - Demande de refresh token');
  
  const { refresh_token } = req.body;
  
  if (!refresh_token) {
    return res.status(400).json({
      success: false,
      error: 'Refresh token requis'
    });
  }

  try {
    // Vérifier le refresh token
    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    
    // Récupérer l'utilisateur
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      console.error('❌ Utilisateur non trouvé pour refresh token:', error);
      return res.status(401).json({
        success: false,
        error: 'Refresh token invalide'
      });
    }

    // Générer un nouveau access token
    const newAccessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        phone: user.phone,
        userIdDisplay: user.user_id_display
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: '24h',
        audience: 'mossombi-app',
        issuer: 'mossombi-api'
      }
    );

    console.log('✅ Nouveau access token généré pour:', user.user_id_display);

    // Petit délai pour s'assurer que le token est bien "actif"
    await new Promise(resolve => setTimeout(resolve, 100));

    res.json({
      success: true,
      message: 'Token rafraîchi avec succès',
      data: {
        access_token: newAccessToken,
        token_type: 'Bearer',
        expires_in: 86400 // 24h en secondes
      }
    });

  } catch (error) {
    console.error('❌ Erreur refresh token:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Refresh token expiré'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Refresh token invalide'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
}));

/**
 * POST /api/v1/auth/forgot-password
 * Demande de réinitialisation de mot de passe
 */
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { error, value } = forgotPasswordSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { phone } = value;

  // Vérifier si l'utilisateur existe et est vérifié
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('id, phone, full_name, is_verified')
    .eq('phone', phone)
    .eq('is_verified', true)
    .single();

  if (!userData) {
    // Ne pas révéler si l'utilisateur existe ou non pour la sécurité
    logger.warn('Tentative reset mot de passe pour numéro inexistant', { phone });
    res.json({
      success: true,
      message: 'Si ce numéro existe, un code de vérification a été envoyé.'
    });
    return;
  }

  // Générer un code OTP sécurisé
  const otp = otpSecurityService.generateOTP();
  const otpHash = otpSecurityService.hashOTP(otp);

  // Stocker temporairement (en production, utiliser Redis avec TTL)
  otpStorage.set(`reset_${phone}`, {
    hash: otpHash,
    attempts: 0,
    createdAt: Date.now(),
    userId: userData.id
  });

  // Envoyer l'OTP par WhatsApp
  try {
    const message = `🔐 Code de réinitialisation Mossombi: ${otp}\n\nCe code expire dans 10 minutes.\nNe le partagez avec personne.`;
    
    await whatsappService.sendMessage(phone, message);
    
    logger.info('Code reset mot de passe envoyé', { 
      phone: phone.replace(/\d(?=\d{4})/g, '*'),
      userId: userData.id 
    });

    res.json({
      success: true,
      message: 'Code de vérification envoyé par WhatsApp.',
      data: {
        phone: phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2'), // Masquer une partie du numéro
        expires_in: 600 // 10 minutes en secondes
      }
    });

  } catch (error) {
    logger.error('Erreur envoi code reset:', error);
    
    // Nettoyer le code en cas d'erreur d'envoi
    otpStorage.delete(`reset_${phone}`);
    
    throw new Error('Impossible d\'envoyer le code. Veuillez réessayer.');
  }
}));

/**
 * POST /api/v1/auth/reset-password
 * Réinitialiser le mot de passe avec le code OTP
 */
router.post('/reset-password', authRateLimit, sensitiveActionAudit('password_reset'), asyncHandler(async (req, res) => {
  const { error, value } = resetPasswordSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { phone, otp_code, new_password } = value;

  // Récupérer les données OTP stockées
  const otpData = otpStorage.get(`reset_${phone}`);
  if (!otpData) {
    throw new ValidationError('Code expiré ou invalide. Demandez un nouveau code.');
  }

  // Vérifier l'expiration (10 minutes)
  if (Date.now() - otpData.createdAt > 10 * 60 * 1000) {
    otpStorage.delete(`reset_${phone}`);
    throw new ValidationError('Code expiré. Demandez un nouveau code.');
  }

  // Vérifier le nombre de tentatives
  if (otpData.attempts >= 3) {
    otpStorage.delete(`reset_${phone}`);
    throw new ValidationError('Trop de tentatives. Demandez un nouveau code.');
  }

  // Vérifier le code OTP
  if (!otpSecurityService.verifyOTP(otp_code, otpData.hash)) {
    otpData.attempts++;
    throw new ValidationError('Code incorrect.');
  }

  // Validation renforcée du nouveau mot de passe
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('full_name, email')
    .eq('id', otpData.userId)
    .single();

  const passwordValidation = passwordSecurityService.validatePasswordStrength(new_password, {
    full_name: user?.full_name,
    email: user?.email,
    phone
  });

  if (!passwordValidation.isValid) {
    throw new ValidationError('Mot de passe non conforme aux critères de sécurité', {
      code: 'WEAK_PASSWORD',
      errors: passwordValidation.errors,
      warnings: passwordValidation.warnings,
      suggestions: passwordValidation.suggestions
    });
  }

  // Vérifier si le mot de passe est compromis
  const isCompromised = await passwordSecurityService.checkCompromisedPassword(new_password);
  if (isCompromised) {
    throw new ValidationError('Ce mot de passe a été compromis dans des fuites de données. Veuillez en choisir un autre.');
  }

  // Hasher le nouveau mot de passe
  const hashedPassword = await SecurityService.hashPassword(new_password);

  // Mettre à jour le mot de passe dans la base de données
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({ 
      password_hash: hashedPassword,
      updated_at: new Date().toISOString()
    })
    .eq('id', otpData.userId);

  if (updateError) {
    logger.error('Erreur mise à jour mot de passe:', updateError);
    throw new Error('Erreur lors de la mise à jour du mot de passe.');
  }

  // Nettoyer le code OTP utilisé
  otpStorage.delete(`reset_${phone}`);

  logger.info('Mot de passe réinitialisé avec succès', { 
    userId: otpData.userId,
    phone: phone.replace(/\d(?=\d{4})/g, '*')
  });

  res.json({
    success: true,
    message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.'
  });
}));

/**
 * GET /api/v1/auth/me
 * Récupérer les informations de l'utilisateur connecté
 */
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Profil utilisateur récupéré',
    data: {
      user: {
        id: req.user.id,
        email: req.user.email,
        phone: req.user.phone,
        full_name: req.user.full_name,
        user_id_display: req.user.user_id_display,
        user_level: req.user.user_level,
        points: req.user.points,
        is_verified: req.user.is_verified,
        avatar_url: req.user.avatar_url,
        date_of_birth: req.user.date_of_birth,
        address: req.user.address,
        country_code: req.user.country_code,
        created_at: req.user.created_at,
        last_login_at: req.user.last_login_at
      }
    }
  });
}));

/**
 * PUT /api/v1/auth/profile
 * Mettre à jour le profil utilisateur
 */
router.put('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const updateSchema = Joi.object({
    full_name: Joi.string().min(2).max(100).optional(),
    email: Joi.string().email().optional().allow(''),
    avatar_url: Joi.string().uri().optional().allow(''),
    phone: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).optional().allow(''),
    date_of_birth: Joi.date().iso().optional().allow(''),
    address: Joi.string().max(200).optional().allow('')
  });

  const { error, value } = updateSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { full_name, email, avatar_url, phone, date_of_birth, address } = value;
  const updateData = {};

  if (full_name) updateData.full_name = full_name;
  if (email !== undefined) updateData.email = email || null;
  if (avatar_url !== undefined) updateData.avatar_url = avatar_url || null;
  if (phone !== undefined) updateData.phone = phone || null;
  if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth || null;
  if (address !== undefined) updateData.address = address || null;

  // Si un email est fourni, vérifier qu'il n'existe pas déjà
  if (email && email.trim()) {
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .neq('id', req.user.id)
      .single();

    if (existingUser) {
      throw new ConflictError('Cette adresse email est déjà utilisée');
    }
  }

  // Si un téléphone est fourni, vérifier qu'il n'existe pas déjà
  if (phone && phone.trim()) {
    const { data: existingPhone } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone', phone)
      .neq('id', req.user.id)
      .single();

    if (existingPhone) {
      throw new ConflictError('Ce numéro de téléphone est déjà utilisé');
    }
  }

  const { data: updatedUser, error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', req.user.id)
    .select()
    .single();

  if (updateError) {
    logger.error('Erreur mise à jour profil', { 
      error: updateError, 
      userId: req.user.id 
    });
    throw new ValidationError('Erreur lors de la mise à jour du profil');
  }

  res.json({
    success: true,
    message: 'Profil mis à jour avec succès',
    data: {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        phone: updatedUser.phone,
        full_name: updatedUser.full_name,
        user_id_display: updatedUser.user_id_display,
        user_level: updatedUser.user_level,
        points: updatedUser.points,
        is_verified: updatedUser.is_verified,
        avatar_url: updatedUser.avatar_url,
        date_of_birth: updatedUser.date_of_birth,
        address: updatedUser.address,
        country_code: updatedUser.country_code,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at
      }
    }
  });
}));

/**
 * POST /api/v1/auth/resend-otp
 * Renvoyer le code OTP pour un utilisateur non vérifié
 */
router.post('/resend-otp', asyncHandler(async (req, res) => {
  // Validation des données
  const resendOtpSchema = Joi.object({
    phone: Joi.string()
      .pattern(/^[0-9+\-\s()]+$/)
      .required()
      .messages({
        'string.pattern.base': 'Format de téléphone invalide',
        'any.required': 'Le numéro de téléphone est requis'
      })
  });

  const { error, value } = resendOtpSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { phone } = value;
  const cleanPhone = phone.replace(/^\+/, '');

  // Récupérer l'utilisateur existant non vérifié
  const { data: existingUser, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('phone', `+${cleanPhone}`)
    .eq('is_verified', false)
    .single();

  if (fetchError || !existingUser) {
    throw new AuthenticationError('Aucun compte non vérifié trouvé pour ce numéro');
  }

  // Générer un nouveau code OTP
  const newOtpCode = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // Mettre à jour l'utilisateur avec le nouveau code OTP
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        metadata: {
          ...existingUser.metadata,
          otp_code: newOtpCode,
          otp_expires: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          resent_at: new Date().toISOString()
        }
      })
      .eq('id', existingUser.id)
      .select()
      .single();

    if (updateError) {
      logger.error('Erreur mise à jour OTP', { error: updateError, userId: existingUser.id });
      throw new ValidationError('Erreur lors du renvoi du code');
    }

    // Envoyer le nouveau code OTP par WhatsApp
    const whatsappResult = await whatsappService.sendOTP(`+${cleanPhone}`, newOtpCode, existingUser.full_name);
    
    logger.info('Nouveau code OTP envoyé', { 
      userId: existingUser.id,
      phone: cleanPhone,
      otpCode: newOtpCode,
      whatsappSent: whatsappResult.success
    });

    res.json({
      success: true,
      message: 'Nouveau code de vérification envoyé par WhatsApp.',
      data: {
        user: {
          id: existingUser.id,
          phone: existingUser.phone,
          email: existingUser.email,
          full_name: existingUser.full_name
        },
        otp_code: newOtpCode, // Pour les tests (à supprimer en production)
        verification: {
          method: 'whatsapp',
          expires_in: 600,
          message_sent: whatsappResult.success,
          simulation_mode: whatsappResult.simulation || false
        }
      }
    });

  } catch (error) {
    logger.error('Erreur lors du renvoi OTP', { error: error.message, phone: cleanPhone });
    throw error;
  }
}));

/**
 * POST /api/v1/auth/login
 * Connexion avec email et mot de passe
 */
router.post('/login', asyncHandler(async (req, res) => {
  // Validation des données
  const loginSchema = Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Format d\'email invalide',
        'any.required': 'L\'email est requis'
      }),
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.min': 'Le mot de passe doit contenir au moins 6 caractères',
        'any.required': 'Le mot de passe est requis'
      })
  });

  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { email, password } = value;

  logger.info('Tentative de connexion', { email });

  // Récupérer l'utilisateur par email
  const { data: user, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  logger.info('Résultat recherche utilisateur', { 
    found: !!user, 
    error: fetchError?.message,
    userId: user?.id 
  });

  if (fetchError || !user) {
    logger.warn('Tentative de connexion avec email inexistant', { email, error: fetchError });
    throw new AuthenticationError('Email ou mot de passe incorrect');
  }

  // Vérifier que l'utilisateur est vérifié
  if (!user.is_verified) {
    throw new AuthenticationError('Compte non vérifié. Veuillez vérifier votre numéro WhatsApp.');
  }

  // Vérifier le mot de passe hashé
  const storedPassword = user.password_hash;
  
  if (!storedPassword) {
    logger.warn('Pas de mot de passe hashé trouvé', { 
      email,
      userId: user.id
    });
    throw new AuthenticationError('Email ou mot de passe incorrect');
  }

  // Vérifier le mot de passe avec bcrypt
  const isPasswordValid = await SecurityService.verifyPassword(password, storedPassword);
  
  logger.info('Vérification mot de passe sécurisée', { 
    email,
    userId: user.id,
    hasStoredPassword: !!storedPassword,
    isValid: isPasswordValid
  });

  if (!isPasswordValid) {
    logger.warn('Tentative de connexion avec mot de passe incorrect', { 
      email, 
      userId: user.id
    });
    throw new AuthenticationError('Email ou mot de passe incorrect');
  }

  // Générer un token JWT simple (à améliorer plus tard)
  const token = Buffer.from(JSON.stringify({
    userId: user.id,
    email: user.email,
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24h
  })).toString('base64');

  // Mettre à jour la dernière connexion
  await supabaseAdmin
    .from('users')
    .update({
      last_login_at: new Date().toISOString(),
      metadata: {
        ...user.metadata,
        last_login_ip: req.ip,
        last_login_user_agent: req.get('User-Agent')
      }
    })
    .eq('id', user.id);

  // Logger la connexion réussie
  logger.info('Connexion réussie', { 
    userId: user.id,
    email: user.email,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  res.json({
    success: true,
    message: 'Connexion réussie ! Bienvenue sur Mossombi !',
    data: {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        full_name: user.full_name,
        user_id_display: user.user_id_display,
        user_level: user.user_level,
        points: user.points,
        is_verified: user.is_verified,
        avatar_url: user.avatar_url,
        date_of_birth: user.date_of_birth,
        address: user.address,
        country_code: user.country_code,
        created_at: user.created_at,
        last_login_at: new Date().toISOString()
      },
      token,
      expires_in: 86400 // 24h en secondes
    }
  });
}));

/**
 * GET /api/v1/auth/stats
 * Récupérer les statistiques utilisateur (niveau, points, progression)
 */
router.get('/stats', authenticateToken, asyncHandler(async (req, res) => {
  const { data: userStats, error } = await supabaseAdmin
    .from('users')
    .select('points, user_level, created_at, last_login_at, phone_verified_at')
    .eq('id', req.user.id)
    .single();

  if (error) {
    logger.error('Erreur récupération stats utilisateur', { 
      error, 
      userId: req.user.id 
    });
    throw new ValidationError('Erreur lors de la récupération des statistiques');
  }

  // Calculer les niveaux et progression
  const levels = {
    'Bronze': { min: 0, max: 500 },
    'Silver': { min: 500, max: 1000 },
    'Gold': { min: 1000, max: 2000 },
    'Diamond': { min: 2000, max: 5000 }
  };

  const currentLevel = userStats.user_level || 'Bronze';
  const currentLevelInfo = levels[currentLevel];
  const nextLevelName = Object.keys(levels).find(level => 
    levels[level].min > currentLevelInfo.max
  );
  
  const progress = currentLevelInfo ? 
    ((userStats.points - currentLevelInfo.min) / (currentLevelInfo.max - currentLevelInfo.min)) * 100 : 0;

  res.json({
    success: true,
    message: 'Statistiques utilisateur récupérées',
    data: {
      user_id: req.user.user_id_display,
      points: userStats.points,
      level: {
        current: currentLevel,
        next: nextLevelName || 'Max Level',
        progress: Math.round(progress),
        points_needed: nextLevelName ? currentLevelInfo.max - userStats.points : 0
      },
      account_age_days: Math.floor((new Date() - new Date(userStats.created_at)) / (1000 * 60 * 60 * 24)),
      last_login: userStats.last_login_at,
      verified_since: userStats.phone_verified_at
    }
  });
}));

/**
 * POST /api/v1/auth/change-password
 * Changer le mot de passe utilisateur
 */
router.post('/change-password', authenticateToken, asyncHandler(async (req, res) => {
  const changePasswordSchema = Joi.object({
    current_password: Joi.string().required().messages({
      'any.required': 'Le mot de passe actuel est requis'
    }),
    new_password: Joi.string().min(6).required().messages({
      'string.min': 'Le nouveau mot de passe doit contenir au moins 6 caractères',
      'any.required': 'Le nouveau mot de passe est requis'
    })
  });

  const { error, value } = changePasswordSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { current_password, new_password } = value;

  // Vérifier le mot de passe actuel
  const currentPasswordHash = req.user.password_hash;
  if (!currentPasswordHash) {
    throw new AuthenticationError('Mot de passe actuel non trouvé');
  }

  const isCurrentPasswordValid = await SecurityService.verifyPassword(current_password, currentPasswordHash);
  if (!isCurrentPasswordValid) {
    throw new AuthenticationError('Mot de passe actuel incorrect');
  }

  // Hasher le nouveau mot de passe
  const newPasswordHash = await SecurityService.hashPassword(new_password);

  // Mettre à jour le mot de passe
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      password_hash: newPasswordHash,
      metadata: {
        ...req.user.metadata,
        password_changed_at: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    })
    .eq('id', req.user.id);

  if (updateError) {
    logger.error('Erreur changement mot de passe', { 
      error: updateError, 
      userId: req.user.id 
    });
    throw new ValidationError('Erreur lors du changement de mot de passe');
  }

  logger.info('Mot de passe changé avec succès', { 
    userId: req.user.id,
    ip: req.ip 
  });

  res.json({
    success: true,
    message: 'Mot de passe changé avec succès'
  });
}));

/**
 * POST /api/v1/auth/admin/unblock-user
 * Débloquer un utilisateur (admin seulement)
 */
router.post('/admin/unblock-user', authenticateToken, sensitiveActionAudit('unblock_user', 'user'), asyncHandler(async (req, res) => {
  // Vérifier que l'utilisateur est admin (à adapter selon votre système)
  if (req.user.user_level !== 'Admin') {
    throw new AuthenticationError('Accès refusé. Droits administrateur requis.');
  }

  const { phone } = req.body;
  if (!phone) {
    throw new ValidationError('Le numéro de téléphone est requis');
  }

  const wasBlocked = otpSecurityService.unblockUser(phone, req.user.id);
  
  res.json({
    success: true,
    message: wasBlocked 
      ? 'Utilisateur débloqué avec succès' 
      : 'Utilisateur n\'était pas bloqué',
    data: {
      phone,
      wasBlocked,
      unblockedBy: req.user.id,
      unblockedAt: new Date().toISOString()
    }
  });
}));

/**
 * GET /api/v1/auth/admin/security-stats
 * Obtenir les statistiques de sécurité (admin seulement)
 */
router.get('/admin/security-stats', authenticateToken, asyncHandler(async (req, res) => {
  // Vérifier que l'utilisateur est admin
  if (req.user.user_level !== 'Admin') {
    throw new AuthenticationError('Accès refusé. Droits administrateur requis.');
  }

  const otpStats = otpSecurityService.getSecurityStats();
  const auditStats = auditLogService.getAuditStats();
  
  res.json({
    success: true,
    data: {
      otp: {
        ...otpStats,
        securityLevels: [
          { attempts: 3, blockDuration: '30 minutes' },
          { attempts: 5, blockDuration: '1 heure' },
          { attempts: 8, blockDuration: '24 heures' },
          { attempts: 10, blockDuration: 'Définitif' }
        ]
      },
      audit: auditStats,
      retrievedAt: new Date().toISOString()
    }
  });
}));

/**
 * GET /api/v1/auth/admin/audit-report
 * Générer un rapport d'audit (admin seulement)
 */
router.get('/admin/audit-report', authenticateToken, asyncHandler(async (req, res) => {
  // Vérifier que l'utilisateur est admin
  if (req.user.user_level !== 'Admin') {
    throw new AuthenticationError('Accès refusé. Droits administrateur requis.');
  }

  const { startDate, endDate } = req.query;
  
  const report = await auditLogService.generateAuditReport(
    startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate || new Date().toISOString()
  );
  
  res.json({
    success: true,
    data: report
  });
}));

/**
 * PUT /api/v1/auth/security-settings
 * Mettre à jour les paramètres de sécurité utilisateur
 */
router.put('/security-settings', authenticateToken, asyncHandler(async (req, res) => {
  const securitySettingsSchema = Joi.object({
    authenticator_enabled: Joi.boolean(),
    two_factor_enabled: Joi.boolean(),
    login_alerts_enabled: Joi.boolean()
  });

  const { error, value } = securitySettingsSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  console.log('🔒 Mise à jour paramètres sécurité pour utilisateur:', req.user.id);
  console.log('📝 Nouveaux paramètres:', value);

  // Récupérer les paramètres actuels
  const { data: currentUser, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('metadata')
    .eq('id', req.user.id)
    .single();

  if (fetchError) {
    logger.error('Erreur récupération utilisateur:', fetchError);
    throw new Error('Impossible de récupérer les paramètres actuels');
  }

  // Fusionner avec les nouveaux paramètres
  const updatedMetadata = {
    ...currentUser.metadata,
    security_settings: {
      ...currentUser.metadata?.security_settings,
      ...value
    }
  };

  // Mettre à jour en base
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      metadata: updatedMetadata,
      updated_at: new Date().toISOString()
    })
    .eq('id', req.user.id);

  if (updateError) {
    logger.error('Erreur mise à jour paramètres sécurité:', updateError);
    throw new Error('Impossible de mettre à jour les paramètres de sécurité');
  }

  logger.info('✅ Paramètres de sécurité mis à jour avec succès');

  res.json({
    success: true,
    message: 'Paramètres de sécurité mis à jour avec succès',
    data: {
      security_settings: updatedMetadata.security_settings
    }
  });
}));


export default router;

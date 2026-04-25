/**
 * ROUTES D'AUTHENTIFICATION
 * Gestion de l'inscription, connexion, et authentification
 */

import express from 'express';
import Joi from 'joi';
import crypto from 'crypto';
import { dbAdmin } from '../config/db.js';
import { asyncHandler, ValidationError, AuthenticationError, ConflictError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import SecurityService from '../services/securityService.js';
import TwoFactorService from '../services/twoFactorService.js';
import { refreshTokenService } from '../services/refreshTokenService.js';
import { whatsappService } from '../services/whatsappService.js';
import { smsService } from '../services/smsService.js';
import { appDataSource } from '../db/dataSource.js';

const router = express.Router();

const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || 'refresh_token';
const REFRESH_COOKIE_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || 30);

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (!key) continue;
    cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

function getCookie(req, name) {
  const cookies = parseCookies(req.headers?.cookie);
  return cookies[name];
}

function getRefreshCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';

  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: `/api/${process.env.API_VERSION || 'v1'}/auth`,
    maxAge: REFRESH_COOKIE_DAYS * 24 * 60 * 60 * 1000,
  };

  if (process.env.REFRESH_COOKIE_DOMAIN) {
    cookieOptions.domain = process.env.REFRESH_COOKIE_DOMAIN;
  }

  return cookieOptions;
}

function setRefreshCookie(res, refreshToken) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...getRefreshCookieOptions(),
    maxAge: 0,
  });
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

const registerSchema = Joi.object({
  phone: Joi.string().required(),
  password: Joi.string().min(6).required(),
  first_name: Joi.string().min(2).max(100).required(),
  last_name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().optional().allow(''),
  country_code: Joi.string().length(2).default('CG'),
});

const loginSchema = Joi.object({
  identifier: Joi.string().required(),
  // Compat legacy
  email: Joi.string().email().optional(),
  password: Joi.string().required(),
});

const twoFactorVerifySchema = Joi.object({
  pending_token: Joi.string().required(),
  code: Joi.string().required(),
});

const refreshSchema = Joi.object({
  refresh_token: Joi.string().optional(),
});

const logoutSchema = Joi.object({
  refresh_token: Joi.string().optional(),
});

const checkPhoneSchema = Joi.object({
  phone: Joi.string().required(),
});

const sendOtpSchema = Joi.object({
  phone: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  phone: Joi.string().required(),
});

const resetPasswordSchema = Joi.object({
  phone: Joi.string().required(),
  otp_code: Joi.string().length(6).pattern(/^\d{6}$/).optional(),
  reset_token: Joi.string().min(10).optional(),
  new_password: Joi.string().min(8).required(),
}).or('otp_code', 'reset_token');

const verifyResetOtpSchema = Joi.object({
  phone: Joi.string().required(),
  otp_code: Joi.string().length(6).pattern(/^\d{6}$/).required(),
});

async function createPasswordResetToken(userId) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Invalidate previous tokens for the user (best-effort)
  try {
    await dbAdmin.from('password_reset_tokens').update({ is_used: true, used_at: new Date().toISOString() }).eq('user_id', userId);
  } catch {
    // ignore
  }

  await dbAdmin.from('password_reset_tokens').insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
    is_used: false,
    created_at: new Date().toISOString(),
  });

  return { token: rawToken, expiresAt };
}

async function verifyPasswordResetToken(userId, rawToken) {
  const tokenHash = crypto.createHash('sha256').update(String(rawToken)).digest('hex');
  const { data, error } = await dbAdmin
    .from('password_reset_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('token_hash', tokenHash)
    .or('is_used.is.null,is_used.eq.false')
    .single();

  if (error || !data) {
    return { success: false, error: 'Token invalide ou expiré' };
  }

  if (new Date() > new Date(data.expires_at)) {
    await dbAdmin.from('password_reset_tokens').update({ is_used: true, used_at: new Date().toISOString() }).eq('id', data.id);
    return { success: false, error: 'Token expiré' };
  }

  await dbAdmin
    .from('password_reset_tokens')
    .update({ is_used: true, used_at: new Date().toISOString() })
    .eq('id', data.id);

  return { success: true };
}

const verifyOtpSchema = Joi.object({
  phone: Joi.string().required(),
  otp_code: Joi.string().length(6).pattern(/^\d{6}$/).required(),
});

const generateUserDisplayId = async () => {
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    const id = `MSB-${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`;

    const { data } = await dbAdmin
      .from('users')
      .select('id')
      .eq('user_id_display', id)
      .single();

    if (!data) return id;
    attempts++;
  }

  throw new Error('Impossible de générer un ID utilisateur unique');
};

const issueTokens = async ({ userId, req }) => {
  const accessToken = SecurityService.generateAccessToken({ userId });
  const { token: refreshToken } = await refreshTokenService.issueToken({
    userId,
    ip: req.ip,
    userAgent: req.get('User-Agent') || null,
  });

  return { accessToken, refreshToken };
};

/**
 * POST /api/v1/auth/register
 */
router.post('/register', asyncHandler(async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const { phone, password, first_name, last_name, email, country_code } = value;
  const full_name = `${first_name} ${last_name}`.trim();
  const cleanPhone = phone.replace(/^\+/, '');
  const formattedPhone = `+${cleanPhone}`;

  const { data: existingByPhone } = await dbAdmin
    .from('users')
    .select('id, full_name, is_active, is_verified')
    .eq('phone', formattedPhone)
    .single();

  if (existingByPhone) {
    // Si le compte existe mais n'est pas encore vérifié, on renvoie vers la vérification OTP
    if (!existingByPhone.is_verified) {
      logger.info('Register: compte existant non vérifié, renvoi OTP', {
        route: '/api/v1/auth/register',
        userId: existingByPhone.id,
        maskedPhone: formattedPhone.replace(/\d(?=\d{4})/g, '*'),
      });

      const otpCode = TwoFactorService.generateCode();
      const otpStored = await TwoFactorService.storeCode(existingByPhone.id, otpCode, 'whatsapp');

      if (!otpStored) {
        logger.error('Register: échec stockage OTP (compte existant)', {
          route: '/api/v1/auth/register',
          userId: existingByPhone.id,
          maskedPhone: formattedPhone.replace(/\d(?=\d{4})/g, '*'),
        });
        throw new ValidationError('Impossible de générer le code');
      }

      const sendResult = await whatsappService.sendOTP(
        formattedPhone,
        otpCode,
        existingByPhone.full_name || full_name
      );

      logger.info('Register: résultat renvoi OTP (compte existant)', {
        route: '/api/v1/auth/register',
        userId: existingByPhone.id,
        maskedPhone: formattedPhone.replace(/\d(?=\d{4})/g, '*'),
        success: sendResult?.success,
        status: sendResult?.status,
        simulation: sendResult?.simulation,
        messageId: sendResult?.messageId,
      });

      if (!sendResult?.success) {
        const sendErrorCode = sendResult?.error || 'WHATSAPP_SEND_FAILED';
        const message = sendErrorCode === 'PHONE_NOT_ON_WHATSAPP'
          ? 'Ce numéro n\'a pas WhatsApp ou ne peut pas recevoir de messages WhatsApp.'
          : 'Impossible d\'envoyer le code de vérification pour le moment. Réessayez.';
        throw new ValidationError(message);
      }

      return res.json({
        success: true,
        message: 'Code envoyé. Veuillez vérifier votre numéro.',
        data: {
          user: {
            id: existingByPhone.id,
            phone: formattedPhone,
            is_active: existingByPhone.is_active,
            is_verified: existingByPhone.is_verified,
          },
          otp: {
            message_sent: true,
            provider: 'whatsapp',
            status: sendResult?.status,
            message_id: sendResult?.messageId,
          },
          flow: 'verify_existing_unverified_user',
        },
      });
    }

    throw new ConflictError('Ce numéro de téléphone est déjà utilisé');
  }

  if (email && email.trim()) {
    const { data: existingByEmail } = await dbAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingByEmail) {
      throw new ConflictError('Cette adresse email est déjà utilisée');
    }
  }

  const passwordHash = await SecurityService.hashPassword(password);
  const userIdDisplay = await generateUserDisplayId();
  const userId = crypto.randomUUID();

  const { data: createdUser, error: insertError } = await dbAdmin
    .from('users')
    .insert({
      id: userId,
      phone: formattedPhone,
      email: email?.trim() || null,
      full_name,
      first_name,
      last_name,
      country_code,
      user_id_display: userIdDisplay,
      password_hash: passwordHash,
      role: 'user',
      is_active: false,
      is_verified: false,
      phone_verified_at: null,
      last_login_at: null,
    })
    .single();

  if (insertError) {
    logger.error('Erreur création utilisateur', { error: insertError });
    throw new Error('Impossible de créer le compte');
  }

  logger.info('Register: utilisateur créé, envoi OTP demandé', {
    route: '/api/v1/auth/register',
    userId,
    maskedPhone: formattedPhone.replace(/\d(?=\d{4})/g, '*'),
    hasEmail: Boolean(email && email.trim()),
  });

  const otpCode = TwoFactorService.generateCode();
  const otpStored = await TwoFactorService.storeCode(userId, otpCode, 'whatsapp');

  let otpSendResult = null;
  if (otpStored) {
    const startSendMs = Date.now();
    try {
      otpSendResult = await withTimeout(
        whatsappService.sendOTP(formattedPhone, otpCode, full_name),
        7000
      );
      logger.info('Register: envoi OTP terminé', {
        route: '/api/v1/auth/register',
        userId,
        maskedPhone: formattedPhone.replace(/\d(?=\d{4})/g, '*'),
        durationMs: Date.now() - startSendMs,
        success: otpSendResult?.success,
        status: otpSendResult?.status,
        simulation: otpSendResult?.simulation,
      });
    } catch (sendError) {
      logger.warn('Register: envoi OTP non bloquant (erreur/timeout)', {
        route: '/api/v1/auth/register',
        userId,
        maskedPhone: formattedPhone.replace(/\d(?=\d{4})/g, '*'),
        durationMs: Date.now() - startSendMs,
        error: sendError?.message,
      });
      otpSendResult = null;
    }
  } else {
    logger.error('Register: échec stockage OTP', {
      route: '/api/v1/auth/register',
      userId,
      maskedPhone: formattedPhone.replace(/\d(?=\d{4})/g, '*'),
    });
  }

  const otpSentOk = Boolean(otpStored && otpSendResult?.success);
  if (!otpSentOk) {
    // rollback: ne pas créer de compte si l'OTP n'a pas pu être livré
    await dbAdmin.from('two_factor_codes').delete().eq('user_id', userId).eq('method', 'whatsapp');
    await dbAdmin.from('users').delete().eq('id', userId);

    const sendErrorCode = otpSendResult?.error || 'WHATSAPP_SEND_FAILED';
    const message = sendErrorCode === 'PHONE_NOT_ON_WHATSAPP'
      ? 'Ce numéro n\'a pas WhatsApp ou ne peut pas recevoir de messages WhatsApp.'
      : 'Impossible d\'envoyer le code de vérification pour le moment. Réessayez.';

    logger.warn('Register: rollback création compte (OTP non envoyé)', {
      route: '/api/v1/auth/register',
      userId,
      maskedPhone: formattedPhone.replace(/\d(?=\d{4})/g, '*'),
      error: sendErrorCode,
    });

    throw new ValidationError(message);
  }

  res.json({
    success: true,
    message: 'Code envoyé. Veuillez vérifier votre numéro.',
    data: {
      user: createdUser,
      otp: {
        message_sent: true,
        provider: 'whatsapp',
        status: otpSendResult?.status,
        message_id: otpSendResult?.messageId,
      },
    },
  });
}));

/**
 * POST /api/v1/auth/verify-reset-otp
 * Vérifier l'OTP (étape code) et retourner un reset_token
 */
router.post('/verify-reset-otp', asyncHandler(async (req, res) => {
  const { error, value } = verifyResetOtpSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const cleanPhone = String(value.phone).replace(/^\+/, '');
  const formattedPhone = `+${cleanPhone}`;

  const { data: user, error: userError } = await dbAdmin
    .from('users')
    .select('id, is_active, is_verified')
    .eq('phone', formattedPhone)
    .single();

  if (userError || !user) {
    throw new ValidationError('Utilisateur introuvable');
  }

  const verification = await TwoFactorService.verifyCode(user.id, value.otp_code, 'whatsapp');
  if (!verification.success) {
    throw new ValidationError(verification.error || 'Code invalide');
  }

  if (user.is_verified === false && user.is_active === false) {
    await dbAdmin
      .from('users')
      .update({
        is_verified: true,
        is_active: true,
        phone_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
  }

  const { token, expiresAt } = await createPasswordResetToken(user.id);

  res.json({
    success: true,
    message: 'Code vérifié',
    data: {
      message: 'Code vérifié',
      reset_token: token,
      expires_at: expiresAt.toISOString(),
    },
  });
}));

/**
 * POST /api/v1/auth/send-otp
 * Envoyer / renvoyer un OTP (utilisé par register-step2)
 */
router.post('/send-otp', asyncHandler(async (req, res) => {
  const { error, value } = sendOtpSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const cleanPhone = String(value.phone).replace(/^\+/, '');
  const formattedPhone = `+${cleanPhone}`;

  logger.info('Send OTP: demande reçue', {
    route: '/api/v1/auth/send-otp',
    maskedPhone: formattedPhone.replace(/\d(?=\d{4})/g, '*'),
  });

  const { data: user, error: userError } = await dbAdmin
    .from('users')
    .select('id, full_name, is_verified')
    .eq('phone', formattedPhone)
    .single();

  if (userError || !user) {
    logger.warn('Send OTP: utilisateur introuvable', {
      route: '/api/v1/auth/send-otp',
      maskedPhone: formattedPhone.replace(/\d(?=\d{4})/g, '*'),
    });
    throw new ValidationError('Utilisateur introuvable');
  }

  const code = TwoFactorService.generateCode();
  const stored = await TwoFactorService.storeCode(user.id, code, 'whatsapp');

  if (!stored) {
    logger.error('Send OTP: échec stockage code', {
      route: '/api/v1/auth/send-otp',
      userId: user.id,
      maskedPhone: formattedPhone.replace(/\d(?=\d{4})/g, '*'),
    });
    throw new ValidationError('Impossible de générer le code');
  }

  const sendResult = await whatsappService.sendOTP(formattedPhone, code, user.full_name);

  logger.info('Send OTP: résultat envoi', {
    route: '/api/v1/auth/send-otp',
    userId: user.id,
    maskedPhone: formattedPhone.replace(/\d(?=\d{4})/g, '*'),
    success: sendResult?.success,
    status: sendResult?.status,
    simulation: sendResult?.simulation,
    messageId: sendResult?.messageId,
  });

  if (!sendResult?.success) {
    const sendErrorCode = sendResult?.error || 'WHATSAPP_SEND_FAILED';
    const message = sendErrorCode === 'PHONE_NOT_ON_WHATSAPP'
      ? 'Ce numéro n\'a pas WhatsApp ou ne peut pas recevoir de messages WhatsApp.'
      : 'Impossible d\'envoyer le code de vérification pour le moment. Réessayez.';
    throw new ValidationError(message);
  }

  res.json({
    success: true,
    message: 'Code envoyé',
    data: {
      message_sent: true,
      provider: 'whatsapp',
      status: sendResult?.status,
    },
  });
}));

/**
 * POST /api/v1/auth/verify-otp
 * Vérifier l'OTP (utilisé par register-step2)
 */
router.post('/verify-otp', asyncHandler(async (req, res) => {
  const { error, value } = verifyOtpSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const cleanPhone = String(value.phone).replace(/^\+/, '');
  const formattedPhone = `+${cleanPhone}`;

  logger.info('Verify OTP: demande reçue', {
    route: '/api/v1/auth/verify-otp',
    maskedPhone: formattedPhone.replace(/\d(?=\d{4})/g, '*'),
    codeLength: String(value.otp_code || '').length,
  });

  const { data: user, error: userError } = await dbAdmin
    .from('users')
    .select('*')
    .eq('phone', formattedPhone)
    .single();

  if (userError || !user) {
    logger.warn('Verify OTP: utilisateur introuvable', {
      route: '/api/v1/auth/verify-otp',
      maskedPhone: formattedPhone.replace(/\d(?=\d{4})/g, '*'),
    });
    throw new ValidationError('Utilisateur introuvable');
  }

  const verification = await TwoFactorService.verifyCode(user.id, value.otp_code, 'whatsapp');

  if (!verification.success) {
    logger.warn('Verify OTP: code invalide', {
      route: '/api/v1/auth/verify-otp',
      userId: user.id,
      maskedPhone: formattedPhone.replace(/\d(?=\d{4})/g, '*'),
      error: verification.error,
    });
    throw new ValidationError(verification.error || 'Code invalide');
  }

  const { data: updatedUser, error: updateError } = await dbAdmin
    .from('users')
    .update({
      is_verified: true,
      is_active: true,
      phone_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select('*')
    .single();

  if (updateError) {
    logger.error('Verify OTP: erreur mise à jour user', {
      route: '/api/v1/auth/verify-otp',
      userId: user.id,
      error: updateError,
    });
    throw new Error('Impossible de valider le compte');
  }

  logger.info('Verify OTP: succès, compte vérifié', {
    route: '/api/v1/auth/verify-otp',
    userId: user.id,
    maskedPhone: formattedPhone.replace(/\d(?=\d{4})/g, '*'),
  });

  const { accessToken, refreshToken } = await issueTokens({ userId: user.id, req });
  setRefreshCookie(res, refreshToken);

  res.json({
    success: true,
    message: 'Compte vérifié avec succès',
    data: {
      user: updatedUser,
      access_token: accessToken,
      message: 'Compte vérifié avec succès',
    },
  });
}));

/**
 * POST /api/v1/auth/forgot-password
 * Envoyer un OTP pour réinitialisation de mot de passe
 */
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { error, value } = forgotPasswordSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const cleanPhone = String(value.phone).replace(/^\+/, '');
  const formattedPhone = `+${cleanPhone}`;

  const { data: user, error: userError } = await dbAdmin
    .from('users')
    .select('id, full_name, is_active, is_verified')
    .eq('phone', formattedPhone)
    .single();

  if (userError || !user) {
    throw new ValidationError('Utilisateur introuvable');
  }

  const otpCode = TwoFactorService.generateCode();
  const stored = await TwoFactorService.storeCode(user.id, otpCode, 'whatsapp');

  if (!stored) {
    throw new ValidationError('Impossible de générer le code');
  }

  const sendResult = await whatsappService.sendOTP(formattedPhone, otpCode, user.full_name);

  if (!sendResult?.success) {
    const sendErrorCode = sendResult?.error || 'WHATSAPP_SEND_FAILED';
    const message = sendErrorCode === 'PHONE_NOT_ON_WHATSAPP'
      ? 'Ce numéro n\'a pas WhatsApp ou ne peut pas recevoir de messages WhatsApp.'
      : 'Impossible d\'envoyer le code de vérification pour le moment. Réessayez.';
    throw new ValidationError(message);
  }

  res.json({
    success: true,
    message: 'Code envoyé. Veuillez vérifier votre numéro.',
    data: {
      message: 'Code envoyé. Veuillez vérifier votre numéro.',
      otp: {
        message_sent: true,
        provider: 'whatsapp',
        status: sendResult?.status,
        message_id: sendResult?.messageId,
      },
    },
  });
}));

/**
 * POST /api/v1/auth/reset-password
 * Vérifier l'OTP et mettre à jour le mot de passe
 */
router.post('/reset-password', asyncHandler(async (req, res) => {
  const { error, value } = resetPasswordSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const cleanPhone = String(value.phone).replace(/^\+/, '');
  const formattedPhone = `+${cleanPhone}`;

  const { data: user, error: userError } = await dbAdmin
    .from('users')
    .select('id')
    .eq('phone', formattedPhone)
    .single();

  if (userError || !user) {
    throw new ValidationError('Utilisateur introuvable');
  }

  // Option B: reset_token (preferred)
  if (value.reset_token) {
    const tok = await verifyPasswordResetToken(user.id, value.reset_token);
    if (!tok.success) {
      throw new ValidationError(tok.error || 'Token invalide');
    }
  } else {
    // Backward compatibility: allow OTP directly
    const verification = await TwoFactorService.verifyCode(user.id, value.otp_code, 'whatsapp');
    if (!verification.success) {
      throw new ValidationError(verification.error || 'Code invalide');
    }
  }

  const passwordHash = await SecurityService.hashPassword(value.new_password);

  const { error: updateError } = await dbAdmin
    .from('users')
    .update({
      password_hash: passwordHash,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (updateError) {
    logger.error('Reset password: erreur update user', {
      route: '/api/v1/auth/reset-password',
      userId: user.id,
      error: updateError,
    });
    throw new Error('Impossible de réinitialiser le mot de passe');
  }

  res.json({
    success: true,
    message: 'Mot de passe réinitialisé avec succès',
    data: {
      message: 'Mot de passe réinitialisé avec succès',
    },
  });
}));

router.get('/check-phone', asyncHandler(async (req, res) => {
  const { error, value } = checkPhoneSchema.validate(req.query);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const cleanPhone = String(value.phone).replace(/^\+/, '');
  const formattedPhone = `+${cleanPhone}`;
  const maskedPhone = formattedPhone.replace(/\d(?=\d{4})/g, '*');

  let exists = false;
  let user = null;
  try {
    const rows = await appDataSource.query(
      'select id, is_active, is_verified from public.users where phone = $1 limit 1',
      [formattedPhone]
    );
    exists = Array.isArray(rows) && rows.length > 0;
    user = exists ? rows[0] : null;
  } catch (lookupError) {
    logger.error('Erreur check-phone (raw sql)', {
      route: '/api/v1/auth/check-phone',
      error: lookupError?.message,
      maskedPhone,
    });
    throw new Error('Impossible de vérifier le numéro');
  }

  res.json({
    success: true,
    data: {
      exists,
      is_active: user?.is_active ?? null,
      is_verified: user?.is_verified ?? null,
    },
  });
}));

/**
 * POST /api/v1/auth/login
 */
router.post('/login', asyncHandler(async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const rawIdentifier = (value.identifier || value.email || '').trim();
  const { password } = value;

  if (!rawIdentifier) {
    throw new ValidationError('identifier requis');
  }

  const isEmail = rawIdentifier.includes('@');
  const isDisplayId = rawIdentifier.toUpperCase().startsWith('MSB-');

  let lookupColumn;
  let lookupValue;

  if (isEmail) {
    lookupColumn = 'email';
    lookupValue = rawIdentifier.toLowerCase();
  } else if (isDisplayId) {
    lookupColumn = 'user_id_display';
    lookupValue = rawIdentifier.toUpperCase();
  } else {
    lookupColumn = 'phone';
    const cleanPhone = rawIdentifier.replace(/^\+/, '').replace(/\s+/g, '');
    lookupValue = `+${cleanPhone}`;
  }

  const { data: user, error: userError } = await dbAdmin
    .from('users')
    .select('*')
    .eq(lookupColumn, lookupValue)
    .single();

  if (userError || !user) {
    throw new AuthenticationError('Identifiants invalides');
  }

  if (user.is_active === false) {
    throw new AuthenticationError('Compte désactivé');
  }

  const ok = await SecurityService.verifyPassword(password, user.password_hash || '');
  if (!ok) {
    throw new AuthenticationError('Identifiants invalides');
  }

  // 2FA via TOTP si secret présent
  if (user.totp_secret) {
    const pendingToken = SecurityService.generateAccessToken({
      userId: user.id,
      twoFactorPending: true,
    });

    return res.json({
      success: true,
      message: 'Vérification 2FA requise',
      data: {
        requires_2fa: true,
        pending_token: pendingToken,
      },
    });
  }

  const { accessToken, refreshToken } = await issueTokens({ userId: user.id, req });

  setRefreshCookie(res, refreshToken);

  await dbAdmin
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', user.id);

  res.json({
    success: true,
    message: 'Connexion réussie',
    data: {
      user,
      access_token: accessToken,
    },
  });
}));

/**
 * POST /api/v1/auth/login/2fa-verify
 */
router.post('/login/2fa-verify', asyncHandler(async (req, res) => {
  const { error, value } = twoFactorVerifySchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const { pending_token, code } = value;
  const decoded = SecurityService.verifyToken(pending_token);

  if (!decoded?.userId || !decoded?.twoFactorPending) {
    throw new AuthenticationError('Token 2FA invalide');
  }

  const { data: user, error: userError } = await dbAdmin
    .from('users')
    .select('*')
    .eq('id', decoded.userId)
    .single();

  if (userError || !user) {
    throw new AuthenticationError('Compte introuvable');
  }

  if (user.is_active === false) {
    throw new AuthenticationError('Compte désactivé');
  }

  if (!user.totp_secret) {
    throw new AuthenticationError('2FA non configuré');
  }

  const isValid = TwoFactorService.verifyTOTPCode(user.totp_secret, code);
  if (!isValid) {
    throw new AuthenticationError('Code 2FA invalide');
  }

  const { accessToken, refreshToken } = await issueTokens({ userId: user.id, req });

  setRefreshCookie(res, refreshToken);

  await dbAdmin
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', user.id);

  res.json({
    success: true,
    message: 'Connexion réussie',
    data: {
      user,
      access_token: accessToken,
    },
  });
}));

/**
 * POST /api/v1/auth/refresh
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  const { error, value } = refreshSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const refresh_token = value.refresh_token || getCookie(req, REFRESH_COOKIE_NAME);
  if (!refresh_token) {
    throw new ValidationError('"refresh_token" is required');
  }

  const rotation = await refreshTokenService.rotateToken({
    token: refresh_token,
    ip: req.ip,
    userAgent: req.get('User-Agent') || null,
  });

  if (!rotation.ok) {
    throw new AuthenticationError('Refresh token invalide');
  }

  const accessToken = SecurityService.generateAccessToken({ userId: rotation.userId });

  setRefreshCookie(res, rotation.newToken);

  res.json({
    success: true,
    message: 'Token rafraîchi',
    data: {
      access_token: accessToken,
    },
  });
}));

/**
 * POST /api/v1/auth/logout
 */
router.post('/logout', asyncHandler(async (req, res) => {
  const { error, value } = logoutSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const refresh_token = value.refresh_token || getCookie(req, REFRESH_COOKIE_NAME);
  if (!refresh_token) {
    throw new ValidationError('"refresh_token" is required');
  }

  await refreshTokenService.revokeToken({ token: refresh_token });

  clearRefreshCookie(res);

  res.json({
    success: true,
    message: 'Déconnexion réussie',
  });
}));

export default router;

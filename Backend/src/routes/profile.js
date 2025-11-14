/**
 * ROUTES PROFIL UTILISATEUR
 * Gestion des fonctionnalités avancées du profil
 */

import express from 'express';
import Joi from 'joi';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { asyncHandler, ValidationError, AuthenticationError, NotFoundError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import SecurityService from '../services/securityService.js';
import TwoFactorService from '../services/twoFactorService.js';

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

const backpackItemSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).optional(),
  category: Joi.string().valid('achievement', 'reward', 'badge', 'item').required(),
  rarity: Joi.string().valid('common', 'rare', 'epic', 'legendary').default('common'),
  metadata: Joi.object().optional()
});

// =====================================================
// 🔐 ROUTES SÉCURITÉ
// =====================================================

/**
 * GET /api/v1/profile/security
 * Récupérer les paramètres de sécurité
 */
router.get('/security', authenticateToken, asyncHandler(async (req, res) => {
  const { data: user, error } = await supabaseAdmin
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
  const { data: currentUser } = await supabaseAdmin
    .from('users')
    .select('metadata')
    .eq('id', req.user.id)
    .single();

  const currentSettings = currentUser?.metadata?.security_settings || {};
  const newSettings = { ...currentSettings, ...value };

  // Mettre à jour les paramètres
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      metadata: {
        ...currentUser?.metadata,
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
  const enableSchema = Joi.object({
    phone_number: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required(),
    backup_codes: Joi.array().items(Joi.string()).optional()
  });

  const { error, value } = enableSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  // Récupérer les paramètres actuels
  const { data: currentUser } = await supabaseAdmin
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

  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      metadata: {
        ...currentUser?.metadata,
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
  const disableSchema = Joi.object({
    current_password: Joi.string().required(),
    confirmation_code: Joi.string().length(6).optional()
  });

  const { error, value } = disableSchema.validate(req.body);
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
  const { data: currentUser } = await supabaseAdmin
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

  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      metadata: {
        ...currentUser?.metadata,
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
  const sendCodeSchema = Joi.object({
    method: Joi.string().valid('whatsapp').required(),
    phone_number: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required()
  });

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

/**
 * POST /api/v1/profile/security/2fa/generate-qr
 * Générer un QR code pour Authenticator
 */
router.post('/security/2fa/generate-qr', authenticateToken, asyncHandler(async (req, res) => {
  // Récupérer l'email de l'utilisateur
  const { data: user } = await supabaseAdmin
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
  const verifyCodeSchema = Joi.object({
    code: Joi.string().length(6).pattern(/^\d{6}$/).required(),
    method: Joi.string().valid('authenticator', 'whatsapp').required(),
    temp_secret: Joi.string().optional() // Nécessaire pour Authenticator
  });

  const { error, value } = verifyCodeSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  // Vérifier le code (avec secret TOTP si Authenticator)
  const verification = await TwoFactorService.verifyCode(
    req.user.id, 
    value.code, 
    value.method, 
    value.temp_secret
  );
  
  if (!verification.success) {
    throw new ValidationError(verification.error);
  }

  logger.info('Code 2FA vérifié avec succès', { 
    userId: req.user.id, 
    method: value.method
  });

  // Si c'est un setup d'Authenticator, persister le secret TOTP sur l'utilisateur
  if (value.method === 'authenticator' && value.temp_secret) {
    const { error: updateError } = await supabaseAdmin
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
  const setupSchema = Joi.object({
    phone_number: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required(),
    method: Joi.string().valid('sms', 'whatsapp').required(),
    verification_code: Joi.string().length(6).pattern(/^\d{6}$/).required()
  });

  const { error, value } = setupSchema.validate(req.body);
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
  const { data: currentUser } = await supabaseAdmin
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

  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      metadata: {
        ...currentUser?.metadata,
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

/**
 * GET /api/v1/profile/security/sessions
 * Récupérer les sessions actives depuis la base de données
 */
// Fonctions utilitaires pour les sessions
const cleanExpiredSessions = async (userId) => {
  const { error } = await supabaseAdmin
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
  
  // Chercher une session existante pour cet appareil
  const { data: existingSession } = await supabaseAdmin
    .from('user_sessions')
    .select('id')
    .eq('user_id', req.user.id)
    .eq('user_agent', currentUserAgent)
    .eq('is_active', true)
    .single();

  if (!existingSession) {
    // Créer une nouvelle session
    const currentDevice = parseUserAgent(currentUserAgent);
    const currentLocation = await getLocationFromIP(rawIP);
    
    await supabaseAdmin
      .from('user_sessions')
      .insert({
        user_id: req.user.id,
        session_token: generateSessionToken(),
        device_type: 'mobile',
        device_name: currentDevice.device,
        os_name: currentDevice.os.split(' ')[0], // Ex: "iOS" de "iOS 18.0"
        os_version: currentDevice.os.split(' ')[1] || '', // Ex: "18.0" de "iOS 18.0"
        ip_address: currentIP,
        user_agent: currentUserAgent,
        location_country: currentLocation.country,
        location_city: currentLocation.city,
        is_active: true,
        last_activity_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 jours
      });
  } else {
    // Mettre à jour l'activité de la session existante
    await supabaseAdmin
      .from('user_sessions')
      .update({
        last_activity_at: new Date().toISOString(),
        ip_address: currentIP
      })
      .eq('id', existingSession.id);
  }
};

const generateSessionToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

router.get('/security/sessions', authenticateToken, asyncHandler(async (req, res) => {
  // D'abord, créer/mettre à jour la session actuelle si elle n'existe pas
  await ensureCurrentSession(req);
  
  // Nettoyer les sessions expirées
  await cleanExpiredSessions(req.user.id);
  
  // Récupérer les sessions actives depuis la base de données
  const { data: sessions, error } = await supabaseAdmin
    .from('user_sessions')
    .select(`
      id,
      device_type,
      device_name,
      os_name,
      os_version,
      ip_address,
      user_agent,
      location_country,
      location_city,
      is_active,
      last_activity_at,
      created_at
    `)
    .eq('user_id', req.user.id)
    .eq('is_active', true)
    .order('last_activity_at', { ascending: false });

  if (error) {
    logger.error('Erreur récupération sessions', { userId: req.user.id, error });
    throw new ValidationError('Erreur lors de la récupération des sessions');
  }

  // Transformer les sessions pour l'API frontend
  const transformedSessions = sessions?.map((session, index) => {
    // Localisation honnête et précise
    let location = 'Localisation inconnue';
    if (session.location_country === 'UNKNOWN') {
      location = session.location_city || 'Localisation inconnue';
    } else if (session.location_city && session.location_country) {
      location = `${session.location_city}, ${session.location_country}`;
    } else if (session.location_country) {
      location = session.location_country;
    }
    
    const device = session.device_name || session.device_type || 'Appareil inconnu';
    const os = session.os_version ? 
      `${session.os_name} ${session.os_version}` : 
      session.os_name || 'OS inconnu';

    return {
      id: session.id,
      device: device,
      location: location,
      ip_address: session.ip_address,
      last_active: session.last_activity_at,
      is_current: index === 0, // La première session (plus récente) est considérée comme actuelle
      user_agent: session.user_agent,
      os: os
    };
  }) || [];

  console.log('🔍 Sessions récupérées depuis la BD:', {
    userId: req.user.id,
    sessionsCount: transformedSessions.length,
    sessions: transformedSessions
  });

  res.json({
    success: true,
    message: 'Sessions actives récupérées',
    data: {
      sessions: transformedSessions,
      total_sessions: transformedSessions.length,
      active_sessions: transformedSessions.filter(s => s.is_current).length
    }
  });
}));

// Fonction pour parser le User-Agent
const parseUserAgent = (userAgent) => {
    if (!userAgent) return { device: 'Appareil inconnu', os: 'OS inconnu' };
    
    // Détection Expo Go avec Darwin (macOS/iOS)
    if (userAgent.includes('Expo')) {
      // Expo sur Darwin (iOS/macOS)
      if (userAgent.includes('Darwin')) {
        const darwinMatch = userAgent.match(/Darwin\/(\d+\.\d+\.\d+)/);
        const darwinVersion = darwinMatch ? darwinMatch[1] : 'inconnu';
        
        // Note: Expo Go ne permet pas d'obtenir la vraie version iOS
        // Darwin version ne correspond pas exactement à la version iOS de l'utilisateur
        const darwinMajor = parseInt(darwinVersion.split('.')[0]);
        
        return { 
          device: 'iPhone (Expo Go)', 
          os: 'iOS' // Expo Go ne permet pas d'obtenir la vraie version iOS
        };
      }
      
      // Expo sur Android
      if (userAgent.includes('Android')) {
        const androidMatch = userAgent.match(/Android (\d+\.?\d*)/);
        const version = androidMatch ? androidMatch[1] : 'inconnu';
        return { device: 'Android (Expo Go)', os: `Android ${version}` };
      }
      
      return { device: 'Expo Go', os: 'Mobile' };
    }
    
    // Détection iOS
    if (userAgent.includes('iPhone')) {
      const iosMatch = userAgent.match(/iPhone.*?OS (\d+_\d+)/);
      const version = iosMatch ? iosMatch[1].replace('_', '.') : 'inconnu';
      return { device: 'iPhone', os: `iOS ${version}` };
    }
    
    // Détection iPad
    if (userAgent.includes('iPad')) {
      const iosMatch = userAgent.match(/OS (\d+_\d+)/);
      const version = iosMatch ? iosMatch[1].replace('_', '.') : 'inconnu';
      return { device: 'iPad', os: `iPadOS ${version}` };
    }
    
    // Détection Android
    if (userAgent.includes('Android')) {
      const androidMatch = userAgent.match(/Android (\d+\.?\d*)/);
      const version = androidMatch ? androidMatch[1] : 'inconnu';
      return { device: 'Android', os: `Android ${version}` };
    }
    
    // Détection Windows
    if (userAgent.includes('Windows')) {
      if (userAgent.includes('Chrome')) return { device: 'Chrome sur Windows', os: 'Windows' };
      if (userAgent.includes('Firefox')) return { device: 'Firefox sur Windows', os: 'Windows' };
      if (userAgent.includes('Safari')) return { device: 'Safari sur Windows', os: 'Windows' };
      return { device: 'Windows', os: 'Windows' };
    }
    
    // Détection macOS
    if (userAgent.includes('Macintosh')) {
      if (userAgent.includes('Chrome')) return { device: 'Chrome sur Mac', os: 'macOS' };
      if (userAgent.includes('Firefox')) return { device: 'Firefox sur Mac', os: 'macOS' };
      if (userAgent.includes('Safari')) return { device: 'Safari sur Mac', os: 'macOS' };
      return { device: 'Mac', os: 'macOS' };
    }
    
    return { device: 'Appareil inconnu', os: 'OS inconnu' };
  };

  // Fonction pour nettoyer l'IP (convertir IPv6 mappé vers IPv4)
  const cleanIP = (ip) => {
    if (!ip) return 'IP inconnue';
    
    // Convertir IPv6 mappé vers IPv4
    if (ip.startsWith('::ffff:')) {
      return ip.substring(7); // Enlever le préfixe ::ffff:
    }
    
    return ip;
  };

  // Fonction pour obtenir la localisation réelle depuis l'IP
  const getLocationFromIP = async (ip) => {
    const cleanedIP = cleanIP(ip);
    
    // Pour les IP privées, essayons d'obtenir l'IP publique du routeur
    if (cleanedIP.startsWith('192.168.') || cleanedIP.startsWith('10.') || cleanedIP.startsWith('172.')) {
      try {
        // Obtenir l'IP publique du routeur
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        const publicIP = data.ip;
        
        console.log(`🌍 IP privée détectée (${cleanedIP}), utilisation IP publique: ${publicIP}`);
        
        // Géolocaliser l'IP publique
        const geoResponse = await fetch(`http://ip-api.com/json/${publicIP}?fields=status,country,countryCode,city,regionName,query`);
        const geoData = await geoResponse.json();
        
        if (geoData.status === 'success') {
          return {
            country: geoData.countryCode,
            city: geoData.city,
            display: `${geoData.city}, ${geoData.regionName}, ${geoData.country}`
          };
        }
      } catch (error) {
        console.log('Erreur géolocalisation IP publique:', error.message);
      }
      
      // Fallback pour IP privée
      return {
        country: 'UNKNOWN',
        city: 'Réseau Privé',
        display: 'Réseau Privé (localisation non disponible)'
      };
    }
    
    // Détection localhost
    if (cleanedIP === '127.0.0.1' || cleanedIP === 'localhost') {
      return {
        country: 'UNKNOWN',
        city: 'Localhost',
        display: 'Localhost'
      };
    }
    
    // Pour les IP publiques directes
    try {
      const response = await fetch(`http://ip-api.com/json/${cleanedIP}?fields=status,country,countryCode,city,regionName,query`);
      const data = await response.json();
      
      if (data.status === 'success') {
        return {
          country: data.countryCode,
          city: data.city,
          display: `${data.city}, ${data.regionName}, ${data.country}`
        };
      }
    } catch (error) {
      console.log('Erreur géolocalisation IP:', error.message);
    }
    
    // Fallback si la géolocalisation échoue
    return {
      country: 'UNKNOWN',
      city: 'Localisation inconnue',
      display: 'Localisation inconnue'
    };
  };

/**
 * DELETE /api/v1/profile/security/sessions/:sessionId
 * Supprimer une session spécifique depuis la base de données
 */
router.delete('/security/sessions/:sessionId', authenticateToken, asyncHandler(async (req, res) => {
  const sessionId = req.params.sessionId;

  // Valider l'UUID
  if (!sessionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
    throw new ValidationError('ID de session invalide');
  }

  // Vérifier que la session appartient à l'utilisateur
  const { data: existingSession } = await supabaseAdmin
    .from('user_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', req.user.id)
    .single();

  if (!existingSession) {
    throw new ValidationError('Session non trouvée');
  }

  // Désactiver la session
  const { error: updateError } = await supabaseAdmin
    .from('user_sessions')
    .update({
      is_active: false,
      last_activity_at: new Date().toISOString()
    })
    .eq('id', sessionId)
    .eq('user_id', req.user.id);

  if (updateError) {
    logger.error('Erreur suppression session', { 
      userId: req.user.id, 
      sessionId,
      error: updateError 
    });
    throw new ValidationError('Erreur lors de la suppression de la session');
  }

  logger.info('Session supprimée', { 
    userId: req.user.id, 
    sessionId,
    ip: req.ip 
  });

  res.json({
    success: true,
    message: 'Session supprimée avec succès'
  });
}));

/**
 * DELETE /api/v1/profile/security/sessions
 * Supprimer toutes les autres sessions (sauf la session actuelle)
 */
router.delete('/security/sessions', authenticateToken, asyncHandler(async (req, res) => {
  // Obtenir l'User-Agent de la session actuelle pour l'identifier
  const currentUserAgent = req.headers['user-agent'] || '';
  
  // Désactiver toutes les sessions SAUF la session actuelle
  const { data: terminatedSessions, error: updateError } = await supabaseAdmin
    .from('user_sessions')
    .update({
      is_active: false,
      last_activity_at: new Date().toISOString()
    })
    .eq('user_id', req.user.id)
    .eq('is_active', true)
    .neq('user_agent', currentUserAgent) // Exclure la session actuelle
    .select();

  if (updateError) {
    logger.error('Erreur suppression toutes sessions', { 
      userId: req.user.id, 
      error: updateError 
    });
    throw new ValidationError('Erreur lors de la suppression des sessions');
  }

  const terminatedCount = terminatedSessions?.length || 0;

  logger.info('Toutes les autres sessions supprimées', { 
    userId: req.user.id,
    terminatedCount,
    ip: req.ip 
  });

  res.json({
    success: true,
    message: `${terminatedCount} session(s) supprimée(s) avec succès`,
    data: {
      terminated_count: terminatedCount
    }
  });
}));

// =====================================================
// 🎒 ROUTES SAC À DOS (BACKPACK)
// =====================================================

/**
 * GET /api/v1/profile/backpack
 * Récupérer le contenu du sac à dos
 */
router.get('/backpack', authenticateToken, asyncHandler(async (req, res) => {
  // Récupérer les vraies données du sac à dos
  const { data: backpackItems, error } = await supabaseAdmin
    .from('user_backpack')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Erreur récupération sac à dos', { 
      userId: req.user.id, 
      error 
    });
    throw new ValidationError('Erreur lors de la récupération du sac à dos');
  }

  // Grouper par catégorie
  const itemsByCategory = (backpackItems || []).reduce((acc, item) => {
    const category = item.category || 'item';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  res.json({
    success: true,
    message: 'Sac à dos récupéré',
    data: {
      items: backpackItems || [],
      items_by_category: itemsByCategory,
      total_items: backpackItems?.length || 0,
      categories: Object.keys(itemsByCategory)
    }
  });
}));

/**
 * POST /api/v1/profile/backpack/items
 * Ajouter un item au sac à dos
 */
router.post('/backpack/items', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = backpackItemSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { name, description, category, rarity, metadata } = value;

  // Ajouter l'item
  const { data: newItem, error: insertError } = await supabaseAdmin
    .from('user_backpack')
    .insert({
      user_id: req.user.id,
      name,
      description,
      category,
      rarity,
      metadata: metadata || {},
      obtained_at: new Date().toISOString()
    })
    .select()
    .single();

  if (insertError) {
    logger.error('Erreur ajout item sac à dos', { 
      userId: req.user.id, 
      error: insertError 
    });
    throw new ValidationError('Erreur lors de l\'ajout de l\'item');
  }

  res.json({
    success: true,
    message: 'Item ajouté au sac à dos',
    data: {
      item: newItem
    }
  });
}));

/**
 * DELETE /api/v1/profile/backpack/items/:itemId
 * Supprimer un item du sac à dos
 */
router.delete('/backpack/items/:itemId', authenticateToken, asyncHandler(async (req, res) => {
  const itemId = req.params.itemId;

  // Simuler la suppression
  if (!itemId || itemId === '0') {
    throw new NotFoundError('Item non trouvé');
  }

  logger.info('Item supprimé du sac à dos', { 
    userId: req.user.id, 
    itemId 
  });

  res.json({
    success: true,
    message: 'Item supprimé du sac à dos'
  });
}));

/**
 * PUT /api/v1/profile/backpack/items/:itemId
 * Modifier un item du sac à dos
 */
router.put('/backpack/items/:itemId', authenticateToken, asyncHandler(async (req, res) => {
  const itemId = req.params.itemId;
  
  const updateSchema = Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    description: Joi.string().max(500).optional(),
    category: Joi.string().valid('achievement', 'reward', 'badge', 'item').optional(),
    rarity: Joi.string().valid('common', 'rare', 'epic', 'legendary').optional()
  });

  const { error, value } = updateSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  // Simuler la mise à jour
  const updatedItem = {
    id: itemId,
    ...value,
    updated_at: new Date().toISOString()
  };

  logger.info('Item mis à jour dans le sac à dos', { 
    userId: req.user.id, 
    itemId,
    changes: value 
  });

  res.json({
    success: true,
    message: 'Item mis à jour',
    data: {
      item: updatedItem
    }
  });
}));

/**
 * POST /api/v1/profile/backpack/use/:itemId
 * Utiliser un item du sac à dos
 */
router.post('/backpack/use/:itemId', authenticateToken, asyncHandler(async (req, res) => {
  const itemId = req.params.itemId;

  // Simuler l'utilisation d'un item
  const effects = {
    '1': { type: 'points', amount: 50, description: 'Vous avez gagné 50 points bonus !' },
    '2': { type: 'level_boost', amount: 1, description: 'Votre niveau a été boosté !' }
  };

  const effect = effects[itemId];
  if (!effect) {
    throw new NotFoundError('Item non trouvé ou non utilisable');
  }

  logger.info('Item utilisé', { 
    userId: req.user.id, 
    itemId,
    effect 
  });

  res.json({
    success: true,
    message: 'Item utilisé avec succès',
    data: {
      effect,
      item_consumed: true
    }
  });
}));

/**
 * GET /api/v1/profile/backpack/categories
 * Récupérer les catégories d'items disponibles
 */
router.get('/backpack/categories', authenticateToken, asyncHandler(async (req, res) => {
  const categories = [
    {
      id: 'achievement',
      name: 'Succès',
      description: 'Récompenses pour vos accomplissements',
      icon: '🏆',
      color: '#FFD700'
    },
    {
      id: 'reward',
      name: 'Récompenses',
      description: 'Items obtenus via des actions',
      icon: '🎁',
      color: '#FF6B6B'
    },
    {
      id: 'badge',
      name: 'Badges',
      description: 'Distinctions spéciales',
      icon: '🏅',
      color: '#4ECDC4'
    },
    {
      id: 'item',
      name: 'Objets',
      description: 'Items utilisables',
      icon: '📦',
      color: '#45B7D1'
    }
  ];

  res.json({
    success: true,
    message: 'Catégories récupérées',
    data: {
      categories
    }
  });
}));

/**
 * GET /api/v1/profile/backpack/stats
 * Récupérer les statistiques du sac à dos
 */
router.get('/backpack/stats', authenticateToken, asyncHandler(async (req, res) => {
  const stats = {
    total_items: 2,
    items_by_rarity: {
      common: 2,
      rare: 0,
      epic: 0,
      legendary: 0
    },
    items_by_category: {
      achievement: 1,
      reward: 1,
      badge: 0,
      item: 0
    },
    total_value: 150, // Valeur estimée en points
    collection_progress: 15 // Pourcentage de collection complète
  };

  res.json({
    success: true,
    message: 'Statistiques du sac à dos récupérées',
    data: {
      stats
    }
  });
}));

// =====================================================
// 📊 ROUTES NIVEAU ET PROGRESSION
// =====================================================

/**
 * GET /api/v1/profile/level
 * Récupérer les informations de niveau détaillées
 */
router.get('/level', authenticateToken, asyncHandler(async (req, res) => {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('points, user_level, created_at, metadata')
    .eq('id', req.user.id)
    .single();

  if (error) {
    logger.error('Erreur récupération niveau', { 
      userId: req.user.id, 
      error 
    });
    throw new ValidationError('Erreur lors de la récupération du niveau');
  }

  // Système de niveaux détaillé
  const levels = {
    'Bronze': { min: 0, max: 500, color: '#CD7F32', benefits: ['Accès de base', 'Support standard'] },
    'Silver': { min: 500, max: 1000, color: '#C0C0C0', benefits: ['Réductions 5%', 'Support prioritaire'] },
    'Gold': { min: 1000, max: 2000, color: '#FFD700', benefits: ['Réductions 10%', 'Accès VIP', 'Support premium'] },
    'Diamond': { min: 2000, max: 5000, color: '#B9F2FF', benefits: ['Réductions 15%', 'Accès exclusif', 'Manager dédié'] },
    'Platinum': { min: 5000, max: 10000, color: '#E5E4E2', benefits: ['Réductions 20%', 'Services premium', 'Invitations spéciales'] }
  };

  const currentLevel = user.user_level || 'Bronze';
  const currentLevelInfo = levels[currentLevel];
  const nextLevelName = Object.keys(levels).find(level => 
    levels[level].min > currentLevelInfo.max
  );

  const progress = currentLevelInfo ? 
    ((user.points - currentLevelInfo.min) / (currentLevelInfo.max - currentLevelInfo.min)) * 100 : 0;

  // Récupérer l'historique des points
  const { data: pointsHistory } = await supabaseAdmin
    .from('user_points_history')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  res.json({
    success: true,
    message: 'Informations de niveau récupérées',
    data: {
      current_level: {
        name: currentLevel,
        points_range: currentLevelInfo,
        color: currentLevelInfo.color,
        benefits: currentLevelInfo.benefits
      },
      next_level: nextLevelName ? {
        name: nextLevelName,
        points_range: levels[nextLevelName],
        color: levels[nextLevelName].color,
        benefits: levels[nextLevelName].benefits
      } : null,
      progression: {
        current_points: user.points,
        progress_percentage: Math.round(progress),
        points_to_next_level: nextLevelName ? currentLevelInfo.max - user.points : 0
      },
      recent_activity: pointsHistory || [],
      account_age_days: Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24))
    }
  });
}));

/**
 * POST /api/v1/profile/points/add
 * Ajouter des points (pour les actions système)
 */
router.post('/points/add', authenticateToken, asyncHandler(async (req, res) => {
  const addPointsSchema = Joi.object({
    points: Joi.number().integer().min(1).max(1000).required(),
    reason: Joi.string().min(3).max(100).required(),
    category: Joi.string().valid('login', 'purchase', 'referral', 'achievement', 'bonus').required()
  });

  const { error, value } = addPointsSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { points, reason, category } = value;

  // Récupérer les points actuels
  const { data: currentUser } = await supabaseAdmin
    .from('users')
    .select('points, user_level')
    .eq('id', req.user.id)
    .single();

  const newPoints = (currentUser?.points || 0) + points;

  // Calculer le nouveau niveau
  const levels = {
    'Bronze': { min: 0, max: 500 },
    'Silver': { min: 500, max: 1000 },
    'Gold': { min: 1000, max: 2000 },
    'Diamond': { min: 2000, max: 5000 },
    'Platinum': { min: 5000, max: 10000 }
  };

  let newLevel = 'Bronze';
  for (const [levelName, levelInfo] of Object.entries(levels)) {
    if (newPoints >= levelInfo.min && newPoints < levelInfo.max) {
      newLevel = levelName;
      break;
    }
  }

  // Mettre à jour les points et le niveau
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      points: newPoints,
      user_level: newLevel,
      updated_at: new Date().toISOString()
    })
    .eq('id', req.user.id);

  if (updateError) {
    logger.error('Erreur ajout points', { 
      userId: req.user.id, 
      error: updateError 
    });
    throw new ValidationError('Erreur lors de l\'ajout des points');
  }

  // Enregistrer l'historique
  await supabaseAdmin
    .from('user_points_history')
    .insert({
      user_id: req.user.id,
      points_change: points,
      reason,
      category,
      points_before: currentUser?.points || 0,
      points_after: newPoints,
      created_at: new Date().toISOString()
    });

  const levelChanged = newLevel !== currentUser?.user_level;

  res.json({
    success: true,
    message: `${points} points ajoutés${levelChanged ? ` - Niveau ${newLevel} atteint !` : ''}`,
    data: {
      points_added: points,
      total_points: newPoints,
      previous_level: currentUser?.user_level,
      current_level: newLevel,
      level_changed: levelChanged
    }
  });
}));

// =====================================================
// 🔔 ROUTES PARAMÈTRES NOTIFICATIONS
// =====================================================

/**
 * GET /api/v1/profile/settings/notifications
 * Récupérer les paramètres de notifications
 */
router.get('/settings/notifications', authenticateToken, asyncHandler(async (req, res) => {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('metadata')
    .eq('id', req.user.id)
    .single();

  if (error) {
    throw new ValidationError('Erreur lors de la récupération des paramètres');
  }

  const notificationSettings = user.metadata?.notification_settings || {
    push_notifications: true,
    email_notifications: false,
    sms_notifications: true,
    sound_enabled: true,
    vibration_enabled: true,
    marketing_notifications: false,
    transaction_notifications: true,
    security_notifications: true
  };

  res.json({
    success: true,
    message: 'Paramètres de notifications récupérés',
    data: {
      notification_settings: notificationSettings
    }
  });
}));

/**
 * PUT /api/v1/profile/settings/notifications
 * Mettre à jour les paramètres de notifications
 */
router.put('/settings/notifications', authenticateToken, asyncHandler(async (req, res) => {
  const notificationSchema = Joi.object({
    push_notifications: Joi.boolean().optional(),
    email_notifications: Joi.boolean().optional(),
    sms_notifications: Joi.boolean().optional(),
    sound_enabled: Joi.boolean().optional(),
    vibration_enabled: Joi.boolean().optional(),
    marketing_notifications: Joi.boolean().optional(),
    transaction_notifications: Joi.boolean().optional(),
    security_notifications: Joi.boolean().optional()
  });

  const { error, value } = notificationSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  // Récupérer les paramètres actuels
  const { data: currentUser } = await supabaseAdmin
    .from('users')
    .select('metadata')
    .eq('id', req.user.id)
    .single();

  const currentSettings = currentUser?.metadata?.notification_settings || {};
  const newSettings = { ...currentSettings, ...value };

  // Mettre à jour
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      metadata: {
        ...currentUser?.metadata,
        notification_settings: newSettings,
        notifications_updated_at: new Date().toISOString()
      }
    })
    .eq('id', req.user.id);

  if (updateError) {
    throw new ValidationError('Erreur lors de la mise à jour des paramètres');
  }

  logger.info('Paramètres de notifications mis à jour', { 
    userId: req.user.id,
    changes: value
  });

  res.json({
    success: true,
    message: 'Paramètres de notifications mis à jour',
    data: {
      notification_settings: newSettings
    }
  });
}));

// =====================================================
// 🌍 ROUTES PARAMÈTRES GÉNÉRAUX
// =====================================================

/**
 * GET /api/v1/profile/settings/general
 * Récupérer les paramètres généraux
 */
router.get('/settings/general', authenticateToken, asyncHandler(async (req, res) => {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('metadata')
    .eq('id', req.user.id)
    .single();

  if (error) {
    throw new ValidationError('Erreur lors de la récupération des paramètres');
  }

  const generalSettings = user.metadata?.general_settings || {
    language: 'fr',
    currency: 'CDF',
    timezone: 'Africa/Kinshasa',
    theme: 'auto',
    auto_backup: true,
    data_saver: false
  };

  res.json({
    success: true,
    message: 'Paramètres généraux récupérés',
    data: {
      general_settings: generalSettings,
      available_languages: [
        { code: 'fr', name: 'Français', flag: '🇫🇷' },
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'ln', name: 'Lingala', flag: '🇨🇩' }
      ],
      available_currencies: [
        { code: 'CDF', name: 'Franc Congolais', symbol: 'FC' },
        { code: 'USD', name: 'Dollar US', symbol: '$' },
        { code: 'EUR', name: 'Euro', symbol: '€' }
      ]
    }
  });
}));

/**
 * PUT /api/v1/profile/settings/general
 * Mettre à jour les paramètres généraux
 */
router.put('/settings/general', authenticateToken, asyncHandler(async (req, res) => {
  const generalSchema = Joi.object({
    language: Joi.string().valid('fr', 'en', 'ln').optional(),
    currency: Joi.string().valid('CDF', 'USD', 'EUR').optional(),
    timezone: Joi.string().optional(),
    theme: Joi.string().valid('light', 'dark', 'auto').optional(),
    auto_backup: Joi.boolean().optional(),
    data_saver: Joi.boolean().optional()
  });

  const { error, value } = generalSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  // Récupérer les paramètres actuels
  const { data: currentUser } = await supabaseAdmin
    .from('users')
    .select('metadata')
    .eq('id', req.user.id)
    .single();

  const currentSettings = currentUser?.metadata?.general_settings || {};
  const newSettings = { ...currentSettings, ...value };

  // Mettre à jour
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      metadata: {
        ...currentUser?.metadata,
        general_settings: newSettings,
        settings_updated_at: new Date().toISOString()
      }
    })
    .eq('id', req.user.id);

  if (updateError) {
    throw new ValidationError('Erreur lors de la mise à jour des paramètres');
  }

  logger.info('Paramètres généraux mis à jour', { 
    userId: req.user.id,
    changes: value
  });

  res.json({
    success: true,
    message: 'Paramètres généraux mis à jour',
    data: {
      general_settings: newSettings
    }
  });
}));

// =====================================================
// 🔒 ROUTES CONFIDENTIALITÉ
// =====================================================

/**
 * GET /api/v1/profile/privacy
 * Récupérer les paramètres de confidentialité
 */
router.get('/privacy', authenticateToken, asyncHandler(async (req, res) => {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('metadata, created_at, last_login_at')
    .eq('id', req.user.id)
    .single();

  if (error) {
    throw new ValidationError('Erreur lors de la récupération des données');
  }

  const privacySettings = user.metadata?.privacy_settings || {
    profile_visibility: 'public',
    show_online_status: true,
    allow_friend_requests: true,
    data_collection: true,
    analytics_tracking: true
  };

  // Simuler les données collectées
  const dataCollected = {
    personal_data: {
      profile_info: true,
      contact_info: true,
      preferences: true
    },
    usage_data: {
      app_interactions: true,
      feature_usage: true,
      performance_data: true
    },
    device_data: {
      device_info: true,
      location_data: false,
      camera_access: false
    }
  };

  res.json({
    success: true,
    message: 'Paramètres de confidentialité récupérés',
    data: {
      privacy_settings: privacySettings,
      data_collected: dataCollected,
      account_created: user.created_at,
      last_data_export: null,
      data_retention_days: 365
    }
  });
}));

/**
 * PUT /api/v1/profile/privacy
 * Mettre à jour les paramètres de confidentialité
 */
router.put('/privacy', authenticateToken, asyncHandler(async (req, res) => {
  const privacySchema = Joi.object({
    profile_visibility: Joi.string().valid('public', 'friends', 'private').optional(),
    show_online_status: Joi.boolean().optional(),
    allow_friend_requests: Joi.boolean().optional(),
    data_collection: Joi.boolean().optional(),
    analytics_tracking: Joi.boolean().optional()
  });

  const { error, value } = privacySchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  // Récupérer les paramètres actuels
  const { data: currentUser } = await supabaseAdmin
    .from('users')
    .select('metadata')
    .eq('id', req.user.id)
    .single();

  const currentSettings = currentUser?.metadata?.privacy_settings || {};
  const newSettings = { ...currentSettings, ...value };

  // Mettre à jour
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      metadata: {
        ...currentUser?.metadata,
        privacy_settings: newSettings,
        privacy_updated_at: new Date().toISOString()
      }
    })
    .eq('id', req.user.id);

  if (updateError) {
    throw new ValidationError('Erreur lors de la mise à jour des paramètres');
  }

  logger.info('Paramètres de confidentialité mis à jour', { 
    userId: req.user.id,
    changes: value
  });

  res.json({
    success: true,
    message: 'Paramètres de confidentialité mis à jour',
    data: {
      privacy_settings: newSettings
    }
  });
}));

/**
 * POST /api/v1/profile/privacy/export-data
 * Exporter les données utilisateur
 */
router.post('/privacy/export-data', authenticateToken, asyncHandler(async (req, res) => {
  // Simuler l'export des données
  const exportData = {
    user_profile: {
      id: req.user.id,
      email: req.user.email,
      phone: req.user.phone,
      full_name: req.user.full_name,
      user_id_display: req.user.user_id_display
    },
    account_activity: {
      created_at: req.user.created_at,
      last_login_at: req.user.last_login_at,
      total_logins: 25,
      total_transactions: 10
    },
    settings: req.user.metadata || {}
  };

  logger.info('Export de données demandé', { userId: req.user.id });

  res.json({
    success: true,
    message: 'Export des données généré',
    data: {
      export_id: `export_${Date.now()}`,
      generated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      download_url: `https://api.mossombi.com/exports/export_${Date.now()}.json`,
      data: exportData
    }
  });
}));

/**
 * DELETE /api/v1/profile/privacy/delete-account
 * Supprimer le compte utilisateur
 */
router.delete('/privacy/delete-account', authenticateToken, asyncHandler(async (req, res) => {
  const deleteSchema = Joi.object({
    password: Joi.string().required(),
    confirmation: Joi.string().valid('DELETE_MY_ACCOUNT').required(),
    reason: Joi.string().max(500).optional()
  });

  const { error, value } = deleteSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  // Vérifier le mot de passe
  const currentPasswordHash = req.user.password_hash;
  const isPasswordValid = await SecurityService.verifyPassword(value.password, currentPasswordHash);
  
  if (!isPasswordValid) {
    throw new AuthenticationError('Mot de passe incorrect');
  }

  // Marquer le compte pour suppression (soft delete)
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      is_active: false,
      metadata: {
        ...req.user.metadata,
        deletion_reason: value.reason,
        deletion_requested_at: new Date().toISOString(),
        deleted_at: new Date().toISOString()
      }
    })
    .eq('id', req.user.id);

  if (updateError) {
    throw new ValidationError('Erreur lors de la suppression du compte');
  }

  logger.warn('Compte supprimé', { 
    userId: req.user.id,
    reason: value.reason
  });

  res.json({
    success: true,
    message: 'Compte supprimé avec succès',
    data: {
      deleted_at: new Date().toISOString(),
      recovery_period_days: 30
    }
  });
}));

export default router;

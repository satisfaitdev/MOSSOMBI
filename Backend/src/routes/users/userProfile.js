/**
 * ROUTES PROFIL UTILISATEUR
 * Gestion du profil personnel et préférences
 */

import express from 'express';
import Joi from 'joi';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import { dbAdmin } from '../../config/db.js';
import { asyncHandler, ValidationError, NotFoundError, ConflictError } from '../../middleware/errorHandler.js';
import { authenticateToken, requireVerification, logUserAction } from '../../middleware/auth.js';
import { logger, logUserAction as logAction } from '../../utils/logger.js';
import { refreshTokenService } from '../../services/refreshTokenService.js';

const router = express.Router();

// =====================================================
// 📁 CONFIGURATION MULTER POUR UPLOAD
// =====================================================

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,pdf').split(',');
    const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new ValidationError(`Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`));
    }
  }
});

// =====================================================
// 📋 SCHÉMAS DE VALIDATION
// =====================================================

const updateProfileSchema = Joi.object({
  full_name: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Le nom doit contenir au moins 2 caractères',
      'string.max': 'Le nom ne peut pas dépasser 100 caractères'
    }),
  email: Joi.string()
    .email()
    .optional()
    .allow('')
    .messages({
      'string.email': 'Format d\'email invalide'
    }),
  date_of_birth: Joi.date()
    .max('now')
    .optional()
    .messages({
      'date.max': 'La date de naissance ne peut pas être dans le futur'
    }),
  address: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'L\'adresse ne peut pas dépasser 500 caractères'
    }),
  gender: Joi.string()
    .valid('male', 'female', 'other')
    .optional()
    .messages({
      'any.only': 'Le genre doit être: male, female, ou other'
    }),
  country_code: Joi.string()
    .length(2)
    .optional()
    .messages({
      'string.length': 'Le code pays doit contenir 2 caractères'
    })
});

const updatePreferencesSchema = Joi.object({
  theme: Joi.string()
    .valid('light', 'dark', 'system')
    .optional(),
  language: Joi.string()
    .valid('fr', 'en', 'sw')
    .optional(),
  notifications: Joi.object({
    push_enabled: Joi.boolean().optional(),
    email_enabled: Joi.boolean().optional(),
    sms_enabled: Joi.boolean().optional(),
    marketing_enabled: Joi.boolean().optional()
  }).optional(),
  privacy: Joi.object({
    profile_visibility: Joi.string()
      .valid('public', 'friends', 'private')
      .default('public'),
    show_online_status: Joi.boolean().default(true),
    show_last_seen: Joi.boolean().default(true),
    allow_friend_requests: Joi.boolean().default(true),
    allow_messages: Joi.string()
      .valid('everyone', 'friends', 'none')
      .default('everyone')
  }).optional()
}).optional();

const onboardingSchema = Joi.object({
  completed: Joi.boolean().optional(),
  skipped: Joi.boolean().optional(),
  preferred_services: Joi.array().items(Joi.string().min(1)).max(50).optional(),
  language: Joi.string().valid('fr', 'en', 'sw').optional(),
  acquisition_source: Joi.string().max(120).optional().allow(''),
  invite_code: Joi.string().max(80).optional().allow(''),
}).min(1);

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

// =====================================================
// 🔐 ROUTES PROFIL UTILISATEUR
// =====================================================

/**
 * GET /api/v1/users/profile
 * Obtenir le profil complet de l'utilisateur
 */
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const { data: user, error } = await dbAdmin
    .from('users')
    .select(`
      id,
      user_id_display,
      email,
      phone,
      full_name,
      avatar_url,
      date_of_birth,
      address,
      country_code,
      user_level,
      role,
      is_super_admin,
      points,
      is_verified,
      is_active,
      kyc_status,
      created_at,
      updated_at,
      metadata,
      preferences
    `)
    .eq('id', req.user.id)
    .single();

  if (error) {
    logger.error('Erreur récupération profil utilisateur:', { userId: req.user.id, error });
    throw new ValidationError('Erreur lors de la récupération du profil');
  }

  if (!user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  const profile = {
    id: user.id,
    user_id_display: user.user_id_display,
    email: user.email,
    phone: user.phone,
    full_name: user.full_name,
    avatar_url: user.avatar_url,
    date_of_birth: user.date_of_birth,
    address: user.address,
    country_code: user.country_code,
    user_level: user.user_level,
    role: user.role,
    is_super_admin: user.is_super_admin,
    points: user.points,
    is_verified: user.is_verified,
    is_active: user.is_active,
    kyc_status: user.kyc_status,
    created_at: user.created_at,
    updated_at: user.updated_at,
    preferences: user.metadata?.preferences || user.preferences || {},
    stats: user.metadata?.stats || {}
  };

  res.json({
    success: true,
    message: 'Profil utilisateur récupéré',
    data: profile
  });
}));

/**
 * PUT /api/v1/users/profile
 * Mettre à jour le profil de l'utilisateur
 */
router.put('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = updateProfileSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  // Vérifier si l'email est déjà utilisé par un autre utilisateur
  if (value.email) {
    const { data: existingUser } = await dbAdmin
      .from('users')
      .select('id, email')
      .neq('email', value.email)
      .neq('id', req.user.id)
      .single();

    if (existingUser) {
      throw new ConflictError('Cet email est déjà utilisé par un autre utilisateur');
    }
  }

  // Mettre à jour le profil
  const { data: updatedUser, error: updateError } = await dbAdmin
    .from('users')
    .update({
      full_name: value.full_name,
      email: value.email,
      date_of_birth: value.date_of_birth,
      address: value.address,
      gender: value.gender,
      country_code: value.country_code,
      updated_at: new Date().toISOString()
    })
    .eq('id', req.user.id)
    .select('id, full_name, email, date_of_birth, address, gender, country_code, updated_at')
    .single();

  if (updateError) {
    logger.error('Erreur mise à jour profil utilisateur:', { 
      userId: req.user.id, 
      error: updateError 
    });
    throw new ValidationError('Erreur lors de la mise à jour du profil');
  }

  logger.info('Profil utilisateur mis à jour', { 
    userId: req.user.id,
    updatedFields: Object.keys(value)
  });

  res.json({
    success: true,
    message: 'Profil mis à jour',
    data: updatedUser
  });
}));

/**
 * PUT /api/v1/users/preferences
 * Mettre à jour les préférences de l'utilisateur
 */
router.put('/preferences', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = updatePreferencesSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  // Récupérer les préférences actuelles
  const { data: currentUser } = await dbAdmin
    .from('users')
    .select('metadata')
    .eq('id', req.user.id)
    .single();

  const currentPreferences = currentUser?.metadata?.preferences || {};

  // Fusionner les nouvelles préférences
  const newPreferences = { ...currentPreferences, ...value };

  // Mettre à jour les préférences
  const { error: updateError } = await dbAdmin
    .from('users')
    .update({
      metadata: {
        ...currentUser.metadata,
        preferences: newPreferences,
        preferences_updated_at: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    })
    .eq('id', req.user.id);

  if (updateError) {
    logger.error('Erreur mise à jour préférences:', { 
      userId: req.user.id, 
      error: updateError 
    });
    throw new ValidationError('Erreur lors de la mise à jour des préférences');
  }

  logger.info('Préférences utilisateur mis à jour', { 
    userId: req.user.id,
    updatedPreferences: Object.keys(value)
  });

  res.json({
    success: true,
    message: 'Préférences mises à jour',
    data: newPreferences
  });
}));

/**
 * GET /api/v1/users/onboarding
 * Récupérer l'état onboarding (persisté côté backend)
 */
router.get('/onboarding', authenticateToken, asyncHandler(async (req, res) => {
  const { data: currentUser, error } = await dbAdmin
    .from('users')
    .select('metadata, preferences')
    .eq('id', req.user.id)
    .single();

  if (error) {
    logger.error('Erreur récupération onboarding:', { userId: req.user.id, error });
    throw new ValidationError('Erreur lors de la récupération de l\'onboarding');
  }

  const preferences = currentUser?.metadata?.preferences || currentUser?.preferences || {};
  const onboarding = preferences?.onboarding || {};

  res.json({
    success: true,
    message: 'Onboarding récupéré',
    data: {
      completed: Boolean(onboarding?.completed),
      skipped: Boolean(onboarding?.skipped),
      preferred_services: Array.isArray(onboarding?.preferred_services) ? onboarding.preferred_services : [],
      acquisition_source: typeof onboarding?.acquisition_source === 'string' ? onboarding.acquisition_source : null,
      invite_code: typeof onboarding?.invite_code === 'string' ? onboarding.invite_code : null,
      language: typeof preferences?.language === 'string' ? preferences.language : null,
      updated_at: onboarding?.updated_at || null,
    }
  });
}));

/**
 * PUT /api/v1/users/onboarding
 * Mettre à jour l'état onboarding (persisté côté backend)
 */
router.put('/onboarding', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = onboardingSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { data: currentUser, error: readError } = await dbAdmin
    .from('users')
    .select('metadata, preferences')
    .eq('id', req.user.id)
    .single();

  if (readError) {
    logger.error('Erreur lecture user onboarding:', { userId: req.user.id, error: readError });
    throw new ValidationError('Erreur lors de la mise à jour de l\'onboarding');
  }

  const currentPreferences = currentUser?.metadata?.preferences || currentUser?.preferences || {};
  const currentOnboarding = currentPreferences?.onboarding || {};

  const nextOnboarding = {
    ...currentOnboarding,
    ...value,
    updated_at: new Date().toISOString(),
  };

  const nextPreferences = {
    ...currentPreferences,
    onboarding: nextOnboarding,
  };

  if (value.language) {
    nextPreferences.language = value.language;
  }

  const { error: updateError } = await dbAdmin
    .from('users')
    .update({
      metadata: {
        ...(currentUser?.metadata || {}),
        preferences: nextPreferences,
        preferences_updated_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', req.user.id);

  if (updateError) {
    logger.error('Erreur mise à jour onboarding:', { userId: req.user.id, error: updateError });
    throw new ValidationError('Erreur lors de la mise à jour de l\'onboarding');
  }

  res.json({
    success: true,
    message: 'Onboarding mis à jour',
    data: {
      completed: Boolean(nextOnboarding?.completed),
      skipped: Boolean(nextOnboarding?.skipped),
      preferred_services: Array.isArray(nextOnboarding?.preferred_services) ? nextOnboarding.preferred_services : [],
      acquisition_source: typeof nextOnboarding?.acquisition_source === 'string' ? nextOnboarding.acquisition_source : null,
      invite_code: typeof nextOnboarding?.invite_code === 'string' ? nextOnboarding.invite_code : null,
      language: typeof nextPreferences?.language === 'string' ? nextPreferences.language : null,
      updated_at: nextOnboarding?.updated_at || null,
    }
  });
}));

/**
 * POST /api/v1/users/avatar
 * Mettre à jour l'avatar de l'utilisateur
 */
router.post('/avatar', authenticateToken, upload.single('avatar'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ValidationError('Aucun fichier fourni');
  }

  try {
    // Convertir l'image en base64
    const imageBuffer = req.file.buffer;
    const base64Image = `data:${req.file.mimetype};base64,${imageBuffer.toString('base64')}`;

    // Mettre à jour l'avatar dans la base de données
    const { data: updatedUser, error: updateError } = await dbAdmin
      .from('users')
      .update({
        avatar_url: base64Image,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id)
      .select('id, avatar_url, updated_at')
      .single();

    if (updateError) {
      logger.error('Erreur mise à jour avatar:', { 
        userId: req.user.id, 
        error: updateError 
      });
      throw new ValidationError('Erreur lors de la mise à jour de l\'avatar');
    }

    logger.info('Avatar utilisateur mis à jour', { 
      userId: req.user.id
    });

    res.json({
      success: true,
      message: 'Avatar mis à jour',
      data: {
        avatar_url: updatedUser.avatar_url
      }
    });
  } catch (error) {
    logger.error('Erreur traitement avatar:', error);
    throw new ValidationError('Erreur lors du traitement de l\'avatar');
  }
}));

/**
 * POST /api/v1/users/documents
 * Uploader un document
 */
router.post('/documents', authenticateToken, upload.single('document'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ValidationError('Aucun fichier fourni');
  }

  try {
    // Sauvegarder le document
    const documentBuffer = req.file.buffer;
    const base64Document = `data:${req.file.mimetype};base64,${documentBuffer.toString('base64')}`;

    // Ajouter le document à la liste des documents de l'utilisateur
    const { data: currentUser } = await dbAdmin
      .from('users')
      .select('metadata')
      .eq('id', req.user.id)
      .single();

    const currentDocuments = currentUser?.metadata?.documents || [];
    const newDocument = {
      id: crypto.randomUUID(),
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
      base64: base64Document,
      uploaded_at: new Date().toISOString()
    };

    const updatedDocuments = [...currentDocuments, newDocument];

    const { error: updateError } = await dbAdmin
      .from('users')
      .update({
        metadata: {
          ...currentUser.metadata,
          documents: updatedDocuments,
          documents_updated_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id);

    if (updateError) {
      logger.error('Erreur upload document:', { 
        userId: req.user.id, 
        error: updateError 
      });
      throw new ValidationError('Erreur lors de l\'upload du document');
    }

    logger.info('Document utilisateur uploadé', { 
      userId: req.user.id,
      documentName: req.file.originalname,
      documentSize: req.file.size
    });

    res.json({
      success: true,
      message: 'Document uploadé avec succès',
      data: newDocument
    });
  } catch (error) {
    logger.error('Erreur traitement document:', error);
    throw new ValidationError('Erreur lors du traitement du document');
  }
}));

/**
 * GET /api/v1/users/documents
 * Lister les documents de l'utilisateur
 */
router.get('/documents', authenticateToken, asyncHandler(async (req, res) => {
  const { data: currentUser } = await dbAdmin
    .from('users')
    .select('metadata')
    .eq('id', req.user.id)
    .single();

  const documents = currentUser?.metadata?.documents || [];

  res.json({
    success: true,
    message: 'Documents récupérés',
    data: {
      documents: documents.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at)),
      total: documents.length
    }
  });
}));

/**
 * DELETE /api/v1/users/documents/:documentId
 * Supprimer un document
 */
router.delete('/documents/:documentId', authenticateToken, asyncHandler(async (req, res) => {
  const documentId = req.params.documentId;

  // Valider l'UUID
  if (!documentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
    throw new ValidationError('ID de document invalide');
  }

  // Récupérer les documents de l'utilisateur
  const { data: currentUser } = await dbAdmin
    .from('users')
    .select('metadata')
    .eq('id', req.user.id)
    .single();

  const documents = currentUser?.metadata?.documents || [];
  const documentIndex = documents.findIndex(doc => doc.id === documentId);

  if (documentIndex === -1) {
    throw new NotFoundError('Document non trouvé');
  }

  // Supprimer le document
  const updatedDocuments = documents.filter((_, index) => index !== documentIndex);
  updatedDocuments.push(...documents.slice(documentIndex + 1));

  const { error: updateError } = await dbAdmin
    .from('users')
    .update({
      metadata: {
        ...currentUser.metadata,
        documents: updatedDocuments,
        documents_updated_at: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    })
    .eq('id', req.user.id);

  if (updateError) {
    logger.error('Erreur suppression document:', { 
      userId: req.user.id, 
      documentId,
      error: updateError 
    });
    throw new ValidationError('Erreur lors de la suppression du document');
  }

  logger.info('Document utilisateur supprimé', { 
    userId: req.user.id,
      documentId
  });

  res.json({
    success: true,
    message: 'Document supprimé avec succès'
  });
}));


// =====================================================
// 📍 ROUTES ADRESSES DE LIVRAISON
// =====================================================

/**
 * GET /api/v1/users/delivery-addresses
 * Récupérer les adresses de livraison sauvegardées
 */
router.get('/delivery-addresses', authenticateToken, asyncHandler(async (req, res) => {
  const { data: currentUser } = await dbAdmin
    .from('users')
    .select('metadata')
    .eq('id', req.user.id)
    .single();

  const addresses = currentUser?.metadata?.delivery_addresses || [];

  res.json({
    success: true,
    data: addresses
  });
}));

/**
 * PUT /api/v1/users/delivery-addresses
 * Remplacer toutes les adresses de livraison (sync complète)
 */
router.put('/delivery-addresses', authenticateToken, asyncHandler(async (req, res) => {
  const { addresses } = req.body;

  if (!Array.isArray(addresses)) {
    throw new ValidationError('Le champ addresses doit être un tableau');
  }

  // Limiter à 20 adresses max
  if (addresses.length > 20) {
    throw new ValidationError('Maximum 20 adresses autorisées');
  }

  const { data: currentUser } = await dbAdmin
    .from('users')
    .select('metadata')
    .eq('id', req.user.id)
    .single();

  const { error: updateError } = await dbAdmin
    .from('users')
    .update({
      metadata: {
        ...(currentUser?.metadata || {}),
        delivery_addresses: addresses,
        delivery_addresses_updated_at: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    })
    .eq('id', req.user.id);

  if (updateError) {
    logger.error('Erreur sauvegarde adresses:', { userId: req.user.id, error: updateError });
    throw new ValidationError('Erreur lors de la sauvegarde des adresses');
  }

  logger.info('Adresses de livraison mises à jour', { userId: req.user.id, count: addresses.length });

  res.json({
    success: true,
    message: `${addresses.length} adresse(s) sauvegardée(s)`,
    data: addresses
  });
}));

export default router;

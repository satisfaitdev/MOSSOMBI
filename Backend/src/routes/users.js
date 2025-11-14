/**
 * ROUTES GESTION UTILISATEURS
 * Gestion des profils, mise à jour, documents, etc.
 */

import express from 'express';
import Joi from 'joi';
import multer from 'multer';
import path from 'path';
import { supabaseAdmin } from '../config/supabase.js';
import { asyncHandler, ValidationError, NotFoundError, ConflictError } from '../middleware/errorHandler.js';
import { authenticateToken, requireVerification, logUserAction } from '../middleware/auth.js';
import { logger, logUserAction as logAction } from '../utils/logger.js';

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
    profile_visibility: Joi.string().valid('public', 'private').optional(),
    activity_tracking: Joi.boolean().optional()
  }).optional()
});

const uploadDocumentSchema = Joi.object({
  document_type: Joi.string()
    .valid('national_id', 'passport', 'driver_license', 'voter_card')
    .required()
    .messages({
      'any.only': 'Type de document invalide',
      'any.required': 'Le type de document est requis'
    }),
  document_number: Joi.string()
    .min(5)
    .max(50)
    .required()
    .messages({
      'string.min': 'Le numéro de document doit contenir au moins 5 caractères',
      'string.max': 'Le numéro de document ne peut pas dépasser 50 caractères',
      'any.required': 'Le numéro de document est requis'
    }),
  issued_date: Joi.date()
    .max('now')
    .optional()
    .messages({
      'date.max': 'La date d\'émission ne peut pas être dans le futur'
    }),
  expires_at: Joi.date()
    .min('now')
    .optional()
    .messages({
      'date.min': 'La date d\'expiration doit être dans le futur'
    })
});

// =====================================================
// 👤 ROUTES PROFIL UTILISATEUR
// =====================================================

/**
 * GET /api/v1/users/profile
 * Récupérer le profil complet de l'utilisateur connecté
 */
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const { data: userData, error } = await supabaseAdmin
    .from('users')
    .select(`
      *,
      user_documents (
        id,
        document_type,
        document_number,
        verification_status,
        created_at
      )
    `)
    .eq('id', req.user.id)
    .single();

  if (error) {
    logger.error('Erreur récupération profil', { userId: req.user.id, error });
    throw new NotFoundError('Profil utilisateur non trouvé');
  }

  // Calculer les statistiques utilisateur
  const stats = {
    total_points: userData.points,
    level_progress: calculateLevelProgress(userData.points),
    documents_verified: userData.user_documents?.filter(doc => doc.verification_status === 'approved').length || 0,
    account_completion: calculateAccountCompletion(userData)
  };

  res.json({
    success: true,
    data: {
      user: {
        id: userData.id,
        phone: userData.phone,
        email: userData.email,
        full_name: userData.full_name,
        user_id_display: userData.user_id_display,
        avatar_url: userData.avatar_url,
        date_of_birth: userData.date_of_birth,
        address: userData.address,
        gender: userData.gender,
        country_code: userData.country_code,
        user_level: userData.user_level,
        points: userData.points,
        is_verified: userData.is_verified,
        is_active: userData.is_active,
        phone_verified_at: userData.phone_verified_at,
        email_verified_at: userData.email_verified_at,
        last_login_at: userData.last_login_at,
        preferences: userData.preferences,
        created_at: userData.created_at,
        updated_at: userData.updated_at
      },
      documents: userData.user_documents || [],
      stats
    }
  });
}));

/**
 * PUT /api/v1/users/profile
 * Mettre à jour le profil utilisateur
 */
router.put('/profile', authenticateToken, logUserAction('profile_update'), asyncHandler(async (req, res) => {
  // Validation des données
  const { error, value } = updateProfileSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  // Vérifier si l'email est déjà utilisé (si fourni)
  if (value.email && value.email !== req.user.email) {
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', value.email)
      .neq('id', req.user.id)
      .single();

    if (existingUser) {
      throw new ConflictError('Cette adresse email est déjà utilisée');
    }
  }

  // Mettre à jour le profil
  const { data: updatedUser, error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      ...value,
      updated_at: new Date().toISOString()
    })
    .eq('id', req.user.id)
    .select()
    .single();

  if (updateError) {
    logger.error('Erreur mise à jour profil', { userId: req.user.id, error: updateError });
    throw new ValidationError('Erreur lors de la mise à jour du profil');
  }

  // Créer une notification
  await supabaseAdmin
    .from('notifications')
    .insert({
      user_id: req.user.id,
      type: 'profile_update',
      title: 'Profil mis à jour',
      message: 'Vos informations de profil ont été mises à jour avec succès.',
      data: { updated_fields: Object.keys(value) }
    });

  // Logger l'action
  logAction(req.user.id, 'profile_updated', {
    updated_fields: Object.keys(value)
  });

  res.json({
    success: true,
    message: 'Profil mis à jour avec succès',
    data: {
      user: {
        id: updatedUser.id,
        phone: updatedUser.phone,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        user_id_display: updatedUser.user_id_display,
        avatar_url: updatedUser.avatar_url,
        date_of_birth: updatedUser.date_of_birth,
        address: updatedUser.address,
        gender: updatedUser.gender,
        country_code: updatedUser.country_code,
        user_level: updatedUser.user_level,
        points: updatedUser.points,
        is_verified: updatedUser.is_verified,
        preferences: updatedUser.preferences,
        updated_at: updatedUser.updated_at
      }
    }
  });
}));

/**
 * PUT /api/v1/users/preferences
 * Mettre à jour les préférences utilisateur
 */
router.put('/preferences', authenticateToken, logUserAction('preferences_update'), asyncHandler(async (req, res) => {
  // Validation des données
  const { error, value } = updatePreferencesSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  // Récupérer les préférences actuelles
  const { data: currentUser } = await supabaseAdmin
    .from('users')
    .select('preferences')
    .eq('id', req.user.id)
    .single();

  // Fusionner avec les nouvelles préférences
  const updatedPreferences = {
    ...currentUser.preferences,
    ...value
  };

  // Mettre à jour
  const { data: updatedUser, error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      preferences: updatedPreferences,
      updated_at: new Date().toISOString()
    })
    .eq('id', req.user.id)
    .select('preferences')
    .single();

  if (updateError) {
    logger.error('Erreur mise à jour préférences', { userId: req.user.id, error: updateError });
    throw new ValidationError('Erreur lors de la mise à jour des préférences');
  }

  res.json({
    success: true,
    message: 'Préférences mises à jour avec succès',
    data: {
      preferences: updatedUser.preferences
    }
  });
}));

/**
 * POST /api/v1/users/avatar
 * Upload de l'avatar utilisateur
 */
router.post('/avatar', authenticateToken, upload.single('avatar'), logUserAction('avatar_upload'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ValidationError('Aucun fichier fourni');
  }

  // TODO: Upload vers Supabase Storage
  // Pour l'instant, on simule l'URL
  const avatarUrl = `https://ysehwpykzgksmaayaqek.supabase.co/storage/v1/object/public/avatars/${req.user.id}/${Date.now()}-${req.file.originalname}`;

  // Mettre à jour l'avatar dans le profil
  const { data: updatedUser, error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString()
    })
    .eq('id', req.user.id)
    .select('avatar_url')
    .single();

  if (updateError) {
    logger.error('Erreur mise à jour avatar', { userId: req.user.id, error: updateError });
    throw new ValidationError('Erreur lors de la mise à jour de l\'avatar');
  }

  res.json({
    success: true,
    message: 'Avatar mis à jour avec succès',
    data: {
      avatar_url: updatedUser.avatar_url
    }
  });
}));

/**
 * POST /api/v1/users/documents
 * Upload d'un document d'identité
 */
router.post('/documents', authenticateToken, upload.fields([
  { name: 'document_front', maxCount: 1 },
  { name: 'document_back', maxCount: 1 },
  { name: 'selfie', maxCount: 1 }
]), logUserAction('document_upload'), asyncHandler(async (req, res) => {
  // Validation des données
  const { error, value } = uploadDocumentSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { document_type, document_number, issued_date, expires_at } = value;

  if (!req.files?.document_front) {
    throw new ValidationError('Le recto du document est requis');
  }

  // Vérifier si ce type de document existe déjà
  const { data: existingDoc } = await supabaseAdmin
    .from('user_documents')
    .select('id')
    .eq('user_id', req.user.id)
    .eq('document_type', document_type)
    .single();

  if (existingDoc) {
    throw new ConflictError('Un document de ce type a déjà été soumis');
  }

  // TODO: Upload des fichiers vers Supabase Storage
  const documentFrontUrl = `https://ysehwpykzgksmaayaqek.supabase.co/storage/v1/object/public/documents/${req.user.id}/${Date.now()}-front.jpg`;
  const documentBackUrl = req.files?.document_back ? `https://ysehwpykzgksmaayaqek.supabase.co/storage/v1/object/public/documents/${req.user.id}/${Date.now()}-back.jpg` : null;
  const selfieUrl = req.files?.selfie ? `https://ysehwpykzgksmaayaqek.supabase.co/storage/v1/object/public/documents/${req.user.id}/${Date.now()}-selfie.jpg` : null;

  // Insérer le document
  const { data: newDocument, error: insertError } = await supabaseAdmin
    .from('user_documents')
    .insert({
      user_id: req.user.id,
      document_type,
      document_number,
      document_front_url: documentFrontUrl,
      document_back_url: documentBackUrl,
      selfie_url: selfieUrl,
      issued_date,
      expires_at,
      verification_status: 'pending'
    })
    .select()
    .single();

  if (insertError) {
    logger.error('Erreur insertion document', { userId: req.user.id, error: insertError });
    throw new ValidationError('Erreur lors de l\'enregistrement du document');
  }

  // Créer une notification
  await supabaseAdmin
    .from('notifications')
    .insert({
      user_id: req.user.id,
      type: 'verification',
      title: 'Document soumis pour vérification',
      message: `Votre ${getDocumentTypeName(document_type)} a été soumis et sera vérifié sous 24-48h.`,
      data: { document_id: newDocument.id, document_type }
    });

  res.json({
    success: true,
    message: 'Document soumis avec succès pour vérification',
    data: {
      document: {
        id: newDocument.id,
        document_type: newDocument.document_type,
        document_number: newDocument.document_number,
        verification_status: newDocument.verification_status,
        created_at: newDocument.created_at
      }
    }
  });
}));

/**
 * GET /api/v1/users/documents
 * Récupérer les documents de l'utilisateur
 */
router.get('/documents', authenticateToken, asyncHandler(async (req, res) => {
  const { data: documents, error } = await supabaseAdmin
    .from('user_documents')
    .select('id, document_type, document_number, verification_status, verified_at, rejection_reason, created_at')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Erreur récupération documents', { userId: req.user.id, error });
    throw new ValidationError('Erreur lors de la récupération des documents');
  }

  res.json({
    success: true,
    data: {
      documents: documents || []
    }
  });
}));

/**
 * DELETE /api/v1/users/account
 * Supprimer le compte utilisateur
 */
router.delete('/account', authenticateToken, logUserAction('account_deletion'), asyncHandler(async (req, res) => {
  // Désactiver le compte au lieu de le supprimer complètement
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      is_active: false,
      metadata: {
        ...req.user.metadata,
        deactivated_at: new Date().toISOString(),
        deactivation_reason: 'user_request'
      }
    })
    .eq('id', req.user.id);

  if (updateError) {
    logger.error('Erreur désactivation compte', { userId: req.user.id, error: updateError });
    throw new ValidationError('Erreur lors de la désactivation du compte');
  }

  // Déconnecter l'utilisateur
  await supabaseAdmin.auth.admin.signOut(req.user.id);

  res.json({
    success: true,
    message: 'Compte désactivé avec succès'
  });
}));

// =====================================================
// 🔧 FONCTIONS UTILITAIRES
// =====================================================

function calculateLevelProgress(points) {
  const levels = {
    Bronze: { min: 0, max: 499 },
    Silver: { min: 500, max: 1999 },
    Gold: { min: 2000, max: 4999 },
    Diamond: { min: 5000, max: Infinity }
  };

  for (const [level, range] of Object.entries(levels)) {
    if (points >= range.min && points <= range.max) {
      const progress = range.max === Infinity ? 100 : 
        Math.round(((points - range.min) / (range.max - range.min)) * 100);
      return {
        current_level: level,
        progress_percentage: progress,
        points_to_next: range.max === Infinity ? 0 : range.max + 1 - points
      };
    }
  }
}

function calculateAccountCompletion(userData) {
  const fields = [
    'full_name', 'email', 'date_of_birth', 'address', 'gender', 'avatar_url'
  ];
  
  const completedFields = fields.filter(field => userData[field] && userData[field] !== '').length;
  const phoneVerified = userData.phone_verified_at ? 1 : 0;
  const emailVerified = userData.email_verified_at ? 1 : 0;
  
  const totalFields = fields.length + 2; // +2 pour les vérifications
  const completed = completedFields + phoneVerified + emailVerified;
  
  return Math.round((completed / totalFields) * 100);
}

function getDocumentTypeName(type) {
  const names = {
    'national_id': 'Carte d\'identité nationale',
    'passport': 'Passeport',
    'driver_license': 'Permis de conduire',
    'voter_card': 'Carte d\'électeur'
  };
  return names[type] || type;
}

export default router;

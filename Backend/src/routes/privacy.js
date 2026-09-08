/**
 * ROUTES CONFIDENTIALITÉ - MOSSOMBI BACKEND
 * Gestion des paramètres de confidentialité et données personnelles
 */

import express from 'express';
import Joi from 'joi';
import fs from 'fs';
import path from 'path';
import os from 'os';
import bcrypt from 'bcryptjs';
import { dbAdmin } from '../config/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { asyncHandler, ValidationError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
const router = express.Router();

// Schéma de validation pour les paramètres de confidentialité
const privacySettingsSchema = Joi.object({
  privacy_settings: Joi.object({
    // Autorisations
    locationSharing: Joi.boolean().default(true),
    cameraAccess: Joi.boolean().default(true),
    microphoneAccess: Joi.boolean().default(false),
    
    // Collecte de données
    activityTracking: Joi.boolean().default(true),
    dataSharing: Joi.boolean().default(false),
    
    // Communications
    marketingEmails: Joi.boolean().default(true),
    
    // Notifications
    pushNotifications: Joi.boolean().default(true),
    emailNotifications: Joi.boolean().default(true),
    smsNotifications: Joi.boolean().default(true),
    
    // Sécurité
    biometricAuth: Joi.boolean().default(false),
  }).required()
});

/**
 * GET /api/v1/profile/privacy/settings
 * Récupérer les paramètres de confidentialité de l'utilisateur
 */
router.get('/settings', authenticateToken, asyncHandler(async (req, res) => {
  logger.info('Privacy Settings - Récupération pour utilisateur: ' + req.user.id);

  // Récupérer les paramètres depuis la base de données
  const { data: user, error } = await dbAdmin
    .from('users')
    .select('privacy_settings, created_at')
    .eq('id', req.user.id)
    .single();

  if (error) {
    logger.error('Erreur récupération paramètres privacy: ' + error.message);
    throw new Error('Impossible de récupérer les paramètres de confidentialité');
  }

  // Paramètres par défaut si aucun n'existe
  const defaultSettings = {
    locationSharing: true,
    cameraAccess: true,
    microphoneAccess: false,
    activityTracking: true,
    dataSharing: false,
    marketingEmails: true,
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
    biometricAuth: false,
  };

  const privacySettings = user.privacy_settings || defaultSettings;

  // Calculer les jours de rétention des données
  const accountCreated = new Date(user.created_at);
  const dataRetentionDays = Math.floor((new Date() - accountCreated) / (1000 * 60 * 60 * 24));

  res.json({
    success: true,
    message: 'Paramètres de confidentialité récupérés',
    data: {
      privacy_settings: privacySettings,
      data_collected: {
        account_activity: privacySettings.activityTracking,
        location_data: privacySettings.locationSharing,
        marketing_data: privacySettings.marketingEmails,
        shared_with_partners: privacySettings.dataSharing
      },
      account_created: user.created_at,
      data_retention_days: dataRetentionDays
    }
  });
}));

/**
 * PUT /api/v1/profile/privacy/settings
 * Mettre à jour les paramètres de confidentialité
 */
router.put('/settings', authenticateToken, asyncHandler(async (req, res) => {
  logger.info('Privacy Settings - Mise à jour pour utilisateur: ' + req.user.id);
  logger.info('Nouveaux paramètres: ' + JSON.stringify(req.body));

  // Validation des données
  const { error, value } = privacySettingsSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { privacy_settings } = value;

  // Mettre à jour dans la base de données
  const { data: updatedUser, error: updateError } = await dbAdmin
    .from('users')
    .update({
      privacy_settings,
      updated_at: new Date().toISOString()
    })
    .eq('id', req.user.id)
    .select('privacy_settings')
    .single();

  if (updateError) {
    logger.error('Erreur mise à jour paramètres privacy: ' + updateError.message);
    throw new Error('Impossible de mettre à jour les paramètres de confidentialité');
  }

  logger.info('Paramètres de confidentialité mis à jour avec succès');

  res.json({
    success: true,
    message: 'Paramètres de confidentialité mis à jour avec succès',
    data: {
      privacy_settings: updatedUser.privacy_settings
    }
  });
}));

/**
 * POST /api/v1/profile/privacy/export-data
 * Exporter toutes les données personnelles de l'utilisateur
 */
router.post('/export-data', authenticateToken, asyncHandler(async (req, res) => {
  logger.info('Export Data - Demande pour utilisateur: ' + req.user.id);

  try {
    // Récupérer toutes les données de l'utilisateur
    const { data: userData, error: userError } = await dbAdmin
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (userError) {
      throw new Error('Impossible de récupérer les données utilisateur');
    }

    // Récupérer les transactions du wallet
    const { data: walletData, error: walletError } = await dbAdmin
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    // Récupérer les notifications
    const { data: notificationsData, error: notifError } = await dbAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    // Préparer l'export des données
    const exportData = {
      user_profile: {
        id: userData.id,
        email: userData.email,
        phone: userData.phone,
        full_name: userData.full_name,
        date_of_birth: userData.date_of_birth,
        address: userData.address,
        country_code: userData.country_code,
        user_level: userData.user_level,
        points: userData.points,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
        privacy_settings: userData.privacy_settings
      },
      wallet_data: {
        transactions: walletData || [],
        total_transactions: walletData?.length || 0
      },
      notifications: {
        notifications: notificationsData || [],
        total_notifications: notificationsData?.length || 0
      },
      export_metadata: {
        exported_at: new Date().toISOString(),
        export_format: 'JSON',
        data_retention_notice: 'Ces données sont conservées selon notre politique de confidentialité'
      }
    };

    logger.info('Export des données préparé avec succès');

    // Écrire dans un fichier temporaire et le servir en téléchargement
    const tmpDir = os.tmpdir();
    const tmpFile = path.join(tmpDir, `mossombi-export-${req.user.id}-${Date.now()}.json`);
    fs.writeFileSync(tmpFile, JSON.stringify(exportData, null, 2), 'utf8');

    res.download(tmpFile, `mossombi-export-${Date.now()}.json`, (err) => {
      fs.unlink(tmpFile, () => {});
      if (err) {
        logger.error('Erreur envoi fichier export: ' + err.message);
      }
    });

  } catch (error) {
    logger.error('Erreur export données: ' + error.message);
    throw new Error('Impossible d\'exporter les données');
  }
}));

/**
 * DELETE /api/v1/profile/delete-account
 * Supprimer le compte utilisateur (soft delete avec vérification mot de passe)
 */
router.delete('/delete-account', authenticateToken, asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password) {
    throw new ValidationError('Le mot de passe est requis pour supprimer le compte');
  }

  logger.info('Delete Account - Demande pour utilisateur: ' + req.user.id);

  try {
    // Vérifier le mot de passe
    const { data: user } = await dbAdmin
      .from('users')
      .select('password_hash, deleted_at')
      .eq('id', req.user.id)
      .single();

    if (!user || user.deleted_at) {
      throw new ValidationError('Compte non trouvé ou déjà supprimé');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new ValidationError('Mot de passe incorrect');
    }

    // Soft delete : marquer le compte comme supprimé au lieu de le supprimer
    const now = new Date().toISOString();
    const { error: userError } = await dbAdmin
      .from('users')
      .update({ is_active: false, deleted_at: now, updated_at: now })
      .eq('id', req.user.id);

    if (userError) {
      logger.error('Erreur soft delete utilisateur: ' + userError.message);
      throw new Error('Impossible de supprimer le compte utilisateur');
    }

    // Désactiver les sessions actives
    await dbAdmin
      .from('user_sessions')
      .update({ is_active: false, terminated_at: now })
      .eq('user_id', req.user.id)
      .eq('is_active', true);

    logger.info('Compte utilisateur supprimé (soft) avec succès');

    res.json({
      success: true,
      message: 'Votre compte a été désactivé. Nous sommes désolés de vous voir partir.'
    });

  } catch (error) {
    logger.error('Erreur suppression compte: ' + error.message);
    throw error;
  }
}));

export default router;

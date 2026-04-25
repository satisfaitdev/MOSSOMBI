/**
 * ROUTES CONFIDENTIALITÉ - MOSSOMBI BACKEND
 * Gestion des paramètres de confidentialité et données personnelles
 */

import express from 'express';
import Joi from 'joi';
import { dbAdmin } from '../config/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { asyncHandler, ValidationError } from '../middleware/errorHandler.js';
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
  console.log('🔒 Privacy Settings - Récupération pour utilisateur:', req.user.id);

  // Récupérer les paramètres depuis la base de données
  const { data: user, error } = await dbAdmin
    .from('users')
    .select('privacy_settings, created_at')
    .eq('id', req.user.id)
    .single();

  if (error) {
    console.error('❌ Erreur récupération paramètres privacy:', error);
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
  console.log('🔒 Privacy Settings - Mise à jour pour utilisateur:', req.user.id);
  console.log('📝 Nouveaux paramètres:', req.body);

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
    console.error('❌ Erreur mise à jour paramètres privacy:', updateError);
    throw new Error('Impossible de mettre à jour les paramètres de confidentialité');
  }

  console.log('✅ Paramètres de confidentialité mis à jour avec succès');

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
  console.log('📥 Export Data - Demande pour utilisateur:', req.user.id);

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

    console.log('✅ Export des données préparé avec succès');

    res.json({
      success: true,
      message: 'Export des données préparé avec succès',
      data: {
        download_url: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportData, null, 2))}`,
        data: exportData
      }
    });

  } catch (error) {
    console.error('❌ Erreur export données:', error);
    throw new Error('Impossible d\'exporter les données');
  }
}));

/**
 * DELETE /api/v1/profile/delete-account
 * Supprimer définitivement le compte utilisateur
 */
router.delete('/delete-account', authenticateToken, asyncHandler(async (req, res) => {
  console.log('🗑️ Delete Account - Demande pour utilisateur:', req.user.id);

  try {
    // 1. Supprimer les transactions du wallet
    const { error: walletError } = await dbAdmin
      .from('wallet_transactions')
      .delete()
      .eq('user_id', req.user.id);

    if (walletError) {
      console.error('❌ Erreur suppression transactions wallet:', walletError);
    }

    // 2. Supprimer les notifications
    const { error: notifError } = await dbAdmin
      .from('notifications')
      .delete()
      .eq('user_id', req.user.id);

    if (notifError) {
      console.error('❌ Erreur suppression notifications:', notifError);
    }

    // 3. Supprimer le profil utilisateur
    const { error: userError } = await dbAdmin
      .from('users')
      .delete()
      .eq('id', req.user.id);

    if (userError) {
      console.error('❌ Erreur suppression utilisateur:', userError);
      throw new Error('Impossible de supprimer le compte utilisateur');
    }

    console.log('✅ Compte utilisateur supprimé avec succès');

    res.json({
      success: true,
      message: 'Votre compte a été supprimé définitivement. Nous sommes désolés de vous voir partir.'
    });

  } catch (error) {
    console.error('❌ Erreur suppression compte:', error);
    throw new Error('Impossible de supprimer le compte');
  }
}));

export default router;

/**
 * ENVOYEUR DE NOTIFICATIONS
 * Envoi de notifications par email, SMS, WhatsApp
 */

import express from 'express';
import Joi from 'joi';
import { dbAdmin } from '../../config/db.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../middleware/errorHandler.js';
import { authenticateToken, requireVerification } from '../../middleware/auth.js';
import { logUserAction } from '../../middleware/auth.js';
import { logger } from '../../utils/logger.js';
import { emailService } from '../../services/emailService.js';
import { smsService } from '../../services/smsService.js';
import { whatsappService } from '../../services/whatsappService.js';

const router = express.Router();

// =====================================================
// 📋 SCHÉMAS DE VALIDATION
// =====================================================

const sendEmailSchema = Joi.object({
  to: Joi.string().email().required().messages({
    'string.email': 'Adresse email invalide',
    'any.required': 'Adresse email requise'
  }),
  subject: Joi.string().min(1).max(200).required().messages({
    'string.min': 'Le sujet ne peut pas être vide',
    'string.max': 'Le sujet ne peut pas dépasser 200 caractères',
    'any.required': 'Sujet requis'
  }),
  body: Joi.string().min(1).max(5000).required().messages({
    'string.min': 'Le corps du message ne peut pas être vide',
    'string.max': 'Le corps du message ne peut pas dépasser 5000 caractères',
    'any.required': 'Corps du message requis'
  }),
  template: Joi.string().optional(),
  data: Joi.object().optional()
});

const sendSMSSchema = Joi.object({
  to: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required().messages({
    'string.pattern.base': 'Numéro de téléphone invalide (format international requis)',
    'any.required': 'Numéro de téléphone requis'
  }),
  message: Joi.string().min(1).max(1600).required().messages({
    'string.min': 'Le message ne peut pas être vide',
    'string.max': 'Le message ne peut pas dépasser 1600 caractères',
    'any.required': 'Message requis'
  }),
  type: Joi.string().valid('transactional', 'marketing', 'otp').default('transactional')
});

const sendWhatsAppSchema = Joi.object({
  to: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required().messages({
    'string.pattern.base': 'Numéro de téléphone invalide (format international requis)',
    'any.required': 'Numéro de téléphone requis'
  }),
  message: Joi.string().min(1).max(4096).required().messages({
    'string.min': 'Le message ne peut pas être vide',
    'string.max': 'Le message ne peut pas dépasser 4096 caractères',
    'any.required': 'Message requis'
  })
});

const sendBulkNotificationSchema = Joi.object({
  type: Joi.string()
    .valid('email', 'sms', 'whatsapp')
    .required(),
  recipients: Joi.array()
    .items(Joi.string())
    .min(1)
    .max(100)
    .required(),
  subject: Joi.string().when('type', {
      is: 'email',
      then: Joi.required(),
      otherwise: Joi.optional()
  }),
  message: Joi.string().min(1).max(5000).required(),
  template: Joi.string().optional(),
  data: Joi.object().optional(),
  scheduled_at: Joi.date().optional()
});

// =====================================================
// 📤 ROUTES ENVOI NOTIFICATIONS
// =====================================================

/**
 * POST /api/v1/notifications/send-email
 * Envoyer un email
 */
router.post('/send-email', authenticateToken, requireVerification, asyncHandler(async (req, res) => {
  const { error, value } = sendEmailSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { to, subject, body, template, data } = value;

  try {
    // Vérifier que l'utilisateur a le droit d'envoyer des emails
    const { data: user } = await dbAdmin
      .from('users')
      .select('id, email, metadata')
      .eq('id', req.user.id)
      .single();

    if (!user) {
      throw new NotFoundError('Utilisateur non trouvé');
    }

    // Vérifier les permissions (admin ou vérifié)
    const canSendEmail = user.metadata?.permissions?.includes('send_email') || 
                        user.metadata?.role === 'admin';

    if (!canSendEmail && to !== user.email) {
      throw new ValidationError('Permission refusée pour envoyer des emails à d\'utilisateurs');
    }

    // Envoyer l'email
    const result = await emailService.sendEmail({
      to,
      subject,
      body,
      template,
      data,
      userId: req.user.id
    });

    // Logger l'action
    await logUserAction(req.user.id, 'send_email', {
      to,
      subject,
      template: template || 'custom',
      success: result.success
    });

    if (result.success) {
      logger.info('Email envoyé avec succès', { 
        userId: req.user.id,
        to,
        subject
      });

      res.json({
        success: true,
        message: 'Email envoyé avec succès',
        data: {
          message_id: result.message_id,
          sent_at: result.sent_at
        }
      });
    } else {
      throw new ValidationError('Erreur lors de l\'envoi de l\'email');
    }
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Erreur envoi email:', { 
      userId: req.user.id, 
      to,
      subject,
      error 
    });
    throw new ValidationError('Erreur lors de l\'envoi de l\'email');
  }
}));

/**
 * POST /api/v1/notifications/send-sms
 * Envoyer un SMS
 */
router.post('/send-sms', authenticateToken, requireVerification, asyncHandler(async (req, res) => {
  const { error, value } = sendSMSSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { to, message, type } = value;

  try {
    // Vérifier que l'utilisateur a le droit d'envoyer des SMS
    const { data: user } = await dbAdmin
      .from('users')
      .select('id, phone, metadata')
      .eq('id', req.user.id)
      .single();

    if (!user) {
      throw new NotFoundError('Utilisateur non trouvé');
    }

    // Vérifier les permissions
    const canSendSMS = user.metadata?.permissions?.includes('send_sms') || 
                     user.metadata?.role === 'admin';

    if (!canSendSMS && to !== user.phone) {
      throw new ValidationError('Permission refusée pour envoyer des SMS à d\'utilisateurs');
    }

    // Envoyer le SMS
    const result = await smsService.sendSMS({
      to,
      message,
      type,
      userId: req.user.id
    });

    // Logger l'action
    await logUserAction(req.user.id, 'send_sms', {
      to,
      type,
      success: result.success
    });

    if (result.success) {
      logger.info('SMS envoyé avec succès', { 
        userId: req.user.id,
        to,
        type
      });

      res.json({
        success: true,
        message: 'SMS envoyé avec succès',
        data: {
          message_id: result.message_id,
          sent_at: result.sent_at,
          cost: result.cost
        }
      });
    } else {
      throw new ValidationError('Erreur lors de l\'envoi du SMS');
    }
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Erreur envoi SMS:', { 
      userId: req.user.id, 
      to,
      type,
      error 
    });
    throw new ValidationError('Erreur lors de l\'envoi du SMS');
  }
}));

/**
 * POST /api/v1/notifications/send-whatsapp
 * Envoyer un message WhatsApp
 */
router.post('/send-whatsapp', authenticateToken, requireVerification, asyncHandler(async (req, res) => {
  const { error, value } = sendWhatsAppSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { to, message } = value;

  try {
    // Vérifier que l'utilisateur a le droit d'envoyer des messages WhatsApp
    const { data: user } = await dbAdmin
      .from('users')
      .select('id, phone, metadata')
      .eq('id', req.user.id)
      .single();

    if (!user) {
      throw new NotFoundError('Utilisateur non trouvé');
    }

    // Vérifier les permissions
    const canSendWhatsApp = user.metadata?.permissions?.includes('send_whatsapp') || 
                          user.metadata?.role === 'admin';

    if (!canSendWhatsApp && to !== user.phone) {
      throw new ValidationError('Permission refusée pour envoyer des messages WhatsApp à d\'utilisateurs');
    }

    // Envoyer le message WhatsApp
    const result = await whatsappService.sendMessage({
      to,
      message,
      userId: req.user.id
    });

    // Logger l'action
    await logUserAction(req.user.id, 'send_whatsapp', {
      to,
      success: result.success
    });

    if (result.success) {
      logger.info('Message WhatsApp envoyé avec succès', { 
        userId: req.user.id,
        to
      });

      res.json({
        success: true,
        message: 'Message WhatsApp envoyé avec succès',
        data: {
          message_id: result.message_id,
          sent_at: result.sent_at,
          status: result.status
        }
      });
    } else {
      throw new ValidationError('Erreur lors de l\'envoi du message WhatsApp');
    }
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Erreur envoi WhatsApp:', { 
      userId: req.user.id, 
      to,
      error 
    });
    throw new ValidationError('Erreur lors de l\'envoi du message WhatsApp');
  }
}));

/**
 * POST /api/v1/notifications/send-bulk
 * Envoyer une notification en masse
 */
router.post('/send-bulk', authenticateToken, requireVerification, asyncHandler(async (req, res) => {
  const { error, value } = sendBulkNotificationSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { type, recipients, subject, message, template, data, scheduled_at } = value;

  try {
    // Vérifier que l'utilisateur a le droit d'envoyer des notifications en masse
    const { data: user } = await dbAdmin
      .from('users')
      .select('id, metadata')
      .eq('id', req.user.id)
      .single();

    if (!user) {
      throw new NotFoundError('Utilisateur non trouvé');
    }

    // Vérifier les permissions (admin uniquement)
    if (user.metadata?.role !== 'admin') {
      throw new ValidationError('Permission refusée pour envoyer des notifications en masse');
    }

    // Limiter le nombre de destinataires
    if (recipients.length > 100) {
      throw new ValidationError('Le nombre de destinataires ne peut pas dépasser 100');
    }

    // Créer la notification en masse
    const bulkNotification = {
      id: crypto.randomUUID(),
      type: 'bulk',
      channel: type,
      recipients,
      subject,
      message,
      template,
      data,
      scheduled_at,
      created_by: req.user.id,
      status: scheduled_at ? 'scheduled' : 'pending',
      created_at: new Date().toISOString()
    };

    // Sauvegarder la notification en masse
    const { error: saveError } = await dbAdmin
      .from('bulk_notifications')
      .insert(bulkNotification);

    if (saveError) {
      logger.error('Erreur sauvegarde notification en masse:', { 
        userId: req.user.id, 
        error: saveError 
      });
      throw new ValidationError('Erreur lors de la sauvegarde de la notification en masse');
    }

    // Si pas de programmation, envoyer immédiatement
    if (!scheduled_at) {
      await processBulkNotification(bulkNotification);
    }

    // Logger l'action
    await logUserAction(req.user.id, 'send_bulk_notification', {
      type,
      recipient_count: recipients.length,
      scheduled: !!scheduled_at
    });

    logger.info('Notification en masse créée', { 
      userId: req.user.id,
      type,
      recipientCount: recipients.length
    });

    res.json({
      success: true,
      message: scheduled_at ? 'Notification en masse programmée' : 'Notification en masse créée',
      data: {
        notification_id: bulkNotification.id,
        recipient_count: recipients.length,
        scheduled_at: scheduled_at,
        status: bulkNotification.status
      }
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Erreur notification en masse:', { 
      userId: req.user.id, 
      type,
      error 
    });
    throw new ValidationError('Erreur lors de la création de la notification en masse');
  }
}));

/**
 * GET /api/v1/notifications/bulk/:notificationId/status
 * Obtenir le statut d'une notification en masse
 */
router.get('/bulk/:notificationId/status', authenticateToken, asyncHandler(async (req, res) => {
  const notificationId = req.params.notificationId;

  // Valider l'UUID
  if (!notificationId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
    throw new ValidationError('ID de notification invalide');
  }

  try {
    // Récupérer la notification en masse
    const { data: notification, error: fetchError } = await dbAdmin
      .from('bulk_notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    if (fetchError || !notification) {
      throw new NotFoundError('Notification en masse non trouvée');
    }

    // Vérifier que l'utilisateur a le droit de voir cette notification
    if (notification.created_by !== req.user.id) {
      const { data: user } = await dbAdmin
        .from('users')
        .select('metadata')
        .eq('id', req.user.id)
        .single();

      if (user.metadata?.role !== 'admin') {
        throw new ValidationError('Permission refusée pour voir cette notification');
      }
    }

    res.json({
      success: true,
      message: 'Statut de la notification en masse récupéré',
      data: {
        id: notification.id,
        type: notification.channel,
        status: notification.status,
        recipient_count: notification.recipients.length,
        sent_count: notification.sent_count || 0,
        failed_count: notification.failed_count || 0,
        created_at: notification.created_at,
        scheduled_at: notification.scheduled_at,
        sent_at: notification.sent_at,
        errors: notification.errors || []
      }
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Erreur statut notification en masse:', { 
      userId: req.user.id, 
      notificationId,
      error 
    });
    throw new ValidationError('Erreur lors de la récupération du statut de la notification');
  }
}));

// =====================================================
// 📊 FONCTIONS UTILITAIRES
// =====================================================

/**
 * Traiter une notification en masse
 */
async function processBulkNotification(notification) {
  try {
    const results = {
      sent: 0,
      failed: 0,
      errors: []
    };

    for (const recipient of notification.recipients) {
      try {
        let result;

        switch (notification.channel) {
          case 'email':
            result = await emailService.sendEmail({
              to: recipient,
              subject: notification.subject,
              body: notification.message,
              template: notification.template,
              data: { ...notification.data, recipient }
            });
            break;
          case 'sms':
            result = await smsService.sendSMS({
              to: recipient,
              message: notification.message,
              type: 'transactional'
            });
            break;
          case 'whatsapp':
            result = await whatsappService.sendMessage({
              to: recipient,
              message: notification.message
            });
            break;
          default:
            throw new Error('Type de notification non supporté');
        }

        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push({ recipient, error: result.error });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ recipient, error: error.message });
      }
    }

    // Mettre à jour le statut
    await dbAdmin
      .from('bulk_notifications')
      .update({
        status: 'completed',
        sent_count: results.sent,
        failed_count: results.failed,
        errors: results.errors,
        sent_at: new Date().toISOString()
      })
      .eq('id', notification.id);

    return results;
  } catch (error) {
    logger.error('Erreur traitement notification en masse:', { 
      notificationId: notification.id, 
      error 
    });

    // Marquer comme échouée
    await dbAdmin
      .from('bulk_notifications')
      .update({
        status: 'failed',
        errors: [{ error: error.message }],
        failed_at: new Date().toISOString()
      })
      .eq('id', notification.id);

    throw error;
  }
}

export default router;

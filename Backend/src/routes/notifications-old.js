/**
 * ROUTES NOTIFICATIONS
 * Gestion des notifications utilisateur
 */

import express from 'express';
import Joi from 'joi';
import { dbAdmin } from '../config/db.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { logUserAction } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import { emailService } from '../services/emailService.js';
import { smsService } from '../services/smsService.js';
import { whatsappService } from '../services/whatsappService.js';

const router = express.Router();

// =====================================================
// 📋 SCHÉMAS DE VALIDATION
// =====================================================

const markAsReadSchema = Joi.object({
  notification_ids: Joi.array()
    .items(Joi.string().uuid())
    .min(1)
    .required()
    .messages({
      'array.min': 'Au moins un ID de notification est requis',
      'any.required': 'Les IDs de notification sont requis'
    })
});

const notificationFiltersSchema = Joi.object({
  type: Joi.string()
    .valid('welcome', 'verification', 'security', 'profile_update', 'system', 'transaction', 'order', 'marketing')
    .optional(),
  is_read: Joi.boolean().optional(),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .optional(),
  offset: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .optional(),
  sort: Joi.string()
    .valid('created_at', 'read_at')
    .default('created_at')
    .optional(),
  order: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .optional()
});

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
  }),
  template: Joi.string().optional(),
  data: Joi.object().optional()
});

// =====================================================
// 🔔 ROUTES NOTIFICATIONS
// =====================================================

/**
 * GET /api/v1/notifications
 * Récupérer les notifications de l'utilisateur avec filtres
 */
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  // Validation des paramètres de requête
  const { error, value } = notificationFiltersSchema.validate(req.query);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { type, is_read, limit, offset, sort, order } = value;

  // Construction de la requête
  let query = dbAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', req.user.id);

  // Appliquer les filtres
  if (type) {
    query = query.eq('type', type);
  }

  if (typeof is_read === 'boolean') {
    query = query.eq('is_read', is_read);
  }

  // Tri et pagination
  query = query
    .order(sort, { ascending: order === 'asc' })
    .range(offset, offset + limit - 1);

  const { data: notifications, error: fetchError, count } = await query;

  if (fetchError) {
    logger.error('Erreur récupération notifications', { 
      userId: req.user.id, 
      error: fetchError 
    });
    throw new ValidationError('Erreur lors de la récupération des notifications');
  }

  // Compter les notifications non lues
  const { count: unreadCount } = await dbAdmin
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', req.user.id)
    .eq('is_read', false);

  res.json({
    success: true,
    data: {
      notifications: notifications || [],
      pagination: {
        total: count,
        limit,
        offset,
        has_more: count > offset + limit
      },
      stats: {
        unread_count: unreadCount || 0,
        total_count: count || 0
      }
    }
  });
}));

/**
 * GET /api/v1/notifications/unread
 * Récupérer uniquement les notifications non lues
 */
router.get('/unread', authenticateToken, asyncHandler(async (req, res) => {
  const { data: notifications, error } = await dbAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(50); // Limiter à 50 notifications non lues

  if (error) {
    logger.error('Erreur récupération notifications non lues', { 
      userId: req.user.id, 
      error 
    });
    throw new ValidationError('Erreur lors de la récupération des notifications');
  }

  res.json({
    success: true,
    data: {
      notifications: notifications || [],
      count: notifications?.length || 0
    }
  });
}));

/**
 * GET /api/v1/notifications/:id
 * Récupérer une notification spécifique
 */
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const notificationId = req.params.id;

  // Valider l'UUID
  if (!notificationId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
    throw new ValidationError('ID de notification invalide');
  }

  const { data: notification, error } = await dbAdmin
    .from('notifications')
    .select('*')
    .eq('id', notificationId)
    .eq('user_id', req.user.id)
    .single();

  if (error || !notification) {
    throw new NotFoundError('Notification non trouvée');
  }

  res.json({
    success: true,
    data: {
      notification
    }
  });
}));

/**
 * PUT /api/v1/notifications/:id/read
 * Marquer une notification comme lue
 */
router.put('/:id/read', authenticateToken, logUserAction('notification_read'), asyncHandler(async (req, res) => {
  const notificationId = req.params.id;

  // Valider l'UUID
  if (!notificationId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
    throw new ValidationError('ID de notification invalide');
  }

  // Vérifier que la notification appartient à l'utilisateur
  const { data: existingNotification } = await dbAdmin
    .from('notifications')
    .select('id, is_read')
    .eq('id', notificationId)
    .eq('user_id', req.user.id)
    .single();

  if (!existingNotification) {
    throw new NotFoundError('Notification non trouvée');
  }

  // Si déjà lue, pas besoin de mettre à jour
  if (existingNotification.is_read) {
    return res.json({
      success: true,
      message: 'Notification déjà marquée comme lue'
    });
  }

  // Marquer comme lue
  const { data: updatedNotification, error: updateError } = await dbAdmin
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('id', notificationId)
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (updateError) {
    logger.error('Erreur marquage notification comme lue', { 
      userId: req.user.id, 
      notificationId,
      error: updateError 
    });
    throw new ValidationError('Erreur lors du marquage de la notification');
  }

  res.json({
    success: true,
    message: 'Notification marquée comme lue',
    data: {
      notification: updatedNotification
    }
  });
}));

/**
 * PUT /api/v1/notifications/read-multiple
 * Marquer plusieurs notifications comme lues
 */
router.put('/read-multiple', authenticateToken, logUserAction('notifications_bulk_read'), asyncHandler(async (req, res) => {
  // Validation des données
  const { error, value } = markAsReadSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { notification_ids } = value;

  // Vérifier que toutes les notifications appartiennent à l'utilisateur
  const { data: existingNotifications } = await dbAdmin
    .from('notifications')
    .select('id')
    .eq('user_id', req.user.id)
    .in('id', notification_ids);

  const existingIds = existingNotifications?.map(n => n.id) || [];
  const invalidIds = notification_ids.filter(id => !existingIds.includes(id));

  if (invalidIds.length > 0) {
    throw new ValidationError(`Notifications non trouvées: ${invalidIds.join(', ')}`);
  }

  // Marquer toutes comme lues
  const { data: updatedNotifications, error: updateError } = await dbAdmin
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('user_id', req.user.id)
    .in('id', notification_ids)
    .eq('is_read', false) // Ne mettre à jour que celles qui ne sont pas déjà lues
    .select();

  if (updateError) {
    logger.error('Erreur marquage multiple notifications', { 
      userId: req.user.id, 
      notification_ids,
      error: updateError 
    });
    throw new ValidationError('Erreur lors du marquage des notifications');
  }

  res.json({
    success: true,
    message: `${updatedNotifications?.length || 0} notification(s) marquée(s) comme lue(s)`,
    data: {
      updated_count: updatedNotifications?.length || 0,
      notifications: updatedNotifications || []
    }
  });
}));

/**
 * PUT /api/v1/notifications/read-all
 * Marquer toutes les notifications comme lues
 */
router.put('/read-all', authenticateToken, logUserAction('notifications_read_all'), asyncHandler(async (req, res) => {
  // Marquer toutes les notifications non lues comme lues
  const { data: updatedNotifications, error: updateError } = await dbAdmin
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('user_id', req.user.id)
    .eq('is_read', false)
    .select();

  if (updateError) {
    logger.error('Erreur marquage toutes notifications', { 
      userId: req.user.id, 
      error: updateError 
    });
    throw new ValidationError('Erreur lors du marquage des notifications');
  }

  res.json({
    success: true,
    message: `${updatedNotifications?.length || 0} notification(s) marquée(s) comme lue(s)`,
    data: {
      updated_count: updatedNotifications?.length || 0
    }
  });
}));

/**
 * DELETE /api/v1/notifications/:id
 * Supprimer une notification
 */
router.delete('/:id', authenticateToken, logUserAction('notification_delete'), asyncHandler(async (req, res) => {
  const notificationId = req.params.id;

  // Valider l'UUID
  if (!notificationId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
    throw new ValidationError('ID de notification invalide');
  }

  // Vérifier que la notification appartient à l'utilisateur
  const { data: existingNotification } = await dbAdmin
    .from('notifications')
    .select('id')
    .eq('id', notificationId)
    .eq('user_id', req.user.id)
    .single();

  if (!existingNotification) {
    throw new NotFoundError('Notification non trouvée');
  }

  // Supprimer la notification
  const { error: deleteError } = await dbAdmin
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', req.user.id);

  if (deleteError) {
    logger.error('Erreur suppression notification', { 
      userId: req.user.id, 
      notificationId,
      error: deleteError 
    });
    throw new ValidationError('Erreur lors de la suppression de la notification');
  }

  res.json({
    success: true,
    message: 'Notification supprimée avec succès'
  });
}));

/**
 * GET /api/v1/notifications/stats
 * Récupérer les statistiques des notifications
 */
router.get('/stats', authenticateToken, asyncHandler(async (req, res) => {
  // Compter les notifications par type et statut
  const { data: stats, error } = await dbAdmin
    .from('notifications')
    .select('type, is_read')
    .eq('user_id', req.user.id);

  if (error) {
    logger.error('Erreur récupération stats notifications', { 
      userId: req.user.id, 
      error 
    });
    throw new ValidationError('Erreur lors de la récupération des statistiques');
  }

  // Calculer les statistiques
  const totalCount = stats?.length || 0;
  const unreadCount = stats?.filter(n => !n.is_read).length || 0;
  const readCount = totalCount - unreadCount;

  // Grouper par type
  const byType = stats?.reduce((acc, notification) => {
    const type = notification.type;
    if (!acc[type]) {
      acc[type] = { total: 0, unread: 0, read: 0 };
    }
    acc[type].total++;
    if (notification.is_read) {
      acc[type].read++;
    } else {
      acc[type].unread++;
    }
    return acc;
  }, {}) || {};

  res.json({
    success: true,
    data: {
      total_count: totalCount,
      unread_count: unreadCount,
      read_count: readCount,
      by_type: byType
    }
  });
}));

// =====================================================
// 📧 ROUTES ENVOI DE NOTIFICATIONS
// =====================================================

/**
 * POST /api/v1/notifications/send/email
 * Envoyer une notification par email
 */
router.post('/send/email', authenticateToken, logUserAction('send_email_notification'), asyncHandler(async (req, res) => {
  // Validation des données
  const { error, value } = sendEmailSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { to, subject, body, template, data } = value;

  try {
    // Envoyer l'email via le service
    const result = await emailService.sendEmail({
      to,
      subject,
      body,
      template,
      data: {
        ...data,
        user_id: req.user.id,
        user_name: req.user.full_name
      }
    });

    if (!result.success) {
      throw new Error(result.error || 'Erreur envoi email');
    }

    // Enregistrer la notification dans la base de données
    const { data: notification, error: dbError } = await dbAdmin
      .from('notifications')
      .insert([{
        user_id: req.user.id,
        type: 'email_sent',
        title: subject,
        message: `Email envoyé à ${to}`,
        data: {
          email_to: to,
          message_id: result.message_id,
          service: 'email'
        },
        is_read: false
      }])
      .select()
      .single();

    if (dbError) {
      logger.warn('Erreur enregistrement notification email', { 
        userId: req.user.id, 
        error: dbError 
      });
    }

    res.json({
      success: true,
      message: 'Email envoyé avec succès',
      data: {
        message_id: result.message_id,
        status: 'sent',
        to: to
      }
    });

  } catch (error) {
    logger.error('Erreur envoi email', { 
      userId: req.user.id, 
      to, 
      error: error.message 
    });
    throw new ValidationError(`Erreur envoi email: ${error.message}`);
  }
}));

/**
 * POST /api/v1/notifications/send/sms
 * Envoyer une notification par SMS
 */
router.post('/send/sms', authenticateToken, logUserAction('send_sms_notification'), asyncHandler(async (req, res) => {
  // Validation des données
  const { error, value } = sendSMSSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { to, message, type } = value;

  try {
    // Envoyer le SMS via le service
    const result = await smsService.sendSMS({
      to,
      message,
      type
    });

    if (!result.success) {
      throw new Error(result.error || 'Erreur envoi SMS');
    }

    // Enregistrer la notification dans la base de données
    const { data: notification, error: dbError } = await dbAdmin
      .from('notifications')
      .insert([{
        user_id: req.user.id,
        type: 'sms_sent',
        title: 'SMS envoyé',
        message: `SMS envoyé à ${to}`,
        data: {
          phone_to: to,
          message_id: result.message_id,
          service: 'sms',
          type: type
        },
        is_read: false
      }])
      .select()
      .single();

    if (dbError) {
      logger.warn('Erreur enregistrement notification SMS', { 
        userId: req.user.id, 
        error: dbError 
      });
    }

    res.json({
      success: true,
      message: 'SMS envoyé avec succès',
      data: {
        message_id: result.message_id,
        status: 'sent',
        to: to
      }
    });

  } catch (error) {
    logger.error('Erreur envoi SMS', { 
      userId: req.user.id, 
      to, 
      error: error.message 
    });
    throw new ValidationError(`Erreur envoi SMS: ${error.message}`);
  }
}));

/**
 * POST /api/v1/notifications/send/whatsapp
 * Envoyer une notification par WhatsApp
 */
router.post('/send/whatsapp', authenticateToken, logUserAction('send_whatsapp_notification'), asyncHandler(async (req, res) => {
  // Validation des données
  const { error, value } = sendWhatsAppSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { to, message, template, data } = value;

  try {
    // Envoyer le message WhatsApp via le service
    const result = await whatsappService.sendMessage(to, message, {
      template,
      data: {
        ...data,
        user_id: req.user.id,
        user_name: req.user.full_name
      }
    });

    if (!result.success) {
      throw new Error(result.error || 'Erreur envoi WhatsApp');
    }

    // Enregistrer la notification dans la base de données
    const { data: notification, error: dbError } = await dbAdmin
      .from('notifications')
      .insert([{
        user_id: req.user.id,
        type: 'whatsapp_sent',
        title: 'WhatsApp envoyé',
        message: `Message WhatsApp envoyé à ${to}`,
        data: {
          phone_to: to,
          message_id: result.message_id,
          service: 'whatsapp',
          template: template
        },
        is_read: false
      }])
      .select()
      .single();

    if (dbError) {
      logger.warn('Erreur enregistrement notification WhatsApp', { 
        userId: req.user.id, 
        error: dbError 
      });
    }

    res.json({
      success: true,
      message: 'Message WhatsApp envoyé avec succès',
      data: {
        message_id: result.message_id,
        status: 'sent',
        to: to
      }
    });

  } catch (error) {
    logger.error('Erreur envoi WhatsApp', { 
      userId: req.user.id, 
      to, 
      error: error.message 
    });
    throw new ValidationError(`Erreur envoi WhatsApp: ${error.message}`);
  }
}));

/**
 * POST /api/v1/notifications/test/:type
 * Tester un service de notification
 */
router.post('/test/:type', authenticateToken, asyncHandler(async (req, res) => {
  const { type } = req.params;
  
  if (!['email', 'sms', 'whatsapp'].includes(type)) {
    throw new ValidationError('Type de test invalide. Types supportés: email, sms, whatsapp');
  }

  const startTime = Date.now();
  let result;

  try {
    switch (type) {
      case 'email':
        result = await emailService.testConnection();
        break;
      case 'sms':
        result = await smsService.testConnection();
        break;
      case 'whatsapp':
        result = await whatsappService.checkStatus();
        break;
    }

    const responseTime = Date.now() - startTime;
    
    res.json({
      success: true,
      message: `Test ${type} réussi`,
      data: {
        service_status: result ? 'operational' : 'down',
        response_time: responseTime,
        last_test: new Date().toISOString(),
        details: result
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error(`Erreur test service ${type}`, { 
      userId: req.user.id, 
      error: error.message,
      responseTime
    });

    res.json({
      success: false,
      message: `Test ${type} échoué`,
      data: {
        service_status: 'down',
        response_time: responseTime,
        last_test: new Date().toISOString(),
        error: error.message
      }
    });
  }
}));

export default router;

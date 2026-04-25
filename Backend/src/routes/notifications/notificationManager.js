/**
 * GESTIONNAIRE DE NOTIFICATIONS
 * Gestion des notifications utilisateur (lecture, écriture, filtrage)
 */

import express from 'express';
import Joi from 'joi';
import { dbAdmin } from '../../config/db.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../middleware/errorHandler.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';
import { logUserAction } from '../../middleware/auth.js';
import { logger } from '../../utils/logger.js';

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

// =====================================================
// 📬 ROUTES GESTION NOTIFICATIONS
// =====================================================

/**
 * GET /api/v1/notifications
 * Obtenir les notifications de l'utilisateur
 */
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = notificationFiltersSchema.validate(req.query);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { type, is_read, limit, offset, sort, order } = value;

  try {
    // Construire la requête
    let query = dbAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id);

    // Appliquer les filtres
    if (type) {
      query = query.eq('type', type);
    }

    if (is_read !== undefined) {
      query = query.eq('is_read', is_read);
    }

    // Appliquer le tri
    query = query.order(sort, { ascending: order === 'asc' });

    // Appliquer la pagination
    query = query.range(offset, offset + limit - 1);

    const { data: notifications, error: fetchError } = await query;

    if (fetchError) {
      logger.error('Erreur récupération notifications:', { 
        userId: req.user.id, 
        error: fetchError 
      });
      throw new ValidationError('Erreur lors de la récupération des notifications');
    }

    // Obtenir le nombre total pour la pagination
    let countQuery = dbAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id);

    if (type) {
      countQuery = countQuery.eq('type', type);
    }

    if (is_read !== undefined) {
      countQuery = countQuery.eq('is_read', is_read);
    }

    const { count: totalCount } = await countQuery;

    res.json({
      success: true,
      message: 'Notifications récupérées',
      data: {
        notifications: notifications || [],
        pagination: {
          limit,
          offset,
          total: totalCount || 0,
          has_more: (offset + limit) < (totalCount || 0)
        }
      }
    });
  } catch (error) {
    logger.error('Erreur notifications:', { 
      userId: req.user.id, 
      error 
    });
    throw new ValidationError('Erreur lors de la récupération des notifications');
  }
}));

/**
 * POST /api/v1/notifications/mark-read
 * Marquer des notifications comme lues
 */
router.post('/mark-read', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = markAsReadSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { notification_ids } = value;

  try {
    // Vérifier que les notifications appartiennent à l'utilisateur
    const { data: notifications, error: fetchError } = await dbAdmin
      .from('notifications')
      .select('id, user_id, is_read')
      .in('id', notification_ids)
      .eq('user_id', req.user.id);

    if (fetchError) {
      logger.error('Erreur vérification notifications:', { 
        userId: req.user.id, 
        error: fetchError 
      });
      throw new ValidationError('Erreur lors de la vérification des notifications');
    }

    if (!notifications || notifications.length === 0) {
      throw new NotFoundError('Aucune notification trouvée');
    }

    // Filtrer seulement les notifications non lues
    const unreadNotifications = notifications.filter(n => !n.is_read);
    const unreadIds = unreadNotifications.map(n => n.id);

    if (unreadIds.length === 0) {
      return res.json({
        success: true,
        message: 'Toutes les notifications sont déjà lues',
        data: {
          marked_count: 0
        }
      });
    }

    // Marquer comme lues
    const { error: updateError } = await dbAdmin
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .in('id', unreadIds);

    if (updateError) {
      logger.error('Erreur marquage notifications lues:', { 
        userId: req.user.id, 
        notificationIds: unreadIds,
        error: updateError 
      });
      throw new ValidationError('Erreur lors du marquage des notifications comme lues');
    }

    logger.info('Notifications marquées comme lues', { 
      userId: req.user.id,
      markedCount: unreadIds.length
    });

    res.json({
      success: true,
      message: 'Notifications marquées comme lues',
      data: {
        marked_count: unreadIds.length,
        notification_ids: unreadIds
      }
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }
    logger.error('Erreur marquage notifications:', { 
      userId: req.user.id, 
      error 
    });
    throw new ValidationError('Erreur lors du marquage des notifications comme lues');
  }
}));

/**
 * POST /api/v1/notifications/mark-all-read
 * Marquer toutes les notifications comme lues
 */
router.post('/mark-all-read', authenticateToken, asyncHandler(async (req, res) => {
  try {
    // Marquer toutes les notifications non lues comme lues
    const { error: updateError } = await dbAdmin
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', req.user.id)
      .eq('is_read', false);

    if (updateError) {
      logger.error('Erreur marquage toutes notifications lues:', { 
        userId: req.user.id, 
        error: updateError 
      });
      throw new ValidationError('Erreur lors du marquage de toutes les notifications comme lues');
    }

    logger.info('Toutes les notifications marquées comme lues', { 
      userId: req.user.id
    });

    res.json({
      success: true,
      message: 'Toutes les notifications ont été marquées comme lues'
    });
  } catch (error) {
    logger.error('Erreur marquage toutes notifications:', { 
      userId: req.user.id, 
      error 
    });
    throw new ValidationError('Erreur lors du marquage de toutes les notifications comme lues');
  }
}));

/**
 * DELETE /api/v1/notifications/:notificationId
 * Supprimer une notification
 */
router.delete('/:notificationId', authenticateToken, asyncHandler(async (req, res) => {
  const notificationId = req.params.notificationId;

  // Valider l'UUID
  if (!notificationId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
    throw new ValidationError('ID de notification invalide');
  }

  try {
    // Vérifier que la notification appartient à l'utilisateur
    const { data: notification, error: fetchError } = await dbAdmin
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !notification) {
      throw new NotFoundError('Notification non trouvée');
    }

    // Supprimer la notification
    const { error: deleteError } = await dbAdmin
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (deleteError) {
      logger.error('Erreur suppression notification:', { 
        userId: req.user.id, 
        notificationId,
        error: deleteError 
      });
      throw new ValidationError('Erreur lors de la suppression de la notification');
    }

    logger.info('Notification supprimée', { 
      userId: req.user.id,
      notificationId
    });

    res.json({
      success: true,
      message: 'Notification supprimée avec succès'
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }
    logger.error('Erreur suppression notification:', { 
      userId: req.user.id, 
      notificationId,
      error 
    });
    throw new ValidationError('Erreur lors de la suppression de la notification');
  }
}));

/**
 * DELETE /api/v1/notifications
 * Supprimer toutes les notifications lues
 */
router.delete('/', authenticateToken, asyncHandler(async (req, res) => {
  const { delete_all } = req.query;

  if (delete_all === 'true') {
    // Supprimer toutes les notifications
    try {
      const { error: deleteError } = await dbAdmin
        .from('notifications')
        .delete()
        .eq('user_id', req.user.id);

      if (deleteError) {
        logger.error('Erreur suppression toutes notifications:', { 
          userId: req.user.id, 
          error: deleteError 
        });
        throw new ValidationError('Erreur lors de la suppression de toutes les notifications');
      }

      logger.info('Toutes les notifications supprimées', { 
        userId: req.user.id
      });

      res.json({
        success: true,
        message: 'Toutes les notifications ont été supprimées'
      });
    } catch (error) {
      logger.error('Erreur suppression toutes notifications:', { 
        userId: req.user.id, 
        error 
      });
      throw new ValidationError('Erreur lors de la suppression de toutes les notifications');
    }
  } else {
    // Supprimer seulement les notifications lues
    try {
      const { error: deleteError } = await dbAdmin
        .from('notifications')
        .delete()
        .eq('user_id', req.user.id)
        .eq('is_read', true);

      if (deleteError) {
        logger.error('Erreur suppression notifications lues:', { 
          userId: req.user.id, 
          error: deleteError 
        });
        throw new ValidationError('Erreur lors de la suppression des notifications lues');
      }

      logger.info('Notifications lues supprimées', { 
        userId: req.user.id
      });

      res.json({
        success: true,
        message: 'Notifications lues supprimées'
      });
    } catch (error) {
      logger.error('Erreur suppression notifications lues:', { 
        userId: req.user.id, 
        error 
      });
      throw new ValidationError('Erreur lors de la suppression des notifications lues');
    }
  }
}));

/**
 * GET /api/v1/notifications/unread-count
 * Obtenir le nombre de notifications non lues
 */
router.get('/unread-count', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { data: notifications, error: fetchError } = await dbAdmin
      .from('notifications')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('is_read', false);

    if (fetchError) {
      logger.error('Erreur comptage notifications non lues:', { 
        userId: req.user.id, 
        error: fetchError 
      });
      throw new ValidationError('Erreur lors du comptage des notifications non lues');
    }

    const unreadCount = notifications?.length || 0;

    res.json({
      success: true,
      message: 'Nombre de notifications non lues récupéré',
      data: {
        unread_count: unreadCount
      }
    });
  } catch (error) {
    logger.error('Erreur comptage notifications:', { 
      userId: req.user.id, 
      error 
    });
    throw new ValidationError('Erreur lors du comptage des notifications non lues');
  }
}));

/**
 * GET /api/v1/notifications/stats
 * Obtenir les statistiques des notifications
 */
router.get('/stats', authenticateToken, asyncHandler(async (req, res) => {
  try {
    // Obtenir les statistiques générales
    const { data: allNotifications, error: fetchError } = await dbAdmin
      .from('notifications')
      .select('type, is_read, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      logger.error('Erreur statistiques notifications:', { 
        userId: req.user.id, 
        error: fetchError 
      });
      throw new ValidationError('Erreur lors de la récupération des statistiques');
    }

    // Calculer les statistiques
    const stats = {
      total_notifications: allNotifications?.length || 0,
      unread_notifications: allNotifications?.filter(n => !n.is_read).length || 0,
      read_notifications: allNotifications?.filter(n => n.is_read).length || 0,
      notifications_by_type: {},
      recent_notifications: allNotifications?.slice(0, 10) || [],
      oldest_notification: allNotifications?.[allNotifications.length - 1]?.created_at || null,
      newest_notification: allNotifications?.[0]?.created_at || null
    };

    // Regrouper par type
    allNotifications?.forEach(notification => {
      const type = notification.type;
      stats.notifications_by_type[type] = (stats.notifications_by_type[type] || 0) + 1;
    });

    res.json({
      success: true,
      message: 'Statistiques des notifications récupérées',
      data: stats
    });
  } catch (error) {
    logger.error('Erreur statistiques notifications:', { 
      userId: req.user.id, 
      error 
    });
    throw new ValidationError('Erreur lors de la récupération des statistiques');
  }
}));

export default router;

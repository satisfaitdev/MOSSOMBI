/**
 * MODÈLES DE NOTIFICATIONS
 * Gestion des modèles et templates de notifications
 */

import express from 'express';
import Joi from 'joi';
import crypto from 'crypto';
import { dbAdmin } from '../../config/db.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../middleware/errorHandler.js';
import { authenticateToken, requireVerification } from '../../middleware/auth.js';
import { logUserAction } from '../../middleware/auth.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

// =====================================================
// 📋 SCHÉMAS DE VALIDATION
// =====================================================

const createTemplateSchema = Joi.object({
  name: Joi.string().min(1).max(100).required().messages({
    'string.min': 'Le nom du modèle ne peut pas être vide',
    'string.max': 'Le nom du modèle ne peut pas dépasser 100 caractères',
    'any.required': 'Nom du modèle requis'
  }),
  type: Joi.string()
    .valid('email', 'sms', 'whatsapp', 'push')
    .required(),
  subject: Joi.string().when('type', {
    is: 'email',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  content: Joi.string().min(1).max(10000).required().messages({
    'string.min': 'Le contenu ne peut pas être vide',
    'string.max': 'Le contenu ne peut pas dépasser 10000 caractères',
    'any.required': 'Contenu requis'
  }),
  variables: Joi.array()
    .items(Joi.object({
      name: Joi.string().required(),
      type: Joi.string().valid('string', 'number', 'boolean', 'date').required(),
      description: Joi.string().optional(),
      required: Joi.boolean().default(false),
      default: Joi.any().optional()
    }))
    .optional(),
  category: Joi.string()
    .valid('welcome', 'verification', 'security', 'profile_update', 'system', 'transaction', 'order', 'marketing')
    .default('system'),
  is_active: Joi.boolean().default(true)
});

const updateTemplateSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  subject: Joi.string().when('type', {
    is: 'email',
    then: Joi.optional(),
    otherwise: Joi.forbidden()
  }),
  content: Joi.string().min(1).max(10000).optional(),
  variables: Joi.array()
    .items(Joi.object({
      name: Joi.string().required(),
      type: Joi.string().valid('string', 'number', 'boolean', 'date').required(),
      description: Joi.string().optional(),
      required: Joi.boolean().default(false),
      default: Joi.any().optional()
    }))
    .optional(),
  category: Joi.string()
    .valid('welcome', 'verification', 'security', 'profile_update', 'system', 'transaction', 'order', 'marketing')
    .optional(),
  is_active: Joi.boolean().optional()
});

const renderTemplateSchema = Joi.object({
  template_id: Joi.string().uuid().required(),
  data: Joi.object().optional()
});

// =====================================================
// 📝 ROUTES MODÈLES DE NOTIFICATIONS
// =====================================================

/**
 * GET /api/v1/notifications/templates
 * Obtenir la liste des modèles de notifications
 */
router.get('/templates', authenticateToken, asyncHandler(async (req, res) => {
  const { type, category, is_active } = req.query;

  try {
    // Construire la requête
    let query = dbAdmin
      .from('notification_templates')
      .select('*')
      .order('name', { ascending: true });

    // Appliquer les filtres
    if (type) {
      query = query.eq('type', type);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data: templates, error: fetchError } = await query;

    if (fetchError) {
      logger.error('Erreur récupération modèles notifications:', { 
        userId: req.user.id, 
        error: fetchError 
      });
      throw new ValidationError('Erreur lors de la récupération des modèles');
    }

    res.json({
      success: true,
      message: 'Modèles de notifications récupérés',
      data: {
        templates: templates || [],
        total: templates?.length || 0
      }
    });
  } catch (error) {
    logger.error('Erreur modèles notifications:', { 
      userId: req.user.id, 
      error 
    });
    throw new ValidationError('Erreur lors de la récupération des modèles');
  }
}));

/**
 * GET /api/v1/notifications/templates/:templateId
 * Obtenir un modèle de notification spécifique
 */
router.get('/templates/:templateId', authenticateToken, asyncHandler(async (req, res) => {
  const templateId = req.params.templateId;

  // Valider l'UUID
  if (!templateId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
    throw new ValidationError('ID de modèle invalide');
  }

  try {
    const { data: template, error: fetchError } = await dbAdmin
      .from('notification_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (fetchError || !template) {
      throw new NotFoundError('Modèle de notification non trouvé');
    }

    res.json({
      success: true,
      message: 'Modèle de notification récupéré',
      data: template
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Erreur modèle notification:', { 
      userId: req.user.id, 
      templateId,
      error 
    });
    throw new ValidationError('Erreur lors de la récupération du modèle');
  }
}));

/**
 * POST /api/v1/notifications/templates
 * Créer un nouveau modèle de notification
 */
router.post('/templates', authenticateToken, requireVerification, asyncHandler(async (req, res) => {
  const { error, value } = createTemplateSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { name, type, subject, content, variables, category, is_active } = value;

  try {
    // Vérifier que l'utilisateur a le droit de créer des modèles
    const { data: user } = await dbAdmin
      .from('users')
      .select('id, metadata')
      .eq('id', req.user.id)
      .single();

    if (!user) {
      throw new NotFoundError('Utilisateur non trouvé');
    }

    // Vérifier les permissions
    const canCreateTemplate = user.metadata?.permissions?.includes('create_template') || 
                          user.metadata?.role === 'admin';

    if (!canCreateTemplate) {
      throw new ValidationError('Permission refusée pour créer des modèles');
    }

    // Vérifier que le nom n'existe pas déjà
    const { data: existingTemplate } = await dbAdmin
      .from('notification_templates')
      .select('id')
      .eq('name', name)
      .eq('type', type)
      .single();

    if (existingTemplate) {
      throw new ValidationError('Un modèle avec ce nom et ce type existe déjà');
    }

    // Créer le modèle
    const template = {
      id: crypto.randomUUID(),
      name,
      type,
      subject: type === 'email' ? subject : null,
      content,
      variables: variables || [],
      category,
      is_active,
      created_by: req.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: createdTemplate, error: createError } = await dbAdmin
      .from('notification_templates')
      .insert(template)
      .select('*')
      .single();

    if (createError) {
      logger.error('Erreur création modèle notification:', { 
        userId: req.user.id, 
        error: createError 
      });
      throw new ValidationError('Erreur lors de la création du modèle');
    }

    // Logger l'action
    await logUserAction(req.user.id, 'create_template', {
      template_id: createdTemplate.id,
      name,
      type
    });

    logger.info('Modèle de notification créé', { 
      userId: req.user.id,
      templateId: createdTemplate.id,
      name
    });

    res.status(201).json({
      success: true,
      message: 'Modèle de notification créé avec succès',
      data: createdTemplate
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Erreur création modèle:', { 
      userId: req.user.id, 
      error 
    });
    throw new ValidationError('Erreur lors de la création du modèle');
  }
}));

/**
 * PUT /api/v1/notifications/templates/:templateId
 * Mettre à jour un modèle de notification
 */
router.put('/templates/:templateId', authenticateToken, requireVerification, asyncHandler(async (req, res) => {
  const templateId = req.params.templateId;

  // Valider l'UUID
  if (!templateId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
    throw new ValidationError('ID de modèle invalide');
  }

  const { error, value } = updateTemplateSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  try {
    // Vérifier que le modèle existe
    const { data: existingTemplate, error: fetchError } = await dbAdmin
      .from('notification_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (fetchError || !existingTemplate) {
      throw new NotFoundError('Modèle de notification non trouvé');
    }

    // Vérifier que l'utilisateur a le droit de modifier des modèles
    const { data: user } = await dbAdmin
      .from('users')
      .select('id, metadata')
      .eq('id', req.user.id)
      .single();

    if (!user) {
      throw new NotFoundError('Utilisateur non trouvé');
    }

    const canUpdateTemplate = user.metadata?.permissions?.includes('update_template') || 
                          user.metadata?.role === 'admin' ||
                          existingTemplate.created_by === req.user.id;

    if (!canUpdateTemplate) {
      throw new ValidationError('Permission refusée pour modifier ce modèle');
    }

    // Mettre à jour le modèle
    const updateData = {
      ...value,
      updated_at: new Date().toISOString()
    };

    const { data: updatedTemplate, error: updateError } = await dbAdmin
      .from('notification_templates')
      .update(updateData)
      .eq('id', templateId)
      .select('*')
      .single();

    if (updateError) {
      logger.error('Erreur mise à jour modèle notification:', { 
        userId: req.user.id, 
        templateId,
        error: updateError 
      });
      throw new ValidationError('Erreur lors de la mise à jour du modèle');
    }

    // Logger l'action
    await logUserAction(req.user.id, 'update_template', {
      template_id: templateId,
      updated_fields: Object.keys(value)
    });

    logger.info('Modèle de notification mis à jour', { 
      userId: req.user.id,
      templateId
    });

    res.json({
      success: true,
      message: 'Modèle de notification mis à jour avec succès',
      data: updatedTemplate
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Erreur mise à jour modèle:', { 
      userId: req.user.id, 
      templateId,
      error 
    });
    throw new ValidationError('Erreur lors de la mise à jour du modèle');
  }
}));

/**
 * DELETE /api/v1/notifications/templates/:templateId
 * Supprimer un modèle de notification
 */
router.delete('/templates/:templateId', authenticateToken, requireVerification, asyncHandler(async (req, res) => {
  const templateId = req.params.templateId;

  // Valider l'UUID
  if (!templateId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
    throw new ValidationError('ID de modèle invalide');
  }

  try {
    // Vérifier que le modèle existe
    const { data: existingTemplate, error: fetchError } = await dbAdmin
      .from('notification_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (fetchError || !existingTemplate) {
      throw new NotFoundError('Modèle de notification non trouvé');
    }

    // Vérifier que l'utilisateur a le droit de supprimer des modèles
    const { data: user } = await dbAdmin
      .from('users')
      .select('id, metadata')
      .eq('id', req.user.id)
      .single();

    if (!user) {
      throw new NotFoundError('Utilisateur non trouvé');
    }

    const canDeleteTemplate = user.metadata?.permissions?.includes('delete_template') || 
                          user.metadata?.role === 'admin' ||
                          existingTemplate.created_by === req.user.id;

    if (!canDeleteTemplate) {
      throw new ValidationError('Permission refusée pour supprimer ce modèle');
    }

    // Vérifier que le modèle n'est pas utilisé
    const { count: usageCount } = await dbAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('template_id', templateId);

    if (usageCount && usageCount > 0) {
      throw new ValidationError('Ce modèle est utilisé par des notifications et ne peut pas être supprimé');
    }

    // Supprimer le modèle
    const { error: deleteError } = await dbAdmin
      .from('notification_templates')
      .delete()
      .eq('id', templateId);

    if (deleteError) {
      logger.error('Erreur suppression modèle notification:', { 
        userId: req.user.id, 
        templateId,
        error: deleteError 
      });
      throw new ValidationError('Erreur lors de la suppression du modèle');
    }

    // Logger l'action
    await logUserAction(req.user.id, 'delete_template', {
      template_id: templateId,
      template_name: existingTemplate.name
    });

    logger.info('Modèle de notification supprimé', { 
      userId: req.user.id,
      templateId
    });

    res.json({
      success: true,
      message: 'Modèle de notification supprimé avec succès'
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Erreur suppression modèle:', { 
      userId: req.user.id, 
      templateId,
      error 
    });
    throw new ValidationError('Erreur lors de la suppression du modèle');
  }
}));

/**
 * POST /api/v1/notifications/templates/render
 * Rendre un modèle avec des données
 */
router.post('/templates/render', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = renderTemplateSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { template_id, data } = value;

  try {
    // Récupérer le modèle
    const { data: template, error: fetchError } = await dbAdmin
      .from('notification_templates')
      .select('*')
      .eq('id', template_id)
      .single();

    if (fetchError || !template) {
      throw new NotFoundError('Modèle de notification non trouvé');
    }

    // Vérifier que le modèle est actif
    if (!template.is_active) {
      throw new ValidationError('Ce modèle n\'est pas actif');
    }

    // Rendre le modèle
    const renderedContent = renderTemplate(template, data);

    res.json({
      success: true,
      message: 'Modèle rendu avec succès',
      data: {
        template_id,
        type: template.type,
        subject: template.type === 'email' ? renderTemplate(template.subject || '', data) : null,
        content: renderedContent,
        rendered_at: new Date().toISOString()
      }
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Erreur rendu modèle:', { 
      userId: req.user.id, 
      template_id,
      error 
    });
    throw new ValidationError('Erreur lors du rendu du modèle');
  }
});

// =====================================================
// 📊 FONCTIONS UTILITAIRES
// =====================================================

/**
 * Rendre un modèle avec des données
 */
function renderTemplate(template, data) {
  let content = template.content;

  // Remplacer les variables dans le contenu
  if (template.variables && template.variables.length > 0) {
    template.variables.forEach(variable => {
      const value = getVariableValue(data, variable);
      const placeholder = `{{${variable.name}}}`;
      content = content.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&'), 'g'), value);
    });
  }

  return content;
}

/**
 * Obtenir la valeur d'une variable
 */
function getVariableValue(data, variable) {
  const value = data[variable.name];

  // Si la variable est requise mais non fournie
  if (variable.required && (value === undefined || value === null || value === '')) {
    throw new Error(`Variable requise '${variable.name}' non fournie`);
  }

  // Si la valeur est fournie, l'utiliser
  if (value !== undefined && value !== null && value !== '') {
    return formatValue(value, variable.type);
  }

  // Utiliser la valeur par défaut si disponible
  if (variable.default !== undefined) {
    return formatValue(variable.default, variable.type);
  }

  // Retourner une chaîne vide si la variable n'est pas requise
  return '';
}

/**
 * Formater une valeur selon son type
 */
function formatValue(value, type) {
  switch (type) {
    case 'string':
      return String(value);
    case 'number':
      return Number(value);
    case 'boolean':
      return Boolean(value);
    case 'date':
      return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
    default:
      return String(value);
  }
}

export default router;

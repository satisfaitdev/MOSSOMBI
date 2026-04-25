/**
 * ROUTES SAC À DOS (BACKPACK)
 * Gestion des objets et récompenses utilisateur
 */

import express from 'express';
import Joi from 'joi';
import { dbAdmin } from '../../config/db.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';
import { asyncHandler, ValidationError } from '../../middleware/errorHandler.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

// =====================================================
// 📋 SCHÉMAS DE VALIDATION
// =====================================================

const backpackItemSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).optional(),
  category: Joi.string().valid('achievement', 'reward', 'badge', 'item').required(),
  rarity: Joi.string().valid('common', 'rare', 'epic', 'legendary').default('common'),
  metadata: Joi.object().optional()
});

// =====================================================
// 🎒 ROUTES BACKPACK
// =====================================================

/**
 * GET /api/v1/profile/backpack
 * Récupérer le contenu du sac à dos
 */
router.get('/backpack', authenticateToken, asyncHandler(async (req, res) => {
  // Récupérer les vraies données du sac à dos
  const { data: backpackItems, error } = await dbAdmin
    .from('user_backpack')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Erreur récupération sac à dos', { userId: req.user.id, error });
    throw new ValidationError('Erreur lors de la récupération du sac à dos');
  }

  // Transformer les données pour le frontend
  const transformedItems = backpackItems?.map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    category: item.category,
    rarity: item.rarity,
    metadata: item.metadata,
    obtained_at: item.created_at,
    is_equipped: item.is_equipped || false,
    quantity: item.quantity || 1
  })) || [];

  res.json({
    success: true,
    message: 'Sac à dos récupéré',
    data: {
      items: transformedItems,
      total_items: transformedItems.length,
      categories: [...new Set(transformedItems.map(item => item.category))]
    }
  });
}));

/**
 * POST /api/v1/profile/backpack/items
 * Ajouter un objet au sac à dos
 */
router.post('/backpack/items', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = backpackItemSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  // Insérer le nouvel objet
  const { data: newItem, error: insertError } = await dbAdmin
    .from('user_backpack')
    .insert({
      user_id: req.user.id,
      name: value.name,
      description: value.description,
      category: value.category,
      rarity: value.rarity,
      metadata: value.metadata,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (insertError) {
    logger.error('Erreur ajout objet sac à dos', { 
      userId: req.user.id, 
      error: insertError 
    });
    throw new ValidationError('Erreur lors de l\'ajout de l\'objet');
  }

  logger.info('Objet ajouté au sac à dos', { 
    userId: req.user.id,
    itemName: value.name,
    category: value.category
  });

  res.status(201).json({
    success: true,
    message: 'Objet ajouté au sac à dos',
    data: {
      item: {
        id: newItem.id,
        name: newItem.name,
        description: newItem.description,
        category: newItem.category,
        rarity: newItem.rarity,
        metadata: newItem.metadata,
        obtained_at: newItem.created_at,
        is_equipped: newItem.is_equipped || false,
        quantity: newItem.quantity || 1
      }
    }
  });
}));

/**
 * PUT /api/v1/profile/backpack/items/:itemId/equip
 * Équiper un objet du sac à dos
 */
router.put('/backpack/items/:itemId/equip', authenticateToken, asyncHandler(async (req, res) => {
  const itemId = req.params.itemId;

  // Vérifier que l'objet appartient à l'utilisateur
  const { data: existingItem } = await dbAdmin
    .from('user_backpack')
    .select('id, category, is_equipped')
    .eq('id', itemId)
    .eq('user_id', req.user.id)
    .single();

  if (!existingItem) {
    throw new ValidationError('Objet non trouvé');
  }

  // Pour les badges, seulement un badge peut être équipé à la fois
  if (existingItem.category === 'badge') {
    // Déséquiper tous les autres badges
    await dbAdmin
      .from('user_backpack')
      .update({ is_equipped: false })
      .eq('user_id', req.user.id)
      .eq('category', 'badge')
      .neq('id', itemId);
  }

  // Équiper l'objet
  const { error: updateError } = await dbAdmin
    .from('user_backpack')
    .update({ is_equipped: true })
    .eq('id', itemId)
    .eq('user_id', req.user.id);

  if (updateError) {
    logger.error('Erreur équipement objet', { 
      userId: req.user.id, 
      itemId,
      error: updateError 
    });
    throw new ValidationError('Erreur lors de l\'équipement de l\'objet');
  }

  logger.info('Objet équipé', { 
    userId: req.user.id,
    itemId,
    category: existingItem.category
  });

  res.json({
    success: true,
    message: 'Objet équipé avec succès',
    data: {
      item_id: itemId,
      is_equipped: true
    }
  });
}));

/**
 * PUT /api/v1/profile/backpack/items/:itemId/unequip
 * Déséquiper un objet du sac à dos
 */
router.put('/backpack/items/:itemId/unequip', authenticateToken, asyncHandler(async (req, res) => {
  const itemId = req.params.itemId;

  // Vérifier que l'objet appartient à l'utilisateur
  const { data: existingItem } = await dbAdmin
    .from('user_backpack')
    .select('id')
    .eq('id', itemId)
    .eq('user_id', req.user.id)
    .single();

  if (!existingItem) {
    throw new ValidationError('Objet non trouvé');
  }

  // Déséquiper l'objet
  const { error: updateError } = await dbAdmin
    .from('user_backpack')
    .update({ is_equipped: false })
    .eq('id', itemId)
    .eq('user_id', req.user.id);

  if (updateError) {
    logger.error('Erreur déséquipement objet', { 
      userId: req.user.id, 
      itemId,
      error: updateError 
    });
    throw new ValidationError('Erreur lors du déséquipement de l\'objet');
  }

  logger.info('Objet déséquipé', { 
    userId: req.user.id,
    itemId
  });

  res.json({
    success: true,
    message: 'Objet déséquipé avec succès',
    data: {
      item_id: itemId,
      is_equipped: false
    }
  });
}));

/**
 * DELETE /api/v1/profile/backpack/items/:itemId
 * Supprimer un objet du sac à dos
 */
router.delete('/backpack/items/:itemId', authenticateToken, asyncHandler(async (req, res) => {
  const itemId = req.params.itemId;

  // Vérifier que l'objet appartient à l'utilisateur
  const { data: existingItem } = await dbAdmin
    .from('user_backpack')
    .select('id, name')
    .eq('id', itemId)
    .eq('user_id', req.user.id)
    .single();

  if (!existingItem) {
    throw new ValidationError('Objet non trouvé');
  }

  // Supprimer l'objet
  const { error: deleteError } = await dbAdmin
    .from('user_backpack')
    .delete()
    .eq('id', itemId)
    .eq('user_id', req.user.id);

  if (deleteError) {
    logger.error('Erreur suppression objet', { 
      userId: req.user.id, 
      itemId,
      error: deleteError 
    });
    throw new ValidationError('Erreur lors de la suppression de l\'objet');
  }

  logger.info('Objet supprimé du sac à dos', { 
    userId: req.user.id,
    itemId,
    itemName: existingItem.name
  });

  res.json({
    success: true,
    message: 'Objet supprimé du sac à dos',
    data: {
      deleted_item_id: itemId
    }
  });
}));

export default router;

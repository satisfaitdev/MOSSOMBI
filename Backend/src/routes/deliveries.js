import express from 'express';
import Joi from 'joi';
import crypto from 'crypto';
import { dbAdmin } from '../config/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler.js';

const router = express.Router();

// 🚀 GET /api/v1/deliveries/available - Obtenir les livraisons en attente (pour les livreurs)
router.get('/available', authenticateToken, asyncHandler(async (req, res) => {
  // Optionnellement, vérifier que l'utilisateur a le rôle "livreur" ou est membre d'une agence de type logistique
  const { data: deliveries, error } = await dbAdmin
    .from('deliveries')
    .select('*')
    .eq('status', 'pending_assignment')
    .limit(50);

  if (error) throw new Error(error.message);

  return res.json({ success: true, data: deliveries || [] });
}));

// 🚀 POST /api/v1/deliveries/:id/accept - Accepter une course
router.post('/:id/accept', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: delivery, error: fetchErr } = await dbAdmin
    .from('deliveries')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !delivery) throw new NotFoundError('Livraison introuvable');
  if (delivery.status !== 'pending_assignment') {
    throw new ValidationError('Cette course n\'est plus disponible');
  }

  const trackingHistory = Array.isArray(delivery.tracking_history) ? delivery.tracking_history : [];
  trackingHistory.push({
    status: 'assigned',
    timestamp: new Date().toISOString(),
    driver_id: req.user.id
  });

  const { data: updated, error: updateErr } = await dbAdmin
    .from('deliveries')
    .update({
      driver_user_id: req.user.id,
      status: 'assigned',
      tracking_history: trackingHistory,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('*')
    .single();

  if (updateErr) throw new Error(updateErr.message);

  return res.json({ success: true, data: updated });
}));

const statusSchema = Joi.object({
  status: Joi.string().valid('picked_up', 'in_transit', 'delivered').required(),
  lat: Joi.number().optional(),
  lng: Joi.number().optional()
});

// 🚀 PUT /api/v1/deliveries/:id/status - Mettre à jour le statut de la livraison
router.put('/:id/status', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { error, value } = statusSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message);

  const { data: delivery, error: fetchErr } = await dbAdmin
    .from('deliveries')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !delivery) throw new NotFoundError('Livraison introuvable');
  if (delivery.driver_user_id !== req.user.id) {
    throw new ValidationError('Vous n\'êtes pas le livreur assigné à cette course');
  }

  const trackingHistory = Array.isArray(delivery.tracking_history) ? delivery.tracking_history : [];
  trackingHistory.push({
    status: value.status,
    timestamp: new Date().toISOString(),
    lat: value.lat,
    lng: value.lng
  });

  const { data: updated, error: updateErr } = await dbAdmin
    .from('deliveries')
    .update({
      status: value.status,
      tracking_history: trackingHistory,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('*')
    .single();

  if (updateErr) throw new Error(updateErr.message);

  return res.json({ success: true, data: updated });
}));

export default router;

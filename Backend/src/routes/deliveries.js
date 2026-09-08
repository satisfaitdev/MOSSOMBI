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

const orderSchema = Joi.object({
  type: Joi.string().valid('gaz', 'colis', 'moving').required(),
  pickup_address: Joi.string().required(),
  dropoff_address: Joi.string().required(),
  pickup_lat: Joi.number().min(-90).max(90).optional(),
  pickup_lng: Joi.number().min(-180).max(180).optional(),
  dropoff_lat: Joi.number().min(-90).max(90).optional(),
  dropoff_lng: Joi.number().min(-180).max(180).optional(),
  description: Joi.string().max(500).allow('', null),
});

router.post('/order', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = orderSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message);

  const id = crypto.randomUUID();

  const { data: order, error: insertErr } = await dbAdmin
    .from('delivery_orders')
    .insert({
      id,
      user_id: req.user.id,
      type: value.type,
      pickup_address: value.pickup_address,
      dropoff_address: value.dropoff_address,
      pickup_lat: value.pickup_lat || null,
      pickup_lng: value.pickup_lng || null,
      dropoff_lat: value.dropoff_lat || null,
      dropoff_lng: value.dropoff_lng || null,
      description: value.description || '',
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertErr) throw new Error(insertErr.message);

  return res.status(201).json({ success: true, data: order });
}));

router.get('/my-orders', authenticateToken, asyncHandler(async (req, res) => {
  const { data, error } = await dbAdmin
    .from('delivery_orders')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return res.json({ success: true, data: data || [] });
}));

router.post('/my-orders/:id/cancel', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: order, error: fetchErr } = await dbAdmin
    .from('delivery_orders')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !order) throw new NotFoundError('Commande introuvable');
  if (order.user_id !== req.user.id) throw new ValidationError('Cette commande ne vous appartient pas');
  if (order.status !== 'pending') throw new ValidationError('Seules les commandes en attente peuvent être annulées');

  const { data: updated, error: updateErr } = await dbAdmin
    .from('delivery_orders')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (updateErr) throw new Error(updateErr.message);

  return res.json({ success: true, data: updated });
}));

export default router;

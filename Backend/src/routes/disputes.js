import express from 'express';
import Joi from 'joi';
import crypto from 'crypto';
import { dbAdmin } from '../config/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler.js';

const router = express.Router();

const createDisputeSchema = Joi.object({
  sale_id: Joi.string().guid({ version: 'uuidv4' }).required(),
  reason: Joi.string().min(5).max(1000).required()
});

// 🚀 POST /api/v1/disputes - Ouvrir un litige (Client)
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = createDisputeSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message);

  // Vérifier que la vente existe et appartient au client
  const { data: sale, error: saleErr } = await dbAdmin
    .from('agency_sales')
    .select('id, client_user_id')
    .eq('id', value.sale_id)
    .single();

  if (saleErr || !sale) throw new NotFoundError('Vente introuvable');
  if (sale.client_user_id !== req.user.id) {
    throw new ValidationError('Vous ne pouvez ouvrir un litige que pour vos propres achats');
  }

  // Vérifier qu'il n'y a pas déjà un litige ouvert pour cette vente
  const { data: existing } = await dbAdmin
    .from('disputes')
    .select('id')
    .eq('sale_id', value.sale_id)
    .neq('status', 'closed')
    .single();

  if (existing) {
    throw new ValidationError('Un litige est déjà en cours pour cette commande');
  }

  const now = new Date().toISOString();
  const dispute = {
    id: crypto.randomUUID(),
    sale_id: value.sale_id,
    complainant_user_id: req.user.id,
    reason: value.reason,
    status: 'open',
    admin_notes: '',
    created_at: now,
    updated_at: now
  };

  const { data: created, error: insertErr } = await dbAdmin
    .from('disputes')
    .insert(dispute)
    .select('*')
    .single();

  if (insertErr) throw new Error(insertErr.message);

  return res.status(201).json({ success: true, data: created });
}));

// 🚀 GET /api/v1/disputes/my - Voir mes litiges (Client)
router.get('/my', authenticateToken, asyncHandler(async (req, res) => {
  const { data, error } = await dbAdmin
    .from('disputes')
    .select('*')
    .eq('complainant_user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return res.json({ success: true, data: data || [] });
}));

export default router;

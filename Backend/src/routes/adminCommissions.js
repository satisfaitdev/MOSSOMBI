import express from 'express';
import Joi from 'joi';
import crypto from 'crypto';
import { dbAdmin } from '../config/db.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

function requireAdmin(req, res, next) {
  const role = req.user?.role;
  const isSuper = Boolean(req.user?.is_super_admin);
  const isAdminRole = role === 'admin' || role === 'super_admin';

  if (!req.user || (!isAdminRole && !isSuper)) {
    return res.status(403).json({
      success: false,
      error: 'Accès administrateur requis',
      code: 'ADMIN_REQUIRED',
    });
  }

  return next();
}

const contextValues = ['agent_self', 'host_under_agent', 'sub_agent_under_agent'];

const createSchema = Joi.object({
  service_id: Joi.string().trim().min(1).max(64).required(),
  context: Joi.string().valid(...contextValues).required(),
  app_pct: Joi.number().min(0).max(1).required(),
  worker_pct: Joi.number().min(0).max(1).required(),
  upline_pct: Joi.number().min(0).max(1).required(),
  is_active: Joi.boolean().optional(),
});

const updateSchema = Joi.object({
  app_pct: Joi.number().min(0).max(1).optional(),
  worker_pct: Joi.number().min(0).max(1).optional(),
  upline_pct: Joi.number().min(0).max(1).optional(),
  is_active: Joi.boolean().optional(),
}).min(1);

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', asyncHandler(async (req, res) => {
  const serviceId = req.query.service_id ? String(req.query.service_id) : null;
  const ctx = req.query.context ? String(req.query.context) : null;

  let query = dbAdmin.from('commission_rules').select('*').order('updated_at', { ascending: false });
  if (serviceId) query = query.eq('service_id', serviceId);
  if (ctx) query = query.eq('context', ctx);

  const { data, error } = await query;
  if (error) throw new ValidationError('Erreur lors de la récupération des règles');
  return res.json({ success: true, data: data || [] });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { error, value } = createSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const total = Number(value.app_pct) + Number(value.worker_pct) + Number(value.upline_pct);
  if (Math.abs(total - 1) > 1e-9) {
    throw new ValidationError('La somme app_pct + worker_pct + upline_pct doit être égale à 1');
  }

  const now = new Date().toISOString();
  const row = {
    id: crypto.randomUUID(),
    service_id: value.service_id,
    context: value.context,
    app_pct: value.app_pct,
    worker_pct: value.worker_pct,
    upline_pct: value.upline_pct,
    is_active: value.is_active ?? true,
    created_at: now,
    updated_at: now,
  };

  const { data, error: insertError } = await dbAdmin.from('commission_rules').insert(row).select('*').single();
  if (insertError) throw new ValidationError('Erreur lors de la création');

  return res.status(201).json({ success: true, data });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const { error, value } = updateSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const updates = {
    ...value,
    updated_at: new Date().toISOString(),
  };

  // if all pct provided, validate sum
  if (value.app_pct !== undefined && value.worker_pct !== undefined && value.upline_pct !== undefined) {
    const total = Number(value.app_pct) + Number(value.worker_pct) + Number(value.upline_pct);
    if (Math.abs(total - 1) > 1e-9) {
      throw new ValidationError('La somme app_pct + worker_pct + upline_pct doit être égale à 1');
    }
  }

  const { data, error: updateError } = await dbAdmin.from('commission_rules').update(updates).eq('id', id).select('*').single();
  if (updateError || !data) throw new NotFoundError('Règle introuvable');

  return res.json({ success: true, data });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const { data, error } = await dbAdmin.from('commission_rules').delete().eq('id', id).select('*').single();
  if (error || !data) throw new NotFoundError('Règle introuvable');
  return res.json({ success: true, data });
}));

export default router;

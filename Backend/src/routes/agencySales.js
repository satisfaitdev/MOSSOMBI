import express from 'express';
import Joi from 'joi';
import crypto from 'crypto';
import { dbAdmin } from '../config/db.js';
import { asyncHandler, ValidationError } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

async function getAgencyContext(userId) {
  const { data: owned, error: ownedErr } = await dbAdmin
    .from('agencies')
    .select('id, status')
    .eq('owner_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (ownedErr) throw new ValidationError("Erreur lors de la récupération de l'agence");
  const ownedAgency = Array.isArray(owned) && owned.length > 0 ? owned[0] : null;
  if (ownedAgency?.id && String(ownedAgency.status || '') === 'approved') {
    return { agency_id: ownedAgency.id, role_in_agency: 'owner', is_owner: true };
  }

  const { data, error } = await dbAdmin
    .from('agency_memberships')
    .select('agency_id, role_in_agency, status')
    .eq('user_id', userId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw new ValidationError("Erreur lors de la récupération de l'agence");
  const membership = Array.isArray(data) && data.length > 0 ? data[0] : null;
  if (!membership?.agency_id) throw new ValidationError("Vous n'êtes pas membre d'une agence approuvée");

  return { agency_id: membership.agency_id, role_in_agency: membership.role_in_agency, is_owner: false };
}

const serviceIdSchema = Joi.string().trim().min(1).max(64);

const createSaleSchema = Joi.object({
  service_id: serviceIdSchema.required(),
  amount: Joi.number().min(0).required(),
  currency: Joi.string().trim().min(1).max(8).default('XAF'),
  client_user_id: Joi.string().guid({ version: 'uuidv4' }).allow(null).optional(),
  client_name: Joi.string().allow('').max(200).optional(),
  client_phone: Joi.string().allow('').max(32).optional(),
  reference_id: Joi.string().allow('').max(128).optional(),
  reference_type: Joi.string().allow('').max(32).optional(),
  commission_amount: Joi.number().min(0).optional(),
  metadata: Joi.object().default({}),
});

const listSalesSchema = Joi.object({
  service_id: serviceIdSchema.optional(),
  delivery_status: Joi.string().valid('pending', 'delivered').optional(),
  limit: Joi.number().integer().min(1).max(100).default(20).optional(),
  offset: Joi.number().integer().min(0).default(0).optional(),
});

// POST /api/v1/agency-sales
router.post('/', asyncHandler(async (req, res) => {
  const { error, value } = createSaleSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const ctx = await getAgencyContext(req.user.id);
  const now = new Date().toISOString();

  const row = {
    id: crypto.randomUUID(),
    agency_id: ctx.agency_id,
    service_id: value.service_id,
    amount: value.amount,
    currency: value.currency,
    client_user_id: value.client_user_id ?? null,
    client_name: value.client_name || '',
    client_phone: value.client_phone || '',
    sold_by_user_id: req.user.id,
    reference_type: value.reference_type || '',
    reference_id: value.reference_id || '',
    commission_amount: value.commission_amount ?? null,
    metadata: value.metadata ?? {},
    created_at: now,
    updated_at: now,
  };

  const { data, error: dbErr } = await dbAdmin.from('agency_sales').insert(row).select('*').single();
  if (dbErr) throw new ValidationError(`Erreur lors de l'enregistrement de la vente: ${String(dbErr.message || '')}`);

  return res.status(201).json({ success: true, data });
}));

// GET /api/v1/agency-sales/recent?service_id=store&limit=5
router.get('/recent', asyncHandler(async (req, res) => {
  const ctx = await getAgencyContext(req.user.id);

  const service_id = req.query.service_id ? String(req.query.service_id) : null;
  const limitRaw = req.query.limit ? Number(req.query.limit) : 5;
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 5;

  let query = dbAdmin
    .from('agency_sales')
    .select('*')
    .eq('agency_id', ctx.agency_id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (service_id) query = query.eq('service_id', service_id);

  const { data, error } = await query;
  if (error) throw new ValidationError(`Erreur lors de la récupération des ventes: ${String(error.message || '')}`);

  return res.json({ success: true, data: data || [] });
}));

// GET /api/v1/agency-sales?service_id=store&delivery_status=pending&limit=20&offset=0
router.get('/', asyncHandler(async (req, res) => {
  const ctx = await getAgencyContext(req.user.id);
  const { error, value } = listSalesSchema.validate(req.query);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  let query = dbAdmin
    .from('agency_sales')
    .select('*')
    .eq('agency_id', ctx.agency_id)
    .order('created_at', { ascending: false })
    .range(value.offset, value.offset + value.limit - 1);

  if (value.service_id) query = query.eq('service_id', String(value.service_id));
  if (value.delivery_status) query = query.filter('metadata->>delivery_status', 'eq', String(value.delivery_status));

  const { data, error: dbErr } = await query;
  if (dbErr) throw new ValidationError(`Erreur lors de la récupération des ventes: ${String(dbErr.message || '')}`);

  const items = (Array.isArray(data) ? data : []).map((s) => {
    const meta = s?.metadata && typeof s.metadata === 'object' ? s.metadata : {};
    const delivery_status = String(meta?.delivery_status || 'pending');
    return { ...s, delivery_status };
  });

  return res.json({ success: true, data: { items } });
}));

// POST /api/v1/agency-sales/:id/confirm
router.post('/:id/confirm', asyncHandler(async (req, res) => {
  const ctx = await getAgencyContext(req.user.id);
  const id = String(req.params.id || '').trim();
  if (!id) throw new ValidationError('Identifiant invalide');

  const { data: existing, error: exErr } = await dbAdmin
    .from('agency_sales')
    .select('*')
    .eq('id', id)
    .eq('agency_id', ctx.agency_id)
    .single();

  if (exErr || !existing) throw new ValidationError('Vente introuvable');

  const meta = existing?.metadata && typeof existing.metadata === 'object' ? existing.metadata : {};
  const now = new Date().toISOString();
  const nextMeta = {
    ...meta,
    delivery_status: 'delivered',
    delivered_at: now,
  };

  const { data: updated, error: upErr } = await dbAdmin
    .from('agency_sales')
    .update({ metadata: nextMeta, updated_at: now })
    .eq('id', id)
    .eq('agency_id', ctx.agency_id)
    .select('*')
    .single();

  if (upErr || !updated) throw new ValidationError('Erreur lors de la confirmation');
  return res.json({ success: true, data: updated });
}));

// GET /api/v1/agency-sales/dashboard?service_id=store&period=7d
router.get('/dashboard', asyncHandler(async (req, res) => {
  const ctx = await getAgencyContext(req.user.id);

  const service_id = req.query.service_id ? String(req.query.service_id) : null;
  const period = req.query.period ? String(req.query.period) : '7d';

  let since = null;
  const now = new Date();
  if (period === 'today') {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    since = d.toISOString();
  } else if (period === '7d') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    since = d.toISOString();
  } else if (period === 'month') {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    since = d.toISOString();
  } else {
    throw new ValidationError('Période invalide. Utilisez today, 7d ou month');
  }

  let query = dbAdmin
    .from('agency_sales')
    .select('amount, commission_amount, created_at, service_id')
    .eq('agency_id', ctx.agency_id)
    .gte('created_at', since);

  if (service_id) query = query.eq('service_id', service_id);

  const { data, error } = await query;
  if (error) throw new ValidationError(`Erreur lors de la récupération des stats: ${String(error.message || '')}`);

  const rows = Array.isArray(data) ? data : [];
  const summary = rows.reduce(
    (acc, r) => {
      const amt = Number(r?.amount || 0);
      const comm = r?.commission_amount === null || r?.commission_amount === undefined ? 0 : Number(r.commission_amount);
      acc.sales_count += 1;
      acc.sales_amount += Number.isFinite(amt) ? amt : 0;
      acc.commission_amount += Number.isFinite(comm) ? comm : 0;
      return acc;
    },
    { sales_count: 0, sales_amount: 0, commission_amount: 0 }
  );

  return res.json({
    success: true,
    data: {
      agency_id: ctx.agency_id,
      service_id: service_id || 'all',
      period,
      since,
      ...summary,
    },
  });
}));

export default router;

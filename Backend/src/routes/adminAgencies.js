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

const createAgencySchema = Joi.object({
  name: Joi.string().trim().min(2).max(160).required(),
  city: Joi.string().allow('').max(160).optional(),
  address: Joi.string().allow('').max(300).optional(),
  logo_url: Joi.string().allow('').max(2000000).optional(),
  owner_user_id: Joi.string().guid({ version: 'uuidv4' }).allow(null).optional(),
  status: Joi.string().valid('pending', 'approved', 'rejected').optional(),
  is_active: Joi.boolean().optional(),
});

const updateAgencySchema = Joi.object({
  name: Joi.string().trim().min(2).max(160).optional(),
  city: Joi.string().allow('').max(160).optional(),
  address: Joi.string().allow('').max(300).optional(),
  logo_url: Joi.string().allow('').max(2000000).optional(),
  owner_user_id: Joi.string().guid({ version: 'uuidv4' }).allow(null).optional(),
  status: Joi.string().valid('pending', 'approved', 'rejected').optional(),
  is_active: Joi.boolean().optional(),
}).min(1);

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', asyncHandler(async (req, res) => {
  const status = req.query.status ? String(req.query.status) : null;
  const isActiveRaw = req.query.is_active;
  const q = req.query.q ? String(req.query.q).trim() : null;

  let query = dbAdmin.from('agencies').select('*').order('updated_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (isActiveRaw !== undefined) {
    const v = String(isActiveRaw).toLowerCase();
    if (v === 'true' || v === 'false') query = query.eq('is_active', v === 'true');
  }
  if (q) {
    query = query.or(`name.ilike.%${q}%,city.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw new ValidationError('Erreur lors de la récupération des agences');

  return res.json({ success: true, data: data || [] });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const { data, error } = await dbAdmin.from('agencies').select('*').eq('id', id).single();
  if (error || !data) throw new NotFoundError('Agence introuvable');
  return res.json({ success: true, data });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { error, value } = createAgencySchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const now = new Date().toISOString();
  const row = {
    id: crypto.randomUUID(),
    name: value.name,
    city: value.city || '',
    address: value.address || '',
    logo_url: value.logo_url || '',
    owner_user_id: value.owner_user_id ?? null,
    status: value.status || 'pending',
    is_active: value.is_active ?? false,
    created_at: now,
    updated_at: now,
  };

  const { data, error: insertError } = await dbAdmin.from('agencies').insert(row).select('*').single();
  if (insertError) throw new ValidationError('Erreur lors de la création');

  return res.status(201).json({ success: true, data });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const { error, value } = updateAgencySchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const updates = {
    ...value,
    updated_at: new Date().toISOString(),
  };

  const { data, error: updateError } = await dbAdmin.from('agencies').update(updates).eq('id', id).select('*').single();
  if (updateError || !data) throw new NotFoundError('Agence introuvable');

  return res.json({ success: true, data });
}));

router.post('/:id/approve', asyncHandler(async (req, res) => {
  const id = String(req.params.id);

  const { data: agency, error: agencyErr } = await dbAdmin
    .from('agencies')
    .select('*')
    .eq('id', id)
    .single();

  if (agencyErr || !agency) throw new NotFoundError('Agence introuvable');

  const now = new Date().toISOString();
  const { data: updated, error: updateErr } = await dbAdmin
    .from('agencies')
    .update({ status: 'approved', is_active: true, updated_at: now })
    .eq('id', id)
    .select('*')
    .single();

  if (updateErr || !updated) throw new NotFoundError('Agence introuvable');

  const ownerId = updated.owner_user_id ? String(updated.owner_user_id) : null;
  if (ownerId) {
    await dbAdmin.from('users').update({ role: 'agent', updated_at: now }).eq('id', ownerId);

    const { data: existingMembership } = await dbAdmin
      .from('agency_memberships')
      .select('*')
      .eq('agency_id', updated.id)
      .eq('user_id', ownerId)
      .single();

    if (existingMembership?.id) {
      await dbAdmin
        .from('agency_memberships')
        .update({ role_in_agency: 'agent', status: 'approved', updated_at: now })
        .eq('id', existingMembership.id);
    } else {
      await dbAdmin
        .from('agency_memberships')
        .insert({
          id: crypto.randomUUID(),
          agency_id: updated.id,
          user_id: ownerId,
          role_in_agency: 'agent',
          status: 'approved',
          created_at: now,
          updated_at: now,
        });
    }
  }

  return res.json({ success: true, data: updated });
}));

router.post('/:id/reject', asyncHandler(async (req, res) => {
  const id = String(req.params.id);

  const { data, error } = await dbAdmin
    .from('agencies')
    .update({ status: 'rejected', is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) throw new NotFoundError('Agence introuvable');
  return res.json({ success: true, data });
}));

router.get('/:id/service-requests', asyncHandler(async (req, res) => {
  const agencyId = String(req.params.id);

  const { data, error } = await dbAdmin
    .from('agency_service_requests')
    .select('*')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false });

  if (error) throw new ValidationError(`Erreur lors de la récupération des demandes: ${String(error?.message || '')}`);
  return res.json({ success: true, data: data || [] });
}));

router.get('/:id/documents', asyncHandler(async (req, res) => {
  const agencyId = String(req.params.id);

  const { data, error } = await dbAdmin
    .from('agency_documents')
    .select('*')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false });

  if (error) throw new ValidationError(`Erreur lors de la récupération des documents: ${String(error?.message || '')}`);
  return res.json({ success: true, data: data || [] });
}));

router.post('/service-requests/:id/approve', asyncHandler(async (req, res) => {
  const id = String(req.params.id);

  const { data, error } = await dbAdmin
    .from('agency_service_requests')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) throw new NotFoundError('Demande introuvable');
  return res.json({ success: true, data });
}));

router.post('/service-requests/:id/reject', asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const admin_notes = req.body?.admin_notes ? String(req.body.admin_notes) : '';

  const { data, error } = await dbAdmin
    .from('agency_service_requests')
    .update({ status: 'rejected', admin_notes, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) throw new NotFoundError('Demande introuvable');
  return res.json({ success: true, data });
}));

export default router;

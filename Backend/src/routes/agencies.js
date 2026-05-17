import express from 'express';
import Joi from 'joi';
import crypto from 'crypto';
import { dbAdmin } from '../config/db.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import { processProductImages, saveBase64Image } from '../utils/fileStorage.js';

const router = express.Router();

const applySchema = Joi.object({
  name: Joi.string().trim().min(2).max(160).required(),
  city: Joi.string().allow('').max(160).optional(),
  address: Joi.string().allow('').max(300).optional(),
  logo_url: Joi.string().allow('').max(2000000).optional(),
  services: Joi.array()
    .items(
      Joi.object({
        service_id: Joi.string().trim().min(1).max(64).required(),
        payload_json: Joi.object().default({}),
      })
    )
    .default([]),
  documents: Joi.array()
    .items(
      Joi.object({
        service_id: Joi.string().allow('').max(64).default(''),
        doc_type: Joi.string().trim().min(1).max(64).required(),
        file_url: Joi.string().trim().min(1).max(2000000).required(),
      })
    )
    .default([]),
  latitude: Joi.number().allow(null).optional(),
  longitude: Joi.number().allow(null).optional(),
  use_internal_fleet_only: Joi.boolean().default(false).optional(),
});

const joinByUserDisplaySchema = Joi.object({
  user_id_display: Joi.string().trim().min(4).max(32).required(),
  role: Joi.string().valid('agent', 'sub_agent').optional(),
});

const membershipActionSchema = Joi.object({
  notes: Joi.string().allow('').max(500).optional(),
});

const updateMyAgencySchema = Joi.object({
  name: Joi.string().trim().min(2).max(160).optional(),
  city: Joi.string().allow('').max(160).optional(),
  address: Joi.string().allow('').max(300).optional(),
  logo_url: Joi.string().allow('').max(2000000).optional(),
  latitude: Joi.number().allow(null).optional(),
  longitude: Joi.number().allow(null).optional(),
  use_internal_fleet_only: Joi.boolean().optional(),
}).min(1);

const createMyServiceRequestSchema = Joi.object({
  service_id: Joi.string().trim().min(1).max(64).required(),
  payload_json: Joi.object().default({}),
});

const inviteMemberSchema = Joi.object({
  user_id_display: Joi.string().trim().min(4).max(32).required(),
  role: Joi.string().valid('agent', 'sub_agent').optional(),
  role_in_agency: Joi.string().valid('host', 'sub_agent', 'agent').default('host'),
}).required();

async function getMyAgencyContext(userId) {
  const { data: owned, error: ownedErr } = await dbAdmin
    .from('agencies')
    .select('*')
    .eq('owner_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (ownedErr) throw new ValidationError('Erreur lors de la récupération');
  const ownedAgency = Array.isArray(owned) && owned.length > 0 ? owned[0] : null;
  if (ownedAgency?.id) {
    return {
      agency: ownedAgency,
      isOwner: true,
      role_in_agency: 'owner',
      membership: null,
    };
  }

  const { data: memberships, error: mErr } = await dbAdmin
    .from('agency_memberships')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(1);

  if (mErr) throw new ValidationError('Erreur lors de la récupération');
  const membership = Array.isArray(memberships) && memberships.length > 0 ? memberships[0] : null;
  if (!membership?.agency_id) {
    return { agency: null, isOwner: false, role_in_agency: null, membership: null };
  }

  const { data: agency, error: agErr } = await dbAdmin
    .from('agencies')
    .select('*')
    .eq('id', membership.agency_id)
    .single();

  if (agErr || !agency?.id) throw new NotFoundError('Agence introuvable');

  return {
    agency,
    isOwner: false,
    role_in_agency: String(membership.role_in_agency || ''),
    membership,
  };
}

async function assertCanManageMemberships({ agencyId, userId }) {
  const { data: agency } = await dbAdmin.from('agencies').select('*').eq('id', agencyId).single();
  if (!agency?.id) throw new NotFoundError('Agence introuvable');

  if (String(agency.owner_user_id || '') === String(userId)) {
    return { agency, managerMembership: null };
  }

  const { data: managerMembership } = await dbAdmin
    .from('agency_memberships')
    .select('*')
    .eq('agency_id', agencyId)
    .eq('user_id', userId)
    .single();

  const role = String(managerMembership?.role_in_agency || '');
  const status = String(managerMembership?.status || '');

  if (status !== 'approved' || !['agent', 'host'].includes(role)) {
    throw new ValidationError('Accès refusé');
  }

  return { agency, managerMembership };
}

router.use(authenticateToken);

// POST /api/v1/agencies/apply
router.post('/apply', asyncHandler(async (req, res) => {
  const { error, value } = applySchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const now = new Date().toISOString();

  // Un utilisateur ne peut pas avoir plusieurs agences.
  // Si l'agence existante est rejetée, on autorise une re-soumission en réutilisant la même agence.
  const { data: existingAgency } = await dbAdmin
    .from('agencies')
    .select('*')
    .eq('owner_user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (existingAgency?.id) {
    const status = String(existingAgency.status || '');
    if (status === 'pending' || status === 'approved') {
      throw new ValidationError('Vous avez déjà une agence en cours de validation ou active');
    }

    if (status !== 'rejected') {
      throw new ValidationError('Agence existante invalide');
    }

    const { data: updatedAgency, error: upErr } = await dbAdmin
      .from('agencies')
      .update({
        name: value.name,
        city: value.city || '',
        address: value.address || '',
        logo_url: value.logo_url || '',
        latitude: value.latitude,
        longitude: value.longitude,
        use_internal_fleet_only: value.use_internal_fleet_only ?? false,
        status: 'pending',
        is_active: false,
        updated_at: now,
      })
      .eq('id', existingAgency.id)
      .select('*')
      .single();

    if (upErr || !updatedAgency) throw new ValidationError('Erreur lors de la mise à jour de la demande agence');

    // Reset services/docs associés (best-effort)
    try {
      await dbAdmin.from('agency_service_requests').delete().eq('agency_id', existingAgency.id);
    } catch {
      // ignore
    }
    try {
      await dbAdmin.from('agency_documents').delete().eq('agency_id', existingAgency.id);
    } catch {
      // ignore
    }

    // Créer demandes de services (pending)
    for (const s of value.services || []) {
      await dbAdmin.from('agency_service_requests').insert({
        id: crypto.randomUUID(),
        agency_id: existingAgency.id,
        requested_by_user_id: req.user.id,
        service_id: s.service_id,
        payload_json: s.payload_json || {},
        status: 'pending',
        admin_notes: '',
        created_at: now,
        updated_at: now,
      });
    }

    // Documents (pending)
    for (const d of value.documents || []) {
      await dbAdmin.from('agency_documents').insert({
        id: crypto.randomUUID(),
        agency_id: existingAgency.id,
        user_id: req.user.id,
        service_id: d.service_id || '',
        doc_type: d.doc_type,
        file_url: d.file_url,
        status: 'pending',
        created_at: now,
        updated_at: now,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Demande agence envoyée',
      data: updatedAgency,
    });
  }

  const agencyId = crypto.randomUUID();

  const agencyRow = {
    id: agencyId,
    name: value.name,
    city: value.city || '',
    address: value.address || '',
    logo_url: value.logo_url || '',
    owner_user_id: req.user.id,
    latitude: value.latitude,
    longitude: value.longitude,
    use_internal_fleet_only: value.use_internal_fleet_only ?? false,
    status: 'pending',
    is_active: false,
    created_at: now,
    updated_at: now,
  };

  const { data: createdAgency, error: insertErr } = await dbAdmin
    .from('agencies')
    .insert(agencyRow)
    .select('*')
    .single();

  if (insertErr || !createdAgency) {
    throw new ValidationError('Erreur lors de la création de la demande agence');
  }

  // Créer membership owner (pending)
  await dbAdmin.from('agency_memberships').insert({
    id: crypto.randomUUID(),
    agency_id: agencyId,
    user_id: req.user.id,
    role_in_agency: 'agent',
    status: 'approved',
    created_at: now,
    updated_at: now,
  });

  // Créer demandes de services (pending) - chaque service doit être approuvé par admin
  for (const s of value.services || []) {
    await dbAdmin.from('agency_service_requests').insert({
      id: crypto.randomUUID(),
      agency_id: agencyId,
      requested_by_user_id: req.user.id,
      service_id: s.service_id,
      payload_json: s.payload_json || {},
      status: 'pending',
      admin_notes: '',
      created_at: now,
      updated_at: now,
    });
  }

  // Documents (pending)
  for (const d of value.documents || []) {
    await dbAdmin.from('agency_documents').insert({
      id: crypto.randomUUID(),
      agency_id: agencyId,
      user_id: req.user.id,
      service_id: d.service_id || '',
      doc_type: d.doc_type,
      file_url: d.file_url,
      status: 'pending',
      created_at: now,
      updated_at: now,
    });
  }

  return res.status(201).json({
    success: true,
    message: 'Demande agence envoyée',
    data: createdAgency,
  });
}));

// POST /api/v1/agencies/join-by-user-display
// Rejoindre l'agence d'un agent/owner via son identifiant public (ex: MSB-244403)
router.post('/join-by-user-display', asyncHandler(async (req, res) => {
  const { error, value } = joinByUserDisplaySchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const raw = String(value.user_id_display).trim().toUpperCase();
  const nowIso = new Date().toISOString();

  const { data: owner, error: ownerErr } = await dbAdmin
    .from('users')
    .select('id,user_id_display')
    .eq('user_id_display', raw)
    .single();

  if (ownerErr || !owner) throw new NotFoundError('Identifiant utilisateur invalide');
  if (String(owner.id) === String(req.user.id)) throw new ValidationError('Vous ne pouvez pas rejoindre votre propre agence');

  const { data: agencies, error: agErr } = await dbAdmin
    .from('agencies')
    .select('*')
    .eq('owner_user_id', owner.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(1);

  if (agErr) throw new ValidationError('Erreur lors de la récupération de l\'agence');
  const agency = Array.isArray(agencies) ? agencies[0] : null;
  if (!agency?.id) throw new NotFoundError('Aucune agence active trouvée pour cet utilisateur');

  const { data: otherMemberships } = await dbAdmin
    .from('agency_memberships')
    .select('*')
    .eq('user_id', req.user.id)
    .in('status', ['pending', 'approved', 'active'])
    .order('created_at', { ascending: false })
    .limit(25);

  const other = (Array.isArray(otherMemberships) ? otherMemberships : []).find((m) => String(m?.agency_id || '') !== String(agency.id));
  if (other?.id) {
    throw new ValidationError('Vous appartenez déjà à une autre agence');
  }

  const { data: existingMembership } = await dbAdmin
    .from('agency_memberships')
    .select('*')
    .eq('agency_id', agency.id)
    .eq('user_id', req.user.id)
    .single();

  if (existingMembership?.id) {
    return res.json({
      success: true,
      message: 'Vous êtes déjà membre de cette agence',
      data: { agency, membership: existingMembership },
    });
  }

  const membership = {
    id: crypto.randomUUID(),
    agency_id: agency.id,
    user_id: req.user.id,
    role_in_agency: value.role || 'agent',
    status: 'pending',
    created_at: nowIso,
    updated_at: nowIso,
  };

  await dbAdmin.from('agency_memberships').insert(membership);

  return res.status(201).json({
    success: true,
    message: 'Demande d\'adhésion envoyée',
    data: { agency, membership },
  });
}));

// DELETE /api/v1/agencies/memberships/:id
// PATCH /api/v1/agencies/memberships/:id/role
router.patch('/memberships/:id/role', asyncHandler(async (req, res) => {
  const membershipId = String(req.params.id);
  const role = req.body.role;
  await dbAdmin.from('agency_memberships').update({ role_in_agency: role, updated_at: new Date().toISOString() }).eq('id', membershipId);
  return res.json({ success: true, message: 'Role mis a jour avec succes' });
}));

// PATCH /api/v1/agencies/memberships/:id/tasks
router.patch('/memberships/:id/tasks', asyncHandler(async (req, res) => {
  const membershipId = String(req.params.id);
  const tasks = req.body.tasks || {};
  await dbAdmin.from('agency_memberships').update({ service_permissions: tasks, updated_at: new Date().toISOString() }).eq('id', membershipId);
  return res.json({ success: true, message: 'Taches mises a jour avec succes' });
}));

router.delete('/memberships/:id', asyncHandler(async (req, res) => {
  const membershipId = String(req.params.id);
  await dbAdmin.from('agency_memberships').delete().eq('id', membershipId);
  return res.json({ success: true, message: 'Membre retir? avec succs' });
}));

// GET /api/v1/agencies/memberships/pending
// Liste les demandes d'adhésion en attente pour l'agence que l'utilisateur gère.
router.get('/memberships/pending', asyncHandler(async (req, res) => {
  // V1: on se base sur l'agence dont l'utilisateur est owner en priorité,
  // sinon la première agence où il est agent/host approuvé.
  let managedAgencyId = null;

  const { data: owned } = await dbAdmin
    .from('agencies')
    .select('id')
    .eq('owner_user_id', req.user.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(1);

  if (Array.isArray(owned) && owned[0]?.id) managedAgencyId = owned[0].id;

  if (!managedAgencyId) {
    const { data: memberships } = await dbAdmin
      .from('agency_memberships')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(25);

    const m = (Array.isArray(memberships) ? memberships : []).find((x) => ['agent', 'host'].includes(String(x.role_in_agency || '')));
    if (m?.agency_id) managedAgencyId = m.agency_id;
  }

  if (!managedAgencyId) {
    return res.json({ success: true, data: { agency_id: null, items: [] } });
  }

  await assertCanManageMemberships({ agencyId: managedAgencyId, userId: req.user.id });

  const { data: pending, error } = await dbAdmin
    .from('agency_memberships')
    .select('*')
    .eq('agency_id', managedAgencyId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) throw new ValidationError('Erreur lors du chargement des demandes');

  const items = Array.isArray(pending) ? pending : [];
  const enriched = [];

  for (const m of items) {
    let user = null;
    try {
      const { data: u } = await dbAdmin
        .from('users')
        .select('id,full_name,phone,user_id_display,avatar_url')
        .eq('id', m.user_id)
        .single();
      if (u?.id) user = u;
    } catch {
      // ignore
    }
    enriched.push({ ...m, user });
  }

  return res.json({ success: true, data: { agency_id: managedAgencyId, items: enriched } });
}));

// POST /api/v1/agencies/memberships/:id/approve
router.post('/memberships/:id/approve', asyncHandler(async (req, res) => {
  const membershipId = String(req.params.id);
  const { error } = membershipActionSchema.validate(req.body || {});
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const { data: membership, error: mErr } = await dbAdmin
    .from('agency_memberships')
    .select('*')
    .eq('id', membershipId)
    .single();

  if (mErr || !membership) throw new NotFoundError('Demande introuvable');

  await assertCanManageMemberships({ agencyId: membership.agency_id, userId: req.user.id });

  const now = new Date().toISOString();
  const { data: updated, error: upErr } = await dbAdmin
    .from('agency_memberships')
    .update({ status: 'approved', updated_at: now })
    .eq('id', membershipId)
    .select('*')
    .single();

  if (upErr || !updated) throw new ValidationError('Erreur lors de la validation');
  return res.json({ success: true, data: updated });
}));

// POST /api/v1/agencies/memberships/:id/reject
router.post('/memberships/:id/reject', asyncHandler(async (req, res) => {
  const membershipId = String(req.params.id);
  const { error } = membershipActionSchema.validate(req.body || {});
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const { data: membership, error: mErr } = await dbAdmin
    .from('agency_memberships')
    .select('*')
    .eq('id', membershipId)
    .single();

  if (mErr || !membership) throw new NotFoundError('Demande introuvable');

  await assertCanManageMemberships({ agencyId: membership.agency_id, userId: req.user.id });

  const now = new Date().toISOString();
  const { data: updated, error: upErr } = await dbAdmin
    .from('agency_memberships')
    .update({ status: 'rejected', updated_at: now })
    .eq('id', membershipId)
    .select('*')
    .single();

  if (upErr || !updated) throw new ValidationError('Erreur lors du rejet');
  return res.json({ success: true, data: updated });
}));

// PUT /api/v1/agencies/my
// PATCH /api/v1/agencies/my
router.route('/my')
  .put(asyncHandler(async (req, res) => {
    const { error, value } = updateMyAgencySchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message, error.details);

    const ctx = await getMyAgencyContext(req.user.id);
    if (!ctx?.agency?.id) throw new NotFoundError('Agence introuvable');
    if (!ctx.isOwner) throw new ValidationError('Accès refusé');
    const agency = ctx.agency;

    const updates = {
      ...value,
      updated_at: new Date().toISOString(),
    };

    const { data: updated, error: upErr } = await dbAdmin
      .from('agencies')
      .update(updates)
      .eq('id', agency.id)
      .select('*')
      .single();

    if (upErr || !updated) throw new ValidationError('Erreur lors de la mise à jour');
    return res.json({ success: true, data: updated });
  }))
  .patch(asyncHandler(async (req, res) => {
    const { error, value } = updateMyAgencySchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message, error.details);

    const ctx = await getMyAgencyContext(req.user.id);
    if (!ctx?.agency?.id) throw new NotFoundError('Agence introuvable');
    if (!ctx.isOwner) throw new ValidationError('Accès refusé');
    const agency = ctx.agency;

    const updates = {
      ...value,
      updated_at: new Date().toISOString(),
    };

    const { data: updated, error: upErr } = await dbAdmin
      .from('agencies')
      .update(updates)
      .eq('id', agency.id)
      .select('*')
      .single();

    if (upErr || !updated) throw new ValidationError('Erreur lors de la mise à jour');
    return res.json({ success: true, data: updated });
  }));

// POST /api/v1/agencies/my/service-requests
router.post('/my/service-requests', asyncHandler(async (req, res) => {
  const { error, value } = createMyServiceRequestSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const ctx = await getMyAgencyContext(req.user.id);
  if (!ctx?.agency?.id) throw new NotFoundError('Agence introuvable');
  if (!ctx.isOwner) throw new ValidationError('Accès refusé');
  const agency = ctx.agency;

  const now = new Date().toISOString();
  const row = {
    id: crypto.randomUUID(),
    agency_id: agency.id,
    requested_by_user_id: req.user.id,
    service_id: value.service_id,
    payload_json: value.payload_json || {},
    status: 'pending',
    admin_notes: '',
    created_at: now,
    updated_at: now,
  };

  const { data: created, error: insertErr } = await dbAdmin
    .from('agency_service_requests')
    .insert(row)
    .select('*')
    .single();

  if (insertErr || !created) throw new ValidationError('Erreur lors de la demande');
  return res.status(201).json({ success: true, data: created });
}));

// DELETE /api/v1/agencies/my/service-requests/:id
router.delete('/my/service-requests/:id', asyncHandler(async (req, res) => {
  const id = String(req.params.id);

  const ctx = await getMyAgencyContext(req.user.id);
  if (!ctx?.agency?.id) throw new NotFoundError('Agence introuvable');
  if (!ctx.isOwner) throw new ValidationError('Accès refusé');
  const agency = ctx.agency;

  const { data: existing, error: exErr } = await dbAdmin
    .from('agency_service_requests')
    .select('*')
    .eq('id', id)
    .eq('agency_id', agency.id)
    .single();

  if (exErr || !existing) throw new NotFoundError('Demande introuvable');

  const { error: delErr } = await dbAdmin
    .from('agency_service_requests')
    .delete()
    .eq('id', id)
    .eq('agency_id', agency.id);

  if (delErr) throw new ValidationError('Erreur lors de la suppression');
  return res.json({ success: true, data: { id } });
}));

// POST /api/v1/agencies/my/leave
router.post('/my/leave', asyncHandler(async (req, res) => {
  const ctx = await getMyAgencyContext(req.user.id);
  if (!ctx?.agency?.id) throw new NotFoundError('Agence introuvable');
  if (ctx.isOwner) throw new ValidationError("Le propriétaire ne peut pas quitter son agence");

  const membershipId = String(ctx.membership?.id || '');
  if (!membershipId) throw new NotFoundError('Membership introuvable');

  const now = new Date().toISOString();
  const { data: updated, error: upErr } = await dbAdmin
    .from('agency_memberships')
    .update({ status: 'left', updated_at: now })
    .eq('id', membershipId)
    .select('*')
    .single();

  if (upErr || !updated) throw new ValidationError("Erreur lors de l'opération");
  return res.json({ success: true, data: updated });
}));

const createProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(160).required(),
  description: Joi.string().allow('').max(2000).optional(),
  price: Joi.number().min(0).required(),
  in_stock: Joi.boolean().default(true),
  country: Joi.string().allow('').max(64).optional(),
  delivery_time: Joi.string().allow('').max(64).optional(),
  image_url: Joi.string().allow('').max(2000000).optional(),
  shipping_unit: Joi.string().valid('kg', 'cbm').default('kg').optional(),
  shipping_value: Joi.number().min(0).default(0).optional(),
  
  // Nouveaux champs pour métadonnées
  category: Joi.string().allow('', null).optional(),
  brand: Joi.string().allow('', null).optional(),
  gallery_urls: Joi.array().items(Joi.string().allow('', null)).allow(null).optional(),
  video_url: Joi.string().allow('', null).optional(),
  specifications: Joi.object().allow(null).optional(),
  variants: Joi.array().items(Joi.object()).allow(null).optional(),
  stock_quantity: Joi.number().integer().min(0).optional(),
  currency: Joi.string().default('XAF').optional(),
  featured: Joi.boolean().optional(),
  promotion: Joi.object().allow(null).optional(),
}).unknown(true);

// POST /api/v1/agencies/my/products
router.post('/my/products', asyncHandler(async (req, res) => {
  const { error, value } = createProductSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const ctx = await getMyAgencyContext(req.user.id);
  if (!ctx?.agency?.id) throw new NotFoundError('Agence introuvable');
  // Need to be owner or host/agent to add product
  await assertCanManageMemberships({ agencyId: ctx.agency.id, userId: req.user.id });

  const now = new Date().toISOString();

  // Convert base64 images to files stored on disk
  const processedGallery = processProductImages(value.gallery_urls || [], 'products');
  
  // Process main image_url if it's base64
  let mainImageUrl = value.image_url || '';
  if (mainImageUrl && mainImageUrl.startsWith('data:image/')) {
    const saved = saveBase64Image(mainImageUrl, 'products');
    if (saved) mainImageUrl = saved;
  }
  
  // Store all extra data in the metadata JSONB column
  const metadata = {
    currency: value.currency || 'XAF',
    media: {
      images: processedGallery,
      video: value.video_url || null,
    },
    category: {
      id: (value.category || 'marketplace').toLowerCase().replace(/\s+/g, '_'),
      name: value.category || 'Marketplace',
      brand: value.brand || '',
    },
    attributes: {
      specifications: value.specifications || {},
      variants: value.variants || [],
    },
    stock_management: {
      track_quantity: true,
      quantity: value.stock_quantity || 1,
    },
    delivery: {
      shipping_unit: value.shipping_unit || 'kg',
      shipping_value: value.shipping_value || 0,
    },
    marketing: {
      featured: value.featured || false,
      promotion: value.promotion || { active: false },
    },
    filters: {
      main_category: [value.category || 'Marketplace'],
      brand: value.brand ? [value.brand] : [],
      gender: value.specifications?.Genre ? [value.specifications.Genre] : [],
      age_group: value.specifications?.['Public cible'] ? [value.specifications['Public cible']] : [],
      in_stock: value.in_stock,
      has_promotion: !!(value.promotion?.active)
    }
  };
  
  const row = {
    id: crypto.randomUUID(),
    agency_id: ctx.agency.id,
    name: value.name,
    description: (value.description || '').trim(),
    price: value.price,
    in_stock: value.in_stock,
    country: value.origin || value.country || 'CG',
    delivery_time: value.delivery_time || '2-3 Jours',
    image_url: mainImageUrl,
    shipping_unit: value.shipping_unit || 'kg',
    shipping_value: value.shipping_value || 0,
    metadata,
    status: 'active',
    created_by_user_id: req.user.id,
    created_at: now,
    updated_at: now,
  };

  const { data: created, error: insertErr } = await dbAdmin
    .from('agency_articles')
    .insert(row)
    .select('*')
    .single();

  if (insertErr || !created) {
    console.error("[AGENCY PRODUCT INSERT ERROR]", insertErr);
    throw new ValidationError(`Erreur lors de l'ajout du produit: ${insertErr?.message || 'Inconnu'}`);
  }
  return res.status(201).json({ success: true, data: created });
}));

// PUT /api/v1/agencies/my/products/:id
router.put('/my/products/:id', asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const { error, value } = createProductSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const ctx = await getMyAgencyContext(req.user.id);
  if (!ctx?.agency?.id) throw new NotFoundError('Agence introuvable');
  // Need to be owner or host/agent to add/edit product
  await assertCanManageMemberships({ agencyId: ctx.agency.id, userId: req.user.id });

  const now = new Date().toISOString();

  // Convert base64 images to files stored on disk
  const processedGallery = processProductImages(value.gallery_urls || [], 'products');
  
  // Store all extra data in the metadata JSONB column
  const metadata = {
    currency: value.currency || 'XAF',
    media: {
      images: processedGallery,
      video: value.video_url || null,
    },
    category: {
      id: (value.category || 'marketplace').toLowerCase().replace(/\s+/g, '_'),
      name: value.category || 'Marketplace',
      brand: value.brand || '',
    },
    attributes: {
      specifications: value.specifications || {},
      variants: value.variants || [],
    },
    stock_management: {
      track_quantity: true,
      quantity: value.stock_quantity || 1,
    },
    delivery: {
      shipping_unit: value.shipping_unit || 'kg',
      shipping_value: value.shipping_value || 0,
    },
    marketing: {
      featured: value.featured || false,
      promotion: value.promotion || { active: false },
    },
    filters: {
      main_category: [value.category || 'Marketplace'],
      brand: value.brand ? [value.brand] : [],
      gender: value.specifications?.Genre ? [value.specifications.Genre] : [],
      age_group: value.specifications?.['Public cible'] ? [value.specifications['Public cible']] : [],
      in_stock: value.in_stock,
      has_promotion: !!(value.promotion?.active)
    }
  };
  
  const updates = {
    name: value.name,
    description: (value.description || '').trim(),
    price: value.price,
    in_stock: value.in_stock,
    country: value.origin || value.country || 'CG',
    delivery_time: value.delivery_time || '2-3 Jours',
    shipping_unit: value.shipping_unit || 'kg',
    shipping_value: value.shipping_value || 0,
    metadata,
    updated_at: now,
  };
  
  // N'updater l'image que si elle a été fournie — convertir base64 en fichier
  if (value.image_url && value.image_url !== '') {
    if (value.image_url.startsWith('data:image/')) {
      const saved = saveBase64Image(value.image_url, 'products');
      if (saved) updates.image_url = saved;
    } else {
      updates.image_url = value.image_url;
    }
  }

  const { data: updated, error: updateErr } = await dbAdmin
    .from('agency_articles')
    .update(updates)
    .eq('id', productId)
    .eq('agency_id', ctx.agency.id)
    .select('*')
    .single();

  if (updateErr || !updated) {
    console.error("[AGENCY PRODUCT UPDATE ERROR]", updateErr);
    throw new ValidationError(`Erreur lors de la mise à jour du produit: ${updateErr?.message || 'Inconnu'}`);
  }
  return res.json({ success: true, data: updated });
}));

// POST /api/v1/agencies/my/invite-member
router.post('/my/invite-member', asyncHandler(async (req, res) => {
  const { error, value } = inviteMemberSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const ctx = await getMyAgencyContext(req.user.id);
  if (!ctx?.agency?.id) throw new NotFoundError('Agence introuvable');
  if (!ctx.isOwner) throw new ValidationError('Accès refusé');

  const raw = String(value.user_id_display).trim().toUpperCase();
  const { data: target, error: tErr } = await dbAdmin
    .from('users')
    .select('id,user_id_display')
    .eq('user_id_display', raw)
    .single();

  if (tErr || !target?.id) throw new NotFoundError('Utilisateur introuvable');
  if (String(target.id) === String(req.user.id)) throw new ValidationError('Opération impossible');

  const { data: existing, error: exErr } = await dbAdmin
    .from('agency_memberships')
    .select('*')
    .eq('agency_id', ctx.agency.id)
    .eq('user_id', target.id)
    .limit(1);

  if (exErr) throw new ValidationError('Erreur lors de la vérification');
  const already = Array.isArray(existing) && existing.length > 0 ? existing[0] : null;
  if (already?.id) {
    return res.json({ success: true, message: 'Utilisateur déjà membre ou invité', data: already });
  }

  const { data: otherMemberships } = await dbAdmin
    .from('agency_memberships')
    .select('*')
    .eq('user_id', target.id)
    .in('status', ['pending', 'approved', 'active'])
    .order('created_at', { ascending: false })
    .limit(25);

  const other = (Array.isArray(otherMemberships) ? otherMemberships : []).find((m) => String(m?.agency_id || '') !== String(ctx.agency.id));
  if (other?.id) throw new ValidationError('Utilisateur déjà associé à une autre agence');

  const now = new Date().toISOString();
  const membership = {
    id: crypto.randomUUID(),
    agency_id: ctx.agency.id,
    user_id: target.id,
    role_in_agency: value.role_in_agency,
    status: 'approved',
    created_at: now,
    updated_at: now,
  };

  const { data: created, error: cErr } = await dbAdmin
    .from('agency_memberships')
    .insert(membership)
    .select('*')
    .single();

  if (cErr || !created) throw new ValidationError('Erreur lors de la création');
  return res.status(201).json({ success: true, data: created });
}));

// GET /api/v1/agencies/my/staff
router.get('/my/staff', asyncHandler(async (req, res) => {
  const ctx = await getMyAgencyContext(req.user.id);
  if (!ctx?.agency?.id) return res.json({ success: true, data: { agency_id: null, items: [] } });

  await assertCanManageMemberships({ agencyId: ctx.agency.id, userId: req.user.id });

  const limitRaw = req.query.limit ? Number(req.query.limit) : 200;
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 500) : 200;

  const { data: memberships, error: mErr } = await dbAdmin
    .from('agency_memberships')
    .select('*')
    .eq('agency_id', ctx.agency.id)
    .in('status', ['approved', 'pending'])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (mErr) throw new ValidationError('Erreur lors du chargement');

  const items = Array.isArray(memberships) ? memberships : [];
  const userIds = items.map((x) => String(x?.user_id || '')).filter(Boolean);

  let usersById = new Map();
  if (userIds.length) {
    const { data: users, error: uErr } = await dbAdmin
      .from('users')
      .select('id,full_name,phone,user_id_display,avatar_url')
      .in('id', userIds);
    if (uErr) throw new ValidationError('Erreur lors du chargement des utilisateurs');
    usersById = new Map((Array.isArray(users) ? users : []).map((u) => [String(u.id), u]));
  }

  let salesByUserId = new Map();
  if (userIds.length) {
    const { data: sales, error: sErr } = await dbAdmin
      .from('agency_sales')
      .select('sold_by_user_id,amount,commission_amount')
      .eq('agency_id', ctx.agency.id)
      .in('sold_by_user_id', userIds)
      .limit(5000);

    if (sErr) throw new ValidationError('Erreur lors du chargement des ventes');

    for (const r of Array.isArray(sales) ? sales : []) {
      const uid = String(r?.sold_by_user_id || '');
      if (!uid) continue;
      const curr = salesByUserId.get(uid) || { sales_count: 0, sales_amount: 0, commission_amount: 0 };
      const amt = Number(r?.amount || 0);
      const comm = r?.commission_amount === null || r?.commission_amount === undefined ? 0 : Number(r.commission_amount);
      curr.sales_count += 1;
      curr.sales_amount += Number.isFinite(amt) ? amt : 0;
      curr.commission_amount += Number.isFinite(comm) ? comm : 0;
      salesByUserId.set(uid, curr);
    }
  }

  const enriched = items.map((m) => {
    const uid = String(m?.user_id || '');
    const user = usersById.get(uid) || null;
    const stats = salesByUserId.get(uid) || { sales_count: 0, sales_amount: 0, commission_amount: 0 };
    return { ...m, user, stats };
  });

  return res.json({ success: true, data: { agency_id: ctx.agency.id, items: enriched } });
}));

// GET /api/v1/agencies/my
router.get('/my', asyncHandler(async (req, res) => {
  const ctx = await getMyAgencyContext(req.user.id);
  const agency = ctx?.agency || null;
  if (!agency) return res.json({ success: true, data: null });

  const permissions = {
    is_owner: Boolean(ctx.isOwner),
    can_manage_agency: Boolean(ctx.isOwner),
    can_view_service_requests: Boolean(ctx.isOwner),
    can_request_service: Boolean(ctx.isOwner),
    can_leave_agency: !ctx.isOwner,
  };

  let services = [];
  let docs = [];
  let enabled_service_ids = [];
  if (ctx.isOwner) {
    const { data: s } = await dbAdmin
      .from('agency_service_requests')
      .select('*')
      .eq('agency_id', agency.id)
      .order('created_at', { ascending: false });
    services = s || [];

    enabled_service_ids = (services || [])
      .filter((x) => String(x?.status || '') === 'approved')
      .map((x) => String(x?.service_id || ''))
      .filter(Boolean);

    const { data: d } = await dbAdmin
      .from('agency_documents')
      .select('*')
      .eq('agency_id', agency.id)
      .order('created_at', { ascending: false });
    docs = d || [];
  } else {
    const { data: approved } = await dbAdmin
      .from('agency_service_requests')
      .select('service_id,status')
      .eq('agency_id', agency.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    enabled_service_ids = (approved || []).map((x) => String(x?.service_id || '')).filter(Boolean);
  }

  return res.json({
    success: true,
    data: {
      agency,
      services: services || [],
      documents: docs || [],
      role_in_agency: ctx?.role_in_agency || null,
      service_permissions: ctx?.membership?.service_permissions || {},
      permissions,
      enabled_service_ids,
    },
  });
}));

// DELETE /api/v1/agencies/my/products/:id
router.delete('/my/products/:id', asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const ctx = await getMyAgencyContext(req.user.id);
  if (!ctx?.agency?.id) throw new NotFoundError('Agence introuvable');
  
  await assertCanManageMemberships({ agencyId: ctx.agency.id, userId: req.user.id });

  const { error: delErr } = await dbAdmin
    .from('agency_articles')
    .delete()
    .eq('id', productId)
    .eq('agency_id', ctx.agency.id);

  if (delErr) {
    throw new ValidationError('Erreur lors de la suppression du produit');
  }

  return res.json({ success: true, message: 'Produit supprimé avec succès' });
}));

export default router;








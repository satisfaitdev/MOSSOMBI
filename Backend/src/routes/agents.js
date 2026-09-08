/**
 * ROUTES AGENTS INDÉPENDANTS/DÉPENDANTS
 * Gestion des profils agents, géolocalisation, services
 */

import express from 'express';
import Joi from 'joi';
import crypto from 'crypto';
import { dbAdmin } from '../config/db.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const AGENT_ROLES = [
  'chauffeur', 'livreur', 'agent_controleur', 'controleur_acces',
  'finance', 'demarcheur', 'revendeur', 'guichetier', 'gestionnaire_stock',
  'host', 'sub_agent', 'agent',
];

const registerAgentSchema = Joi.object({
  agent_type: Joi.string().valid('independant', 'dependant').default('independant'),
  service_ids: Joi.array().items(Joi.string().trim().min(1).max(64)).default([]),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  description: Joi.string().max(500).optional(),
  phone_visible: Joi.boolean().default(true),
});

const updateAgentSchema = Joi.object({
  service_ids: Joi.array().items(Joi.string().trim().min(1).max(64)).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  is_online: Joi.boolean().optional(),
  description: Joi.string().max(500).optional(),
  phone_visible: Joi.boolean().optional(),
}).min(1);

const joinAgencySchema = Joi.object({
  agency_code: Joi.string().trim().min(4).max(32).required(),
  role_in_agency: Joi.string().valid(...AGENT_ROLES).default('agent'),
});

router.use(authenticateToken);

async function getAgentProfile(userId) {
  const { data: profile } = await dbAdmin
    .from('agent_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  return profile || null;
}

function serializeAgent(profile, user) {
  return {
    id: profile?.id || null,
    user_id: profile?.user_id || user?.id,
    agent_type: profile?.agent_type || null,
    service_ids: profile?.service_ids || [],
    is_online: profile?.is_online || false,
    latitude: profile?.latitude || null,
    longitude: profile?.longitude || null,
    description: profile?.description || '',
    phone_visible: profile?.phone_visible ?? true,
    created_at: profile?.created_at || null,
    user: user ? {
      id: user.id,
      full_name: user.full_name,
      phone: user.phone,
      avatar_url: user.avatar_url,
      user_id_display: user.user_id_display,
    } : null,
  };
}

/**
 * POST /api/v1/agents/register
 * Devenir agent indépendant
 */
router.post('/register', asyncHandler(async (req, res) => {
  const { error, value } = registerAgentSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const existing = await getAgentProfile(req.user.id);
  if (existing) {
    throw new ValidationError('Vous êtes déjà enregistré comme agent');
  }

  const now = new Date().toISOString();
  const profile = {
    id: crypto.randomUUID(),
    user_id: req.user.id,
    agent_type: value.agent_type,
    service_ids: value.service_ids,
    is_online: true,
    latitude: value.latitude || null,
    longitude: value.longitude || null,
    description: value.description || '',
    phone_visible: value.phone_visible,
    created_at: now,
    updated_at: now,
  };

  const { data: created, error: insertErr } = await dbAdmin
    .from('agent_profiles')
    .insert(profile)
    .select('*')
    .single();

  if (insertErr || !created) {
    throw new ValidationError("Erreur lors de l'enregistrement du profil agent");
  }

  res.status(201).json({
    success: true,
    message: 'Profil agent créé avec succès',
    data: serializeAgent(created),
  });
}));

/**
 * GET /api/v1/agents/profile
 * Mon profil agent
 */
router.get('/profile', asyncHandler(async (req, res) => {
  const profile = await getAgentProfile(req.user.id);

  const { data: user } = await dbAdmin
    .from('users')
    .select('id, full_name, phone, avatar_url, user_id_display')
    .eq('id', req.user.id)
    .single();

  // Also check agency membership
  let agency = null;
  if (profile?.agent_type === 'dependant' || !profile) {
    const { data: memberships } = await dbAdmin
      .from('agency_memberships')
      .select('*, agencies:agency_id(name, city, logo_url)')
      .eq('user_id', req.user.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1);

    if (Array.isArray(memberships) && memberships[0]) {
      agency = {
        id: memberships[0].agency_id,
        name: memberships[0].agencies?.name || '',
        city: memberships[0].agencies?.city || '',
        logo_url: memberships[0].agencies?.logo_url || '',
        role_in_agency: memberships[0].role_in_agency,
      };
    }
  }

  if (!profile && !agency) {
    return res.json({
      success: true,
      data: null,
      message: 'Aucun profil agent trouvé',
    });
  }

  res.json({
    success: true,
    data: {
      ...serializeAgent(profile, user),
      agency,
    },
  });
}));

/**
 * PATCH /api/v1/agents/profile
 * Mettre à jour mon profil agent
 */
router.patch('/profile', asyncHandler(async (req, res) => {
  const { error, value } = updateAgentSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const existing = await getAgentProfile(req.user.id);
  if (!existing) {
    throw new ValidationError('Aucun profil agent trouvé. Enregistrez-vous d\'abord.');
  }

  const updates = {
    ...value,
    updated_at: new Date().toISOString(),
  };

  const { data: updated, error: upErr } = await dbAdmin
    .from('agent_profiles')
    .update(updates)
    .eq('user_id', req.user.id)
    .select('*')
    .single();

  if (upErr || !updated) {
    throw new ValidationError('Erreur lors de la mise à jour du profil');
  }

  res.json({
    success: true,
    message: 'Profil agent mis à jour',
    data: serializeAgent(updated),
  });
}));

/**
 * POST /api/v1/agents/join-agency
 * Devenir dépendant (rejoindre une agence)
 */
router.post('/join-agency', asyncHandler(async (req, res) => {
  const { error, value } = joinAgencySchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const code = String(value.agency_code).trim().toUpperCase();

  // Find agency by invite code or owner's display ID
  let agency = null;

  // Try by invite code first
  const { data: invite } = await dbAdmin
    .from('agency_invites')
    .select('*, agencies:agency_id(*)')
    .eq('code', code)
    .eq('is_active', true)
    .single();

  if (invite?.agencies) {
    agency = invite.agencies;
  }

  // Fallback: find by owner's user_id_display
  if (!agency) {
    const { data: owner } = await dbAdmin
      .from('users')
      .select('id')
      .eq('user_id_display', code)
      .single();

    if (owner?.id) {
      const { data: agencies } = await dbAdmin
        .from('agencies')
        .select('*')
        .eq('owner_user_id', owner.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1);

      if (Array.isArray(agencies) && agencies[0]) {
        agency = agencies[0];
      }
    }
  }

  if (!agency?.id) {
    throw new NotFoundError('Agence introuvable avec ce code');
  }

  // Check existing membership
  const { data: existing } = await dbAdmin
    .from('agency_memberships')
    .select('*')
    .eq('agency_id', agency.id)
    .eq('user_id', req.user.id)
    .single();

  if (existing?.id) {
    return res.json({
      success: true,
      message: 'Vous êtes déjà membre de cette agence',
      data: { agency, membership: existing },
    });
  }

  const now = new Date().toISOString();
  const membership = {
    id: crypto.randomUUID(),
    agency_id: agency.id,
    user_id: req.user.id,
    role_in_agency: value.role_in_agency,
    status: 'pending',
    created_at: now,
    updated_at: now,
  };

  const { data: created, error: insertErr } = await dbAdmin
    .from('agency_memberships')
    .insert(membership)
    .select('*')
    .single();

  if (insertErr || !created) {
    throw new ValidationError("Erreur lors de la demande d'adhésion");
  }

  // Update agent profile to dependant if exists
  await dbAdmin
    .from('agent_profiles')
    .update({ agent_type: 'dependant', updated_at: now })
    .eq('user_id', req.user.id);

  res.status(201).json({
    success: true,
    message: "Demande d'adhésion envoyée",
    data: { agency, membership: created },
  });
}));

/**
 * POST /api/v1/agents/leave-agency
 * Quitter l'agence (redevenir indépendant)
 */
router.post('/leave-agency', asyncHandler(async (req, res) => {
  const { data: memberships } = await dbAdmin
    .from('agency_memberships')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(1);

  const membership = Array.isArray(memberships) && memberships[0];
  if (!membership?.id) {
    throw new NotFoundError('Aucune adhésion active trouvée');
  }

  const now = new Date().toISOString();
  const { error: upErr } = await dbAdmin
    .from('agency_memberships')
    .update({ status: 'left', updated_at: now })
    .eq('id', membership.id);

  if (upErr) {
    throw new ValidationError("Erreur lors du départ de l'agence");
  }

  // Revert to independant
  await dbAdmin
    .from('agent_profiles')
    .update({ agent_type: 'independant', updated_at: now })
    .eq('user_id', req.user.id);

  res.json({
    success: true,
    message: 'Vous avez quitté votre agence. Vous êtes maintenant agent indépendant.',
    data: { previous_membership_id: membership.id },
  });
}));

/**
 * GET /api/v1/agents/nearby
 * Trouver des agents près de chez moi
 */
router.get('/nearby', asyncHandler(async (req, res) => {
  const { lat, lng, radius, service, limit: limitRaw } = req.query;
  const limit = Math.min(Math.max(Number(limitRaw) || 20, 1), 100);

  let query = dbAdmin
    .from('agent_profiles')
    .select('*, users:user_id(id, full_name, phone, avatar_url, user_id_display)')
    .eq('is_online', true);

  if (service) {
    query = query.contains('service_ids', [service]);
  }

  if (lat && lng) {
    const radiusKm = Number(radius) || 10;
    query = query.not('latitude', 'is', null).not('longitude', 'is', null);
  }

  const { data: agents, error: queryErr } = await query.limit(limit);

  if (queryErr) {
    throw new ValidationError('Erreur lors de la recherche');
  }

  let results = Array.isArray(agents) ? agents : [];

  // Filter by distance if lat/lng provided
  if (lat && lng && results.length) {
    const userLat = Number(lat);
    const userLng = Number(lng);
    const radiusKm = Number(radius) || 10;

    results = results.filter((a) => {
      if (a.latitude == null || a.longitude == null) return false;
      const d = distance(userLat, userLng, Number(a.latitude), Number(a.longitude));
      return d <= radiusKm;
    });

    // Sort by distance
    results.sort((a, b) => {
      if (a.latitude == null || a.longitude == null) return 1;
      if (b.latitude == null || b.longitude == null) return -1;
      return distance(userLat, userLng, Number(a.latitude), Number(a.longitude)) -
             distance(userLat, userLng, Number(b.latitude), Number(b.longitude));
    });
  }

  res.json({
    success: true,
    data: {
      agents: results.map((a) => serializeAgent(a, a.users)),
      total: results.length,
    },
  });
}));

/**
 * GET /api/v1/agents/:id/profile
 * Profil public d'un agent (indépendant ou membre)
 */
router.get('/:id/profile', asyncHandler(async (req, res) => {
  const agentId = req.params.id;

  const { data: profile, error: pErr } = await dbAdmin
    .from('agent_profiles')
    .select('*')
    .eq('id', agentId)
    .single();

  if (pErr || !profile) {
    // Maybe it's a user_id
    const { data: byUser } = await dbAdmin
      .from('agent_profiles')
      .select('*')
      .eq('user_id', agentId)
      .single();

    if (!byUser) {
      throw new NotFoundError('Agent introuvable');
    }
    profile = byUser;
  }

  const { data: user } = await dbAdmin
    .from('users')
    .select('id, full_name, phone, avatar_url, user_id_display, created_at')
    .eq('id', profile.user_id)
    .single();

  let agency = null;
  const { data: memberships } = await dbAdmin
    .from('agency_memberships')
    .select('*, agencies:agency_id(name, city, logo_url)')
    .eq('user_id', profile.user_id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(1);

  if (Array.isArray(memberships) && memberships[0]) {
    agency = {
      id: memberships[0].agency_id,
      name: memberships[0].agencies?.name || '',
      city: memberships[0].agencies?.city || '',
      logo_url: memberships[0].agencies?.logo_url || '',
      role_in_agency: memberships[0].role_in_agency,
    };
  }

  res.json({
    success: true,
    data: {
      ...serializeAgent(profile, user),
      agency,
    },
  });
}));

/**
 * GET /api/v1/agents/by-service/:service
 * Agents disponibles par service
 */
router.get('/by-service/:service', asyncHandler(async (req, res) => {
  const { service } = req.params;
  const { lat, lng, radius, limit: limitRaw } = req.query;
  const limit = Math.min(Math.max(Number(limitRaw) || 20, 1), 100);

  const { data: agents, error: queryErr } = await dbAdmin
    .from('agent_profiles')
    .select('*, users:user_id(id, full_name, phone, avatar_url, user_id_display)')
    .eq('is_online', true)
    .contains('service_ids', [service])
    .limit(limit);

  if (queryErr) {
    throw new ValidationError('Erreur lors de la recherche');
  }

  let results = Array.isArray(agents) ? agents : [];

  if (lat && lng && results.length) {
    const userLat = Number(lat);
    const userLng = Number(lng);
    const radiusKm = Number(radius) || 10;

    results = results.filter((a) => {
      if (a.latitude == null || a.longitude == null) return false;
      return distance(userLat, userLng, Number(a.latitude), Number(a.longitude)) <= radiusKm;
    });

    results.sort((a, b) => {
      if (a.latitude == null || a.longitude == null) return 1;
      if (b.latitude == null || b.longitude == null) return -1;
      return distance(userLat, userLng, Number(a.latitude), Number(a.longitude)) -
             distance(userLat, userLng, Number(b.latitude), Number(b.longitude));
    });
  }

  res.json({
    success: true,
    data: {
      service,
      agents: results.map((a) => serializeAgent(a, a.users)),
      total: results.length,
    },
  });
}));

function distance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

export default router;

import express from 'express';
import crypto from 'crypto';
import Joi from 'joi';
import axios from 'axios';
import { authenticateToken } from '../middleware/auth.js';
import { ValidationError, asyncHandler } from '../middleware/errorHandler.js';
import { dbAdmin } from '../config/db.js';
import { getIO } from '../realtime/io.js';
import { appDataSource } from '../db/dataSource.js';

const router = express.Router();

const createRideSchema = Joi.object({
  pickup_address: Joi.string().allow('').max(300).default(''),
  dropoff_address: Joi.string().allow('').max(300).default(''),
  pickup_lat: Joi.number().optional(),
  pickup_lng: Joi.number().optional(),
  dropoff_lat: Joi.number().optional(),
  dropoff_lng: Joi.number().optional(),
  options: Joi.object().default({}),
  is_shared: Joi.boolean().default(false),
}).required();

const routeSchema = Joi.object({
  from_lat: Joi.number().required(),
  from_lng: Joi.number().required(),
  to_lat: Joi.number().required(),
  to_lng: Joi.number().required(),
}).required();

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function computeSurgeMultiplier({ hourLocal, trafficLevel = 0, fuelShortage = false } = {}) {
  const isPeak = hourLocal >= 7 && hourLocal <= 9 || hourLocal >= 16 && hourLocal <= 19;
  const peakMultiplier = isPeak ? 1.25 : 1.0;
  const trafficMultiplier = 1.0 + clamp(Number(trafficLevel) || 0, 0, 1) * 0.5; // 1.0 -> 1.5
  const fuelMultiplier = fuelShortage ? 1.2 : 1.0;
  return Number((peakMultiplier * trafficMultiplier * fuelMultiplier).toFixed(2));
}

async function estimateRidePrice({ pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, pricingContext = {} } = {}) {
  if (![pickup_lat, pickup_lng, dropoff_lat, dropoff_lng].every(Number.isFinite)) {
    return {
      estimated_price: null,
      breakdown: null,
    };
  }

  const baseFare = 500; // XAF
  const pricePerKm = 250; // XAF
  const minFare = 1000; // XAF

  const sql = `
    SELECT
      ST_Distance(
        ST_SetSRID(ST_MakePoint($1,$2), 4326)::geography,
        ST_SetSRID(ST_MakePoint($3,$4), 4326)::geography
      ) AS distance_m
  `;
  const [{ distance_m } = {}] = await appDataSource.query(sql, [pickup_lng, pickup_lat, dropoff_lng, dropoff_lat]);

  const distanceM = Number(distance_m || 0);
  const distanceKm = distanceM / 1000;

  const now = new Date();
  const hourLocal = now.getHours();

  const surge = computeSurgeMultiplier({
    hourLocal,
    trafficLevel: pricingContext?.traffic_level,
    fuelShortage: Boolean(pricingContext?.fuel_shortage),
  });

  const raw = (baseFare + distanceKm * pricePerKm) * surge;
  const estimated = Math.max(minFare, Math.round(raw));

  return {
    estimated_price: estimated,
    breakdown: {
      base_fare: baseFare,
      price_per_km: pricePerKm,
      distance_km: Number(distanceKm.toFixed(3)),
      min_fare: minFare,
      surge_multiplier: surge,
      traffic_level: clamp(Number(pricingContext?.traffic_level) || 0, 0, 1),
      fuel_shortage: Boolean(pricingContext?.fuel_shortage),
      hour_local: hourLocal,
    },
  };
}

async function findNearestDriver({ pickup_lat, pickup_lng, city = '' } = {}) {
  if (![pickup_lat, pickup_lng].every(Number.isFinite)) return null;

  const params = [pickup_lng, pickup_lat];
  let where = `ll.service_id = 'taxi' AND ll.is_visible = true AND ll.is_busy = false AND ll.updated_at > (now() - interval '120 seconds')`;
  if (city) {
    params.push(city);
    where += ` AND lower(ll.city) = lower($${params.length})`;
  }

  const sql = `
    SELECT
      ll.user_id AS driver_user_id,
      ST_Distance(
        ll.location,
        ST_SetSRID(ST_MakePoint($1,$2), 4326)::geography
      ) AS distance_m
    FROM public.live_locations ll
    WHERE ${where}
    ORDER BY distance_m ASC
    LIMIT 1
  `;

  const [row] = await appDataSource.query(sql, params);
  if (!row?.driver_user_id) return null;
  return {
    driver_user_id: row.driver_user_id,
    distance_m: Number(row.distance_m || 0),
  };
}

function roomKeyForUser(userId) {
  return `user:${String(userId)}`;
}

function assertDriver(req) {
  const role = String(req.user?.role || '');
  if (!['agent', 'super_admin', 'taxi_driver'].includes(role)) {
    throw new ValidationError('Accès refusé');
  }
}

router.use(authenticateToken);

// GET /api/v1/taxi/route
router.get('/route', asyncHandler(async (req, res) => {
  const { error, value } = routeSchema.validate({
    from_lat: req.query.from_lat !== undefined ? Number(req.query.from_lat) : undefined,
    from_lng: req.query.from_lng !== undefined ? Number(req.query.from_lng) : undefined,
    to_lat: req.query.to_lat !== undefined ? Number(req.query.to_lat) : undefined,
    to_lng: req.query.to_lng !== undefined ? Number(req.query.to_lng) : undefined,
  });
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const osrmBaseUrl = String(process.env.OSRM_BASE_URL || 'https://router.project-osrm.org');
  const url = `${osrmBaseUrl.replace(/\/$/, '')}/route/v1/driving/${value.from_lng},${value.from_lat};${value.to_lng},${value.to_lat}`;

  let response;
  try {
    response = await axios.get(url, {
      params: {
        alternatives: 'false',
        steps: 'false',
        geometries: 'geojson',
        overview: 'full',
      },
      timeout: 15000,
    });
  } catch {
    throw new ValidationError('Erreur routing');
  }

  const body = response?.data;
  const route = Array.isArray(body?.routes) ? body.routes[0] : null;
  if (!route?.geometry || body?.code !== 'Ok') {
    throw new ValidationError('Itinéraire indisponible');
  }

  return res.json({
    success: true,
    data: {
      geometry: route.geometry,
      distance_m: Number(route.distance || 0),
      duration_s: Number(route.duration || 0),
    },
  });
}));

// GET /api/v1/taxi/rides/my
router.get('/rides/my', asyncHandler(async (req, res) => {
  const { data, error } = await dbAdmin
    .from('taxi_rides')
    .select('*')
    .eq('client_user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new ValidationError(String(error?.message || 'Erreur récupération'));
  return res.json({ success: true, data: data || [] });
}));

// GET /api/v1/taxi/rides/available
router.get('/rides/available', asyncHandler(async (req, res) => {
  assertDriver(req);

  const { data, error } = await dbAdmin
    .from('taxi_rides')
    .select('*')
    .eq('status', 'requested')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new ValidationError(String(error?.message || 'Erreur récupération'));
  return res.json({ success: true, data: data || [] });
}));

// POST /api/v1/taxi/rides
router.post('/rides', asyncHandler(async (req, res) => {
  const { error, value } = createRideSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const now = new Date().toISOString();
  const pricingContext = value?.options?.pricing_context || {};
  const pricing = await estimateRidePrice({
    pickup_lat: value.pickup_lat,
    pickup_lng: value.pickup_lng,
    dropoff_lat: value.dropoff_lat,
    dropoff_lng: value.dropoff_lng,
    pricingContext,
  });

  const options = {
    ...(value.options || {}),
    pricing_breakdown: pricing.breakdown,
  };

  const ride = {
    id: crypto.randomUUID(),
    service_id: 'taxi',
    client_user_id: req.user.id,
    driver_user_id: null,
    status: 'requested',
    pickup_address: value.pickup_address || '',
    dropoff_address: value.dropoff_address || '',
    pickup_lat: value.pickup_lat ?? null,
    pickup_lng: value.pickup_lng ?? null,
    dropoff_lat: value.dropoff_lat ?? null,
    dropoff_lng: value.dropoff_lng ?? null,
    scheduled_for: null,
    is_shared: Boolean(value.is_shared),
    options,
    estimated_price: pricing.estimated_price,
    final_price: null,
    currency: 'XAF',
    created_at: now,
    updated_at: now,
  };

  const inserted = await dbAdmin
    .from('taxi_rides')
    .insert(ride)
    .selectAndReturnSingle();

  if (inserted?.error || !inserted?.data) {
    throw new ValidationError(String(inserted?.error?.message || 'Erreur création course'));
  }

  // Create ride event
  try {
    await dbAdmin.from('taxi_ride_events').insert({
      id: crypto.randomUUID(),
      ride_id: ride.id,
      type: 'ride_requested',
      payload: {
        pickup_address: ride.pickup_address,
        dropoff_address: ride.dropoff_address,
        pickup_lat: ride.pickup_lat,
        pickup_lng: ride.pickup_lng,
        dropoff_lat: ride.dropoff_lat,
        dropoff_lng: ride.dropoff_lng,
        options: ride.options,
        is_shared: ride.is_shared,
      },
      created_at: now,
    });
  } catch {
    // ignore
  }

  // Matching auto: find nearest available driver and send an offer (driver must accept).
  let finalRide = inserted.data;
  try {
    const nearest = await findNearestDriver({
      pickup_lat: Number(finalRide.pickup_lat),
      pickup_lng: Number(finalRide.pickup_lng),
      city: String(value?.options?.city || ''),
    });

    if (nearest?.driver_user_id) {
      const offeredAt = new Date().toISOString();
      const updated = await dbAdmin
        .from('taxi_rides')
        .update({
          driver_user_id: nearest.driver_user_id,
          status: 'offered',
          updated_at: offeredAt,
        })
        .eq('id', finalRide.id)
        .selectAndReturnSingle();

      if (updated?.data) {
        finalRide = updated.data;
        try {
          await dbAdmin.from('taxi_ride_events').insert({
            id: crypto.randomUUID(),
            ride_id: finalRide.id,
            type: 'ride_offered',
            payload: { driver_user_id: nearest.driver_user_id, distance_m: nearest.distance_m },
            created_at: offeredAt,
          });
        } catch {
          // ignore
        }
      }
    }
  } catch {
    // ignore
  }

  // Broadcast events
  try {
    const io = getIO();
    if (finalRide.status === 'offered' && finalRide.driver_user_id) {
      io?.to(roomKeyForUser(finalRide.client_user_id))?.emit('taxi:ride:updated', finalRide);
      io?.to(roomKeyForUser(finalRide.driver_user_id))?.emit('taxi:ride:offer', finalRide);
      io?.to(roomKeyForUser(finalRide.driver_user_id))?.emit('taxi:ride:updated', finalRide);
    } else if (finalRide.status === 'assigned' && finalRide.driver_user_id) {
      io?.to(roomKeyForUser(finalRide.client_user_id))?.emit('taxi:ride:updated', finalRide);
      io?.to(roomKeyForUser(finalRide.driver_user_id))?.emit('taxi:ride:updated', finalRide);
    } else {
      io?.to('service:taxi')?.emit('taxi:ride:requested', finalRide);
    }
  } catch {
    // ignore
  }

  return res.status(201).json({ success: true, data: finalRide });
}));

// POST /api/v1/taxi/rides/:id/assign
// Temporary: driver self-assigns ride (first come, first served)
router.post('/rides/:id/assign', asyncHandler(async (req, res) => {
  assertDriver(req);

  const rideId = String(req.params.id || '').trim();
  if (!rideId) throw new ValidationError('id requis');

  const { data: existing, error: exErr } = await dbAdmin
    .from('taxi_rides')
    .select('*')
    .eq('id', rideId)
    .single();

  if (exErr || !existing) throw new ValidationError('Course introuvable');
  if (String(existing.status || '') !== 'requested') {
    throw new ValidationError('Course déjà prise ou invalide');
  }

  const now = new Date().toISOString();
  const updated = await dbAdmin
    .from('taxi_rides')
    .update({
      driver_user_id: req.user.id,
      status: 'assigned',
      updated_at: now,
    })
    .eq('id', rideId)
    .selectAndReturnSingle();

  if (updated?.error || !updated?.data) throw new ValidationError('Erreur assignation');

  try {
    await dbAdmin.from('taxi_ride_events').insert({
      id: crypto.randomUUID(),
      ride_id: rideId,
      type: 'ride_assigned',
      payload: { driver_user_id: req.user.id },
      created_at: now,
    });
  } catch {
    // ignore
  }

  try {
    const io = getIO();
    const clientRoom = roomKeyForUser(updated.data.client_user_id);
    const driverRoom = roomKeyForUser(updated.data.driver_user_id);
    io?.to(clientRoom)?.emit('taxi:ride:updated', updated.data);
    io?.to(driverRoom)?.emit('taxi:ride:updated', updated.data);
  } catch {
    // ignore
  }

  try {
    if (nextStatus === 'completed' && updated.data.driver_user_id) {
      await dbAdmin
        .from('live_locations')
        .update({ is_busy: false, updated_at: now })
        .eq('user_id', updated.data.driver_user_id);
    }
  } catch {
    // ignore
  }

  return res.json({ success: true, data: updated.data });
}));

// POST /api/v1/taxi/rides/:id/accept
router.post('/rides/:id/accept', asyncHandler(async (req, res) => {
  assertDriver(req);
  const rideId = String(req.params.id || '').trim();
  if (!rideId) throw new ValidationError('id requis');

  const { data: existing, error: exErr } = await dbAdmin
    .from('taxi_rides')
    .select('*')
    .eq('id', rideId)
    .single();

  if (exErr || !existing) throw new ValidationError('Course introuvable');
  if (String(existing.driver_user_id || '') !== String(req.user.id)) throw new ValidationError('Accès refusé');
  if (String(existing.status || '') !== 'offered') throw new ValidationError('Course non disponible');

  const now = new Date().toISOString();
  const updated = await dbAdmin
    .from('taxi_rides')
    .update({ status: 'assigned', updated_at: now })
    .eq('id', rideId)
    .selectAndReturnSingle();

  if (updated?.error || !updated?.data) throw new ValidationError('Erreur acceptation');

  try {
    await dbAdmin.from('taxi_ride_events').insert({
      id: crypto.randomUUID(),
      ride_id: rideId,
      type: 'ride_accepted',
      payload: { driver_user_id: req.user.id },
      created_at: now,
    });
  } catch {
    // ignore
  }

  try {
    await dbAdmin
      .from('live_locations')
      .update({ is_busy: true, updated_at: now })
      .eq('user_id', req.user.id);
  } catch {
    // ignore
  }

  try {
    const io = getIO();
    io?.to(roomKeyForUser(updated.data.client_user_id))?.emit('taxi:ride:updated', updated.data);
    io?.to(roomKeyForUser(updated.data.driver_user_id))?.emit('taxi:ride:updated', updated.data);
  } catch {
    // ignore
  }

  return res.json({ success: true, data: updated.data });
}));

// POST /api/v1/taxi/rides/:id/decline
router.post('/rides/:id/decline', asyncHandler(async (req, res) => {
  assertDriver(req);
  const rideId = String(req.params.id || '').trim();
  if (!rideId) throw new ValidationError('id requis');

  const { data: existing, error: exErr } = await dbAdmin
    .from('taxi_rides')
    .select('*')
    .eq('id', rideId)
    .single();

  if (exErr || !existing) throw new ValidationError('Course introuvable');
  if (String(existing.driver_user_id || '') !== String(req.user.id)) throw new ValidationError('Accès refusé');
  if (String(existing.status || '') !== 'offered') throw new ValidationError('Course non disponible');

  const now = new Date().toISOString();
  const updated = await dbAdmin
    .from('taxi_rides')
    .update({ status: 'requested', driver_user_id: null, updated_at: now })
    .eq('id', rideId)
    .selectAndReturnSingle();

  if (updated?.error || !updated?.data) throw new ValidationError('Erreur refus');

  try {
    await dbAdmin.from('taxi_ride_events').insert({
      id: crypto.randomUUID(),
      ride_id: rideId,
      type: 'ride_declined',
      payload: { driver_user_id: req.user.id },
      created_at: now,
    });
  } catch {
    // ignore
  }

  try {
    const io = getIO();
    io?.to(roomKeyForUser(updated.data.client_user_id))?.emit('taxi:ride:updated', updated.data);
    io?.to('service:taxi')?.emit('taxi:ride:requested', updated.data);
  } catch {
    // ignore
  }

  return res.json({ success: true, data: updated.data });
}));

// POST /api/v1/taxi/rides/:id/cancel
router.post('/rides/:id/cancel', asyncHandler(async (req, res) => {
  const rideId = String(req.params.id || '').trim();
  if (!rideId) throw new ValidationError('id requis');

  const { data: existing, error: exErr } = await dbAdmin
    .from('taxi_rides')
    .select('*')
    .eq('id', rideId)
    .single();

  if (exErr || !existing) throw new ValidationError('Course introuvable');
  if (String(existing.client_user_id || '') !== String(req.user.id)) {
    throw new ValidationError('Accès refusé');
  }

  const status = String(existing.status || '');
  if (['completed', 'canceled'].includes(status)) {
    throw new ValidationError('Course déjà terminée');
  }

  const now = new Date().toISOString();
  const updated = await dbAdmin
    .from('taxi_rides')
    .update({ status: 'canceled', updated_at: now })
    .eq('id', rideId)
    .selectAndReturnSingle();

  if (updated?.error || !updated?.data) throw new ValidationError('Erreur annulation');

  try {
    await dbAdmin.from('taxi_ride_events').insert({
      id: crypto.randomUUID(),
      ride_id: rideId,
      type: 'ride_canceled',
      payload: { by: 'client', user_id: req.user.id },
      created_at: now,
    });
  } catch {
    // ignore
  }

  try {
    const io = getIO();
    const clientRoom = roomKeyForUser(updated.data.client_user_id);
    io?.to(clientRoom)?.emit('taxi:ride:updated', updated.data);
    if (updated.data.driver_user_id) {
      const driverRoom = roomKeyForUser(updated.data.driver_user_id);
      io?.to(driverRoom)?.emit('taxi:ride:updated', updated.data);
    }
    io?.to('service:taxi')?.emit('taxi:ride:updated', updated.data);
  } catch {
    // ignore
  }

  try {
    if (updated.data.driver_user_id) {
      await dbAdmin
        .from('live_locations')
        .update({ is_busy: false, updated_at: now })
        .eq('user_id', updated.data.driver_user_id);
    }
  } catch {
    // ignore
  }

  return res.json({ success: true, data: updated.data });
}));

// POST /api/v1/taxi/rides/:id/status
router.post('/rides/:id/status', asyncHandler(async (req, res) => {
  assertDriver(req);

  const rideId = String(req.params.id || '').trim();
  const nextStatus = String(req.body?.status || '').trim();
  if (!rideId) throw new ValidationError('id requis');
  if (!nextStatus) throw new ValidationError('status requis');

  const allowed = new Set(['en_route', 'started', 'completed']);
  if (!allowed.has(nextStatus)) throw new ValidationError('status invalide');

  const { data: existing, error: exErr } = await dbAdmin
    .from('taxi_rides')
    .select('*')
    .eq('id', rideId)
    .single();

  if (exErr || !existing) throw new ValidationError('Course introuvable');
  if (String(existing.driver_user_id || '') !== String(req.user.id)) {
    throw new ValidationError('Accès refusé');
  }

  const current = String(existing.status || '');
  if (['completed', 'canceled'].includes(current)) throw new ValidationError('Course déjà terminée');

  const now = new Date().toISOString();
  const updated = await dbAdmin
    .from('taxi_rides')
    .update({ status: nextStatus, updated_at: now })
    .eq('id', rideId)
    .selectAndReturnSingle();

  if (updated?.error || !updated?.data) throw new ValidationError('Erreur mise à jour');

  try {
    await dbAdmin.from('taxi_ride_events').insert({
      id: crypto.randomUUID(),
      ride_id: rideId,
      type: 'ride_status_changed',
      payload: { from: current, to: nextStatus, by: 'driver', user_id: req.user.id },
      created_at: now,
    });
  } catch {
    // ignore
  }

  try {
    const io = getIO();
    const clientRoom = roomKeyForUser(updated.data.client_user_id);
    const driverRoom = roomKeyForUser(updated.data.driver_user_id);
    io?.to(clientRoom)?.emit('taxi:ride:updated', updated.data);
    io?.to(driverRoom)?.emit('taxi:ride:updated', updated.data);
  } catch {
    // ignore
  }

  return res.json({ success: true, data: updated.data });
}));

// ──────────────────────────────────────────────
//  TAXI DRIVER ENDPOINTS
// ──────────────────────────────────────────────

// GET /api/v1/taxi/driver/requests
router.get('/driver/requests', asyncHandler(async (req, res) => {
  assertDriver(req);

  const sql = `
    SELECT tr.*,
      ST_Distance(
        ll.location,
        ST_SetSRID(ST_MakePoint(tr.pickup_lng, tr.pickup_lat), 4326)::geography
      ) AS distance_m
    FROM public.taxi_rides tr
    LEFT JOIN public.live_locations ll ON ll.user_id = $1 AND ll.service_id = 'taxi'
    WHERE tr.status = 'requested'
      AND tr.driver_user_id IS NULL
    ORDER BY tr.created_at DESC
    LIMIT 20
  `;

  const rows = await appDataSource.query(sql, [req.user.id]);
  return res.json({ success: true, data: rows || [] });
}));

// POST /api/v1/taxi/driver/accept
router.post('/driver/accept', asyncHandler(async (req, res) => {
  assertDriver(req);

  const { ride_id } = req.body;
  if (!ride_id) throw new ValidationError('ride_id requis');

  const { data: existing, error: exErr } = await dbAdmin
    .from('taxi_rides')
    .select('*')
    .eq('id', ride_id)
    .single();

  if (exErr || !existing) throw new ValidationError('Course introuvable');
  if (String(existing.status || '') !== 'requested') throw new ValidationError('Course déjà prise');

  const now = new Date().toISOString();
  const updated = await dbAdmin
    .from('taxi_rides')
    .update({ driver_user_id: req.user.id, status: 'assigned', updated_at: now })
    .eq('id', ride_id)
    .selectAndReturnSingle();

  if (updated?.error || !updated?.data) throw new ValidationError('Erreur acceptation');

  try {
    await dbAdmin.from('taxi_ride_events').insert({
      id: crypto.randomUUID(),
      ride_id,
      type: 'ride_accepted',
      payload: { driver_user_id: req.user.id },
      created_at: now,
    });
  } catch { /* ignore */ }

  try {
    await dbAdmin
      .from('live_locations')
      .update({ is_busy: true, updated_at: now })
      .eq('user_id', req.user.id);
  } catch { /* ignore */ }

  try {
    const io = getIO();
    io?.to(roomKeyForUser(updated.data.client_user_id))?.emit('taxi:ride:updated', updated.data);
    io?.to(roomKeyForUser(updated.data.driver_user_id))?.emit('taxi:ride:updated', updated.data);
  } catch { /* ignore */ }

  return res.json({ success: true, data: updated.data });
}));

// POST /api/v1/taxi/driver/reject
router.post('/driver/reject', asyncHandler(async (req, res) => {
  assertDriver(req);

  const { ride_id } = req.body;
  if (!ride_id) throw new ValidationError('ride_id requis');

  const { data: existing, error: exErr } = await dbAdmin
    .from('taxi_rides')
    .select('*')
    .eq('id', ride_id)
    .single();

  if (exErr || !existing) throw new ValidationError('Course introuvable');
  if (String(existing.status || '') !== 'requested') throw new ValidationError('Course déjà prise');

  const now = new Date().toISOString();

  try {
    await dbAdmin.from('taxi_ride_events').insert({
      id: crypto.randomUUID(),
      ride_id,
      type: 'ride_declined',
      payload: { driver_user_id: req.user.id },
      created_at: now,
    });
  } catch { /* ignore */ }

  return res.json({ success: true, data: { ride_id, status: 'declined' } });
}));

// POST /api/v1/taxi/driver/start
router.post('/driver/start', asyncHandler(async (req, res) => {
  assertDriver(req);

  const { ride_id } = req.body;
  if (!ride_id) throw new ValidationError('ride_id requis');

  const { data: existing, error: exErr } = await dbAdmin
    .from('taxi_rides')
    .select('*')
    .eq('id', ride_id)
    .single();

  if (exErr || !existing) throw new ValidationError('Course introuvable');
  if (String(existing.driver_user_id || '') !== String(req.user.id)) throw new ValidationError('Accès refusé');

  const now = new Date().toISOString();
  const updated = await dbAdmin
    .from('taxi_rides')
    .update({ status: 'started', updated_at: now })
    .eq('id', ride_id)
    .selectAndReturnSingle();

  if (updated?.error || !updated?.data) throw new ValidationError('Erreur début course');

  try {
    await dbAdmin.from('taxi_ride_events').insert({
      id: crypto.randomUUID(),
      ride_id,
      type: 'ride_started',
      payload: { driver_user_id: req.user.id },
      created_at: now,
    });
  } catch { /* ignore */ }

  try {
    const io = getIO();
    io?.to(roomKeyForUser(updated.data.client_user_id))?.emit('taxi:ride:updated', updated.data);
    io?.to(roomKeyForUser(updated.data.driver_user_id))?.emit('taxi:ride:updated', updated.data);
  } catch { /* ignore */ }

  return res.json({ success: true, data: updated.data });
}));

// POST /api/v1/taxi/driver/complete
router.post('/driver/complete', asyncHandler(async (req, res) => {
  assertDriver(req);

  const { ride_id } = req.body;
  if (!ride_id) throw new ValidationError('ride_id requis');

  const { data: existing, error: exErr } = await dbAdmin
    .from('taxi_rides')
    .select('*')
    .eq('id', ride_id)
    .single();

  if (exErr || !existing) throw new ValidationError('Course introuvable');
  if (String(existing.driver_user_id || '') !== String(req.user.id)) throw new ValidationError('Accès refusé');

  const now = new Date().toISOString();
  const finalPrice = existing.estimated_price || 0;
  const updated = await dbAdmin
    .from('taxi_rides')
    .update({ status: 'completed', final_price: finalPrice, updated_at: now })
    .eq('id', ride_id)
    .selectAndReturnSingle();

  if (updated?.error || !updated?.data) throw new ValidationError('Erreur fin course');

  try {
    await dbAdmin.from('taxi_ride_events').insert({
      id: crypto.randomUUID(),
      ride_id,
      type: 'ride_completed',
      payload: { driver_user_id: req.user.id, final_price: finalPrice },
      created_at: now,
    });
  } catch { /* ignore */ }

  try {
    await dbAdmin
      .from('live_locations')
      .update({ is_busy: false, updated_at: now })
      .eq('user_id', req.user.id);
  } catch { /* ignore */ }

  try {
    const io = getIO();
    io?.to(roomKeyForUser(updated.data.client_user_id))?.emit('taxi:ride:updated', updated.data);
    io?.to(roomKeyForUser(updated.data.driver_user_id))?.emit('taxi:ride:updated', updated.data);
  } catch { /* ignore */ }

  return res.json({ success: true, data: updated.data });
}));

// GET /api/v1/taxi/driver/earnings
router.get('/driver/earnings', asyncHandler(async (req, res) => {
  assertDriver(req);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const earningsToday = await appDataSource.query(`
    SELECT COALESCE(SUM(final_price), 0) AS total
    FROM public.taxi_rides
    WHERE driver_user_id = $1
      AND status = 'completed'
      AND updated_at >= $2
  `, [req.user.id, today.toISOString()]);

  const totalEarnings = await appDataSource.query(`
    SELECT COALESCE(SUM(final_price), 0) AS total,
           COUNT(*) AS ride_count
    FROM public.taxi_rides
    WHERE driver_user_id = $1
      AND status = 'completed'
  `, [req.user.id]);

  const recentRides = await appDataSource.query(`
    SELECT id, pickup_address, dropoff_address, final_price, estimated_price, status, created_at, updated_at
    FROM public.taxi_rides
    WHERE driver_user_id = $1
    ORDER BY created_at DESC
    LIMIT 50
  `, [req.user.id]);

  return res.json({
    success: true,
    data: {
      today: Number(earningsToday[0]?.total || 0),
      total: Number(totalEarnings[0]?.total || 0),
      ride_count: Number(totalEarnings[0]?.ride_count || 0),
      recent_rides: recentRides || [],
    },
  });
}));

// ──────────────────────────────────────────────
//  TAXI SUBSCRIPTION ENDPOINTS
// ──────────────────────────────────────────────

// GET /api/v1/taxi/plans
router.get('/plans', asyncHandler(async (req, res) => {
  const rows = await appDataSource.query(`
    SELECT * FROM public.taxi_plans WHERE is_active = true ORDER BY price ASC
  `);
  return res.json({ success: true, data: rows || [] });
}));

// POST /api/v1/taxi/subscriptions
router.post('/subscriptions', asyncHandler(async (req, res) => {
  const { plan_id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, pickup_address, dropoff_address, schedule } = req.body;
  if (!plan_id) throw new ValidationError('plan_id requis');

  const [plan] = await appDataSource.query(`
    SELECT * FROM public.taxi_plans WHERE id = $1 AND is_active = true
  `, [plan_id]);

  if (!plan) throw new ValidationError('Plan introuvable ou inactif');

  const now = new Date();
  const periodEnd = new Date(now);
  const durationDays = plan.metadata?.duration_days || 30;
  periodEnd.setDate(periodEnd.getDate() + durationDays);

  const subscription = {
    id: crypto.randomUUID(),
    user_id: req.user.id,
    plan_id,
    status: 'active',
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    rides_used_today: 0,
    last_usage_day: null,
    metadata: {
      pickup_lat,
      pickup_lng,
      dropoff_lat,
      dropoff_lng,
      pickup_address: pickup_address || '',
      dropoff_address: dropoff_address || '',
      schedule: schedule || {},
    },
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  await appDataSource.query(`
    INSERT INTO public.taxi_subscriptions (id, user_id, plan_id, status, current_period_start, current_period_end, rides_used_today, last_usage_day, metadata, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  `, [
    subscription.id, subscription.user_id, subscription.plan_id,
    subscription.status, subscription.current_period_start,
    subscription.current_period_end, subscription.rides_used_today,
    subscription.last_usage_day, JSON.stringify(subscription.metadata),
    subscription.created_at, subscription.updated_at,
  ]);

  return res.status(201).json({ success: true, data: subscription });
}));

// GET /api/v1/taxi/subscriptions
router.get('/subscriptions', asyncHandler(async (req, res) => {
  const rows = await appDataSource.query(`
    SELECT s.*, p.name AS plan_name, p.code AS plan_code, p.price AS plan_price, p.rides_per_day
    FROM public.taxi_subscriptions s
    LEFT JOIN public.taxi_plans p ON p.id = s.plan_id
    WHERE s.user_id = $1
    ORDER BY s.created_at DESC
  `, [req.user.id]);

  return res.json({ success: true, data: rows || [] });
}));

export default router;

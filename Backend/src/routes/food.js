import express from 'express';
import Joi from 'joi';
import crypto from 'crypto';
import { dbAdmin } from '../config/db.js';
import { appDataSource } from '../db/dataSource.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

const placeOrderSchema = Joi.object({
  restaurant_id: Joi.string().uuid().required(),
  items: Joi.array().items(
    Joi.object({
      menu_item_id: Joi.string().uuid().required(),
      name: Joi.string().trim().required(),
      quantity: Joi.number().integer().min(1).required(),
      price: Joi.number().min(0).required(),
      notes: Joi.string().allow('').max(500).optional(),
    })
  ).min(1).required(),
  total_amount: Joi.number().min(0).required(),
  notes: Joi.string().allow('').max(1000).optional(),
  delivery_address: Joi.object({
    address: Joi.string().allow('').optional(),
    city: Joi.string().allow('').optional(),
    lat: Joi.number().allow(null).optional(),
    lng: Joi.number().allow(null).optional(),
  }).default({}).optional(),
  currency: Joi.string().default('XAF').optional(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('confirmed', 'preparing', 'ready', 'delivered', 'cancelled').required(),
});

async function ensureFoodTables() {
  try {
    await appDataSource.query(`
      CREATE TABLE IF NOT EXISTS public.food_menu_items (
        id uuid PRIMARY KEY,
        agency_id uuid NOT NULL,
        name text NOT NULL,
        description text NOT NULL DEFAULT '',
        price numeric NOT NULL,
        category text NOT NULL DEFAULT 'plat',
        image_url text NOT NULL DEFAULT '',
        is_available boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await appDataSource.query(`
      CREATE TABLE IF NOT EXISTS public.food_orders (
        id uuid PRIMARY KEY,
        agency_id uuid NOT NULL,
        client_user_id uuid NOT NULL,
        status text NOT NULL DEFAULT 'pending',
        items jsonb NOT NULL DEFAULT '[]'::jsonb,
        total_amount numeric NOT NULL,
        currency text NOT NULL DEFAULT 'XAF',
        notes text NOT NULL DEFAULT '',
        delivery_address jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await appDataSource.query('CREATE INDEX IF NOT EXISTS idx_food_menu_agency ON public.food_menu_items(agency_id)');
    await appDataSource.query('CREATE INDEX IF NOT EXISTS idx_food_menu_category ON public.food_menu_items(category)');
    await appDataSource.query('CREATE INDEX IF NOT EXISTS idx_food_orders_agency ON public.food_orders(agency_id)');
    await appDataSource.query('CREATE INDEX IF NOT EXISTS idx_food_orders_client ON public.food_orders(client_user_id)');
    await appDataSource.query('CREATE INDEX IF NOT EXISTS idx_food_orders_status ON public.food_orders(status)');
    logger.info('✅ Food tables ensured');
  } catch (e) {
    logger.warn('⚠️ Food tables check failed', { message: e?.message });
  }
}

ensureFoodTables();

router.use(authenticateToken);

// GET /api/v1/food/restaurants — Lister les restaurants
router.get('/restaurants', asyncHandler(async (req, res) => {
  const { search, category, city } = req.query;

  const { data: approvedServices, error: svcErr } = await dbAdmin
    .from('agency_service_requests')
    .select('agency_id')
    .eq('service_id', 'restaurant')
    .eq('status', 'approved');

  if (svcErr) throw new ValidationError('Erreur lors de la récupération des restaurants');
  const agencyIds = (Array.isArray(approvedServices) ? approvedServices : []).map(s => s.agency_id).filter(Boolean);
  if (agencyIds.length === 0) {
    return res.json({ success: true, data: [] });
  }

  let query = dbAdmin
    .from('agencies')
    .select('*')
    .in('id', agencyIds)
    .eq('status', 'approved')
    .eq('is_active', true);

  if (search) query = query.ilike('name', `%${search}%`);
  if (city) query = query.ilike('city', `%${city}%`);

  const { data: agencies, error: agErr } = await query.order('name', { ascending: true });

  if (agErr) throw new ValidationError('Erreur lors du chargement des restaurants');

  const items = (Array.isArray(agencies) ? agencies : []).map(a => {
    const payload = a.metadata || {};
    return {
      id: a.id,
      name: a.name,
      city: a.city || '',
      address: a.address || '',
      logo_url: a.logo_url || '',
      latitude: a.latitude,
      longitude: a.longitude,
      rating: payload.rating || '4.5',
      delivery_time: payload.delivery_time || '20-30 min',
      delivery_fee: payload.delivery_fee || 0,
      cuisine: payload.cuisine || 'Locale',
      is_open: payload.is_open !== false,
    };
  });

  if (category) {
    const filtered = items.filter(r =>
      r.cuisine.toLowerCase().includes(category.toLowerCase())
    );
    return res.json({ success: true, data: filtered });
  }

  return res.json({ success: true, data: items });
}));

// GET /api/v1/food/restaurants/:id — Détail restaurant
router.get('/restaurants/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: agency, error: agErr } = await dbAdmin
    .from('agencies')
    .select('*')
    .eq('id', id)
    .single();

  if (agErr || !agency) throw new NotFoundError('Restaurant introuvable');

  const { data: menuItems, error: menuErr } = await dbAdmin
    .from('food_menu_items')
    .select('*')
    .eq('agency_id', id)
    .eq('is_available', true)
    .order('category', { ascending: true });

  if (menuErr) throw new ValidationError('Erreur lors du chargement du menu');

  const payload = agency.metadata || {};

  return res.json({
    success: true,
    data: {
      id: agency.id,
      name: agency.name,
      city: agency.city || '',
      address: agency.address || '',
      logo_url: agency.logo_url || '',
      latitude: agency.latitude,
      longitude: agency.longitude,
      rating: payload.rating || '4.5',
      delivery_time: payload.delivery_time || '20-30 min',
      delivery_fee: payload.delivery_fee || 0,
      cuisine: payload.cuisine || 'Locale',
      is_open: payload.is_open !== false,
      description: payload.description || '',
      menu: Array.isArray(menuItems) ? menuItems : [],
    },
  });
}));

// GET /api/v1/food/restaurants/:id/menu — Menu du restaurant
router.get('/restaurants/:id/menu', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: menuItems, error: menuErr } = await dbAdmin
    .from('food_menu_items')
    .select('*')
    .eq('agency_id', id)
    .eq('is_available', true)
    .order('category', { ascending: true });

  if (menuErr) throw new ValidationError('Erreur lors du chargement du menu');

  return res.json({
    success: true,
    data: Array.isArray(menuItems) ? menuItems : [],
  });
}));

// POST /api/v1/food/orders — Passer une commande
router.post('/orders', asyncHandler(async (req, res) => {
  const { error, value } = placeOrderSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const { data: serviceCheck } = await dbAdmin
    .from('agency_service_requests')
    .select('agency_id')
    .eq('agency_id', value.restaurant_id)
    .eq('service_id', 'restaurant')
    .eq('status', 'approved')
    .single();

  if (!serviceCheck) throw new NotFoundError('Restaurant non disponible');

  const now = new Date().toISOString();
  const orderId = crypto.randomUUID();

  const order = {
    id: orderId,
    agency_id: value.restaurant_id,
    client_user_id: req.user.id,
    status: 'pending',
    items: JSON.stringify(value.items.map(item => ({
      menu_item_id: item.menu_item_id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      notes: item.notes || '',
    }))),
    total_amount: value.total_amount,
    currency: value.currency || 'XAF',
    notes: value.notes || '',
    delivery_address: JSON.stringify(value.delivery_address || {}),
    created_at: now,
    updated_at: now,
  };

  const { data: created, error: insertErr } = await dbAdmin
    .from('food_orders')
    .insert(order)
    .select('*')
    .single();

  if (insertErr || !created) {
    throw new ValidationError('Erreur lors de la création de la commande');
  }

  logger.info(`Nouvelle commande food #${orderId}`, {
    restaurantId: value.restaurant_id,
    userId: req.user.id,
    amount: value.total_amount,
  });

  return res.status(201).json({ success: true, data: created });
}));

// GET /api/v1/food/orders — Mes commandes
router.get('/orders', asyncHandler(async (req, res) => {
  const { data: orders, error: ordErr } = await dbAdmin
    .from('food_orders')
    .select('*')
    .eq('client_user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (ordErr) throw new ValidationError('Erreur lors du chargement des commandes');

  const items = (Array.isArray(orders) ? orders : []).map(o => ({
    ...o,
    items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
    delivery_address: typeof o.delivery_address === 'string' ? JSON.parse(o.delivery_address) : o.delivery_address,
  }));

  return res.json({ success: true, data: items });
}));

// GET /api/v1/food/orders/:id — Détail commande
router.get('/orders/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: order, error: ordErr } = await dbAdmin
    .from('food_orders')
    .select('*')
    .eq('id', id)
    .single();

  if (ordErr || !order) throw new NotFoundError('Commande introuvable');

  if (String(order.client_user_id) !== String(req.user.id)) {
    const { data: membership } = await dbAdmin
      .from('agency_memberships')
      .select('*')
      .eq('agency_id', order.agency_id)
      .eq('user_id', req.user.id)
      .in('status', ['approved'])
      .single();

    if (!membership) throw new ValidationError('Accès refusé');
  }

  return res.json({
    success: true,
    data: {
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
      delivery_address: typeof order.delivery_address === 'string' ? JSON.parse(order.delivery_address) : order.delivery_address,
    },
  });
}));

// PATCH /api/v1/food/orders/:id/status — Changer statut (restaurant)
router.patch('/orders/:id/status', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { error, value } = updateStatusSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const { data: order, error: ordErr } = await dbAdmin
    .from('food_orders')
    .select('*')
    .eq('id', id)
    .single();

  if (ordErr || !order) throw new NotFoundError('Commande introuvable');

  const { data: membership } = await dbAdmin
    .from('agency_memberships')
    .select('*')
    .eq('agency_id', order.agency_id)
    .eq('user_id', req.user.id)
    .in('status', ['approved'])
    .single();

  const { data: agencyCheck } = await dbAdmin
    .from('agencies')
    .select('owner_user_id')
    .eq('id', order.agency_id)
    .single();

  const isOwner = agencyCheck && String(agencyCheck.owner_user_id) === String(req.user.id);
  if (!membership && !isOwner) {
    throw new ValidationError('Accès refusé');
  }

  const now = new Date().toISOString();
  const { data: updated, error: upErr } = await dbAdmin
    .from('food_orders')
    .update({ status: value.status, updated_at: now })
    .eq('id', id)
    .select('*')
    .single();

  if (upErr || !updated) throw new ValidationError('Erreur lors de la mise à jour du statut');

  logger.info(`Commande food #${id} status → ${value.status}`, { userId: req.user.id });

  return res.json({ success: true, data: updated });
}));

export default router;

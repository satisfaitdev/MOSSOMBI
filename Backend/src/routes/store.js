import express from 'express';
import Joi from 'joi';
import crypto from 'crypto';
import { dbAdmin } from '../config/db.js';
import { asyncHandler, ValidationError } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const listProductsSchema = Joi.object({
  q: Joi.string().allow('').max(100).optional(),
  agency_id: Joi.string().guid({ version: 'uuidv4' }).optional(),
  limit: Joi.number().integer().min(1).max(100).default(40).optional(),
  offset: Joi.number().integer().min(0).default(0).optional(),
});

// GET /api/v1/store/products
router.get('/products', asyncHandler(async (req, res) => {
  const { error, value } = listProductsSchema.validate(req.query);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const q = value.q ? String(value.q).trim() : '';

  let query = dbAdmin
    .from('agency_articles')
    .select('id, agency_id, name, description, price, in_stock, country, delivery_time, status, created_at, image_url')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(value.offset, value.offset + value.limit - 1);

  if (value.agency_id) query = query.eq('agency_id', value.agency_id);
  if (q) query = query.ilike('name', `%${q}%`);

  const { data, error: dbErr } = await query;
  if (dbErr) throw new ValidationError(`Erreur lors de la récupération des produits: ${String(dbErr.message || '')}`);

  return res.json({ success: true, data: data || [] });
}));

const checkoutSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      article_id: Joi.string().guid({ version: 'uuidv4' }).required(),
      quantity: Joi.number().integer().min(1).max(100).default(1),
    })
  ).min(1).required(),
  client_name: Joi.string().allow('').max(200).optional(),
  client_phone: Joi.string().allow('').max(32).optional(),
  delivery_type: Joi.string().allow('').max(64).optional(),
  delivery_fee_amount: Joi.number().min(0).optional(),
});

// POST /api/v1/store/checkout
// Crée une ou plusieurs lignes agency_sales (une par article) pour le service "store".
router.post('/checkout', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = checkoutSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const ids = value.items.map(i => i.article_id);
  const { data: articles, error: artErr } = await dbAdmin
    .from('agency_articles')
    .select('id, agency_id, name, price, status, in_stock')
    .in('id', ids);

  if (artErr) throw new ValidationError(`Erreur chargement articles: ${String(artErr.message || '')}`);

  const byId = new Map((articles || []).map(a => [String(a.id), a]));

  const now = new Date().toISOString();
  const rows = [];
  let total_amount = 0;

  for (const item of value.items) {
    const art = byId.get(String(item.article_id));
    if (!art) throw new ValidationError(`Article introuvable: ${item.article_id}`);
    if (String(art.status) !== 'active') throw new ValidationError(`Article indisponible: ${item.article_id}`);
    if (art.in_stock === false) throw new ValidationError(`Article en rupture de stock: ${item.article_id}`);

    const unit = Number(art.price || 0);
    const qty = Number(item.quantity || 1);
    const amount = (unit * qty) + (Number(value.delivery_fee_amount || 0) / value.items.length); // Spreading delivery fee evenly across items or handled directly by UI
    total_amount += amount;

    rows.push({
      id: crypto.randomUUID(),
      agency_id: art.agency_id,
      service_id: 'store',
      amount,
      currency: 'CDF',
      client_user_id: req.user.id,
      client_name: value.client_name || '',
      client_phone: value.client_phone || '',
      sold_by_user_id: req.user.id,
      reference_type: 'agency_article',
      reference_id: art.id,
      commission_amount: null,
      metadata: {
        article_name: art.name,
        unit_price: unit,
        quantity: qty,
        delivery_status: 'pending',
        delivery_type: value.delivery_type || 'Standard',
        delivery_fee: value.delivery_fee_amount || 0,
      },
      created_at: now,
      updated_at: now,
    });
  }

  const { data: sales, error: saleErr } = await dbAdmin
    .from('agency_sales')
    .insert(rows)
    .select('*');

  if (saleErr) throw new ValidationError(`Erreur création vente: ${String(saleErr.message || '')}`);

  return res.status(201).json({
    success: true,
    data: {
      total_amount,
      currency: 'CDF',
      sales: sales || [],
    },
  });
}));

export default router;

import express from 'express';
import Joi from 'joi';
import crypto from 'crypto';
import { dbAdmin } from '../config/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler.js';

const router = express.Router();

const listingSchema = Joi.object({
  type: Joi.string().valid('apartment', 'house', 'villa', 'land', 'commercial').required(),
  transaction: Joi.string().valid('rent', 'sell').required(),
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(2000).allow('', null),
  price: Joi.number().positive().required(),
  city: Joi.string().required(),
  address: Joi.string().allow('', null),
  lat: Joi.number().min(-90).max(90).optional(),
  lng: Joi.number().min(-180).max(180).optional(),
  surface: Joi.number().positive().optional(),
  rooms: Joi.number().integer().min(0).optional(),
  bedrooms: Joi.number().integer().min(0).optional(),
  bathrooms: Joi.number().integer().min(0).optional(),
  images: Joi.array().items(Joi.string().uri()).optional(),
});

const contactSchema = Joi.object({
  message: Joi.string().min(1).max(1000).required(),
  name: Joi.string().allow('', null),
  phone: Joi.string().allow('', null),
});

const movingQuoteSchema = Joi.object({
  from_address: Joi.string().required(),
  to_address: Joi.string().required(),
  date: Joi.date().iso().optional(),
  volume_estimate: Joi.string().allow('', null),
  notes: Joi.string().max(1000).allow('', null),
});

router.get('/listings', asyncHandler(async (req, res) => {
  const { city, type, transaction, min_price, max_price } = req.query;

  let query = dbAdmin.from('property_listings').select('*').eq('status', 'active').order('created_at', { ascending: false });

  if (city) query = query.ilike('city', `%${city}%`);
  if (type) query = query.eq('type', type);
  if (transaction) query = query.eq('transaction', transaction);
  if (min_price) query = query.gte('price', parseFloat(min_price));
  if (max_price) query = query.lte('price', parseFloat(max_price));

  const { data, error } = await query.limit(100);

  if (error) throw new Error(error.message);

  return res.json({ success: true, data: data || [] });
}));

router.post('/listings', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = listingSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message);

  const id = crypto.randomUUID();

  const { data: listing, error: insertErr } = await dbAdmin
    .from('property_listings')
    .insert({
      id,
      agent_id: req.user.id,
      ...value,
      images: value.images || [],
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertErr) throw new Error(insertErr.message);

  return res.status(201).json({ success: true, data: listing });
}));

router.get('/listings/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: listing, error } = await dbAdmin
    .from('property_listings')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !listing) throw new NotFoundError('Annonce introuvable');

  let agent = null;
  if (listing.agent_id) {
    const { data: agentData } = await dbAdmin
      .from('users')
      .select('id, first_name, last_name, phone, email, avatar_url')
      .eq('id', listing.agent_id)
      .single();
    agent = agentData;
  }

  return res.json({ success: true, data: { ...listing, agent } });
}));

router.post('/listings/:id/contact', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { error, value } = contactSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message);

  const { data: listing, error: fetchErr } = await dbAdmin
    .from('property_listings')
    .select('id, agent_id, title')
    .eq('id', id)
    .single();

  if (fetchErr || !listing) throw new NotFoundError('Annonce introuvable');

  const contactId = crypto.randomUUID();
  const { data: contact, error: insertErr } = await dbAdmin
    .from('property_contacts')
    .insert({
      id: contactId,
      listing_id: id,
      user_id: req.user.id,
      agent_id: listing.agent_id,
      message: value.message,
      name: value.name || '',
      phone: value.phone || '',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertErr) throw new Error(insertErr.message);

  return res.status(201).json({ success: true, data: contact });
}));

router.post('/moving/quote', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = movingQuoteSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message);

  const id = crypto.randomUUID();

  const { data: request, error: insertErr } = await dbAdmin
    .from('moving_requests')
    .insert({
      id,
      user_id: req.user.id,
      from_address: value.from_address,
      to_address: value.to_address,
      date: value.date || null,
      volume_estimate: value.volume_estimate || '',
      notes: value.notes || '',
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertErr) throw new Error(insertErr.message);

  return res.status(201).json({ success: true, data: request });
}));

router.get('/moving/requests', authenticateToken, asyncHandler(async (req, res) => {
  const { data, error } = await dbAdmin
    .from('moving_requests')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return res.json({ success: true, data: data || [] });
}));

export default router;

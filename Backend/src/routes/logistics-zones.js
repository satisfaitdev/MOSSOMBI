import express from 'express';
import Joi from 'joi';
import crypto from 'crypto';
import { dbAdmin } from '../config/db.js';
import { appDataSource } from '../db/dataSource.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler.js';

const router = express.Router();

// 🚀 GET /api/v1/logistics-zones - Liste des zones
router.get('/', asyncHandler(async (req, res) => {
  const { data: zones, error } = await dbAdmin
    .from('logistics_zones')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return res.json({ success: true, data: zones || [] });
}));

// 🚀 POST /api/v1/logistics-zones/match - Trouver une zone par coordonnées
router.post('/match', asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.body;
  if (!latitude || !longitude) throw new ValidationError('Latitude et longitude requises');

  // Utilisation de PostGIS pour trouver si le point est dans un polygone OU à moins de 500m
  // ST_Distance avec cast en geography donne des mètres
  const query = `
    SELECT id, name, city, base_fee, multiplier,
           ST_Within(ST_SetSRID(ST_Point($1, $2), 4326), boundary) as is_inside,
           ST_Distance(ST_SetSRID(ST_Point($1, $2), 4326)::geography, boundary::geography) as distance_meters
    FROM public.logistics_zones 
    WHERE is_active = true 
    ORDER BY 
      is_inside DESC,
      distance_meters ASC
    LIMIT 1
  `;
  
  const results = await appDataSource.query(query, [longitude, latitude]);

  if (!results || results.length === 0) {
    return res.json({ success: true, data: null, message: 'Aucune zone logistique définie dans ce pays' });
  }

  const bestZone = results[0];
  const isDeliverable = bestZone.is_inside || bestZone.distance_meters <= 500;

  if (!isDeliverable) {
    return res.json({ 
      success: false, 
      data: null, 
      message: `Nous ne livrons pas encore sur cette zone (distance: ${Math.round(bestZone.distance_meters)}m)`,
      nearest_zone: bestZone.name 
    });
  }

  return res.json({ success: true, data: bestZone });
}));

// 🚀 POST /api/v1/logistics-zones - Créer une zone (Admin)
router.post('/', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    city: Joi.string().required(),
    boundary: Joi.array().items(Joi.array().items(Joi.number())).min(3).required(), // Array of [lng, lat]
    base_fee: Joi.number().default(0),
    multiplier: Joi.number().default(1),
  });

  const { error, value } = schema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message);

  // Convert array of coordinates to WKT Polygon
  const coords = value.boundary.map(p => `${p[0]} ${p[1]}`).join(', ');
  // Ensure polygon is closed
  const first = value.boundary[0];
  const last = value.boundary[value.boundary.length - 1];
  const closedCoords = (first[0] === last[0] && first[1] === last[1]) ? coords : `${coords}, ${first[0]} ${first[1]}`;
  const wkt = `POLYGON((${closedCoords}))`;

  const id = crypto.randomUUID();
  
  const query = `
    INSERT INTO public.logistics_zones (id, name, city, boundary, base_fee, multiplier)
    VALUES ($1, $2, $3, ST_GeomFromText($4, 4326), $5, $6)
    RETURNING *
  `;
  
  const results = await appDataSource.query(query, [id, value.name, value.city, wkt, value.base_fee, value.multiplier]);

  return res.status(201).json({ success: true, data: results[0] });
}));

// 🚀 DELETE /api/v1/logistics-zones/:id - Supprimer une zone (Admin)
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { error } = await dbAdmin.from('logistics_zones').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return res.json({ success: true, message: 'Zone supprimée' });
}));

export default router;

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { ValidationError, asyncHandler } from '../middleware/errorHandler.js';
import { appDataSource } from '../db/dataSource.js';

const router = express.Router();

// GET /api/v1/live-locations?service_id=courier&city=kinshasa&lat=-4.3&lng=15.3&radius_m=5000
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const service_id = String(req.query.service_id || '').trim();
  const city = req.query.city ? String(req.query.city || '').trim() : '';

  const lat = req.query.lat !== undefined ? Number(req.query.lat) : null;
  const lng = req.query.lng !== undefined ? Number(req.query.lng) : null;
  const radiusM = req.query.radius_m !== undefined ? Number(req.query.radius_m) : 5000;

  const limit = req.query.limit !== undefined ? Math.min(200, Math.max(1, Number(req.query.limit))) : 100;

  if (!service_id) throw new ValidationError('service_id requis');

  // positions récentes
  const staleSeconds = req.query.stale_s !== undefined ? Number(req.query.stale_s) : 120;

  const params = [service_id, staleSeconds, limit];
  let where = `service_id = $1 AND is_visible = true AND ll.updated_at > (now() - ($2 || ' seconds')::interval)`;

  if (city) {
    params.push(city);
    where += ` AND lower(city) = lower($${params.length})`;
  }

  let geoFilter = '';
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    params.push(lng);
    params.push(lat);
    params.push(radiusM);
    geoFilter = ` AND ST_DWithin(location, ST_SetSRID(ST_MakePoint($${params.length - 2}, $${params.length - 1}), 4326)::geography, $${params.length})`;
  }

  const sql = `
    SELECT
      ll.user_id,
      ll.service_id,
      ll.city,
      ll.is_visible,
      ll.is_busy,
      ll.heading,
      ll.speed,
      ll.accuracy,
      ll.updated_at,
      ST_Y(ll.location::geometry) AS lat,
      ST_X(ll.location::geometry) AS lng,
      u.full_name,
      u.avatar_url
    FROM public.live_locations ll
    LEFT JOIN public.users u ON u.id = ll.user_id
    WHERE ${where} ${geoFilter}
    ORDER BY ll.updated_at DESC
    LIMIT $3
  `;

  const rows = await appDataSource.query(sql, params);
  return res.json({ success: true, data: rows || [] });
}));

export default router;

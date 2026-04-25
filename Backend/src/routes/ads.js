import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { initDatabase, appDataSource } from '../db/dataSource.js';

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const type = req.query.type ? String(req.query.type) : null;
  const city = req.query.city ? String(req.query.city) : null;

  await initDatabase();

  const params = [];
  let idx = 1;

  const where = [];
  where.push('is_active = true');
  where.push('(starts_at IS NULL OR starts_at <= now())');
  where.push('(ends_at IS NULL OR ends_at >= now())');

  if (type) {
    params.push(type);
    where.push(`type = $${idx++}`);
  }

  if (city) {
    params.push(city);
    const cityParam = `$${idx++}`;
    where.push(`(
      COALESCE(array_length(target_cities, 1), 0) = 0
      OR EXISTS (
        SELECT 1
        FROM unnest(target_cities) AS tc
        WHERE lower(tc) = lower(${cityParam})
      )
    )`);
  }

  const sql = `
    SELECT *
    FROM public.ads
    WHERE ${where.join(' AND ')}
    ORDER BY priority DESC, updated_at DESC
  `;

  const data = await appDataSource.query(sql, params);

  return res.json({ success: true, data: data || [] });
}));

export default router;

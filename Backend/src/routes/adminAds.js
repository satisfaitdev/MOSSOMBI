import express from 'express';
import Joi from 'joi';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import { dbAdmin } from '../config/db.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,webp').split(',');
    const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);

    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new ValidationError(`Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`));
    }
  },
});

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

const createSchema = Joi.object({
  type: Joi.string().valid('banner', 'popup', 'splash').required(),
  title: Joi.string().allow('').max(200).optional(),
  link_url: Joi.string().allow('').max(2000).optional(),
  image_url: Joi.string().allow('').max(2000000).optional(),
  target_cities: Joi.array().items(Joi.string().trim().max(128)).optional(),
  starts_at: Joi.date().iso().allow(null).optional(),
  ends_at: Joi.date().iso().allow(null).optional(),
  priority: Joi.number().integer().min(0).max(10000).optional(),
  is_active: Joi.boolean().optional(),
});

const updateSchema = Joi.object({
  type: Joi.string().valid('banner', 'popup', 'splash').optional(),
  title: Joi.string().allow('').max(200).optional(),
  link_url: Joi.string().allow('').max(2000).optional(),
  image_url: Joi.string().allow('').max(2000000).optional(),
  target_cities: Joi.array().items(Joi.string().trim().max(128)).optional(),
  starts_at: Joi.date().iso().allow(null).optional(),
  ends_at: Joi.date().iso().allow(null).optional(),
  priority: Joi.number().integer().min(0).max(10000).optional(),
  is_active: Joi.boolean().optional(),
}).min(1);

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', asyncHandler(async (req, res) => {
  const type = req.query.type ? String(req.query.type) : null;
  const isActiveRaw = req.query.is_active;

  let query = dbAdmin.from('ads').select('*').order('priority', { ascending: false }).order('updated_at', { ascending: false });

  if (type) query = query.eq('type', type);
  if (isActiveRaw !== undefined) {
    const v = String(isActiveRaw).toLowerCase();
    if (v === 'true' || v === 'false') query = query.eq('is_active', v === 'true');
  }

  const { data, error } = await query;
  if (error) throw new ValidationError('Erreur lors de la récupération des ads');

  return res.json({ success: true, data: data || [] });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const { data, error } = await dbAdmin.from('ads').select('*').eq('id', id).single();
  if (error || !data) throw new NotFoundError('Ad introuvable');
  return res.json({ success: true, data });
}));

router.post('/', upload.single('image'), asyncHandler(async (req, res) => {
  const payload = req.is('multipart/form-data') ? req.body : req.body;
  const { error, value } = createSchema.validate(payload);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  let imageUrl = value.image_url || null;
  if (req.file?.buffer) {
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    imageUrl = base64Image;
  }

  const now = new Date().toISOString();
  const row = {
    id: crypto.randomUUID(),
    type: value.type,
    title: value.title || '',
    link_url: value.link_url || '',
    image_url: imageUrl || '',
    target_cities: Array.isArray(value.target_cities) ? value.target_cities : [],
    starts_at: value.starts_at ? new Date(value.starts_at).toISOString() : null,
    ends_at: value.ends_at ? new Date(value.ends_at).toISOString() : null,
    priority: value.priority ?? 0,
    is_active: value.is_active ?? true,
    created_at: now,
    updated_at: now,
  };

  const { data, error: insertError } = await dbAdmin.from('ads').insert(row).select('*').single();
  if (insertError) throw new ValidationError('Erreur lors de la création');

  return res.status(201).json({ success: true, data });
}));

router.put('/:id', upload.single('image'), asyncHandler(async (req, res) => {
  const { error, value } = updateSchema.validate(req.is('multipart/form-data') ? req.body : req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const id = String(req.params.id);

  let imageUrl = value.image_url;
  if (req.file?.buffer) {
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    imageUrl = base64Image;
  }

  const updates = {
    ...value,
    ...(imageUrl !== undefined ? { image_url: imageUrl } : {}),
    updated_at: new Date().toISOString(),
  };
  if (updates.target_cities !== undefined && !Array.isArray(updates.target_cities)) {
    updates.target_cities = [];
  }

  if (updates.starts_at !== undefined) {
    updates.starts_at = updates.starts_at ? new Date(updates.starts_at).toISOString() : null;
  }
  if (updates.ends_at !== undefined) {
    updates.ends_at = updates.ends_at ? new Date(updates.ends_at).toISOString() : null;
  }

  const { data, error: updateError } = await dbAdmin.from('ads').update(updates).eq('id', id).select('*').single();
  if (updateError) throw new NotFoundError('Ad introuvable');

  return res.json({ success: true, data });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const id = String(req.params.id);

  const { data, error } = await dbAdmin.from('ads').delete().eq('id', id).select('*').single();
  if (error) throw new NotFoundError('Ad introuvable');

  return res.json({ success: true, data });
}));

export default router;

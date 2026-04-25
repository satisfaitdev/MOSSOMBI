/**
 * ROUTES ADMIN (BOOTSTRAP)
 * Endpoints réservés à l'initialisation des rôles (ex: promouvoir un user en admin)
 */

import express from 'express';
import Joi from 'joi';
import { dbAdmin } from '../config/db.js';
import { asyncHandler, ValidationError, AuthorizationError, NotFoundError } from '../middleware/errorHandler.js';

const router = express.Router();

const promoteSchema = Joi.object({
  identifier: Joi.string().required(),
  role: Joi.string().valid('user', 'agent', 'admin', 'super_admin').required(),
});

function requireBootstrapSecret(req) {
  const expected = process.env.ADMIN_BOOTSTRAP_SECRET;
  if (!expected) {
    throw new AuthorizationError('ADMIN_BOOTSTRAP_SECRET non configuré');
  }

  const received = req.headers['x-admin-bootstrap-secret'];
  if (!received || String(received) !== String(expected)) {
    throw new AuthorizationError('Secret admin invalide');
  }
}

/**
 * POST /api/v1/admin/promote-user
 * Header: x-admin-bootstrap-secret
 * Body: { identifier: email|phone, role: user|agent|admin|super_admin }
 */
router.post('/promote-user', asyncHandler(async (req, res) => {
  requireBootstrapSecret(req);

  const { error, value } = promoteSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const rawIdentifier = String(value.identifier || '').trim();
  const isEmail = rawIdentifier.includes('@');
  const cleanPhone = isEmail ? null : rawIdentifier.replace(/^(\+)?/, '').replace(/\s+/g, '');
  const formattedPhone = isEmail ? null : `+${cleanPhone}`;

  const lookupColumn = isEmail ? 'email' : 'phone';
  const lookupValue = isEmail ? rawIdentifier.toLowerCase() : formattedPhone;

  const { data: user, error: lookupError } = await dbAdmin
    .from('users')
    .select('id, email, phone, full_name, role, is_super_admin')
    .eq(lookupColumn, lookupValue)
    .single();

  if (lookupError || !user) {
    throw new NotFoundError('Utilisateur introuvable');
  }

  const updates = {
    role: value.role,
    is_super_admin: value.role === 'super_admin' ? true : user.is_super_admin,
    updated_at: new Date().toISOString(),
  };

  const { data: updated, error: updateError } = await dbAdmin
    .from('users')
    .update(updates)
    .eq('id', user.id)
    .select('id, email, phone, full_name, role, is_super_admin')
    .single();

  if (updateError) {
    throw new ValidationError('Impossible de promouvoir l\'utilisateur');
  }

  return res.json({
    success: true,
    message: 'Utilisateur promu',
    data: updated,
  });
}));

export default router;

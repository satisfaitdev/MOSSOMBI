import express from 'express';
import Joi from 'joi';
import crypto from 'crypto';
import { dbAdmin } from '../config/db.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Schémas de validation
const articleSchema = Joi.object({
    name: Joi.string().trim().min(2).max(200).required(),
    description: Joi.string().allow('').max(2000).optional(),
    price: Joi.number().min(0).required(),
    in_stock: Joi.boolean().default(true),
    country: Joi.string().default('RD Congo'),
    delivery_time: Joi.string().default('24-48h'),
});

const ticketSchema = Joi.object({
    event_name: Joi.string().trim().min(2).max(200).required(),
    event_date: Joi.date().iso().optional(),
    venue: Joi.string().allow('').max(300).optional(),
    ticket_type: Joi.string().default('standard'),
    price: Joi.number().min(0).required(),
    quantity_total: Joi.number().integer().min(1).required(),
});

router.use(authenticateToken);

/**
 * Utile pour vérifier si l'utilisateur appartient à une agence active
 */
async function getActiveAgencyMembership(userId) {
    const { data: membership } = await dbAdmin
        .from('agency_memberships')
        .select('agency_id, role_in_agency')
        .eq('user_id', userId)
        .eq('status', 'approved')
        .single();

    if (!membership) throw new ValidationError('Vous n\'êtes pas membre d\'une agence approuvée');
    return membership;
}

// ARTICLES (Marketplace)
router.post('/articles', asyncHandler(async (req, res) => {
    const { error, value } = articleSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const membership = await getActiveAgencyMembership(req.user.id);
    const now = new Date().toISOString();

    const article = {
        id: crypto.randomUUID(),
        agency_id: membership.agency_id,
        created_by_user_id: req.user.id,
        ...value,
        status: 'active',
        created_at: now,
        updated_at: now
    };

    const { data, error: dbErr } = await dbAdmin.from('agency_articles').insert(article).select().single();
    if (dbErr) throw dbErr;

    res.status(201).json({ success: true, data });
}));

router.get('/articles', asyncHandler(async (req, res) => {
    const membership = await getActiveAgencyMembership(req.user.id);

    const { data, error } = await dbAdmin
        .from('agency_articles')
        .select('*')
        .eq('agency_id', membership.agency_id)
        .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
}));

// TICKETS (Billetterie)
router.post('/tickets', asyncHandler(async (req, res) => {
    const { error, value } = ticketSchema.validate(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const membership = await getActiveAgencyMembership(req.user.id);
    const now = new Date().toISOString();

    const ticket = {
        id: crypto.randomUUID(),
        agency_id: membership.agency_id,
        created_by_user_id: req.user.id,
        ...value,
        quantity_sold: 0,
        status: 'active',
        created_at: now,
        updated_at: now
    };

    const { data, error: dbErr } = await dbAdmin.from('agency_tickets').insert(ticket).select().single();
    if (dbErr) throw dbErr;

    res.status(201).json({ success: true, data });
}));

router.get('/tickets', asyncHandler(async (req, res) => {
    const membership = await getActiveAgencyMembership(req.user.id);

    const { data, error } = await dbAdmin
        .from('agency_tickets')
        .select('*')
        .eq('agency_id', membership.agency_id)
        .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
}));

export default router;

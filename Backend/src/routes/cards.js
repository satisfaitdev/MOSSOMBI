import express from 'express';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';
import { dbAdmin } from '../config/db.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

const createCardSchema = Joi.object({
  brand: Joi.string().valid('VISA', 'MASTERCARD').required(),
  label: Joi.string().min(2).max(50).default('Ma Carte'),
});

router.post('/create', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = createCardSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const last4 = String(1000 + Math.floor(Math.random() * 9000));
  const expiryMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const expiryYear = String(new Date().getFullYear() + 3).slice(-2);
  const cardNumberMask = `**** **** **** ${last4}`;

  const cardId = uuidv4();
  const { data: card, insertError } = await dbAdmin.from('virtual_cards').insert({
    id: cardId,
    user_id: req.user.id,
    card_number_mask: cardNumberMask,
    brand: value.brand,
    status: 'active',
    label: value.label,
    expiry: `${expiryMonth}/${expiryYear}`,
    created_at: new Date().toISOString(),
  }).select().single();

  if (insertError) {
    logger.error('Erreur création carte', { userId: req.user.id, error: insertError });
    throw new ValidationError('Erreur lors de la création de la carte');
  }

  logger.info('Carte virtuelle créée', { userId: req.user.id, brand: value.brand });
  res.json({ success: true, message: 'Carte créée avec succès', data: { card } });
}));

router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const { data: cards, error } = await dbAdmin.from('virtual_cards').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false });
  if (error) {
    logger.error('Erreur récupération cartes', { userId: req.user.id, error });
    throw new ValidationError('Erreur lors de la récupération des cartes');
  }
  res.json({ success: true, data: { cards: cards || [] } });
}));

router.patch('/:id/freeze', authenticateToken, asyncHandler(async (req, res) => {
  const cardId = req.params.id;

  const { data: card } = await dbAdmin.from('virtual_cards').select('*').eq('id', cardId).eq('user_id', req.user.id).single();
  if (!card) throw new NotFoundError('Carte non trouvée');

  const newStatus = card.status === 'frozen' ? 'active' : 'frozen';
  const { data: updated, error: updateError } = await dbAdmin.from('virtual_cards').update({ status: newStatus }).eq('id', cardId).eq('user_id', req.user.id).select().single();

  if (updateError) {
    logger.error('Erreur gel/dégel carte', { cardId, userId: req.user.id, error: updateError });
    throw new ValidationError('Erreur lors de la mise à jour de la carte');
  }

  logger.info('Statut carte changé', { cardId, userId: req.user.id, newStatus });
  res.json({ success: true, message: newStatus === 'frozen' ? 'Carte bloquée' : 'Carte débloquée', data: { card: updated } });
}));

router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const cardId = req.params.id;

  const { data: card } = await dbAdmin.from('virtual_cards').select('id').eq('id', cardId).eq('user_id', req.user.id).single();
  if (!card) throw new NotFoundError('Carte non trouvée');

  const { error: deleteError } = await dbAdmin.from('virtual_cards').delete().eq('id', cardId).eq('user_id', req.user.id);
  if (deleteError) {
    logger.error('Erreur suppression carte', { cardId, userId: req.user.id, error: deleteError });
    throw new ValidationError('Erreur lors de la suppression');
  }

  logger.info('Carte supprimée', { cardId, userId: req.user.id });
  res.json({ success: true, message: 'Carte supprimée avec succès' });
}));

export default router;

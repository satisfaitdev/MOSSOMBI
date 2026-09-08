import express from 'express';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';
import { dbAdmin } from '../config/db.js';
import { asyncHandler, ValidationError } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

const PROVIDERS = [
  { id: 'eneo', name: 'ENEO', logo_url: '/logos/eneo.png', category: 'electricity', fields: [{ label: 'Numéro client', type: 'text', required: true }] },
  { id: 'snde', name: 'SNDE', logo_url: '/logos/snde.png', category: 'water', fields: [{ label: 'Numéro abonné', type: 'text', required: true }] },
  { id: 'canalplus', name: 'Canal+', logo_url: '/logos/canalplus.png', category: 'tv', fields: [{ label: 'Numéro abonné', type: 'text', required: true }, { label: 'Code décodeur', type: 'text', required: false }] },
  { id: 'camtel', name: 'CAMTEL', logo_url: '/logos/camtel.png', category: 'internet', fields: [{ label: 'Numéro client', type: 'text', required: true }] },
  { id: 'orange', name: 'Orange', logo_url: '/logos/orange.png', category: 'internet', fields: [{ label: 'Numéro de ligne', type: 'text', required: true }] },
  { id: 'startimes', name: 'StarTimes', logo_url: '/logos/startimes.png', category: 'tv', fields: [{ label: 'Numéro abonné', type: 'text', required: true }] },
];

const checkSchema = Joi.object({
  provider: Joi.string().valid(...PROVIDERS.map(p => p.id)).required(),
  customer_ref: Joi.string().min(3).max(50).required(),
});

const paySchema = Joi.object({
  provider: Joi.string().valid(...PROVIDERS.map(p => p.id)).required(),
  customer_ref: Joi.string().min(3).max(50).required(),
  amount: Joi.number().min(100).max(5000000).required(),
});

router.get('/providers', authenticateToken, asyncHandler(async (req, res) => {
  res.json({ success: true, data: { providers: PROVIDERS } });
}));

router.post('/check', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = checkSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const provider = PROVIDERS.find(p => p.id === value.provider);
  const dueDate = new Date(Date.now() + Math.random() * 30 * 86400000).toISOString().split('T')[0];

  logger.info('Vérification facture', { provider: value.provider, customer_ref: value.customer_ref, userId: req.user.id });

  res.json({
    success: true,
    data: {
      provider: provider.name,
      customer_ref: value.customer_ref,
      amount: Math.floor(Math.random() * 50000 + 5000),
      due_date: dueDate,
      status: 'unpaid',
    },
  });
}));

router.post('/pay', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = paySchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const { data: wallet } = await dbAdmin.from('user_wallets').select('balance').eq('user_id', req.user.id).single();
  if (!wallet || wallet.balance < value.amount) {
    throw new ValidationError('Solde insuffisant pour payer cette facture');
  }

  const billId = uuidv4();

  await dbAdmin.from('user_wallets').update({ balance: wallet.balance - value.amount, last_transaction_at: new Date().toISOString() }).eq('user_id', req.user.id);

  const { data: payment, error: insertError } = await dbAdmin.from('bill_payments').insert({
    id: billId,
    user_id: req.user.id,
    provider: value.provider,
    amount: value.amount,
    reference: value.customer_ref,
    status: 'completed',
    created_at: new Date().toISOString(),
  }).select().single();

  if (insertError) {
    logger.error('Erreur insertion bill_payment', { error: insertError, userId: req.user.id });
    throw new ValidationError('Erreur lors du paiement de la facture');
  }

  const txId = `BILL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  await dbAdmin.from('transactions').insert({
    user_id: req.user.id,
    transaction_id: txId,
    type: 'payment',
    amount: value.amount,
    description: `Paiement facture ${value.provider} - ${value.customer_ref}`,
    status: 'completed',
    created_at: new Date().toISOString(),
  });

  logger.info('Facture payée', { userId: req.user.id, provider: value.provider, amount: value.amount });

  res.json({ success: true, message: 'Facture payée avec succès', data: { payment } });
}));

router.get('/history', authenticateToken, asyncHandler(async (req, res) => {
  const { data: payments, error } = await dbAdmin.from('bill_payments').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false }).limit(50);
  if (error) {
    logger.error('Erreur récupération historique factures', { userId: req.user.id, error });
    throw new ValidationError('Erreur lors de la récupération de l\'historique');
  }
  res.json({ success: true, data: { payments: payments || [] } });
}));

export default router;

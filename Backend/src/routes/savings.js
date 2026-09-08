import express from 'express';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';
import { dbAdmin } from '../config/db.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

const depositSchema = Joi.object({
  amount: Joi.number().min(100).max(10000000).required(),
});

const withdrawSchema = Joi.object({
  amount: Joi.number().min(100).max(10000000).required(),
});

const goalSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  target_amount: Joi.number().min(1000).max(100000000).required(),
  deadline: Joi.date().iso().optional(),
});

async function getOrCreateSavingsAccount(userId) {
  const { data: account } = await dbAdmin.from('savings_accounts').select('*').eq('user_id', userId).single();
  if (account) return account;
  const newId = uuidv4();
  const { data: created, error } = await dbAdmin.from('savings_accounts').insert({
    id: newId, user_id: userId, balance: 0, created_at: new Date().toISOString(),
  }).select().single();
  if (error) throw new ValidationError('Erreur création compte épargne');
  return created;
}

router.get('/balance', authenticateToken, asyncHandler(async (req, res) => {
  const account = await getOrCreateSavingsAccount(req.user.id);
  res.json({ success: true, data: { balance: account.balance, currency: 'XAF' } });
}));

router.post('/deposit', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = depositSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const { data: wallet } = await dbAdmin.from('user_wallets').select('balance').eq('user_id', req.user.id).single();
  if (!wallet || wallet.balance < value.amount) throw new ValidationError('Solde insuffisant');

  const account = await getOrCreateSavingsAccount(req.user.id);

  await dbAdmin.from('user_wallets').update({ balance: wallet.balance - value.amount, last_transaction_at: new Date().toISOString() }).eq('user_id', req.user.id);
  await dbAdmin.from('savings_accounts').update({ balance: account.balance + value.amount }).eq('id', account.id);

  const savingsTxId = uuidv4();
  await dbAdmin.from('savings_transactions').insert({
    id: savingsTxId, savings_id: account.id, type: 'deposit', amount: value.amount, created_at: new Date().toISOString(),
  });

  const txId = `SAV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  await dbAdmin.from('transactions').insert({
    user_id: req.user.id, transaction_id: txId, type: 'savings_deposit', amount: value.amount,
    description: `Dépôt épargne de ${value.amount} FCFA`, status: 'completed', created_at: new Date().toISOString(),
  });

  logger.info('Dépôt épargne', { userId: req.user.id, amount: value.amount });
  res.json({ success: true, message: 'Dépôt épargne effectué', data: { balance: account.balance + value.amount } });
}));

router.post('/withdraw', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = withdrawSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const account = await getOrCreateSavingsAccount(req.user.id);
  if (account.balance < value.amount) throw new ValidationError('Solde épargne insuffisant');

  const { data: wallet } = await dbAdmin.from('user_wallets').select('balance').eq('user_id', req.user.id).single();

  await dbAdmin.from('savings_accounts').update({ balance: account.balance - value.amount }).eq('id', account.id);
  await dbAdmin.from('user_wallets').update({ balance: (wallet?.balance || 0) + value.amount, last_transaction_at: new Date().toISOString() }).eq('user_id', req.user.id);

  const savingsTxId = uuidv4();
  await dbAdmin.from('savings_transactions').insert({
    id: savingsTxId, savings_id: account.id, type: 'withdraw', amount: value.amount, created_at: new Date().toISOString(),
  });

  const txId = `SAVWD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  await dbAdmin.from('transactions').insert({
    user_id: req.user.id, transaction_id: txId, type: 'savings_withdraw', amount: value.amount,
    description: `Retrait épargne de ${value.amount} FCFA`, status: 'completed', created_at: new Date().toISOString(),
  });

  logger.info('Retrait épargne', { userId: req.user.id, amount: value.amount });
  res.json({ success: true, message: 'Retrait épargne effectué', data: { balance: account.balance - value.amount } });
}));

router.get('/history', authenticateToken, asyncHandler(async (req, res) => {
  const account = await getOrCreateSavingsAccount(req.user.id);
  const { data: transactions, error } = await dbAdmin.from('savings_transactions').select('*').eq('savings_id', account.id).order('created_at', { ascending: false }).limit(50);
  if (error) {
    logger.error('Erreur historique épargne', { userId: req.user.id, error });
    throw new ValidationError('Erreur récupération historique');
  }
  res.json({ success: true, data: { transactions: transactions || [] } });
}));

router.post('/goal', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = goalSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const goalId = uuidv4();
  const { data: goal, insertError } = await dbAdmin.from('savings_goals').insert({
    id: goalId, user_id: req.user.id, name: value.name, target_amount: value.target_amount,
    current_amount: 0, deadline: value.deadline || null, created_at: new Date().toISOString(),
  }).select().single();

  if (insertError) {
    logger.error('Erreur création objectif', { userId: req.user.id, error: insertError });
    throw new ValidationError('Erreur création objectif');
  }

  logger.info('Objectif épargne créé', { userId: req.user.id, name: value.name });
  res.json({ success: true, message: 'Objectif créé', data: { goal } });
}));

router.get('/goals', authenticateToken, asyncHandler(async (req, res) => {
  const { data: goals, error } = await dbAdmin.from('savings_goals').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false });
  if (error) throw new ValidationError('Erreur récupération objectifs');
  res.json({ success: true, data: { goals: goals || [] } });
}));

export default router;

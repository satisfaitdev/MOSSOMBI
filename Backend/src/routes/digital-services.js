import express from 'express';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';
import { dbAdmin } from '../config/db.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

const CATEGORIES = ['telephone', 'internet', 'tv', 'streaming', 'gaming', 'utilities'];

const PROVIDERS = [
  { id: 'mtn', name: 'MTN', category: 'telephone', logo_url: '/logos/mtn.png', requires_phone: true, requires_id: false },
  { id: 'airtel', name: 'Airtel', category: 'telephone', logo_url: '/logos/airtel.png', requires_phone: true, requires_id: false },
  { id: 'orange', name: 'Orange', category: 'telephone', logo_url: '/logos/orange.png', requires_phone: true, requires_id: false },
  { id: 'camtel', name: 'CAMTEL', category: 'internet', logo_url: '/logos/camtel.png', requires_phone: true, requires_id: false },
  { id: 'canalplus', name: 'Canal+', category: 'tv', logo_url: '/logos/canalplus.png', requires_phone: false, requires_id: true },
  { id: 'startimes', name: 'StarTimes', category: 'tv', logo_url: '/logos/startimes.png', requires_phone: false, requires_id: true },
  { id: 'netflix', name: 'Netflix', category: 'streaming', logo_url: '/logos/netflix.png', requires_phone: false, requires_id: true },
  { id: 'spotify', name: 'Spotify', category: 'streaming', logo_url: '/logos/spotify.png', requires_phone: false, requires_id: true },
  { id: 'pubg', name: 'PUBG Mobile', category: 'gaming', logo_url: '/logos/pubg.png', requires_phone: false, requires_id: true },
  { id: 'fifa', name: 'FIFA Points', category: 'gaming', logo_url: '/logos/fifa.png', requires_phone: false, requires_id: true },
  { id: 'eneo', name: 'ENEO', category: 'utilities', logo_url: '/logos/eneo.png', requires_phone: false, requires_id: true },
  { id: 'snde', name: 'SNDE', category: 'utilities', logo_url: '/logos/snde.png', requires_phone: false, requires_id: true },
];

const PRODUCTS = {
  mtn: [
    { id: 'mtn-100', name: 'Recharge 100 F', price: 100, value: 100, type: 'topup' },
    { id: 'mtn-200', name: 'Recharge 200 F', price: 200, value: 200, type: 'topup' },
    { id: 'mtn-500', name: 'Recharge 500 F', price: 500, value: 500, type: 'topup' },
    { id: 'mtn-1000', name: 'Recharge 1000 F', price: 1000, value: 1000, type: 'topup' },
    { id: 'mtn-2000', name: 'Recharge 2000 F', price: 2000, value: 2000, type: 'topup' },
    { id: 'mtn-5000', name: 'Recharge 5000 F', price: 5000, value: 5000, type: 'topup' },
    { id: 'mtn-data-1gb', name: '1Go Internet', price: 1500, value: 1024, type: 'data', duration_days: 7 },
    { id: 'mtn-data-3gb', name: '3Go Internet', price: 3500, value: 3072, type: 'data', duration_days: 30 },
    { id: 'mtn-data-10gb', name: '10Go Internet', price: 10000, value: 10240, type: 'data', duration_days: 30 },
  ],
  airtel: [
    { id: 'airtel-100', name: 'Recharge 100 F', price: 100, value: 100, type: 'topup' },
    { id: 'airtel-500', name: 'Recharge 500 F', price: 500, value: 500, type: 'topup' },
    { id: 'airtel-1000', name: 'Recharge 1000 F', price: 1000, value: 1000, type: 'topup' },
    { id: 'airtel-2000', name: 'Recharge 2000 F', price: 2000, value: 2000, type: 'topup' },
    { id: 'airtel-5000', name: 'Recharge 5000 F', price: 5000, value: 5000, type: 'topup' },
    { id: 'airtel-data-2gb', name: '2Go Internet', price: 2500, value: 2048, type: 'data', duration_days: 7 },
  ],
  orange: [
    { id: 'orange-200', name: 'Recharge 200 F', price: 200, value: 200, type: 'topup' },
    { id: 'orange-1000', name: 'Recharge 1000 F', price: 1000, value: 1000, type: 'topup' },
    { id: 'orange-5000', name: 'Recharge 5000 F', price: 5000, value: 5000, type: 'topup' },
  ],
  camtel: [
    { id: 'camtel-1mois', name: 'Pass Mensuel 5Go', price: 5000, value: 5120, type: 'data', duration_days: 30 },
    { id: 'camtel-3mois', name: 'Pass Trimestriel 20Go', price: 12000, value: 20480, type: 'data', duration_days: 90 },
  ],
  canalplus: [
    { id: 'canal-basique', name: 'Basique (1 mois)', price: 12000, value: 12000, type: 'subscription', duration_days: 30 },
    { id: 'canal-essentiel', name: 'Essentiel (1 mois)', price: 19000, value: 19000, type: 'subscription', duration_days: 30 },
    { id: 'canal-premium', name: 'Premium (1 mois)', price: 35000, value: 35000, type: 'subscription', duration_days: 30 },
  ],
  startimes: [
    { id: 'startimes-nova', name: 'Nova (1 mois)', price: 6000, value: 6000, type: 'subscription', duration_days: 30 },
    { id: 'startimes-classic', name: 'Classic (1 mois)', price: 10000, value: 10000, type: 'subscription', duration_days: 30 },
    { id: 'startimes-prestige', name: 'Prestige (1 mois)', price: 18000, value: 18000, type: 'subscription', duration_days: 30 },
  ],
  netflix: [
    { id: 'netflix-mobile', name: 'Mobile (1 mois)', price: 5000, value: 5000, type: 'subscription', duration_days: 30 },
    { id: 'netflix-basic', name: 'Basique (1 mois)', price: 9000, value: 9000, type: 'subscription', duration_days: 30 },
    { id: 'netflix-standard', name: 'Standard (1 mois)', price: 14000, value: 14000, type: 'subscription', duration_days: 30 },
  ],
  spotify: [
    { id: 'spotify-individual', name: 'Individual (1 mois)', price: 4500, value: 4500, type: 'subscription', duration_days: 30 },
    { id: 'spotify-duo', name: 'Duo (1 mois)', price: 7500, value: 7500, type: 'subscription', duration_days: 30 },
    { id: 'spotify-family', name: 'Familial (1 mois)', price: 10000, value: 10000, type: 'subscription', duration_days: 30 },
  ],
  pubg: [
    { id: 'pubg-600', name: '600 UC', price: 5000, value: 600, type: 'topup' },
    { id: 'pubg-1500', name: '1500 UC', price: 12000, value: 1500, type: 'topup' },
    { id: 'pubg-3000', name: '3000+300 UC', price: 24000, value: 3300, type: 'topup' },
  ],
  fifa: [
    { id: 'fifa-500', name: '500 Points FIFA', price: 5000, value: 500, type: 'topup' },
    { id: 'fifa-1200', name: '1200 Points FIFA', price: 10000, value: 1200, type: 'topup' },
  ],
  eneo: [
    { id: 'eneo-standard', name: 'Paiement facture ENEO', price: 0, value: 0, type: 'subscription' },
  ],
  snde: [
    { id: 'snde-standard', name: 'Paiement facture SNDE', price: 0, value: 0, type: 'subscription' },
  ],
};

router.get('/providers', authenticateToken, asyncHandler(async (req, res) => {
  const { category } = req.query;
  let result = PROVIDERS;
  if (category && CATEGORIES.includes(category)) {
    result = result.filter(p => p.category === category);
  }
  const enriched = result.map(p => {
    const products = PRODUCTS[p.id] || [];
    const prices = products.filter(pr => pr.price > 0).map(pr => pr.price);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    return { ...p, min_price: minPrice, max_price: maxPrice, product_count: products.length };
  });
  res.json({ success: true, data: { providers: enriched } });
}));

router.get('/providers/:id/products', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const provider = PROVIDERS.find(p => p.id === id);
  if (!provider) throw new NotFoundError('Fournisseur non trouvé');
  const products = PRODUCTS[id] || [];
  res.json({ success: true, data: { provider, products } });
}));

const purchaseSchema = Joi.object({
  provider_id: Joi.string().valid(...PROVIDERS.map(p => p.id)).required(),
  product_id: Joi.string().required(),
  recipient: Joi.string().min(3).max(100).required(),
  amount: Joi.number().min(50).max(5000000).required(),
});

router.post('/purchase', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = purchaseSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const provider = PROVIDERS.find(p => p.id === value.provider_id);
  if (!provider) throw new NotFoundError('Fournisseur non trouvé');

  const { data: wallet } = await dbAdmin.from('user_wallets').select('balance').eq('user_id', req.user.id).single();
  if (!wallet || Number(wallet.balance) < value.amount) {
    throw new ValidationError('Solde insuffisant pour effectuer cet achat');
  }

  const purchaseId = uuidv4();
  const now = new Date().toISOString();

  await dbAdmin.from('user_wallets')
    .update({ balance: Number(wallet.balance) - value.amount, last_transaction_at: now })
    .eq('user_id', req.user.id);

  const { data: purchase, error: insertError } = await dbAdmin.from('digital_service_purchases').insert({
    id: purchaseId,
    user_id: req.user.id,
    provider_id: value.provider_id,
    product_id: value.product_id,
    recipient: value.recipient,
    amount: value.amount,
    status: 'completed',
    created_at: now,
  }).select().single();

  if (insertError) {
    logger.error('Erreur insertion achat digital', { error: insertError, userId: req.user.id });
    await dbAdmin.from('user_wallets')
      .update({ balance: Number(wallet.balance), last_transaction_at: now })
      .eq('user_id', req.user.id);
    throw new ValidationError('Erreur lors de l\'achat');
  }

  const txId = `DS-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  await dbAdmin.from('transactions').insert({
    user_id: req.user.id,
    transaction_id: txId,
    type: 'payment',
    amount: value.amount,
    description: `Achat ${provider.name} - ${value.recipient}`,
    status: 'completed',
    created_at: now,
  });

  const confirmationCode = `${provider.id.toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

  logger.info('Achat digital réussi', { userId: req.user.id, provider: value.provider_id, amount: value.amount });

  res.status(201).json({
    success: true,
    data: {
      purchase,
      confirmation_code: confirmationCode,
      message: `Achat ${provider.name} effectué avec succès pour ${value.recipient}`,
    },
  });
}));

router.get('/history', authenticateToken, asyncHandler(async (req, res) => {
  const { data: purchases, error } = await dbAdmin
    .from('digital_service_purchases')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    logger.error('Erreur récupération historique achats digitaux', { userId: req.user.id, error });
    throw new ValidationError('Erreur lors de la récupération de l\'historique');
  }

  const enriched = (purchases || []).map(p => {
    const provider = PROVIDERS.find(pr => pr.id === p.provider_id);
    return { ...p, provider_name: provider?.name || p.provider_id };
  });

  res.json({ success: true, data: { purchases: enriched } });
}));

const validateSchema = Joi.object({
  provider_id: Joi.string().valid(...PROVIDERS.map(p => p.id)).required(),
  recipient: Joi.string().min(3).max(100).required(),
});

router.post('/validate', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = validateSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const provider = PROVIDERS.find(p => p.id === value.provider_id);
  if (!provider) throw new NotFoundError('Fournisseur non trouvé');

  const isValid = value.recipient.length >= 5;
  const customerName = isValid ? `Abonné ${provider.name}` : null;

  res.json({
    success: true,
    data: {
      valid: isValid,
      customer_name: customerName,
      provider: provider.name,
      message: isValid ? 'Identifiant valide' : 'Identifiant invalide',
    },
  });
}));

export default router;

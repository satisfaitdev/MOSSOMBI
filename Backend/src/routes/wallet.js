/**
 * ROUTES WALLET ET TRANSACTIONS
 * Gestion du portefeuille et historique des transactions
 */

import express from 'express';
import Joi from 'joi';
import axios from 'axios';
import { dbAdmin } from '../config/db.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// =====================================================
// 📋 SCHÉMAS DE VALIDATION
// =====================================================

const transactionFiltersSchema = Joi.object({
  type: Joi.string().valid('recharge', 'payment', 'transfer', 'withdrawal', 'refund', 'bonus').optional(),
  status: Joi.string().valid('pending', 'completed', 'failed', 'cancelled').optional(),
  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().optional(),
  min_amount: Joi.number().min(0).optional(),
  max_amount: Joi.number().min(0).optional(),
  limit: Joi.number().integer().min(1).max(100).default(20).optional(),
  offset: Joi.number().integer().min(0).default(0).optional(),
  sort: Joi.string().valid('created_at', 'amount').default('created_at').optional(),
  order: Joi.string().valid('asc', 'desc').default('desc').optional()
});

const createTransactionSchema = Joi.object({
  type: Joi.string().valid('recharge', 'payment', 'transfer', 'withdrawal', 'refund', 'bonus').required(),
  amount: Joi.number().min(100).max(1000000).required(), // 100 CDF à 1M CDF
  description: Joi.string().max(200).optional(),
  recipient_id: Joi.string().uuid().optional(), // Pour les transferts
  payment_method: Joi.string().valid('mobile_money', 'bank_card', 'bank_transfer', 'system').optional(),
  metadata: Joi.object().optional()
});

// =====================================================
// 💰 ROUTES WALLET
// =====================================================

/**
 * GET /api/v1/wallet
 * Récupérer les informations du portefeuille
 */
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  // Récupérer les informations utilisateur
  const { data: user, error: userError } = await dbAdmin
    .from('users')
    .select('points, metadata')
    .eq('id', req.user.id)
    .single();

  if (userError) {
    logger.error('Erreur récupération wallet', { 
      userId: req.user.id, 
      error: userError 
    });
    throw new ValidationError('Erreur lors de la récupération du portefeuille');
  }

  // Récupérer le solde du wallet (si table séparée existe)
  const { data: wallet } = await dbAdmin
    .from('user_wallets')
    .select('balance, currency, status, last_transaction_at')
    .eq('user_id', req.user.id)
    .single();

  // Récupérer les statistiques des transactions
  const { data: transactionStats } = await dbAdmin
    .from('transactions')
    .select('type, amount, status')
    .eq('user_id', req.user.id);

  // Calculer les statistiques
  const stats = (transactionStats || []).reduce((acc, transaction) => {
    const type = transaction.type;
    const status = transaction.status;
    
    if (!acc[type]) {
      acc[type] = { total: 0, completed: 0, pending: 0, failed: 0, total_amount: 0 };
    }
    
    acc[type].total++;
    acc[type][status] = (acc[type][status] || 0) + 1;
    
    if (status === 'completed') {
      acc[type].total_amount += transaction.amount;
    }
    
    return acc;
  }, {});

  // Récupérer les dernières transactions
  const { data: recentTransactions } = await dbAdmin
    .from('transactions')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  res.json({
    success: true,
    message: 'Informations du portefeuille récupérées',
    data: {
      wallet: {
        balance: wallet?.balance || 0,
        currency: wallet?.currency || 'CDF',
        status: wallet?.status || 'active',
        last_transaction_at: wallet?.last_transaction_at
      },
      points: user.points || 0,
      statistics: stats,
      recent_transactions: recentTransactions || []
    }
  });
}));

/**
 * GET /api/v1/wallet/balance
 * Récupérer uniquement le solde
 */
router.get('/balance', authenticateToken, asyncHandler(async (req, res) => {
  const { data: wallet } = await dbAdmin
    .from('user_wallets')
    .select('balance, currency')
    .eq('user_id', req.user.id)
    .single();

  res.json({
    success: true,
    data: {
      balance: wallet?.balance || 0,
      currency: wallet?.currency || 'CDF'
    }
  });
}));

// =====================================================
// 📊 ROUTES TRANSACTIONS
// =====================================================

/**
 * GET /api/v1/wallet/transactions
 * Récupérer l'historique des transactions avec filtres
 */
router.get('/transactions', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = transactionFiltersSchema.validate(req.query);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { type, status, start_date, end_date, min_amount, max_amount, limit, offset, sort, order } = value;

  // Construction de la requête
  let query = dbAdmin
    .from('transactions')
    .select('*', { count: 'exact' })
    .eq('user_id', req.user.id);

  // Appliquer les filtres
  if (type) query = query.eq('type', type);
  if (status) query = query.eq('status', status);
  if (start_date) query = query.gte('created_at', start_date);
  if (end_date) query = query.lte('created_at', end_date);
  if (min_amount) query = query.gte('amount', min_amount);
  if (max_amount) query = query.lte('amount', max_amount);

  // Tri et pagination
  query = query
    .order(sort, { ascending: order === 'asc' })
    .range(offset, offset + limit - 1);

  const { data: transactions, error: fetchError, count } = await query;

  if (fetchError) {
    logger.error('Erreur récupération transactions', { 
      userId: req.user.id, 
      error: fetchError 
    });
    throw new ValidationError('Erreur lors de la récupération des transactions');
  }

  // Calculer les totaux pour la période
  let totalQuery = dbAdmin
    .from('transactions')
    .select('amount, type')
    .eq('user_id', req.user.id)
    .eq('status', 'completed');

  if (start_date) totalQuery = totalQuery.gte('created_at', start_date);
  if (end_date) totalQuery = totalQuery.lte('created_at', end_date);

  const { data: totalsData } = await totalQuery;

  const totals = (totalsData || []).reduce((acc, t) => {
    if (t.type === 'recharge' || t.type === 'refund' || t.type === 'bonus') {
      acc.income += t.amount;
    } else {
      acc.expense += t.amount;
    }
    acc.total += t.amount;
    return acc;
  }, { income: 0, expense: 0, total: 0 });

  res.json({
    success: true,
    message: 'Historique des transactions récupéré',
    data: {
      transactions: transactions || [],
      pagination: {
        total: count,
        limit,
        offset,
        has_more: count > offset + limit
      },
      summary: {
        period_income: totals.income,
        period_expense: totals.expense,
        net_amount: totals.income - totals.expense
      }
    }
  });
}));

/**
 * GET /api/v1/wallet/transactions/:id
 * Récupérer une transaction spécifique
 */
router.get('/transactions/:id', authenticateToken, asyncHandler(async (req, res) => {
  const transactionId = req.params.id;

  // Valider l'UUID
  if (!transactionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
    throw new ValidationError('ID de transaction invalide');
  }

  const { data: transaction, error } = await dbAdmin
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .eq('user_id', req.user.id)
    .single();

  if (error || !transaction) {
    throw new NotFoundError('Transaction non trouvée');
  }

  res.json({
    success: true,
    data: {
      transaction
    }
  });
}));

/**
 * GET /api/v1/wallet/search-user
 * Rechercher un utilisateur par code ou par nom (utile pour le transfert P2P)
 */
router.get('/search-user', authenticateToken, asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.json({ success: true, data: { users: [] } });
  }

  // Chercher par userIdDisplay (code) ou full_name
  const { data: users, error } = await dbAdmin
    .from('users')
    .select('id, full_name, user_id_display, avatar_url')
    .or(`user_id_display.ilike.%${q}%,full_name.ilike.%${q}%`)
    .limit(10);

  if (error) {
    logger.error('Erreur lors de la recherche user', { query: q, error });
    throw new ValidationError('Erreur de requête lors de la recherche');
  }

  // Exclure soi-même
  const filtered = (users || []).filter(u => u.id !== req.user.id);

  res.json({
    success: true,
    data: { users: filtered }
  });
}));


/**
 * POST /api/v1/wallet/transactions
 * Créer une nouvelle transaction
 */
router.post('/transactions', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = createTransactionSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  const { type, amount, description, recipient_id, payment_method, metadata } = value;

  // Générer un ID de transaction unique
  const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Créer la transaction
  const { data: newTransaction, error: insertError } = await dbAdmin
    .from('transactions')
    .insert({
      user_id: req.user.id,
      transaction_id: transactionId,
      type,
      amount,
      description: description || `${type.charAt(0).toUpperCase() + type.slice(1)} de ${amount} CDF`,
      recipient_id,
      payment_method,
      status: 'pending',
      metadata: {
        ...metadata,
        created_by: 'user',
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      },
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (insertError) {
    logger.error('Erreur création transaction', { 
      userId: req.user.id, 
      error: insertError 
    });
    throw new ValidationError('Erreur lors de la création de la transaction');
  }

  logger.info('Transaction créée', { 
    userId: req.user.id,
    transactionId: newTransaction.id,
    type,
    amount
  });

  // --- INTÉGRATION PAYMENT OS ---
  if (type === 'recharge' || type === 'withdrawal') {
    try {
      const paymentOsEndpoint = type === 'recharge' 
        ? `${process.env.PAYMENT_OS_URL}/payments/deposits`
        : `${process.env.PAYMENT_OS_URL}/payments/withdrawals`;

      const fee = metadata?.fee || 0;
      const totalAmount = amount + fee;

      // Le DTO PaymentOS attend : amount, currency, provider, idempotencyKey et metadata
      const payload = {
        amount: totalAmount,
        currency: metadata?.currency || 'XAF', // Peut être défini via le client mobile, sinon XAF
        provider: 'SWYCHR', // L'agrégateur système attend 'SWYCHR' en majuscules pour initier le lien de paiement
        idempotencyKey: transactionId,
        metadata: {
           internal_transaction_id: newTransaction.id,
           user_id: req.user.id,
           base_amount: amount,
           fee: fee
        }
      };
      
      // SWYCHR require certains champs
      if (metadata?.phone) payload.customerMobile = metadata.phone;
      payload.customerName = metadata?.customerName || req.user.full_name || 'Mossombi User';
      payload.customerEmail = metadata?.customerEmail || req.user.email || 'contact@mossombi.com';
      payload.countryCode = metadata?.countryCode || 'CG'; // Par défaut Congo pour swychr
      if (type === 'recharge') payload.passDigitalCharge = false;
      
      if (process.env.PAYMENT_OS_URL) {
        const osRes = await axios.post(paymentOsEndpoint, payload, {
          headers: {
            'x-project-id': process.env.PAYMENT_OS_PROJECT_ID,
            'x-api-key': process.env.PAYMENT_OS_API_KEY,
            'Content-Type': 'application/json'
          }
        });
        const checkoutUrl = osRes.data?.paymentIntent?.checkoutUrl;
        logger.info('PaymentOS initié avec succès', { transactionId, checkoutUrl });
        
        // On récupère l'URL de paiement s'il y en a une pour l'afficher sur le téléphone !
        if (checkoutUrl) {
           newTransaction.checkoutUrl = checkoutUrl;
        }
      } else {
        logger.warn('PAYMENT_OS_URL non configuré, la transaction restera en attente locale', { transactionId });
      }
    } catch (paymentOsError) {
      logger.error('Erreur lors de la notification de PaymentOS', { 
        transactionId, 
        error: paymentOsError.response?.data || paymentOsError.message 
      });
      // On logue l'erreur mais on ne bloque pas la réponse backend au client mobile (elle reste pending)
    }
  }
  // --- FIN INTÉGRATION PAYMENT OS ---

  // --- INTEGRATION TRANSFERT P2P INTERNE ---
  if (type === 'transfer') {
    if (!recipient_id) throw new ValidationError('L\'ID du destinataire est requis pour un transfert P2P');
    if (recipient_id === req.user.id) throw new ValidationError('Impossible de se transférer de l\'argent à soi-même');

    // Vérifier Solde Expéditeur
    const { data: senderWallet } = await dbAdmin.from('user_wallets').select('balance').eq('user_id', req.user.id).single();
    if (!senderWallet || senderWallet.balance < amount) {
       await dbAdmin.from('transactions').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', newTransaction.id);
       throw new ValidationError('Solde du portefeuille insuffisant pour effectuer ce transfert');
    }

    // Déduire Expéditeur
    await dbAdmin.from('user_wallets')
      .update({ balance: senderWallet.balance - amount, last_transaction_at: new Date().toISOString() })
      .eq('user_id', req.user.id);

    // Valider Transaction Expéditeur
    newTransaction.status = 'completed';
    await dbAdmin.from('transactions').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', newTransaction.id);

    // Récupérer Infos Expéditeur
    const { data: senderUser } = await dbAdmin.from('users').select('full_name').eq('id', req.user.id).single();
    const senderName = senderUser?.full_name || 'un utilisateur';

    // Créer Transaction Virtuelle Réception (Destinataire)
    const receiverTxId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    await dbAdmin.from('transactions').insert({
      user_id: recipient_id,
      transaction_id: receiverTxId,
      type: 'transfer', // Reçu
      amount: amount,
      description: `Transfert reçu de ${senderName}`,
      status: 'completed',
      metadata: { sender_id: req.user.id },
      created_at: new Date().toISOString()
    });

    // Créditer Destinataire
    const { data: receiverWallet } = await dbAdmin.from('user_wallets').select('balance').eq('user_id', recipient_id).single();
    if (receiverWallet) {
       await dbAdmin.from('user_wallets')
         .update({ balance: (receiverWallet.balance || 0) + amount, last_transaction_at: new Date().toISOString() })
         .eq('user_id', recipient_id);
    }
    logger.info('Transfert P2P réussi', { sender_id: req.user.id, recipient_id, amount });
  }
  // --- FIN TRANSFERT INTERNE ---

  // --- INTEGRATION PAIEMENTS SERVICES (Factures, Crédits, Cartes Virtuelles, Marketplace) ---
  if (type === 'bill_payment' || type === 'mobile_topup' || type === 'virtual_card_funding' || type === 'savings_deposit' || type === 'marketplace_payment') {
    // Vérifier Solde Expéditeur
    const { data: senderWallet } = await dbAdmin.from('user_wallets').select('balance').eq('user_id', req.user.id).single();
    if (!senderWallet || senderWallet.balance < amount) {
       await dbAdmin.from('transactions').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', newTransaction.id);
       throw new ValidationError('Solde du portefeuille insuffisant pour cette opération');
    }

    // Déduire Expéditeur (Dépense)
    await dbAdmin.from('user_wallets')
      .update({ balance: senderWallet.balance - amount, last_transaction_at: new Date().toISOString() })
      .eq('user_id', req.user.id);

    // Valider Transaction (instantané)
    newTransaction.status = 'completed';
    await dbAdmin.from('transactions').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', newTransaction.id);
    logger.info('Paiement service réussi', { user_id: req.user.id, type, amount });
  }
  // --- FIN PAIEMENTS SERVICES ---

  // --- INTEGRATION RETRAIT EPARGNE (Savings Withdraw) ---
  if (type === 'savings_withdraw') {
    // Ajouter l'argent de l'épargne de retour au solde principal
    const { data: senderWallet } = await dbAdmin.from('user_wallets').select('balance').eq('user_id', req.user.id).single();
    if (senderWallet) {
      await dbAdmin.from('user_wallets')
        .update({ balance: senderWallet.balance + amount, last_transaction_at: new Date().toISOString() })
        .eq('user_id', req.user.id);
      
      newTransaction.status = 'completed';
      await dbAdmin.from('transactions').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', newTransaction.id);
      logger.info('Retrait depuis épargne réussi', { user_id: req.user.id, amount });
    }
  }
  // --- FIN RETRAIT EPARGNE ---

  res.json({
    success: true,
    message: 'Transaction créée avec succès',
    data: {
      transaction: newTransaction
    }
  });
}));

/**
 * GET /api/v1/wallet/stats
 * Récupérer les statistiques détaillées du wallet
 */
router.get('/stats', authenticateToken, asyncHandler(async (req, res) => {
  // Période par défaut : 30 derniers jours
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: transactions } = await dbAdmin
    .from('transactions')
    .select('type, amount, status, created_at')
    .eq('user_id', req.user.id)
    .gte('created_at', thirtyDaysAgo.toISOString());

  // Calculer les statistiques
  const stats = {
    total_transactions: transactions?.length || 0,
    completed_transactions: 0,
    pending_transactions: 0,
    failed_transactions: 0,
    total_income: 0,
    total_expense: 0,
    by_type: {},
    by_day: {}
  };

  (transactions || []).forEach(transaction => {
    // Compter par statut
    stats[`${transaction.status}_transactions`]++;

    // Calculer revenus/dépenses
    if (transaction.status === 'completed') {
      if (['recharge', 'refund', 'bonus', 'transfer_received', 'savings_withdraw'].includes(transaction.type)) {
        stats.total_income += transaction.amount;
      } else {
        stats.total_expense += transaction.amount;
      }
    }

    // Grouper par type
    if (!stats.by_type[transaction.type]) {
      stats.by_type[transaction.type] = { count: 0, amount: 0 };
    }
    stats.by_type[transaction.type].count++;
    if (transaction.status === 'completed') {
      stats.by_type[transaction.type].amount += transaction.amount;
    }

    // Grouper par jour
    const day = transaction.created_at.split('T')[0];
    if (!stats.by_day[day]) {
      stats.by_day[day] = { count: 0, amount: 0 };
    }
    stats.by_day[day].count++;
    if (transaction.status === 'completed') {
      stats.by_day[day].amount += transaction.amount;
    }
  });

  stats.net_amount = stats.total_income - stats.total_expense;

  res.json({
    success: true,
    message: 'Statistiques du wallet récupérées',
    data: {
      period: '30 derniers jours',
      statistics: stats
    }
  });
}));

/**
 * POST /api/v1/wallet/payment-webhook
 * Webhook appelé par PaymentOS pour notifier d'un changement de statut de transaction
 */
router.post('/payment-webhook', asyncHandler(async (req, res) => {
  const { idempotencyKey, status, amount, type } = req.body;
  
  if (!idempotencyKey || !status) {
     return res.status(400).json({ success: false, message: 'Invalid payload, missing idempotencyKey or status' });
  }

  // 1. Chercher la transaction locale par transaction_id (qui est notre idempotencyKey)
  const { data: transaction } = await dbAdmin
    .from('transactions')
    .select('*')
    .eq('transaction_id', idempotencyKey)
    .single();

  if (!transaction) {
     return res.status(404).json({ success: false, message: 'Transaction not found locally' });
  }

  // Nettoyage du statut en minuscules (ex: SUCCESS -> completed, FAILED -> failed)
  const incomingStatus = status.toLowerCase();
  const finalStatus = (incomingStatus === 'success' || incomingStatus === 'completed') ? 'completed' 
                    : (incomingStatus === 'failed' || incomingStatus === 'cancelled') ? 'failed' 
                    : 'pending';

  // 2. Ne pas re-traiter une transaction achevée
  if (transaction.status === finalStatus) {
     return res.json({ success: true, message: 'Transaction already processed or unmodified' });
  }

  // 3. Mettre à jour le statut
  await dbAdmin
    .from('transactions')
    .update({ status: finalStatus, updated_at: new Date().toISOString() })
    .eq('id', transaction.id);

  // 4. Mettre à jour le solde sur 'user_wallets' et éventuellement 'users(points)' en cas de SUCCES
  if (finalStatus === 'completed') {
    const { data: wallet } = await dbAdmin
      .from('user_wallets')
      .select('balance')
      .eq('user_id', transaction.user_id)
      .single();

    if (wallet) {
      let newBalance = Number(wallet.balance) || 0;
      const txAmount = Number(transaction.amount) || 0;

      // Un dépôt (topup/recharge) valide augmente le solde
      if (transaction.type === 'recharge' || transaction.type === 'bonus') {
         newBalance += txAmount;
      } 
      // Un retrait (withdrawal) validé a généralement déjà soustrait le solde sur d'autres systèmes, 
      // MAIS s'il n'avait pas été déduit, on le fait ici.
      // Dans notre app, on a présumé que le solde ne bouge QUE sur fetchWalletData.
      else if (transaction.type === 'withdrawal' || transaction.type === 'transfer' || transaction.type === 'payment') {
         newBalance -= txAmount;
      }

      await dbAdmin
        .from('user_wallets')
        .update({ balance: newBalance, last_transaction_at: new Date().toISOString() })
        .eq('user_id', transaction.user_id);
    }
  } else if (finalStatus === 'failed') {
    // Si c'est un échec, dans certains workflows, on rembourserait le solde déduit de manière optimiste
    // si un retrait a été invalidé.
  }

  logger.info(`Webhook PaymentOS traité - Nouveau Status: ${finalStatus}`, { 
    internalTxId: transaction.id, 
    idempotencyKey 
  });

  res.json({ success: true, message: 'Webhook successfully processed' });
}));

export default router;

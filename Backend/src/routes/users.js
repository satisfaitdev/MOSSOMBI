/**
 * ROUTES GESTION UTILISATEURS
 * Point d'entrée principal pour les routes utilisateurs
 */

import express from 'express';
import userProfileRouter from './users/userProfile.js';
import userSecurityRouter from './users/userSecurity.js';
import userActivityRouter from './users/userActivity.js';
import { authenticateToken } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import { dbAdmin } from '../config/db.js';

const router = express.Router();

// =====================================================
// 🔐 MIDDLEWARES
// =====================================================

// Appliquer l'authentification à toutes les routes
router.use(authenticateToken);

// =====================================================
// 📁 ROUTES MODULAIRES
// =====================================================

// Routes profil et préférences
router.use('/', userProfileRouter);

// Routes sécurité (mot de passe, 2FA)
router.use('/', userSecurityRouter);

// Routes activité et monitoring
router.use('/', userActivityRouter);

// =====================================================
// 📊 ROUTE RÉSUMÉ
// =====================================================

/**
 * GET /api/v1/users/summary
 * Obtenir un résumé complet de l'utilisateur
 */
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Récupérer les informations de base de l'utilisateur
    const { data: user, error: userError } = await dbAdmin
      .from('users')
      .select(`
        id,
        username,
        email,
        full_name,
        avatar_url,
        created_at,
        updated_at,
        metadata
      `)
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Récupérer les statistiques d'activité
    const { data: activities } = await dbAdmin
      .from('user_activity')
      .select('type, created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    // Récupérer les sessions actives
    const { data: sessions } = await dbAdmin
      .from('user_sessions')
      .select('id, created_at, is_active')
      .eq('user_id', userId)
      .eq('is_active', true);

    // Calculer les statistiques
    const stats = {
      total_activities: activities?.length || 0,
      recent_logins: activities?.filter(a => a.type === 'login').length || 0,
      active_sessions: sessions?.length || 0,
      profile_completeness: calculateProfileCompleteness(user),
      security_score: calculateSecurityScore(user.metadata),
      last_activity: activities?.[0]?.created_at || user.updated_at
    };

    const summary = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      preferences: user.metadata?.preferences || {},
      stats,
      security: {
        two_factor_enabled: user.metadata?.two_factor?.enabled || false,
        two_factor_method: user.metadata?.two_factor?.method || null,
        last_password_change: user.metadata?.password_changed_at || null
      }
    };

    res.json({
      success: true,
      message: 'Résumé utilisateur récupéré',
      data: summary
    });
  } catch (error) {
    logger.error('Erreur résumé utilisateur:', { userId: req.user.id, error });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du résumé'
    });
  }
});

// =====================================================
// 📊 FONCTIONS UTILITAIRES
// =====================================================

/**
 * Calculer le score de complétude du profil
 */
function calculateProfileCompleteness(user) {
  const fields = [
    'full_name',
    'email',
    'date_of_birth',
    'address',
    'gender',
    'country_code',
    'bio',
    'avatar_url'
  ];
  
  const completedFields = fields.filter(field => user[field] && user[field] !== '').length;
  return Math.round((completedFields / fields.length) * 100);
}

/**
 * Calculer le score de sécurité
 */
function calculateSecurityScore(metadata) {
  let score = 0;
  
  // Mot de passe récemment changé (+20)
  if (metadata?.password_changed_at) {
    const daysSinceChange = (Date.now() - new Date(metadata.password_changed_at)) / (1000 * 60 * 60 * 24);
    if (daysSinceChange < 90) score += 20;
  }
  
  // 2FA activée (+30)
  if (metadata?.two_factor?.enabled) score += 30;
  
  // Sessions limitées (+10)
  if (metadata?.session_limit_enabled) score += 10;
  
  // Notifications de sécurité activées (+20)
  if (metadata?.preferences?.notifications?.security_enabled) score += 10;
  
  // Pas d'activités suspectes récentes (+20)
  if (!metadata?.suspicious_activity_count || metadata.suspicious_activity_count === 0) score += 20;
  
  return Math.min(100, score);
}

/**
 * POST /api/v1/users/me/kyc/simulate
 * Simuler la validation du KYC pour des tests
 */
router.post('/me/kyc/simulate', async (req, res) => {
  try {
    const { data: updated, error } = await dbAdmin
      .from('users')
      .update({ kyc_status: 'verified', is_verified: true })
      .eq('id', req.user.id)
      .select('*')
      .single();

    if (error) throw error;

    res.json({ success: true, message: 'KYC Validé avec succès (simulation)', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur simulation KYC', error: err.message });
  }
});

export default router;
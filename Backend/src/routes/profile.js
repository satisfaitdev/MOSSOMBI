/**
 * ROUTES PROFIL UTILISATEUR - AGRÉGATEUR
 * Point d'entrée principal pour toutes les routes de profil
 */

import express from 'express';
import securityRoutes from './profile/security.js';
import twofaRoutes from './profile/twofa.js';
import sessionsRoutes from './profile/sessions.js';
import backpackRoutes from './profile/backpack.js';
import levelRoutes from './profile/level.js';
import settingsRoutes from './profile/settings.js';
import privacyRoutes from './profile/privacy.js';
import { dbAdmin } from '../config/db.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// =====================================================
// 📋 ROUTES PRINCIPALES PROFIL
// =====================================================

/**
 * GET /api/v1/profile
 * Récupérer le profil complet de l'utilisateur
 */
router.get('/', async (req, res) => {
  // Cette route sera implémentée si nécessaire
  // Pour l'instant, elle redirige vers les sous-routeurs
  res.json({
    success: true,
    message: 'API Profil - utilisez les sous-routes spécifiques',
    endpoints: [
      '/security',
      '/security/2fa',
      '/security/sessions',
      '/backpack',
      '/level',
      '/settings',
      '/privacy'
    ]
  });
});

/**
 * PUT /api/v1/profile/onboarding
 * Étape finale de l'inscription (Étape 3)
 */
router.put('/onboarding', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Non authentifié' });
  }

  const { birth_date, referral_code, acquisition_source, avatar_url } = req.body;

  const updateData = { updated_at: new Date().toISOString() };
  if (birth_date !== undefined) updateData.date_of_birth = birth_date; // Le vrai nom de la colonne est date_of_birth !
  if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

  // Récupération des metadatas actuels pour insérer les champs manquants sans écraser le JSON
  const { data: user } = await dbAdmin.from('users').select('metadata').eq('id', userId).single();
  const metadata = user?.metadata || {};
  const preferences = metadata.preferences || {};
  const onboarding = preferences.onboarding || {};

  // Mise à jour du JSON pour les colonnes inexistantes
  updateData.metadata = {
    ...metadata,
    preferences: {
      ...preferences,
      onboarding: {
        ...onboarding,
        acquisition_source: acquisition_source !== undefined ? acquisition_source : onboarding.acquisition_source,
        invite_code: referral_code !== undefined ? referral_code : onboarding.invite_code,
        completed: true
      }
    }
  };

  const { error } = await dbAdmin
    .from('users')
    .update(updateData)
    .eq('id', userId);

  if (error) {
    console.error("Supabase Onboarding Update Error:", error);
    throw new Error('Erreur lors de la mise à jour du profil: ' + error.message);
  }

  res.json({
    success: true,
    message: 'Profil complété avec succès'
  });
}));

// =====================================================
// 🔗 MONTAGE DES SOUS-ROUTEURS
// =====================================================

// Routes sécurité et 2FA
router.use('/', securityRoutes);
router.use('/', twofaRoutes);

// Routes sessions
router.use('/', sessionsRoutes);

// Routes sac à dos
router.use('/', backpackRoutes);

// Routes niveau et points
router.use('/', levelRoutes);

// Routes paramètres
router.use('/', settingsRoutes);

// Routes confidentialité
router.use('/', privacyRoutes);

export default router;

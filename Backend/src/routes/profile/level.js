/**
 * ROUTES NIVEAU & POINTS
 * Gestion du niveau, expérience et points utilisateur
 */

import express from 'express';
import Joi from 'joi';
import { dbAdmin } from '../../config/db.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';
import { asyncHandler, ValidationError } from '../../middleware/errorHandler.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

// =====================================================
// 📋 SCHÉMAS DE VALIDATION
// =====================================================

const addPointsSchema = Joi.object({
  points: Joi.number().integer().min(1).max(1000).required(),
  reason: Joi.string().max(200).required(),
  category: Joi.string().valid('achievement', 'daily', 'bonus', 'penalty').default('achievement')
});

// =====================================================
// ⭐ ROUTES NIVEAU & POINTS
// =====================================================

/**
 * GET /api/v1/profile/level
 * Récupérer le niveau et les points de l'utilisateur
 */
router.get('/level', authenticateToken, asyncHandler(async (req, res) => {
  // Récupérer les données de niveau de l'utilisateur
  const { data: userLevel, error } = await dbAdmin
    .from('user_levels')
    .select('*')
    .eq('user_id', req.user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    logger.error('Erreur récupération niveau', { userId: req.user.id, error });
    throw new ValidationError('Erreur lors de la récupération du niveau');
  }

  // Si l'utilisateur n'a pas encore de données de niveau, créer les données par défaut
  if (!userLevel) {
    const defaultLevelData = {
      user_id: req.user.id,
      level: 1,
      experience_points: 0,
      total_points: 0,
      daily_points: 0,
      weekly_points: 0,
      monthly_points: 0,
      achievements_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newLevel, error: insertError } = await dbAdmin
      .from('user_levels')
      .insert(defaultLevelData)
      .select()
      .single();

    if (insertError) {
      logger.error('Erreur création niveau par défaut', { 
        userId: req.user.id, 
        error: insertError 
      });
      throw new ValidationError('Erreur lors de l\'initialisation du niveau');
    }

    return res.json({
      success: true,
      message: 'Niveau initialisé',
      data: {
        level: newLevel.level,
        experience_points: newLevel.experience_points,
        total_points: newLevel.total_points,
        daily_points: newLevel.daily_points,
        weekly_points: newLevel.weekly_points,
        monthly_points: newLevel.monthly_points,
        achievements_count: newLevel.achievements_count,
        next_level_experience: calculateNextLevelExperience(newLevel.level),
        progress_to_next: calculateProgressToNext(newLevel.experience_points, newLevel.level),
        created_at: newLevel.created_at
      }
    });
  }

  // Calculer les informations de progression
  const nextLevelExp = calculateNextLevelExperience(userLevel.level);
  const progressToNext = calculateProgressToNext(userLevel.experience_points, userLevel.level);

  res.json({
    success: true,
    message: 'Niveau récupéré',
    data: {
      level: userLevel.level,
      experience_points: userLevel.experience_points,
      total_points: userLevel.total_points,
      daily_points: userLevel.daily_points,
      weekly_points: userLevel.weekly_points,
      monthly_points: userLevel.monthly_points,
      achievements_count: userLevel.achievements_count,
      next_level_experience: nextLevelExp,
      progress_to_next: progressToNext,
      created_at: userLevel.created_at,
      updated_at: userLevel.updated_at
    }
  });
}));

/**
 * POST /api/v1/profile/level/add-points
 * Ajouter des points à l'utilisateur (admin ou système)
 */
router.post('/level/add-points', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = addPointsSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details);
  }

  // Récupérer les données actuelles
  const { data: currentLevel } = await dbAdmin
    .from('user_levels')
    .select('*')
    .eq('user_id', req.user.id)
    .single();

  if (!currentLevel) {
    throw new ValidationError('Données de niveau non trouvées');
  }

  // Calculer les nouveaux points et expérience
  const newTotalPoints = currentLevel.total_points + value.points;
  const newExperiencePoints = currentLevel.experience_points + value.points;
  const newDailyPoints = currentLevel.daily_points + value.points;
  const newWeeklyPoints = currentLevel.weekly_points + value.points;
  const newMonthlyPoints = currentLevel.monthly_points + value.points;

  // Vérifier si l'utilisateur passe au niveau supérieur
  const currentLevelExp = calculateNextLevelExperience(currentLevel.level);
  let newLevel = currentLevel.level;
  let levelUpMessage = null;

  if (newExperiencePoints >= currentLevelExp) {
    newLevel = currentLevel.level + 1;
    levelUpMessage = `Félicitations ! Vous avez atteint le niveau ${newLevel} !`;
  }

  // Mettre à jour les données
  const { data: updatedLevel, error: updateError } = await dbAdmin
    .from('user_levels')
    .update({
      level: newLevel,
      experience_points: newExperiencePoints,
      total_points: newTotalPoints,
      daily_points: newDailyPoints,
      weekly_points: newWeeklyPoints,
      monthly_points: newMonthlyPoints,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (updateError) {
    logger.error('Erreur ajout points', { 
      userId: req.user.id, 
      error: updateError 
    });
    throw new ValidationError('Erreur lors de l\'ajout des points');
  }

  // Enregistrer l'historique des points
  const { error: historyError } = await dbAdmin
    .from('point_history')
    .insert({
      user_id: req.user.id,
      points: value.points,
      reason: value.reason,
      category: value.category,
      created_at: new Date().toISOString()
    });

  if (historyError) {
    logger.error('Erreur historique points', { 
      userId: req.user.id, 
      error: historyError 
    });
  }

  logger.info('Points ajoutés', { 
    userId: req.user.id,
    points: value.points,
    reason: value.reason,
    newLevel: newLevel
  });

  res.json({
    success: true,
    message: levelUpMessage || `${value.points} points ajoutés`,
    data: {
      points_added: value.points,
      new_level: newLevel,
      experience_points: updatedLevel.experience_points,
      total_points: updatedLevel.total_points,
      level_up: levelUpMessage ? true : false,
      next_level_experience: calculateNextLevelExperience(newLevel),
      progress_to_next: calculateProgressToNext(updatedLevel.experience_points, newLevel)
    }
  });
}));

/**
 * GET /api/v1/profile/level/history
 * Récupérer l'historique des points
 */
router.get('/level/history', authenticateToken, asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  const { data: history, error } = await dbAdmin
    .from('point_history')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.error('Erreur historique points', { userId: req.user.id, error });
    throw new ValidationError('Erreur lors de la récupération de l\'historique');
  }

  res.json({
    success: true,
    message: 'Historique des points récupéré',
    data: {
      history: history || [],
      total_count: history?.length || 0,
      limit: limit,
      offset: offset
    }
  });
}));

// =====================================================
// 🔧 FONCTIONS UTILITAIRES
// =====================================================

const calculateNextLevelExperience = (currentLevel) => {
  // Formule: 100 * level^1.5 (arrondi)
  return Math.round(100 * Math.pow(currentLevel, 1.5));
};

const calculateProgressToNext = (currentExp, currentLevel) => {
  const currentLevelExp = calculateNextLevelExperience(currentLevel - 1) || 0;
  const nextLevelExp = calculateNextLevelExperience(currentLevel);
  const progress = currentExp - currentLevelExp;
  const needed = nextLevelExp - currentLevelExp;
  
  return {
    current: Math.max(0, progress),
    needed: Math.max(1, needed),
    percentage: Math.min(100, Math.round((progress / needed) * 100))
  };
};

export default router;

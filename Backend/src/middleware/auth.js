/**
 * MIDDLEWARE D'AUTHENTIFICATION
 * Gestion de l'authentification JWT et Supabase
 */

import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabase.js';
import { AuthenticationError, AuthorizationError } from './errorHandler.js';
import { logger } from '../utils/logger.js';

// Middleware pour vérifier le token JWT
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AuthenticationError('Token d\'accès requis');
    }

    // Vérifier le token avec Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      throw new AuthenticationError('Token invalide ou expiré');
    }

    // Récupérer les données utilisateur complètes
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError) {
      logger.error('Erreur lors de la récupération des données utilisateur', {
        userId: user.id,
        error: userError
      });
      throw new AuthenticationError('Utilisateur non trouvé');
    }

    // Vérifier si l'utilisateur est actif
    if (!userData.is_active) {
      throw new AuthorizationError('Compte désactivé');
    }

    // Ajouter les données utilisateur à la requête
    req.user = {
      id: user.id,
      email: user.email,
      phone: userData.phone,
      full_name: userData.full_name,
      user_level: userData.user_level,
      points: userData.points,
      is_verified: userData.is_verified,
      metadata: userData.metadata,
      preferences: userData.preferences
    };

    // Mettre à jour la dernière activité
    await supabaseAdmin
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware pour vérifier les rôles/niveaux utilisateur
export const requireLevel = (minLevel) => {
  const levelHierarchy = {
    'Bronze': 1,
    'Silver': 2,
    'Gold': 3,
    'Diamond': 4
  };

  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentification requise');
      }

      const userLevel = levelHierarchy[req.user.user_level] || 0;
      const requiredLevel = levelHierarchy[minLevel] || 0;

      if (userLevel < requiredLevel) {
        throw new AuthorizationError(`Niveau ${minLevel} ou supérieur requis`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware pour vérifier la vérification du compte
export const requireVerification = (req, res, next) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentification requise');
    }

    if (!req.user.is_verified) {
      throw new AuthorizationError('Compte non vérifié. Veuillez vérifier votre téléphone ou email.');
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware optionnel (n'échoue pas si pas de token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    // Même logique que authenticateToken mais sans échouer
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      req.user = null;
      return next();
    }

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userData && userData.is_active) {
      req.user = {
        id: user.id,
        email: user.email,
        phone: userData.phone,
        full_name: userData.full_name,
        user_level: userData.user_level,
        points: userData.points,
        is_verified: userData.is_verified,
        metadata: userData.metadata,
        preferences: userData.preferences
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

// Middleware pour logger les actions utilisateur
export const logUserAction = (action) => {
  return (req, res, next) => {
    if (req.user) {
      logger.info(`Action utilisateur: ${action}`, {
        userId: req.user.id,
        action,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
    next();
  };
};

export default {
  authenticateToken,
  requireLevel,
  requireVerification,
  optionalAuth,
  logUserAction
};

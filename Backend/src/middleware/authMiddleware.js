/**
 * Middleware d'authentification JWT
 */

import SecurityService from '../services/securityService.js';
import { dbAdmin } from '../config/db.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware pour vérifier l'authentification JWT
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token d\'accès requis',
        code: 'MISSING_TOKEN'
      });
    }

    console.log('🔍 Backend - Token reçu:', token.substring(0, 50) + '...');

    // Vérifier le token JWT
    const decoded = SecurityService.verifyToken(token);
    console.log('✅ Backend - Token décodé:', { userId: decoded.userId, exp: decoded.exp });
    
    // Récupérer l'utilisateur depuis la base de données
    const { data: user, error } = await dbAdmin
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .eq('is_verified', true)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      logger.warn('Token valide mais utilisateur introuvable ou inactif', {
        userId: decoded.userId,
        error: error?.message
      });
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non autorisé',
        code: 'INVALID_USER'
      });
    }

    // Ajouter l'utilisateur à la requête
    req.user = user;
    req.tokenPayload = decoded;
    
    next();
  } catch (error) {
    logger.warn('Erreur d\'authentification', {
      error: error.message,
      token: req.headers['authorization']?.substring(0, 20) + '...'
    });

    return res.status(401).json({
      success: false,
      error: 'Token invalide ou expiré',
      code: 'INVALID_TOKEN'
    });
  }
};

/**
 * Middleware pour vérifier les permissions d'administration
 */
const requireAdmin = (req, res, next) => {
  const role = req.user?.role;
  const isSuper = Boolean(req.user?.is_super_admin);
  const isAdminRole = role === 'admin' || role === 'super_admin';

  if (!req.user || (!isAdminRole && !isSuper)) {
    return res.status(403).json({
      success: false,
      error: 'Accès administrateur requis',
      code: 'ADMIN_REQUIRED'
    });
  }
  next();
};

/**
 * Middleware optionnel pour récupérer l'utilisateur si connecté
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = SecurityService.verifyToken(token);
      const { data: user } = await dbAdmin
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .eq('is_verified', true)
        .eq('is_active', true)
        .single();

      if (user) {
        req.user = user;
        req.tokenPayload = decoded;
      }
    }
  } catch (error) {
    // Ignorer les erreurs en mode optionnel
  }
  
  next();
};

export {
  authenticateToken,
  requireAdmin,
  optionalAuth
};

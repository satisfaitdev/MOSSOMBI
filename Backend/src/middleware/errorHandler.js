/**
 * MIDDLEWARE DE GESTION D'ERREURS GLOBAL
 * Centralise la gestion des erreurs pour l'API
 */

import { logger } from '../utils/logger.js';

// Classes d'erreurs personnalisées
export class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Non authentifié') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Non autorisé') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Ressource non trouvée') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflit de données') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Erreur de base de données') {
    super(message, 500, 'DATABASE_ERROR');
  }
}

// Middleware principal de gestion d'erreurs
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log de l'erreur
  logger.error(`Erreur ${err.statusCode || 500}: ${err.message}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    stack: err.stack,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Erreurs Supabase
  if (err.code === 'PGRST116') {
    error = new NotFoundError('Ressource non trouvée');
  }

  // Erreurs de validation Joi
  if (err.isJoi) {
    const message = err.details.map(detail => detail.message).join(', ');
    error = new ValidationError(message, err.details);
  }

  // Erreurs JWT
  if (err.name === 'JsonWebTokenError') {
    error = new AuthenticationError('Token invalide');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('Token expiré');
  }

  // Erreurs de parsing JSON
  if (err.type === 'entity.parse.failed') {
    error = new ValidationError('Format JSON invalide');
  }

  // Erreurs de taille de fichier
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new ValidationError('Fichier trop volumineux');
  }

  // Erreurs de connexion base de données
  if (err.code === 'ECONNREFUSED') {
    error = new DatabaseError('Impossible de se connecter à la base de données');
  }

  // Réponse d'erreur
  const response = {
    success: false,
    error: error.message,
    code: error.code || 'INTERNAL_SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  };

  // Ajouter les détails de validation si disponibles
  if (error.details) {
    response.details = error.details;
  }

  // Statut par défaut
  const statusCode = error.statusCode || 500;

  res.status(statusCode).json(response);
};

// Middleware pour capturer les erreurs async
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Fonction utilitaire pour créer des réponses d'erreur
export const createErrorResponse = (message, statusCode = 500, code = null) => {
  throw new AppError(message, statusCode, code);
};

export default {
  errorHandler,
  asyncHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  createErrorResponse
};

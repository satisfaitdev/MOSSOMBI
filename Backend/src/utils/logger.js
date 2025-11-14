/**
 * SYSTÈME DE LOGGING WINSTON
 * Configuration centralisée des logs pour l'application
 */

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration des niveaux de log
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Configuration des couleurs
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

winston.addColors(logColors);

// Format personnalisé pour les logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Ajouter la stack trace pour les erreurs
    if (stack) {
      log += `\n${stack}`;
    }
    
    // Ajouter les métadonnées si présentes
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Format pour la console (plus lisible en développement)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `${timestamp} ${level}: ${message}`;
  })
);

// Configuration des transports
const transports = [
  // Console (toujours actif)
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
  })
];

// Fichier de log en production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    // Logs généraux
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/app.log'),
      format: logFormat,
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Logs d'erreur séparés
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      format: logFormat,
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

// Création du logger
export const logger = winston.createLogger({
  levels: logLevels,
  format: logFormat,
  defaultMeta: { service: 'mossombi-backend' },
  transports,
  exitOnError: false
});

// Fonction utilitaire pour logger les requêtes HTTP
export const logRequest = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, url, ip } = req;
    const { statusCode } = res;
    
    logger.http(`${method} ${url}`, {
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      ip,
      userAgent: req.get('User-Agent')
    });
  });
  
  next();
};

// Fonction pour logger les erreurs avec contexte
export const logError = (error, context = {}) => {
  logger.error(error.message, {
    stack: error.stack,
    ...context
  });
};

// Fonction pour logger les actions utilisateur
export const logUserAction = (userId, action, details = {}) => {
  logger.info(`User action: ${action}`, {
    userId,
    action,
    ...details,
    timestamp: new Date().toISOString()
  });
};

export default logger;

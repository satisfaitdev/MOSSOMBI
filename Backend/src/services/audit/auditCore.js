/**
 * CŒUR DU SERVICE D'AUDIT
 * Configuration et fonctionnalités de base
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import { logger } from '../../utils/logger.js';
import { dbAdmin } from '../../config/db.js';

class AuditCore {
  constructor() {
    // Configuration des logs d'audit
    this.config = {
      logDirectory: './logs/audit',
      maxFileSize: 50 * 1024 * 1024, // 50MB par fichier
      maxFiles: 100,                  // Garder 100 fichiers max
      rotationInterval: 24 * 60 * 60 * 1000, // Rotation quotidienne
      compressionEnabled: true,
      encryptionEnabled: true,
      encryptionKey: process.env.AUDIT_ENCRYPTION_KEY || 'default-key-change-in-production'
    };

    // Catégories d'événements auditables
    this.eventCategories = {
      AUTHENTICATION: 'authentication',
      AUTHORIZATION: 'authorization',
      DATA_ACCESS: 'data_access',
      DATA_MODIFICATION: 'data_modification',
      SECURITY: 'security',
      FINANCIAL: 'financial',
      ADMIN: 'admin',
      SYSTEM: 'system',
      ERROR: 'error'
    };

    // Niveaux de criticité
    this.severityLevels = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };

    // Stockage temporaire des logs (buffer)
    this.logBuffer = [];
    this.isRotating = false;
    this.encryptionErrorLogged = false; // Flag pour éviter le spam d'erreurs
    this.auditErrorLogged = false; // Flag pour éviter le spam d'erreurs audit
    this.bufferSize = 1000;
    this.flushInterval = 30000; // 30 secondes
    
    // Configuration base de données
    this.dbEnabled = true; // Toujours activer la DB
    this.dbBuffer = []; // Buffer séparé pour la DB

    // Statistiques en temps réel
    this.stats = {
      totalEvents: 0,
      eventsByCategory: {},
      eventsBySeverity: {},
      suspiciousEvents: 0,
      lastFlush: Date.now()
    };

    // Démarrer le flush automatique
    const interval = setInterval(() => {
      try {
        this.flushBuffer();
        this.flushDatabase();
      } catch (error) {
        // Ignorer les erreurs de flush automatique en développement
        if (process.env.NODE_ENV !== 'development') {
          logger.error('Erreur flush automatique:', { error: error.message });
        }
      }
    }, this.flushInterval);

    if (process.env.NODE_ENV === 'test') {
      interval.unref();
    }
  }

  /**
   * Initialiser le service d'audit
   */
  async initialize() {
    try {
      // Créer le répertoire de logs s'il n'existe pas
      await fs.mkdir(this.config.logDirectory, { recursive: true });
      
      // Initialiser les statistiques
      Object.values(this.eventCategories).forEach(category => {
        this.stats.eventsByCategory[category] = 0;
      });
      
      Object.values(this.severityLevels).forEach(severity => {
        this.stats.eventsBySeverity[severity] = 0;
      });

      logger.info('Service d\'audit initialisé');
    } catch (error) {
      logger.error('Erreur initialisation service audit:', error);
      throw error;
    }
  }

  /**
   * Chiffrer les données sensibles
   */
  encryptData(data) {
    if (!this.config.encryptionEnabled) {
      return data;
    }

    try {
      const algorithm = 'aes-256-gcm';
      const key = crypto.scryptSync(this.config.encryptionKey, 'salt', 32);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(algorithm, key, iv);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      if (!this.encryptionErrorLogged) {
        logger.error('Erreur chiffrement audit:', error);
        this.encryptionErrorLogged = true;
      }
      return data; // Retourner les données non chiffrées en cas d'erreur
    }
  }

  /**
   * Déchiffrer les données sensibles
   */
  decryptData(encryptedData) {
    if (!this.config.encryptionEnabled || typeof encryptedData === 'string') {
      return encryptedData;
    }

    try {
      const algorithm = 'aes-256-gcm';
      const key = crypto.scryptSync(this.config.encryptionKey, 'salt', 32);
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const authTag = Buffer.from(encryptedData.authTag, 'hex');
      const decipher = crypto.createDecipher(algorithm, key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('Erreur déchiffrement audit:', error);
      return '[DONNÉES CORROMPUES]';
    }
  }

  /**
   * Générer un identifiant unique pour l'événement
   */
  generateEventId() {
    return `audit_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Valider les données d'événement
   */
  validateEventData(eventData) {
    const required = ['category', 'action', 'userId', 'timestamp'];
    const missing = required.filter(field => !eventData[field]);
    
    if (missing.length > 0) {
      throw new Error(`Champs requis manquants: ${missing.join(', ')}`);
    }

    if (!Object.values(this.eventCategories).includes(eventData.category)) {
      throw new Error(`Catégorie invalide: ${eventData.category}`);
    }

    if (!Object.values(this.severityLevels).includes(eventData.severity)) {
      throw new Error(`Niveau de sévérité invalide: ${eventData.severity}`);
    }
  }

  /**
   * Mettre à jour les statistiques
   */
  updateStats(eventData) {
    this.stats.totalEvents++;
    this.stats.eventsByCategory[eventData.category] = 
      (this.stats.eventsByCategory[eventData.category] || 0) + 1;
    this.stats.eventsBySeverity[eventData.severity] = 
      (this.stats.eventsBySeverity[eventData.severity] || 0) + 1;
    
    if (eventData.suspicious) {
      this.stats.suspiciousEvents++;
    }
  }

  /**
   * Obtenir les statistiques actuelles
   */
  getStats() {
    return {
      ...this.stats,
      bufferSize: this.logBuffer.length,
      dbBufferSize: this.dbBuffer.length,
      lastFlush: new Date(this.stats.lastFlush).toISOString()
    };
  }

  /**
   * Vider les buffers
   */
  clearBuffers() {
    this.logBuffer = [];
    this.dbBuffer = [];
    this.stats.lastFlush = Date.now();
  }
}

export default AuditCore;

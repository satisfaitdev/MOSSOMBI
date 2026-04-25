/**
 * SERVICE DE LOGGING D'AUDIT COMPLET
 * Traçabilité complète de toutes les actions sensibles et événements de sécurité
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger.js';
import { dbAdmin } from '../config/db.js';

class AuditLogService {
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

    // Le service sera initialisé par le serveur principal

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

      logger.info('Service d\'audit initialisé', {
        logDirectory: this.config.logDirectory,
        encryptionEnabled: this.config.encryptionEnabled
      });
    } catch (error) {
      logger.error('Erreur initialisation service audit', { error: error.message });
    }
  }

  /**
   * Enregistrer un événement d'audit
   * @param {Object} eventData - Données de l'événement
   */
  async logEvent(eventData) {
    try {
      const auditEvent = this.createAuditEvent(eventData);
      
      // Ajouter au buffer
      this.logBuffer.push(auditEvent);
      
      // Ajouter au buffer pour base de données
      if (this.dbEnabled) {
        this.dbBuffer.push(this.formatForDatabase(auditEvent));
      }

      // Mettre à jour les statistiques
      this.updateStats(auditEvent);
      
      // Flush si le buffer est plein
      if (this.logBuffer.length >= this.bufferSize) {
        await this.flushBuffer();
      }
      
      if (this.dbBuffer.length >= this.bufferSize) {
        await this.flushDatabase();
      }

      // Log critique immédiat
      if (auditEvent.severity === this.severityLevels.CRITICAL) {
        await this.flushBuffer();
        await this.flushDatabase();
        await this.sendCriticalAlert(auditEvent);
      }

    } catch (error) {
      // En développement, ne pas spammer les logs d'erreur
      if (process.env.NODE_ENV !== 'development') {
        logger.error('Erreur enregistrement audit', { 
          error: error.message,
          stack: error.stack,
          context: {}
        });
      } else {
        // En dev, logger seulement une fois par type d'erreur
        if (!this.auditErrorLogged) {
          logger.warn('Audit en mode développement - erreurs supprimées');
          this.auditErrorLogged = true;
        }
      }
    }
  }

  /**
   * Créer un événement d'audit structuré
   * @param {Object} eventData - Données brutes de l'événement
   * @returns {Object} Événement d'audit formaté
   */
  createAuditEvent(eventData) {
    const timestamp = new Date().toISOString();
    const eventId = this.generateEventId();

    return {
      // Métadonnées de base
      eventId,
      timestamp,
      version: '1.0',
      
      // Informations de l'événement
      category: eventData.category || this.eventCategories.SYSTEM,
      action: eventData.action || 'unknown',
      severity: eventData.severity || this.severityLevels.LOW,
      description: eventData.description || '',
      
      // Acteur (qui a fait l'action)
      actor: {
        userId: eventData.userId || null,
        sessionId: eventData.sessionId || null,
        userAgent: eventData.userAgent || null,
        ip: eventData.ip || null,
        type: eventData.actorType || 'user' // user, system, admin, api
      },
      
      // Cible (sur quoi l'action a été effectuée)
      target: {
        resourceType: eventData.resourceType || null,
        resourceId: eventData.resourceId || null,
        resourceName: eventData.resourceName || null
      },
      
      // Contexte technique
      context: {
        endpoint: eventData.endpoint || null,
        method: eventData.method || null,
        statusCode: eventData.statusCode || null,
        responseTime: eventData.responseTime || null,
        requestSize: eventData.requestSize || null,
        responseSize: eventData.responseSize || null
      },
      
      // Données sensibles (chiffrées)
      sensitiveData: eventData.sensitiveData ? this.encryptData(eventData.sensitiveData) : null,
      
      // Résultat de l'action
      result: {
        success: eventData.success !== false, // Par défaut true
        errorCode: eventData.errorCode || null,
        errorMessage: eventData.errorMessage || null
      },
      
      // Données de sécurité
      security: {
        riskScore: eventData.riskScore || 0,
        isSuspicious: eventData.isSuspicious || false,
        securityFlags: eventData.securityFlags || [],
        geolocation: eventData.geolocation || null
      },
      
      // Données métier spécifiques
      businessData: eventData.businessData || {},
      
      // Hash d'intégrité
      integrity: null // Sera calculé après
    };
  }

  /**
   * Enregistrer un événement d'authentification
   */
  async logAuthentication(userId, action, success, details = {}) {
    await this.logEvent({
      category: this.eventCategories.AUTHENTICATION,
      action: `auth_${action}`, // login, logout, register, password_change
      severity: success ? this.severityLevels.LOW : this.severityLevels.MEDIUM,
      description: `Tentative ${action} ${success ? 'réussie' : 'échouée'}`,
      userId,
      success,
      ...details
    });
  }

  /**
   * Enregistrer un événement de sécurité
   */
  async logSecurityEvent(action, severity, details = {}) {
    await this.logEvent({
      category: this.eventCategories.SECURITY,
      action: `security_${action}`,
      severity,
      description: details.description || `Événement de sécurité: ${action}`,
      isSuspicious: severity === this.severityLevels.HIGH || severity === this.severityLevels.CRITICAL,
      ...details
    });
  }

  /**
   * Enregistrer un accès aux données
   */
  async logDataAccess(userId, resourceType, resourceId, action, details = {}) {
    await this.logEvent({
      category: this.eventCategories.DATA_ACCESS,
      action: `data_${action}`, // read, list, search
      severity: this.severityLevels.LOW,
      description: `Accès ${action} à ${resourceType}`,
      userId,
      resourceType,
      resourceId,
      ...details
    });
  }

  /**
   * Enregistrer une modification de données
   */
  async logDataModification(userId, resourceType, resourceId, action, changes = {}, details = {}) {
    await this.logEvent({
      category: this.eventCategories.DATA_MODIFICATION,
      action: `data_${action}`, // create, update, delete
      severity: action === 'delete' ? this.severityLevels.MEDIUM : this.severityLevels.LOW,
      description: `Modification ${action} de ${resourceType}`,
      userId,
      resourceType,
      resourceId,
      businessData: { changes },
      ...details
    });
  }

  /**
   * Enregistrer une transaction financière
   */
  async logFinancialTransaction(userId, transactionType, amount, details = {}) {
    const severity = amount > 100000 ? this.severityLevels.HIGH : this.severityLevels.MEDIUM;
    
    await this.logEvent({
      category: this.eventCategories.FINANCIAL,
      action: `transaction_${transactionType}`,
      severity,
      description: `Transaction ${transactionType} de ${amount} CDF`,
      userId,
      businessData: { 
        amount, 
        currency: 'CDF',
        transactionType 
      },
      ...details
    });
  }

  /**
   * Enregistrer une action administrative
   */
  async logAdminAction(adminId, action, targetUserId, details = {}) {
    await this.logEvent({
      category: this.eventCategories.ADMIN,
      action: `admin_${action}`,
      severity: this.severityLevels.HIGH,
      description: `Action admin: ${action}`,
      userId: adminId,
      resourceType: 'user',
      resourceId: targetUserId,
      actorType: 'admin',
      ...details
    });
  }

  /**
   * Enregistrer une erreur système
   */
  async logSystemError(error, context = {}) {
    await this.logEvent({
      category: this.eventCategories.ERROR,
      action: 'system_error',
      severity: this.severityLevels.MEDIUM,
      description: `Erreur système: ${error.message}`,
      success: false,
      errorCode: error.code || 'UNKNOWN',
      errorMessage: error.message,
      businessData: { 
        stack: error.stack,
        context 
      }
    });
  }

  /**
   * Flush du buffer vers les fichiers
   */
  async flushBuffer() {
    if (this.logBuffer.length === 0) return;

    const events = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // Calculer l'intégrité pour chaque événement
      events.forEach(event => {
        event.integrity = this.calculateIntegrity(event);
      });

      // Écrire dans le fichier
      await this.writeToFile(events);
      
      this.stats.lastFlush = Date.now();
      
      logger.debug('Buffer audit flushé', { eventCount: events.length });
    } catch (error) {
      // En développement, ne pas logger les erreurs de flush
      if (process.env.NODE_ENV !== 'development') {
        logger.error('Erreur flush buffer audit', { error: error.message });
      }
      // Remettre les événements dans le buffer en cas d'erreur
      this.logBuffer.unshift(...events);
    }
  }

  /**
   * Écrire les événements dans un fichier
   */
  async writeToFile(events) {
    const today = new Date().toISOString().split('T')[0];
    const filename = `audit-${today}.jsonl`;
    const filepath = path.join(this.config.logDirectory, filename);

    try {
      // Créer le répertoire s'il n'existe pas
      await fs.mkdir(this.config.logDirectory, { recursive: true });

      // Préparer les données à écrire
      const logLines = events.map(event => {
        const eventString = JSON.stringify(event);
        return this.config.encryptionEnabled ? this.encryptSensitiveData(eventString) : eventString;
      });

      // Écrire dans le fichier (append)
      await fs.appendFile(filepath, logLines.join('\n') + '\n');

      // Vérifier la taille du fichier et faire la rotation si nécessaire
      await this.checkFileRotation(filepath);

    } catch (error) {
      // En développement, ne pas spammer les erreurs de fichier
      if (process.env.NODE_ENV !== 'development') {
        logger.error('Erreur écriture fichier audit', { error: error.message, filepath });
      }
      throw error;
    }
  }

  /**
   * Vérifier et effectuer la rotation des fichiers
   */
  async checkFileRotation(filepath) {
    try {
      const stats = await fs.stat(filepath);
      
      if (stats.size > this.config.maxFileSize) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotatedPath = filepath.replace('.jsonl', `-${timestamp}.jsonl`);
        
        await fs.rename(filepath, rotatedPath);
        
        logger.info('Rotation fichier audit effectuée', {
          originalFile: filepath,
          rotatedFile: rotatedPath,
          size: stats.size
        });

        // Nettoyer les anciens fichiers
        await this.cleanupOldFiles();
      }
    } catch (error) {
      logger.error('Erreur rotation fichier audit', { error: error.message });
    }
  }

  /**
   * Nettoyer les anciens fichiers de logs
   */
  async cleanupOldFiles() {
    try {
      const files = await fs.readdir(this.config.logDirectory);
      const auditFiles = files
        .filter(file => file.startsWith('audit-') && file.endsWith('.jsonl'))
        .map(file => ({
          name: file,
          path: path.join(this.config.logDirectory, file),
          mtime: 0
        }));

      // Obtenir les dates de modification
      for (const file of auditFiles) {
        const stats = await fs.stat(file.path);
        file.mtime = stats.mtime.getTime();
      }

      // Trier par date (plus récent en premier)
      auditFiles.sort((a, b) => b.mtime - a.mtime);

      // Supprimer les fichiers en excès
      if (auditFiles.length > this.config.maxFiles) {
        const filesToDelete = auditFiles.slice(this.config.maxFiles);
        
        for (const file of filesToDelete) {
          await fs.unlink(file.path);
          logger.info('Ancien fichier audit supprimé', { file: file.name });
        }
      }
    } catch (error) {
      logger.error('Erreur nettoyage fichiers audit', { error: error.message });
    }
  }

  /**
   * Chiffrer des données sensibles
   */
  encryptSensitiveData(data) {
    if (!data) return null;
    
    try {
      // Utiliser createCipheriv (moderne) au lieu de createCipher (obsolète)
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(this.config.encryptionKey, 'salt', 32);
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Préfixer avec l'IV pour le déchiffrement
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      // En développement, logger seulement une fois
      if (process.env.NODE_ENV === 'development') {
        if (!this.encryptionErrorLogged) {
          logger.warn('Chiffrement audit désactivé en développement:', { error: error.message });
          this.encryptionErrorLogged = true;
        }
        return '[DEV_PLAINTEXT]';
      }
      
      logger.error('Erreur chiffrement données audit', { error: error.message });
      return '[ENCRYPTION_ERROR]';
    }
  }

  /**
   * Déchiffrer des données sensibles
   */
  decryptData(encryptedData) {
    if (!this.config.encryptionEnabled) return encryptedData;
    if (!encryptedData || encryptedData.startsWith('[DEV_PLAINTEXT]')) return encryptedData;

    try {
      // Séparer l'IV des données chiffrées
      const parts = encryptedData.split(':');
      if (parts.length !== 2) {
        throw new Error('Format de données chiffrées invalide');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(this.config.encryptionKey, 'salt', 32);
      
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      logger.error('Erreur déchiffrement données audit', { error: error.message });
      return '[DECRYPTION_ERROR]';
    }
  }

  /**
   * Formater un événement pour la base de données
   */
  formatForDatabase(auditEvent) {
    return {
      event_id: auditEvent.eventId,
      timestamp: auditEvent.timestamp,
      category: auditEvent.category,
      action: auditEvent.action,
      severity: auditEvent.severity,
      description: auditEvent.description,
      user_id: auditEvent.userId || null,
      session_id: auditEvent.sessionId || null,
      ip_address: auditEvent.ipAddress || null,
      user_agent: auditEvent.userAgent || null,
      endpoint: auditEvent.endpoint || null,
      http_method: auditEvent.httpMethod || null,
      status_code: auditEvent.statusCode || null,
      response_time: auditEvent.responseTime || null,
      success: auditEvent.success !== false,
      is_suspicious: auditEvent.isSuspicious || false,
      risk_score: auditEvent.riskScore || 0,
      server_name: 'mossombi-backend',
      environment: process.env.NODE_ENV || 'development'
    };
  }

  /**
   * Flush du buffer vers la base de données
   */
  async flushDatabase() {
    if (!this.dbEnabled || this.dbBuffer.length === 0) return;

    try {
      const events = [...this.dbBuffer];
      this.dbBuffer = [];

      // Insertion dans la base de données
      
      const { error } = await dbAdmin
        .from('audit_events')
        .insert(events);

      if (error) {
        logger.error('Erreur insertion audit DB:', { 
          message: error.message,
          code: error.code
        });
        // Remettre les événements dans le buffer en cas d'erreur
        this.dbBuffer.unshift(...events);
      } else {
        logger.info('Audit DB flush réussi', { eventCount: events.length });
      }

    } catch (error) {
      if (process.env.NODE_ENV !== 'development') {
        logger.error('Erreur flush audit DB:', { error: error.message });
      }
    }
  }

  /**
   * Calculer l'intégrité d'un événement
   */
  calculateIntegrity(event) {
    const eventCopy = { ...event };
    delete eventCopy.integrity; // Exclure le champ integrity du calcul
    
    const eventString = JSON.stringify(eventCopy, Object.keys(eventCopy).sort());
    return crypto.createHash('sha256').update(eventString).digest('hex');
  }

  /**
   * Générer un ID d'événement unique
   */
  generateEventId() {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(8).toString('hex');
    return `${timestamp}-${random}`;
  }

  /**
   * Mettre à jour les statistiques
   */
  updateStats(event) {
    this.stats.totalEvents++;
    this.stats.eventsByCategory[event.category] = (this.stats.eventsByCategory[event.category] || 0) + 1;
    this.stats.eventsBySeverity[event.severity] = (this.stats.eventsBySeverity[event.severity] || 0) + 1;
    
    if (event.security.isSuspicious) {
      this.stats.suspiciousEvents++;
    }
  }

  /**
   * Envoyer une alerte critique
   */
  async sendCriticalAlert(event) {
    try {
      // En production, envoyer des notifications (email, SMS, Slack, etc.)
      logger.error('ALERTE CRITIQUE AUDIT', {
        eventId: event.eventId,
        action: event.action,
        userId: event.actor.userId,
        description: event.description,
        timestamp: event.timestamp
      });

      // Ici, ajouter l'intégration avec des services d'alerte
      // - Email aux administrateurs
      // - Notification Slack
      // - SMS d'urgence
      // - Webhook vers système de monitoring
      
    } catch (error) {
      logger.error('Erreur envoi alerte critique', { error: error.message });
    }
  }

  /**
   * Rechercher dans les logs d'audit
   */
  async searchAuditLogs(criteria = {}) {
    // Cette méthode nécessiterait une base de données pour être efficace
    // En production, utiliser Elasticsearch ou une base de données dédiée
    
    logger.info('Recherche dans les logs d\'audit', { criteria });
    
    return {
      message: 'Recherche non implémentée - utiliser une base de données dédiée en production',
      criteria
    };
  }

  /**
   * Obtenir les statistiques d'audit
   */
  getAuditStats() {
    return {
      ...this.stats,
      bufferSize: this.logBuffer.length,
      config: {
        logDirectory: this.config.logDirectory,
        encryptionEnabled: this.config.encryptionEnabled,
        maxFileSize: this.config.maxFileSize,
        maxFiles: this.config.maxFiles
      }
    };
  }

  /**
   * Générer un rapport d'audit
   */
  async generateAuditReport(startDate, endDate) {
    try {
      const report = {
        period: { startDate, endDate },
        summary: { ...this.stats },
        topActions: {},
        topUsers: {},
        securityEvents: this.stats.suspiciousEvents,
        generatedAt: new Date().toISOString()
      };

      logger.info('Rapport d\'audit généré', { 
        period: report.period,
        totalEvents: report.summary.totalEvents 
      });

      return report;
    } catch (error) {
      logger.error('Erreur génération rapport audit', { error: error.message });
      throw error;
    }
  }
}

// Instance singleton
export const auditLogService = new AuditLogService();

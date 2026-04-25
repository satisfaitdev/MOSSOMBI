/**
 * GESTION DES LOGS FICHIERS D'AUDIT
 * Écriture, rotation et compression des fichiers
 */

import fs from 'fs/promises';
import path from 'path';
import zlib from 'zlib';
import { promisify } from 'util';
import { logger } from '../../utils/logger.js';

const gzip = promisify(zlib.gzip);

class AuditLogger {
  constructor(core) {
    this.core = core;
  }

  /**
   * Écrire un événement dans le buffer
   */
  logEvent(eventData) {
    try {
      // Valider les données
      this.core.validateEventData(eventData);
      
      // Mettre à jour les statistiques
      this.core.updateStats(eventData);
      
      // Ajouter au buffer
      this.core.logBuffer.push({
        ...eventData,
        id: this.core.generateEventId(),
        timestamp: new Date().toISOString()
      });

      // Forcer le flush si le buffer est plein
      if (this.core.logBuffer.length >= this.core.bufferSize) {
        this.flushBuffer();
      }
    } catch (error) {
      if (!this.core.auditErrorLogged) {
        logger.error('Erreur logging événement audit:', error);
        this.core.auditErrorLogged = true;
      }
    }
  }

  /**
   * Vider le buffer dans les fichiers
   */
  async flushBuffer() {
    if (this.core.logBuffer.length === 0) return;

    try {
      const eventsToWrite = [...this.core.logBuffer];
      this.core.logBuffer = []; // Vider le buffer immédiatement

      // Grouper par date pour les fichiers
      const eventsByDate = this.groupEventsByDate(eventsToWrite);
      
      // Écrire chaque groupe dans son fichier
      for (const [date, events] of Object.entries(eventsByDate)) {
        await this.writeEventsToFile(date, events);
      }

      // Vérifier la rotation des fichiers
      await this.rotateIfNeeded();
      
      // Nettoyer les anciens fichiers
      await this.cleanupOldFiles();

    } catch (error) {
      logger.error('Erreur flush buffer audit:', error);
      // Remettre les événements dans le buffer en cas d'erreur
      this.core.logBuffer.unshift(...this.core.logBuffer);
    }
  }

  /**
   * Grouper les événements par date
   */
  groupEventsByDate(events) {
    return events.reduce((groups, event) => {
      const date = event.timestamp.split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(event);
      return groups;
    }, {});
  }

  /**
   * Écrire les événements dans un fichier
   */
  async writeEventsToFile(date, events) {
    const filename = `audit_${date}.log`;
    const filepath = path.join(this.core.config.logDirectory, filename);
    
    // Formater les événements
    const logLines = events.map(event => this.formatEvent(event)).join('\n') + '\n';
    
    // Chiffrer les données sensibles
    const encryptedLines = this.core.config.encryptionEnabled 
      ? this.encryptSensitiveData(logLines)
      : logLines;
    
    // Écrire dans le fichier
    await fs.appendFile(filepath, encryptedLines);
  }

  /**
   * Formater un événement pour l'écriture
   */
  formatEvent(event) {
    const logEntry = {
      id: event.id,
      timestamp: event.timestamp,
      category: event.category,
      action: event.action,
      severity: event.severity,
      userId: event.userId,
      ip: event.ip || 'unknown',
      userAgent: event.userAgent || 'unknown',
      details: event.details || {},
      suspicious: event.suspicious || false
    };

    return JSON.stringify(logEntry);
  }

  /**
   * Chiffrer les données sensibles dans les logs
   */
  encryptSensitiveData(logContent) {
    // Implémentation simple - dans un vrai système, 
    // on chiffrerait seulement les champs sensibles
    return this.core.encryptData(logContent);
  }

  /**
   * Vérifier si une rotation est nécessaire
   */
  async rotateIfNeeded() {
    try {
      const files = await this.getLogFiles();
      
      for (const file of files) {
        const stats = await fs.stat(file.path);
        
        // Rotation si le fichier est trop gros
        if (stats.size > this.core.config.maxFileSize) {
          await this.rotateFile(file);
        }
      }
    } catch (error) {
      logger.error('Erreur vérification rotation:', error);
    }
  }

  /**
   * Obtenir la liste des fichiers de log
   */
  async getLogFiles() {
    try {
      const files = await fs.readdir(this.core.config.logDirectory);
      return files
        .filter(file => file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.core.config.logDirectory, file)
        }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Rotater un fichier
   */
  async rotateFile(file) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedName = file.name.replace('.log', `_${timestamp}.log`);
      const rotatedPath = path.join(this.core.config.logDirectory, rotatedName);
      
      // Renommer le fichier
      await fs.rename(file.path, rotatedPath);
      
      // Compresser si activé
      if (this.core.config.compressionEnabled) {
        await this.compressFile(rotatedPath);
      }
      
      logger.info(`Fichier d'audit rotaté: ${file.name} -> ${rotatedName}`);
    } catch (error) {
      logger.error(`Erreur rotation fichier ${file.name}:`, error);
    }
  }

  /**
   * Compresser un fichier
   */
  async compressFile(filepath) {
    try {
      const content = await fs.readFile(filepath);
      const compressed = await gzip(content);
      const compressedPath = filepath + '.gz';
      
      await fs.writeFile(compressedPath, compressed);
      await fs.unlink(filepath); // Supprimer l'original
      
      logger.info(`Fichier compressé: ${filepath}`);
    } catch (error) {
      logger.error(`Erreur compression fichier ${filepath}:`, error);
    }
  }

  /**
   * Nettoyer les anciens fichiers
   */
  async cleanupOldFiles() {
    try {
      const files = await fs.readdir(this.core.config.logDirectory);
      const logFiles = files.filter(file => 
        file.endsWith('.log') || file.endsWith('.log.gz')
      );
      
      // Trier par date de modification
      const fileStats = await Promise.all(
        logFiles.map(async file => {
          const filepath = path.join(this.core.config.logDirectory, file);
          const stats = await fs.stat(filepath);
          return { file, path: filepath, mtime: stats.mtime };
        })
      );
      
      fileStats.sort((a, b) => b.mtime - a.mtime);
      
      // Supprimer les fichiers en excès
      if (fileStats.length > this.core.config.maxFiles) {
        const filesToDelete = fileStats.slice(this.core.config.maxFiles);
        
        for (const file of filesToDelete) {
          await fs.unlink(file.path);
          logger.info(`Ancien fichier d'audit supprimé: ${file.file}`);
        }
      }
    } catch (error) {
      logger.error('Erreur nettoyage anciens fichiers:', error);
    }
  }

  /**
   * Lire les logs d'une date spécifique
   */
  async readLogs(date) {
    try {
      const filename = `audit_${date}.log`;
      const filepath = path.join(this.core.config.logDirectory, filename);
      
      const content = await fs.readFile(filepath, 'utf8');
      const lines = content.trim().split('\n').filter(line => line);
      
      return lines.map(line => {
        try {
          const event = JSON.parse(line);
          // Déchiffrer si nécessaire
          if (this.core.config.encryptionEnabled && typeof event === 'string') {
            return JSON.parse(this.core.decryptData(event));
          }
          return event;
        } catch (error) {
          return { error: 'Invalid log entry', raw: line };
        }
      });
    } catch (error) {
      logger.error(`Erreur lecture logs ${date}:`, error);
      return [];
    }
  }
}

export default AuditLogger;

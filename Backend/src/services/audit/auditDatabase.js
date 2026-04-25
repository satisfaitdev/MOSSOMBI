/**
 * GESTION DE LA BASE DE DONNÉES D'AUDIT
 * Stockage et recherche des événements en base
 */

import { dbAdmin } from '../../config/db.js';
import { logger } from '../../utils/logger.js';

class AuditDatabase {
  constructor(core) {
    this.core = core;
  }

  /**
   * Ajouter un événement au buffer de base de données
   */
  logEvent(eventData) {
    if (!this.core.dbEnabled) return;

    try {
      // Valider les données
      this.core.validateEventData(eventData);
      
      // Ajouter au buffer DB
      this.core.dbBuffer.push({
        ...eventData,
        id: this.core.generateEventId(),
        timestamp: new Date().toISOString()
      });

      // Forcer le flush si le buffer est plein
      if (this.core.dbBuffer.length >= this.core.bufferSize) {
        this.flushDatabase();
      }
    } catch (error) {
      logger.error('Erreur logging événement DB audit:', error);
    }
  }

  /**
   * Vider le buffer dans la base de données
   */
  async flushDatabase() {
    if (!this.core.dbEnabled || this.core.dbBuffer.length === 0) return;

    try {
      const eventsToInsert = [...this.core.dbBuffer];
      this.core.dbBuffer = []; // Vider le buffer immédiatement

      // Préparer les événements pour l'insertion
      const dbEvents = eventsToInsert.map(event => this.prepareEventForDB(event));
      
      // Insérer par lots pour éviter les timeouts
      const batchSize = 100;
      for (let i = 0; i < dbEvents.length; i += batchSize) {
        const batch = dbEvents.slice(i, i + batchSize);
        await this.insertBatch(batch);
      }

      logger.info(`Flush DB audit: ${eventsToInsert.length} événements insérés`);
    } catch (error) {
      logger.error('Erreur flush buffer DB audit:', error);
      // Remettre les événements dans le buffer en cas d'erreur
      this.core.dbBuffer.unshift(...this.core.dbBuffer);
    }
  }

  /**
   * Préparer un événement pour la base de données
   */
  prepareEventForDB(event) {
    return {
      id: event.id,
      user_id: event.userId,
      category: event.category,
      action: event.action,
      severity: event.severity,
      ip_address: event.ip || 'unknown',
      user_agent: event.userAgent || 'unknown',
      details: event.details || {},
      suspicious: event.suspicious || false,
      created_at: event.timestamp
    };
  }

  /**
   * Insérer un batch d'événements
   */
  async insertBatch(events) {
    try {
      const { error } = await dbAdmin
        .from('audit_events')
        .insert(events);

      if (error) {
        throw error;
      }
    } catch (error) {
      logger.error('Erreur insertion batch audit:', error);
      throw error;
    }
  }

  /**
   * Rechercher des événements
   */
  async searchEvents(filters = {}) {
    try {
      let query = dbAdmin
        .from('audit_events')
        .select('*');

      // Appliquer les filtres
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }

      if (filters.suspicious !== undefined) {
        query = query.eq('suspicious', filters.suspicious);
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      if (filters.ip) {
        query = query.eq('ip_address', filters.ip);
      }

      // Ordre et pagination
      const limit = filters.limit || 100;
      const offset = filters.offset || 0;

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return {
        events: data || [],
        total: data?.length || 0
      };
    } catch (error) {
      logger.error('Erreur recherche événements audit:', error);
      return { events: [], total: 0 };
    }
  }

  /**
   * Obtenir les statistiques par période
   */
  async getStatsByPeriod(period = '24h') {
    try {
      let startDate;
      const now = new Date();

      switch (period) {
        case '1h':
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      const { data, error } = await dbAdmin
        .from('audit_events')
        .select('category, severity, suspicious')
        .gte('created_at', startDate.toISOString());

      if (error) {
        throw error;
      }

      // Calculer les statistiques
      const stats = {
        total: data?.length || 0,
        byCategory: {},
        bySeverity: {},
        suspicious: 0,
        period: period
      };

      data?.forEach(event => {
        stats.byCategory[event.category] = (stats.byCategory[event.category] || 0) + 1;
        stats.bySeverity[event.severity] = (stats.bySeverity[event.severity] || 0) + 1;
        if (event.suspicious) {
          stats.suspicious++;
        }
      });

      return stats;
    } catch (error) {
      logger.error('Erreur statistiques audit:', error);
      return {
        total: 0,
        byCategory: {},
        bySeverity: {},
        suspicious: 0,
        period: period
      };
    }
  }

  /**
   * Obtenir les événements suspects récents
   */
  async getSuspiciousEvents(limit = 50) {
    try {
      const { data, error } = await dbAdmin
        .from('audit_events')
        .select('*')
        .eq('suspicious', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Erreur événements suspects:', error);
      return [];
    }
  }

  /**
   * Obtenir les activités d'un utilisateur
   */
  async getUserActivity(userId, limit = 100) {
    try {
      const { data, error } = await dbAdmin
        .from('audit_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Erreur activité utilisateur:', error);
      return [];
    }
  }

  /**
   * Exporter les événements au format CSV
   */
  async exportToCSV(filters = {}) {
    try {
      const { events } = await this.searchEvents({ ...filters, limit: 10000 });
      
      if (events.length === 0) {
        return '';
      }

      // En-tête CSV
      const headers = [
        'ID',
        'User ID',
        'Timestamp',
        'Category',
        'Action',
        'Severity',
        'IP Address',
        'User Agent',
        'Suspicious',
        'Details'
      ];

      // Convertir les événements en CSV
      const csvRows = [
        headers.join(','),
        ...events.map(event => [
          event.id,
          event.user_id,
          event.created_at,
          event.category,
          event.action,
          event.severity,
          event.ip_address,
          event.user_agent,
          event.suspicious,
          JSON.stringify(event.details).replace(/"/g, '""')
        ].join(','))
      ];

      return csvRows.join('\n');
    } catch (error) {
      logger.error('Erreur export CSV audit:', error);
      return '';
    }
  }

  /**
   * Nettoyer les anciens événements
   */
  async cleanup(daysToKeep = 90) {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      
      const { data, error } = await dbAdmin
        .from('audit_events')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select('id');

      if (error) {
        throw error;
      }

      const deletedCount = data?.length || 0;
      logger.info(`Nettoyage audit: ${deletedCount} événements supprimés`);
      
      return deletedCount;
    } catch (error) {
      logger.error('Erreur nettoyage audit:', error);
      return 0;
    }
  }
}

export default AuditDatabase;

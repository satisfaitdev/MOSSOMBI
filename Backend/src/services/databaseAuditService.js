/**
 * SERVICE D'AUDIT BASE DE DONNÉES
 * Stockage persistant et recherche avancée des logs d'audit
 */

import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

class DatabaseAuditService {
  constructor() {
    this.batchSize = 100;
    this.flushInterval = 30000; // 30 secondes
    this.eventBuffer = [];
    this.isConnected = false; // État de connexion
    
    // Les tables seront initialisées par le serveur principal
    
    // Flush automatique du buffer
    setInterval(() => this.flushBuffer(), this.flushInterval);
  }

  /**
   * Initialiser les tables d'audit
   */
  async initializeAuditTables() {
    try {
      // Vérifier que les tables existent déjà (créées via MCP)
      const { data, error, count } = await supabaseAdmin
        .from('audit_events')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        this.isConnected = false;
        logger.warn('Tables d\'audit non accessibles (mode développement):', { error: error.message });
        logger.info('💡 En production, utilisez les tables créées via MCP Supabase');
        logger.info('📝 Audit fonctionnera en mode fichiers uniquement');
      } else {
        this.isConnected = true;
        logger.info(`✅ Tables d\'audit connectées - ${count || 0} événements existants`);
      }
    } catch (error) {
      logger.warn('Audit DB en mode fallback (développement):', { error: error.message });
    }
  }

  /**
   * Enregistrer un événement d'audit
   */
  async logEvent(eventData) {
    // Si pas connecté à la DB, ignorer silencieusement (audit fichiers actif)
    if (!this.isConnected) {
      return;
    }

    try {
      const auditEvent = this.formatAuditEvent(eventData);
      
      // Ajouter au buffer
      this.eventBuffer.push(auditEvent);
      
      // Flush si le buffer est plein
      if (this.eventBuffer.length >= this.batchSize) {
        await this.flushBuffer();
      }

      // Flush immédiat pour les événements critiques
      if (auditEvent.severity === 'CRITICAL') {
        await this.flushBuffer();
      }

    } catch (error) {
      logger.error('Erreur enregistrement audit DB:', { error: error.message });
    }
  }

  /**
   * Formater un événement d'audit pour la base de données
   */
  formatAuditEvent(eventData) {
    return {
      event_id: eventData.eventId || this.generateEventId(),
      timestamp: eventData.timestamp || new Date().toISOString(),
      category: eventData.category || 'SYSTEM',
      action: eventData.action || 'unknown',
      severity: eventData.severity || 'LOW',
      description: eventData.description || '',
      
      // Acteur
      user_id: eventData.userId || null,
      session_id: eventData.sessionId || null,
      ip_address: eventData.ip || null,
      user_agent: eventData.userAgent || null,
      actor_type: eventData.actorType || 'user',
      
      // Cible
      resource_type: eventData.resourceType || null,
      resource_id: eventData.resourceId || null,
      resource_name: eventData.resourceName || null,
      
      // Contexte technique
      endpoint: eventData.endpoint || null,
      http_method: eventData.method || null,
      status_code: eventData.statusCode || null,
      response_time: eventData.responseTime || null,
      request_size: eventData.requestSize || null,
      response_size: eventData.responseSize || null,
      
      // Résultat
      success: eventData.success !== false,
      error_code: eventData.errorCode || null,
      error_message: eventData.errorMessage || null,
      
      // Sécurité
      risk_score: eventData.riskScore || 0,
      is_suspicious: eventData.isSuspicious || false,
      security_flags: eventData.securityFlags || [],
      geolocation: eventData.geolocation || null,
      
      // Données métier
      business_data: eventData.businessData || {},
      sensitive_data: eventData.sensitiveData || null,
      
      // Métadonnées
      server_name: process.env.SERVER_NAME || 'mossombi-backend',
      environment: process.env.NODE_ENV || 'development'
    };
  }

  /**
   * Flush du buffer vers la base de données
   */
  async flushBuffer() {
    if (this.eventBuffer.length === 0) return;

    try {
      const events = [...this.eventBuffer];
      this.eventBuffer = [];

      // Insérer en batch
      const { error } = await supabaseAdmin
        .from('audit_events')
        .insert(events);

      if (error) {
        // En développement, ne pas spammer les logs d'erreur
        if (process.env.NODE_ENV !== 'development') {
          logger.error('Erreur insertion audit DB:', { error: error.message });
        }
        // Remettre les événements dans le buffer en cas d'erreur
        this.eventBuffer.unshift(...events);
      } else {
        logger.debug('Audit DB flush réussi', { eventCount: events.length });
      }

    } catch (error) {
      logger.error('Erreur flush audit DB:', { error: error.message });
    }
  }

  /**
   * Rechercher dans les logs d'audit
   */
  async searchAuditLogs(criteria = {}) {
    try {
      let query = supabaseAdmin.from('audit_events').select('*');

      // Filtres de base
      if (criteria.startDate) {
        query = query.gte('timestamp', criteria.startDate);
      }
      
      if (criteria.endDate) {
        query = query.lte('timestamp', criteria.endDate);
      }
      
      if (criteria.category) {
        query = query.eq('category', criteria.category);
      }
      
      if (criteria.severity) {
        query = query.eq('severity', criteria.severity);
      }
      
      if (criteria.userId) {
        query = query.eq('user_id', criteria.userId);
      }
      
      if (criteria.ipAddress) {
        query = query.eq('ip_address', criteria.ipAddress);
      }
      
      if (criteria.action) {
        query = query.ilike('action', `%${criteria.action}%`);
      }
      
      if (criteria.suspicious) {
        query = query.eq('is_suspicious', true);
      }

      // Tri et pagination
      query = query.order('timestamp', { ascending: false });
      
      if (criteria.limit) {
        query = query.limit(criteria.limit);
      }
      
      if (criteria.offset) {
        query = query.range(criteria.offset, criteria.offset + (criteria.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Erreur recherche audit:', { error: error.message });
        return { events: [], total: 0, error: error.message };
      }

      return {
        events: data || [],
        total: data?.length || 0,
        criteria
      };

    } catch (error) {
      logger.error('Erreur recherche audit DB:', { error: error.message });
      return { events: [], total: 0, error: error.message };
    }
  }

  /**
   * Obtenir les statistiques d'audit
   */
  async getAuditStatistics(period = '24h') {
    try {
      const startDate = this.getStartDateForPeriod(period);
      
      // Statistiques par catégorie
      const { data: categoryStats } = await supabaseAdmin
        .from('audit_events')
        .select('category, count(*)')
        .gte('timestamp', startDate)
        .group('category');

      // Statistiques par sévérité
      const { data: severityStats } = await supabaseAdmin
        .from('audit_events')
        .select('severity, count(*)')
        .gte('timestamp', startDate)
        .group('severity');

      // Événements suspects
      const { count: suspiciousCount } = await supabaseAdmin
        .from('audit_events')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', startDate)
        .eq('is_suspicious', true);

      // Top IPs
      const { data: topIPs } = await supabaseAdmin
        .from('audit_events')
        .select('ip_address, count(*)')
        .gte('timestamp', startDate)
        .not('ip_address', 'is', null)
        .group('ip_address')
        .order('count', { ascending: false })
        .limit(10);

      // Top utilisateurs
      const { data: topUsers } = await supabaseAdmin
        .from('audit_events')
        .select('user_id, count(*)')
        .gte('timestamp', startDate)
        .not('user_id', 'is', null)
        .group('user_id')
        .order('count', { ascending: false })
        .limit(10);

      return {
        period,
        startDate,
        categoryStats: categoryStats || [],
        severityStats: severityStats || [],
        suspiciousEvents: suspiciousCount || 0,
        topIPs: topIPs || [],
        topUsers: topUsers || [],
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Erreur stats audit DB:', { error: error.message });
      return { error: error.message };
    }
  }

  /**
   * Générer un rapport d'audit détaillé
   */
  async generateDetailedReport(startDate, endDate) {
    try {
      const stats = await this.getAuditStatistics('custom');
      
      // Événements critiques
      const { data: criticalEvents } = await supabaseAdmin
        .from('audit_events')
        .select('*')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)
        .eq('severity', 'CRITICAL')
        .order('timestamp', { ascending: false })
        .limit(100);

      // Activités suspectes
      const { data: suspiciousEvents } = await supabaseAdmin
        .from('audit_events')
        .select('*')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)
        .eq('is_suspicious', true)
        .order('timestamp', { ascending: false })
        .limit(100);

      // Erreurs fréquentes
      const { data: commonErrors } = await supabaseAdmin
        .from('audit_events')
        .select('error_code, error_message, count(*)')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)
        .not('error_code', 'is', null)
        .group('error_code, error_message')
        .order('count', { ascending: false })
        .limit(20);

      return {
        period: { startDate, endDate },
        statistics: stats,
        criticalEvents: criticalEvents || [],
        suspiciousEvents: suspiciousEvents || [],
        commonErrors: commonErrors || [],
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Erreur rapport audit DB:', { error: error.message });
      return { error: error.message };
    }
  }

  /**
   * Nettoyer les anciens logs d'audit
   */
  async cleanupOldLogs(retentionDays = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const { error } = await supabaseAdmin
        .from('audit_events')
        .delete()
        .lt('timestamp', cutoffDate.toISOString());

      if (error) {
        logger.error('Erreur nettoyage audit DB:', { error: error.message });
      } else {
        logger.info('Nettoyage audit DB réussi', { 
          cutoffDate: cutoffDate.toISOString(),
          retentionDays 
        });
      }

    } catch (error) {
      logger.error('Erreur nettoyage audit DB:', { error: error.message });
    }
  }

  /**
   * Exporter les logs d'audit
   */
  async exportAuditLogs(criteria = {}, format = 'json') {
    try {
      const results = await this.searchAuditLogs({
        ...criteria,
        limit: 10000 // Grande limite pour l'export
      });

      if (format === 'csv') {
        return this.convertToCSV(results.events);
      }

      return results.events;

    } catch (error) {
      logger.error('Erreur export audit DB:', { error: error.message });
      return null;
    }
  }

  /**
   * Convertir en CSV
   */
  convertToCSV(events) {
    if (!events || events.length === 0) return '';

    const headers = Object.keys(events[0]);
    const csvRows = [headers.join(',')];

    for (const event of events) {
      const values = headers.map(header => {
        const value = event[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Obtenir la date de début pour une période
   */
  getStartDateForPeriod(period) {
    const now = new Date();
    
    switch (period) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    }
  }

  /**
   * Générer un ID d'événement unique
   */
  generateEventId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `${timestamp}-${random}`;
  }

  /**
   * Obtenir les métriques de performance de l'audit
   */
  async getAuditPerformanceMetrics() {
    return {
      bufferSize: this.eventBuffer.length,
      batchSize: this.batchSize,
      flushInterval: this.flushInterval,
      lastFlush: new Date().toISOString()
    };
  }
}

// Instance singleton
export const databaseAuditService = new DatabaseAuditService();

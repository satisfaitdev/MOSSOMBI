/**
 * SERVICE DE MONITORING TEMPS RÉEL
 * Surveillance continue des métriques de sécurité et performance
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { logger } from '../utils/logger.js';
import { alertService } from './alertService.js';

class MonitoringService extends EventEmitter {
  constructor() {
    super();
    
    // Métriques en temps réel
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        blocked: 0,
        avgResponseTime: 0
      },
      security: {
        bruteForceAttempts: 0,
        rateLimitViolations: 0,
        blockedIPs: new Set(),
        suspiciousActivities: 0,
        weakPasswordAttempts: 0
      },
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        activeConnections: 0
      },
      audit: {
        eventsLogged: 0,
        criticalEvents: 0,
        lastFlush: Date.now()
      }
    };

    // Historique des métriques (dernières 24h)
    this.metricsHistory = [];
    this.maxHistorySize = 1440; // 1 point par minute pendant 24h

    // Seuils d'alerte
    this.alertThresholds = {
      responseTime: 5000,        // 5 secondes
      errorRate: 0.1,           // 10% d'erreurs
      memoryUsage: 0.95,        // 95% de la mémoire (plus tolérant en dev)
      blockedIPsPerHour: 50,    // 50 IPs bloquées/heure
      bruteForcePerHour: 100    // 100 tentatives/heure
    };

    // Démarrer la surveillance
    this.startMonitoring();
  }

  /**
   * Démarrer la surveillance
   */
  startMonitoring() {
    // Collecter les métriques toutes les minutes
    setInterval(() => this.collectMetrics(), 60 * 1000);
    
    // Vérifier les seuils d'alerte toutes les 5 minutes
    setInterval(() => this.checkAlertThresholds(), 5 * 60 * 1000);
    
    // Nettoyer l'historique toutes les heures
    setInterval(() => this.cleanupHistory(), 60 * 60 * 1000);

    logger.info('Service de monitoring démarré');
  }

  /**
   * Enregistrer une requête
   */
  recordRequest(success, responseTime, blocked = false) {
    this.metrics.requests.total++;
    
    if (blocked) {
      this.metrics.requests.blocked++;
    } else if (success) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }

    // Calculer le temps de réponse moyen
    const currentAvg = this.metrics.requests.avgResponseTime;
    const totalRequests = this.metrics.requests.total;
    this.metrics.requests.avgResponseTime = 
      ((currentAvg * (totalRequests - 1)) + responseTime) / totalRequests;

    // Émettre un événement pour les abonnés
    this.emit('request', {
      success,
      responseTime,
      blocked,
      timestamp: Date.now()
    });
  }

  /**
   * Enregistrer un événement de sécurité
   */
  recordSecurityEvent(type, details = {}) {
    switch (type) {
      case 'brute_force':
        this.metrics.security.bruteForceAttempts++;
        break;
      case 'rate_limit_violation':
        this.metrics.security.rateLimitViolations++;
        break;
      case 'ip_blocked':
        this.metrics.security.blockedIPs.add(details.ip);
        break;
      case 'suspicious_activity':
        this.metrics.security.suspiciousActivities++;
        break;
      case 'weak_password':
        this.metrics.security.weakPasswordAttempts++;
        break;
    }

    this.emit('security_event', {
      type,
      details,
      timestamp: Date.now()
    });
  }

  /**
   * Enregistrer un événement d'audit
   */
  recordAuditEvent(critical = false) {
    this.metrics.audit.eventsLogged++;
    
    if (critical) {
      this.metrics.audit.criticalEvents++;
    }

    this.emit('audit_event', {
      critical,
      timestamp: Date.now()
    });
  }

  /**
   * Collecter les métriques système
   */
  collectMetrics() {
    const now = Date.now();
    
    // Métriques système
    this.metrics.system.uptime = process.uptime();
    this.metrics.system.memoryUsage = process.memoryUsage();
    this.metrics.system.cpuUsage = process.cpuUsage();

    // Snapshot des métriques actuelles
    const snapshot = {
      timestamp: now,
      requests: { ...this.metrics.requests },
      security: {
        ...this.metrics.security,
        blockedIPs: this.metrics.security.blockedIPs.size
      },
      system: { ...this.metrics.system },
      audit: { ...this.metrics.audit }
    };

    // Ajouter à l'historique
    this.metricsHistory.push(snapshot);

    // Limiter la taille de l'historique
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift();
    }

    this.emit('metrics_collected', snapshot);
  }

  /**
   * Vérifier les seuils d'alerte
   */
  async checkAlertThresholds() {
    try {
      const current = this.metrics;
      
      // Vérifier le temps de réponse
      if (current.requests.avgResponseTime > this.alertThresholds.responseTime) {
        await alertService.sendCriticalAlert('HIGH_RESPONSE_TIME',
          `Temps de réponse élevé: ${Math.round(current.requests.avgResponseTime)}ms`, {
            avgResponseTime: current.requests.avgResponseTime,
            threshold: this.alertThresholds.responseTime
          });
      }

      // Vérifier le taux d'erreur
      const errorRate = current.requests.total > 0 ? 
        current.requests.failed / current.requests.total : 0;
      
      if (errorRate > this.alertThresholds.errorRate) {
        await alertService.sendCriticalAlert('HIGH_ERROR_RATE',
          `Taux d'erreur élevé: ${Math.round(errorRate * 100)}%`, {
            errorRate: errorRate * 100,
            threshold: this.alertThresholds.errorRate * 100,
            totalRequests: current.requests.total,
            failedRequests: current.requests.failed
          });
      }

      // Vérifier l'utilisation mémoire
      const memoryUsage = current.system.memoryUsage.heapUsed / current.system.memoryUsage.heapTotal;
      
      if (memoryUsage > this.alertThresholds.memoryUsage) {
        await alertService.sendCriticalAlert('HIGH_MEMORY_USAGE',
          `Utilisation mémoire élevée: ${Math.round(memoryUsage * 100)}%`, {
            memoryUsage: memoryUsage * 100,
            threshold: this.alertThresholds.memoryUsage * 100,
            heapUsed: Math.round(current.system.memoryUsage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(current.system.memoryUsage.heapTotal / 1024 / 1024)
          });
      }

      // Vérifier les IPs bloquées
      if (current.security.blockedIPs.size > this.alertThresholds.blockedIPsPerHour) {
        await alertService.sendCriticalAlert('TOO_MANY_BLOCKED_IPS',
          `Trop d'IPs bloquées: ${current.security.blockedIPs.size}`, {
            blockedIPs: current.security.blockedIPs.size,
            threshold: this.alertThresholds.blockedIPsPerHour
          });
      }

      // Vérifier les tentatives de force brute
      if (current.security.bruteForceAttempts > this.alertThresholds.bruteForcePerHour) {
        await alertService.sendCriticalAlert('TOO_MANY_BRUTE_FORCE',
          `Trop de tentatives de force brute: ${current.security.bruteForceAttempts}`, {
            attempts: current.security.bruteForceAttempts,
            threshold: this.alertThresholds.bruteForcePerHour
          });
      }

    } catch (error) {
      logger.error('Erreur vérification seuils:', { error: error.message });
    }
  }

  /**
   * Nettoyer l'historique ancien
   */
  cleanupHistory() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24h
    this.metricsHistory = this.metricsHistory.filter(m => m.timestamp > cutoff);
    
    logger.debug('Historique des métriques nettoyé', {
      remaining: this.metricsHistory.length
    });
  }

  /**
   * Obtenir les métriques actuelles
   */
  getCurrentMetrics() {
    return {
      ...this.metrics,
      security: {
        ...this.metrics.security,
        blockedIPs: this.metrics.security.blockedIPs.size
      },
      timestamp: Date.now()
    };
  }

  /**
   * Obtenir l'historique des métriques
   */
  getMetricsHistory(hours = 1) {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.metricsHistory.filter(m => m.timestamp > cutoff);
  }

  /**
   * Obtenir les statistiques de performance
   */
  getPerformanceStats() {
    const history = this.getMetricsHistory(1); // Dernière heure
    
    if (history.length === 0) {
      return null;
    }

    const responseTimes = history.map(h => h.requests.avgResponseTime).filter(Boolean);
    const errorRates = history.map(h => 
      h.requests.total > 0 ? h.requests.failed / h.requests.total : 0
    );

    return {
      avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      maxResponseTime: Math.max(...responseTimes),
      minResponseTime: Math.min(...responseTimes),
      avgErrorRate: errorRates.reduce((a, b) => a + b, 0) / errorRates.length,
      maxErrorRate: Math.max(...errorRates),
      totalRequests: history[history.length - 1]?.requests.total || 0,
      period: '1 hour'
    };
  }

  /**
   * Obtenir le rapport de sécurité
   */
  getSecurityReport() {
    const history = this.getMetricsHistory(24); // Dernières 24h
    
    if (history.length === 0) {
      return null;
    }

    const latest = history[history.length - 1];
    const oldest = history[0];

    return {
      bruteForceAttempts: latest.security.bruteForceAttempts - (oldest.security.bruteForceAttempts || 0),
      rateLimitViolations: latest.security.rateLimitViolations - (oldest.security.rateLimitViolations || 0),
      blockedIPs: latest.security.blockedIPs,
      suspiciousActivities: latest.security.suspiciousActivities - (oldest.security.suspiciousActivities || 0),
      weakPasswordAttempts: latest.security.weakPasswordAttempts - (oldest.security.weakPasswordAttempts || 0),
      period: '24 hours'
    };
  }

  /**
   * Générer un rapport de santé système
   */
  getHealthReport() {
    const current = this.getCurrentMetrics();
    const performance = this.getPerformanceStats();
    const security = this.getSecurityReport();

    return {
      status: this.calculateHealthStatus(current, performance, security),
      timestamp: Date.now(),
      uptime: current.system.uptime,
      metrics: current,
      performance,
      security,
      alerts: {
        responseTime: current.requests.avgResponseTime > this.alertThresholds.responseTime,
        errorRate: (current.requests.failed / current.requests.total) > this.alertThresholds.errorRate,
        memoryUsage: (current.system.memoryUsage.heapUsed / current.system.memoryUsage.heapTotal) > this.alertThresholds.memoryUsage
      }
    };
  }

  /**
   * Calculer le statut de santé global
   */
  calculateHealthStatus(current, performance, security) {
    let score = 100;

    // Pénalités basées sur les métriques
    if (current.requests.avgResponseTime > this.alertThresholds.responseTime) score -= 20;
    if ((current.requests.failed / current.requests.total) > this.alertThresholds.errorRate) score -= 30;
    if ((current.system.memoryUsage.heapUsed / current.system.memoryUsage.heapTotal) > this.alertThresholds.memoryUsage) score -= 25;
    if (current.security.blockedIPs > this.alertThresholds.blockedIPsPerHour) score -= 15;
    if (current.security.bruteForceAttempts > this.alertThresholds.bruteForcePerHour) score -= 10;

    if (score >= 90) return 'EXCELLENT';
    if (score >= 75) return 'GOOD';
    if (score >= 60) return 'WARNING';
    if (score >= 40) return 'CRITICAL';
    return 'EMERGENCY';
  }

  /**
   * Reset des métriques (pour les tests ou maintenance)
   */
  resetMetrics() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        blocked: 0,
        avgResponseTime: 0
      },
      security: {
        bruteForceAttempts: 0,
        rateLimitViolations: 0,
        blockedIPs: new Set(),
        suspiciousActivities: 0,
        weakPasswordAttempts: 0
      },
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        activeConnections: 0
      },
      audit: {
        eventsLogged: 0,
        criticalEvents: 0,
        lastFlush: Date.now()
      }
    };

    this.metricsHistory = [];
    logger.info('Métriques de monitoring réinitialisées');
  }
}

// Instance singleton
export const monitoringService = new MonitoringService();

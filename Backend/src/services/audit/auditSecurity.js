/**
 * SÉCURITÉ ET DÉTECTION D'ANOMALIES
 * Analyse des événements suspects et alertes
 */

import { logger } from '../../utils/logger.js';

class AuditSecurity {
  constructor(core) {
    this.core = core;
    
    // Configuration de la détection d'anomalies
    this.securityConfig = {
      maxFailedLogins: 5,           // Max tentatives de connexion échouées
      maxPasswordChanges: 3,        // Max changements de mot de passe par heure
      maxAdminActions: 50,          // Max actions admin par heure
      suspiciousCountries: ['CN', 'RU', 'KP'], // Pays suspects
      maxConcurrentSessions: 10,     // Max sessions simultanées
      rapidActionsThreshold: 100,   // Max actions par minute
      dataAccessThreshold: 1000     // Max accès aux données par heure
    };

    // Suivi des patterns suspects
    this.suspiciousPatterns = new Map();
    this.alertThresholds = new Map();
  }

  /**
   * Analyser un événement pour détecter des anomalies
   */
  analyzeEvent(eventData) {
    const anomalies = [];
    
    // Analyser les différents types de menaces
    anomalies.push(...this.detectBruteForce(eventData));
    anomalies.push(...this.detectPrivilegeEscalation(eventData));
    anomalies.push(...this.detectDataExfiltration(eventData));
    anomalies.push(...this.detectUnusualAccess(eventData));
    anomalies.push(...this.detectRapidActions(eventData));
    anomalies.push(...this.detectGeographicAnomalies(eventData));

    // Marquer comme suspect si des anomalies sont détectées
    if (anomalies.length > 0) {
      eventData.suspicious = true;
      eventData.anomalies = anomalies;
      
      // Générer une alerte si nécessaire
      this.generateSecurityAlert(eventData, anomalies);
    }

    return anomalies;
  }

  /**
   * Détecter les tentatives de force brute
   */
  detectBruteForce(eventData) {
    const anomalies = [];
    
    if (eventData.category === this.core.eventCategories.AUTHENTICATION && 
        eventData.action.includes('failed')) {
      
      const key = `brute_force_${eventData.userId}_${eventData.ip}`;
      const count = this.suspiciousPatterns.get(key) || 0;
      this.suspiciousPatterns.set(key, count + 1);
      
      if (count + 1 >= this.securityConfig.maxFailedLogins) {
        anomalies.push({
          type: 'BRUTE_FORCE',
          severity: 'HIGH',
          description: `Tentatives de connexion répétées (${count + 1} échecs)`,
          userId: eventData.userId,
          ip: eventData.ip
        });
      }
    }
    
    return anomalies;
  }

  /**
   * Détecter l'escalade de privilèges
   */
  detectPrivilegeEscalation(eventData) {
    const anomalies = [];
    
    if (eventData.category === this.core.eventCategories.ADMIN) {
      const key = `admin_actions_${eventData.userId}`;
      const count = this.suspiciousPatterns.get(key) || 0;
      this.suspiciousPatterns.set(key, count + 1);
      
      if (count + 1 >= this.securityConfig.maxAdminActions) {
        anomalies.push({
          type: 'PRIVILEGE_ESCALATION',
          severity: 'CRITICAL',
          description: `Volume anormal d'actions administratives (${count + 1} actions)`,
          userId: eventData.userId
        });
      }
    }
    
    return anomalies;
  }

  /**
   * Détecter l'exfiltration de données
   */
  detectDataExfiltration(eventData) {
    const anomalies = [];
    
    if (eventData.category === this.core.eventCategories.DATA_ACCESS) {
      const key = `data_access_${eventData.userId}`;
      const count = this.suspiciousPatterns.get(key) || 0;
      this.suspiciousPatterns.set(key, count + 1);
      
      if (count + 1 >= this.securityConfig.dataAccessThreshold) {
        anomalies.push({
          type: 'DATA_EXFILTRATION',
          severity: 'HIGH',
          description: `Volume anormal d'accès aux données (${count + 1} accès)`,
          userId: eventData.userId
        });
      }
    }
    
    return anomalies;
  }

  /**
   * Détecter les accès inhabituels
   */
  detectUnusualAccess(eventData) {
    const anomalies = [];
    
    // Vérifier les heures inhabituelles
    const hour = new Date(eventData.timestamp).getHours();
    if (hour < 6 || hour > 22) {
      anomalies.push({
        type: 'UNUSUAL_TIME',
        severity: 'MEDIUM',
        description: `Accès à une heure inhabituelle (${hour}h)`,
        userId: eventData.userId
      });
    }
    
    // Vérifier les nouveaux appareils
    if (eventData.details.newDevice) {
      anomalies.push({
        type: 'NEW_DEVICE',
        severity: 'MEDIUM',
        description: 'Connexion depuis un nouvel appareil',
        userId: eventData.userId,
        device: eventData.details.deviceInfo
      });
    }
    
    return anomalies;
  }

  /**
   * Détecter les actions rapides (bots)
   */
  detectRapidActions(eventData) {
    const anomalies = [];
    
    const key = `rapid_actions_${eventData.userId}`;
    const now = Date.now();
    const userActions = this.suspiciousPatterns.get(key) || [];
    
    // Ajouter l'action actuelle
    userActions.push(now);
    
    // Nettoyer les anciennes actions (plus d'une minute)
    const recentActions = userActions.filter(time => now - time < 60000);
    this.suspiciousPatterns.set(key, recentActions);
    
    if (recentActions.length >= this.securityConfig.rapidActionsThreshold) {
      anomalies.push({
        type: 'RAPID_ACTIONS',
        severity: 'HIGH',
        description: `Volume anormal d'actions (${recentActions.length} actions/min)`,
        userId: eventData.userId
      });
    }
    
    return anomalies;
  }

  /**
   * Détecter les anomalies géographiques
   */
  detectGeographicAnomalies(eventData) {
    const anomalies = [];
    
    if (eventData.details.country) {
      // Vérifier si le pays est dans la liste des pays suspects
      if (this.securityConfig.suspiciousCountries.includes(eventData.details.country)) {
        anomalies.push({
          type: 'SUSPICIOUS_LOCATION',
          severity: 'HIGH',
          description: `Accès depuis un pays suspect (${eventData.details.country})`,
          userId: eventData.userId,
          country: eventData.details.country
        });
      }
      
      // Vérifier les connexions simultanées depuis des pays différents
      const key = `geo_${eventData.userId}`;
      const countries = this.suspiciousPatterns.get(key) || new Set();
      countries.add(eventData.details.country);
      this.suspiciousPatterns.set(key, countries);
      
      if (countries.size > 3) {
        anomalies.push({
          type: 'MULTIPLE_LOCATIONS',
          severity: 'HIGH',
          description: `Connexions simultanées depuis plusieurs pays (${countries.size} pays)`,
          userId: eventData.userId,
          countries: Array.from(countries)
        });
      }
    }
    
    return anomalies;
  }

  /**
   * Générer une alerte de sécurité
   */
  generateSecurityAlert(eventData, anomalies) {
    try {
      // Déterminer le niveau de sévérité maximal
      const maxSeverity = anomalies.reduce((max, anomaly) => {
        const severityLevels = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
        return Math.max(max, severityLevels[anomaly.severity] || 0);
      }, 0);

      const severityNames = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      const severity = severityNames[maxSeverity - 1] || 'MEDIUM';

      // Créer l'alerte
      const alert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'SECURITY_ANOMALY',
        severity: severity,
        userId: eventData.userId,
        ip: eventData.ip,
        timestamp: eventData.timestamp,
        anomalies: anomalies,
        description: `Anomalies de sécurité détectées: ${anomalies.map(a => a.type).join(', ')}`,
        status: 'OPEN'
      };

      // Logger l'alerte
      logger.warn('Alerte de sécurité générée', {
        alertId: alert.id,
        userId: alert.userId,
        severity: alert.severity,
        anomalies: anomalies.length
      });

      // Envoyer une notification si critique
      if (severity === 'CRITICAL') {
        this.sendCriticalAlert(alert);
      }

      return alert;
    } catch (error) {
      logger.error('Erreur génération alerte sécurité:', error);
      return null;
    }
  }

  /**
   * Envoyer une alerte critique
   */
  sendCriticalAlert(alert) {
    try {
      // Dans un système réel, on enverrait:
      // - Email à l'équipe de sécurité
      // - SMS aux administrateurs
      // - Notification Slack/Discord
      // - Intégration avec un SIEM
      
      logger.error('ALERTE CRITIQUE DE SÉCURITÉ', {
        alertId: alert.id,
        userId: alert.userId,
        ip: alert.ip,
        anomalies: alert.anomalies,
        timestamp: alert.timestamp
      });

      // TODO: Implémenter les notifications réelles
    } catch (error) {
      logger.error('Erreur envoi alerte critique:', error);
    }
  }

  /**
   * Obtenir les patterns suspects actuels
   */
  getSuspiciousPatterns() {
    const patterns = {};
    
    for (const [key, value] of this.suspiciousPatterns.entries()) {
      if (typeof value === 'number' && value > 1) {
        patterns[key] = value;
      } else if (Array.isArray(value) && value.length > 10) {
        patterns[key] = value.length;
      } else if (value instanceof Set && value.size > 1) {
        patterns[key] = Array.from(value);
      }
    }
    
    return patterns;
  }

  /**
   * Nettoyer les anciens patterns
   */
  cleanupPatterns() {
    const now = Date.now();
    const patternsToDelete = [];
    
    for (const [key, value] of this.suspiciousPatterns.entries()) {
      if (typeof value === 'number' && value <= 1) {
        patternsToDelete.push(key);
      } else if (Array.isArray(value)) {
        // Garder seulement les actions récentes (dernière heure)
        const recent = value.filter(time => now - time < 3600000);
        if (recent.length === 0) {
          patternsToDelete.push(key);
        } else {
          this.suspiciousPatterns.set(key, recent);
        }
      }
    }
    
    // Supprimer les patterns expirés
    patternsToDelete.forEach(key => this.suspiciousPatterns.delete(key));
  }

  /**
   * Obtenir le score de risque d'un utilisateur
   */
  getUserRiskScore(userId) {
    let score = 0;
    
    // Analyser les patterns de l'utilisateur
    for (const [key, value] of this.suspiciousPatterns.entries()) {
      if (key.includes(userId)) {
        if (typeof value === 'number') {
          score += value * 10;
        } else if (Array.isArray(value)) {
          score += value.length * 5;
        }
      }
    }
    
    // Normaliser le score (0-100)
    return Math.min(100, Math.round(score / 10));
  }
}

export default AuditSecurity;

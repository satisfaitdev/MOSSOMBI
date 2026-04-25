/**
 * SERVICE D'ALERTES SÉCURITÉ
 * Notifications email/SMS pour les événements critiques
 */

import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { logger } from '../utils/logger.js';

class AlertService {
  constructor() {
    // Configuration des alertes (AVANT l'initialisation des services)
    this.alertConfig = {
      email: {
        enabled: process.env.EMAIL_ALERTS_ENABLED === 'true',
        adminEmails: (process.env.ADMIN_EMAILS || '').split(',').filter(Boolean),
        from: process.env.EMAIL_FROM || 'security@mossombi.com'
      },
      sms: {
        enabled: process.env.SMS_ALERTS_ENABLED === 'true',
        adminPhones: (process.env.ADMIN_PHONES || '').split(',').filter(Boolean),
        from: process.env.TWILIO_PHONE || '+1234567890'
      },
      webhook: {
        enabled: process.env.WEBHOOK_ALERTS_ENABLED === 'true',
        slackUrl: process.env.SLACK_WEBHOOK_URL,
        teamsUrl: process.env.TEAMS_WEBHOOK_URL
      }
    };

    // Configuration email
    this.emailTransporter = null;
    
    // Configuration SMS
    this.twilioClient = null;

    // Seuils d'alerte
    this.thresholds = {
      rateLimitViolations: 50,      // 50 violations/heure
      failedLogins: 20,             // 20 échecs/heure
      blockedIPs: 10,               // 10 IPs bloquées/heure
      suspiciousActivity: 5,        // 5 activités suspectes/heure
      systemErrors: 100             // 100 erreurs/heure
    };

    // Compteurs d'alertes (éviter le spam)
    this.alertCounts = new Map();
    this.resetCounters();
    
    // Reset des compteurs toutes les heures
    const interval = setInterval(() => this.resetCounters(), 60 * 60 * 1000);
    if (process.env.NODE_ENV === 'test') {
      interval.unref();
    }

    // Initialiser les services APRÈS la configuration
    this.initializeEmail();
    this.initializeSMS();
  }

  /**
   * Initialiser le service email
   */
  initializeEmail() {
    if (!this.alertConfig.email.enabled) return;

    try {
      this.emailTransporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      logger.info('Service email initialisé');
    } catch (error) {
      logger.error('Erreur initialisation email:', { error: error.message });
    }
  }

  /**
   * Initialiser le service SMS
   */
  initializeSMS() {
    if (!this.alertConfig.sms.enabled) return;

    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      
      if (accountSid && authToken) {
        this.twilioClient = twilio(accountSid, authToken);
        logger.info('Service SMS initialisé');
      }
    } catch (error) {
      logger.error('Erreur initialisation SMS:', { error: error.message });
    }
  }

  /**
   * Envoyer une alerte critique
   */
  async sendCriticalAlert(type, message, details = {}) {
    const alertKey = `${type}_${Date.now()}`;
    
    try {
      // Éviter le spam d'alertes
      if (this.shouldThrottleAlert(type)) {
        logger.warn('Alerte throttlée:', { type, message });
        return;
      }

      const alert = {
        type,
        message,
        details,
        timestamp: new Date().toISOString(),
        severity: 'CRITICAL',
        server: process.env.SERVER_NAME || 'Mossombi-Backend'
      };

      // Envoyer par tous les canaux disponibles
      await Promise.allSettled([
        this.sendEmailAlert(alert),
        this.sendSMSAlert(alert),
        this.sendWebhookAlert(alert)
      ]);

      this.incrementAlertCount(type);
      
      logger.error('Alerte critique envoyée', { type, message });
      
    } catch (error) {
      logger.error('Erreur envoi alerte critique:', { error: error.message });
    }
  }

  /**
   * Envoyer alerte par email
   */
  async sendEmailAlert(alert) {
    if (!this.alertConfig.email.enabled || !this.emailTransporter) return;

    try {
      const subject = `🚨 ALERTE SÉCURITÉ MOSSOMBI - ${alert.type}`;
      const html = this.generateEmailHTML(alert);

      for (const email of this.alertConfig.email.adminEmails) {
        await this.emailTransporter.sendMail({
          from: this.alertConfig.email.from,
          to: email,
          subject,
          html
        });
      }

      logger.info('Alerte email envoyée', { 
        recipients: this.alertConfig.email.adminEmails.length 
      });
    } catch (error) {
      logger.error('Erreur envoi email:', { error: error.message });
    }
  }

  /**
   * Envoyer alerte par SMS
   */
  async sendSMSAlert(alert) {
    if (!this.alertConfig.sms.enabled || !this.twilioClient) return;

    try {
      const message = this.generateSMSMessage(alert);

      for (const phone of this.alertConfig.sms.adminPhones) {
        await this.twilioClient.messages.create({
          body: message,
          from: this.alertConfig.sms.from,
          to: phone
        });
      }

      logger.info('Alerte SMS envoyée', { 
        recipients: this.alertConfig.sms.adminPhones.length 
      });
    } catch (error) {
      logger.error('Erreur envoi SMS:', { error: error.message });
    }
  }

  /**
   * Envoyer alerte via webhook
   */
  async sendWebhookAlert(alert) {
    if (!this.alertConfig.webhook.enabled) return;

    try {
      const payload = this.generateWebhookPayload(alert);

      const promises = [];
      
      if (this.alertConfig.webhook.slackUrl) {
        promises.push(this.sendSlackAlert(payload));
      }
      
      if (this.alertConfig.webhook.teamsUrl) {
        promises.push(this.sendTeamsAlert(payload));
      }

      await Promise.allSettled(promises);
      
    } catch (error) {
      logger.error('Erreur envoi webhook:', { error: error.message });
    }
  }

  /**
   * Envoyer alerte Slack
   */
  async sendSlackAlert(payload) {
    try {
      const response = await fetch(this.alertConfig.webhook.slackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 *ALERTE SÉCURITÉ MOSSOMBI*`,
          attachments: [{
            color: 'danger',
            fields: [
              { title: 'Type', value: payload.type, short: true },
              { title: 'Serveur', value: payload.server, short: true },
              { title: 'Message', value: payload.message, short: false },
              { title: 'Timestamp', value: payload.timestamp, short: true }
            ]
          }]
        })
      });

      if (response.ok) {
        logger.info('Alerte Slack envoyée');
      }
    } catch (error) {
      logger.error('Erreur Slack:', { error: error.message });
    }
  }

  /**
   * Envoyer alerte Teams
   */
  async sendTeamsAlert(payload) {
    try {
      const response = await fetch(this.alertConfig.webhook.teamsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "@type": "MessageCard",
          "@context": "http://schema.org/extensions",
          "themeColor": "FF0000",
          "summary": "Alerte Sécurité Mossombi",
          "sections": [{
            "activityTitle": "🚨 ALERTE SÉCURITÉ MOSSOMBI",
            "activitySubtitle": payload.type,
            "facts": [
              { "name": "Serveur", "value": payload.server },
              { "name": "Message", "value": payload.message },
              { "name": "Timestamp", "value": payload.timestamp }
            ]
          }]
        })
      });

      if (response.ok) {
        logger.info('Alerte Teams envoyée');
      }
    } catch (error) {
      logger.error('Erreur Teams:', { error: error.message });
    }
  }

  /**
   * Générer HTML pour email
   */
  generateEmailHTML(alert) {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">🚨 ALERTE SÉCURITÉ MOSSOMBI</h1>
            </div>
            <div style="padding: 30px;">
              <h2 style="color: #dc3545; margin-top: 0;">${alert.type}</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                <strong>Message:</strong> ${alert.message}
              </p>
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <p><strong>Serveur:</strong> ${alert.server}</p>
                <p><strong>Timestamp:</strong> ${alert.timestamp}</p>
                <p><strong>Sévérité:</strong> <span style="color: #dc3545; font-weight: bold;">${alert.severity}</span></p>
              </div>
              ${alert.details && Object.keys(alert.details).length > 0 ? `
                <h3>Détails:</h3>
                <pre style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 12px;">
${JSON.stringify(alert.details, null, 2)}
                </pre>
              ` : ''}
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 12px;">
                <p>Cette alerte a été générée automatiquement par le système de sécurité Mossombi.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Générer message SMS
   */
  generateSMSMessage(alert) {
    return `🚨 ALERTE MOSSOMBI\n${alert.type}\n${alert.message}\n${alert.timestamp}`;
  }

  /**
   * Générer payload webhook
   */
  generateWebhookPayload(alert) {
    return {
      type: alert.type,
      message: alert.message,
      server: alert.server,
      timestamp: alert.timestamp,
      severity: alert.severity,
      details: alert.details
    };
  }

  /**
   * Vérifier si l'alerte doit être throttlée
   */
  shouldThrottleAlert(type) {
    const count = this.alertCounts.get(type) || 0;
    const threshold = this.thresholds[type] || 10;
    
    return count >= threshold;
  }

  /**
   * Incrémenter le compteur d'alertes
   */
  incrementAlertCount(type) {
    const current = this.alertCounts.get(type) || 0;
    this.alertCounts.set(type, current + 1);
  }

  /**
   * Reset des compteurs
   */
  resetCounters() {
    this.alertCounts.clear();
    logger.debug('Compteurs d\'alertes réinitialisés');
  }

  /**
   * Alertes spécialisées
   */
  async alertBruteForceAttack(ip, attempts, target) {
    await this.sendCriticalAlert('BRUTE_FORCE_ATTACK', 
      `Attaque par force brute détectée depuis ${ip}`, {
        ip,
        attempts,
        target,
        action: 'IP bloquée automatiquement'
      });
  }

  async alertRateLimitExceeded(ip, endpoint, attempts) {
    await this.sendCriticalAlert('RATE_LIMIT_EXCEEDED',
      `Limite de taux dépassée pour ${ip} sur ${endpoint}`, {
        ip,
        endpoint,
        attempts
      });
  }

  async alertSuspiciousActivity(userId, activity, riskScore) {
    await this.sendCriticalAlert('SUSPICIOUS_ACTIVITY',
      `Activité suspecte détectée pour l'utilisateur ${userId}`, {
        userId,
        activity,
        riskScore
      });
  }

  async alertSystemError(error, context) {
    await this.sendCriticalAlert('SYSTEM_ERROR',
      `Erreur système critique: ${error.message}`, {
        error: error.stack,
        context
      });
  }

  /**
   * Test des alertes
   */
  async testAlerts() {
    logger.info('Test des alertes en cours...');
    
    await this.sendCriticalAlert('TEST_ALERT',
      'Test du système d\'alertes Mossombi', {
        test: true,
        timestamp: new Date().toISOString()
      });
  }

  /**
   * Obtenir les statistiques des alertes
   */
  getAlertStats() {
    return {
      emailEnabled: this.alertConfig.email.enabled,
      smsEnabled: this.alertConfig.sms.enabled,
      webhookEnabled: this.alertConfig.webhook.enabled,
      adminEmails: this.alertConfig.email.adminEmails.length,
      adminPhones: this.alertConfig.sms.adminPhones.length,
      currentCounts: Object.fromEntries(this.alertCounts),
      thresholds: this.thresholds
    };
  }
}

// Instance singleton
export const alertService = new AlertService();

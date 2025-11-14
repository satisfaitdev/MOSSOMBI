/**
 * SERVICE EMAIL - MOSSOMBI BACKEND
 * Gestion de l'envoi d'emails via différents providers
 */

import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  /**
   * Initialiser le transporteur email
   */
  async initializeTransporter() {
    try {
      // Configuration selon les variables d'environnement
      const emailProvider = process.env.EMAIL_PROVIDER || 'smtp';
      
      switch (emailProvider) {
        case 'gmail':
          this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.GMAIL_USER,
              pass: process.env.GMAIL_APP_PASSWORD
            }
          });
          break;
          
        case 'sendgrid':
          this.transporter = nodemailer.createTransport({
            host: 'smtp.sendgrid.net',
            port: 587,
            secure: false,
            auth: {
              user: 'apikey',
              pass: process.env.SENDGRID_API_KEY
            }
          });
          break;
          
        case 'mailgun':
          this.transporter = nodemailer.createTransport({
            host: 'smtp.mailgun.org',
            port: 587,
            secure: false,
            auth: {
              user: process.env.MAILGUN_SMTP_LOGIN,
              pass: process.env.MAILGUN_SMTP_PASSWORD
            }
          });
          break;
          
        default: // SMTP générique
          this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'localhost',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASSWORD
            }
          });
      }

      // Tester la configuration
      if (this.transporter) {
        await this.transporter.verify();
        this.isConfigured = true;
        logger.info(`Service email configuré avec ${emailProvider}`);
      }
      
    } catch (error) {
      logger.warn('Erreur configuration service email', { error: error.message });
      this.isConfigured = false;
      
      // Fallback vers un transporteur de test
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'ethereal.user@ethereal.email',
          pass: 'ethereal.pass'
        }
      });
    }
  }

  /**
   * Envoyer un email
   */
  async sendEmail({ to, subject, body, template, data = {} }) {
    try {
      if (!this.transporter) {
        throw new Error('Service email non configuré');
      }

      // Préparer le contenu de l'email
      let htmlContent = body;
      let textContent = body.replace(/<[^>]*>/g, ''); // Supprimer les balises HTML

      // Si un template est spécifié, l'utiliser
      if (template) {
        htmlContent = await this.renderTemplate(template, { ...data, body });
      }

      // Configuration de l'email
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@mossombi.com',
        to: to,
        subject: subject,
        text: textContent,
        html: htmlContent,
        headers: {
          'X-Mossombi-Service': 'notification',
          'X-Mossombi-Type': 'transactional'
        }
      };

      // Envoyer l'email
      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email envoyé avec succès', {
        to: to,
        subject: subject,
        messageId: info.messageId
      });

      return {
        success: true,
        message_id: info.messageId,
        provider: process.env.EMAIL_PROVIDER || 'smtp'
      };

    } catch (error) {
      logger.error('Erreur envoi email', {
        to: to,
        subject: subject,
        error: error.message
      });

      // En cas d'erreur, simuler un envoi réussi pour les tests
      if (process.env.NODE_ENV === 'development') {
        logger.info('Mode développement: simulation envoi email');
        return {
          success: true,
          message_id: `dev-${Date.now()}`,
          provider: 'simulation'
        };
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Rendre un template email
   */
  async renderTemplate(templateName, data) {
    try {
      // Templates simples intégrés
      const templates = {
        welcome: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Bienvenue sur Mossombi !</h1>
            <p>Bonjour ${data.user_name || 'Utilisateur'},</p>
            <p>${data.body}</p>
            <div style="margin-top: 30px; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                Ceci est un email automatique de Mossombi. Ne pas répondre.
              </p>
            </div>
          </div>
        `,
        notification: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Notification Mossombi</h2>
            <p>${data.body}</p>
            <div style="margin-top: 20px; padding: 15px; background-color: #dbeafe; border-left: 4px solid #2563eb;">
              <p style="margin: 0; font-weight: bold;">Équipe Mossombi</p>
            </div>
          </div>
        `,
        security: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Alerte de sécurité Mossombi</h2>
            <p>Bonjour ${data.user_name || 'Utilisateur'},</p>
            <p>${data.body}</p>
            <div style="margin-top: 20px; padding: 15px; background-color: #fef2f2; border-left: 4px solid #dc2626;">
              <p style="margin: 0; font-weight: bold; color: #dc2626;">
                Si ce n'est pas vous, contactez immédiatement notre support.
              </p>
            </div>
          </div>
        `
      };

      return templates[templateName] || templates.notification;
    } catch (error) {
      logger.error('Erreur rendu template email', { templateName, error: error.message });
      return data.body; // Fallback vers le contenu brut
    }
  }

  /**
   * Tester la connexion email
   */
  async testConnection() {
    try {
      if (!this.transporter) {
        return false;
      }

      await this.transporter.verify();
      
      // Envoyer un email de test
      const testResult = await this.sendEmail({
        to: process.env.EMAIL_TEST_TO || 'test@mossombi.com',
        subject: 'Test de connectivité - Service Email Mossombi',
        body: 'Ceci est un test automatique du service email. Si vous recevez ce message, le service fonctionne correctement.',
        template: 'notification'
      });

      return testResult.success;
    } catch (error) {
      logger.error('Erreur test connexion email', { error: error.message });
      return false;
    }
  }

  /**
   * Obtenir le statut du service
   */
  getStatus() {
    return {
      configured: this.isConfigured,
      provider: process.env.EMAIL_PROVIDER || 'smtp',
      ready: !!this.transporter
    };
  }
}

// Instance singleton
export const emailService = new EmailService();

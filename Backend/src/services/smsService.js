/**
 * SERVICE SMS - MOSSOMBI BACKEND
 * Gestion de l'envoi de SMS via différents providers
 */

import twilio from 'twilio';
import { logger } from '../utils/logger.js';

class SMSService {
  constructor() {
    this.client = null;
    this.isConfigured = false;
    this.provider = process.env.SMS_PROVIDER || 'local-gsm';
    this.localSmsUrl = process.env.SMS_LOCAL_URL || 'http://localhost:8080';
    this.localApiKey = process.env.SMS_LOCAL_API_KEY || 'mossombi_sms_secret_key_2024';
    this.initializeClient();
  }

  /**
   * Initialiser le client SMS
   */
  async initializeClient() {
    try {
      switch (this.provider) {
        case 'local-gsm':
          // Tester la connexion au serveur SMS local
          try {
            const response = await fetch(`${this.localSmsUrl}/health`);
            if (response.ok) {
              this.isConfigured = true;
              logger.info('Service SMS local configuré et accessible');
            } else {
              throw new Error('Serveur SMS local non accessible');
            }
          } catch (error) {
            logger.warn('Serveur SMS local non disponible, mode simulation activé');
            this.isConfigured = false;
          }
          break;
          
        case 'twilio':
          if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            this.client = twilio(
              process.env.TWILIO_ACCOUNT_SID,
              process.env.TWILIO_AUTH_TOKEN
            );
            this.isConfigured = true;
            logger.info('Service SMS configuré avec Twilio');
          }
          break;
          
        case 'aws-sns':
          // TODO: Implémenter AWS SNS
          logger.warn('AWS SNS pas encore implémenté');
          break;
          
        case 'messagebird':
          // TODO: Implémenter MessageBird
          logger.warn('MessageBird pas encore implémenté');
          break;
          
        default:
          logger.warn(`Provider SMS non supporté: ${this.provider}`);
      }

      if (!this.isConfigured) {
        logger.warn('Service SMS non configuré - mode simulation activé');
      }
      
    } catch (error) {
      logger.error('Erreur configuration service SMS', { error: error.message });
      this.isConfigured = false;
    }
  }

  /**
   * Envoyer un SMS
   */
  async sendSMS({ to, message, type = 'transactional' }) {
    try {
      // Validation du numéro
      if (!to.match(/^\+[1-9]\d{1,14}$/)) {
        throw new Error('Numéro de téléphone invalide (format international requis)');
      }

      // Validation du message
      if (!message || message.length > 1600) {
        throw new Error('Message invalide (max 1600 caractères)');
      }

      let result;

      if (this.isConfigured) {
        // Envoi réel selon le provider
        switch (this.provider) {
          case 'local-gsm':
            result = await this.sendViaLocalGSM(to, message, type);
            break;
          case 'twilio':
            result = await this.sendViaTwilio(to, message, type);
            break;
          default:
            throw new Error(`Provider non supporté: ${this.provider}`);
        }
      } else {
        // Mode simulation
        result = await this.simulateSMS(to, message, type);
      }

      logger.info('SMS envoyé avec succès', {
        to: to,
        type: type,
        messageId: result.message_id,
        provider: result.provider
      });

      return result;

    } catch (error) {
      logger.error('Erreur envoi SMS', {
        to: to,
        type: type,
        error: error.message
      });

      // En mode développement, simuler un succès
      if (process.env.NODE_ENV === 'development') {
        return await this.simulateSMS(to, message, type);
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Envoyer via le serveur SMS local (Gammu)
   */
  async sendViaLocalGSM(to, message, type) {
    try {
      const response = await fetch(`${this.localSmsUrl}/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.localApiKey
        },
        body: JSON.stringify({
          to: to,
          message: message,
          priority: type === 'otp' ? 'high' : 'normal'
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erreur serveur SMS local');
      }

      return {
        success: true,
        message_id: result.data.id,
        provider: 'local-gsm',
        status: 'queued',
        cost: '0.001', // Coût très bas avec SIM locale
        currency: 'USD',
        estimated_delivery: result.data.estimated_send_time
      };
    } catch (error) {
      throw new Error(`Erreur serveur SMS local: ${error.message}`);
    }
  }

  /**
   * Envoyer via Twilio
   */
  async sendViaTwilio(to, message, type) {
    try {
      const twilioMessage = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to,
        // Ajouter des métadonnées selon le type
        ...(type === 'marketing' && {
          messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID
        })
      });

      return {
        success: true,
        message_id: twilioMessage.sid,
        provider: 'twilio',
        status: twilioMessage.status,
        cost: twilioMessage.price || '0.00',
        currency: twilioMessage.priceUnit || 'USD'
      };
    } catch (error) {
      throw new Error(`Erreur Twilio: ${error.message}`);
    }
  }

  /**
   * Simuler l'envoi d'un SMS
   */
  async simulateSMS(to, message, type) {
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Simuler un taux de succès de 95%
    const success = Math.random() > 0.05;

    if (!success) {
      throw new Error('Simulation: Échec aléatoire de l\'envoi SMS');
    }

    logger.info('SMS simulé avec succès', { to, type });

    return {
      success: true,
      message_id: `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      provider: 'simulation',
      status: 'delivered',
      cost: '0.00',
      currency: 'USD'
    };
  }

  /**
   * Envoyer un OTP
   */
  async sendOTP(to, code, expiryMinutes = 5) {
    const message = `Votre code de vérification Mossombi est: ${code}. Valide pendant ${expiryMinutes} minutes. Ne partagez pas ce code.`;
    
    return await this.sendSMS({
      to,
      message,
      type: 'otp'
    });
  }

  /**
   * Envoyer une notification de transaction
   */
  async sendTransactionNotification(to, transactionDetails) {
    const { type, amount, currency, reference } = transactionDetails;
    
    let message;
    switch (type) {
      case 'credit':
        message = `Mossombi: Crédit de ${amount} ${currency} reçu. Réf: ${reference}`;
        break;
      case 'debit':
        message = `Mossombi: Débit de ${amount} ${currency} effectué. Réf: ${reference}`;
        break;
      case 'transfer':
        message = `Mossombi: Transfert de ${amount} ${currency} effectué. Réf: ${reference}`;
        break;
      default:
        message = `Mossombi: Transaction de ${amount} ${currency}. Réf: ${reference}`;
    }

    return await this.sendSMS({
      to,
      message,
      type: 'transactional'
    });
  }

  /**
   * Tester la connexion SMS
   */
  async testConnection() {
    try {
      if (!this.isConfigured) {
        // Test en mode simulation
        const result = await this.simulateSMS(
          '+242000000000',
          'Test de connectivité - Service SMS Mossombi',
          'transactional'
        );
        return result.success;
      }

      // Test réel selon le provider
      switch (this.provider) {
        case 'local-gsm':
          // Tester le serveur SMS local
          const response = await fetch(`${this.localSmsUrl}/status`, {
            headers: { 'X-API-Key': this.localApiKey }
          });
          const status = await response.json();
          return status.success && status.data.modem_connected;
          
        case 'twilio':
          // Vérifier les credentials Twilio
          const account = await this.client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
          return account.status === 'active';
          
        default:
          return false;
      }
    } catch (error) {
      logger.error('Erreur test connexion SMS', { error: error.message });
      return false;
    }
  }

  /**
   * Obtenir le statut du service
   */
  getStatus() {
    return {
      configured: this.isConfigured,
      provider: this.provider,
      ready: !!this.client || process.env.NODE_ENV === 'development',
      simulation_mode: !this.isConfigured
    };
  }

  /**
   * Obtenir les statistiques d'envoi
   */
  async getStats(dateFrom, dateTo) {
    try {
      if (!this.isConfigured || this.provider !== 'twilio') {
        return {
          sent: 0,
          delivered: 0,
          failed: 0,
          cost: '0.00',
          currency: 'USD'
        };
      }

      // Récupérer les messages Twilio
      const messages = await this.client.messages.list({
        dateSentAfter: dateFrom,
        dateSentBefore: dateTo,
        limit: 1000
      });

      const stats = messages.reduce((acc, msg) => {
        acc.sent++;
        if (msg.status === 'delivered') acc.delivered++;
        if (msg.status === 'failed' || msg.status === 'undelivered') acc.failed++;
        acc.cost += parseFloat(msg.price || 0);
        return acc;
      }, { sent: 0, delivered: 0, failed: 0, cost: 0 });

      return {
        ...stats,
        cost: stats.cost.toFixed(4),
        currency: 'USD'
      };
    } catch (error) {
      logger.error('Erreur récupération stats SMS', { error: error.message });
      return {
        sent: 0,
        delivered: 0,
        failed: 0,
        cost: '0.00',
        currency: 'USD'
      };
    }
  }
}

// Instance singleton
export const smsService = new SMSService();

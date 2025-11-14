/**
 * SERVICE D'AUTHENTIFICATION À DEUX FACTEURS
 * Gestion des codes 2FA par Authenticator (TOTP) et WhatsApp
 */

import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

class TwoFactorService {
  constructor() {
    this.codeExpiration = 5 * 60 * 1000; // 5 minutes
    this.maxAttempts = 3;
  }

  /**
   * Générer un code 2FA à 6 chiffres (pour WhatsApp)
   */
  generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Générer un secret TOTP pour Authenticator
   */
  generateTOTPSecret(userEmail, appName = 'Mossombi') {
    const secret = speakeasy.generateSecret({
      name: userEmail,
      issuer: appName,
      length: 32
    });

    return {
      secret: secret.base32,
      otpauth_url: secret.otpauth_url,
      manual_entry_key: secret.base32
    };
  }

  /**
   * Générer un QR Code pour l'Authenticator
   */
  async generateQRCode(otpauth_url) {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(otpauth_url);
      return qrCodeDataURL;
    } catch (error) {
      logger.error('Erreur génération QR Code', { error });
      throw new Error('Erreur génération QR Code');
    }
  }

  /**
   * Vérifier un code TOTP depuis Authenticator
   */
  verifyTOTPCode(secret, token) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // Permet une tolérance de ±60 secondes
    });
  }

  /**
   * Générer des codes de récupération
   */
  generateBackupCodes(count = 8) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  /**
   * Stocker un code 2FA temporaire (pour WhatsApp uniquement)
   */
  async storeCode(userId, code, method = 'whatsapp') {
    const expiresAt = new Date(Date.now() + this.codeExpiration);
    
    try {
      // Supprimer les anciens codes
      await supabaseAdmin
        .from('two_factor_codes')
        .delete()
        .eq('user_id', userId)
        .eq('method', method);

      // Stocker le nouveau code
      const { error } = await supabaseAdmin
        .from('two_factor_codes')
        .insert({
          user_id: userId,
          code: code,
          method: method,
          expires_at: expiresAt.toISOString(),
          attempts: 0,
          created_at: new Date().toISOString()
        });

      if (error) {
        logger.error('Erreur stockage code 2FA', { userId, error });
        return false;
      }

      logger.info('Code 2FA stocké', { userId, method, expiresAt });
      return true;
    } catch (error) {
      logger.error('Erreur stockage code 2FA', { userId, error });
      return false;
    }
  }

  /**
   * Vérifier un code 2FA (WhatsApp ou Authenticator)
   */
  async verifyCode(userId, inputCode, method = 'whatsapp', totpSecret = null) {
    // Pour Authenticator, vérification directe avec TOTP
    if (method === 'authenticator' && totpSecret) {
      const isValid = this.verifyTOTPCode(totpSecret, inputCode);
      if (isValid) {
        logger.info('Code Authenticator vérifié avec succès', { userId, method });
        return { success: true };
      } else {
        logger.warn('Code Authenticator incorrect', { userId, method });
        return { success: false, error: 'Code incorrect' };
      }
    }

    // Pour WhatsApp, vérification via base de données
    try {
      // Récupérer le code stocké
      const { data: storedCode, error } = await supabaseAdmin
        .from('two_factor_codes')
        .select('*')
        .eq('user_id', userId)
        .eq('method', method)
        .eq('is_used', false)
        .single();

      if (error || !storedCode) {
        logger.warn('Code 2FA non trouvé', { userId, method });
        return { success: false, error: 'Code non trouvé ou expiré' };
      }

      // Vérifier l'expiration
      if (new Date() > new Date(storedCode.expires_at)) {
        await this.invalidateCode(storedCode.id);
        logger.warn('Code 2FA expiré', { userId, method });
        return { success: false, error: 'Code expiré' };
      }

      // Vérifier le nombre de tentatives
      if (storedCode.attempts >= this.maxAttempts) {
        await this.invalidateCode(storedCode.id);
        logger.warn('Trop de tentatives 2FA', { userId, method });
        return { success: false, error: 'Trop de tentatives' };
      }

      // Vérifier le code
      if (storedCode.code !== inputCode) {
        // Incrémenter les tentatives
        await supabaseAdmin
          .from('two_factor_codes')
          .update({ attempts: storedCode.attempts + 1 })
          .eq('id', storedCode.id);

        logger.warn('Code 2FA incorrect', { userId, method, attempts: storedCode.attempts + 1 });
        return { success: false, error: 'Code incorrect' };
      }

      // Code valide - marquer comme utilisé
      await supabaseAdmin
        .from('two_factor_codes')
        .update({ 
          is_used: true,
          used_at: new Date().toISOString()
        })
        .eq('id', storedCode.id);

      logger.info('Code 2FA vérifié avec succès', { userId, method });
      return { success: true };

    } catch (error) {
      logger.error('Erreur vérification code 2FA', { userId, error });
      return { success: false, error: 'Erreur de vérification' };
    }
  }

  /**
   * Invalider un code 2FA
   */
  async invalidateCode(codeId) {
    await supabaseAdmin
      .from('two_factor_codes')
      .update({ 
        is_used: true,
        invalidated_at: new Date().toISOString()
      })
      .eq('id', codeId);
  }

  /**
   * Envoyer un code par WhatsApp
   */
  async sendWhatsApp(phoneNumber, code) {
    try {
      // TODO: Intégrer avec l'API WhatsApp Business
      const message = `🔐 *Code de vérification Mossombi*\n\nVotre code : *${code}*\n\n⏰ Valide pendant 5 minutes\n🔒 Ne partagez jamais ce code`;
      
      logger.info('Code WhatsApp envoyé (simulation)', { 
        phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'),
        code: code.replace(/\d/g, '*')
      });

      // Simulation d'envoi réussi
      return { success: true, message: 'Message WhatsApp envoyé avec succès' };
    } catch (error) {
      logger.error('Erreur envoi WhatsApp', { phoneNumber, error });
      return { success: false, error: 'Erreur envoi WhatsApp' };
    }
  }

  /**
   * Nettoyer les codes expirés
   */
  async cleanupExpiredCodes() {
    try {
      const { error } = await supabaseAdmin
        .from('two_factor_codes')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        logger.error('Erreur nettoyage codes expirés', { error });
      } else {
        logger.info('Codes 2FA expirés nettoyés');
      }
    } catch (error) {
      logger.error('Erreur nettoyage codes expirés', { error });
    }
  }
}

export default new TwoFactorService();

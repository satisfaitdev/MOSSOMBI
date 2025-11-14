/**
 * Service de sécurité pour l'authentification
 * Gestion des mots de passe et tokens JWT
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Clé secrète pour JWT (à mettre dans .env en production)
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

class SecurityService {
  /**
   * Hasher un mot de passe
   * @param {string} password - Mot de passe en clair
   * @returns {Promise<string>} - Mot de passe hashé
   */
  static async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Vérifier un mot de passe
   * @param {string} password - Mot de passe en clair
   * @param {string} hashedPassword - Mot de passe hashé
   * @returns {Promise<boolean>} - True si le mot de passe correspond
   */
  static async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * Générer un token JWT d'accès
   * @param {object} payload - Données à inclure dans le token
   * @returns {string} - Token JWT
   */
  static generateAccessToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'mossombi-api',
      audience: 'mossombi-app'
    });
  }

  /**
   * Générer un token de rafraîchissement
   * @param {object} payload - Données à inclure dans le token
   * @returns {string} - Refresh token
   */
  static generateRefreshToken(payload) {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: 'mossombi-api',
      audience: 'mossombi-app'
    });
  }

  /**
   * Vérifier et décoder un token JWT
   * @param {string} token - Token à vérifier
   * @returns {object} - Payload décodé
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'mossombi-api',
        audience: 'mossombi-app'
      });
    } catch (error) {
      throw new Error(`Token invalide: ${error.message}`);
    }
  }

  /**
   * Générer un code OTP sécurisé
   * @param {number} length - Longueur du code (défaut: 6)
   * @returns {string} - Code OTP
   */
  static generateOTP(length = 6) {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  /**
   * Générer un token de réinitialisation de mot de passe
   * @returns {string} - Token sécurisé
   */
  static generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Calculer l'expiration d'un token
   * @param {number} minutes - Durée en minutes
   * @returns {Date} - Date d'expiration
   */
  static getExpirationDate(minutes = 10) {
    return new Date(Date.now() + minutes * 60 * 1000);
  }
}

export default SecurityService;

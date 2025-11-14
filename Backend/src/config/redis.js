/**
 * CONFIGURATION REDIS
 * Cache et stockage haute performance pour la production
 */

import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

class RedisManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.retryAttempts = 0;
    this.maxRetries = 5;
  }

  /**
   * Initialiser la connexion Redis
   */
  async connect() {
    try {
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        family: 4,
        keyPrefix: 'mossombi:',
      };

      this.client = new Redis(redisConfig);

      // Événements de connexion
      this.client.on('connect', () => {
        logger.info('Redis connecté avec succès');
        this.isConnected = true;
        this.retryAttempts = 0;
      });

      this.client.on('error', (error) => {
        logger.error('Erreur Redis:', { error: error.message });
        this.isConnected = false;
      });

      this.client.on('close', () => {
        logger.warn('Connexion Redis fermée');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        this.retryAttempts++;
        logger.info(`Reconnexion Redis (tentative ${this.retryAttempts})`);
      });

      // Tenter la connexion
      await this.client.connect();
      
      // Test de la connexion
      await this.client.ping();
      
      logger.info('Redis initialisé et testé avec succès');
      
    } catch (error) {
      logger.error('Erreur initialisation Redis:', { error: error.message });
      
      if (this.retryAttempts < this.maxRetries) {
        setTimeout(() => this.connect(), 5000);
      } else {
        logger.error('Impossible de se connecter à Redis après plusieurs tentatives');
      }
    }
  }

  /**
   * Obtenir une valeur
   */
  async get(key) {
    if (!this.isConnected) return null;
    
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Erreur Redis GET:', { key, error: error.message });
      return null;
    }
  }

  /**
   * Définir une valeur avec expiration
   */
  async set(key, value, ttlSeconds = 3600) {
    if (!this.isConnected) return false;
    
    try {
      const serialized = JSON.stringify(value);
      await this.client.setex(key, ttlSeconds, serialized);
      return true;
    } catch (error) {
      logger.error('Erreur Redis SET:', { key, error: error.message });
      return false;
    }
  }

  /**
   * Incrémenter une valeur
   */
  async incr(key, ttlSeconds = 3600) {
    if (!this.isConnected) return null;
    
    try {
      const value = await this.client.incr(key);
      
      // Définir l'expiration seulement si c'est la première fois
      if (value === 1) {
        await this.client.expire(key, ttlSeconds);
      }
      
      return value;
    } catch (error) {
      logger.error('Erreur Redis INCR:', { key, error: error.message });
      return null;
    }
  }

  /**
   * Supprimer une clé
   */
  async del(key) {
    if (!this.isConnected) return false;
    
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Erreur Redis DEL:', { key, error: error.message });
      return false;
    }
  }

  /**
   * Obtenir toutes les clés correspondant à un pattern
   */
  async keys(pattern) {
    if (!this.isConnected) return [];
    
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error('Erreur Redis KEYS:', { pattern, error: error.message });
      return [];
    }
  }

  /**
   * Vérifier l'existence d'une clé
   */
  async exists(key) {
    if (!this.isConnected) return false;
    
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Erreur Redis EXISTS:', { key, error: error.message });
      return false;
    }
  }

  /**
   * Obtenir le TTL d'une clé
   */
  async ttl(key) {
    if (!this.isConnected) return -1;
    
    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error('Erreur Redis TTL:', { key, error: error.message });
      return -1;
    }
  }

  /**
   * Fermer la connexion
   */
  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Connexion Redis fermée proprement');
    }
  }

  /**
   * Obtenir les statistiques Redis
   */
  async getStats() {
    if (!this.isConnected) return null;
    
    try {
      const info = await this.client.info('memory');
      const keyspace = await this.client.info('keyspace');
      
      return {
        connected: this.isConnected,
        memory: this.parseRedisInfo(info),
        keyspace: this.parseRedisInfo(keyspace)
      };
    } catch (error) {
      logger.error('Erreur stats Redis:', { error: error.message });
      return null;
    }
  }

  /**
   * Parser les informations Redis
   */
  parseRedisInfo(info) {
    const result = {};
    const lines = info.split('\r\n');
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = isNaN(value) ? value : Number(value);
      }
    }
    
    return result;
  }
}

// Instance singleton
export const redisManager = new RedisManager();

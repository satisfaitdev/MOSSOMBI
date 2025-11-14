/**
 * MOSSOMBI BACKEND API - SERVEUR PRINCIPAL
 * Point d'entrée de l'API backend pour l'application Mossombi
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Configuration des variables d'environnement
dotenv.config();

// Import des routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import notificationRoutes from './routes/notifications.js';
import sessionRoutes from './routes/sessions.js';
import whatsappRoutes from './routes/whatsapp.js';
import { auditMiddleware } from './middleware/auditMiddleware.js';
import { redisManager } from './config/redis.js';
import { auditLogService } from './services/auditLogService.js';
import { monitoringService } from './services/monitoringService.js';
import { alertService } from './services/alertService.js';
import profileRoutes from './routes/profile.js';
import walletRoutes from './routes/wallet.js';
import monitoringRoutes from './routes/monitoring.js';
import privacyRoutes from './routes/privacy.js';

// Import des middlewares
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

// Initialisation de l'application Express
const app = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || 'v1';

// =====================================================
// 🛡️ MIDDLEWARES DE SÉCURITÉ
// =====================================================

// Helmet pour la sécurité des headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS pour les requêtes cross-origin
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:8081'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limite par IP
  message: {
    error: 'Trop de requêtes depuis cette IP, réessayez plus tard.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(`/api/${API_VERSION}`, limiter);

// =====================================================
// 📊 MIDDLEWARE D'AUDIT GLOBAL
// =====================================================
app.use(auditMiddleware);

// =====================================================
// 🏥 ENDPOINT DE SANTÉ BASIQUE
// =====================================================
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// =====================================================
// 🔧 MIDDLEWARES GÉNÉRAUX
// =====================================================

// Compression des réponses
app.use(compression());

// Logging des requêtes HTTP
app.use(morgan('combined', {
  stream: { write: message => logger.info(message.trim()) }
}));

// Parsing du body JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 📊 MIDDLEWARE D'AUDIT GLOBAL
app.use(auditMiddleware);

// =====================================================
// 📊 ROUTE DE SANTÉ (DOUBLON SUPPRIMÉ)
// =====================================================
// L'endpoint /health est déjà défini plus haut

// =====================================================
// 🛣️ ROUTES PRINCIPALES
// =====================================================

// Routes d'authentification
app.use(`/api/${API_VERSION}/auth`, authRoutes);

// Routes utilisateurs
app.use(`/api/${API_VERSION}/users`, userRoutes);

// Routes notifications
app.use(`/api/${API_VERSION}/notifications`, notificationRoutes);

// Routes sessions
app.use(`/api/${API_VERSION}/sessions`, sessionRoutes);

// Routes WhatsApp
app.use(`/api/${API_VERSION}/whatsapp`, whatsappRoutes);

// Routes profil
app.use(`/api/${API_VERSION}/profile`, profileRoutes);
app.use(`/api/${API_VERSION}/profile/privacy`, privacyRoutes);
app.use(`/api/${API_VERSION}/wallet`, walletRoutes);
app.use(`/api/${API_VERSION}/monitoring`, monitoringRoutes);

// =====================================================
// 🚫 GESTION DES ERREURS
// =====================================================

// Route 404 pour les endpoints non trouvés
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint non trouvé',
    message: `La route ${req.method} ${req.originalUrl} n'existe pas`,
    code: 'ENDPOINT_NOT_FOUND'
  });
});

// Middleware de gestion d'erreurs global
app.use(errorHandler);

// =====================================================
// 🚀 DÉMARRAGE DU SERVEUR
// =====================================================
// =====================================================
// 🚀 INITIALISATION DES SERVICES
// =====================================================

async function initializeServices() {
  try {
    logger.info('🔧 Initialisation des services...');
    
    // 1. Initialiser Redis
    if (process.env.REDIS_HOST) {
      logger.info('🔴 Connexion à Redis...');
      await redisManager.connect();
    } else {
      logger.warn('⚠️  Redis non configuré, utilisation du stockage mémoire');
    }
    
    // 2. Initialiser le service d'audit unifié
    logger.info('🗄️  Initialisation service audit...');
    await auditLogService.initialize();
    
    // 3. Tester les alertes si configurées
    if (process.env.EMAIL_ALERTS_ENABLED === 'true' || process.env.SMS_ALERTS_ENABLED === 'true') {
      logger.info('📧 Services d\'alerte configurés');
    }
    
    logger.info('✅ Tous les services initialisés avec succès');
    
  } catch (error) {
    logger.error('❌ Erreur initialisation services:', { error: error.message });
    // Ne pas arrêter le serveur, continuer avec les services disponibles
  }
}

// Démarrage du serveur
app.listen(PORT, async () => {
  logger.info(`🚀 Serveur Mossombi démarré sur le port ${PORT}`);
  logger.info(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📅 Démarré le: ${new Date().toLocaleString('fr-FR')}`);
  logger.info(`❤️  Santé: http://localhost:${PORT}/health`);
  
  // Initialiser les services
  await initializeServices();
  
  // Log des routes disponibles
  logger.info('📋 Routes disponibles:');
  logger.info('   - POST /api/v1/auth/register - Inscription utilisateur');
  logger.info('   - GET  /api/v1/auth/check-phone - Vérifier existence numéro');
  logger.info('   - POST /api/v1/auth/send-otp - Envoyer code OTP');
  logger.info('   - POST /api/v1/auth/verify-otp - Vérifier code OTP');
  logger.info('   - POST /api/v1/auth/admin/unblock-user - Débloquer utilisateur (admin)');
  logger.info('   - GET  /api/v1/auth/admin/security-stats - Statistiques sécurité (admin)');
  logger.info('   - GET  /api/v1/auth/admin/audit-report - Rapport d\'audit (admin)');
  logger.info('   - GET  /api/v1/users/profile');
  logger.info('   - PUT  /api/v1/users/profile');
  logger.info('   - GET  /api/v1/notifications');
  logger.info('   - GET  /api/v1/whatsapp/session');
  logger.info('   - GET  /api/v1/monitoring/health - Santé système détaillée');
  logger.info('   - GET  /api/v1/monitoring/metrics - Métriques temps réel (admin)');
  logger.info('   - GET  /api/v1/monitoring/search-audit - Recherche audit (admin)');
  
  logger.info('🛡️  Système de sécurité: ACTIF');
  logger.info('📊 Monitoring temps réel: ACTIF');
  logger.info('🗄️  Audit base de données: ACTIF');
  logger.info('🔴 Redis rate limiting: ' + (redisManager.isConnected ? 'ACTIF' : 'FALLBACK MÉMOIRE'));
});

// Gestion gracieuse de l'arrêt
process.on('SIGTERM', () => {
  logger.info('SIGTERM reçu, arrêt gracieux du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT reçu, arrêt gracieux du serveur...');
  process.exit(0);
});

export default app;
